"use strict";

// TODO: Pick different colors for color blindness. E.g. for red-green colorblind
// We make them public and non-constant such that it can be changed from the console
let equalToColor = `#66CCEE`;
let greaterThanColor = '#EE6677';
let smallerThanColor = '#228833';
let fontColor = 'black'
let removedRowsColor = '#BBBBBB'
let unknownValueColor = '#BBBBBB'
let brightDistinctColor = '#CCBB44'
const slideTitleFont = "70px sans-serif";

// ######### HELPER FUNCTIONS ######

// Create list of "size" pseudorandom numbers with values between 0 and 1
function randomList(size) {
    const result = [];
    for (let i = 0; i < size; ++i) {
        result.push(Math.random());
    }
    return result;
}

function randomInt(max) { // max excluded
    return Math.floor(Math.random() * max)
}

// Generates list of numbers 1 to "size"
function numberList(size) {
    const result = [];
    for (let i = 0; i < size; ++i) {
        result.push(i + 1);
    }
    return result;
}

function matrixIndicesToCanvasCoords(x, y, matrixDrawSettings) {
    const {leftX, topY, cellWidth} = matrixDrawSettings;
    const canvasX = leftX + cellWidth / 2 + x * cellWidth;
    const canvasY = topY + cellWidth / 2 + y * cellWidth;
    return [canvasX, canvasY];
}

function canvasCoordsToMatrixIndices(x, y, matrixDrawSettings) {
    const {leftX, topY, cellWidth} = matrixDrawSettings;
    const matrixX = Math.floor((x - leftX) / cellWidth);
    const matrixY = Math.floor((y - topY) / cellWidth);
    return [matrixX, matrixY];
}

// ########### DRAWING FUNCTIONS ########

function drawMatrix(ctx, matrix, drawSettings) {
    const {leftX, topY, cellWidth, lineWidth} = drawSettings;
    const width = matrix.columns * cellWidth;
    const height = matrix.rows * cellWidth;
    ctx.lineWidth = lineWidth

    ctx.beginPath()
    ctx.rect(leftX, topY, width, height);               // Border
    for (let i = 1; i < matrix.columns; ++i) {          // Vertical lines
        ctx.moveTo(leftX + i * cellWidth, topY);
        ctx.lineTo(leftX + i * cellWidth, topY + height);
    }
    for (let i = 1; i < matrix.rows; ++i) {             // Horizontal lines
        ctx.moveTo(leftX, topY + i * cellWidth);
        ctx.lineTo(leftX + width, topY + i * cellWidth);
    }
    ctx.stroke();

    for (let y = 0; y < matrix.rows; ++ y) {            // Values
        for (let x = 0; x < matrix.columns; ++x) {
            drawSettings.drawMatrixValue(ctx, x, y, matrix); // Injected value-drawing method
        }
    }
}

function drawMatrixCircle(ctx, x, y, drawSettings) {
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    const radius = drawSettings.cellWidth * 0.4;
    drawCircle(centerX, centerY, radius, ctx);
}

function drawMatrixSquare(ctx, x, y, drawSettings) {
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    const leftX = centerX - drawSettings.cellWidth / 2;
    const topY = centerY - drawSettings.cellWidth / 2;
    ctx.fillRect(leftX, topY, drawSettings.cellWidth, drawSettings.cellWidth);
}

function writeMatrixValue(ctx, x, y, matrix, drawSettings) {
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    ctx.fillStyle = fontColor;
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const text = matrix.getValue(x, y).toString();
    ctx.fillText(text, centerX, centerY )
}

function drawMatrixCircleByThreshold(ctx, x, y, matrix, threshold, drawSettings) {
    const value = matrix.getValue(x, y);
    if (value > threshold) {
        ctx.fillStyle = greaterThanColor; 
    } else if (value < threshold) {
        ctx.fillStyle = smallerThanColor;
    } else {
        ctx.fillStyle = equalToColor
    }
    drawMatrixCircle(ctx, x, y, drawSettings);
}

// ######## SLIDES ######
function createSampleSlides(matrix, matrixDrawSettings) {
    const result = [];
    const removedRows = [];
    const rowsToSample = numberList(matrix.rows).map(v => v-1);
    let currentRemovedCount = 0;
    const allSamples = [];

    while (rowsToSample.length > 2 * (matrix.rows / Math.log2(matrix.rows))) {
        const samples = rowsToSample.map(row => [row, randomInt(matrix.columns)]);
        allSamples.push(...samples);

        const currentSampleCount = allSamples.length;
        const removedCountFirst = currentRemovedCount;
        const sampleSlide = createDrawSlide(ctx => {
            drawMatrix(ctx, matrix, matrixDrawSettings);
            ctx.fillStyle = smallerThanColor;
            allSamples.slice(0, currentSampleCount).forEach(sample => {
                drawMatrixCircle(ctx, sample[1], sample[0], matrixDrawSettings);
            });
            ctx.fillStyle = removedRowsColor;
            removedRows.slice(0, removedCountFirst).forEach(row => {
                for (let j = 0; j < matrix.columns; j++) {
                    drawMatrixSquare(ctx, j, row, matrixDrawSettings);
                }
            });
        })
        result.push(sampleSlide);

        const rowsToRemove = Math.ceil(samples.length * 0.2);
        shuffle(rowsToSample)
        for (let i = 0; i < rowsToRemove; ++i) {
            removedRows.push(rowsToSample.pop());
            currentRemovedCount++
        }

        const removedCountSecond = currentRemovedCount;
        result.push(createDrawSlide(ctx => {
            sampleSlide.draw(ctx);

            ctx.fillStyle = removedRowsColor
            removedRows.slice(0, removedCountSecond).forEach(row => {
                for (let j = 0; j < matrix.columns; j++) {
                    drawMatrixSquare(ctx, j, row, matrixDrawSettings);
                }
            });
        }));
    }

    for (let i = 0; i < Math.log2(matrix.rows); ++i) {
        const samples = rowsToSample.map(row => [row, randomInt(matrix.columns)]);
        allSamples.push(...samples);
    }
    result.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, matrixDrawSettings);
        ctx.fillStyle = smallerThanColor;
        allSamples.forEach(sample => {
            drawMatrixCircle(ctx, sample[1], sample[0], matrixDrawSettings);
        });
        ctx.fillStyle = removedRowsColor;
        removedRows.forEach(row => {
            for (let j = 0; j < matrix.columns; j++) {
                drawMatrixSquare(ctx, j, row, matrixDrawSettings);
            }
        });
    }));

    const bestRow = rowsToSample[0];
    result.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, matrixDrawSettings);
        ctx.fillStyle = smallerThanColor;
        allSamples.forEach(sample => {
            drawMatrixCircle(ctx, sample[1], sample[0], matrixDrawSettings);
        });
        ctx.fillStyle = removedRowsColor
        removedRows.forEach(row => {
            for (let j = 0; j < matrix.columns; j++) {
                drawMatrixSquare(ctx, j, row, matrixDrawSettings);
            }
        });

        ctx.fillStyle = equalToColor; 
        for (let j = 0; j < matrix.columns; j++) {
            drawMatrixSquare(ctx, j, bestRow, matrixDrawSettings);
        }


    }));
    return result;
}

function createWalkSlides(matrix, threshold, matrixDrawSettings, dogImage) {
    // Create path based on matrix and threshold
    const path = [];
    let currentX = 0;
    let currentY = 0;
    while (currentX < matrix.columns && currentY < matrix.rows) {
        path.push([currentX, currentY]);

        if (matrix.getValue(currentX, currentY) > threshold) {
            currentY += 1;
        } else {
            currentX += 1;
        }
    }
    path.push([currentX, currentY]);

    // Create Slides based on path
    const result = [];
    for (let i = 0; i < path.length; ++i) {
        result.push(createDrawSlide(ctx => {
            ctx.fillStyle = unknownValueColor;
            drawMatrix(ctx, matrix, matrixDrawSettings)
            drawMatrixCircleByThreshold(ctx, 0, 0, matrix, threshold, matrixDrawSettings);
            for (let j = 1; j <= i; ++j) {
                const [x, y] = path[j];
                if (j < path.length - 1) { // Skip the final j because it is outside the matrix
                    drawMatrixCircleByThreshold(ctx, x, y, matrix, threshold, matrixDrawSettings);
                }
            }
            const [x, y] = path[i];
            const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, matrixDrawSettings);

            const imageSize = matrixDrawSettings.cellWidth * 0.8;
            ctx.drawImage(dogImage, centerX - imageSize / 1.2 , centerY - imageSize / 3, imageSize, imageSize);
        }));
    }

    return result;
}
class SaddlepointSlideMatrix {
    constructor(rows, columns, dataInitializer) {
        this.columns = columns;
        this.rows = rows;
        this.data = dataInitializer(rows, columns);
    }

    getValue(x, y) {
        return this.data[x + y * this.columns];
    }
    setValue(x, y, v) {
        this.data[x + y * this.columns] = v;
    }

    isValidIndex(x, y) {
        return 0 <= x && x < this.columns && 0 <= y && y < this.rows;
    }
    swapRows(y1, y2) {
        if (y1 === y2) return;
        for (let x = 0; x < this.columns; x++) {
            this.swapEntries(x, y1, x, y2);
            
        }    

    }
    swapColumns(x1, x2) {
        if (x1 === x2) return;

        for (let y = 0; y < this.rows; y++) {
            this.swapEntries(x1, y, x2, y);
        }    

    }
    swapEntries(x1, y1, x2, y2) {
        const tmp = this.getValue(x1, y1);
        this.setValue(x1, y1, this.getValue(x2, y2)); 
        this.setValue(x2, y2, tmp); 
    }
}

function createTimer(positionX, positionY, radius, totalTimeMs) {
    return {
        draw: function(ctx, elapsedMs) {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(positionX, positionY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            const startAngle = -0.5 * Math.PI;
            const fillAngle = startAngle + (2 * Math.PI) * elapsedMs/totalTimeMs;

            ctx.fillStyle = fontColor
            ctx.beginPath();
            ctx.moveTo(positionX, positionY);
            ctx.lineTo(positionX, positionY - radius);
            ctx.arc(positionX, positionY, radius, startAngle, fillAngle, false);
            ctx.lineTo(positionX, positionY);
            ctx.fill();
            ctx.restore();
        }
    }
}

function createBulletPointWriter(ctx, font, leftX, topY, minorOffset, majorOffset) {
    return {
        currentY: topY - majorOffset, // We assume we always start with a major bullet
        writeMajorBullet(text) {
            this.currentY += majorOffset;
            ctx.fillText(text, leftX, this.currentY);
        },
        writeMinorBullet(text) {
            this.currentY += minorOffset;
            ctx.fillText(text, leftX, this.currentY);
        },
        startWriting() { // Reset before writing in a new frame
            ctx.font = font;
            this.currentY = topY - majorOffset; // We assume we always start with a major bullet
        }
    }
}

// 
function createVerticalThresholdSlider(slideshowState, thresholdState, drawSettings) {
    const {position, size, lineWidth} = drawSettings;
    const leftX = position.x;
    const topY = position.y;
    const width = size.width;
    const height = size.height;
    const arcHeight = width; 
    const centerX = leftX + width /2;
    const arclessTop = topY + arcHeight;
    const arclessBottom = topY + height - arcHeight;
    const slider = {
        color: fontColor,
        isInteractable: true,
        currentPosition: (thresholdState.value - thresholdState.min) / (thresholdState.max - thresholdState.min),
        draw: function(ctx) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = lineWidth
            ctx.beginPath()
            ctx.arc(centerX, arclessTop, width / 2, Math.PI + 0.001, -0.001);
            ctx.arc(centerX, arclessBottom, width / 2, 0.001, Math.PI - 0.001);
            ctx.moveTo(leftX, arclessTop);
            ctx.lineTo(leftX, arclessBottom);
            ctx.moveTo(leftX + width, arclessTop);
            ctx.lineTo(leftX + width, arclessBottom);
            ctx.stroke()

            if (this.isDragging){
                drawCircle(centerX, lerp(arclessBottom, arclessTop, this.currentPosition), width / 2 + lineWidth, ctx)
            } else {
                drawCircle(centerX, lerp(arclessBottom, arclessTop, this.currentPosition), width / 2 - lineWidth, ctx)
            }
        },
        isDragging: false,
        updateThresholdState: function() { 
            const y = clamp(slideshowState.mousePosition.y, arclessTop, arclessBottom);
            const percentage = 1 - (y - arclessTop) / (height - 2 * arcHeight);
            thresholdState.setValue(lerp(thresholdState.min, thresholdState.max, percentage));
        },
        mouseDown: function(e) {
            if (slideshowState.mousePosition.x < leftX || slideshowState.mousePosition.x > leftX + width ||
                slideshowState.mousePosition.y < topY || slideshowState.mousePosition.y > topY + height) return;
            if (e.button != 0) return; // Only left click
            this.isDragging = true;
            this.updateThresholdState();
        }, 
        mouseUp: function(e) {
            if (e.button != 0) return; // Only left click
            this.isDragging = false;
        },
        mouseMove: function() {
            if (!this.isDragging) return;
            this.updateThresholdState();
        }
    }
    // The slider position is updated based on a callback from the threshold state
    thresholdState.callbacks["slider"] = function() {
        slider.currentPosition = (thresholdState.value - thresholdState.min) / (thresholdState.max - thresholdState.min)
    }
    return slider;
}

function createThresholdState(min, max, initialValue) {
    return {
        value: initialValue,
        min: min, 
        max: max, 
        callbacks: {},
        setValue: function(value) {
            this.value = value;
            for (let c in this.callbacks) {
                this.callbacks[c](this);
            }
        },
    }
}

// TODO: is it a problem that, if we go back to slide 2 and 3, that the colors are drawn based on a new threshold?
function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'middle'

    const slideshowState = initializeSlideshowState()
    initializeSlideshowEventListeners(canvas, slideshowState);

    const matrix = new SaddlepointSlideMatrix(10, 10, () => goodNumberedMatrixData);

    const defaultMatrixDrawSettings = {
        leftX: 40,
        topY: 50,
        cellWidth: 100,
        lineWidth: 2
    };
    const matrixDrawSettingsDrawNumberedOnly = {
        ...defaultMatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix) {
            writeMatrixValue(ctx, x, y, matrix, this);
        }
    };
    const matrixDrawSettingsDrawColoredCircledValue = {
        ...defaultMatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix) {
            drawMatrixCircleByThreshold(ctx, x, y, matrix, thresholdState.value, this);
            writeMatrixValue(ctx, x, y, matrix, this);
        }
    };
    const matrixDrawSettingsDrawCircleOnly = {
        ...defaultMatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y) {
            drawMatrixCircle(ctx, x, y, this);
        }
    };
    const thresholdX = Math.floor(matrix.columns * 0.71);
    const thresholdY = Math.floor(matrix.rows * 0.47);

    const thresholdState = createThresholdState(Math.min(...matrix.data), Math.max(...matrix.data), matrix.getValue(thresholdX, thresholdY));
    function updateThresholdStateFromCanvasPosition(e) {
        if (e.button != 0) return; // Only left click
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, defaultMatrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;

        thresholdState.setValue(matrix.getValue(matrixX, matrixY));
    }

    const slideBulletFont = "48px sans-serif";
    const slideTextDefaultX = 1100
    const slideTitleTextDefaultY = 80;
    const slideTextBulletPointStartY = 200
    const slideTextBulletPointMajorOffsetY = 75
    const slideTextBulletPointMinorOffsetY = 50

    const bulletPointWriter = createBulletPointWriter(ctx, slideBulletFont, slideTextDefaultX, slideTextBulletPointStartY, slideTextBulletPointMinorOffsetY, slideTextBulletPointMajorOffsetY);

    const sliderDrawSettings = {
        position: {x: 1060, y: 100},
        size: {width: 20, height: 900},
        lineWidth: 2
    };
    const slider = createVerticalThresholdSlider(slideshowState, thresholdState, sliderDrawSettings);

    const logStarMatrixDrawSettings = {
        leftX: 40,
        topY: 50,
        cellWidth: 1000 / 70,
        lineWidth: 0.5, 
        drawMatrixValue: function(ctx, x, y, matrix) {
            writeMatrixValue(ctx, x, y, matrix, this);
        }
    }
    const logStarAlgSlides = createLogStarAlgSlides(slideshowState, logStarMatrixDrawSettings);
    slideshowState.addSlide(combineSlides(logStarAlgSlides, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("O(n log* n)", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("1. Divide matrix into r-sized chunks");
        bulletPointWriter.writeMajorBullet("(r = ⌈log(n)⌉)");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("2. Run the sort-based algorithm");
        bulletPointWriter.writeMajorBullet("recursively on chunks to ");
        bulletPointWriter.writeMajorBullet("compute Pseudo saddlepoints");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("3. Used chunk pseudo saddlepoints");
        bulletPointWriter.writeMajorBullet("to compute pseudo saddlepoint");
        bulletPointWriter.writeMajorBullet('value "p" of the whole matrix');
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet('4. Do the walk with value "p"');
    })));
    slideshowState.addSlide(combineSlides(logStarAlgSlides, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("O(n log* n)", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("Construct diagonal to avoid recursive");
        bulletPointWriter.writeMajorBullet("calls outside of overlapping diagonal");
        bulletPointWriter.writeMajorBullet("parts");

    })));

    const antiDiagonalSlide = createAntiDiagonalSlides(slideshowState, matrixDrawSettingsDrawNumberedOnly)
    slideshowState.addSlide(combineSlides(antiDiagonalSlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Diagonal Construction", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("Instead of computing the diagonal");
        bulletPointWriter.writeMajorBullet("we construct it");
        bulletPointWriter.writeMajorBullet("1. Probe the anti-diagonal");
        bulletPointWriter.writeMajorBullet("2. Find the median");
        bulletPointWriter.writeMajorBullet("3. Partition elements");
        bulletPointWriter.writeMajorBullet("4. Change upper left to median");
        bulletPointWriter.writeMajorBullet("5. Recurse on bottom right");
    })));
    const bienstockSlide = createBienstockSlides(slideshowState, matrixDrawSettingsDrawNumberedOnly)
    slideshowState.addSlide(combineSlides(bienstockSlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Diagonal Sort Algorithm", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("1. Probe the diagonal");
        bulletPointWriter.writeMajorBullet("2. Maintain min and max");
        bulletPointWriter.writeMajorBullet("3. Probe intersection");
        bulletPointWriter.writeMajorBullet("4. Eliminate rows and/or columns");
        bulletPointWriter.writeMajorBullet("5. Repeat until single value");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("(Works on non-square matrices)");
    })));

    // Slide 1: Introduction
    const instanceOptimalIntroSlide = createBulletPointSlides("In Search of Instance Optimality", [
        "We now have an Ω(n²) for the general non-strict saddlepoint problem",
        "and an O(n) algorithm for the strict saddlepoint problem.",
        "",
        "So is there anything in-between?",
        "And can we make an algorithm which adapts to the instance?"
    ], {
        titleFont: slideTitleFont,
        titleStart: slideTitleTextDefaultY,
        bulletFont: "48px sans-serif",
        bullet: " ",
        bulletStartLeft: 100,
        bulletStartTop: slideTextBulletPointStartY,
        bulletOffset: 80,
        bulletByBullet: false
    })[0];
    slideshowState.addSlide(instanceOptimalIntroSlide)
    slideshowState.addSlide(combineSlides(instanceOptimalIntroSlide, createDrawSlide(ctx => {
        ctx.font = "55px bold sans-serif";
        ctx.fillStyle = 'red'
        ctx.fillText("Yes!", 860, 438);
        ctx.fillText("Kind of...", 1500, 518);
    })));

    // NOTES FOR RANDOM
    // WE WANT TO HAVE A LOWER BOUND 
    // THE LOWER BOUND SHOULD BE LARGER THAN SOMETHING IN MANY COLUMNS
    // WE CAN DELETE COLUMNS FROM SEARCH IF THERE IS A VALUE SMALLER THAN LOWER BOUND

    
    slideshowState.slides.push(createDrawSlide(ctx => {
        const margin = 5;
        const offsetX = 5;
        const width = 12;
        const height = 99;
        ctx.strokeRect(defaultMatrixDrawSettings.leftX, defaultMatrixDrawSettings.topY, 1000, 1000);
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(defaultMatrixDrawSettings.leftX + margin + i * width + i * offsetX, defaultMatrixDrawSettings.topY + margin + i * height, width, height);
        }

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Anything in-between?", slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- White is 0s black is 1s");
        bulletPointWriter.writeMajorBullet("- log(n) columns with 1s");
        bulletPointWriter.writeMajorBullet("- If we consider the family of this");
        bulletPointWriter.writeMajorBullet("type of instance, then an algorithm");
        bulletPointWriter.writeMajorBullet("can solve it O(n log n) probes");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("We expect a certificate as the result");
    }));

    const slideNormalizationMatrixNormalized = new SaddlepointSlideMatrix(10, 10, () => normalizationMatrixNormalized);
    const slideNormalizationMatrix = new SaddlepointSlideMatrix(10, 10, () => normalizationMatrix);
    slideshowState.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, slideNormalizationMatrix, matrixDrawSettingsDrawNumberedOnly);
        
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Normalization", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Instead of arbitrary values we can");
        bulletPointWriter.writeMajorBullet(" work with just 0, +1, and -1");
        bulletPointWriter.writeMajorBullet("- 0 is the candidate SP value");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("");
    }));

    const normHowSlide = createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Normalization: How?", slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Find a PSP value p using O(n)");
        bulletPointWriter.writeMajorBullet(" algorithm for SSP");
        bulletPointWriter.writeMajorBullet("- Replace entries with: ");
        bulletPointWriter.writeMajorBullet("    - value = p with 0");
        bulletPointWriter.writeMajorBullet("    - value < p with -1");
        bulletPointWriter.writeMajorBullet("    - value > v with +1");
    });

    slideshowState.slides.push(combineSlides(normHowSlide, createDrawSlide(ctx => {
        thresholdState.setValue(52);
        drawMatrix(ctx, slideNormalizationMatrix, matrixDrawSettingsDrawColoredCircledValue);
    })));

    const normalizedMatrixSlide = createDrawSlide(ctx => {
        thresholdState.setValue(0);
        drawMatrix(ctx, slideNormalizationMatrixNormalized, matrixDrawSettingsDrawColoredCircledValue);
    });
    slideshowState.slides.push(combineSlides(normHowSlide, normalizedMatrixSlide));

    const normWhySlide = createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Normalization: Why?", slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Focuses on the hard part");
        bulletPointWriter.writeMajorBullet("- Simplifies algorithm");
        bulletPointWriter.writeMajorBullet("    - Find  -1: eliminate column");
        bulletPointWriter.writeMajorBullet("    - Find +1: eliminate row");
        bulletPointWriter.writeMajorBullet("- Split the search for +1s and -1s");
        bulletPointWriter.writeMajorBullet("into two parallel searches.");
    });
    slideshowState.slides.push(combineSlides(normWhySlide, normalizedMatrixSlide));




    // COLUMN DELETE SLIDES
    const columnDeleteSlide =createNervousAlgSlide(slideshowState, matrixDrawSettingsDrawNumberedOnly); 
    slideshowState.addSlide(combineSlides(columnDeleteSlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('The "Nervous" Algorithm', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("In four steps:");
        bulletPointWriter.writeMajorBullet("1. Randomly probe new cell for a +1");
        bulletPointWriter.writeMajorBullet("2. Explore its column")
        bulletPointWriter.writeMajorBullet("3. Stop searching rows with found +1")
        bulletPointWriter.writeMajorBullet("4. Repeat until done")
        bulletPointWriter.writeMajorBullet("")
        bulletPointWriter.writeMajorBullet("(Search for -1s is symmetric)")
    })));
    slideshowState.addSlide(combineSlides(columnDeleteSlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('Algorithm analysis', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("We can split the cost into two parts:");
        bulletPointWriter.writeMajorBullet('1. Finding the first +1 of a column')
        bulletPointWriter.writeMajorBullet('2. Exploring the columns')
        bulletPointWriter.writeMajorBullet('')
        bulletPointWriter.writeMajorBullet("For point 1, an optimal algorithm  ")
        bulletPointWriter.writeMajorBullet('cannot generally be better than')
        bulletPointWriter.writeMajorBullet("random guessing")
        bulletPointWriter.writeMajorBullet('')
        bulletPointWriter.writeMajorBullet("For point 2, on a particular family");
        bulletPointWriter.writeMajorBullet("of instances, the optimal work");
        bulletPointWriter.writeMajorBullet("is lower bounded by Set Cover")
    })));

    // SET COVER SLIDES
    const setCoverSlides = createSetCoverSlide();
    setCoverSlides.forEach(s => slideshowState.addSlide(s));



    slideshowState.addSlide(createBulletPointSlides("Why relate to Set Cover?", [
        'The Nervous Algorithm behaves a bit like a "Greedy" algorithm for Set Cover',
        "Greedy cannot guarantee to be less than a log n factor close to optimal",
        "This applies to the traditional Set Cover problem, but we are a bit different",
        "The cost of picking a set (exploring a column) decreases as rows are removed",
        "So does the log n factor remain in our setting?"
    ], {
        titleFont: slideTitleFont,
        titleStart: slideTitleTextDefaultY,
        bulletFont: "48px sans-serif",
        bullet: "-",
        bulletStartLeft: 100,
        bulletStartTop: slideTextBulletPointStartY,
        bulletOffset: 75,
        bulletByBullet: false
    })[0]);



    
    
    const setCoverBarSlides = createSetCoverBarSlides();
    setCoverBarSlides.forEach(s => slideshowState.addSlide(s));


    // Slide 2: Explanation
    slideshowState.slides.push(createDrawSlide(ctx => {
        ctx.fillStyle = equalToColor
        drawMatrixCircle(ctx, thresholdX, thresholdY, defaultMatrixDrawSettings)
        drawMatrix(ctx, matrix, matrixDrawSettingsDrawNumberedOnly);

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("What is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Maximum value in its row");
        bulletPointWriter.writeMajorBullet("- Minimum value in its column");
    }));


    // Slide 3: Explanation with color
    slideshowState.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("What is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
        ctx.font = "40px sans-serif";
        ctx.fillText("(colored edition)", 1300, 135);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Surrounded by green in row");
        bulletPointWriter.writeMajorBullet("- Surrounded by red in column");
        bulletPointWriter.writeMajorBullet("- Does not necessarily exist");
        bulletPointWriter.writeMajorBullet("- We are interested in the strict case");

        const circleRadius = defaultMatrixDrawSettings.cellWidth * 0.4
        // First circle comparison legend
        ctx.fillStyle = smallerThanColor;
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = equalToColor;
        drawCircle(1280, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("<", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = greaterThanColor;
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = equalToColor;
        drawCircle(1280, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText(">", 1200, redCircleLegendHeight);
    }));

    // Slide 4: Motivation
    slideshowState.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Why is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Pure strategy equilibrium");
        bulletPointWriter.writeMinorBullet("  in a zero-sum two player game");
        bulletPointWriter.writeMajorBullet("- In simple terms, a solution for chess");
        bulletPointWriter.writeMinorBullet("  (though not a strict saddlepoint)");
        bulletPointWriter.writeMajorBullet("- Fast algorithms are interesting");
        bulletPointWriter.writeMinorBullet("  when values may be generated on");
        bulletPointWriter.writeMinorBullet("  demand");

    }));

    // Slide 5: History
    const bulletPointSlide = createBulletPointSlides("When is a saddlepoint?", [
        "Optimal O(n^2) algorithm for non-strict saddlepoint in 1968",
        "O(n^1.59) algorithm for strict in 1988",
        "O(n log n) in 1991",
        "n log n lower bound question in Dagstuhl 2023",
        "Now: O(n log*n) deterministic & O(n) randomized sampling algorithm",
    ], {
        titleFont: slideTitleFont,
        titleStart: slideTitleTextDefaultY,
        bulletFont: "48px sans-serif",
        bullet: "-",
        bulletStartLeft: 100,
        bulletStartTop: slideTextBulletPointStartY,
        bulletOffset: 75,
        bulletByBullet: false
    })[0];
    slideshowState.slides.push(combineSlides(bulletPointSlide, createDrawSlide(ctx => {})));

    // Slide 6: lower and upper bounds
    let interactiveNumberSlide = createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("How is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
        ctx.font = "40px sans-serif";
        ctx.fillText("(rows and columns)", 1250, 135);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet('- Guess a value "t" for saddlepoint "s"');
        bulletPointWriter.writeMajorBullet("- t < s ⇒ there is a column of red");
        bulletPointWriter.writeMinorBullet("  (no column of red ⇒ t >= s)");
        bulletPointWriter.writeMajorBullet("- t > s ⇒ there is a row of green");
        bulletPointWriter.writeMinorBullet("  (no row of green ⇒ t <= s)");

        const circleRadius = defaultMatrixDrawSettings.cellWidth * 0.4
        // First circle comparison legend
        ctx.fillStyle = smallerThanColor;
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = greaterThanColor;
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("> t", 1200, redCircleLegendHeight);
    });
    interactiveNumberSlide.isInteractable = true;
    interactiveNumberSlide.mouseDown = updateThresholdStateFromCanvasPosition; 
    slideshowState.slides.push(combineSlides(slider, interactiveNumberSlide));

    // Slide 7: Reducing search space
    interactiveNumberSlide = createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("How is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
        ctx.font = "40px sans-serif";
        ctx.fillText("(lower/upper bounds)", 1250, 135);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet('- A lower bound means s cannot be');
        bulletPointWriter.writeMinorBullet("  in a column with a lower value");
        bulletPointWriter.writeMinorBullet("  (because s cannot be minimum)");
        bulletPointWriter.writeMajorBullet('- An upper bound means s cannot be');
        bulletPointWriter.writeMinorBullet("  in a row with a higher value");
        bulletPointWriter.writeMinorBullet("  (because s cannot be maximum)");

        const circleRadius = defaultMatrixDrawSettings.cellWidth * 0.4
        // First circle comparison legend
        ctx.fillStyle = smallerThanColor;
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = greaterThanColor;
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("> t", 1200, redCircleLegendHeight);

    });
    interactiveNumberSlide.isInteractable = true;
    interactiveNumberSlide.mouseDown = updateThresholdStateFromCanvasPosition;
    slideshowState.slides.push(combineSlides(slider,interactiveNumberSlide));

    // Walking algorithm
    const dogImage = new Image();
    dogImage.src = "../saddlepoint/dog_shibainu_brown.png"; // Relative path
    const walkMatrix = new SaddlepointSlideMatrix(10, 10, () => goodWalkMatrixData);

    const greenCircleLegendHeight = 700;
    const redCircleLegendHeight = 800;

    const walkSlides = createWalkSlides(walkMatrix, goodWalkMatrixData[99], matrixDrawSettingsDrawCircleOnly, dogImage);
    slideshowState.slides.push(...walkSlides.map(slide => { // Create the walk slides and then update them
        return combineSlides(slide, createDrawSlide(ctx => {
            ctx.fillStyle = fontColor;
            ctx.textAlign = 'left'
            ctx.font = slideTitleFont;
            ctx.fillText("How is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
            ctx.font = "40px sans-serif";
            ctx.fillText("(linear time reduction)", 1250, 135);

            bulletPointWriter.startWriting();
            bulletPointWriter.writeMajorBullet('- Go for a walk using guess t');
            bulletPointWriter.writeMajorBullet("- Walk right on green value");
            bulletPointWriter.writeMajorBullet("- Walk down on red value");
            bulletPointWriter.writeMajorBullet("- Either visit all columns or all rows");

            const circleRadius = defaultMatrixDrawSettings.cellWidth * 0.4
            // First circle comparison legend
            ctx.fillStyle = smallerThanColor;
            drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = fontColor;
            ctx.fillText("< t", 1200, greenCircleLegendHeight);

            // Second circle comparison legend
            ctx.fillStyle = greaterThanColor;
            drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = fontColor;
            ctx.fillText("> t", 1200, redCircleLegendHeight);

        }));
    }));

    // Explain diagonal algorithm and issue
    slideshowState.slides.push(combineSlides(walkSlides[walkSlides.length-1], createDrawSlide(ctx => {
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("How is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
        ctx.font = "40px sans-serif";
        ctx.fillText("(linear time reduction)", 1250, 135);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Pick t greater than many columns ");
        bulletPointWriter.writeMinorBullet("  and smaller than many rows ");
        bulletPointWriter.writeMinorBullet("  (e.g. median of diagonal) ");
        bulletPointWriter.writeMajorBullet("- May only remove rows or columns");
        bulletPointWriter.writeMinorBullet("  in every iteration");
        bulletPointWriter.writeMajorBullet("- Fine for O(n log log n) algorithm");
        bulletPointWriter.writeMinorBullet("  with an extra trick");

        const circleRadius = defaultMatrixDrawSettings.cellWidth * 0.4
        // First circle comparison legend
        ctx.fillStyle = smallerThanColor;
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = greaterThanColor;
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = fontColor;
        ctx.fillText("> t", 1200, redCircleLegendHeight);

    })));

    // Explain sampling process
    const samplingMatrix = new SaddlepointSlideMatrix(100, 100, (rows, columns) => randomList(rows * columns));
    const samplingMatrixDrawSettings = {
        ...matrixDrawSettingsDrawCircleOnly,
        cellWidth: 1000 / samplingMatrix.columns,
        drawMatrixValue: function() {}, // Leave values empty seems to work well for the big thing
        lineWidth: 1
    };
    const samplingThresholdState = createThresholdState(0, 1, 1);
    const samplingSlider = createVerticalThresholdSlider(slideshowState, samplingThresholdState, sliderDrawSettings);

    const sampleSlides = createSampleSlides(samplingMatrix, samplingMatrixDrawSettings);
    slideshowState.slides.push(...sampleSlides.map(slide => {
        return combineSlides(slide, samplingSlider, createDrawSlide(ctx => {
            ctx.fillStyle = fontColor;
            ctx.textAlign = 'left'
            ctx.font = slideTitleFont;
            ctx.fillText("How is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
            ctx.font = "40px sans-serif";
            ctx.fillText("(randomly guessing better)", 1200, 135);

            bulletPointWriter.startWriting()
            bulletPointWriter.writeMajorBullet("- Sample in every row");
            bulletPointWriter.writeMajorBullet("- Remove some of the biggest rows");
            bulletPointWriter.writeMajorBullet("- Repeat until few rows");
            bulletPointWriter.writeMajorBullet("- Sample some more in remaining");
            bulletPointWriter.writeMajorBullet("- Pick the maximum in the best row");
            bulletPointWriter.writeMajorBullet("- All in linear time");

            const circleRadius = defaultMatrixDrawSettings.cellWidth * 0.4
            // Second circle comparison legend
            ctx.fillStyle = smallerThanColor;
            drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = fontColor;
            ctx.fillText("< t", 1200, greenCircleLegendHeight);

            // Second circle comparison legend
            ctx.fillStyle = removedRowsColor
            drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = fontColor;
            ctx.fillText(" There is a value in row > t", 1200, redCircleLegendHeight);

        }));
    }));
    slideshowState.startSlideShow(ctx);
}

function createAntiDiagonalSlides(slideshowState, drawMatrixSettings) {
    const rowCount = 7;
    const columnCount = 7;
    const state = {
        visibleNumbers: new Set(),
        deletedValues: new Set(),
        hoverCell: {x: -1, y: -1},
        drag: null,
        dragDelete: false,
        medianValue: null,
        reset: function() {
            state.medianValue = null,
            state.visibleNumbers = new Set();
            state.deletedValues = new Set()
            state.matrix = new SaddlepointSlideMatrix(6, 6, () => [...bienstockNumbers]);
        },
        matrix: new SaddlepointSlideMatrix(rowCount, columnCount, () => [...bienstockNumbers])
    };
    const draw = ctx => {
        drawMatrix(ctx, state.matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                const value = matrix.getValue(x, y);
                if (state.hoverCell.x == x && state.hoverCell.y == y) {
                    ctx.fillStyle  = 'rgba(100, 100, 100, 0.2)'; 
                    drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                }
                if (state.visibleNumbers.has(value)) {
                    if (value === state.medianValue) {
                        ctx.fillStyle  = 'rgba(0, 140, 255, 0.5)'; 
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                    drawMatrixSettings.drawMatrixValue(ctx, x, y, matrix); 
                }
                
            }
        });
    };
    const mouseDown = e => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);

        if (e.button === 2) {
            state.dragDelete = true;
            if (state.matrix.isValidIndex(matrixX, matrixY)) {
                state.matrix.setValue(matrixX, matrixY, state.medianValue);
            }
            return;
        }

        if (e.button !== 0) return; // Only left click for now

        if (!state.matrix.isValidIndex(matrixX, matrixY)) return;

        state.drag = {
            x: matrixX, 
            y: matrixY
        };
    };
    const mouseUp = e => {
        if (e.button === 2) {
            state.dragDelete = false;
            return
        }
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);

        if (!state.matrix.isValidIndex(matrixX, matrixY)) return;
        const v = state.matrix.getValue(matrixX, matrixY);

        if (e.button === 1) {
            state.medianValue = v;
        }

        if (state.drag !== null && (state.drag.x != matrixX || state.drag.y != matrixY)) {
            state.matrix.swapColumns(matrixX, state.drag.x);
            state.matrix.swapRows(matrixY, state.drag.y);
        } else if (e.button === 0) {
            state.visibleNumbers.add(v);
        }

        state.drag = null;

    };
    const mouseMove = () => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        state.hoverCell.x = matrixX;
        state.hoverCell.y = matrixY;

        if (state.dragDelete && state.matrix.isValidIndex(matrixX, matrixY)) {
            state.matrix.setValue(matrixX, matrixY, state.medianValue);
        }
    }
    let keypressEvents = event => {
        if (event.code === 'KeyR') {
            state.reset();
        } else if (event.code === 'KeyM') {
            if (state.medianValue === null) {
                state.medianValue = 38;
            } else if (state.medianValue == 38) {
                state.medianValue = 32;
            } else if (state.medianValue == 32) {
                state.medianValue = 8;
            }
        }
    }
    const slideStart = () => {
        document.addEventListener('keyup', keypressEvents);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', keypressEvents)
    }
    return createSlide(
        draw, 
        slideStart,
        slideEnd,
        mouseDown,
        mouseUp,
        mouseMove,
    );

}

function createBienstockSlides(slideshowState, drawMatrixSettings) {
    const rowCount = 6;
    const columnCount = 6;
    const state = {
        visibleNumbers: new Set(),
        deletedValues: new Set(),
        hoverCell: {x: -1, y: -1},
        drag: null,
        dragDelete: false,
        reset: function() {
            state.visibleNumbers = new Set();
            state.deletedValues = new Set()
            state.matrix = new SaddlepointSlideMatrix(6, 6, () => [...bienstockNumbers]);
        },
        matrix: new SaddlepointSlideMatrix(rowCount, columnCount, () => [...bienstockNumbers])
    };
    const draw = ctx => {
        drawMatrix(ctx, state.matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                const value = matrix.getValue(x, y);
                if (state.hoverCell.x == x && state.hoverCell.y == y) {
                    ctx.fillStyle  = 'rgba(100, 100, 100, 0.2)'; 
                    drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                }
                if (state.deletedValues.has(value)) {
                    ctx.fillStyle  = 'rgba(200, 0, 0, 1)'; 
                    drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                }else if (state.visibleNumbers.has(value)) {
                    drawMatrixSettings.drawMatrixValue(ctx, x, y, matrix); 
                }
                
            }
        });
    };
    const mouseDown = e => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);

        if (e.button === 2) {
            state.dragDelete = true;
            if (state.matrix.isValidIndex(matrixX, matrixY)) {
                const value = state.matrix.getValue(matrixX, matrixY)
                state.deletedValues.add(value);
            }
            return;
        }

        if (e.button !== 0) return; // Only left click for now

        if (!state.matrix.isValidIndex(matrixX, matrixY)) return;

        state.drag = {
            x: matrixX, 
            y: matrixY
        };
    };
    const mouseUp = e => {
        if (e.button === 2) {
            state.dragDelete = false;
            return
        }
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);

        if (!state.matrix.isValidIndex(matrixX, matrixY)) return;
        const v = state.matrix.getValue(matrixX, matrixY);

        if (e.button === 1) {
            state.deletedValues.delete(v);
            state.visibleNumbers.add(v);
        }

        if (state.drag !== null && (state.drag.x != matrixX || state.drag.y != matrixY)) {
            state.matrix.swapColumns(matrixX, state.drag.x);
            state.matrix.swapRows(matrixY, state.drag.y);
        } else if (e.button === 0) {
            state.visibleNumbers.add(v);
        }

        state.drag = null;


    };
    const mouseMove = () => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        state.hoverCell.x = matrixX;
        state.hoverCell.y = matrixY;

        if (state.dragDelete && state.matrix.isValidIndex(matrixX, matrixY)) {
            const value = state.matrix.getValue(matrixX, matrixY)
            state.deletedValues.add(value);
        }
    }
    let resetOnRPress = event => {
        if (event.code === 'KeyR') {
            state.reset();
        } 
    }
    const slideStart = () => {
        document.addEventListener('keyup', resetOnRPress);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', resetOnRPress)
    }
    return createSlide(
        draw, 
        slideStart,
        slideEnd,
        mouseDown,
        mouseUp,
        mouseMove,
    );
}

function spAndPspSlides(drawMatrixSettings) {
    const rowCount = 10;
    const columnCount = 10;
    const state = {
        visibleNumbers: new Map(),
        deletedRows: new Set(),
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.visibleNumbers = new Map();
            state.deletedRows = new Set()
        }
    };
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...columnAlgorithmNumbers]);
    const draw = ctx => {
        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                const rowSet = state.visibleNumbers.getOrInsert(x, new Set());
                if (state.hoverCell.x == x && state.hoverCell.y == y) {
                    ctx.fillStyle  = 'rgba(100, 100, 100, 0.2)'; 
                    drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                }
                if (state.deletedRows.has(y)) {
                    ctx.fillStyle  = 'rgba(200, 200, 200, 1)'; 
                    for (let rowX = 0; rowX < columnCount; rowX++) {
                        drawMatrixSquare(ctx, rowX, y, drawMatrixSettings);
                    }
                }else if (rowSet.has(y)) {
                    drawMatrixSettings.drawMatrixValue(ctx, x, y, matrix); 
                }
                
            }
        });
    };
    const mouseDown = e => {
        if (e.button == 1) { // MIDDLE MOUSE BUTTON
            state.reset()
        } 
    };
    const mouseUp = e => {
        console.log(slideshowState)
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        const rowSet = state.visibleNumbers.getOrInsert(matrixX, new Set()); 
        rowSet.add(matrixY);// We allow insertion of invalid values like (-1 and 11)
        if (matrixX < 0) {
            if (!state.deletedRows.delete(matrixY)) {
                state.deletedRows.add(matrixY)
            }
        }
    };
    const mouseMove = () => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        state.hoverCell.x = matrixX;
        state.hoverCell.y = matrixY;
    }
    let resetOnRPress = event => {
        if (event.code === 'KeyR') {
            state.reset();
        }
    }
    const slideStart = () => {
        document.addEventListener('keyup', resetOnRPress);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', resetOnRPress)
    }
    return createSlide(
        draw, 
        slideStart,
        slideEnd,
        mouseDown,
        mouseUp,
        mouseMove,
    );

}

function createLogStarAlgSlides(slideshowState, drawMatrixSettings) {
    const rowCount = 70;
    const columnCount = 70;
    const state = {
        step: 0,
        hoverCell: {x: -1, y: -1},
        queriedSuperCells: new Set(),
        queriedSuperCellsNonRec: new Set(),
        reset: function() {
            state.step = 0;
            state.queriedSuperCells= new Set();

        }
    };
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...columnAlgorithmNumbers]);
    const draw = ctx => {
        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                const superX = Math.floor(x / 7);
                const superY = Math.floor(y / 7);

                const flatSuperIndex = superX + columnCount * superY;

                if (state.queriedSuperCellsNonRec.has(flatSuperIndex)) {
                    ctx.fillStyle = 'rgba(0, 200, 0, 0.8)'
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                    return
                }
                else if (state.queriedSuperCells.has(flatSuperIndex)) {
                    ctx.fillStyle = 'rgba(200, 0, 0, 0.8)'
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                    return 
                }
                if (state.step > 0) {
                    if (rowCount -1 - x === y) {
                        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                }
                if (state.step > 2) {
                    if (rowCount -1 + 36 - x === y) {
                        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                }
                
                if (state.step > 4) {
                    if (x == y) {
                        ctx.fillStyle = 'rgba(0, 200, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                    if (rowCount -1 + 55 - x === y) {
                        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                    if (rowCount -1 + 65 - x === y) {
                        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                    if (rowCount -1 + 68 - x === y) {
                        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }


                }
                else if (state.step > 3) {
                    if (x < columnCount * 0.75 && y < rowCount * 0.75 && x == y) {
                        ctx.fillStyle = 'rgba(0, 200, 200, 0.5)'
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                    //  Lower upper left
                }
                else if (state.step > 1) {
                    if (x < columnCount / 2 && y < rowCount / 2 && x == y) {
                        ctx.fillStyle = 'rgba(0, 200, 200, 0.5)';
                        drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                    }
                }
                
                if (matrix.isValidIndex(state.hoverCell.x, state.hoverCell.y)) {
                    const superX = Math.floor(state.hoverCell.x / 7);
                    const superY = Math.floor(state.hoverCell.y / 7);

                    if (Math.floor(x / 7)  === superX && Math.floor(y / 7) == superY) {
                        ctx.fillStyle = 'rgba(200, 0, 0, 0.5)'
                        drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                    }
                }
            }
        });
    };
    const mouseDown = e => {
    };
    const mouseUp = e => {

        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        if (!matrix.isValidIndex(matrixX, matrixY)) return false; 
        const superX = Math.floor(state.hoverCell.x / 7);
        const superY = Math.floor(state.hoverCell.y / 7);
        
        if (e.button === 0) { 
            state.queriedSuperCells.add(superX + columnCount * superY); // Transform to flat index
        } else if (e.button === 2) {
            state.queriedSuperCells.delete(superX + columnCount * superY); // Transform to flat index
            state.queriedSuperCellsNonRec.delete(superX + columnCount * superY); // Transform to flat index
        } else if (e.button === 1) {
            state.queriedSuperCellsNonRec.add(superX + columnCount * superY); // Transform to flat index
        }
    };
    const mouseMove = () => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        state.hoverCell.x = matrixX;
        state.hoverCell.y = matrixY;
    }
    let resetOnRPress = event => {
        if (event.code === 'KeyR') {
            state.reset();
        }
        if (event.code === 'KeyN') {
            state.step += event.shiftKey? -1 : 1;
        }
    }
    const slideStart = () => {
        document.addEventListener('keyup', resetOnRPress);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', resetOnRPress)
    }
    return createSlide(
        draw, 
        slideStart,
        slideEnd,
        mouseDown,
        mouseUp,
        mouseMove,
    );

}

// COLUMN DELETION SLIDES. TODO: FIND SOME BETTER NUMBERS
function createNervousAlgSlide(slideshowState, drawMatrixSettings) { 
    const rowCount = 10;
    const columnCount = 10;
    const state = {
        visibleNumbers: new Map(),
        deletedRows: new Set(),
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.visibleNumbers = new Map();
            state.deletedRows = new Set()
        }
    };
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...columnAlgorithmNumbers]);
    const draw = ctx => {
        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                const rowSet = state.visibleNumbers.getOrInsert(x, new Set());
                if (state.hoverCell.x == x && state.hoverCell.y == y) {
                    ctx.fillStyle  = 'rgba(100, 100, 100, 0.2)'; 
                    drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                }
                if (state.deletedRows.has(y)) {
                    ctx.fillStyle  = 'rgba(200, 200, 200, 1)'; 
                    for (let rowX = 0; rowX < columnCount; rowX++) {
                        drawMatrixSquare(ctx, rowX, y, drawMatrixSettings);
                    }
                }else if (rowSet.has(y)) {
                    drawMatrixSettings.drawMatrixValue(ctx, x, y, matrix); 
                }
                
            }
        });
    };
    const mouseDown = e => {
        if (e.button == 1) { // MIDDLE MOUSE BUTTON
            state.reset()
        } 
    };
    const mouseUp = e => {
        console.log(slideshowState)
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        const rowSet = state.visibleNumbers.getOrInsert(matrixX, new Set()); 
        rowSet.add(matrixY);// We allow insertion of invalid values like (-1 and 11)
        if (matrixX < 0) {
            if (!state.deletedRows.delete(matrixY)) {
                state.deletedRows.add(matrixY)
            }
        }
    };
    const mouseMove = () => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        state.hoverCell.x = matrixX;
        state.hoverCell.y = matrixY;
    }
    let resetOnRPress = event => {
        if (event.code === 'KeyR') {
            state.reset();
        }
    }
    const slideStart = () => {
        document.addEventListener('keyup', resetOnRPress);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', resetOnRPress)
    }
    return createSlide(
        draw, 
        slideStart,
        slideEnd,
        mouseDown,
        mouseUp,
        mouseMove,
    );
}

function createSetCoverSlide(slideshowState) {
    const elementLeftX = 200;
    const elementOffSetX = 150;
    const elementTopY = 400;
    const elementOffSetY = 150;
    const drawTitleAndNumbers = ctx => {
        ctx.textAlign = 'center'
        ctx.font = slideTitleFont;
        ctx.fillText("What is Set Cover?", 1920/2, 100)

        // To the left is the set cover and to the right is the matrix

        ctx.fillText('1', elementLeftX, elementTopY);
        ctx.fillText('2', elementLeftX + elementOffSetX, elementTopY);
        ctx.fillText('3', elementLeftX + 2 * elementOffSetX, elementTopY);
        ctx.fillText('4', elementLeftX + 3 * elementOffSetX, elementTopY);

        ctx.fillText('5', elementLeftX,                      elementTopY + elementOffSetY);
        ctx.fillText('6', elementLeftX + elementOffSetX,     elementTopY + elementOffSetY);
        ctx.fillText('7', elementLeftX + 2 * elementOffSetX, elementTopY + elementOffSetY);
        ctx.fillText('8', elementLeftX + 3 * elementOffSetX, elementTopY + elementOffSetY);
        
        ctx.fillText('9', elementLeftX,                      elementTopY + 2 * elementOffSetY);
        ctx.fillText('10', elementLeftX + elementOffSetX,     elementTopY + 2 * elementOffSetY);
        ctx.fillText('11', elementLeftX + 2 * elementOffSetX, elementTopY + 2 * elementOffSetY);
        ctx.fillText('12', elementLeftX + 3 * elementOffSetX, elementTopY + 2 * elementOffSetY);

        ctx.fillText('13', elementLeftX,                      elementTopY + 3 * elementOffSetY);
        ctx.fillText('14', elementLeftX + elementOffSetX,     elementTopY + 3 * elementOffSetY);
        ctx.fillText('15', elementLeftX + 2 * elementOffSetX, elementTopY + 3 * elementOffSetY);
        ctx.fillText('16', elementLeftX + 3 * elementOffSetX, elementTopY + 3 * elementOffSetY);

    };
    const drawRed = ctx => {
        const elementMargin = 50;
        ctx.beginPath();
        ctx.moveTo(elementLeftX + 0.5 * elementOffSetX, elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 1.5 * elementOffSetX, elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 1.5 * elementOffSetX, elementTopY + 1.5 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.5 * elementOffSetX, elementTopY + 1.5 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.5 * elementOffSetX, elementTopY + 3.56 * elementOffSetY);
        ctx.lineTo(elementLeftX + 0.5 * elementOffSetX, elementTopY + 3.56 * elementOffSetY);
        ctx.lineTo(elementLeftX + 0.5 * elementOffSetX, elementTopY + 1.5 * elementOffSetY);
        ctx.lineTo(elementLeftX - elementMargin, elementTopY + 1.5 * elementOffSetY);
        ctx.lineTo(elementLeftX - elementMargin, elementTopY + 0.5 * elementOffSetY);
        ctx.lineTo(elementLeftX + 0.5 * elementOffSetX, elementTopY + 0.5 * elementOffSetY);
        ctx.closePath()
        ctx.fillStyle = 'rgba(100, 0, 0, 0.4)'
        ctx.fill()
        ctx.stroke();
    };

    const drawGreenDown = ctx => {
        const elementMargin = 48;
        ctx.beginPath();
        ctx.moveTo(elementLeftX + 3 * elementOffSetX + elementMargin, elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 3 * elementOffSetX + elementMargin, elementTopY + 1.55 * elementOffSetY);
        ctx.lineTo(elementLeftX + 1.55 * elementOffSetX, elementTopY + 1.55 * elementOffSetY);
        ctx.lineTo(elementLeftX + 1.55 * elementOffSetX, elementTopY - elementMargin );
        ctx.closePath()
        ctx.fillStyle = 'rgba(0, 100, 0, 0.5)'
        ctx.fill()
        ctx.stroke();
    };
    const drawBlueLeft = ctx => {

        const elementMargin = 55;
        ctx.beginPath();
        ctx.moveTo(elementLeftX + 0 * elementOffSetX - elementMargin, elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 0 * elementOffSetX - elementMargin, elementTopY + 3.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 0.53 * elementOffSetX, elementTopY + 3.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 0.53 * elementOffSetX, elementTopY - elementMargin );
        ctx.closePath()
        ctx.fillStyle = 'rgba(0, 0, 230, 0.4)'
        ctx.fill()
        ctx.stroke();
    }

    const drawBlueRight = ctx => {
        const elementMargin = 55;
        ctx.beginPath();
        ctx.moveTo(elementLeftX + 3.1 * elementOffSetX + elementMargin, elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 3.1 * elementOffSetX + elementMargin, elementTopY + 3.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.52 * elementOffSetX, elementTopY + 3.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.52 * elementOffSetX, elementTopY - elementMargin );
        ctx.closePath()
        ctx.fillStyle = 'rgba(0, 0, 100, 0.3)'
        ctx.fill()
        ctx.stroke();
    };

    const drawGreenSquare = ctx => {
        const elementMargin = 50;
        ctx.beginPath();
        ctx.moveTo(elementLeftX + 0 * elementOffSetX - elementMargin, elementTopY + 2.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.55 * elementOffSetX , elementTopY + 2.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.55 * elementOffSetX , elementTopY + 3.48 * elementOffSetY);
        ctx.lineTo(elementLeftX + 0 * elementOffSetX - elementMargin, elementTopY + 3.48 * elementOffSetY);
        ctx.closePath()
        ctx.fillStyle = 'rgba(0, 200, 30, 0.5)'
        ctx.fill()
        ctx.stroke();
    }

    const drawYellowTriangle = ctx => {
        const elementMargin = 50;
        ctx.beginPath();
        ctx.moveTo(elementLeftX + 2.5 * elementOffSetX, elementTopY + 1.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 3.5 * elementOffSetX , elementTopY + 1.45 * elementOffSetY);
        ctx.lineTo(elementLeftX + 3.5 * elementOffSetX , elementTopY + 2.48 * elementOffSetY);
        ctx.lineTo(elementLeftX + 1.5 * elementOffSetX, elementTopY + 2.48 * elementOffSetY);
        ctx.lineTo(elementLeftX + 1.5 * elementOffSetX, elementTopY + 0.48 * elementOffSetY);
        ctx.lineTo(elementLeftX + 2.5 * elementOffSetX, elementTopY + 0.48 * elementOffSetY);
        ctx.closePath()
        ctx.fillStyle = 'rgba(200, 200, 30, 0.3)'
        ctx.fill()
        ctx.stroke();
    };

    const drawOrange = ctx => {
        const elementMargin = 50;
        ctx.beginPath();
        ctx.moveTo(elementLeftX - elementMargin, elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 1.5 * elementOffSetX , elementTopY - elementMargin);
        ctx.lineTo(elementLeftX + 1.5 * elementOffSetX , elementTopY + 0.48 * elementOffSetY);
        ctx.lineTo(elementLeftX - elementMargin , elementTopY + 0.48 * elementOffSetY);
        ctx.closePath()
        ctx.fillStyle = 'rgba(199, 114, 18, 0.3)'
        ctx.fill()
        ctx.stroke();
    };
    const setCoverMatrix = new SaddlepointSlideMatrix(16, 16, () => setCoverMatrixNumbers);    
    const setCoverMatrixDrawSettings = {
        leftX: 1200,
        topY: elementTopY - 35,
        cellWidth: 35,
        lineWidth: 2
    };
    const slides = [createDrawSlide(drawTitleAndNumbers)]
    slides.push(combineSlides(slides[0], createDrawSlide(drawOrange)));
    slides.push(combineSlides(slides[1], createDrawSlide(drawGreenDown)));
    slides.push(combineSlides(slides[2], createDrawSlide(drawBlueLeft)));
    slides.push(combineSlides(slides[3], createDrawSlide(drawRed)));
    slides.push(combineSlides(slides[4], createDrawSlide(drawGreenSquare)));
    slides.push(combineSlides(slides[5], createDrawSlide(drawYellowTriangle)));
    slides.push(combineSlides(slides[6], createDrawSlide(drawBlueRight)));
    slides.push(combineSlides(slides[7], createDrawSlide(ctx => {
        ctx.font = "132px sans-serif";
        ctx.fillText('=', 900, 650)
        drawMatrix(ctx, setCoverMatrix, {...setCoverMatrixDrawSettings,
            drawMatrixValue: (ctx, x, y, matrix) => {
                switch (x) {
                    case 0: {
                        ctx.fillStyle = 'rgb(252, 122, 46)';
                    } break;
                    case 1: {
                        ctx.fillStyle = 'rgba(0, 0, 200, 1)';
                    } break;
                    case 2: {
                        ctx.fillStyle = 'rgba(180, 20, 20, 1)';
                    } break;
                    case 3: {
                        ctx.fillStyle = 'rgba(0, 100, 0, 1)';
                    } break;
                    case 4: {
                        ctx.fillStyle = 'rgba(200, 200, 0, 1)';
                    } break;
                    case 5: {
                        ctx.fillStyle = 'rgba(10, 100, 255, 1)';
                    } break;
                    case 6: {
                        ctx.fillStyle = 'rgb(2, 107, 11)';
                    } break;
                    default: {
                        ctx.fillStyle = 'rgba(0, 200, 0, 1)';
                    } break;
                }

                const value = matrix.getValue(x, y);
                if (value === 1) {
                    drawMatrixCircle(ctx, x, y, setCoverMatrixDrawSettings);
                }
            }
        })
    })));
    return slides;
}

function drawCurlyBracket(ctx, x, y, height, width, text, direction = 'left') {
    //   const width = height / 4; // controls "curviness"
    const mid = y + height / 2;
    const dir = direction === 'left' ? -1 : 1;
    const tipHeight = height * 0.15;
    const tipWidth = width / 2;
    const toTipStartHeight = ((height / 2) - tipHeight / 2);
    const tipStart = y + toTipStartHeight
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // upper curve
    ctx.bezierCurveTo(
        x + dir * tipWidth, y, 
        x + dir * tipWidth, y + toTipStartHeight /4, 
        x + dir * tipWidth, tipStart
    );
    ctx.lineTo(x + dir * width, mid);
    ctx.lineTo(x + dir * tipWidth, mid + tipHeight / 2);
    
    // inward tip (middle point)
    //   ctx.bezierCurveTo(
    //     x - dir * width / 2, mid - height / 6, 
    //     x - dir * width / 2, mid + height / 6, 
    //     x, mid + height / 6
    //   );
    
    // lower curve
    ctx.bezierCurveTo(
        x + dir * tipWidth, y + height - toTipStartHeight /4, 
        x + dir * tipWidth, y + height, 
        x, y + height
    );
    ctx.stroke();

    ctx.font = "18px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text, x + width + 5, mid)
}

function createSetCoverBarSlides() {
    const resultSlides = [];
    const values = [29, 25, 20, 17, 7, 7, 3, 1, 1];

    const drawSettings = {
        topY: 400,
        leftX: 100,
        barHeight: 30,
        barUnitWidth: 30
    }

    const maxValue = Math.max(...values);
    const nextPowerOfTwoValue = 2 ** Math.ceil(Math.log2(maxValue));
    const width = nextPowerOfTwoValue * drawSettings.barUnitWidth;

    const basicBarsSlide = createDrawSlide(ctx => {
        ctx.lineWidth = 1
        ctx.beginPath();
        for (let i = values.length-1; i >= 0; i--) {
            const v = values[i];
            const barWidth = drawSettings.barUnitWidth * v;
            const x = drawSettings.leftX + width - barWidth;
            const y = drawSettings.topY + drawSettings.barHeight * (values.length -1 - i);
            ctx.rect(x, y, barWidth, drawSettings.barHeight);
        }
        ctx.stroke();
        ctx.stroke();
    });

    resultSlides.push(basicBarsSlide);

    const linesSlide = createDrawSlide(ctx => {
        ctx.font = "18px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const linesToDraw = Math.round(Math.log2(nextPowerOfTwoValue));
        let remainingWidth = width;
        let powerOfTwoValue = nextPowerOfTwoValue;
        ctx.beginPath();
        for (let i = 0; i <= linesToDraw; i++) {
            const x = drawSettings.leftX + width - remainingWidth;
            ctx.moveTo(x, drawSettings.topY - 5);
            ctx.lineTo(x, drawSettings.topY + drawSettings.barHeight * values.length + 5);
            ctx.fillText(powerOfTwoValue, x, drawSettings.topY + drawSettings.barHeight * values.length + 20)
            powerOfTwoValue = powerOfTwoValue/ 2;
            remainingWidth = remainingWidth / 2;
        }
        ctx.stroke();
        ctx.stroke();
    });

    const linedBarSlide = combineSlides(basicBarsSlide, linesSlide);
    resultSlides.push(linedBarSlide);

    const heightMarkerMarginX = 3;
    const heightMarkerMarginY = 2;
    const curlyBracketWidth = 15;
    const heightsSlide = createDrawSlide(ctx => {
        drawCurlyBracket(ctx, drawSettings.leftX + width + heightMarkerMarginX, drawSettings.topY + heightMarkerMarginY                             , drawSettings.barHeight * 2 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₀ = 2", 'right');
        drawCurlyBracket(ctx, drawSettings.leftX + width + heightMarkerMarginX, drawSettings.topY + heightMarkerMarginY + drawSettings.barHeight * 2, drawSettings.barHeight * 1 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₂ = 1", 'right');
        drawCurlyBracket(ctx, drawSettings.leftX + width + heightMarkerMarginX, drawSettings.topY + heightMarkerMarginY + drawSettings.barHeight * 3, drawSettings.barHeight * 2 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₃ = 2", 'right');
        drawCurlyBracket(ctx, drawSettings.leftX + width + heightMarkerMarginX, drawSettings.topY + heightMarkerMarginY + drawSettings.barHeight * 5, drawSettings.barHeight * 4 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₅ = 4", 'right');
        // drawCurlyBracket(ctx, 200, 50, 200, 'right')o;
    });

    const heightedBarSlide = combineSlides(linedBarSlide, heightsSlide);
    // resultSlides.push(heightedBarSlide);

    const colorsSlide = createDrawSlide(ctx => {
        ctx.lineWidth = 1
        ctx.beginPath();
        for (let i = values.length-1; i >= 0; i--) {
            const v = values[i];
            if (v > 16) {
                ctx.fillStyle = 'red'
            } else if (v > 8) {
                ctx.fillStyle = 'green'
            } else if (v > 4) {
                ctx.fillStyle = 'blue'
            } else if (v > 2) {
                ctx.fillStyle = 'pink'
            } else {
                ctx.fillStyle = 'black'
            }
            const barWidth = drawSettings.barUnitWidth * v;
            const x = drawSettings.leftX + width - barWidth;
            const y = drawSettings.topY + drawSettings.barHeight * (values.length -1 - i);
            ctx.fillRect(x, y, barWidth, drawSettings.barHeight);
        }
        // ctx.fill()
        // ctx.stroke();
    });
    const coloredBarsSlide = combineSlides(colorsSlide, heightedBarSlide);
    resultSlides.push(coloredBarsSlide);

    return resultSlides
   

    const slide = createDrawSlide(ctx => {});
    // TODO: DRAW THE BOXES
    // Draw the length lines
    // Draw heights
    // Split Greedy into phases
    // Greedy progress lower bound based on phase
    // Eat from left to progress. Removals per phase
    //  Cost per removal in phase
    // Phases * removals per phase * cost per removal in phase
    // Transform to polynomial 
    // Split based on sqrt 2 cases
    // Lower bound OPT
    return slide
}

function createNervousVsGreedySlides() {
    // Special family
    // Split Nervous into phases
    // Order greedy set removals
    // Lower bound greedy cost in phase
    // Good vs bad sets
    // 50 success 
}
// So what is it I want? 
// We explain the 
// I want to explain the Bienstock algorithm. 
// This includ 


const goodNumberedMatrixData = [ 8, 13, 20, 31, 35, 6, 38, 49, 22, 12, 7, 33, 16, 89, 80, 65, 73, 97, 50, 91, 82, 30, 27, 83, 40, 10, 98, 88, 71, 26, 23, 29, 56, 41, 53, 4, 58, 48, 51, 32, 1, 17, 18, 25, 28, 37, 45, 46, 5, 21, 36, 19, 69, 34, 92, 59, 100, 77, 79, 78, 68, 42, 74, 95, 60, 96, 75, 72, 11, 90, 9, 44, 54, 52, 61, 93, 99, 67, 14, 43, 62, 64, 76, 3, 57, 86, 94, 63, 87, 47, 15, 66, 55, 70, 84, 39, 85, 81, 2, 24 ];
const goodWalkMatrixData = [ 0.3369543176531483, 0.7475841645906165, 0.22148343290999106, 0.9753343279336559, 0.07171949251627063, 0.6314571742956901, 0.8597003401514846, 0.0629034883322871, 0.05602895906356853, 0.44454342270750513, 0.4184705278561023, 0.6145779386865525, 0.9755668551656638, 0.9493635274249015, 0.13300957853026052, 0.6602776306069787, 0.3131992836381994, 0.9304742495544824, 0.7536041313732724, 0.6054208181741596, 0.9883512287734862, 0.45923723786307313, 0.49024518451092647, 0.8523604383964151, 0.03494121174341802, 0.6460489972643122, 0.7294505033055466, 0.8118894000685495, 0.3841931342580417, 0.40139693178644986, 0.6348220190123802, 0.7294735091990421, 0.16118358053757686, 0.6259863451699992, 0.35517671369827164, 0.408404787066854, 0.7716057603869121, 0.7808934386362014, 0.2570749095554089, 0.516527867565138, 0.6014788355558471, 0.7791197933269675, 0.877415529911511, 0.5687084533525193, 0.6362523494315137, 0.533492944004766, 0.2899822557562578, 0.9922620938769392, 0.22703265193101685, 0.986353591320075, 0.9230195387310923, 0.5598735898812519, 0.5557787793562171, 0.06820125212862183, 0.3331005954243612, 0.8295513311472502, 0.813210928785713, 0.6798080832940311, 0.5702723428914253, 0.3826786524811153, 0.9252839819516591, 0.3336998088134061, 0.03785920896456774, 0.8065848589685845, 0.5898017431529416, 0.14765716096292725, 0.1791058942355107, 0.9582011511337313, 0.6740104441179532, 0.3129448659808334, 0.478873450953622, 0.35337879097195946, 0.42450856499053813, 0.9154926505100215, 0.4258124709947422, 0.47717785984268946, 0.09560004847962078, 0.5447580997324383, 0.30307272034335186, 0.9219955695625424, 0.38227569642461623, 0.29606372081187127, 0.8211324950805537, 0.03514764982989638, 0.7864035568633203, 0.5912839839805406, 0.8344457308228863, 0.639154180540306, 0.18071312774553416, 0.6540258249190544, 0.5732406993529225, 0.5065048468990908, 0.40370221974494214, 0.5437032181121022, 0.43694153878583464, 0.8363592625013838, 0.6121438266231511, 0.7779107840897593, 0.0723578970716997, 0.6737672430790856 ];

const bienstockNumbers = [ 
    8, 13, 20, 31, 35, 6, 
    38, 49, 22, 12, 7, 33, 
    16, 89, 80, 65, 73, 97, 
    50, 91, 82, 30, 27, 83, 
    40, 10, 98, 88, 71, 26, 
    23, 29, 3, 41, 81, 4, 

    // Buffer values for antidiagonal
    9, 14, 21, 32, 36, 11, 39, 51, 24, 15, 61, 74, 75, 28, 60, 52, 34,
]

const columnAlgorithmNumbers = 
[ 
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 
    0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 
    0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 
    0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 
    0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 
    0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 
    1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 
    0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 
]
const setCoverMatrixNumbers = 
[ 
   1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];  

const normalizationMatrix = [
94, 52, 71, 87, 59, 91, 85, 83, 45, 68, 
 7, 99, 80, 42, 78,  2, 62, 77, 52, 52, 
93, 49, 56, 44, 83, 31, 73, 56, 72, 16, 
 9, 33, 52, 41,  8, 52, 52, 26,  4, 24, 
50, 70, 58, 15, 65, 80, 92, 66, 22, 30, 
84, 52, 60,  6, 68, 27, 71, 95, 63, 40, 
18, 12, 52, 51, 41,  1, 52, 38, 24, 22, 
14, 12, 78, 82, 56,  8, 84, 81, 26, 10, 
61, 74, 75, 27, 60, 23, 89, 52, 38, 34, 
52, 37, 63, 61, 73,  5, 86, 59, 95, 11, 
];
const normalizationMatrixNormalized = [
 1, 0, 1, 1, 1, 1, 1, 1,-1, 1,
-1, 1, 1,-1, 1,-1, 1, 1, 0, 0,
 1,-1, 1,-1, 1,-1, 1, 1, 1,-1,
-1,-1, 0,-1,-1, 0, 0,-1,-1,-1,
-1, 1, 1,-1, 1, 1, 1, 1,-1,-1,
 1, 0, 1,-1, 1,-1, 1, 1, 1,-1,
-1,-1, 0,-1,-1,-1, 0,-1,-1,-1,
-1,-1, 1, 1, 1,-1, 1, 1,-1,-1,
 1, 1, 1,-1, 1,-1, 1, 0,-1,-1,
 0,-1, 1, 1, 1,-1, 1, 1, 1,-1,
]