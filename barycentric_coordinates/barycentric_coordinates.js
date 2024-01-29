'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

const MAP_TILE_SIZE = 50;

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}
// TODO: Translate screen space to canvas space

const state = {
    triangle: [1000, 300, 1100, 350, 1050, 400],
    mousePosition: {x: 0, y:0}
}

function drawTriangle(ctx, triangle) {
    ctx.beginPath();
    ctx.moveTo(triangle[0], triangle[1]);
    ctx.lineTo(triangle[2], triangle[3]);
    ctx.lineTo(triangle[4], triangle[5]);
    ctx.closePath();
    ctx.stroke();
}

function drawMouseCartesianPosition(ctx) {
    const precision = 2
    const text = "Mouse cartesian coordinates:     ("+state.mousePosition.x.toFixed(precision) + ", " + state.mousePosition.y.toFixed(precision) + ")";
    ctx.font = '32px ariel'
    ctx.fillText(text, 100, 100);
}

function pointToBarycentric(point, triangle) { // TODO: calculate
    return [0, 0, 0]
}

function drawMouseBarycentricPosition(ctx) {
    const precision = 2
    const [alpha, beta, gamma] = pointToBarycentric(state.mousePosition, state.triangle);
    // const text = "Mouse barycentric coordinates: (α="+alpha.toFixed(precision) + ", β=" + beta.toFixed(precision) + ", γ=" + gamma.toFixed(precision) + ")";
    const text = "Mouse barycentric coordinates: ("+alpha.toFixed(precision) + ", " + beta.toFixed(precision) + ", " + gamma.toFixed(precision) + ")";
    ctx.font = '32px ariel'
    ctx.fillText(text, 100, 140);
}

let lastTime = 0;
// TODO: Draw map
// We first ignore camera and just say that 
function draw(time) {
    const dt = time - lastTime;
    lastTime = time;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawMouseCartesianPosition(ctx)
    drawMouseBarycentricPosition(ctx)

    drawTriangle(ctx, state.triangle);

    requestAnimationFrame(draw);
}

function initialize() {
    const canvas = document.getElementById('canvas');

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    function mouseDown(e) {
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: { // TODO: Movement should be done every frame after pressing down, not until it starts repeating
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
            case MOUSE_RIGHT_BUTTON: {
            } break;
            default: {}
        }
    }

    function mouseUp(e) {
        l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
        }
    }

    function keyDown(e) {
        l(e)
        switch (e.code) {
            case 'KeyN': {
            } break;
            case 'ShiftLeft': {
            }
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case 'ShiftLeft': {
            }
        }
    }
    l(canvas.clientWidth, canvas.clientWidth)

    function mouseMove(e) {
        // state.mousePosition = {
        //     x: e.screenX, 
        //     y: e.screenY
        // }
        state.mousePosition = {
            x: (e.pageX - e.target.offsetLeft)* (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        }
        // state.mousePosition = {
        //     x: (e.pageX - e.target.offsetLeft), //* (canvas.width / canvas.clientWidth), 
        //     y: (e.pageY - e.target.offsetTop)// * (canvas.height / canvas.clientHeight)
        // }
    }


    requestAnimationFrame(time => {
        lastTime = time;
        draw(time);
    });
}