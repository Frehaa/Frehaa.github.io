'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

const mouseState = {
    dragStartPosition: null, // 
    position: {x: 0, y: 0},
}

const drawSettings = {
    pointRadius: 5,
    canvas: null,
    canvasContex: null,
};

const worldState = {
    objects: []
};

function calculateInertia(A, points, masses) {
    let result = 0;
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const mass = masses[i];
        result += mass * A.subtract(point).length() ** 2;
    }
    return result;
}

function calculateCenterOfMass(points, masses) {
    let totalMass = masses.reduce((s, m) => s + m, 0);
    let centerOfMass = new Vec2(0, 0);
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const mass = masses[i];
        centerOfMass = centerOfMass.add(point.scale(mass/totalMass));
    }
    return {centerOfMass, totalMass};
}

// TODO: Can we derive from class in JavaScript
// Let pointmass be a vec2 which has a mass

// TODO: Create a physicsObjectBuilder which creates a physicsObject after being fed all the point masses.
// TODO: Better way to handle object creation than manually adding point masses?

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
 
        const {centerOfMass, totalMass} = calculateCenterOfMass(this.pointMasses, this.pointMassesMass);
        this.centerOfMass = centerOfMass;
        this.totalMass = totalMass;
        this.inertia = calculateInertia(this.centerOfMass, this.pointMasses, this.pointMassesMass);
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
    applyForce(force/*: Vec2 */, pointMass) { 
        // pointMass.currentForce = pointMass.currentForce.add(force);
        l(force, pointMass)
        this.pointMassesCurrentForce[pointMass] = this.pointMassesCurrentForce[pointMass].add(force); 
        this.totalForce = this.totalForce.add(force);
        this.acceleration = this.totalForce.scale(1/this.totalMass);
    }
}

// 1 dimensional
// If we have an acceleration a = 5
// then the velocity at time t given by v(t) = integral (5, dt) = 5t + C = 5t + v0
// and the position is given by r(t) = integral(5t + v0, dt) = 5/2t^2 + v0t + r0
// If the position at t = 0 is 3, and the velocity is 2, then v(t) = 5t + 1, and r(t) = 5/2t^2 + 2t + 3

// The first big question I have. 
// Since t is the time since last frame/update, what happens to the simulation if we change t? 
// If t=100.000, will our object be in the same position as if had small 't's commulate to 100.000 

// Prediction: I do not think so. 


// Newton's laws
// Force F, linear momentum p, mass m 
// F = p' = dp/dt = d(mv)/dt  = mv' = ma
// F = ma
// I.e. Force is linear momentum which is mass times acceleration.
// In other words, acceleration is Force divided by mass. i.e. a = F/m



// What is a single point mass? I guess it is something which has its weight evenly distributed across the body?

// TODO: Make the positions trace the red part of the circle. Or more general, track multiple different parts of any physics object.
const positions = []
const cmPositions = []

function step(deltaTime) {
    // Update object position
    // While collisions (How to do this? Easy when 2 objects, what about more)
    //  Handle collision


    // RECALCULATE TORQUE AT EVERY STEP

    // TODO: THIS IS WRONG BECAUSE THE VECTOR FROM THE POINT MASS TO THE CENTER OF MASS CHANGES AS THE FIGURE ROTATES
    // WE NEED TO UPATE THE POSITION OF THE CENTER OF MASS
    // const newTorque = pointMass.subtract(this.centerOfMass).perp_dot(force);
    // this.totalTorque = this.totalTorque + newTorque;
    // this.angularAcceleration = this.totalTorque / this.inertia;

    // Numerical integration of acceleration and angular acceleration to find velocity and angular velocity.
    worldState.objects.forEach(object => {
        let totalTorque = 0;
        for (let i = 0; i < object.pointMasses.length; i++) {
            const pointMass = object.pointMasses[i];
            const force = object.pointMassesCurrentForce[i];
            totalTorque += pointMass.subtract(object.centerOfMass).perp_dot(force);
        }
        object.angularAcceleration = totalTorque / object.inertia;

        object.velocity = object.velocity.add(object.acceleration.scale(deltaTime));
        object.angularVelocity = object.angularVelocity + object.angularAcceleration * deltaTime;
    });

    // Numerical integration of velocity to find new position and new orientation
    worldState.objects.forEach(object => {
        // FIND ALL THE VELOCITIES
        const veloctiyCM = object.velocity;

        let perpScaledVector = object.position.subtract(object.centerOfMass).perp_scale(object.angularVelocity);
        let velocityPosition = veloctiyCM.add(perpScaledVector);

        object.newCenterOfMass = object.centerOfMass.add(veloctiyCM.scale(deltaTime));
        object.newPosition = object.position.add(velocityPosition.scale(deltaTime));


        for (let i = 0; i < object.pointMasses.length; i++) {
            const pointMass = object.pointMasses[i];
            perpScaledVector = pointMass.subtract(object.centerOfMass).perp_scale(object.angularVelocity);
            // l(pointMass.toString(), perpScaledVector.toString(), object.angularVelocity)
            object.pointMasses[i] = pointMass.add(veloctiyCM.add(perpScaledVector).scale(deltaTime));

        }



        object.newOrientation = object.orientation + object.angularVelocity * deltaTime;
    });

    // Collision detection (NAIVE)
    worldState.objects.forEach(object => {
        if (object.newPosition.x < object.radius || 1920-object.radius < object.newPosition.x) {
            const newX = -object.velocity.x;
            object.velocity = new Vec2(newX, object.velocity.y);
        }
        if (object.newPosition.y < object.radius || 1080-object.radius < object.newPosition.y) {
            const newY = -object.velocity.y;
            object.velocity = new Vec2(object.velocity.x, newY);
        }
    })

    // I need to move all of the point masses and recalculate the torque based on the new positions, no? 
    
    // TODO: WHY DOES ADDING FORCE TO THE HEAVIEST POINT NOT SLOWLY MAKE THE BALL STOP ROTATING?
    // I WOULD EXPECT THE POINT TO MOVE STRAIGHT WITH THE FORCE AFTER SOME TIME.
    // IS THIS BECAUSE THERE IS NO DRAG? IS IT BECAUES THE POINTS DRIFT OFF?

    // TODO: STOP DRIFT OF POINT MASSES FROM ERRORS

    // Final updated position after collision detection
    worldState.objects.forEach(object => {
        object.position = object.newPosition; // Add + w r^{OB}_bot
        object.centerOfMass = object.newCenterOfMass;
        object.orientation = object.newOrientation;
    });
}

function draw() {
    const ctx = drawSettings.canvasContex;
    ctx.clearRect(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    worldState.objects.forEach(object => {
        object.draw(drawSettings.canvasContex);
    });



    ctx.strokeStyle = 'pink';
    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) {
        const p = positions[i];
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke()

    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(cmPositions[0].x, cmPositions[0].y);
    for (let i = 1; i < cmPositions.length; i++) {
        const p = cmPositions[i];
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke()
}
const state = {
    pause: false
}

// TODO: Can we stop calling requestAnimationFrame when we pause, and start calling it again when we unpause, while also saying the dt after the unpause is 0? 
function updateFrame(time) {
    const dt = time - updateFrame.lastTime;
    updateFrame.lastTime = time;
    if (state.pause) {
        return requestAnimationFrame(updateFrame);
    }

    // step(dt);
    step(5);
    const newPosition = worldState.objects[0].position;
    const previousPosition = positions[positions.length-1];
    if (!newPosition.equal(previousPosition)) {
        positions.push(newPosition);
    } 
    const newCmPosition = worldState.objects[0].centerOfMass;
    const previousCmPosition = cmPositions[cmPositions.length-1];
    if (!newCmPosition.equal(previousCmPosition)) {
        cmPositions.push(newCmPosition);
    } 


    draw();

    // if (dt > 1000) {
    //     l(dt, " is too big")
    //     return 
    // }

    requestAnimationFrame(updateFrame);
}


function simulateWorld(objects, duration, timeStepMs) {

}




function initialize() {
    drawSettings.canvas = document.getElementById('canvas');
    drawSettings.canvasContex = drawSettings.canvas.getContext('2d');

    // For fancier objects, we want to calculate the center of mass. 
    // But for now, we just define the center of mass as the position of the object
    worldState.objects.push(
        new PhysicsBall(new Vec2(300, 300), 30, 2),
    );
    positions.push(worldState.objects[0].position);
    cmPositions.push(worldState.objects[0].centerOfMass);

    // Prevent right click from opening context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);


    document.addEventListener("visibilitychange", (e) => {
        l(document.hidden)
        if (document.hidden) {
            state.pauseSetting = state.pause;
            state.pause = true;
        } else {
            state.pause = state.pauseSetting;
        }
    });


    function mouseDown(e) {
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {            
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
            case MOUSE_RIGHT_BUTTON: {
            } break;
            default: {}
        }
    }

    function mouseUp(e) {
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
        }
    }

    function keyDown(e) {
        l(e)
        const o = worldState.objects[0];
        switch (e.code) {
            case 'KeyP': {
                state.pause = !state.pause;
            } break;
            case 'KeyD': {
                for (let i = 0; i < o.pointMasses.length; i++) {
                    o.applyForce(new Vec2(-0.00001, 0), i);
                }
            } break;
            case 'ArrowLeft': {
                o.applyForce(new Vec2(-0.0005, 0), 0);
            } break;
            case 'ArrowRight': {
                o.applyForce(new Vec2(0.0005, 0), 0);
            } break;
            case 'ArrowUp': {
                o.applyForce(new Vec2(0, -0.0005), 0);
            } break;
            case 'ArrowDown': {
                o.applyForce(new Vec2(0, 0.0005), 0);
            } break;
            case 'KeyA': {
                l(o)
            }
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case 'ShiftLeft': {
            }
        }
    }
    function mouseMove(e) {
    }

    requestAnimationFrame(time => {
        updateFrame.lastTime = 0;
        updateFrame(time);
    });
}