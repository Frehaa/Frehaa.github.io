"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
const BAKCSPACE_KEY = "Backspace";

var mousePosition = {x:0, y: 0};

let frames = [];
let currentFrameIdx = 0;

function draw() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    frames[currentFrameIdx].draw(ctx);
    ctx.restore();

    ctx.strokeText((currentFrameIdx + 1).toString(), canvas.width - 100, canvas.height - 50);

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
            x: e.pageX - e.target.offsetLeft, 
            y:e.pageY - e.target.offsetTop
        };
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseMove();
    });

    canvas.addEventListener('mousedown', function(e) {
        console.log(e)
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseDown();
    });

    canvas.addEventListener('mouseup', function(e) {
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseUp();
    });

    document.addEventListener('keyup', function(e) {
        let prevFrameIdx = currentFrameIdx;
        switch (e.key) {
            case ARROW_RIGHT_KEY: {
                currentFrameIdx = Math.min(currentFrameIdx + 1, frames.length-1);
            } break;
            case ARROW_LEFT_KEY: {
                currentFrameIdx = Math.max(currentFrameIdx - 1, 0);
            } break;
            default: return;
        }
        if (prevFrameIdx != currentFrameIdx) {
            frames[prevFrameIdx].frameEnd();
            frames[currentFrameIdx].frameStart();
        }
    });
}

function initialize() {
    initializeEventListeners();
    let bitonicDrawSettings = {
            marginX: 50, 
            marginY: 50,
            width: 1600,
            height: 50,
            innerColor: `#999999`,
            outColor: `#FFFFFF`,
            borderColor: `#000000`,
            inOutSeperatorColor: `#777777`,
            borderColor: '#000000',
            lineWidth: 3,
            offset: 100,
    };
    let bitonicSliderFrame = new BitonicSliderFrame(bitonicDrawSettings);
    // frames.push(bitonicSliderFrame);

    let boxplotDrawSettings = {
        marginX: 50,
        marginY: 50,
        height: 500,
        width: 600,
        boxOffset: 1,
        startColor: {
            r: 0.1,
            g: 0.3,
            b: 0.1,
        },
        endColor: {
            r: 0.1,
            g: 0.8,
            b: 0.1,
        },
        drawHorizontal: true
    };
    
    let values = [19, 13, 17, 12, 3, 1, 8, 9, 18, 16, 2, 15, 14, 6, 5, 7, 10, 11, 4, 20]; 
    // values.sort((a, b) => a > b)
    // console.log(values)
    // let values = [5, 3, 6, 1, 4, 2]

    let values1 = values.slice(0, 9);
    let values2 = values.slice(10, 19);
    

    values1.sort((a, b) => a > b)
    // values2.sort((a, b) => a < b)
    values2.sort((a, b) => a > b)
    
    let values3 = values1.concat(values2);


    let boxplotFrame1 = new BoxplotFrame(values, boxplotDrawSettings);
    let c = combineFrames(boxplotFrame1, {draw: function(ctx) {
        ctx.lineWidth = 3
        for (let i = 0; i < values.length; i++) {

            drawVerticalArrow(10 * i, 10 * i, 50, 20, 10, ctx);
        }

    }});
    // frames.push(c);
    // frames.push(boxplotFrame1);

    // let canvas = document.getElementById('canvas');
    // let ctx = canvas.getContext('2d');
    // ctx.scale(2, 2);

    let wireColors = ['#FF0000', '#00FF00', '#FF0000', '#00FF00', '#00FF00', '#FF0000', '#00FF00', '#FF0000' ]; 

    let network16 = new Network(16);
    let defaultNetworkDrawSettings = {
        squareLength: 20, 
        wireLength: 1600, 
        squareOffset: 20, 
        squareBorderColor: '#000000', 
        wireColor: '#000000', 
        wireWidth: 3, 
        circleRadius: 10, 
        arrowColor: '#000000',
        tipLength: 20, 
        tipWidth: 14, 
        fontSize: 60,
        drawBox: false
    };
    let networkFrame = new NetworkFrame(network16, defaultNetworkDrawSettings);

    

    let overlayFrame = {
        draw: function(ctx) {
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            // ctx.fillRect(10, 10, 100, 100)
            // ctx.strokeRect(10, 10, 100, 100)
        }
    }
    // frames.push(combineFrames(exampleNetworkFrame, overlayFrame));
    frames.push(networkFrame);
    frames.push(rectangleFrame);
    frames.push(networkFrame);
    
    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}