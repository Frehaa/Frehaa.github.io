"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
const BAKCSPACE_KEY = "Backspace";

var mousePosition = {x:0, y: 0};

let frames = [];
let currentFrameIdx = 0;

function rectangle(x, y, width, height) {
    let r = {
        x,
        y,
        width,
        height,
        draw: function (ctx) {
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }, 
        isInside(point) {
            return this.x <= point.x && point.x <= this.x + this.width && this.y <= point.y && point.y <= this.y + this.height;
        }
    };
    return r;
}

function circle(x, y, radius) {
    let r = {
        x,
        y,
        radius,
        draw: function (ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }, 
        isInside(point) {
            return false;
        }
    };
    return r;
}

function horline(x, y, length) {
    let r = {
        x,
        y,
        length,
        draw: function(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.length, this.y);
            ctx.stroke();
        },
        distance: function(point) {
            if (this.x <= point.x && point.x <= this.x + this.length) {
                return Math.abs(point.y - this.y);
            }
            return 1000000; // TODO
        }
    };
    return r;
}

function verticalArrow(x, y, length, tipLength = 15, tipWidth = 10) {
    let r = {
        x,
        y,
        length,
        tipLength,
        tipWidth,
        draw: function(ctx) {
            let directionY = Math.sign(this.length);
            let arrowEndY = this.y + this.length;
            let arrowTipStartY = arrowEndY - this.tipLength * directionY;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, arrowTipStartY);
            ctx.stroke();

            // Arrow tip
            ctx.beginPath();
            ctx.moveTo(this.x, arrowEndY);
            ctx.lineTo(this.x + this.tipWidth, arrowTipStartY);
            ctx.lineTo(this.x - this.tipWidth, arrowTipStartY);
            ctx.closePath();
            ctx.fill();
        },
    };
    return r;
}

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

function clamp(v, min, max) {
    if (v < min) {
        return min;
    } 
    if (v > max) {
        return max;
    }
    return v;
}

class BitonicSliderFrame {
    constructor(drawSettings, isInteractable = true) {
        this.drawSettings = {
            marginX: 25, 
            marginY: 25,
            width: 400,
            height: 25,
            innerColor: `#999999`,
            outColor: `#FFFFFF`,
            borderColor: `#000000`,
            inOutSeperatorColor: `#777777`,
            borderColor: '#000000',
            lineWidth: 3,
            offset: 25,
            ...drawSettings // Overwrite if available
        };
        console.log(this.drawSettings, this.drawSettings.innerColor, this.drawSettings.outColor)

        this.isInteractable = isInteractable;
    }
    draw(ctx) {
        ctx.save()
        ctx.lineWidth = this.drawSettings.lineWidth;
        this.drawSimple(ctx);
        this.draw2half(ctx);
        this.drawPostMerge(ctx);
        ctx.restore()
    }

    drawSimple(ctx) {
        let width = this.drawSettings.width;
        let height = this.drawSettings.height
        let x1 = this.drawSettings.marginX;
        let y1 = this.drawSettings.marginY;

        let k = document.getElementById('range-input-k').value / 100;
        let m = document.getElementById('range-input-m').value / 100;
        
        this.drawBox(ctx, x1, y1, width, height, k, m);
    }
    drawBox(ctx, leftX, topY, width, height, k, m, flipColor = false) {
        let xInStart = leftX + width * k;
        let xInEnd = leftX + width * m
        let outColor = flipColor? this.drawSettings.innerColor : this.drawSettings.outColor;
        let innerColor = flipColor? this.drawSettings.outColor : this.drawSettings.innerColor;

        // console.log(innerColor, outColor, this.drawSettings)

        // Outer parts
        // TODO?: Fill all and remove?
        ctx.fillStyle = outColor;
        ctx.fillRect(leftX, topY, xInStart - leftX, height);
        ctx.fillRect(xInEnd, topY, leftX + width - xInEnd, height);

        // Inner part
        ctx.fillStyle = innerColor;
        ctx.fillRect(xInStart, topY, xInEnd - xInStart, height);

        // TODO: Make sure seperator does not draw out of 'in' area
        // if (k != m) {
        //     // Seperator
        //     ctx.strokeStyle = this.drawSettings.inOutSeperatorColor;
        //     ctx.beginPath();
        //     ctx.moveTo(xInStart, topY);
        //     ctx.lineTo(xInStart, topY + height);
        //     ctx.moveTo(xInEnd, topY);
        //     ctx.lineTo(xInEnd, topY + height);
        //     ctx.stroke();
        // }

        // Draw Border
        ctx.strokeStyle = this.drawSettings.borderColor;
        ctx.strokeRect(leftX, topY, width, height);
    }
    draw2half(ctx) {
        let width = this.drawSettings.width / 2;
        let height = this.drawSettings.height
        let x = this.drawSettings.marginX + width / 2;
        let y = this.drawSettings.marginY + this.drawSettings.height + this.drawSettings.offset;

        let k = document.getElementById('range-input-k').value / 100;
        let m = document.getElementById('range-input-m').value / 100;

        let k1 = Math.min(k * 2, 1);
        let k2 = Math.max((k - 0.5) * 2, 0);

        let m1 = Math.min(m * 2, 1);
        let m2 = Math.max((m - 0.5) * 2, 0);
        
        this.drawBox(ctx, x, y, width, height, k1, m1);
        this.drawBox(ctx, x, y + height, width, height, k2, m2);
    }
    drawPostMerge(ctx) {
        let width = this.drawSettings.width / 2;
        let height = this.drawSettings.height
        let x = this.drawSettings.marginX + width / 2;
        let y = this.drawSettings.marginY + 3 * this.drawSettings.height + 2 * this.drawSettings.offset;

        let k = document.getElementById('range-input-k').value / 100;
        let m = document.getElementById('range-input-m').value / 100;

        // Top 
        let k1 = Math.min(k * 2, 1);
        let m1 = Math.min(m * 2, 1);

        // Bottom
        let k2 = Math.max((k - 0.5) * 2, 0);
        let m2 = Math.max((m - 0.5) * 2, 0);

        if (k1 == 1) {
            this.drawBox(ctx, x, y, width, height, 1, 1);
            this.drawBox(ctx, x, y + height, width, height, k2, m2);
        } else if (m1 < 1) {
            this.drawBox(ctx, x, y, width, height, 1, 1);
            this.drawBox(ctx, x, y + height, width, height, k1, m1);
        } else if (k1 > m2) {
            this.drawBox(ctx, x, y, width, height, 1, 1);
            this.drawBox(ctx, x, y + height, width, height, m2, k1, true);
        } else if (k1 <= m2) {
            this.drawBox(ctx, x, y, width, height, k1, m2);
            this.drawBox(ctx, x, y + height, width, height, 0, 1);
        }
    }
    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    frameStart() {}
    frameEnd(){}
    keyUp() {}
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

// Square which has text inside (only a single letter is properly centered )
function writableSquare(x, y, length) { 
    let r = {
        x,
        y,
        length,
        text: null,
        font: "Arial",
        fontSize: 40,
        focus: false,
        hover: false,
        borderColor: '#000000',
        focusColor: '#FF0000',
        hoverColor: '#00FF00',
        draw: function (ctx) {
            ctx.save()
            ctx.strokeStyle = this.borderColor;
            if (this.focus) {
                ctx.strokeStyle = this.focusColor;
            } else if (this.hover) {
                ctx.strokeStyle = this.hoverColor;
            }
            ctx.strokeRect(this.x, this.y, this.length, this.length);
            if (this.text != null) {
                ctx.font = this.fontSize + "px " + this.font;
                ctx.textAlign = "center"
                ctx.fillText(this.text, this.x + this.length / 2, this.y + this.fontSize);
            }
            ctx.restore();
        }, 
        isInside(point) {
            return this.x <= point.x && point.x <= this.x + this.length && this.y <= point.y && point.y <= this.y + this.length;
        }
    };
    return r;
}

function initializeEventListeners() {
    let canvas = document.getElementById('canvas');
    canvas.addEventListener('mousemove', function(e) {
        mousePosition = {
            x: e.clientX - e.target.offsetLeft, 
            y:e.clientY - e.target.offsetTop
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

function combineFrames(f1, f2) {
    return {
        draw: function(ctx) {
            f1.draw(ctx);
            f2.draw(ctx);
        }, 
        mouseMove: function() {
            if (f1.mouseMove) f1.mouseMove();
            if (f2.mouseMove) f2.mouseMove();
        }, 
        mouseDown: function() {
            if (f1.mouseDown) f1.mouseDown();
            if (f2.mouseDown) f2.mouseDown();
        }, 
        mouseUp: function() {
            if (f1.mouseUp) f1.mouseUp();
            if (f2.mouseUp) f2.mouseUp();

        }, 
        frameEnd: function() {
            if (f1.frameEnd) f1.frameEnd();
            if (f2.frameEnd) f2.frameEnd();

        }, 
        frameStart: function() {
            if (f1.frameStart) f1.frameStart();
            if (f2.frameStart) f2.frameStart();
        }
    }
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
    frames.push(bitonicSliderFrame);

    // let canvas = document.getElementById('canvas');
    // let ctx = canvas.getContext('2d');
    // ctx.scale(2, 2);

    let network = new Network(5);
    let defaultNetworkDrawSettings = {
        squareLength: 100, 
        wireLength: 1600, 
        squareOffset: 35, 
        squareBorderColor: '#000000', 
        lineWidth: 4, 
        circleRadius: 10, 
        tipLength: 20, 
        tipWidth: 14, 
        fontSize: 60,
        drawBox: false
    };
    let networkFrame = new NetworkFrame(network, defaultNetworkDrawSettings);

    let exampleNetwork = new Network(16);
    let exampleNetworkDrawSettings = {squareLength: 0, wireLength: 1600, squareOffset: 35, squareBorderColor: '#FFFFFF', lineWidth: 4, circleRadius: 5, tipLength: 10, tipWidth: 7, drawBox: false};
    let exampleNetworkFrame = new NetworkFrame(exampleNetwork, exampleNetworkDrawSettings, false);

    bitonicSort(0, 16, DESCENDING, exampleNetwork, 0.05);

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