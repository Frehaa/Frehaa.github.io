"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001;
const ARROW_RIGHT = "ArrowRight";
const ARROW_LEFT = "ArrowLeft";

var mouseX = 0;
var mouseY = 0;

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
            // console.log(point.x, this.x, this.length, this.x <= point.x, point.x <= this.x + this.length);
            if (this.x <= point.x && point.x <= this.x + this.length) {
                return Math.abs(point.y - this.y);
            }
            return 1000000;
        }
    };
    return r;
}

function vertical_arrow(x, y, length) {
    const TIP_LENGTH = 15;
    const TIP_WIDTH = 10;
    let r = {
        x,
        y,
        length,
        draw: function(ctx) {
            // We Just handle the straight down arrow first
            let directionY = Math.sign(this.length);
            let arrowEndY = this.y + this.length;
            let arrowTipStartY = arrowEndY - TIP_LENGTH * directionY;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, arrowTipStartY);
            ctx.stroke();

            // Arrow tip
            ctx.beginPath();
            ctx.moveTo(this.x, arrowEndY);
            ctx.lineTo(this.x + TIP_WIDTH, arrowTipStartY);
            ctx.lineTo(this.x - TIP_WIDTH, arrowTipStartY);
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

let bitonicSlideFrame = { // Bitonic slide thing
    draw: function(ctx) {
        let innerColor = `#999999`;
        let outColor = `#FFFFFF`;
        let borderColor = `#000000`;
        let inOutSeperatorColor = `#777777`;

        let width = 500;
        let height = 40
        let x1 = 100;
        let y1 = 100;
        let x2 = x1 + width;
        let y2 = y1 + height;

        let k = document.getElementById('range-input-k').value / 100;
        let m = document.getElementById('range-input-m').value / 100;
        
        let xInStart = x1 + width * k;
        let xInEnd = x1 + width * m

        // Outer parts
        ctx.fillStyle = outColor;
        ctx.fillRect(xInStart, y1, xInStart - x1, height);
        ctx.fillRect(xInEnd, y1, x2 - xInEnd, height);

        // Inner part
        ctx.fillStyle = innerColor;
        ctx.fillRect(xInStart, y1, xInEnd - xInStart, height);

        if (k != m) {
            // Seperator
            ctx.strokeStyle = inOutSeperatorColor;
            ctx.beginPath();
            ctx.moveTo(xInStart, y1);
            ctx.lineTo(xInStart, y2);
            ctx.moveTo(xInEnd, y1);
            ctx.lineTo(xInEnd, y2);
            ctx.stroke();
        }

        // Draw Border
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(x1, y1, width, height);
    },
    mouseMove: function() {},
    mouseDown: function() {},
    mouseUp: function() {},
    frameStart: function() {},
    frameEnd: function(){},
    keyUp: function() {}
};

const LINE_DISTANCE_THRESSHOLD = 10;

const NETWORK_CIRCLE_RADIUS = 8;

let networkFrame = {
    lines: [
    ],
    arrows: [

    ],
    arrowStartCircle: circle(0, 0, NETWORK_CIRCLE_RADIUS),
    arrow: vertical_arrow(100, 200, -100),
    arrows: [],
    // currentWire: null,
    draw: function(ctx) {
        ctx.lineWidth = 3;
        this.currentWire = null;
        for (let l of this.lines) {
            l.draw(ctx);
            let dist = l.distance({x: mouseX, y: mouseY});
            if (dist <= NETWORK_CIRCLE_RADIUS * 2) {
                this.currentWire = l;
            }
        }
        let l = this.currentWire;

        if (l != null && !this.drag) {
            this.arrowStartCircle.x = mouseX;
            this.arrowStartCircle.y = l.y;
            this.arrowStartCircle.draw(ctx);
        } else if (this.drag) {
            this.arrowStartCircle.y = this.startWire.y;
            this.arrowStartCircle.draw(ctx);

            // Draw arrow if the current wire is different from the start wire
            if (l != null) {
                let wireDiff = l.y - this.startWire.y;
                if (wireDiff != 0) {
                    this.arrow.x = this.arrowStartCircle.x;
                    this.arrow.y = this.arrowStartCircle.y;
                    this.arrow.length = wireDiff;
                    this.arrow.draw(ctx);
                }
            }
        }



        for (let a of this.arrows) {
            a.draw(ctx);
        }

    },
    mouseMove: function() {},
    mouseDown: function() {
        if (this.currentWire != null) {
            this.drag = true;
            this.startWire = this.currentWire;
        }
    },
    mouseUp: function() {
        if (this.drag && this.currentWire != this.startWire) {
            this.arrows.push(this.arrow);
            this.arrows.push(this.arrowStartCircle);
            this.arrow = vertical_arrow(0, 0, 0);
            this.arrowStartCircle = circle(0, 0, NETWORK_CIRCLE_RADIUS);
        }
        this.drag = false;
        this.startWire = null;
    },
    frameStart: function() {},
    frameEnd: function(){},
    keyUp: function() {}
};

let rectangleFrame = {
    r: rectangle(250, 250, 100, 100),
    draw: function(ctx) {
        if (this.r.drag) {
            ctx.strokeStyle = '#FF0000';
        } else if (this.r.isInside({x:mouseX, y: mouseY})) {
            ctx.strokeStyle = '#00FF00';
        } else {
            ctx.strokeStyle = '#0000FF';
        }
        this.r.draw(ctx);
    }, 
    mouseMove: function() {
        if (this.r.drag) {
            this.r.x = clamp(mouseX - this.r.width/2, 200, 400);
        }
    }, 
    mouseDown: function() {
        if (this.r.isInside({x: mouseX, y: mouseY})) {
            this.r.drag = true;
            this.r.x = clamp(mouseX - this.r.width/2, 200, 400);
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

let writableSquareFrame = {
    squares: [],
    target: null,
    keyDownCallback: function(e) {
        let self = writableSquareFrame;
        let key = e.key;
        if (self.target != null && '0' <= key && key <= '9') {
            self.target.text = key;
            self.target = null;
        }
    },
    draw: function(ctx) {
        for (let s of this.squares) {
            ctx.save();
            if (s.isInside({x: mouseX, y: mouseY})) {
                ctx.strokeStyle = '#00FF00'
            }
            if (s == this.target) {
                ctx.strokeStyle = '#FF0000'
            }
            s.draw(ctx);
            if (s.text != null) {
                ctx.font = "40px Arial";
                ctx.textAlign = "center"
                ctx.fillText(s.text, s.x + s.width / 2, s.y + 40);
            }
            ctx.restore();
        }
    },
    mouseMove: function() {} ,
    mouseDown: function() {
        for (let s of this.squares) {
            if (s.isInside({x: mouseX, y: mouseY})) {
                this.target = s;
                console.log(this.target)
            }
        }
    },
    mouseUp: function() {},
    frameStart: function() {
        document.addEventListener('keydown', this.keyDownCallback)
    },
    frameEnd: function(){
        document.removeEventListener('keydown', this.keyDownCallback);
    },
    keyUp: function() {}
}

function initializeEventListeners() {
    let canvas = document.getElementById('canvas');
    canvas.addEventListener('mousemove', function(e) {
        mouseX = e.clientX - e.target.offsetLeft;
        mouseY = e.clientY - e.target.offsetTop;
        frames[currentFrameIdx].mouseMove();
    });

    canvas.addEventListener('mousedown', function(e) {
        frames[currentFrameIdx].mouseDown();
    });

    canvas.addEventListener('mouseup', function(e) {
        frames[currentFrameIdx].mouseUp();
    });

    document.addEventListener('keyup', function(e) {
        let prevFrameIdx = currentFrameIdx;
        switch (e.key) {
            case ARROW_RIGHT: {
                currentFrameIdx = Math.min(currentFrameIdx + 1, frames.length-1);
            } break;
            case ARROW_LEFT: {
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
    // frames.push(bitonicSlideFrame);
    frames.push(writableSquareFrame);
    frames.push(networkFrame);
    frames.push(rectangleFrame);
    for (let i = 1; i <= 6; ++i) {
        networkFrame.lines.push(horline(100, 70 *i, 400, 70 * i));
    }
    
    for (let i = 0; i < 6; ++i) {
        writableSquareFrame.squares.push(rectangle(100, 70 * i + 20, 50, 50));
    }

    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}