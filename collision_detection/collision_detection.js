"use strict";
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

const objects = [];

function step(dt) {
    for (const object of objects) {
        object.step(dt);
    }
}

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

// TODO: The first step to collision handling is just to have the moving party not move as much? I think?



function position_dependent_collision_detect(objects) {

}

function boxCollisionDetect(boxA, boxB) {
    // I.e. Check if there is any gap

    // boxA.leftX < boxB.rightX && 
    // boxA.rightX > boxB.leftX && 
    // boxA.topY < boxB.bottomY && 
    // boxA.bottomY > boxB.topY
}

function naive_collision_detect(objects) {
    const result = [];
    // For every pair. Check for overlap. 
    for (let i = 0; i < objects.length; i++) {
        const a = objects[i];
        for (let j = i+1; j < objects.length; j++) {
            const b = objects[j];

            // First we assume everything is just a circle
            const distance = a.position.subtract(b.position).length();
            if (distance < a.radius + b.radius) { // Collision
                result.push([i, j]);
            }

        }
    }
    return result;
}

function draw(time) {
    const dt = time - draw.lastTime;
    draw.lastTime = time;
    l(dt)
    
    step(dt);

    const collidingPairs = naive_collision_detect(objects);
    for (let object of objects) {
        object.color = 'green';
    }
    for (let [i, j] of collidingPairs) {
        const [a, b] = [objects[i], objects[j]];
        a.color = 'red';
        b.color = 'red';
    }

    const ctx = drawSettings.canvasContex;
    ctx.clearRect(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    for (const object of objects) {
        object.draw(ctx);
    }
    requestAnimationFrame(draw);
}

function onbodyload() {
    drawSettings.canvas = document.getElementById("canvas");
    drawSettings.canvasContex = drawSettings.canvas.getContext("2d");

    // Prevent right click from opening context menu
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);



    for (let i = 0; i < 100; i++) {
        const x = Math.random() * drawSettings.canvas.width;
        const y = Math.random() * drawSettings.canvas.height;
        const r = 1 + Math.random() * 10;
        const c = new Circle(x, y, r);

        const vx = Math.random() * 0.05;
        const vy = Math.random() * 0.05;
        c.velocity = new Vec2(vx, vy);
        objects.push(c);
    }


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
        switch (e.code) {
            case "KeyN": {
            } break;
            case "ShiftLeft": {
            }
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case "ShiftLeft": {
            }
        }
    }
    function mouseMove(e) {
    }

    requestAnimationFrame(time => {
        draw.lastTime = time;
        draw(time);
    });
}


function runTests() {
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