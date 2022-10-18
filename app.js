"use strict";

function initialize() {
    let canvas = document.getElementById("canvas");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(255,255, 255));
    drawRect(imageData, 100, 100, 200, 200, rgb(100, 100, 100));
    drawLine(imageData, 100, 100, 200, 200, rgb(0, 0, 255));

    ctx.putImageData(imageData, 0, 0);
}