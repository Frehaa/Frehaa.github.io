"use strict";

// Right now I have an issue where I will stroke the same area multiple times. This may create some ugly artifacts.
// TODO: Properly handle scaling. Right now the canvas goes 100% 100% with a fixed size of 1920 by 1280. If the window size is different then this results in weird figures
// TODO: Walking slides

function randomList(size) {
    const result = [];
    for (let i = 0; i < size; ++i) {
        result.push(Math.random());
    }
    return result;
}

function numberList(size) {
    const result = [];
    for (let i = 0; i < size; ++i) {
        result.push(i + 1);
    }
    return result;
}

function drawMatrix(ctx, leftX, topY, cellWidth, matrix, threshold) {
    const width = matrix.columns * cellWidth;
    const height = matrix.rows * cellWidth;
    ctx.beginPath()
    ctx.moveTo(leftX, topY)
    ctx.lineTo(leftX + width, topY)
    ctx.lineTo(leftX + width, topY + height)
    ctx.lineTo(leftX, topY + height)
    ctx.lineTo(leftX, topY)
    ctx.stroke();

    for (let i = 1; i < matrix.columns; ++i) {
        ctx.beginPath();
        ctx.moveTo(leftX + i * cellWidth, topY);
        ctx.lineTo(leftX + i * cellWidth, topY + height);
        ctx.stroke();
    }
    for (let i = 1; i < matrix.rows; ++i) {
        ctx.beginPath();
        ctx.moveTo(leftX, topY + i * cellWidth);
        ctx.lineTo(leftX + width, topY + i * cellWidth);
        ctx.stroke();        
    }

    for (let i = 0; i < matrix.rows * matrix.columns; ++i) {
        const x = i % matrix.columns;
        const y = Math.floor(i / matrix.columns);
        const value = matrix.data[i];
        if (value > threshold) {
            ctx.fillStyle = 'red';
        } else if (value < threshold) {
            ctx.fillStyle = 'green'
        } else {
            ctx.fillStyle = 'yellow'
        }

        drawValue(ctx, x, y, leftX, topY, cellWidth, matrix);
    }
}   

function makePositionStrictSaddlepoint(matrix, x, y) {
    const value = matrix.data[x + y * matrix.columns];
    console.log(value);

    for (let i = 0; i < matrix.columns; ++i) {
        if (i == x) continue;
        const val = matrix.data[i + y * matrix.columns];
        if (val > value) {
            matrix.data[i + y * matrix.columns] = Math.random() * value;
        }
    }
    for (let i = 0; i < matrix.rows; ++i) {
        if (i == y) continue;
        const val = matrix.data[x + i * matrix.columns];
        if (val < value) {
            matrix.data[x + i * matrix.columns] = Math.random() * (1 - value) + value;
        }
    }
}

function drawValue(ctx, x, y, leftX, topY, cellWidth, matrix) {
    const centerX = leftX + cellWidth / 2 + x * cellWidth;
    const centerY = topY + cellWidth / 2 + y * cellWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellWidth * 0.4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.font = "20px sans-serif";
    let value = matrix.data[x + y * matrix.columns];
    value = value.toString().slice(0, 6)
    ctx.fillText(value, centerX - cellWidth * 0.4, centerY);
    
}

function drawThresholdPicker(ctx, state) {
    // TODO: Threshold slider (Scuffed solution could be just to pick thresholds based on slide. E.g. 0.25, 0.5, 0.75, etc.)
    // The slider can go from 0 to 1 with random values, or we can go in increments of values in the matrix with 1 to n^2
    // In either case we would have to create the slider functionality
    const threshold = state.threshold;
    ctx.font = "32px sans-serif";
    ctx.fillText    (threshold, 100, 1000)
}

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;

    const state = initializeSlideshowState()
    initializeSlideshowEventListeners(canvas, state);

    const matrix = {
        columns: 10,
        rows: 8, 
        data: []
    };
    matrix.data = randomList(matrix.rows * matrix.columns); 
    makePositionStrictSaddlepoint(matrix, 4, 3); // Assumes random entries between 0 and 1

    //matrix.data = numberList(matrix.rows * matrix.columns); 
    //shuffle(matrix.data);
    
    let threshold = matrix.data[4 + 3 * matrix.columns] + (Math.random() > 0.5? 0.000000001 : -0.000000001);
    const thresholdState = {
        threshold: threshold
    }
    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, 10, 10, 75, matrix, thresholdState.threshold);
        drawThresholdPicker(ctx, thresholdState);
    }));

    state.startSlideShow(ctx);

    // TODO: Draw matrix
    // Draw values into matrix
    // Color depending on threshold
    // Change threshold and update colors
    // 

}