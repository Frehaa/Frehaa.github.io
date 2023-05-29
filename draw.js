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

function initialize() {
    // requestAnimationFrame(time => drawDynamic(time, undefined));

    const points = [];
    const canvas = document.getElementById('canvas')
    document.addEventListener('mousemove', e => {
        if (e.target === canvas) {
            if ((e.buttons & 0x1) == 0) return;

            let x = e.x - canvas.offsetLeft;
            let y = e.y - canvas.offsetTop;
            points.push([x, y]);
            


        }
    });
    let t = time => {
        l(points, time)

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], 1, 0, 2 * Math.PI);
            ctx.fill();
        }
        setTimeout(t, 1000);
    };
    setTimeout(t, 1000);
}