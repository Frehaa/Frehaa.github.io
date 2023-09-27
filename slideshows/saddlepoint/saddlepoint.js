"use strict";

// TODO: Pick different colors for color blindness. E.g. for red-green colorblind
const blue = `rgba(50, 100, 255, 1)`;

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

function drawMatrix(ctx, matrix, threshold, drawSettings) {
    const {leftX, topY, cellWidth, valueWidthRatio, lineWidth} = drawSettings;
    const width = matrix.columns * cellWidth;
    const height = matrix.rows * cellWidth;
    ctx.lineWidth = lineWidth
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
        drawSettings.drawMatrixValue(ctx, x, y, matrix, threshold);
        // drawMatrixValue( drawSettings);
    }
}

function drawMatrixCircle(ctx, x, y, drawSettings) {
    const circleRadiusToCellWidthRatio = 0.4
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    ctx.beginPath();
    ctx.arc(centerX, centerY, drawSettings.cellWidth * circleRadiusToCellWidthRatio , 0, 2 * Math.PI);
    ctx.fill();
}

function drawMatrixSquare(ctx, x, y, drawSettings) {
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    ctx.fillRect(centerX - drawSettings.cellWidth / 2, centerY - drawSettings.cellWidth / 2, drawSettings.cellWidth, drawSettings.cellWidth);
}

function writeMatrixValue(ctx, x, y, matrix, drawSettings) {
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    ctx.fillStyle = 'black';
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const text = matrix.getValue(x, y).toString();
    ctx.fillText(text, centerX, centerY )
}

function drawMatrixCircleByThreshold(ctx, x, y, matrix, threshold, drawSettings) {
    const value = matrix.getValue(x, y);
    if (value > threshold) {
        ctx.fillStyle = 'red';
    } else if (value < threshold) {
        ctx.fillStyle = 'green'
    } else {
        ctx.fillStyle = blue
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
            drawMatrix(ctx, matrix, 0, matrixDrawSettings);
            ctx.fillStyle = 'green'
            allSamples.slice(0, currentSampleCount).forEach(sample => {
                drawMatrixCircle(ctx, sample[1], sample[0], matrixDrawSettings);
            });
            ctx.fillStyle = 'grey'
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

            ctx.fillStyle = 'grey'
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
        drawMatrix(ctx, matrix, 0, matrixDrawSettings);
        ctx.fillStyle = 'green'
        allSamples.forEach(sample => {
            drawMatrixCircle(ctx, sample[1], sample[0], matrixDrawSettings);
        });
        ctx.fillStyle = 'grey'
        removedRows.forEach(row => {
            for (let j = 0; j < matrix.columns; j++) {
                drawMatrixSquare(ctx, j, row, matrixDrawSettings);
            }
        });
    }));

    const bestRow = rowsToSample[0];
    result.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, 0, matrixDrawSettings);
        ctx.fillStyle = 'green'
        allSamples.forEach(sample => {
            drawMatrixCircle(ctx, sample[1], sample[0], matrixDrawSettings);
        });
        ctx.fillStyle = 'grey'
        removedRows.forEach(row => {
            for (let j = 0; j < matrix.columns; j++) {
                drawMatrixSquare(ctx, j, row, matrixDrawSettings);
            }
        });

        ctx.fillStyle = 'yellow'
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
            ctx.fillStyle = 'grey'
            drawMatrix(ctx, matrix, threshold, matrixDrawSettings)
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

function createMatrix(rows, columns, dataInitializer) {
    return {
        columns,
        rows,
        data: dataInitializer(rows, columns),
        getValue: function(x, y) {
            return this.data[x + y * this.columns];
        },
        setValue: function(x, y, v) {
            this.data[x + y * this.columns] = v;
        }
    };
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

            ctx.fillStyle = 'black'
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

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'middle'

    const startTimeMs = Date.now();
    const presentationDuration = 5 * 60 * 1000 - 10000;
    const timerPositionX = 1800
    const timerPositionY = 1000
    const timer = createTimer(timerPositionX, timerPositionY, 40, presentationDuration);
    timer.draw = function(){} // Disable visual timer 

    // setTimeout(() => { // Call a function when time is up. The presentation ends with a black screen
    //     document.body.removeChild(canvas);
    //     document.body.style = 'background-color: black'
    // }, presentationDuration);

    const slideshowState = initializeSlideshowState()
    initializeSlideshowEventListeners(canvas, slideshowState);

    const matrix = createMatrix(10, 10, () => goodNumberedMatrixData);

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
            drawMatrixCircleByThreshold(ctx, x, y, matrix, thresholdState.threshold, this);
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

    const thresholdState = {
        threshold: matrix.getValue(thresholdX, thresholdY)
    }

    const slideTitleFont = "70px sans-serif";
    const slideBulletFont = "48px sans-serif";
    const slideTextDefaultX = 1100
    const slideTitleTextDefaultY = 80;
    const slideTextBulletPointStartY = 200
    const slideTextBulletPointMajorOffsetY = 75
    const slideTextBulletPointMinorOffsetY = 50

    const bulletPointWriter = createBulletPointWriter(ctx, slideBulletFont, slideTextDefaultX, slideTextBulletPointStartY, slideTextBulletPointMinorOffsetY, slideTextBulletPointMajorOffsetY);

    // Slide 1: Introduction
    slideshowState.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawNumberedOnly);
        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("Saddlepoints in matrices", slideTextDefaultX, slideTitleTextDefaultY);

        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("Me: Frederik Haagensen");
        bulletPointWriter.writeMajorBullet("Current Supervisor: Riko Jacob");
        bulletPointWriter.writeMajorBullet("Representing: Algorithms group");
        bulletPointWriter.writeMajorBullet("Experts in Unusual PhD processes");

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    // Slide 2: Explanation
    slideshowState.slides.push(createDrawSlide(ctx => {
        ctx.fillStyle = blue
        drawMatrixCircle(ctx, thresholdX, thresholdY, defaultMatrixDrawSettings)
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawNumberedOnly);

        ctx.textAlign = 'left'
        ctx.font = slideTitleFont;
        ctx.fillText("What is a saddlepoint?", slideTextDefaultX, slideTitleTextDefaultY);
        
        bulletPointWriter.startWriting();
        bulletPointWriter.writeMajorBullet("- Maximum value in its row");
        bulletPointWriter.writeMajorBullet("- Minimum value in its column");

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    // Slide 3: Explanation with color
    slideshowState.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

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
        ctx.fillStyle = 'green';
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = blue;
        drawCircle(1280, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("<", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = 'red';
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = blue;
        drawCircle(1280, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText(">", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    // Slide 4: Motivation
    slideshowState.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

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

        timer.draw(ctx, Date.now() - startTimeMs);
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
    slideshowState.slides.push(combineSlides(bulletPointSlide, createDrawSlide(ctx => {
        timer.draw(ctx, Date.now() - startTimeMs);
    })));

    // Slide 6: lower and upper bounds
    let interactiveNumberSlide = createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

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
        ctx.fillStyle = 'green';
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = 'red';
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("> t", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    });
    interactiveNumberSlide.isInteractable = true;
    interactiveNumberSlide.mouseDown = function() { // Update threshold (guess) based on the cell clicked on
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, defaultMatrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;

        thresholdState.threshold = matrix.getValue(matrixX, matrixY);
    }
    slideshowState.slides.push(interactiveNumberSlide);

    // Slide 7: Reducing search space
    interactiveNumberSlide = createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

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
        ctx.fillStyle = 'green';
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = 'red';
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("> t", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    });
    interactiveNumberSlide.isInteractable = true;
    interactiveNumberSlide.mouseDown = function() { // Update threshold (guess) based on the cell clicked on
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(slideshowState.mousePosition.x, slideshowState.mousePosition.y, defaultMatrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;

        thresholdState.threshold = matrix.getValue(matrixX, matrixY);
    }
    slideshowState.slides.push(interactiveNumberSlide);

    // Walking algorithm
    const dogImage = new Image();
    dogImage.src = "dog_shibainu_brown.png"; // Relative path
    const walkMatrix = {...matrix, data: goodWalkMatrixData}

    const greenCircleLegendHeight = 700;
    const redCircleLegendHeight = 800;

    const walkSlides = createWalkSlides(walkMatrix, goodWalkMatrixData[99], matrixDrawSettingsDrawCircleOnly, dogImage);
    slideshowState.slides.push(...walkSlides.map(slide => { // Create the walk slides and then update them
        return combineSlides(slide, createDrawSlide(ctx => {
            ctx.fillStyle = 'black';
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
            ctx.fillStyle = 'green';
            drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = 'black';
            ctx.fillText("< t", 1200, greenCircleLegendHeight);

            // Second circle comparison legend
            ctx.fillStyle = 'red';
            drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = 'black';
            ctx.fillText("> t", 1200, redCircleLegendHeight);

            timer.draw(ctx, Date.now() - startTimeMs);
        }));
    }));

    // Explain diagonal algorithm and issue
    slideshowState.slides.push(combineSlides(walkSlides[walkSlides.length-1], createDrawSlide(ctx => {
        ctx.fillStyle = 'black';
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
        ctx.fillStyle = 'green';
        drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        // Second circle comparison legend
        ctx.fillStyle = 'red';
        drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
        ctx.fillStyle = 'black';
        ctx.fillText("> t", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    })));

    // Explain sampling process
    const samplingMatrix = createMatrix(100, 100, (rows, columns) => randomList(rows * columns));
    const samplingMatrixDrawSettings = {
        ...matrixDrawSettingsDrawCircleOnly,
        cellWidth: 1000 / samplingMatrix.columns,
        drawMatrixValue: function() {}, // Leave values empty seems to work well for the big thing
        lineWidth: 1
    };

    const sampleSlides = createSampleSlides(samplingMatrix, samplingMatrixDrawSettings);
    slideshowState.slides.push(...sampleSlides.map(slide => {
        return combineSlides(slide, createDrawSlide(ctx => {
            ctx.fillStyle = 'black';
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
            ctx.fillStyle = 'green';
            drawCircle(1150, greenCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = 'black';
            ctx.fillText("< t", 1200, greenCircleLegendHeight);

            // Second circle comparison legend
            ctx.fillStyle = 'grey';
            drawCircle(1150, redCircleLegendHeight, circleRadius, ctx)
            ctx.fillStyle = 'black';
            ctx.fillText(" There is a value in row > t", 1200, redCircleLegendHeight);

            timer.draw(ctx, Date.now() - startTimeMs);
        }));
    }));
    slideshowState.startSlideShow(ctx);
}

const goodNumberedMatrixData = [ 8, 13, 20, 31, 35, 6, 38, 49, 22, 12, 7, 33, 16, 89, 80, 65, 73, 97, 50, 91, 82, 30, 27, 83, 40, 10, 98, 88, 71, 26, 23, 29, 56, 41, 53, 4, 58, 48, 51, 32, 1, 17, 18, 25, 28, 37, 45, 46, 5, 21, 36, 19, 69, 34, 92, 59, 100, 77, 79, 78, 68, 42, 74, 95, 60, 96, 75, 72, 11, 90, 9, 44, 54, 52, 61, 93, 99, 67, 14, 43, 62, 64, 76, 3, 57, 86, 94, 63, 87, 47, 15, 66, 55, 70, 84, 39, 85, 81, 2, 24 ];
const goodWalkMatrixData = [ 0.3369543176531483, 0.7475841645906165, 0.22148343290999106, 0.9753343279336559, 0.07171949251627063, 0.6314571742956901, 0.8597003401514846, 0.0629034883322871, 0.05602895906356853, 0.44454342270750513, 0.4184705278561023, 0.6145779386865525, 0.9755668551656638, 0.9493635274249015, 0.13300957853026052, 0.6602776306069787, 0.3131992836381994, 0.9304742495544824, 0.7536041313732724, 0.6054208181741596, 0.9883512287734862, 0.45923723786307313, 0.49024518451092647, 0.8523604383964151, 0.03494121174341802, 0.6460489972643122, 0.7294505033055466, 0.8118894000685495, 0.3841931342580417, 0.40139693178644986, 0.6348220190123802, 0.7294735091990421, 0.16118358053757686, 0.6259863451699992, 0.35517671369827164, 0.408404787066854, 0.7716057603869121, 0.7808934386362014, 0.2570749095554089, 0.516527867565138, 0.6014788355558471, 0.7791197933269675, 0.877415529911511, 0.5687084533525193, 0.6362523494315137, 0.533492944004766, 0.2899822557562578, 0.9922620938769392, 0.22703265193101685, 0.986353591320075, 0.9230195387310923, 0.5598735898812519, 0.5557787793562171, 0.06820125212862183, 0.3331005954243612, 0.8295513311472502, 0.813210928785713, 0.6798080832940311, 0.5702723428914253, 0.3826786524811153, 0.9252839819516591, 0.3336998088134061, 0.03785920896456774, 0.8065848589685845, 0.5898017431529416, 0.14765716096292725, 0.1791058942355107, 0.9582011511337313, 0.6740104441179532, 0.3129448659808334, 0.478873450953622, 0.35337879097195946, 0.42450856499053813, 0.9154926505100215, 0.4258124709947422, 0.47717785984268946, 0.09560004847962078, 0.5447580997324383, 0.30307272034335186, 0.9219955695625424, 0.38227569642461623, 0.29606372081187127, 0.8211324950805537, 0.03514764982989638, 0.7864035568633203, 0.5912839839805406, 0.8344457308228863, 0.639154180540306, 0.18071312774553416, 0.6540258249190544, 0.5732406993529225, 0.5065048468990908, 0.40370221974494214, 0.5437032181121022, 0.43694153878583464, 0.8363592625013838, 0.6121438266231511, 0.7779107840897593, 0.0723578970716997, 0.6737672430790856 ];