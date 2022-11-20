"use strict";

function drawDynamic(time, r) {

    let canvas = document.getElementById("dynamic");
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
        // console.log(_ignored)
    } // Who cares about a little error.

    requestAnimationFrame(time => drawDynamic(time, r));
}

function initialize() {
    requestAnimationFrame(time => drawDynamic(time, undefined));
}