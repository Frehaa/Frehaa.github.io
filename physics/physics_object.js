class PhysicsObject2D {
    constructor() {
        this.position = new Vec2(0, 0);
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.totalForce = new Vec2(0, 0);
        this.orientation = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.totalTorque = 0;

        // Total mass and inertia to be calculated in subclasses

        this.conditionalForce = []; // Array of functions that return a Vec2 force based on the current state of the object
        this.afterStepCallbacks = []; // Array of functions to be called after the step is completed
    }
    step(deltaTime) {
        this.oldPosition = this.position;

        const maxTimeStep = 0.5;
        while (deltaTime > 0) {
            // Compute acceleration 
            this.acceleration = this.totalForce.scale(1 / this.totalMass); // We assume the mass is 1 so the force is translated directly to acceleration
            for (const f of this.conditionalForce) {
                this.acceleration = this.acceleration.add(f(this).scale(1 / this.totalMass)); 
            }

            // Compute the step
            let h = 0;
            if (deltaTime > maxTimeStep) {
                h = maxTimeStep;
                deltaTime -= maxTimeStep
            } else {
                h = deltaTime;
                deltaTime = 0;
            }

            // Update position and velocity
            this.position = this.position.add(this.velocity.scale(h));
            this.centerOfMass = this.position.add(this.centerOfMassRelative);
            this.velocity = this.velocity.add(this.acceleration.scale(h));
        }
        this.afterStepCallbacks.forEach(callback => callback());
        this.afterStepCallbacks = []; // Clear the callbacks after they are executed
    }

    // Applying force to the object in a way which does not produce any torque
    // This can be considered as a force applied at the center of mass
    applyForce(force) {
        this.totalForce = this.totalForce.add(force);
        this.acceleration = this.totalForce.scale(1 / this.totalMass);
    }
    // How does this work when we apply force over a period of time but the point does not move? 
    applyForceAtPoint(force, point) {
        this.totalForce = this.totalForce.add(force);
        const relative = point.subtract(this.position);
        this.totalTorque += relative.perp_dot(force);
        l(relative)
    }
    applySingleStepForceAtPoint(force, point) {
        this.totalForce = this.totalForce.add(force);
        const relative = point.subtract(this.position);
        const torque = relative.perp_dot(force);

        this.totalTorque += -torque
        this.afterStepCallbacks.push(() => {
            this.totalForce = this.totalForce.subtract(force);
            this.totalTorque += torque
        });
    }
}

class PhysicsBall2D extends PhysicsObject2D {
    constructor(center/*: Vec2 */, radius/*: int*/, ) {
        super();
        this.position = center;
        this.centerOfMassRelative = new Vec2(0, 0); // Center of mass is at the center of the ball
        this.centerOfMass = this.position;
        this.radius = radius;
        this.totalMass = 1;
        this.inertia = 1/2 * this.totalMass * this.radius ** 2; // Inertia for a solid sphere. 
    }
    draw(ctx) {
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'black'

        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y)
        ctx.arc(this.position.x, this.position.y, this.radius, this.orientation, this.orientation + 1.5 * Math.PI);
        ctx.lineTo(this.position.x, this.position.y)
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'red'
        ctx.moveTo(this.position.x, this.position.y)
        ctx.arc(this.position.x, this.position.y, this.radius, this.orientation + 1.5 * Math.PI, this.orientation + 2 * Math.PI);
        ctx.lineTo(this.position.x, this.position.y)
        ctx.stroke();
    }

}

class MultiPointMassRotatingPhysicsBall2D extends PhysicsObject2D {
    // Point Masses are relative to the center of the ball
    constructor(center, radius, pointMasses) {
        super();
        this.position = center;
        this.radius = radius;
        
        assert(this.pointMassesAreValid(pointMasses));

        let {centerOfMass, totalMass} = this.calculateCenterOfMass(pointMasses);
        this.centerOfMass = centerOfMass;
        this.totalMass = totalMass; 
        this.inertia = this.calculateInertiaOfPoint(this.centerOfMass, pointMasses); 
    }

    // TODO: Is it better to give the positions of point masses as relative or absolute positions? If relative, then checks and initial calculations are easier, but it may be harder to initially specify. 

    // Calculate the center of mass and total mass of the point masses
    // pointMasses is an array of objects with point and mass properties
    // The center of mass is relative to the center of the ball
    // The total mass is the sum of the masses of the point masses
    calculateCenterOfMass(pointMasses) {
        let totalMass = pointMasses.reduce((s, m) => s + m.mass, 0);
        let centerOfMass = new Vec2(0, 0);
        for (let i = 0; i < pointMasses.length; i++) {
            const point = pointMasses[i].point;
            const mass = pointMasses[i].mass;
            centerOfMass = centerOfMass.add(point.scale(mass/totalMass));
        }
        return {centerOfMass, totalMass};
    }
    calculateInertiaOfPoint(inertiaPoint, pointMasses) {
        let result = 0;
        for (let i = 0; i < pointMasses.length; i++) {
            const point = pointMasses[i].point; // We subtract the position of the ball to get the point relative to the center of the ball
            const mass = pointMasses[i].mass;
            result += mass * inertiaPoint.subtract(point).length() ** 2;
        }
        return result;
    }

    // Check that the point masses are inside the ball
    pointMassesAreValid(pointMasses) {
        for (const pointMass of pointMasses) {
            const point = pointMass.point;
            const distance = point.length();
            if (distance > this.radius) {
                console.error(`Point mass at ${point} is outside the ball at ${this.position} with radius ${this.radius}`);
                return false;
            }
        }
        return true;
    }
}

// TODO: Implement full physics objects and simplified physics objects
// A physics box with center of mass in center and simple inertia for rectangle
class SimpleMassRotatingBox2D extends PhysicsObject2D {
    constructor(center, width, height) {
        super();
        assert(width > 0 && height > 0, "Width and height must be positive numbers");
        this.position = center;
        
        this.width = width;
        this.height = height;

        this.totalMass = 1;
        this.inertia = 1/12 * this.totalMass * (this.width ** 2 + this.height ** 2);

        this.centerOfMassRelative = new Vec2(0, 0); // Center of mass is at the center of the ball
        this.centerOfMass = this.position;

    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.orientation);
        ctx.beginPath();
        ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.stroke();
        ctx.restore();
    }
    
    

}