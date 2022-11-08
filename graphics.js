"use strict";

// http://members.chello.at/~easyfilter/Bresenham.pdf

function clamp(x, minimum, maximum) {
    if (x > maximum) x = maximum;
    else if (x < minimum) x = minimum;
    return x;
}

function rgba(red, green, blue, alpha) {
    red = clamp(red, 0, 1);
    green = clamp(green, 0, 1);
    blue = clamp(blue, 0, 1);
    alpha = clamp(alpha, 0, 1);
    return {red, green, blue, alpha};
}

function rgb(red, green, blue) {
    return rgba(red, green, blue, 1);
}

function pixelOffset(imageData, x, y) {
    return 4 * (y * imageData.width + x);
}

function scaleColor(scalar, color) {
    return {
        red: color.red, 
        blue: color.blue, 
        green: color.green, 
        alpha: scalar * color.alpha
    };
}
// Assuming dest has alpha 1
function alphaBlendInto(source, buf8, offset) {
    buf8[offset + 0] = ((1-source.alpha) * buf8[offset + 0] + source.alpha * source.red) * 255;
    buf8[offset + 1] = ((1-source.alpha) * buf8[offset + 1] + source.alpha * source.green) * 255;
    buf8[offset + 2] = ((1-source.alpha) * buf8[offset + 2] + source.alpha * source.blue) * 255;
    buf8[offset + 3] = 255;
}

function writeColor(imageData, x, y, color) {
    let offset = pixelOffset(imageData, x, y);
    let buf8 = imageData.data;
    buf8[offset + 0] = color.red * 255;
    buf8[offset + 1] = color.green * 255;
    buf8[offset + 2] = color.blue * 255;
    buf8[offset + 3] = color.alpha * 255;
}

function blendColor(imageData, x, y, color) {
    let offset = pixelOffset(imageData, x, y);
    let buf8 = imageData.data;
    alphaBlendInto(color, buf8, offset);
}

function writeColorSim(imageData, x, y, pixelSize, color, writeColor) {
    for (let xp = x * pixelSize; xp < (x+1) * pixelSize; ++xp) {
        for (let yp = y * pixelSize; yp < (y+1) * pixelSize; ++yp) {
            writeColor(imageData, xp, yp, color);
        }
    }
}

function clear(imageData, color) {
    fillRect(imageData, 0, 0, imageData.width, imageData.height, color);
}

function fillRect(imageData, x0, y0, x1, y1, color) {
    for (var y = y0; y < y1; ++y) {
        for (var x = x0; x < x1; ++x) {
            writeColor(imageData, x, y, color);
        }
    }
}

function drawHorizontalLine(imageData, x, y, length, color) {
    for (var current = x; current <= x + length; ++current) {
        writeColor(imageData, x, y, color);
    }
}

function drawVerticalLine(imageData, x, y, length, color) {
    for (var current = y; current <= y + length; ++current) {
        writeColor(imageData, x, y, color);
    }
}

function drawRect(imageData, x0, y0, x1, y1, color) {
    drawHorizontalLine(imageData, x0, y0, x1-x0, color);
    drawHorizontalLine(imageData, x0, y1, x1-x0, color);
    drawVerticalLine(imageData, x0, y0, y1-y0, color);
    drawVerticalLine(imageData, x1, y0, y1-y0, color);
}

// Bresenham's line algorithm
function drawBresenhamLine(imageData, x0, y0, x1, y1, color, writeColor) {
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
            writeColor(imageData, x, y, color);
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
            writeColor(imageData, x, y, color);
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
function drawWuLine(imageData, x0, y0, x1, y1, color, writeColor) {
    function fpart(x) {
        return x - Math.floor(x);
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
    let intery = y0 + gradient * (x0 - Math.round(x0)) + gradient; 

    // First endpoint
    {
        let xend = Math.round(x0);
        let yend = y0 + gradient * (xend - x0);
        let xgap = fpart(x1 + 0.5);
        let xpxl1 = xend;
        let ypxl1 = Math.floor(yend);
        let brightness = fpart(yend) * xgap;
        if (steep) {
            writeColor(imageData, ypxl1, xpxl1, scaleColor(1-brightness, color));
            writeColor(imageData, ypxl1+1, xpxl1, scaleColor(brightness, color));
        } else {
            writeColor(imageData, xpxl1, ypxl1, scaleColor(1-brightness, color));
            writeColor(imageData, xpxl1, ypxl1+1, scaleColor(brightness, color));
        }
        intery = yend + gradient;
    }

    // Second endpoint
    {
        let xend = Math.round(x1);
        let yend = y1 + gradient * (xend - x1);
        let xgap = fpart(x1 + 0.5);
        let xpxl2 = xend;
        let ypxl2 = Math.floor(yend);

        let brightness = fpart(yend) * xgap;
        if (steep) {
            writeColor(imageData, ypxl2, xpxl2, scaleColor(1-brightness, color));
            writeColor(imageData, ypxl2+1, xpxl2, scaleColor(brightness, color));
        } else {
            writeColor(imageData, xpxl2, ypxl2, scaleColor(1-brightness, color));
            writeColor(imageData, xpxl2, ypxl2+1, scaleColor(brightness, color));
        }
    }

    // Main loop
    {
        let start = Math.round(x0);
        let end = Math.round(x1);
        if (steep) {
            for (let x = start + 1; x < end; ++x) {
                let brightness = fpart(intery);
                writeColor(imageData, Math.floor(intery),   x, scaleColor(1-brightness, color));
                writeColor(imageData, Math.floor(intery)+1, x, scaleColor(brightness, color));
                intery += gradient;
            }
        } else {
            for (let x = start + 1; x < end; ++x) {
                let brightness = fpart(intery);
                writeColor(imageData, x, Math.floor(intery), scaleColor(1-brightness, color));
                writeColor(imageData, x, Math.floor(intery)+1, scaleColor(brightness, color));
                intery += gradient;
            }
        }

    }
}

function drawWuCircle(imageData, cx, cy, radius, color) {

}

// Gupta-Sproull's line algorithm
function drawGuptaSproullLine(imageData, x0, y0, x1, y1, color) {
}

function drawBresenhamCircle(imageData, xm, ym, radius, color, writeColor) {
    let r = Math.round(radius);
    let x = -radius;
    let y = 0;
    let err = 2 - 2 * radius;
    while (x <= 0) {
        writeColor(imageData, xm - x, ym + y, color);
        writeColor(imageData, xm - x, ym - y, color);
        writeColor(imageData, xm + x, ym + y, color);
        writeColor(imageData, xm + x, ym - y, color);
        r = err;
        if (r <= y) { 
            ++y;
            err += y*2 + 1;
        }
        if (r > x || err > y) {
            ++x;
            err += x*2 + 1;
        }
    } 
}

// Cubic curve based on Control points
function drawCubicBezierCurve(imageData, x0, y0, x1, y1, tx0, ty0, tx1, ty1, steps, color) {
    
}


class CanvasPainter {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext("2d");
        // this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    }

    drawCircle(x, y, radius) {
        let start_angle = 0;
        let end_angle = 2 * Math.PI;
        let counter_clockwise = true;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, start_angle, end_angle, counter_clockwise);
        this.ctx.stroke();
    }

    drawLine(x0, y0, x1, y1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    drawRect(x, y, width, height) {
        let x0 = x;
        let y0 = y;
        let x1 = x + width;
        let y1 = y + height;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x0, y1);
        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x1, y0);
        this.ctx.lineTo(x0, y0);
        this.ctx.stroke();
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
};