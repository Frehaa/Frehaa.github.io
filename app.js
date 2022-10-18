"use strict";

let lastTimestamp = 0;
let mouseX = 0;
let mouseY = 0;

function animate(currentTimestamp) {
    let dt = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    let canvas = document.getElementById("canvas");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(255,255, 255));

    let sin = Math.sin(currentTimestamp / 100);
    let val = 128 + 50 * sin;
    let color = rgb(255, val, val);

    // Mouse stuff
    let x = mouseX - canvas.offsetLeft;
    if (x >= canvas.width) x = canvas.width - 1;
    if (x < 0) x = 0;
    let y = mouseY - canvas.offsetTop;
    if (y >= canvas.height) y = canvas.height - 1;
    if (y < 0) y = 0;
    drawBresenhamLine(imageData, canvas.width / 2, canvas.height / 2, x, y, color);
    
    ctx.putImageData(imageData, 0, 0);

    // FPS 
    ctx.font = "18px Arial";
    ctx.fillText(dt.toFixed(0).toString() + " ms", 5, 20);
    
    // setTimeout(() => requestAnimationFrame(animate), 10);
    requestAnimationFrame(animate);
}

function initialize() {
    requestAnimationFrame(animate);

    document.addEventListener('mousemove', function(ev) {
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    });

}