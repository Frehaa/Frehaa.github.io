"use strict";
let l = console.log;
const ENTER_KEY = "Enter";

const DEFAULT_DRAWABLE_SETTINGS = { red: 0, green: 0, blue: 0, fill: true, alpha: 0, visible: false };
const FLOATING_POINT_ERROR_MARGIN = 0.000001;

function float_equal(a, b) {
    return Math.abs(a - b) < FLOATING_POINT_ERROR_MARGIN;   // 1.0 - (direction.x**2 + direction.y**2) > 0.000001 
}

function normalize(v) {
    let length = Math.sqrt(v.x**2 + v.y**2);
    return { 
        x: v.x / length,
        y: v.y / length
    };
}

function svmult(s, v) {
    return {x: s * v.x, y: s * v.y};
}

function vadd(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}

function length(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2);
}

function parseAnimationCode() {
    let items = [];

    function Circle(x, y, radius, settings = {}) {
        let c = {
            ...DEFAULT_DRAWABLE_SETTINGS, // Initialize with default settings
            position: {x, y},
            radius: radius,
            draw: function(ctx) {
                let r = this.red * 255;
                let g = this.green * 255;
                let b = this.blue * 255;
                let a = this.alpha;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);

                if (c.fill) {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    ctx.fill();
                } else {
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    ctx.stroke();
                }
            },
            boundary: function(direction) {
                if (!float_equal(length(direction), 1)) throw new Error('Direction was not normalized');
                return vadd(this.position, svmult(this.radius, direction));
            },
            ...settings // Overwrite according to given parameters
        };
        items.push(c);
        return c;
    }

    function evalFromTo(from, to) {
        // From and to are functions which are partially evaluated with the
        // objects to which is to and from. But they need to know the direction
        // of the line to tell where their own boundary is.
        let direction = { x: to.position.x - from.position.x, y: to.position.y - from.position.y };
        direction = normalize(direction);
        from = from.boundary(direction); 
        to = to.boundary(svmult(-1, direction));
        return [from, to];
    }

    function Line(from, to, settings = {}) {
        let [start, end] = evalFromTo(from, to);
        let l = {
            ...DEFAULT_DRAWABLE_SETTINGS,
            start,
            end,
            draw: function(ctx) {
                let r = l.red * 255;
                let g = l.green * 255;
                let b = l.blue * 255;
                let a = l.alpha;
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.beginPath();
                ctx.moveTo(l.start.x, l.start.y);
                ctx.lineTo(l.end.x, l.end.y);
                ctx.stroke();
            },
            ...settings
        };
        items.push(l);
        return l;
    }

    function Arrow(from, to, settings = {}) {
        // TODO: Evaluate from and to
        let [start, end] = evalFromTo(from, to);
        let a = {
            ...DEFAULT_DRAWABLE_SETTINGS,
            start,
            end,
            draw: function(ctx) {
                ctx.strokeStyle = `rgba(0,0,0,1)`;
                ctx.beginPath();
                ctx.moveTo(a.start.x, a.start.y);
                ctx.lineTo(a.end.x, a.end.y);
                // TODO: Draw arrow tip
                ctx.stroke();
            },
            ...settings
        };
        items.push(a);
        return a;
    }

    function From(target) {
        // return (to) => { return target.} 
        return target;
    }

    function To(target) {
        return target;
    }

    try {
        let textarea = document.getElementById("canvas-code");
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        // This shit is pretty sexy if I say so myself. All the functions are written manually to the animations array.
        // They are then automatically added as function parameters to 'f' with their actual names, and the 'f' is called with them in guaranteed correct order. 
        let animations = [Circle, Arrow, Line, From, To];
        let f = new Function('ctx',...animations.map(a => a.name), textarea.value);
        f(ctx, ...animations);
    } catch (_ignored) {
        console.log(_ignored)
    } // Who cares about a little error among friends.

    return items;

}


function draw() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    let items = parseAnimationCode();
    items.forEach(item => item.draw(ctx));

    ctx.restore();
}

function initialize() {
    let textarea = document.getElementById("canvas-code");
    document.addEventListener('keydown', function(e) {
        if (e.target === textarea && e.key === ENTER_KEY && e.ctrlKey) {
            draw();
        }
    })
    
    draw(); // Initial draw

    let fft = FftFromArray([[1,1,1,1], [2,2,3,2],  [1,1, 1, 1]]);
    l(fft)
}
function FftFromArray(a) {
    function Gate(x, y, id) {
        return {
            x,
            y,
            id,
            radius: 2,
            draw: function(ctx) {
                ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            }
        }
    }
    let fft = {};
    let id = 0;
    let hightestColumn = 0;
    for (let column = 0; column < a.length; column++) {
        const nodes = a[column];
        let s = 0;
        for (let row = 0; row < nodes.length; row++) {
            let count = nodes[row];
            // l(column, row, count);
            for (let k = 0; k < count; k++) {
                fft[[column,row,k]] = Gate(startOffsetX + column * spacingX, startOffsetY + row * spacingY, id++); 
            }
            s += count;
            l(`${count} gates in column ${column} row ${row}`)
        }
        l(`${s} gates in column ${column}`)
        if (s > hightestColumn) {
            hightestColumn = s
        }
    }
    l(`Highest column has ${hightestColumn} gates`);
    return fft
}

/* 
What do we want? 

We want to draw gates based on something like an array of values I think? Or an array of arrays?

[[1,1], [1,1]] -> 2 by 2 FFT with no recomputation

[[1,1,1,1], [2,2,2,2],  [1,1, 1, 1]] -> 4 by 3 FFT with middle recomputation on all nodes
[[1,1,1,1], [1,1,2,2],  [1,1, 1, 1]] -> 4 by 3 FFT with middle recomputation on two nodes. 

This should lead to ids like 

0, 0, 0 for the first top left input column

1, 0, 1 for the first recomputation in the top in the second column

These ids should be able to be used to draw lines arbitrarily.
Lines should be colourable. 

Shortcut FFT array function and then we can update values in a smarter way. 

let fft3 = FFT(3) to get [[1,1,1,1], [1,1,1,1],  [1,1, 1, 1]]

and then 
fft[1][2] = 2
fft[1][3] = 2

to update it to 
[[1,1,1,1], [1,1,2,2],  [1,1, 1, 1]]

and maybe a setAll function which takes column and range and value and sets all 
things in the range in the column to the desired value?

setAll(1, [2,3], 2)
*/