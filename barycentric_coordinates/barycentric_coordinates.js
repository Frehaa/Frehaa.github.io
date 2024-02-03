'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

const MAP_TILE_SIZE = 50;

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}
// TODO: Translate screen space to canvas space

const state = {
    triangle: [1000, 300, 1100, 350, 1050, 400],
    colorTriangle: [200, 300, 800, 450, 400, 820],
    mousePosition: {x: 0, y:0}
}

function drawTriangle(ctx, triangle) {
    ctx.beginPath();
    ctx.moveTo(triangle[0], triangle[1]);
    ctx.lineTo(triangle[2], triangle[3]);
    ctx.lineTo(triangle[4], triangle[5]);
    ctx.closePath();
    ctx.stroke();
}

function drawMouseCartesianPosition(ctx) {
    const precision = 2
    const text = "Mouse cartesian coordinates:     ("+state.mousePosition.x.toFixed(precision) + ", " + state.mousePosition.y.toFixed(precision) + ")";
    ctx.font = '32px ariel'
    ctx.fillText(text, 100, 100);
}

function pointToBarycentricMethod1(point, triangle) { 
    const [xa, ya, xb, yb, xc, yc] = triangle;
    const {x, y} = point;

    const bn = (ya - yc) * x + (xc - xa) * y + xa * yc - xc * ya;
    const bd = (ya - yc) * xb + (xc - xa) * yb + xa * yc - xc * ya;
    const beta = bn/bd;
    const gn = (ya - yb) * x + (xb - xa) * y + xa * yb - xb * ya;
    const gd = (ya - yb)*xc + (xb - xa) * yc + xa * yb - xb * ya;
    const gamma = gn/gd;
    const alpha = 1 - beta - gamma;
    return [alpha, beta, gamma]
}

function pointToBarycentricMethod2(point, triangle) { 
    // TODO: calculate based on signed areas
    
}

function drawColorTriangle(buffer, triangle) {
    const minX = Math.min(triangle[0], triangle[2], triangle[4]);
    const maxX = Math.max(triangle[0], triangle[2], triangle[4]);
    const minY = Math.min(triangle[1], triangle[3], triangle[5]);
    const maxY = Math.max(triangle[1], triangle[3], triangle[5]);

    for (let y = 0; y < buffer.height; y++) {
        for (let x = 0; x < buffer.width; x++) {
            const [alpha, beta, gamma] = pointToBarycentricMethod1({x: x + minX, y: y + minY}, triangle);
            if (alpha >= 0 && beta >= 0 && gamma >= 0) {
                const index = 4 * (y * buffer.width + x);
                buffer.data[index] = 255 * alpha;
                buffer.data[index + 1] = 255 * beta;
                buffer.data[index + 2] = 255 * gamma;
                buffer.data[index + 3] = 255
            }
        }
    }
}

function drawMouseBarycentricPosition(ctx) {
    const precision = 2
    const [alpha, beta, gamma] = pointToBarycentricMethod1(state.mousePosition, state.triangle);
    // const text = "Mouse barycentric coordinates: (α="+alpha.toFixed(precision) + ", β=" + beta.toFixed(precision) + ", γ=" + gamma.toFixed(precision) + ")";
    const text = "Mouse barycentric coordinates: ("+alpha.toFixed(precision) + ", " + beta.toFixed(precision) + ", " + gamma.toFixed(precision) + ")";
    ctx.font = '32px ariel'
    ctx.fillText(text, 100, 140);
}

function getTriangleBoundingBox(triangle) {
    const minX = Math.min(triangle[0], triangle[2], triangle[4]);
    const maxX = Math.max(triangle[0], triangle[2], triangle[4]);
    const minY = Math.min(triangle[1], triangle[3], triangle[5]);
    const maxY = Math.max(triangle[1], triangle[3], triangle[5]);

    return [minX, minY, maxX, maxY];
}

let lastTime = 0;
// TODO: Draw map
// We first ignore camera and just say that 
function draw(time) {
    const dt = time - lastTime;
    lastTime = time;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawMouseCartesianPosition(ctx)
    drawMouseBarycentricPosition(ctx)

    drawTriangle(ctx, state.triangle);


    ctx.putImageData(state.colorImage, state.colorImage.width, state.colorImage.height);

    requestAnimationFrame(draw);
}

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    const [minX, minY, maxX, maxY] = getTriangleBoundingBox(state.colorTriangle);
    const width = maxX - minX;
    const height = maxY - minY;
    state.colorImage = ctx.getImageData(minX, minY, width, height);
    drawColorTriangle(state.colorImage, state.colorTriangle);

    function mouseDown(e) {
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: { // TODO: Movement should be done every frame after pressing down, not until it starts repeating
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
            case MOUSE_RIGHT_BUTTON: {
            } break;
            default: {}
        }
    }

    function mouseUp(e) {
        l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
        }
    }

    function keyDown(e) {
        l(e)
        switch (e.code) {
            case 'KeyN': {
            } break;
            case 'ShiftLeft': {
            }
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case 'ShiftLeft': {
            }
        }
    }
    l(canvas.clientWidth, canvas.clientWidth)

    function mouseMove(e) {
        // state.mousePosition = {
        //     x: e.screenX, 
        //     y: e.screenY
        // }
        state.mousePosition = {
            x: (e.pageX - e.target.offsetLeft)* (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        }
        // state.mousePosition = {
        //     x: (e.pageX - e.target.offsetLeft), //* (canvas.width / canvas.clientWidth), 
        //     y: (e.pageY - e.target.offsetTop)// * (canvas.height / canvas.clientHeight)
        // }
    }


    requestAnimationFrame(time => {
        lastTime = time;
        draw(time);
    });
}