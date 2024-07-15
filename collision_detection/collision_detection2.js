"use strict";
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

const drawSettings = {
    canvas: null,
    canvasContex: null,
    currentFrame: 0
};

class Circle {
    constructor(x, y, radius) {
        this.position = new Vec2(x, y);
        this.radius = radius;
        this.velocity = new Vec2(0.01, 0.02);
        this.color = 'green';
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        // TODO: If near the border, draw on both sides?
    }
    step(dt) {
        const movement = this.velocity.scale(dt);
        const newX = (movement.x + this.position.x) % drawSettings.canvas.width;
        const newY = (movement.y + this.position.y) % drawSettings.canvas.height;
        this.position = new Vec2(newX, newY);

        // TODO: MOVE BOX
    }

}

function naive_collision_detect(bodies) {
    const result = [];
    // For every pair. Check for overlap. 
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];
        for (let j = i+1; j < bodies.length; j++) {
            const bodyB = bodies[j];

            // First we assume everything is just a circle
            const distance = bodyA.newPosition.subtract(bodyB.newPosition).length();
            if (distance < bodyA.radius + bodyB.radius) { // Collision
                result.push([i, j]);
            }

        }
    }
    return result;
}

function draw(bodies, collidingPairs) {
    for (let body of bodies) {
        body.color = 'green';
    }
    for (let [i, j] of collidingPairs) {
        const [bodyA, bodyB] = [bodies[i], bodies[j]];
        bodyA.color = 'red';
        bodyB.color = 'red';
    }

    const ctx = drawSettings.canvasContext;
    ctx.clearRect(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    for (const body of bodies) {
        body.draw(ctx);
    }
}

function initializeBodies() {
    const result = [
        new Circle(100, 200, 30),
        new Circle(300, 300, 30),
    ];

    result[0].velocity = new Vec2(10, 10);
    result[1].velocity = new Vec2(-30, 0);

    return result;
}

function calculateNewPositions(entities, deltaTime) {
    for (const entity of entities) {
        entity.newPosition = entity.velocity.scale(deltaTime/10).add(entity.position);
    }
}

function findCollisions(entities) {
    return naive_collision_detect(entities);
}

function updateEntityPositions(entities) {
    for (const entity of entities) {
        entity.position = entity.newPosition;
    }
}

function onbodyload() {
    drawSettings.canvas = document.getElementById("canvas");
    drawSettings.canvasContext = drawSettings.canvas.getContext("2d");

    // Prevent right click from opening context menu
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("keydown", keyDown);

    const entities = initializeBodies();
    draw(entities, []);
    const imageData = drawSettings.canvasContext.getImageData(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    const frameTimePairs = [0, imageData];

    const timeStepMs = 1;
    let currentTime = 0;
    for (let i = 0; i < 100; i++) {

        calculateNewPositions(entities, timeStepMs);
        const collidingPairs = findCollisions(entities);
        if (collidingPairs.length > 0) {
            // Collision
            
            // TODO: Subdivide deltatime
        }
        updateEntityPositions(entities);
        draw(entities, collidingPairs);
        const imageData = drawSettings.canvasContext.getImageData(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
        currentTime += timeStepMs;
        frameTimePairs.push(currentTime);
        frameTimePairs.push(imageData);
    }

    drawSettings.canvasContext.putImageData(frameTimePairs[1], 0, 0);

    l(frameTimePairs)

    function keyDown(e) {
        let step = 0;
        switch(e.code) {
            case 'KeyA':
            case 'ArrowLeft': {
                step = -2;
            } break;
            case 'KeyD':
            case 'ArrowRight': {
                step = 2;
            } break;
        }

        if (step !== 0) {
            drawSettings.currentFrame = Math.min(frameTimePairs.length, Math.max(0, drawSettings.currentFrame + step));
            drawSettings.canvasContext.putImageData(frameTimePairs[drawSettings.currentFrame + 1], 0, 0);
            
            // TO LOG THIS INFORMATION I NEED TO KEEP TRACK OF ALL THE DIFFERENT POSITIONS
            const [a, b] = entities; 

            l(a.position)
        }
        
    }
}




function run_tests() {
    const tests = [];
    for (let i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            console.log(tests[i].name + " success");
        } catch (e) {
            console.log(e);
        }
    }
}