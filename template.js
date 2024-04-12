'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

const MAP_TILE_SIZE = 50;

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


function draw() {
    const ctx = drawSettings.canvasContex;

    requestAnimationFrame(draw);
}

function initialize() {
    drawSettings.canvas = document.getElementById('canvas');
    drawSettings.canvasContex = drawSettings.canvas.getContext('2d');

    // Prevent right click from opening context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
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
    function mouseMove(e) {
    }

    requestAnimationFrame(() => {
        draw();
    });
}