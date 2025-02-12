'use strict';
const worldState = {
    objects: []
};

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
    // worldState.objects.forEach(object => {
    //     let totalTorque = 0;
    //     for (let i = 0; i < object.pointMasses.length; i++) {
    //         const pointMass = object.pointMasses[i];
    //         const force = object.pointMassesCurrentForce[i];
    //         totalTorque += pointMass.subtract(object.centerOfMass).perp_dot(force);
    //     }
    //     object.angularAcceleration = totalTorque / object.inertia;

    //     object.velocity = object.velocity.add(object.acceleration.scale(deltaTime));
    //     object.angularVelocity = object.angularVelocity + object.angularAcceleration * deltaTime;
    // });

    // Numerical integration of velocity to find new position and new orientation
    worldState.objects.forEach(object => {
        object.step(deltaTime);
    });

    // Collision detection (NAIVE)
    // worldState.objects.forEach(object => {
        // if (object.newPosition.x < object.radius || 1920-object.radius < object.newPosition.x) {
        //     const newX = -object.velocity.x;
        //     object.velocity = new Vec2(newX, object.velocity.y);
        // }
        // if (object.newPosition.y < object.radius || 1080-object.radius < object.newPosition.y) {
        //     const newY = -object.velocity.y;
        //     object.velocity = new Vec2(object.velocity.x, newY);
        // }
    // })

    // I need to move all of the point masses and recalculate the torque based on the new positions, no? 
    
    // TODO: WHY DOES ADDING FORCE TO THE HEAVIEST POINT NOT SLOWLY MAKE THE BALL STOP ROTATING?
    // I WOULD EXPECT THE POINT TO MOVE STRAIGHT WITH THE FORCE AFTER SOME TIME.
    // IS THIS BECAUSE THERE IS NO DRAG? IS IT BECAUES THE POINTS DRIFT OFF?

    // TODO: STOP DRIFT OF POINT MASSES FROM ERRORS

    // Final updated position after collision detection
    worldState.objects.forEach(object => {
        object.position = object.newPosition; // Add + w r^{OB}_bot
        // object.centerOfMass = object.newCenterOfMass;
        // object.orientation = object.newOrientation;
    });
}

function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    worldState.objects.forEach(object => {
        object.draw(ctx);
    });

    ctx.strokeStyle = 'pink';
    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) {
        const p = positions[i];
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke()

    // ctx.strokeStyle = 'black';
    // ctx.beginPath();
    // ctx.moveTo(cmPositions[0].x, cmPositions[0].y);
    // for (let i = 1; i < cmPositions.length; i++) {
    //     const p = cmPositions[i];
    //     ctx.lineTo(p.x, p.y);
    // }
    // ctx.stroke()
}

function updateFrame(dt) {
    step(dt);
    const newPosition = worldState.objects[0].position;
    const previousPosition = positions[positions.length-1];
    if (!newPosition.equal(previousPosition)) {
        positions.push(newPosition);
    } 
    // const newCmPosition = worldState.objects[0].centerOfMass;
    // const previousCmPosition = cmPositions[cmPositions.length-1];
    // if (!newCmPosition.equal(previousCmPosition)) {
    //     cmPositions.push(newCmPosition);
    // } 

    const ctx = document.getElementById('canvas').getContext('2d');
    draw(ctx);
}

function initialize() {
    // return simpleDrawingBall();

    const animationClass = new AnimationFrameRequestManager(updateFrame);

    worldState.objects.push(
        new SimpleMassNonRotatingPhysicsBall(new Vec2(300, 300), 30),
        // new PhysicsBall(new Vec2(300, 300), 30),
    );
    positions.push(worldState.objects[0].position);
    cmPositions.push(worldState.objects[0].centerOfMass);

    // Prevent right click from opening context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    const pressedKeys = new Set()

    function keyDown(e) {
        if (pressedKeys.has(e.code)) { return; }
        pressedKeys.add(e.code);
        l(e)
        const o = worldState.objects[0];
        switch (e.code) {
            case 'KeyP': {
                animationClass.togglePause();
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
        assert(pressedKeys.has(e.code), "Key up event of key without key down event.") // I guess this can happen if the window does not have focus for the key down event? 

        pressedKeys.delete(e.code);
        const o = worldState.objects[0];
        switch (e.code) {
            case 'ArrowLeft': {
                o.applyForce(new Vec2(0.0005, 0), 0);
            } break;
            case 'ArrowRight': {
                o.applyForce(new Vec2(-0.0005, 0), 0);
            } break;
            case 'ArrowUp': {
                o.applyForce(new Vec2(0, 0.0005), 0);
            } break;
            case 'ArrowDown': {
                o.applyForce(new Vec2(0, -0.0005), 0);
            } break;
        }
    }

    animationClass.start();
}



// Uses the "most" simple physics object in the "most" simple way to draw a path based on positions the ball has taken. The ball is controlled using arrow keys which applies a constant force while pressed. 
function simpleDrawingBall() {
    const size = 15

    const ball = new SimpleMassNonRotatingPhysicsBall(new Vec2(300, 300), size);
    const positions = [ball.position];

    const animationClass = new AnimationFrameRequestManager(dt => {
        // UPDATE
        ball.step(dt);

        // Record position
        const newPosition = ball.position;
        const previousPosition = positions[positions.length-1];
        if (!newPosition.equal(previousPosition)) {
            positions.push(newPosition);
        } 


        // Clear and draw ball and path
        const ctx = document.getElementById('canvas').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ball.draw(ctx);

        ctx.beginPath();
        ctx.moveTo(positions[0].x, positions[0].y);
        for (let i = 1; i < positions.length; i++) {
            const p = positions[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.lineWidth = size;
        ctx.strokeStyle = 'pink';
        ctx.stroke()
    });

    // Event Listeners 
    document.addEventListener('contextmenu', e => e.preventDefault()); // Prevent right click from opening context menu
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    const pressedKeys = new Set()
    function keyDown(e) {
        if (pressedKeys.has(e.code)) { return; }
        pressedKeys.add(e.code);
        switch (e.code) {
            case 'KeyP': {
                animationClass.togglePause();
            } break;
            case 'KeyD': {
                for (let i = 0; i < o.pointMasses.length; i++) {
                    ball.applyForce(new Vec2(-0.00001, 0), i);
                }
            } break;
            case 'ArrowLeft': {
                ball.applyForce(new Vec2(-0.0005, 0), 0);
            } break;
            case 'ArrowRight': {
                ball.applyForce(new Vec2(0.0005, 0), 0);
            } break;
            case 'ArrowUp': {
                ball.applyForce(new Vec2(0, -0.0005), 0);
            } break;
            case 'ArrowDown': {
                ball.applyForce(new Vec2(0, 0.0005), 0);
            } break;
            case 'KeyA': {
                l(ball)
            }
        }
    }

    function keyUp(e) {
        assert(pressedKeys.has(e.code), "Key up event of key without key down event.") // I guess this can happen if the window does not have focus for the key down event? 

        pressedKeys.delete(e.code);
        switch (e.code) {
            case 'ArrowLeft': {
                ball.applyForce(new Vec2(0.0005, 0), 0);
            } break;
            case 'ArrowRight': {
                ball.applyForce(new Vec2(-0.0005, 0), 0);
            } break;
            case 'ArrowUp': {
                ball.applyForce(new Vec2(0, 0.0005), 0);
            } break;
            case 'ArrowDown': {
                ball.applyForce(new Vec2(0, -0.0005), 0);
            } break;
        }
    }

    // Start 
    animationClass.start();
}