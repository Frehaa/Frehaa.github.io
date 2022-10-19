"use strict";

let lastTimestamp = 0;
let mouseX = 0;
let mouseY = 0;

function clamp(x, minimum, maximum) {
    if (x > maximum) x = maximum;
    else if (x < minimum) x = minimum;
    return x;
}

function animateBrezenhamLine(currentTimestamp) {
    let dt = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    let canvas = document.getElementById("brezenhamline");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(255,255, 255));

    // Calculate changing color based on timestamp
    let sin = Math.sin(currentTimestamp / 100);
    let val = 128 + 50 * sin;
    let color = rgb(255, val, val);

    // Mouse stuff
    let x = clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1);
    let y = clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1);
    drawBresenhamLine(imageData, canvas.width / 2, canvas.height / 2, x, y, color);
    
    ctx.putImageData(imageData, 0, 0);

    // FPS 
    ctx.font = "18px Arial";
    ctx.fillText(dt.toFixed(0).toString() + " ms", 5, 20);
}

function animateBrezenhamLine(currentTimestamp) {
    let dt = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    let canvas = document.getElementById("wuline");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(255,255, 255));

    // Calculate changing color based on timestamp
    let sin = Math.sin(currentTimestamp / 100);
    let val = 128 + 50 * sin;
    let color = rgb(255, val, val);

    // Mouse stuff
    let x = clamp(mouseX - canvas.offsetLeft, 0, canvas.width - 1);
    let y = clamp(mouseY - canvas.offsetTop, 0, canvas.height - 1);
    drawWuLine(imageData, canvas.width / 2, canvas.height / 2, x, y, color);
    
    ctx.putImageData(imageData, 0, 0);
}

function animateBrezenhamCircle(currentTimestamp) {
    let dt = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    let canvas = document.getElementById("brezenhamcircle");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, width, height);

    clear(imageData, rgb(255,255, 255));

    // Calculate changing color based on timestamp
    let sin = Math.sin(currentTimestamp / 100);
    let val = 128 + 50 * sin;
    let color = rgb(255, val, val);

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
    animateBrezenhamCircle(currentTimestamp);
    animateWuLine(currentTimestamp);
    // setTimeout(() => requestAnimationFrame(animate), 10);
    requestAnimationFrame(animate);
}

function initialize() {
    document.addEventListener('mousemove', function(ev) {
        mouseX = ev.pageX;
        mouseY = ev.pageY;
    });

    requestAnimationFrame(animate);
}