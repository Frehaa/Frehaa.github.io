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
    let buffer = imageData.data;
    for (var y = y0; y < y1; ++y) {
        for (var x = x0; x < x1; ++x) {
            let offset = pixelOffset(imageData, x, y);
            writeColor(buffer, offset, color);
        }
    }
}

function drawHorizontalLine(imageData, x, y, length, color) {
    let buffer = imageData.data;
    for (var current = x; current <= x + length; ++current) {
        let offset = pixelOffset(imageData, current, y);
        writeColor(buffer, offset, color);
    }
}

function drawVerticalLine(imageData, x, y, length, color) {
    let buffer = imageData.data;
    for (var current = y; current <= y + length; ++current) {
        let offset = pixelOffset(imageData, x, current);
        writeColor(buffer, offset, color);
    }
}

function drawRect(imageData, x0, y0, x1, y1, color) {
    drawHorizontalLine(imageData, x0, y0, x1-x0, color);
    drawHorizontalLine(imageData, x0, y1, x1-x0, color);
    drawVerticalLine(imageData, x0, y0, y1-y0, color);
    drawVerticalLine(imageData, x1, y0, y1-y0, color);
}

// Bresenham's line algorithm
function drawLine(imageData, x0, y0, x1, y1, color) {
    let buffer = imageData.data;
    for (var y = y0; y < y1; ++y) {
        for (var x = x0; x < x1; ++x) {
            if (false) { // If on the line
                let offset = pixelOffset(imageData, x, y);
                writeColor(buffer, offset, color);
            }
        }
    }
}