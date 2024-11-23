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

// TODO: What if we add more phases? Right now we have the minimum for movement what looks like movement, but what happens if we add more?
let positionOffset = 1;
let phaseTime = 200;
let phases = 2;
let totalPhaseTime = phaseTime * phases;

const entity = {
    position: {
        x: 100,
        y: 100
    },
    animationTime: 0,
    draw(ctx) {

        const d = this.animationTime % (phaseTime * 2) > phaseTime? positionOffset : -positionOffset;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y + d, 20, 0, 2 * Math.PI);
        ctx.fill();
    },
    step(dt) {
        const speed = 200 / 1000;
        this.position.x += speed * dt

        this.animationTime += dt;
    },
    reset() {
        this.position = {
            x: 100, 
            y: 100
        }
        this.animationTime = 0;
    }
}


function draw(time) {
    const dt = time - draw.lastTime;
    draw.lastTime = time;

    entity.step(dt);

    const ctx = drawSettings.canvasContex;
    ctx.clearRect(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    entity.draw(ctx);

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
            case "KeyR": {
                entity.reset();
            } break;
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
