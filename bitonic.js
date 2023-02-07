"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
const BAKCSPACE_KEY = "Backspace";

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


// let wireFrame = {
//     lines: [
//     ],
//     arrows: [

//     ],
//     arrowStartCircle: circle(0, 0, NETWORK_CIRCLE_RADIUS),
//     arrow: vertical_arrow(100, 200, -100),
//     arrows: [],
//     // currentWire: null,
//     draw: function(ctx) {
//         ctx.lineWidth = 3;
//         this.currentWire = null;
//         for (let l of this.lines) {
//             l.draw(ctx);
//             let dist = l.distance({x: mouseX, y: mouseY});
//             if (dist <= NETWORK_CIRCLE_RADIUS * 2) {
//                 this.currentWire = l;
//             }
//         }
//         let l = this.currentWire;

//         if (l != null && !this.drag) {
//             this.arrowStartCircle.x = mouseX;
//             this.arrowStartCircle.y = l.y;
//             this.arrowStartCircle.draw(ctx);
//         } else if (this.drag) {
//             this.arrowStartCircle.y = this.startWire.y;
//             this.arrowStartCircle.draw(ctx);

//             // Draw arrow if the current wire is different from the start wire
//             if (l != null) {
//                 let wireDiff = l.y - this.startWire.y;
//                 if (wireDiff != 0) {
//                     this.arrow.x = this.arrowStartCircle.x;
//                     this.arrow.y = this.arrowStartCircle.y;
//                     this.arrow.length = wireDiff;
//                     this.arrow.draw(ctx);
//                 }
//             }
//         }



//         for (let a of this.arrows) {
//             a.draw(ctx);
//         }

//     },
//     mouseMove: function() {},
//     mouseDown: function() {
//         if (this.currentWire != null) {
//             this.drag = true;
//             this.startWire = this.currentWire;
//         }
//     },
//     mouseUp: function() {
//         if (this.drag && this.currentWire != this.startWire) {
//             this.arrows.push(this.arrow);
//             this.arrows.push(this.arrowStartCircle);
//             this.arrow = vertical_arrow(0, 0, 0);
//             this.arrowStartCircle = circle(0, 0, NETWORK_CIRCLE_RADIUS);
//         }
//         this.drag = false;
//         this.startWire = null;
//     },
//     frameStart: function() {},
//     frameEnd: function(){},
//     keyUp: function() {}
// };

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
            s.hover = s.isInside({x: mouseX, y: mouseY});
            s.focus = s == this.target;
            s.draw(ctx);
        }
    },
    mouseMove: function() {} ,
    mouseDown: function() {
        for (let s of this.squares) {
            if (s.isInside({x: mouseX, y: mouseY})) {
                console.log(s)
                this.target = s;
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

function createCompareAndSwap(a, b) {
    return (vals) => {
        if (vals[a] < vals[b]) {
            let tmp = vals[a];
            vals[a] = vals[b];
            vals[b] = tmp;
        };
    }
}

const ASCENDING = true;
const DESCENDING = false;

function bitonicSort(start, n, direction, network, pos) {
    if (n == 1) return pos;

    let m = n / 2;
    let newPos = bitonicSort(start, m, DESCENDING, network, pos);
    bitonicSort(start + m, m, ASCENDING, network, pos);
    return bitonicMerge(start, n, direction, network, newPos);
}

function bitonicMerge(start, n, direction, network, pos) {
    if (n == 1) return;

    let space = 0.01;
    let m = n / 2;
    for (let i = start; i < start + m; i++) {
        addCas(i, i + m, direction, network, pos + space * (i - start));
    }

    bitonicMerge(start, m, direction, network, pos + space * m + space);
    bitonicMerge(start + m, m, direction, network, pos + space * m + space);

    return pos + space * n + space * 5;
}

function addCas(i, j, direction, network, pos) {
    if (direction === ASCENDING) {
        let tmp = i;
        i = j;
        j = tmp;
    }
    network.addCompareAndSwap(pos, i, j);
}

function initialize() {
    initializeEventListeners();
    // frames.push(bitonicSlideFrame);
    // frames.push(writableSquareFrame);

    // let canvas = document.getElementById('canvas');
    // let ctx = canvas.getContext('2d');
    // ctx.scale(2, 2);

    let network = new Network(5);
    let networkFrame = new NetworkFrame(network, {square: 50, wire: 400, offset: 20});

    let exampleNetwork = new Network(16);
    let exampleNetworkDrawSettings = {squareLength: 0, wireLength: 1600, squareOffset: 35, squareBorderColor: '#FFFFFF', lineWidth: 4, circleRadius: 5, tipLength: 10, tipWidth: 7, drawBox: false};
    let exampleNetworkFrame = new NetworkFrame(exampleNetwork, exampleNetworkDrawSettings);

    bitonicSort(0, 16, DESCENDING, exampleNetwork, 0.05);

    frames.push(exampleNetworkFrame);
    // frames.push(networkFrame);
    frames.push(rectangleFrame);
    
    for (let i = 0; i < 6; ++i) {
        writableSquareFrame.squares.push(writableSquare(100, 20 + 70 * i, 50))
    }

    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}