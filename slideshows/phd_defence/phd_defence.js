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
    const {leftX, topY, cellWidth, lineWidth, drawMatrixValue} = drawSettings;
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
            drawMatrixValue(ctx, x, y, matrix); // Injected value-drawing method
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
    ctx.font = drawSettings.font? drawSettings.font : "32px sans-serif";
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

function createBulletPointWriter(ctx, font, leftX, topY, minorOffset, majorOffset) {
    return {
        currentY: topY - majorOffset, // We assume we always start with a major bullet
        writeMajorBullet(text) {
            ctx.font = font;
            this.currentY += majorOffset;
            ctx.fillText(text, leftX, this.currentY);
        },
        writeMinorBullet(text) {
            ctx.font = font;
            this.currentY += minorOffset;
            ctx.fillText(text, leftX, this.currentY);
        },
        startWriting() { // Reset before writing in a new frame
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

    const default10x10MatrixDrawSettings = {
        leftX: 40,
        topY: 50,
        cellWidth: 100,
        lineWidth: 2
    };
    const matrixDrawSettingsDrawNumberedOnly = {
        ...default10x10MatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix) {
            writeMatrixValue(ctx, x, y, matrix, matrixDrawSettingsDrawNumberedOnly);
        }
    };
    const matrixDrawSettingsDrawColoredCircledValue = {
        ...default10x10MatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix) {
            drawMatrixCircleByThreshold(ctx, x, y, matrix, thresholdState.value, matrixDrawSettingsDrawColoredCircledValue);
            writeMatrixValue(ctx, x, y, matrix, matrixDrawSettingsDrawColoredCircledValue);
        }
    };
    const matrixDrawSettingsDrawCircleOnly = {
        ...default10x10MatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y) {
            drawMatrixCircle(ctx, x, y, matrixDrawSettingsDrawCircleOnly);
        }
    };
    const thresholdX = Math.floor(matrix.columns * 0.71);
    const thresholdY = Math.floor(matrix.rows * 0.47);

    const thresholdState = createThresholdState(Math.min(...matrix.data), Math.max(...matrix.data), matrix.getValue(thresholdX, thresholdY));
    function updateThresholdStateFromCanvasPosition(e) {
        if (e.button != 0) return; // Only left click
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, default10x10MatrixDrawSettings);
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

    const default6x6MatrixDrawSettings = {
        leftX: 140,
        topY: 150,
        cellWidth: 120,
        lineWidth: 2,
    };
    const saddlepointSlide = createSaddlepointSlide(slideshowState, default6x6MatrixDrawSettings);
    slideshowState.addSlide(combineSlides(saddlepointSlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Saddlepoint", slideTextDefaultX, slideTitleTextDefaultY);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("An entry which is the maximum");
        bulletPointWriter.writeMajorBullet("in its row and the minimum");
        bulletPointWriter.writeMajorBullet("in its column");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("Corresponds to a pure strategy");
        bulletPointWriter.writeMajorBullet("Nash Equilibrium of a zero-sum game");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("R = minimum of row maxima");
        bulletPointWriter.writeMajorBullet("C = maximum of column minima");
        bulletPointWriter.writeMajorBullet("If R = C, then we have a saddlepoint");
        bulletPointWriter.writeMajorBullet("with equal to this value");
    })));
    slideshowState.addSlide(combineSlides(saddlepointSlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Strict Saddlepoint ", slideTextDefaultX, slideTitleTextDefaultY);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("When the saddlepoint has no ");
        bulletPointWriter.writeMajorBullet("other element in its row or column");
        bulletPointWriter.writeMajorBullet("with the same value (Unique)");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("Equality makes the problem harder");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("Saddlepoint problem has Ω(n²)");
        bulletPointWriter.writeMajorBullet("time lower bound");
        bulletPointWriter.writeMajorBullet("Strict saddlepoint was shown ");
        bulletPointWriter.writeMajorBullet("computable in O(n log n) time");
        bulletPointWriter.writeMajorBullet("in 1991");

        ctx.lineWidth = 2
        drawVerticalCurlyBracket(ctx,   
            default6x6MatrixDrawSettings.leftX + 10 + 5 * default6x6MatrixDrawSettings.cellWidth,   // x
            default6x6MatrixDrawSettings.topY,                                                      // y
            5 * default6x6MatrixDrawSettings.cellWidth,                                             // height 
            20,                                                                                     // Width 
            "n",                                                                                    // Text 
            'right',                                                                                // Direction 
            "40px sans-serif"                                                                       // Font
        )
        drawHorizontalCurlyBracket(ctx, 
            default6x6MatrixDrawSettings.leftX,                                                     // x 
            default6x6MatrixDrawSettings.topY + 10 + 5 * default6x6MatrixDrawSettings.cellWidth,    // y 
            20,                                                                                     // height 
            5 * default6x6MatrixDrawSettings.cellWidth,                                             // Width
            "n",                                                                                    // Text 
            'down',                                                                                 // Direction 
            "40px sans-serif"                                                                       // Font
        )
    })));



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
            ctx.fillText("Why is it easier?", slideTextDefaultX, slideTitleTextDefaultY);
            ctx.font = "40px sans-serif";
            ctx.fillText("(linear time search)", 1150, 135);

            bulletPointWriter.startWriting();
            bulletPointWriter.writeMajorBullet('- Go for a "walk" using guess "S"');
            bulletPointWriter.writeMajorBullet("- Walk right on green value");
            bulletPointWriter.writeMajorBullet("- Walk down on red value");
            bulletPointWriter.writeMajorBullet("- Either visit all columns or all rows");

            const circleRadius = default10x10MatrixDrawSettings.cellWidth * 0.4
            // First circle comparison legend
            ctx.fillStyle = smallerThanColor;
            drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = fontColor;
            ctx.fillText("< S", 1200, greenCircleLegendHeight);

            // Second circle comparison legend
            ctx.fillStyle = greaterThanColor;
            drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = fontColor;
            ctx.fillText("> S", 1200, redCircleLegendHeight);

        }));
    }));
    slideshowState.addSlide(combineSlides(walkSlides[walkSlides.length-1], createDrawSlide(ctx => {
            ctx.fillStyle = fontColor;
            ctx.textAlign = 'left'
            ctx.font = slideTitleFont;
            ctx.fillText("Why is it easier?", slideTextDefaultX, slideTitleTextDefaultY);
            ctx.font = "40px sans-serif";
            ctx.fillText("(linear time search)", 1150, 135);

            bulletPointWriter.startWriting();
            bulletPointWriter.writeMajorBullet("To deal with equality we do two ");
            bulletPointWriter.writeMajorBullet("searches in parallel that only differs");
            bulletPointWriter.writeMajorBullet("in which direction to walk when");
            bulletPointWriter.writeMajorBullet("the value is found");
            
            // TODO: Insert illustration with 2 paths that differ on the value
            const doubleWalkImage = new Image();
            doubleWalkImage.src = "double_walk.jpg"; // Relative path

            const imageSize = 600;
            ctx.drawImage(doubleWalkImage, slideTextDefaultX + 100, 450, imageSize, imageSize);
    })));


    const pseudoSaddlepointSlide = createPseudoSaddlepointSlide(slideshowState, default6x6MatrixDrawSettings);
    const pseudoSaddlepointSlideText1 = combineSlides(pseudoSaddlepointSlide, createDrawSlide(ctx => {
            ctx.fillStyle = fontColor;
            ctx.textAlign = 'left'
            ctx.font = slideTitleFont;
            ctx.fillText("So which value to guess?", slideTextDefaultX, slideTitleTextDefaultY);

            bulletPointWriter.startWriting();
            bulletPointWriter.writeMajorBullet("Introducing Pseudo Saddlepoints");
            bulletPointWriter.writeMajorBullet("");
            bulletPointWriter.writeMajorBullet("C = maximum of column minima");
            bulletPointWriter.writeMajorBullet("R = minimum of row maxima");
            bulletPointWriter.writeMajorBullet("Pseudo saddlepoint in range [C, R]");
            bulletPointWriter.writeMajorBullet("");
            bulletPointWriter.writeMajorBullet("Recall that a saddlepoint had C = R");

    }))
    slideshowState.addSlide(pseudoSaddlepointSlideText1);

    slideshowState.addSlide(combineSlides(pseudoSaddlepointSlideText1, createDrawSlide(ctx => {
            // ctx.fillStyle = fontColor;
            bulletPointWriter.writeMajorBullet("");
            bulletPointWriter.writeMajorBullet("A pseudo saddlepoint value can");
            bulletPointWriter.writeMajorBullet('be used for the "walk" to find');
            bulletPointWriter.writeMajorBullet("the saddlepoint if it exists");
    })));

    const bienstockSlide = createBienstockSlides(slideshowState, default6x6MatrixDrawSettings)
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

    const pspMatrixCombineSlide = createPseudoSaddlepointCombineSlide(slideshowState, {...default10x10MatrixDrawSettings, cellWidth: 10, lineWidth: 1, drawMatrixValue: () => {}});
    slideshowState.addSlide(combineSlides(pspMatrixCombineSlide, createDrawSlide(ctx => {
            ctx.fillStyle = fontColor;
            ctx.textAlign = 'left'
            ctx.font = slideTitleFont;
            ctx.fillText("Another useful property", slideTextDefaultX, slideTitleTextDefaultY);

            bulletPointWriter.startWriting();
            bulletPointWriter.writeMajorBullet("Pseudo saddlepoints of sub-matrices");
            bulletPointWriter.writeMajorBullet("can be combined to find pseudo ");
            bulletPointWriter.writeMajorBullet("saddlepoints of the whole matrix");
    })));
   slideshowState.addSlide(combineSlides(pspMatrixCombineSlide, createDrawSlide(ctx => {
            ctx.fillStyle = fontColor;
            ctx.textAlign = 'left'
            ctx.font = slideTitleFont;
            ctx.fillText("Another useful property", slideTextDefaultX, slideTitleTextDefaultY);

            bulletPointWriter.startWriting();
            bulletPointWriter.writeMajorBullet("Pseudo saddlepoints of sub-matrices");
            bulletPointWriter.writeMajorBullet("can be combined to find pseudo ");
            bulletPointWriter.writeMajorBullet("saddlepoints of the whole matrix");
            bulletPointWriter.writeMajorBullet("");
            bulletPointWriter.writeMajorBullet("So we can split the problem of ");
            bulletPointWriter.writeMajorBullet("finding a pseudo saddlepoint ");
            bulletPointWriter.writeMajorBullet("into many small sub-problems");
    })));
 



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
        ctx.fillText("Almost O(n log* n)", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("1. Divide matrix into r-sized chunks");
        bulletPointWriter.writeMajorBullet("(r = ⌈log(n)⌉)");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("2. Run the O(n log n) algorithm");
        bulletPointWriter.writeMajorBullet("recursively on chunks to ");
        bulletPointWriter.writeMajorBullet("compute pseudo saddlepoints");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("3. Used chunk pseudo saddlepoints");
        bulletPointWriter.writeMajorBullet("to compute pseudo saddlepoint");
        bulletPointWriter.writeMajorBullet('value "p" of the whole matrix');
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet('4. Do the walk with value "p"');
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
    
    slideshowState.addSlide(combineSlides(logStarAlgSlides, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("O(n log* n) fixed", slideTextDefaultX, slideTitleTextDefaultY);
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("0. Construct diagonal to avoid ");
        bulletPointWriter.writeMajorBullet("recursive calls outside of ");
        bulletPointWriter.writeMajorBullet("overlapping diagonal parts");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet('A matrix with a diagonal of all ');
        bulletPointWriter.writeMajorBullet('value "v" has a pseudo saddlepoint');
        bulletPointWriter.writeMajorBullet('with value "v"');
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("The running time follows from the");
        bulletPointWriter.writeMajorBullet("recurrence relation:");
        bulletPointWriter.writeMajorBullet("T(n) ≤ cn + (⌈n/r⌉ - 1)T(r).");

    })));

    slideshowState.addSlide(createDrawSlide(ctx => {
        ctx.textAlign = 'center'
        ctx.font = slideTitleFont;
        ctx.fillText("I promise this was the hardest algorithm", canvas.width/2, canvas.height/2);
    }));

    // BONUS N LOG LOG N Algorithm as motivation?
    // RANDOM ALGORITHM PART
    const randomProbingAlgorithmSlide = createRandomProbingAlgorithmSlide(slideshowState, default10x10MatrixDrawSettings);
    slideshowState.addSlide(createDrawSlide(ctx => {
        ctx.textAlign = 'center'
        ctx.font = slideTitleFont;
        ctx.fillText("I promise this was the hardest algorithm", canvas.width/2, canvas.height/2);
        ctx.fillText("But can we do better?", canvas.width/2, canvas.height/2 + 80);

    }));

    // INSTANCE OPTIMALITY PART
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
        ctx.strokeRect(default10x10MatrixDrawSettings.leftX, default10x10MatrixDrawSettings.topY, 1000, 1000);
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(default10x10MatrixDrawSettings.leftX + margin + i * width + i * offsetX, default10x10MatrixDrawSettings.topY + margin + i * height, width, height);
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
        ctx.fillText('The "Nervous" Algorithm', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("In four steps:");
        bulletPointWriter.writeMajorBullet("1. Randomly probe new cell for a +1");
        bulletPointWriter.writeMajorBullet("2. Explore its column")
        bulletPointWriter.writeMajorBullet("3. Stop searching rows with found +1")
        bulletPointWriter.writeMajorBullet("4. Repeat until done")
        bulletPointWriter.writeMajorBullet("")
        bulletPointWriter.writeMajorBullet("(Search for -1s is symmetric)")
        bulletPointWriter.writeMajorBullet("")
        bulletPointWriter.writeMajorBullet("I told you this was the easiest")
        bulletPointWriter.writeMajorBullet("algorithm")
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
        bulletPointWriter.writeMajorBullet('cannot generally do better than')
        bulletPointWriter.writeMajorBullet("randomly guessing (kind of)")
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

    const setCoverBarSlide = createSetCoverBarSlides(slideshowState);
    slideshowState.addSlide(setCoverBarSlide)

    const nervousVsGreedySlide = createNervousVsGreedySlides(slideshowState, default10x10MatrixDrawSettings);
    slideshowState.addSlide(combineSlides(nervousVsGreedySlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('Nervous vs Greedy', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("To bridge the gab between Nervous");
        bulletPointWriter.writeMajorBullet("and Greedy, we define a special");
        bulletPointWriter.writeMajorBullet("family where every row only has");
        bulletPointWriter.writeMajorBullet("a single counter example");
        bulletPointWriter.writeMajorBullet("");
        bulletPointWriter.writeMajorBullet("(General instance optimality is");
        bulletPointWriter.writeMajorBullet("impossible so we have to start");
        bulletPointWriter.writeMajorBullet("somewhere else)");
    })));

    slideshowState.addSlide(combineSlides(nervousVsGreedySlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('Nervous vs Greedy', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("For this setting, Greedy picks");
        bulletPointWriter.writeMajorBullet("columns from left to right, so ");
        bulletPointWriter.writeMajorBullet('the question is "what does ');
        bulletPointWriter.writeMajorBullet('Nervous do?"');
    })));
    
    slideshowState.addSlide(combineSlides(nervousVsGreedySlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('Nervous vs Greedy', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet('1. We split the execution of ');
        bulletPointWriter.writeMajorBullet('Nervous into phases');
        bulletPointWriter.writeMinorBullet('');
        bulletPointWriter.writeMinorBullet('   When Nervous has removed a');
        bulletPointWriter.writeMajorBullet('   third of the remaining rows,');
        bulletPointWriter.writeMajorBullet('   it continues to the next phase');
        bulletPointWriter.writeMinorBullet('');
        bulletPointWriter.writeMajorBullet('2. For a phase, we partition ');
        bulletPointWriter.writeMajorBullet('columns into good/bad columns');
        bulletPointWriter.writeMinorBullet('');
        bulletPointWriter.writeMinorBullet('   A good column is one of the ');
        bulletPointWriter.writeMajorBullet('   biggest columns which together');
        bulletPointWriter.writeMajorBullet('   would remove two thirds of rows');
        bulletPointWriter.writeMinorBullet('      (At the start of the phase)');
    })));    

    slideshowState.addSlide(combineSlides(nervousVsGreedySlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('Nervous vs Greedy', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet('Since good columns are more likely');
        bulletPointWriter.writeMajorBullet('to be picked, Nervous finishes');
        bulletPointWriter.writeMajorBullet('phases comparative to Greedy');
        bulletPointWriter.writeMajorBullet('');
        bulletPointWriter.writeMajorBullet('And since it remove a constant ');
        bulletPointWriter.writeMajorBullet('fraction of rows in every phase,');
        bulletPointWriter.writeMajorBullet('Nervous finishes in O(log n) phases');
        bulletPointWriter.writeMajorBullet('');
        bulletPointWriter.writeMajorBullet('So Nervous is at worst a log n ');
        bulletPointWriter.writeMajorBullet('factor worse than Greedy');
    })));    

    slideshowState.addSlide(combineSlides(nervousVsGreedySlide, createDrawSlide(ctx => {
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText('Nervous vs Optimal', slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet('An optimal algorithm cannot make');
        bulletPointWriter.writeMajorBullet('progress before finding a +1 in ');
        bulletPointWriter.writeMajorBullet('a column like Nervous');
        bulletPointWriter.writeMinorBullet('');
        bulletPointWriter.writeMinorBullet('An optimal algorithm has to do');
        bulletPointWriter.writeMajorBullet('at least a constant fraction of');
        bulletPointWriter.writeMajorBullet('probes in a column compared to ');
        bulletPointWriter.writeMajorBullet('an optimal set cover solution');
        bulletPointWriter.writeMinorBullet('');
        bulletPointWriter.writeMinorBullet('The Greedy set cover algorithm is') 
        bulletPointWriter.writeMajorBullet('at worst a constant factor worse than');
        bulletPointWriter.writeMajorBullet('an optimal solution and Nervous is at');
        bulletPointWriter.writeMajorBullet('worst a log factor worse than Greedy');
    })));

    slideshowState.addSlide(createDrawSlide(ctx => {
        ctx.textAlign = 'center'
        ctx.font = slideTitleFont;
        ctx.fillText("Time for questions?", canvas.width/2, canvas.height/2);
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
            state.matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...bienstockNumbers]);
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
                    writeMatrixValue(ctx, x, y, matrix, drawMatrixSettings)
                    // drawMatrixValue(ctx, )
                    // drawMatrixSettings.drawMatrixValue(ctx, x, y, matrix); 
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

function createPseudoSaddlepointSlide2(slideshowState, drawMatrixSettings) {
    const rowCount = 100;
    const columnCount = 100;
    const state = {
        hoverCell: {x: -1, y: -1},
        reset: function() {
        }
    };
    state.reset();
    
    const {leftX, topY, cellWidth} = drawMatrixSettings;
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...pseudoSaddlepointMatrix]);
    const draw = ctx => {

        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                
            }
        });
    };
    const mouseDown = e => {
    };
    const mouseUp = e => {
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
function createPseudoSaddlepointCombineSlide(slideshowState, drawMatrixSettings) { 
    const rowCount = 100;
    const columnCount = 100;
    const state = {
        step: 0,
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.step = 0;
        }
    };
    state.reset();
    
    const {leftX, topY, cellWidth} = drawMatrixSettings;
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...pseudoSaddlepointMatrix]);
    const draw = ctx => {

        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {}});

        const clearSize = cellWidth * 48;
        ctx.font = "132px sans-serif";
        ctx.fillStyle = fontColor;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center'
        if (state.step > 0) {
            ctx.clearRect(drawMatrixSettings.leftX + cellWidth, drawMatrixSettings.topY + cellWidth,  clearSize, clearSize)
            ctx.fillText(4, drawMatrixSettings.leftX + 24  * cellWidth, drawMatrixSettings.topY + 24  * cellWidth);
        } 
        if (state.step > 1) {
            ctx.clearRect(drawMatrixSettings.leftX + 51 * cellWidth, drawMatrixSettings.topY + cellWidth,  clearSize, clearSize)
            if (state.step > 4) {
                ctx.fillStyle = equalToColor;
                ctx.beginPath();
                ctx.arc(drawMatrixSettings.leftX + (51 + 24)  * cellWidth, drawMatrixSettings.topY + 24  * cellWidth, 12 * cellWidth, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = fontColor;
            }
            ctx.fillText(7, drawMatrixSettings.leftX + (51 + 24)  * cellWidth, drawMatrixSettings.topY + 24  * cellWidth);
        }
        if (state.step > 2) {
            ctx.clearRect(drawMatrixSettings.leftX + cellWidth, drawMatrixSettings.topY + 51 * cellWidth,  clearSize, clearSize)
            ctx.fillText(2, drawMatrixSettings.leftX + 24  * cellWidth, drawMatrixSettings.topY + (51 + 24)  * cellWidth);
        }
        if (state.step > 3) {
            ctx.clearRect(drawMatrixSettings.leftX + 51 * cellWidth, drawMatrixSettings.topY + 51 * cellWidth,  clearSize, clearSize)
            ctx.fillText(9, drawMatrixSettings.leftX + (51 + 24)  * cellWidth, drawMatrixSettings.topY + (51 + 24)  * cellWidth);

        }
    };
    const mouseDown = e => {
        if (e.button === 0) {
            state.step += 1
        }
    };
    const mouseUp = e => {

    };
    const mouseMove = () => {

    }
    let resetOnRPress = event => {
        if (event.code === 'KeyN') {
            state.step += 1
        } 
        else if (event.code === 'KeyR') {
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
function createPseudoSaddlepointSlide(slideshowState, drawMatrixSettings) {
    const rowCount = 5;
    const columnCount = 5;
    const state = {
        rowMax: new Map(),
        columnMin: new Map(),
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.rowMax.clear();
            state.rowMax.set(0, 2);
            state.rowMax.set(1, 2);
            state.rowMax.set(2, 3);
            state.rowMax.set(3, 4);
            state.rowMax.set(4, 3);

            state.columnMin.clear();
            state.columnMin.set(0, 1);
            state.columnMin.set(1, 0);
            state.columnMin.set(2, 2);
            state.columnMin.set(3, 0);
            state.columnMin.set(4, 2);
        }
    };
    state.reset();
    
    const {leftX, topY, cellWidth} = drawMatrixSettings;
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...pseudoSaddlepointMatrix]);
    const draw = ctx => {

        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                if (state.rowMax.getOrInsert(y, -1) === x) {
                    const maxGradient = ctx.createLinearGradient(leftX + (x + 0.5) * cellWidth, topY + y * cellWidth, leftX + (x + 0.5) * cellWidth, topY + (y + 1) * cellWidth,);
                    maxGradient.addColorStop(0, greaterThanColor);
                    maxGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                    ctx.fillStyle = maxGradient
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                } 
                if (state.columnMin.getOrInsert(x, -1) === y) {
                    const minGradient = ctx.createLinearGradient(leftX + (x + 0.5) * cellWidth, topY + y * cellWidth, leftX + (x + 0.5) * cellWidth, topY + (y + 1) * cellWidth,);
                    minGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                    minGradient.addColorStop(1, smallerThanColor);


                    ctx.fillStyle = minGradient
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                }
                writeMatrixValue(ctx, x, y, matrix, drawMatrixSettings);
            }
        });
    };
    const mouseDown = e => {
    };
    const mouseUp = e => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        if (!matrix.isValidIndex(matrixX, matrixY)) return;
        if (e.button === 0) { // LEFT CLICK
            state.rowMax.set(matrixY, matrixX);
        } else if (e.button === 2) { // RIGHT CLICK
            state.columnMin.set(matrixX, matrixY);
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

function createSaddlepointSlide(slideshowState, drawMatrixSettings) {
    const rowCount = 5;
    const columnCount = 5;
    const state = {
        rowMax: new Map(),
        columnMin: new Map(),
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.rowMax = new Map();
            state.columnMin = new Map()
        }
    };
    
    const {leftX, topY, cellWidth} = drawMatrixSettings;
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...saddlepointMatrix]);
    const draw = ctx => {

        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                if (state.rowMax.getOrInsert(y, -1) === x) {
                    const maxGradient = ctx.createLinearGradient(leftX + (x + 0.5) * cellWidth, topY + y * cellWidth, leftX + (x + 0.5) * cellWidth, topY + (y + 1) * cellWidth,);
                    maxGradient.addColorStop(0, greaterThanColor);
                    maxGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                    ctx.fillStyle = maxGradient
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                } 
                if (state.columnMin.getOrInsert(x, -1) === y) {
                    const minGradient = ctx.createLinearGradient(leftX + (x + 0.5) * cellWidth, topY + y * cellWidth, leftX + (x + 0.5) * cellWidth, topY + (y + 1) * cellWidth,);
                    minGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                    minGradient.addColorStop(1, smallerThanColor);


                    ctx.fillStyle = minGradient
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                }
                writeMatrixValue(ctx, x, y, matrix, drawMatrixSettings);
            }
        });
    };
    const mouseDown = e => {
    };
    const mouseUp = e => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        if (!matrix.isValidIndex(matrixX, matrixY)) return;
        if (e.button === 0) { // LEFT CLICK
            state.rowMax.set(matrixY, matrixX);
        } else if (e.button === 2) { // RIGHT CLICK
            state.columnMin.set(matrixX, matrixY);
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

// HOW TO TELL ABOUT RANDOM PROBING
function createRandomProbingAlgorithmSlide(slideshowState, drawMatrixSettings) {
    const rowCount = 10;
    const columnCount = 10;
    const state = {
        rowMax: new Map(),
        columnMin: new Map(),
        visibleNumbers: new Map(),
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.rowMax = new Map();
            state.columnMin = new Map()
            state.visibleNumbers = new Map();
        }
    };
    
    const {leftX, topY, cellWidth} = drawMatrixSettings;
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...goodNumberedMatrixData]);
    const draw = ctx => {

        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...drawMatrixSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                const columnSet = state.visibleNumbers.getOrInsert(x, new Set());
                if (state.hoverCell.x == x && state.hoverCell.y == y) {
                    ctx.fillStyle  = 'rgba(100, 100, 100, 0.2)'; 
                    drawMatrixCircle(ctx, x, y, drawMatrixSettings);
                }
                if (columnSet.has(y)) {
                    writeMatrixValue(ctx, x, y, matrix, drawMatrixSettings);
                }

                if (state.rowMax.getOrInsert(y, -1) === x) {
                    const maxGradient = ctx.createLinearGradient(leftX + (x + 0.5) * cellWidth, topY + y * cellWidth, leftX + (x + 0.5) * cellWidth, topY + (y + 1) * cellWidth,);
                    maxGradient.addColorStop(0, greaterThanColor);
                    maxGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                    ctx.fillStyle = maxGradient
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                } 
                if (state.columnMin.getOrInsert(x, -1) === y) {
                    const minGradient = ctx.createLinearGradient(leftX + (x + 0.5) * cellWidth, topY + y * cellWidth, leftX + (x + 0.5) * cellWidth, topY + (y + 1) * cellWidth,);
                    minGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                    minGradient.addColorStop(1, smallerThanColor);


                    ctx.fillStyle = minGradient
                    drawMatrixSquare(ctx, x, y, drawMatrixSettings);
                }
            }
        });
    };
    const mouseDown = e => {
    };
    const mouseUp = e => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, drawMatrixSettings);
        if (!matrix.isValidIndex(matrixX, matrixY)) return;
        if (e.button === 0) { // LEFT CLICK
            const columnSet = state.visibleNumbers.getOrInsert(matrixX, new Set());
            columnSet.add(matrixY);
            // state.rowMax.set(matrixY, matrixX);
        } else if (e.button === 2) { // RIGHT CLICK
            state.columnMin.set(matrixX, matrixY);
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
        ctx.fillStyle = 'rgba(16, 250, 35, 0.6)';
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
                        ctx.fillStyle = 'rgba(16, 250, 35, 1)';
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

function drawHorizontalCurlyBracket(ctx, x, y, height, width, text, direction = 'up', font = "18px sans-serif") {
    const mid = x + width / 2;
    const dir = direction === 'up' ? -1 : 1;
    const tipWidth = width * 0.15;
    const tipHeight = height / 2;
    const toTipStartHeight = ((width / 2) - tipWidth / 2);
    const tipStart = x + toTipStartHeight
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // upper curve
    ctx.bezierCurveTo(
        x, y + dir * tipHeight, 
        x + toTipStartHeight /4 , y + dir * tipHeight, 
        tipStart, y + dir * tipHeight, 
    );
    ctx.lineTo(mid, y + height);
    ctx.lineTo(mid + tipWidth / 2, y + height - tipHeight);
    
    // lower curve
    ctx.bezierCurveTo(
        x + width - toTipStartHeight /4, y + dir * tipHeight,
        x + width, y + height,
        x + width, y 
    );
    ctx.stroke();

    ctx.font = font
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText(text, mid, y + tipHeight + 5)
}
function drawVerticalCurlyBracket(ctx, x, y, height, width, text, direction = 'left', font = "18px sans-serif") {
    //   const width = height / 4; // controls "curviness"
    const mid = y + height / 2;
    const dir = direction === 'left' ? -1 : 1;
    const tipHeight = Math.min(height * 0.15, width * 0.5);
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
    
    // lower curve
    ctx.bezierCurveTo(
        x + dir * tipWidth, y + height - toTipStartHeight /4, 
        x + dir * tipWidth, y + height, 
        x, y + height
    );
    ctx.stroke();

    ctx.font = font
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text, x + width + 5, mid)
}

function createSetCoverBarSlides(slideshowState) {
    const values = [25, 20, 17, 7, 7, 3, 1, 1];
    const accumSum = values.scanLeft(add, 0);
    const rowCount = accumSum[accumSum.length-1]

    let matrix = new SaddlepointSlideMatrix(values.length, rowCount, (r, c) => {
        const result = Array(r * c).fill('rgba(0, 0, 0, 0)');
        return result;
    });
    const matrixDrawSettings = {
        leftX: 25,
        topY: 50,
        cellWidth: 23,
        lineWidth: 0.8
    }

    const barsDrawSettings = {
        topY: 400,
        leftX: 200,
        barHeight: 40,
        barUnitWidth: 40
    }


    const barInitialColors = [
        'rgba(211, 13, 13, 1)',
        'rgba(14, 146, 58, 1)',
        'rgba(22, 0, 100, 1)',
        'rgba(161, 255, 133, 1)',
        'rgba(255, 0, 212, 1)',
        'rgba(95, 95, 95, 1)',
        'rgba(126, 186, 255, 1)',
        'rgba(0, 0, 0, 1)',
    ]

    const state = {
        drawMatrix: true,
        drawText: false,
        drawLines: false,
        drawHeights: false,
        dragStart: false,
        drawBarsUpperBounds: false,
        currentColor: 'rgba(0, 0, 0, 0)',
        hoverCell: {x: -1, y: -1},
        reset() {
            matrix = new SaddlepointSlideMatrix(matrix.rows, matrix.columns, () => [...fallBackMatrix.data]);
        },
        clearMatrix() {
            for (let x = 0; x <= 80; x++) {
                for (let y = 0; y <= 7; y++) {
                    matrix.setValue(x, y, 'rgba(0, 0, 0, 0)')
                }
            }
        }
    };

    const maxValue = Math.max(...values);
    const nextPowerOfTwoValue = 2 ** Math.ceil(Math.log2(maxValue));
    const barsWidth = nextPowerOfTwoValue * barsDrawSettings.barUnitWidth;

    const boxes = [];
    let current = 0;
    for (let y = 0; y < values.length; y++) { 
        const color = barInitialColors[y];
        const barWidth = barsDrawSettings.barUnitWidth * nextPowerOfTwoValue;
        for (let x = current; x < accumSum[y]; x++) {
            matrix.setValue(x, values.length - 1 - y, color);

            const boxX = 1 + x - current;
            const boxY = barsDrawSettings.topY + barsDrawSettings.barHeight * (values.length -1 - y);
            boxes.push({
                x: barsDrawSettings.leftX + barWidth - boxX * barsDrawSettings.barUnitWidth, 
                y: boxY,
                width: barsDrawSettings.barUnitWidth,
                height: barsDrawSettings.barHeight,
                getColor() {
                    return matrix.getValue(x, values.length - 1 - y);
                },
                onClick() {
                    matrix.setValue(x, values.length - 1 - y, state.currentColor);
                }
            })
        }
        current = accumSum[y];
    }

    const fallBackMatrix = new SaddlepointSlideMatrix(matrix.rows, matrix.columns, () => [...matrix.data]);

    const greedyCostImage = new Image();
    greedyCostImage.src = "greedy_cost.png"; // Relative path

    const optCostImage = new Image();
    optCostImage.src = "opt_cost.png"; // Relative path

    const draw = ctx => {
        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        if (state.drawMatrix) {
            drawMatrix(ctx, matrix, {...matrixDrawSettings, 
                drawMatrixValue: (ctx, x, y, matrix) => {
                    ctx.fillStyle = matrix.getValue(x, y);
                    drawMatrixCircle(ctx, x, y, matrixDrawSettings);
                }
            });
        }

        if (state.drawBarsUpperBounds) {
            ctx.globalAlpha = 0.5
            let x = barsDrawSettings.leftX; 
            let y = barsDrawSettings.topY + 5 * barsDrawSettings.barHeight;
            ctx.fillStyle = barInitialColors[0];
            ctx.fillRect(x, y, barsDrawSettings.barUnitWidth * 16, 3 * barsDrawSettings.barHeight);


            x += barsDrawSettings.barUnitWidth * 16;
            y -= barsDrawSettings.barHeight * 0;
            ctx.fillStyle = barInitialColors[1];
            ctx.fillRect(x, y, barsDrawSettings.barUnitWidth * 8, 3 * barsDrawSettings.barHeight);

            x += barsDrawSettings.barUnitWidth * 8;
            y -= barsDrawSettings.barHeight * 2;
            ctx.fillStyle = barInitialColors[2];
            ctx.fillRect(x, y, barsDrawSettings.barUnitWidth * 4, 5 * barsDrawSettings.barHeight);

            x += barsDrawSettings.barUnitWidth * 4;
            y -= barsDrawSettings.barHeight * 1;
            ctx.fillStyle = barInitialColors[3];
            ctx.fillRect(x, y, barsDrawSettings.barUnitWidth * 2, 6 * barsDrawSettings.barHeight);

            x += barsDrawSettings.barUnitWidth * 2;
            // y -= barsDrawSettings.barHeight * 2;
            ctx.fillStyle = barInitialColors[4];
            ctx.fillRect(x, y, barsDrawSettings.barUnitWidth * 1, 6 * barsDrawSettings.barHeight);

            x += barsDrawSettings.barUnitWidth * 1;
            y -= barsDrawSettings.barHeight * 2;
            ctx.fillStyle = barInitialColors[5];
            ctx.fillRect(x, y, barsDrawSettings.barUnitWidth * 1, 8 * barsDrawSettings.barHeight);


            ctx.globalAlpha = 1
        }


        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i]
            ctx.fillStyle = box.getColor();
            ctx.fillRect(box.x, box.y, box.width, box.height);
        }

        ctx.lineWidth = 2
        ctx.beginPath();
        for (let i = values.length-1; i >= 0; i--) {
            const v = values[i];
            const barWidth = barsDrawSettings.barUnitWidth * v;
            const x = barsDrawSettings.leftX + barsWidth - barWidth;
            const y = barsDrawSettings.topY + barsDrawSettings.barHeight * (values.length -1 - i);
            ctx.rect(x, y, barWidth, barsDrawSettings.barHeight);
        }
        ctx.stroke();
        ctx.stroke();

        ctx.fillStyle = fontColor
        if (state.drawLines) {
            ctx.font = "24px sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            const linesToDraw = Math.round(Math.log2(nextPowerOfTwoValue));
            let remainingWidth = barsWidth;
            let powerOfTwoValue = nextPowerOfTwoValue;
            ctx.beginPath();
            for (let i = 0; i <= linesToDraw; i++) {
                const x = barsDrawSettings.leftX + barsWidth - remainingWidth;
                ctx.moveTo(x, barsDrawSettings.topY - 5);
                ctx.lineTo(x, barsDrawSettings.topY + barsDrawSettings.barHeight * values.length + 5);
                ctx.fillText(powerOfTwoValue, x, barsDrawSettings.topY + barsDrawSettings.barHeight * values.length + 20)
                powerOfTwoValue = powerOfTwoValue/ 2;
                remainingWidth = remainingWidth / 2;
            }
            ctx.stroke();
            ctx.stroke();
        }

        if (state.drawHeights) {
            const heightMarkerMarginX = 3;
            const heightMarkerMarginY = 2;
            const curlyBracketWidth = 15;
            const curlyBracketFont = "24px sans-serif";
            drawVerticalCurlyBracket(ctx, barsDrawSettings.leftX + barsWidth + heightMarkerMarginX, barsDrawSettings.topY + heightMarkerMarginY                             , barsDrawSettings.barHeight * 2 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₀ = 2", 'right', curlyBracketFont);
            drawVerticalCurlyBracket(ctx, barsDrawSettings.leftX + barsWidth + heightMarkerMarginX, barsDrawSettings.topY + heightMarkerMarginY + barsDrawSettings.barHeight * 2, barsDrawSettings.barHeight * 1 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₂ = 1", 'right', curlyBracketFont);
            drawVerticalCurlyBracket(ctx, barsDrawSettings.leftX + barsWidth + heightMarkerMarginX, barsDrawSettings.topY + heightMarkerMarginY + barsDrawSettings.barHeight * 3, barsDrawSettings.barHeight * 2 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₃ = 2", 'right', curlyBracketFont);
            drawVerticalCurlyBracket(ctx, barsDrawSettings.leftX + barsWidth + heightMarkerMarginX, barsDrawSettings.topY + heightMarkerMarginY + barsDrawSettings.barHeight * 5, barsDrawSettings.barHeight * 3 - 2 * heightMarkerMarginY, curlyBracketWidth, "h₅ = 3", 'right', curlyBracketFont);
        }

        if (state.drawText) {
            ctx.drawImage(optCostImage, 200, 820, 236, 90);
            ctx.drawImage(greedyCostImage, 600, 720, 683, 257);
        }
    };
    const mouseDown = e => {
        state.dragStart = true; 
    };

    const mouseUp = e => {
        state.dragStart = false; 
        const mouseX = slideshowState.mousePosition.x; 
        const mouseY = slideshowState.mousePosition.y;
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(mouseX, mouseY, matrixDrawSettings);
        if (matrix.isValidIndex(matrixX, matrixY)) {
            if (e.button === 0 ) {
                if (e.shiftKey) {
                    matrix.setValue(matrixX, matrixY, state.currentColor)
                }
                else {
                    matrix.setValue(matrixX, matrixY, barInitialColors[values.length - 1 - matrixY])
                }
            }
            if (e.button === 2 ) {
                matrix.setValue(matrixX, matrixY, 'rgba(0, 0, 0, 0)')
            }
        }

        for (const box of boxes) {
            if (box.x <= mouseX && mouseX <= box.x + box.width && box.y <= mouseY && mouseY <= box.y + box.height) {
                box.onClick();
                return;
            }
        }
        
    };
    const mouseMove = (e) => {
        if (state.dragStart) {
            const mouseX = slideshowState.mousePosition.x; 
            const mouseY = slideshowState.mousePosition.y;
            const [matrixX, matrixY] = canvasCoordsToMatrixIndices(mouseX, mouseY, matrixDrawSettings);
            
            if (matrix.isValidIndex(matrixX, matrixY)) {
                if (e.shiftKey) {
                    matrix.setValue(matrixX, matrixY, state.currentColor)
                }
                else {
                    matrix.setValue(matrixX, matrixY, barInitialColors[values.length - 1 - matrixY])
                }
            }

            for (const box of boxes) {
                if (box.x <= mouseX && mouseX <= box.x + box.width && box.y <= mouseY && mouseY <= box.y + box.height) {
                    box.onClick();
                    return;
                }
            }
 
        }
    }



    let keydown = event => {
        if (event.code === 'KeyR') {
            state.reset();
        }
        if (event.code === 'KeyM') {
            state.drawMatrix = !state.drawMatrix;
        }
        if (event.code === 'KeyH') {
            state.drawHeights = !state.drawHeights;
        }
        if (event.code === 'KeyB') {
            state.drawBarsUpperBounds = !state.drawBarsUpperBounds;
        }
        if (event.code === 'KeyL') {
            state.drawLines = !state.drawLines;
            // state.step += event.shiftKey? -1 : 1;
        }
        if (event.code === 'KeyX') {
            state.clearMatrix();
            
        }
        if (event.code === 'KeyU') {
            state.clearMatrix();

            for (let x = 0; x <= 15; x++) {
                matrix.setValue(x, 7, barInitialColors[0])
            }
            for (let x = 0; x <= 40; x++) {
                matrix.setValue(x, 6, barInitialColors[0])
            }
            for (let x = 0; x <= 60; x++) {
                matrix.setValue(x, 5, barInitialColors[0])
            }

            for (let x = 0; x <= 65; x++) {
                matrix.setValue(x, 4, barInitialColors[2])
            }
            for (let x = 0; x <= 72; x++) {
                matrix.setValue(x, 3, barInitialColors[2])
            }

            matrix.setValue(77, 2, barInitialColors[3])
            matrix.setValue(76, 2, barInitialColors[3])

            matrix.setValue(79, 1, barInitialColors[4])
            matrix.setValue(80, 0, barInitialColors[4])
        }

        if (event.code === 'KeyA' || event.code === 'KeyC') {
            for (let x = 16; x <= 24; x++) {
                matrix.setValue(x, 7, barInitialColors[0])
            }
            for (let x = 41; x <= 44; x++) {
                matrix.setValue(x, 6, barInitialColors[0])
            }
            matrix.setValue(61, 5, barInitialColors[0])


            for (let x = 8; x <= 15; x++) {
                matrix.setValue(x, 7, barInitialColors[1])
            }
            for (let x = 33; x <= 40; x++) {
                matrix.setValue(x, 6, barInitialColors[1])
            }
            for (let x = 53; x <= 60; x++) {
                matrix.setValue(x, 5, barInitialColors[1])
            }


            for (let x = 4; x <= 7; x++) {
                matrix.setValue(x, 7, barInitialColors[2])
            }
            for (let x = 29; x <= 32; x++) {
                matrix.setValue(x, 6, barInitialColors[2])
            }
            for (let x = 49; x <= 52; x++) {
                matrix.setValue(x, 5, barInitialColors[2])
            }
            for (let x = 66; x <= 68; x++) {
                matrix.setValue(x, 4, barInitialColors[2])
            }
            for (let x = 73; x <= 75; x++) {
                matrix.setValue(x, 3, barInitialColors[2])
            }
            
            for (let x = 2; x <= 3; x++) {
                matrix.setValue(x, 7, barInitialColors[3])
            }
            for (let x = 27; x <= 28; x++) {
                matrix.setValue(x, 6, barInitialColors[3])
            }
            for (let x = 47; x <= 48; x++) {
                matrix.setValue(x, 5, barInitialColors[3])
            }
            for (let x = 64; x <= 65; x++) {
                matrix.setValue(x, 4, barInitialColors[3])
            }
            for (let x = 71; x <= 72; x++) {
                matrix.setValue(x, 3, barInitialColors[3])
            }
            matrix.setValue(78, 2, barInitialColors[3])

            matrix.setValue(1, 7, barInitialColors[4])
            matrix.setValue(26, 6, barInitialColors[4])
            matrix.setValue(46, 5, barInitialColors[4])
            matrix.setValue(63, 4, barInitialColors[4])
            matrix.setValue(70, 3, barInitialColors[4])
            matrix.setValue(77, 2, barInitialColors[4])

            matrix.setValue(0, 7, barInitialColors[5])
            matrix.setValue(25, 6, barInitialColors[5])
            matrix.setValue(45, 5, barInitialColors[5])
            matrix.setValue(62, 4, barInitialColors[5])
            matrix.setValue(69, 3, barInitialColors[5])
            matrix.setValue(76, 2, barInitialColors[5])
            matrix.setValue(79, 1, barInitialColors[5])
            matrix.setValue(80, 0, barInitialColors[5])
        }

        if (event.code === 'KeyT') {
            state.drawText = !state.drawText;
        }
        
        if (event.code === 'Digit1') {
            state.currentColor = 'rgba(0, 0, 0, 0)'
        }
        if (event.code === 'Digit2') {
            state.currentColor = barInitialColors[0]
        }
        if (event.code === 'Digit3') {
            state.currentColor = barInitialColors[1]
        }
        if (event.code === 'Digit4') {
            state.currentColor = barInitialColors[2]
        }
        if (event.code === 'Digit5') {
            state.currentColor = barInitialColors[3]
        }
        if (event.code === 'Digit6') {
            state.currentColor = barInitialColors[4]
        }
        if (event.code === 'Digit7') {
            state.currentColor = barInitialColors[5]
        }
        if (event.code === 'Digit8') {
            state.currentColor = barInitialColors[6]
        }
        if (event.code === 'Digit9') {
            state.currentColor = barInitialColors[6]
        }
        if (event.code === 'Digit0') {
            state.currentColor = barInitialColors[7]
        }
         
    }
    const slideStart = () => {
        document.addEventListener('keyup', keydown);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', keydown)
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

function createNervousVsGreedySlides(slideshowState, matrixDrawSettings) {
    // Special family
    // Split Nervous into phases
    // Order greedy set removals
    // Lower bound greedy cost in phase
    // Good vs bad sets
    // 50 success 
    matrixDrawSettings = {
        ...matrixDrawSettings,
        cellWidth: 1000 / 100,
        lineWidth: 0.5
    }
    const rowCount = 100;
    const columnCount = 100;
    const columnLengths = [16, 13, 12, 10, 8, 7, 6, 5, 4, 3, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    const columnAccum = columnLengths.scanLeft(add, 0)
    console.log(columnAccum)
    const state = {
        visibleNumbers: new Map(),
        deletedRows: new Set(),
        colorColumns: false,
        hoverCell: {x: -1, y: -1},
        reset: function() {
            state.visibleNumbers = new Map();
            state.deletedRows = new Set()
        }
    };
    const columnMatrix = Array(rowCount * columnCount).fill(0);

    let x = 0;
    for (let i = 0; i < rowCount; i++) {
        if (i >= columnAccum[x]) {
            x += 1;
        } 
        if (i < rowCount * 0.66) {
            columnMatrix[i * columnCount + x] = 2;
        } else {
            columnMatrix[i * columnCount + x] = 1;
        }
        
    }
    
    const matrix = new SaddlepointSlideMatrix(rowCount, columnCount, () => [...columnMatrix]);
    const draw = ctx => {
        // We only want it to draw numbers that we have clicked on
        // We want to "delete" rows
        drawMatrix(ctx, matrix, {...matrixDrawSettings, 
            drawMatrixValue: (ctx, x, y, matrix) => {
                ctx.fillStyle = 'black'
                const value = matrix.getValue(x, y,)
                if (value > 0) {
                    if (state.colorColumns) {
                        if (value === 1) {
                            ctx.fillStyle = greaterThanColor
                        } else if (value === 2) {
                            ctx.fillStyle = smallerThanColor
                        }
                    }
                    drawMatrixSquare(ctx, x, y, matrixDrawSettings);
                }
                
            }
        });
    };
    const mouseDown = e => {
    };
    const mouseUp = e => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, matrixDrawSettings);
    };
    const mouseMove = () => {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, matrixDrawSettings);
        state.hoverCell.x = matrixX;
        state.hoverCell.y = matrixY;
    }
    let keyup = event => {
        if (event.code === 'KeyR') {
            state.reset();
        }
        if (event.code === 'KeyC') {
            state.colorColumns = !state.colorColumns
        }
    }
    const slideStart = () => {
        document.addEventListener('keyup', keyup);
    }
    const slideEnd = () => {
        document.removeEventListener('keyup', keyup)
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

const saddlepointMatrix = [
8, 13, 60, 31, 35, 6, 28, 39, 32, 12, 7, 33, 50, 89, 10, 65, 73, 91, 50, 97, 82, 30, 42, 83, 40
]

const pseudoSaddlepointMatrix = [
8, 13, 60, 31, 35, 6, 28, 39, 32, 12, 7, 33, 27, 89, 10, 65, 73, 91, 50, 97, 82, 30, 42, 83, 40
]