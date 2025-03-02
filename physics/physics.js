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
    // return simpleBall();
    // return rotatingDrawingBall();
    return rotatingBall()
    // return centerOfMassBall();

    const animationClass = new AnimationFrameRequestManager(updateFrame);

    worldState.objects.push(
        // new SimpleMassNonRotatingPhysicsBall(new Vec2(300, 300), 30),
        new PhysicsBall(new Vec2(300, 300), 30),
    );

    l(worldState.objects[0])
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



function rotatingBall() {
    const size = 15
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let mousePosition = new Vec2(0, 0);
    let ballForcePoint = null;

    const ball = new SimpleMassRotatingPhysicsBall(new Vec2(300, 300), size);
    window.ball = ball;
    const positions = [ball.position];

    const maxVelocity = 5.5
    const force = 0.01; // 0.01 force with -0.001 drag gives a max velocty of 10 it seems like. Can this be computed?
    // ball.addConditionalForce(b => b.velocity.scale(-force/maxVelocity));

    const animationClass = new AnimationFrameRequestManager(dt => {
        // UPDATE
        ball.step(dt);
        // Clear and draw ball and path
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ball.draw(ctx);

        ctx.font = '25px Arial';
        ctx.fillStyle = 'black'
        ctx.fillText(ball.acceleration.x.toFixed(2), 1200, 200);
        ctx.fillText(ball.acceleration.y.toFixed(2), 1200, 230);

        ctx.fillText(ball.velocity.x.toFixed(2), 1200, 260);
        ctx.fillText(ball.velocity.y.toFixed(2), 1200, 290);

        ctx.fillText(ball.totalForce.x.toFixed(2), 1200, 320);
        ctx.fillText(ball.totalForce.y.toFixed(2), 1200, 350);

        // Draw mouse position
        // ctx.beginPath();
        // ctx.arc(mousePosition.x, mousePosition.y, 4, 0, 2 * Math.PI);
        // ctx.fillStyle = 'blue';
        // ctx.fill();

        // Draw ballforcePoint
        if (ballForcePoint) {
            const ballForcePointActual = ball.position.add(ballForcePoint);
            ctx.beginPath();
            ctx.arc(ballForcePointActual.x, ballForcePointActual.y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();




            // Draw arrow from ballForcePoint towards mousePosition with max length of 50 and 90 angle to the ball
            const vectorToMouse = mousePosition.subtract(ballForcePointActual);
            const distance = vectorToMouse.length();
            const direction = vectorToMouse.normalize();
            const arrowEnd = ballForcePointActual.add(direction.scale(Math.min(50, distance)));
            // Draw arrow 
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(ballForcePointActual.x, ballForcePointActual.y);
            ctx.lineTo(arrowEnd.x, arrowEnd.y);
            ctx.stroke();

        }
    });

    // Event Listeners 
    document.addEventListener('contextmenu', e => e.preventDefault()); // Prevent right click from opening context menu

    const mouseDown = e => {
        // Find the x,y coordinates on the radius of the ball closest to the mouse position
        const mousePosition = new Vec2(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        const ballPosition = ball.position;
        const vectorToMouse = mousePosition.subtract(ballPosition);
        const distance = vectorToMouse.length();
        if (distance === 0) {  // If the mouse is on the ball, the force point should be the center of the ball.
            l("Mouse on ball")
            ballForcePoint = new Vec2(0, 0);
            return;
        }
        const radius = ball.radius
        const direction = vectorToMouse.normalize();
        const newPoint = ballPosition.add(direction.scale(Math.min(radius, distance)));
        ballForcePoint = newPoint.subtract(ball.position); // The ball force point should be calculated relative to the ball position to make sure it follows the ball as it is moving and rotating.

        const ballForcePointActual = ball.position.add(ballForcePoint);
        l(ballForcePointActual, ballForcePoint)
    }
    const mouseUp = e => {

        // Apply force to the ball
        if (ballForcePoint) {
            const ballForcePointActual = ball.position.add(ballForcePoint);
            const forceVector = mousePosition.subtract(ballForcePointActual).scale(0.0001);
            ball.applySingleStepForceAtPoint(forceVector, ballForcePointActual);
            // ball.applyForce(ballForcePoint, forceVector);
        }

        ballForcePoint = null;
    }
    const mouseMove = mouseEvent => {
        const x = (mouseEvent.pageX - canvas.offsetLeft) * (canvas.width / canvas.clientWidth);
        const y = (mouseEvent.pageY - canvas.offsetTop) * (canvas.height / canvas.clientHeight)

        mousePosition = new Vec2(x, y);
    }
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("mousemove", mouseMove);


    // Start 
    animationClass.start();

}

// Uses the "most" simple physics object in the "most" simple way to draw a path based on positions the ball has taken. The ball is controlled using arrow keys which applies a constant force while pressed. 
function simpleBall() {
    const size = 15

    const ball = new SimpleMassNonRotatingPhysicsBall(new Vec2(300, 300), size);
    const positions = [ball.position];

    const maxVelocity = 5.5
    const force = 0.01; // 0.01 force with -0.001 drag gives a max velocty of 10 it seems like. Can this be computed?
    ball.addConditionalForce(b => b.velocity.scale(-force/maxVelocity));

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

        // ctx.beginPath();
        // ctx.moveTo(positions[0].x, positions[0].y);
        // for (let i = 1; i < positions.length; i++) {
        //     const p = positions[i];
        //     ctx.lineTo(p.x, p.y);
        // }
        // ctx.lineWidth = size;
        // ctx.strokeStyle = 'pink';
        // ctx.stroke()

        ctx.font = '25px Arial';
        ctx.fillStyle = 'black'
        ctx.fillText(ball.acceleration.x.toFixed(2), 1200, 200);
        ctx.fillText(ball.acceleration.y.toFixed(2), 1200, 230);

        ctx.fillText(ball.velocity.x.toFixed(2), 1200, 260);
        ctx.fillText(ball.velocity.y.toFixed(2), 1200, 290);

        ctx.fillText(ball.totalForce.x.toFixed(2), 1200, 320);
        ctx.fillText(ball.totalForce.y.toFixed(2), 1200, 350);
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
                ball.applyForce(new Vec2(-force, 0), 0);
            } break;
            case 'ArrowRight': {
                ball.applyForce(new Vec2(force, 0), 0);
            } break;
            case 'ArrowUp': {
                ball.applyForce(new Vec2(0, -force), 0);
            } break;
            case 'ArrowDown': {
                ball.applyForce(new Vec2(0, force), 0);
            } break;
            case 'KeyA': {
                l(ball)
            }
        }
    }

    function keyUp(e) {
        // assert(pressedKeys.has(e.code), "Key up event of key without key down event.") // I guess this can happen if the window does not have focus for the key down event? 

        pressedKeys.delete(e.code);
        switch (e.code) {
            case 'ArrowLeft': {
                ball.applyForce(new Vec2(force, 0), 0);
            } break;
            case 'ArrowRight': {
                ball.applyForce(new Vec2(-force, 0), 0);
            } break;
            case 'ArrowUp': {
                ball.applyForce(new Vec2(0, force), 0);
            } break;
            case 'ArrowDown': {
                ball.applyForce(new Vec2(0, -force), 0);
            } break;
        }
    }

    // Start 
    animationClass.start();
}

function rotatingDrawingBall() {
    const size = 15

    const ball = new SimpleMassRotatingPhysicsBall(new Vec2(300, 300), size);
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

function centerOfMassBall() {
    const size = 25

    const ball = new MultiPointMassNonRotatingPhysicsBall(new Vec2(300, 300), size);

    ball.addPointMass(0, 1, 1);
    ball.addPointMass(Math.PI, 1, 1);
    ball.addPointMass(1.5 * Math.PI, 0.5, 2);
    ball.addPointMass(1.7 * Math.PI, 0.7, 5);
    // ball.addPointMass(0, 0, 5);

    const maxVelocity = 4
    const force = 0.05; // 0.01 force with -0.001 drag gives a max velocty of 10 it seems like. Can this be computed?
    ball.addConditionalForce(b => b.velocity.scale(-force/maxVelocity));

    const animationClass = new AnimationFrameRequestManager(dt => {
        // UPDATE
        ball.step(dt);

        // Clear and draw ball and path
        const ctx = document.getElementById('canvas').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ball.draw(ctx);

        ctx.font = '25px Arial';
        ctx.fillStyle = 'black'
        ctx.fillText(ball.acceleration.x.toFixed(2), 1200, 200);
        ctx.fillText(ball.acceleration.y.toFixed(2), 1200, 230);

        ctx.fillText(ball.velocity.x.toFixed(2), 1200, 260);
        ctx.fillText(ball.velocity.y.toFixed(2), 1200, 290);

        ctx.fillText(ball.totalForce.x.toFixed(2), 1200, 320);
        ctx.fillText(ball.totalForce.y.toFixed(2), 1200, 350);
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
                ball.applyForce(new Vec2(-force, 0), 0);
            } break;
            case 'ArrowRight': {
                ball.applyForce(new Vec2(force, 0), 0);
            } break;
            case 'ArrowUp': {
                ball.applyForce(new Vec2(0, -force), 0);
            } break;
            case 'ArrowDown': {
                ball.applyForce(new Vec2(0, force), 0);
            } break;
            case 'KeyA': {
                l(ball)
            }
        }
    }

    function keyUp(e) {
        // assert(pressedKeys.has(e.code), "Key up event of key without key down event.") // I guess this can happen if the window does not have focus for the key down event? 

        pressedKeys.delete(e.code);
        switch (e.code) {
            case 'ArrowLeft': {
                ball.applyForce(new Vec2(force, 0), 0);
            } break;
            case 'ArrowRight': {
                ball.applyForce(new Vec2(-force, 0), 0);
            } break;
            case 'ArrowUp': {
                ball.applyForce(new Vec2(0, force), 0);
            } break;
            case 'ArrowDown': {
                ball.applyForce(new Vec2(0, -force), 0);
            } break;
        }
    }


    // Start 
    animationClass.start();

}