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

function vertical_arrow(x, y, length) {
    const TIP_LENGTH = 15;
    const TIP_WIDTH = 10;
    let r = {
        x,
        y,
        length,
        draw: function(ctx) {
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

class Network {
    constructor(size) {
        this.size = size;
        this.values = [];
        for (let i = 0; i < size; ++i) {
            this.values.push(null);
        }
    }
}

// A "Drawable" is an object with a draw method

// TODO: Update every draw or update once and keep state in squares?
// Currently updates every frame

// Focus is the element which has been clicked on
// Invariant: There should be focus on no more elements than one

// TODO: Implement arrow focus
// TODO: Implement arrow removal
// TODO: Show path of values? In different colors and dotted line?
class NetworkFrame {
    constructor(network, x, y, length) {
        if (!network instanceof Network) {
            throw new TypeError("argument has to be instance of Network");
        }
        this.network = network;
        this.values = [];
        this.compareAndSwaps = new LinkedList();

        // Static drawables
        this.leftSquares = [];
        this.rightSquares = [];
        this.wires = [];

        // Dynamic drawables
        this.arrow = vertical_arrow(0, 0, 0);
        this.arrowStartCircle = circle(0, 0, NETWORK_CIRCLE_RADIUS);

        // Draw Flag
        this.displayRightSquares = true;

        // Hover and focus elements
        this.focusSquareIdx = null;
        
        this.hoverWireIdx = null;
        this.focusWireIdx = null;

        // Setup static drawables
        let squareLength = 50;
        let wireLength = 400;
        let squareOffset = squareLength + 20;
        for (let i = 0; i < this.network.size; ++i) {
            let wireY = y + squareLength / 2 + squareOffset * i;
            this.values.push(null);
            this.leftSquares.push(writableSquare(x, y + squareOffset * i, squareLength));
            this.wires.push(horline(x + squareOffset, wireY, x + squareOffset + wireLength, wireY));
            this.rightSquares.push(writableSquare(x + wireLength + 4 * squareOffset, y + squareOffset * i, squareLength));
            // this.rightSquares[i].borderColor = 'rgba(0, 0, 0, 1)';
        }
    }

    draw(ctx) {
        ctx.lineWidth = 3;
        // Left squares and wire
        for (let i = 0; i < this.network.size; ++i) {
            let lSquare = this.leftSquares[i];
            lSquare.hover = lSquare.isInside({x: mouseX, y: mouseY});
            lSquare.focus = (i == this.focusSquareIdx);
            lSquare.text = this.values[i];
            lSquare.draw(ctx);

            this.wires[i].draw(ctx);
        }
        
        // Draw place arrow start circle
        if (this.hoverWireIdx != null) {
            let w = this.wires[this.hoverWireIdx];
            if(this.focusWireIdx == null) {
                this.arrowStartCircle.x = mouseX;
                this.arrowStartCircle.y = w.y;
            } else if (this.hoverWireIdx != this.focusWireIdx) {
                let wireDiff = w.y - this.wires[this.focusWireIdx].y;
                this.arrow.x = this.arrowStartCircle.x;
                this.arrow.y = this.arrowStartCircle.y;
                this.arrow.length = wireDiff;
                this.arrow.draw(ctx);
            }

            this.arrowStartCircle.draw(ctx);
        } 

        // Simulate network, draw right square results, and draw arrows
        this.updateRightSquares();
        this.rightSquares.forEach(s => s.draw(ctx));
        this.compareAndSwaps.forEach(a => a.draw(ctx));
    }
    mouseMove() {
        this.hoverWireIdx = null;
        for (let i = 0; i < this.network.size; ++i) {
            let dist = this.wires[i].distance({x: mouseX, y: mouseY});
            if (dist <= NETWORK_CIRCLE_RADIUS * 2) {
                this.hoverWireIdx = i;
            }
        }
    }

    mouseDown() {
        // Handle wire focus
        if (this.hoverWireIdx != null) {
            this.focusWireIdx = this.hoverWireIdx;
            this.arrowStartCircle.y = this.wires[this.hoverWireIdx].y;
            this.focusSquareIdx = null;
            return;
        }

        // Handle square focus
        for (let i = 0; i < this.network.size; ++i) {
            let s = this.leftSquares[i];
            if (s.isInside({x: mouseX, y: mouseY})) {
                this.focusSquareIdx = i;
            }
        }
    }
    mouseUp() {
        // Handle place arrow mode 
        if (this.focusWireIdx != null && this.hoverWireIdx != null && this.hoverWireIdx != this.focusWireIdx) {
            this.arrow.x = this.arrowStartCircle.x; // Handle Edge case where the arrow x coordinate may not have been updated (?)

            // Add compare-and-swap in correct order
            let value = {
                x: this.arrow.x, 
                cas: createCompareAndSwap(this.hoverWireIdx, this.focusWireIdx),
                drawables: [this.arrowStartCircle, this.arrow], 
                draw: function(ctx) {
                    value.drawables.forEach(d => d.draw(ctx));
                }

            };
            this.compareAndSwaps.insertBeforePredicate(value, n => n.x > this.arrow.x);
            
            // Create new drawables 
            this.arrow = vertical_arrow(0, 0, 0);
            this.arrowStartCircle = circle(0, 0, NETWORK_CIRCLE_RADIUS);
        }
        this.focusWireIdx = null;
    }
    keyDownCallback(e) {
        let key = e.key;
        if (key === DELETE_KEY || key === BAKCSPACE_KEY) { // Delete value in left square
            this.values[this.focusSquareIdx] = null;
            this.focusSquareIdx = null;
        }
        else if (this.focusSquareIdx != null && '0' <= key && key <= '9') { // Write to left square
            this.values[this.focusSquareIdx] = key;
            this.focusSquareIdx = null;
        }
        else if (key == 'h') { // Toggle display of right squares
            this.displayRightSquares = !this.displayRightSquares;
        }
    }
    frameStart() {
        document.addEventListener('keydown', (e) => {
            this.keyDownCallback(e);
        });
    }
    frameEnd(){
        document.removeEventListener('keydown', (e) => {
            this.keyDownCallback(e);
        });
    }
    keyUp() {}
    updateRightSquares() {
        if (this.displayRightSquares) {
            let vals = this.values.slice(0); // Copy
            this.compareAndSwaps.forEach(n => n.cas(vals));
            for (let i = 0; i < vals.length; ++i) {
                this.rightSquares[i].text = vals[i];
            }
        } else {
            for (let i = 0; i < this.network.size; ++i) {
                this.rightSquares[i].text = null;
            }
        }

    }
}

let wireFrame = {
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

function test(vals, comps) {
    for (let c of comps) {
        c(vals);
    }
}

function initialize() {
    initializeEventListeners();
    // frames.push(bitonicSlideFrame);
    // frames.push(writableSquareFrame);

    let network = new Network(4);
    let networkFrame = new NetworkFrame(network, 100, 100, -1);

    frames.push(networkFrame);
    frames.push(wireFrame);
    frames.push(rectangleFrame);
    for (let i = 1; i <= 6; ++i) {
        wireFrame.lines.push(horline(100, 70 *i, 400, 70 * i));
    }
    
    for (let i = 0; i < 6; ++i) {
        writableSquareFrame.squares.push(writableSquare(100, 20 + 70 * i, 50))
    }

    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}