"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
const HOME_KEY = "Home";
const END_KEY = "End";
const PAGE_DOWN_KEY = "PageDown";
const PAGE_UP_KEY = "PageUp";
const BAKCSPACE_KEY = "Backspace";
const Z_KEY = "z";
const O_KEY = "o";
const B_KEY = "b";
const F1_KEY = "F1";
const F2_KEY = "F2";

const DIRECTION_DOWN = "DOWN";
const DIRECTION_UP = "UP";

var mousePosition = {x:0, y: 0};

let frames = [];
let currentFrameIdx = 0;
let showSlideNumber = false;

function rgba(r, g, b, a) {
    return { r, g, b, a };
}

function draw() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    frames[currentFrameIdx].draw(ctx);
    ctx.restore();

    if (showSlideNumber) {
        ctx.strokeText((currentFrameIdx + 1).toString(), canvas.width - 100, canvas.height - 50);
    }

    requestAnimationFrame(draw);
}

let rectangleFrame = {
    r: rectangle(250, 250, 100, 100),
    isInteractable: true,
    draw: function(ctx) {
        if (this.r.drag) {
            ctx.strokeStyle = '#FF0000';
        } else if (this.r.isInside(mousePosition)) {
            ctx.strokeStyle = '#00FF00';
        } else {
            ctx.strokeStyle = '#0000FF';
        }
        this.r.draw(ctx);
    }, 
    mouseMove: function() {
        if (this.r.drag) {
            this.r.x = clamp(mousePosition.x - this.r.width/2, 200, 400);
        }
    }, 
    mouseDown: function() {
        if (this.r.isInside(mousePosition)) {
            this.r.drag = true;
            this.r.x = clamp(mousePosition.x - this.r.width/2, 200, 400);
        } 
    }, 
    mouseUp: function() {
        this.r.drag = false;
    },
    frameStart: function() {

    },
    frameEnd: function(){
        this.r.drag = false;
    },
    keyUp: function() {}
};

function initializeEventListeners() {
    let canvas = document.getElementById('canvas');
    canvas.addEventListener('mousemove', function(e) {
        mousePosition = {
            x: (e.pageX - e.target.offsetLeft) * (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        };
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseMove();
    });

    canvas.addEventListener('mousedown', function(e) {
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseDown();
    });

    canvas.addEventListener('mouseup', function(e) {
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseUp();
    });

    document.addEventListener('keydown', function(e) {
        let prevFrameIdx = currentFrameIdx;
        switch (e.key) {
            case ARROW_RIGHT_KEY: {
                currentFrameIdx = Math.min(currentFrameIdx + 1, frames.length-1);
            } break;
            case ARROW_LEFT_KEY: {
                currentFrameIdx = Math.max(currentFrameIdx - 1, 0);
            } break;
            case HOME_KEY: {
                currentFrameIdx = 0;
            } break;
            case END_KEY: {
                currentFrameIdx = frames.length - 1;
            } break;
            case PAGE_DOWN_KEY: {
                currentFrameIdx = Math.min(currentFrameIdx + 10, frames.length-1);
            } break;
            case PAGE_UP_KEY: {
                currentFrameIdx = Math.max(currentFrameIdx - 10, 0);
            } break;
            case F1_KEY: {
                console.log(mousePosition)
                console.log(frames[currentFrameIdx])
            } break;
            case F2_KEY: {
                showSlideNumber = !showSlideNumber;
            } break;
           default: return;
        }
        if (prevFrameIdx != currentFrameIdx) {
            frames[prevFrameIdx].frameEnd();
            frames[currentFrameIdx].frameStart();
        }
    });

    // let k_range_input = document.getElementById('range-input-k');
    // let m_range_input = document.getElementById('range-input-m');
    // k_range_input.addEventListener('input', function(e) {
    //     let m = Number(m_range_input.value);
    //     if (Number(e.target.value) > m) {
    //         e.target.value = m;
    //     }
    // });
    // m_range_input.addEventListener('input', function(e) {
    //     let k = Number(k_range_input.value);
    //     if (Number(e.target.value) < k) {
    //         e.target.value = k;
    //     }
    // });
}

function fillTextCenter(text, y, ctx) {
    let canvas = ctx.canvas;
    let measure = ctx.measureText(text);
    let x = canvas.width / 2 - measure.width / 2;
    ctx.fillText(text, x, y);
}

function createBulletPointSlides(title, bullets, drawSettings) {
    for (let i = bullets.length-1; i < bullets.length; i++) {
        frames.push(combineFrames({
            draw: function(ctx) {
                ctx.font = drawSettings.titleFont;
                fillTextCenter(title, drawSettings.titleStart, ctx);
                ctx.font = drawSettings.bulletFont;
                for (let j = 0; j <= i; j++) {
                    ctx.fillText(drawSettings.bullet + ' ' + bullets[j],
                                drawSettings.bulletStartLeft, 
                                drawSettings.bulletStartTop +
                                    drawSettings.bulletOffset * j
                    );
                }
            }
        }));    
    }
}
function initialize() {
    initializeEventListeners();
    let canvas = document.getElementById('canvas');
    let w = canvas.width;
    let h = canvas.height;

    frames.push(rectangleFrame)
    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
    
    // TODO: Draw matrix
    // Draw values into matrix
    // Color depending on threshold
    // Change threshold and update colors
    // 


}