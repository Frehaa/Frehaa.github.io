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
    }
    addPointMass(point, mass) {

    }
    step(t) {
        assert(this.totalMass > 0, "This physics object should not be stepped with 0 mass.");

        this.position = this.position.add(this.velocity.scale(t).add(this.acceleration.scale(t*t/2)));
        this.velocity = this.velocity.add(this.acceleration.scale(t));
    }
    applyForce(force) {
        this.totalForce = this.totalForce.add(force);
        this.acceleration = this.totalForce.scale(1 / this.totalMass);
    }
}

// Extends the simple physics ball with rotation
class SimpleMassRotatingPhysicsBall extends SimpleMassNonRotatingPhysicsBall {
    constructor(center, radius) {
        super(center, radius);

        this.orientation = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
    }

    applyForce(force) {
        super.applyForce(force);
    }
}

// A physics ball which does not handle rotation or non-trivial point masses.
class SimpleMassNonRotatingPhysicsBall {
    constructor(center, radius) {
        this.position = center;
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.totalForce = new Vec2(0, 0);
        this.radius = radius;
        this.totalMass = 1;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);

        ctx.fillStyle = 'pink'
        ctx.fill();
    }

    // New position is equal to old position + t * old velocity + t^2 * acceleration / 2
    // New Velocity is equal to old velocity + acceleration * t
    step(deltaTime) {
        this.position = this.position.add(this.velocity.scale(deltaTime).add(this.acceleration.scale(deltaTime*deltaTime/2)));
        this.velocity = this.velocity.add(this.acceleration.scale(deltaTime));
    }

    // We call this "apply" force, but it also works to remove force by simply inverting the previously applied force
    applyForce(force) {
        this.totalForce = this.totalForce.add(force);
        this.acceleration = this.totalForce; // We assume the mass is 1 so the force is translated directly to acceleration
    }
}