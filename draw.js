"use strict";
const l = console.log;

function drawDynamic(time, r) {

    let canvas = document.getElementById("canvas");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    let textarea = document.getElementById("canvas-code");

    let painter = new CanvasPainter(canvas);

    try {
        let f = new Function('t', 'r', 'painter', 'imageData', 'width', 'height', 'ctx', textarea.value);
        let res = f(time, r, painter, imageData, width, height, ctx);
        // let f = new Function('t', 'r', 'circle', 'line', 'rect', 'w', 'h', 'c', textarea.value);
        if (res !== undefined) {
            r = res;
        }
    } catch (_ignored) {
        console.log(_ignored)
    } // Who cares about a little error.

    ctx.putImageData(imageData, 0, 0);
    
    
    requestAnimationFrame(time => drawDynamic(time, r));
}

function draw(lines, points) {
    const canvas = document.getElementById("canvas");
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, width, height);

    const textarea = document.getElementById("canvas-code");

    for (const l of lines) {
        for (let i = 1; i < l.length; i++) {
            let p0 = l[i-1];
            let p1 = l[i];
            drawBresenhamLine(imageData, p0[0], p0[1], p1[0], p1[1], rgb(0, 0, 0), writeColor, 20)
        }
    }
    for (let i = 1; i < points.length; i++) {
        let p0 = points[i-1];
        let p1 = points[i];
        // drawBresenhamLine(imageData, p0[0], p0[1], p1[0], p1[1], rgb(0, 0, 0), writeColor, 20)
    }
    // try {
    //     let f = new Function('l', 'd', 'w', 'h', 'c', textarea.value);
    //     let res = f(lines, imageData, width, height, ctx);
    //     // let f = new Function('t', 'r', 'circle', 'line', 'rect', 'w', 'h', 'c', textarea.value);
    //     if (res !== undefined) {
    //         r = res;
    //     }
    // } catch (_ignored) {
    //     console.log(_ignored)
    // } // Who cares about a little error.

    ctx.putImageData(imageData, 0, 0);
}

// Why do I redraw everything when I only need to draw the newest line?

function initialize() {
    // requestAnimationFrame(time => drawDynamic(time, undefined));
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const lines = [];
    let points = [];
    let drawing = false;
    let updated = false;
    document.addEventListener('mousedown', e => {
        drawing = true;
        if (e.target === canvas && drawing) {
            let x = e.x - canvas.offsetLeft;
            let y = e.y - canvas.offsetTop;
            points.push([x, y]);
            updated = true;
        }
    });
    document.addEventListener('mousemove', e => {
        if (e.target === canvas && drawing) {
            let x = e.x - canvas.offsetLeft;
            let y = e.y - canvas.offsetTop;
            // points.push([x, y]);
        }
    });
    document.addEventListener('mouseup', e => {
        drawing = false;
        let x = e.x - canvas.offsetLeft;
        let y = e.y - canvas.offsetTop;
        points.push([x, y]);
        lines.push(points);
        updated = true;
        points = [];
    });


    let t = time => {
        if (updated) {
            draw(lines, points)
            updated = false;
        }
        setTimeout(e => {
            requestAnimationFrame(t)
        }, 100)
        
    };
    requestAnimationFrame(t)
}