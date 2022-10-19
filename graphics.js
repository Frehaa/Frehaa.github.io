"use strict";

function rgba(red, green, blue, alpha) {
    return {red, green, blue, alpha};
}

function rgb(red, green, blue) {
    return rgba(red, green, blue, 255);
}

function pixelOffset(imageData, x, y) {
    return 4 * (y * imageData.width + x);
}

function writeColor(buf8, offset, color) {
    buf8[offset + 0] = color.red;
    buf8[offset + 1] = color.green;
    buf8[offset + 2] = color.blue;
    buf8[offset + 3] = color.alpha;
}

function clear(imageData, color) {
    fillRect(imageData, 0, 0, imageData.width, imageData.height, color);
}

function fillRect(imageData, x0, y0, x1, y1, color) {
    for (var y = y0; y < y1; ++y) {
        for (var x = x0; x < x1; ++x) {
            let offset = pixelOffset(imageData, x, y);
            writeColor(imageData.data, offset, color);
        }
    }
}

function drawHorizontalLine(imageData, x, y, length, color) {
    for (var current = x; current <= x + length; ++current) {
        let offset = pixelOffset(imageData, current, y);
        writeColor(imageData.data, offset, color);
    }
}

function drawVerticalLine(imageData, x, y, length, color) {
    for (var current = y; current <= y + length; ++current) {
        let offset = pixelOffset(imageData, x, current);
        writeColor(imageData.data, offset, color);
    }
}

function drawRect(imageData, x0, y0, x1, y1, color) {
    drawHorizontalLine(imageData, x0, y0, x1-x0, color);
    drawHorizontalLine(imageData, x0, y1, x1-x0, color);
    drawVerticalLine(imageData, x0, y0, y1-y0, color);
    drawVerticalLine(imageData, x1, y0, y1-y0, color);
}

// Bresenham's line algorithm
function drawBresenhamLine(imageData, x0, y0, x1, y1, color) {
    function drawBresenhamLineLow(imageData, x0, y0, x1, y1, color) {
        let dx = x1 - x0,
            dy = y1 - y0,
            yi = 1;
        if (dy < 0) {
            yi = -1;
            dy = -dy;
        }
        let D = (2 * dy) - dx,
            y = y0;

        for (let x = x0; x <= x1; ++x) {
            let offset = pixelOffset(imageData, x, y);
            writeColor(imageData.data, offset, color);
            if (D > 0) {
                y = y + yi;
                D = D + (2 * (dy - dx));
            } else {
                D = D + 2 * dy;
            }
        }
    }
    function drawBresenhamLineHigh(imageData, x0, y0, x1, y1, color) {
        let dx = x1 - x0,
            dy = y1 - y0,
            xi = 1;
        if (dx < 0) {
            xi = -1;
            dx = -dx;
        }
        let D = (2 * dx) - dy,
            x = x0;

        for (let y = y0; y <= y1; ++y) {
            let offset = pixelOffset(imageData, x, y);
            writeColor(imageData.data, offset, color);
            if (D > 0) {
                x = x + xi;
                D = D + (2 * (dx - dy));
            } else {
                D = D + 2 * dx;
            }
        }
    }
    if (Math.abs(y1 - y0) < Math.abs(x1 - x0)) {
        if (x0 > x1) {
            drawBresenhamLineLow(imageData, x1, y1, x0, y0, color);
        } else {
            drawBresenhamLineLow(imageData, x0, y0, x1, y1, color);
        }
    } else {
        if (y0 > y1) {
            drawBresenhamLineHigh(imageData, x1, y1, x0, y0, color);
        } else {
            drawBresenhamLineHigh(imageData, x0, y0, x1, y1, color);
        }
    }
}

// Xiaolin Wu's line algorithm
function drawWuLine(imageData, x0, y0, x1, y1, color) {
    function fpart(x) {
        return x - Math.floor(x);
    }
    function rfpart(x) {
        return 1 - fpart(x);
    }
    let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) { // Swap
        [x0, y0] = [y0, x0];
        [x1, y1] = [y1, x1];
    }
    if (x0 > x1) { // Swap
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }

    let dx = x1 - x0;
    let dy = y1 - y0;
    let gradient = (x1 == x0)? 1.0 : dy / dx;

    let xend = Math.round(x0);
    let yend = y0 + gradient * (xend - x0);
    let xgap = fpart(x1 + 0.5);
    let xpxl2 = xend;
    let ypxl2 = Math.floor(yend);
    if (steep) {
        let offset = pixelOffset(imageData, x, y);
        writeColor(imageData.data, offset, color);

    } else {

    }
}

// Gupta-Sproull's line algorithm
function drawGuptaSproullLine(imageData, x0, y0, x1, y1, color) {
}

function drawBresenhamCircle(imageData, x, y, radius, color) {
}

// Cubic curve based on Control points
function drawCubicBezierCurve(imageData, x0, y0, x1, y1, tx0, ty0, tx1, ty1, steps, color) {
    
}

