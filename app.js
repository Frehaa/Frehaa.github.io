"use strict";

let lastTimestamp = 0;
let mouseX = 0;
let mouseY = 0;

function animateWuLine(currentTimestamp) {
    let canvas = document.getElementById("wuline");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(0, 0, 1));

    // Scaled 
    // let x = Math.floor(clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1) / 20);
    // let y = Math.floor(clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1) / 20);
    // drawWuLine(
    //     imageData, 
    //     width / 40, height / 40, 
    //     x, y, 
    //     rgb(1, 0, 0), 
    //     (imageData, x, y, c) => writeColorSim(imageData, x, y, 20, c, blendColor)
    // );

    let x = clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1);
    let y = clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1);
    drawWuLine(imageData, width/2, height/2, x, y, rgb(1, 0, 0), blendColor);

    ctx.putImageData(imageData, 0, 0);
}

function animateBrezenhamLine(currentTimestamp) {
    let dt = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    let canvas = document.getElementById("brezenhamline");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(1, 1, 1));

    // let x = Math.floor(clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1) / 20);
    // let y = Math.floor(clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1) / 20);
    // drawBresenhamLine(
    //     imageData, 
    //     width / 40, height / 40, 
    //     x, y, 
    //     rgb(1, 0, 0), 
    //     (imageData, x, y, c) => writeColorSim(imageData, x, y, 20, c, writeColor)
    // );

    let x = clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1);
    let y = clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1);
    drawBresenhamLine(imageData, width/2, height/2, x, y, rgb(1, 0, 0), writeColor);

    ctx.putImageData(imageData, 0, 0);

    // FPS 
    ctx.font = "18px Arial";
    ctx.fillText(dt.toFixed(0).toString() + " ms", 5, 20);
}

function animateBrezenhamCircle(currentTimestamp) {
    let canvas = document.getElementById("brezenhamcircle");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(1,1, 1));

    // Calculate changing color based on timestamp
    let sin = Math.sin(currentTimestamp / 100);
    let val = 0.5 + 0.25 * sin;
    let color = rgb(1, val, val);

    // Mouse stuff
    let x = clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1);
    let y = clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1);

    let centerX = canvas.width / 2, 
        centerY = canvas.height / 2;

    let maxRadius = Math.min(canvas.width / 2, canvas.height / 2);
    function dist(a,b,c,d) { // Placeholder
        return 1;
    }
    let radius = dist(centerX, centerY, x, y);

    drawBresenhamCircle(imageData, centerX, centerY, Math.min(maxRadius, radius), color);
    
    ctx.putImageData(imageData, 0, 0);
}

function animate(currentTimestamp) {
    animateBrezenhamLine(currentTimestamp);
    // animateBrezenhamCircle(currentTimestamp);
    animateWuLine(currentTimestamp);
    // setTimeout(() => requestAnimationFrame(animate), 10);

    // let canvas = document.getElementById("scaledPixels");
    // let width = canvas.width;
    // let height = canvas.height;
    // let ctx = canvas.getContext("2d");
    // let imageData = ctx.getImageData(0, 0, width, height);

    // let pixelSize = 20;

    // let simWidth = width / pixelSize;
    // let simHeight = height / pixelSize;

    // writeColorSim(imageData, 1, 1, pixelSize, rgb(1,0,0), writeColor);

    // ctx.putImageData(imageData, 0, 0);


    requestAnimationFrame(animate);
}

function initialize() {
    document.addEventListener('mousemove', function(ev) {
        mouseX = ev.pageX;
        mouseY = ev.pageY;
    });

    requestAnimationFrame(animate);
}