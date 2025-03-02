class PhysicsBall {
    constructor(center/*: Vec2 */, radius/*: int*/, ) {
        this.position = center;
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.totalForce = new Vec2(0, 0);
        this.radius = radius;
        this.orientation = 0;
        this.totalTorque = 0; //new Vec2(0, 0);
        this.angularAcceleration = 0;
        this.angularVelocity = 0;

        // Have the ball consists of points of mass 
        this.pointMasses = []; 
        this.pointMassesMass = [];
        this.pointMassesCurrentForce = [];

        let pointMass = new Vec2(0, 1).scale(radius).add(this.position);
        this.pointMasses.push(pointMass);
        this.pointMassesMass.push(16);
        this.pointMassesCurrentForce.push(new Vec2(0, 0));
        
        pointMass = new Vec2(1, 0).scale(radius).add(this.position);
        this.pointMasses.push(pointMass);
        this.pointMassesMass.push(4);
        this.pointMassesCurrentForce.push(new Vec2(0, 0));
 
        pointMass = new Vec2(-1, 0).scale(radius).add(this.position);
        this.pointMasses.push(pointMass);
        this.pointMassesMass.push(4);
        this.pointMassesCurrentForce.push(new Vec2(0, 0));
 
        pointMass = new Vec2(0, -1).scale(radius).add(this.position);
        this.pointMasses.push(pointMass);
        this.pointMassesMass.push(4);
        this.pointMassesCurrentForce.push(new Vec2(0, 0));
 
        const {centerOfMass, totalMass} = this.calculateCenterOfMass(this.pointMasses, this.pointMassesMass);
        this.centerOfMass = centerOfMass;
        this.totalMass = totalMass;
        this.inertia = this.calculateInertia(this.centerOfMass, this.pointMasses, this.pointMassesMass);
    }
    calculateCenterOfMass(points, masses) {
        let totalMass = masses.reduce((s, m) => s + m, 0);
        let centerOfMass = new Vec2(0, 0);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const mass = masses[i];
            centerOfMass = centerOfMass.add(point.scale(mass/totalMass));
        }
        return {centerOfMass, totalMass};
    }
    calculateInertia(A, points, masses) {
        let result = 0;
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const mass = masses[i];
            result += mass * A.subtract(point).length() ** 2;
        }
        return result;
    }

    draw(ctx) {
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'black'

        for (let i = 0; i < this.pointMasses.length; i++) {
            const pointMass = this.pointMasses[i];
            const mass = this.pointMassesMass[i];
            let radius = Math.log(mass) + 1;
            ctx.beginPath();
            ctx.arc(pointMass.x, pointMass.y, radius, 0, 2 * Math.PI);
            ctx.fill();            
        }

        ctx.fillStyle = 'red';
        ctx.beginPath();
        let p = this.centerOfMass;
        ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        ctx.fill();


        // ctx.beginPath();
        // ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        // ctx.stroke();


        // ctx.beginPath();
        // ctx.moveTo(0, 0);
        // ctx.lineTo(this.position.x, this.position.y);
        // ctx.stroke();


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
    step(deltaTime) {
        // FIND ALL THE VELOCITIES
        const veloctiyCM = this.velocity;

        let perpScaledVector = this.position.subtract(this.centerOfMass).perp_scale(this.angularVelocity);
        let velocityPosition = veloctiyCM.add(perpScaledVector);

        this.newCenterOfMass = this.centerOfMass.add(veloctiyCM.scale(deltaTime));
        this.newPosition = this.position.add(velocityPosition.scale(deltaTime));

        for (let i = 0; i < this.pointMasses.length; i++) {
            const pointMass = this.pointMasses[i];
            perpScaledVector = pointMass.subtract(this.centerOfMass).perp_scale(this.angularVelocity);
            // l(pointMass.toString(), perpScaledVector.toString(), object.angularVelocity)
            this.pointMasses[i] = pointMass.add(veloctiyCM.add(perpScaledVector).scale(deltaTime));

        }
        this.newOrientation = this.orientation + this.angularVelocity * deltaTime;
    }
    applyForce(force/*: Vec2 */, pointMass) { 
        // pointMass.currentForce = pointMass.currentForce.add(force);
        l(force, pointMass)
        this.pointMassesCurrentForce[pointMass] = this.pointMassesCurrentForce[pointMass].add(force); 
        this.totalForce = this.totalForce.add(force);
        this.acceleration = this.totalForce.scale(1/this.totalMass);
    }
}

class MultiPointMassNonRotatingPhysicsBall {
    constructor(center, radius) {
        this.position = center;
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.totalForce = new Vec2(0, 0);
        this.radius = radius;
        this.totalMass = 0; 
        this.pointMasses = []; // List of radian, normalizedDistance, and mass triples. This is in order to add point masses relative to the center.
        this.centerOfMass = this.position;
        this.conditionalForce = [];
    }
    // Define some point mass a certain radianse and normalized distance from the center
    // E.g. 0, 1 is all the way to the right, Pi, 0.5 is half way to the left, 0, 0 is the center
    addPointMass(radians, normalizedDistance, mass) {
        assert(0 <= normalizedDistance && normalizedDistance <= 1, 'The normalized instance should be between in the range [0, 1] (both inclusive)');
        const distance = this.radius * normalizedDistance;
        this.pointMasses.push([radians, distance, mass]);
        this.totalMass += mass; 
        this.calculateCenterOfMass(); // TODO: This seems like a waste of computation every step, but right now it also seems like a waste to think of a smarter way

        l(this.totalMass, this.centerOfMass);
    }
    calculateCenterOfMass() {
        let centerOfMass = new Vec2(0, 0);
        for (const [radians, distance, mass] of this.pointMasses) {
            const relative = new Vec2(Math.cos(radians), -Math.sin(radians)).scale(distance); // TODO?: Figure out whether to inverse sin or not since y is inversed in the canvas coordinate system
            const point = this.position.add(relative)
            centerOfMass = centerOfMass.add(point.scale(mass/this.totalMass));
        }
        this.centerOfMass = centerOfMass;
        this.centerOfMassRelative = this.centerOfMass.subtract(this.position);
    }
    // step(t) {
    //     assert(this.totalMass > 0, "This physics object should not be stepped with 0 mass.");
    //     this.position = this.position.add(this.velocity.scale(t).add(this.acceleration.scale(t*t/2))); // We apply the change to the position directly instead of the center of mass. I am not sure which is better, but we could also move the center of mass and change position based on their difference. I do not think any of this matters at this point.
    //     this.centerOfMass = this.position.add(this.centerOfMassRelative);
    //     this.velocity = this.velocity.add(this.acceleration.scale(t));
    // }
    step(deltaTime) {
        this.oldPosition = this.position;

        const maxTimeStep = 0.5;
        while (deltaTime > 0) {
            // Compute acceleration 
            this.acceleration = this.totalForce.scale(1 / this.totalMass); // We assume the mass is 1 so the force is translated directly to acceleration
            for (const f of this.conditionalForce) {
                this.acceleration = this.acceleration.add(f(this).scale(1 / this.totalMass)); // We assume the mass is 1 so the force is translated directly to acceleration
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
            this.position = this.position.add(this.velocity.scale(h)) //.add(this.acceleration.scale(h*h/2)));
            this.centerOfMass = this.position.add(this.centerOfMassRelative);
            this.velocity = this.velocity.add(this.acceleration.scale(h));
        }
    }
    applyForce(force) {
        assert(this.totalMass > 0, "This physics object has 0 mass .");
        this.totalForce = this.totalForce.add(force);
        // this.acceleration = this.totalForce.scale(1 / this.totalMass);
    }
    draw(ctx) {
        ctx.beginPath();
        const x = Math.abs(this.position.x) % 1920;
        const y = Math.abs(this.position.y) % 1080;
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.stroke();

        ctx.beginPath();
        const cmx = Math.abs(this.centerOfMass.x) % 1920;
        const cmy = Math.abs(this.centerOfMass.y) % 1080;
        ctx.arc(cmx, cmy, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red'
        ctx.fill();
    }

    addConditionalForce(forceFunction) {
        this.conditionalForce.push(forceFunction);
    }

}

// A physics ball with center of mass in center and simple inertia for cylinder
class SimpleMassRotatingPhysicsBall { 
    constructor(center, radius) {
        this.position = center;
        this.totalMass = 1;
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.totalForce = new Vec2(0, 0);
        this.orientation = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.radius = radius;
        this.inertia = 1/2 * this.totalMass * this.radius ** 2;
        this.totalTorque = 0;
        this.conditionalForce = [];
        this.afterStepCallbacks = [];
    }

    draw(ctx) {
        ctx.beginPath();
        const x = this.position.x % 1920;
        const y = this.position.y % 1080;
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.stroke();

        // Draw the orientation
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.radius * Math.cos(this.orientation), y - this.radius * Math.sin(this.orientation));
        ctx.stroke();
    }

    step(deltaTime) {
        this.oldPosition = this.position;
        this.oldOrientation = this.orientation;

        const maxTimeStep = 0.5;
        // numerically integrate the linear acceleration and angular acceleration to update the position, linear velocity, orientation, and angular velocity
        while (deltaTime > 0) {
            // Compute acceleration 
            this.acceleration = this.totalForce.scale(1 / this.totalMass).add(this.velocity.scale(-0.001)); // Damping
            this.angularAcceleration = this.totalTorque / this.inertia - this.angularVelocity * 0.001; // Damping

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
            this.position = this.position.add(this.velocity.scale(h)) //.add(this.acceleration.scale(h*h/2)));
            this.velocity = this.velocity.add(this.acceleration.scale(h));

            this.orientation += this.angularVelocity * h; 
            this.angularVelocity += this.angularAcceleration * h;
        }

        for (const callback of this.afterStepCallbacks) {
            callback()
        }
        this.afterStepCallbacks = [];

    }

    applyForce(force) {
        this.totalForce = this.totalForce.add(force);
        this.acceleration = this.totalForce.scale(1 / this.totalMass);
    }

    applyForceAtPoint(force, point) {
        this.totalForce = this.totalForce.add(force);
        const relative = point.subtract(this.position);
        this.totalTorque += relative.perp_dot(force);
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

class MultiPointMassRotatingPhysicsBall extends MultiPointMassNonRotatingPhysicsBall {
    constructor(center, radius) {
        super(center, radius);
        this.orientation = 0
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.inertia = 0;
        this.totalTorque = 0;
        this.pointMasses = [];
    }

    draw(ctx) {

    }
    
    setAxisOfRotation(axis) {
        this.axisOfRotation = axis;
        this.inertia = this.calculateInertia();
    }

    step(deltaTime) {
        this.oldPosition = this.position;
        this.oldOrientation = this.orientation;

        const maxTimeStep = 0.5;
        while (deltaTime > 0) {
            // Compute acceleration 
            this.acceleration = this.totalForce.scale(1 / this.totalMass); // We assume the mass is 1 so the
            this.angularAcceleration = this.totalTorque / this.inertia;
            for (const f of this.conditionalForce) {
                this.acceleration = this.acceleration.add(f(this).scale(1 / this.totalMass)); // We assume the mass is 1 so the
                this.angularAcceleration += f(this).scale(1 / this.inertia);   
            } 

            this.position = this.position.add(this.velocity.scale(h)) //.add(this.acceleration.scale(h*h/2)));
            this.centerOfMass = this.position.add(this.centerOfMassRelative);
            this.velocity = this.velocity.add(this.acceleration.scale(h));


        }
    }

    // calculate inertia
    calculateInertia() {
        let result = 0;
        for (const [radians, distance, mass] of this.pointMasses) {
            const relative = new Vec2(Math.cos(radians), -Math.sin(radians)).scale(distance); // TODO?: Figure out whether to inverse sin or not since y is inversed in the canvas coordinate system
            const point = this.position.add(relative)
            result += mass * point.subtract(this.axisOfRotation).length() ** 2;
        }
        return result;
    }

    
}


// A physics ball which does not handle rotation or non-trivial point masses.
class SimpleMassNonRotatingPhysicsBall {
    constructor(center, radius) {
        this.position = center;
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.totalForce = new Vec2(0, 0);
        this.conditionalForce = [];
        this.radius = radius;
        this.totalMass = 1;
    }

    draw(ctx) {
        ctx.beginPath();
        const x = this.position.x % 1920;
        const y = this.position.y % 1080;
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);

        ctx.fillStyle = 'pink'
        ctx.fill();
    }

    // New position is equal to old position + t * old velocity + t^2 * acceleration / 2
    // New Velocity is equal to old velocity + acceleration * t
    step(deltaTime) {
        this.oldPosition = this.position;

        const maxTimeStep = 0.5;
        while (deltaTime > 0) {
            // Compute acceleration 
            this.acceleration = this.totalForce; // We assume the mass is 1 so the force is translated directly to acceleration
            for (const f of this.conditionalForce) {
                this.acceleration = this.acceleration.add(f(this)); // We assume the mass is 1 so the force is translated directly to acceleration
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
            this.position = this.position.add(this.velocity.scale(h)) //.add(this.acceleration.scale(h*h/2)));
            this.velocity = this.velocity.add(this.acceleration.scale(h));
        }
    }

    revertPosition() {
        this.position = this.oldPosition;
    }

    // We call this "apply" force, but it also works to remove force by simply inverting the previously applied force
    applyForce(force) {
        this.totalForce = this.totalForce.add(force);
    }

    addConditionalForce(forceFunction) {
        this.conditionalForce.push(forceFunction);
    }
}
