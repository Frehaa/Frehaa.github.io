"use strict";

const blue = `rgba(50, 100, 255, 1)`;

// ######### HELPER FUNCTIONS ######
function randomList(size) {
    const result = [];
    for (let i = 0; i < size; ++i) {
        result.push(Math.random());
    }
    return result;
}

function randomInt(max) { // Exclusive max
    return Math.floor(Math.random() * max)
}

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
    let matrixX = Math.floor((x - leftX) / cellWidth);
    let matrixY = Math.floor((y - topY) / cellWidth);
    return [matrixX, matrixY];
}

// Bugged, but working good enough for finding a good configuration
function makePositionStrictSaddlepoint(matrix, x, y) {
    // for (let i = 0; i < matrix.columns; ++i) {
    //     if (i == x) continue;
    //     const val = matrix.getValue(i, y);
    //     if (val > value) {
    //         matrix.data[i + y * matrix.columns] = Math.random() * value;
    //     }
    // }

    // For every value in the row, compare it to all the values in the column and make sure that it is smaller than them all. If it is bigger, then swap
    let rowMax = -Infinity;
    let rowMaxIndex = null;
    for (let j = 0; j < matrix.columns; ++j) {
        for (let i = 0; i < matrix.rows; ++i) {
            const a = matrix.getValue(j, y);
            const b = matrix.getValue(x, i);
            if (a > b) {
                const tmp = a;
                matrix.setValue(j, y, b);
                matrix.setValue(x, i, tmp);
            }
        }

        const rowValue = matrix.getValue(j, y);
        if (rowValue > rowMax) {
            rowMax = rowValue;
            rowMaxIndex = j;
        }
    }

    const tmp = matrix.getValue(x, y);
    matrix.setValue(x, y, rowMax);
    matrix.setValue(rowMaxIndex, y, tmp);

    // for (let i = 0; i < matrix.rows; ++i) {
    //     if (i == y) continue;
    //     const val = matrix.getValue(x, i);
    //     if (val < value) {
    //         matrix.data[x + i * matrix.columns] = Math.random() * (1 - value) + value;
    //     }
    // }
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
    const {leftX, topY, cellWidth, valueWidthRatio, lineWidth} = matrixDrawSettings;

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
                const x = path[j][0];
                const y = path[j][1];
                const previousX = path[j-1][0];
                const previousY = path[j-1][1];
                if (j < path.length - 1) {
                    drawMatrixCircleByThreshold(ctx, x, y, matrix, threshold, matrixDrawSettings);
                }

                // ctx.save();
                // ctx.fillStyle = 'black';
                // let [centerX, centerY] = matrixIndicesToCanvasCoords(previousX, previousY, matrixDrawSettings);
                // ctx.lineWidth = cellWidth * 0.1
                // ctx.strokeStyle = 'purple'
                // if (x != previousX) {
                    // drawVerticalArrow(centerX, topY, cellWidth * matrix.rows, 0, 0, ctx);
                // } else {
                    // drawHorizontalArrow(leftX, centerY, cellWidth * matrix.columns, 0, 0, ctx);
                // }
                // ctx.restore();
            }
            const x = path[i][0];
            const y = path[i][1];
            const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, matrixDrawSettings);

            const imageSize = cellWidth * 0.8;
            ctx.drawImage(dogImage, centerX - imageSize / 1.2 , centerY - imageSize / 3, imageSize, imageSize);
        }));
    }

    return result;
}

// Right now I have an issue where I will stroke the same area multiple times. This may create some ugly artifacts.
// TODO: Properly handle scaling. Right now the canvas goes 100% 100% with a fixed size of 1920 by 1280. If the window size is different then this results in weird figures

// What is the script?
// WHO AM I/WE: Hello, my name is Frederik, I am a PhD student working with Riko and representing some of the stuff going on in the Algorithms coridor
// GENERAL TOPIC (ALGORITHMS MATRICES): The topic I will be talking about is about finding a specific type of value in a matrix (show a matrix). The kind of value we are researching efficient algorithms for finding, are called "saddlepoints", or in our case "strict saddlepoints"
// EXPLAIN PROBLEM: A saddlepoint in the context of matrices, is a value which is the maximum of its row, and the minimum of its column. And we are concerned in when it is the strict maximum in the row and the strict minimum in its column. (How does this look like)
// WHY IS THIS COOL: Game theory zero-sum game pure strategy
// MORE PROBLEM EXPLAINING: Note that a matrix might not have any saddlepoints, strict or not, but we still want to be able to tell whether one exists, in as few probes as possible. In particular, for an $n$ by $n$ matrix, i.e. one which has $n^2$ number of values, we are researching whether it is possible to tell whether the matrix has a strict saddlepoint in O(n) operations, so only looking at a tiny part of the all the values, or if there is some lower bound on the problem
// HISTORY: To give a brief history of the problem.
// 1. Knut gave some O(n^2) algorithms for finding non-strict saddlepoints in (1968)
// 2. Somebody else gave O(n^1.59) for the strict saddlepoint (and conjectured optimality>) and proved that non-strict had a lower bound of O(n^2) in (19??)
// 3. 2 more gave (n log n) in (19??)
// 4. Dagstuhl (2023) wanted to find an (n log n) lower bound
// 5. PRESENT O(n log* n) deterministic + O(n) random (This is the part where we brag). "Together with co-authers from Dagstuhl, we broke the n log n barrier and managed to find an n log* n deterministic algorithm which we submitted last month. And now, we are in the proccess of finalizing details for an O(n) randomized algorithm"
// WHY IS THIS HARD?:
// Here we talk about the complicated lemmas. What are they.
// IF WALK RIGHT THEN TOO BIG => ROWS WITH BIGGER VALUES DOES NOT CONTAIN SADDLEPOINT (BECAUSE THE SADDLE POINT HAS TO BE MAXIMUM, SO IF IT IS SMALLER THEN IT CANNOT BE THE MAXIMUM)


// 1. Show matrix of numbers from 1 to n^2
// 2. Highlight the saddlepoint
// 3. Show the green red separation
// 4. Show that if value is smaller => Red wall and if value is larger => green wall
// 5. Demonstrate for multiple values
// 6. Do the walk
// 7. The main lemma about removing rows or columns
// 8. Why is this not enough. We can get bad luck when selecting pivot points and only remove rows / columns
// 9. We want a way which guarantees finding a good value for walking and removing rows or columns as desired. I.e. guarantee the value is smaller or bigger than the saddlepoint (if it exists)
// 10. Introducing Random Sampling!
// 11. General idea (sample once in everything. Do not sample again from places with big values. Rince repeat. When few rows, sample a lot)
// 12. Key insight lemma

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

function drawTimer(ctx, x, y, elapsed, total) {

    // console.log(elapsed, total)
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

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'middle'

    const startTimeMs = Date.now();
    const fiveMinutesMinus10secondsMs = 5 * 60 * 1000 - 10000;
    const timerPositionX = 1800
    const timerPositionY = 1000
    const timer = createTimer(timerPositionX, timerPositionY, 40, fiveMinutesMinus10secondsMs);

    // When time is up, the presentation ends.
    setTimeout(() => {
        document.body.removeChild(canvas);
        document.body.style = 'background-color: black'
    }, fiveMinutesMinus10secondsMs);

    const state = initializeSlideshowState()
    initializeSlideshowEventListeners(canvas, state);

    const matrix = createMatrix(10, 10, () => goodNumberedMatrixData);

    const defaultMatrixDrawSettings = {
        leftX: 40,
        topY: 50,
        cellWidth: 100,
        lineWidth: 2
    };
    const matrixDrawSettingsDrawNumberedOnly = {
        ...defaultMatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix, threshold) {
            writeMatrixValue(ctx, x, y, matrix, this);
        }
    };
    const matrixDrawSettingsDrawColoredCircledValue = {
        ...defaultMatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix, threshold) {
            drawMatrixCircleByThreshold(ctx, x, y, matrix, thresholdState.threshold, this);
            writeMatrixValue(ctx, x, y, matrix, this);
        }
    };
    const matrixDrawSettingsDrawCircleOnly = {
        ...defaultMatrixDrawSettings,
        drawMatrixValue: function(ctx, x, y, matrix, threshold) {
            drawMatrixCircle(ctx, x, y, this);
        }
    };
    const thresholdX = Math.floor(matrix.columns * 0.71);
    const thresholdY = Math.floor(matrix.rows * 0.47);

    let threshold = matrix.getValue(thresholdX, thresholdY);
    const thresholdState = {
        threshold: threshold
    }

    // Number slide
    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawNumberedOnly);
        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("Saddlepoints in matrices", 1100, 80);
        ctx.font = "48px sans-serif";
        ctx.fillText("Me: Frederik Haagensen", 1100, 200);
        ctx.fillText("Current Supervisor: Riko Jacob", 1100, 275);
        ctx.fillText("Representing: Algorithms group", 1100, 350);
        ctx.fillText("Experts in Unusual PhD processes", 1100, 425);

        timer.draw(ctx, Date.now() - startTimeMs);
    }));


    // Number slide with circled saddlepoint
    state.slides.push(createDrawSlide(ctx => {
        ctx.fillStyle = blue
        drawMatrixCircle(ctx, thresholdX, thresholdY, defaultMatrixDrawSettings)
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawNumberedOnly);

        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("What is a saddlepoint?", 1100, 80);
        ctx.font = "48px sans-serif";
        ctx.fillText("- Maximum value in its row", 1100, 200);
        ctx.fillText("- Minimum value in its column", 1100, 275);

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("What is a saddlepoint?", 1100, 80);
        ctx.font = "40px sans-serif";
        ctx.fillText("(colored edition)", 1300, 135);

        ctx.font = "48px sans-serif";
        ctx.fillText("- Surrounded by green in row", 1100, 200);
        ctx.fillText("- Surrounded by red in column", 1100, 275);
        ctx.fillText("- Does not necessarily exist", 1100, 350);
        ctx.fillText("- We are interested in the strict case", 1100, 425);

        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(1150, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = blue;
        ctx.beginPath();
        ctx.arc(1280, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("<", 1200, greenCircleLegendHeight);

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(1150, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = blue;
        ctx.beginPath();
        ctx.arc(1280, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText(">", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("Why is a saddlepoint?", 1100, 80);

        ctx.font = "48px sans-serif";
        ctx.fillText("- Pure strategy equilibrium", 1100, 200);
        ctx.fillText("  in a zero-sum two player game", 1100, 250);
        ctx.fillText("- In simple terms, a solution for chess", 1100, 325);
        ctx.fillText("  (though not a strict saddlepoint)", 1100, 375);
        ctx.fillText("- Fast algorithms are interesting", 1100, 450);
        ctx.fillText("  when values may be generated on", 1100, 500);
        ctx.fillText("  demand", 1100, 550);

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    const bulletPointSlide = createBulletPointSlides("When is a saddlepoint?", [
        "Optimal O(n^2) algorithm for non-strict saddlepoint in 1968",
        "O(n^1.59) algorithm for strict in 1988",
        "O(n log n) in 1991",
        "n log n lower bound question in Dagstuhl 2023",
        "Now: O(n log*n) deterministic & O(n) randomized sampling algorithm",
    ], {
        titleFont: "70px sans-serif",
        titleStart: 80,
        bulletFont: "48px sans-serif",
        bullet: "-",
        bulletStartLeft: 100,
        bulletStartTop: 200,
        bulletOffset: 75,
        bulletByBullet: false
    })[0];
    state.slides.push(combineSlides(bulletPointSlide, createDrawSlide(ctx => {
        timer.draw(ctx, Date.now() - startTimeMs);
    })));

    // Interactive number slide all values circled
    let interactiveNumberSlide = createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("How is a saddlepoint?", 1100, 80);
        ctx.font = "40px sans-serif";
        ctx.fillText("(rows and columns)", 1250, 135);

        ctx.font = "48px sans-serif";
        ctx.fillText('- Guess a value "t" for saddlepoint "s"', 1100, 200);
        ctx.fillText("- t < s ⇒ there is a column of red", 1100, 275);
        ctx.fillText("  (no column of red ⇒ t >= s)", 1100, 325);
        ctx.fillText("- t > s ⇒ there is a row of green", 1100, 400);
        ctx.fillText("  (no row of green ⇒ t <= s)", 1100, 450);

        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(1150, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(1150, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("> t", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    });
    interactiveNumberSlide.isInteractable = true;
    interactiveNumberSlide.mouseDown = function() { // Update threshold (guess) based on the cell clicked on
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(state.mousePosition.x, state.mousePosition.y, defaultMatrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;

        thresholdState.threshold = matrix.getValue(matrixX, matrixY);
    }
    state.slides.push(interactiveNumberSlide);

    // Interactive number slide 2 all values circled
    interactiveNumberSlide = createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);

        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("How is a saddlepoint?", 1100, 80);
        ctx.font = "40px sans-serif";
        ctx.fillText("(lower/upper bounds)", 1250, 135);

        ctx.font = "48px sans-serif";
        ctx.fillText('- A lower bound means s cannot be', 1100, 200);
        ctx.fillText("  in a column with a lower value", 1100, 250);
        ctx.fillText("  (because s cannot be minimum)", 1100, 300);
        ctx.fillText('- An upper bound means s cannot be', 1100, 375);
        ctx.fillText("  in a row with a higher value", 1100, 425);
        ctx.fillText("  (because s cannot be maximum)", 1100, 475);

        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(1150, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(1150, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("> t", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    });
    interactiveNumberSlide.isInteractable = true;
    interactiveNumberSlide.mouseDown = function() { // Update threshold (guess) based on the cell clicked on
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(state.mousePosition.x, state.mousePosition.y, defaultMatrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;

        thresholdState.threshold = matrix.getValue(matrixX, matrixY);
    }
    state.slides.push(interactiveNumberSlide);


    // Create slides for walk
    const dogImage = new Image();
    dogImage.src = "dog_shibainu_brown.png"; // Relative path
    const walkMatrix = {...matrix, data: goodWalkMatrixData}

    const greenCircleLegendHeight = 700;
    const redCircleLegendHeight = 800;

    const walkSlides = createWalkSlides(walkMatrix, goodWalkMatrixData[99], matrixDrawSettingsDrawCircleOnly, dogImage);
    state.slides.push(...walkSlides.map(slide => {
        return createDrawSlide(ctx => {
            slide.draw(ctx);

            ctx.fillStyle = 'black';
            ctx.textAlign = 'left'
            ctx.font = "70px sans-serif";
            ctx.fillText("How is a saddlepoint?", 1100, 80);
            ctx.font = "40px sans-serif";
            ctx.fillText("(linear time reduction)", 1250, 135);

            ctx.font = "48px sans-serif";
            ctx.fillText('- Go for a walk using guess t', 1100, 200);
            ctx.fillText("- Walk right on green value", 1100, 275);
            ctx.fillText("- Walk down on red value", 1100, 350);
            ctx.fillText("- Either visit all columns or all rows", 1100, 425);


            ctx.font = "48px sans-serif";
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(1150, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText("< t", 1200, greenCircleLegendHeight);

            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(1150, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText("> t", 1200, redCircleLegendHeight);

            timer.draw(ctx, Date.now() - startTimeMs);
        })
    }));

    // Explain algorithm and issue
    state.slides.push(createDrawSlide(ctx => {
        walkSlides[walkSlides.length-1].draw(ctx);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left'
        ctx.font = "70px sans-serif";
        ctx.fillText("How is a saddlepoint?", 1100, 80);
        ctx.font = "40px sans-serif";
        ctx.fillText("(linear time reduction)", 1250, 135);

        ctx.font = "48px sans-serif";
        ctx.fillText("- Pick t greater than many columns ", 1100, 200);
        ctx.fillText("  and smaller than many rows ", 1100, 250);
        ctx.fillText("  (e.g. median of diagonal) ", 1100, 300);

        ctx.fillText("- May only remove rows or columns", 1100, 375);
        ctx.fillText("  in every iteration", 1100, 425);

        ctx.fillText("- Fine for O(n log log n) algorithm", 1100, 500);
        ctx.fillText("  with an extra trick", 1100, 550);
        // ctx.fillText("- Walk down on red value", 1100, 350);
        // ctx.fillText("- Either visit all columns or all rows", 1100, 425);


        ctx.font = "48px sans-serif";
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(1150, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("< t", 1200, greenCircleLegendHeight);

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(1150, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText("> t", 1200, redCircleLegendHeight);

        timer.draw(ctx, Date.now() - startTimeMs);
    }));

    const samplingMatrix = createMatrix(100, 100, (rows, columns) => randomList(rows * columns));

    const samplingMatrixDrawSettings = {
        ...matrixDrawSettingsDrawCircleOnly,
        cellWidth: 1000 / samplingMatrix.columns,
        drawMatrixValue: function() {}, // Leave values empty seems to work well for the big thing
        lineWidth: 1
    };

    const sampleSlides = createSampleSlides(samplingMatrix, samplingMatrixDrawSettings);
    state.slides.push(...sampleSlides.map(slide => {
        return createDrawSlide(ctx => {
            slide.draw(ctx);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left'
            ctx.font = "70px sans-serif";
            ctx.fillText("How is a saddlepoint?", 1100, 80);
            ctx.font = "40px sans-serif";
            ctx.fillText("(randomly guessing better)", 1200, 135);

            ctx.font = "48px sans-serif";
            ctx.fillText("- Sample in every row", 1100, 200);
            ctx.fillText("- Remove some of the biggest rows", 1100, 275);
            ctx.fillText("- Repeat until few rows", 1100, 350);
            ctx.fillText("- Sample some more in remaining", 1100, 425);
            ctx.fillText("- Pick the maximum in the best row", 1100, 500);
            ctx.fillText("- All in linear time", 1100, 575);

            ctx.font = "48px sans-serif";
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(1150, greenCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText("< t", 1200, greenCircleLegendHeight);

            ctx.fillStyle = 'grey';
            ctx.beginPath();
            ctx.arc(1150, redCircleLegendHeight, defaultMatrixDrawSettings.cellWidth * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText(" There is a value in row > t", 1200, redCircleLegendHeight);

            timer.draw(ctx, Date.now() - startTimeMs);
        });
    }));
    state.startSlideShow(ctx);
}


const goodNumberedMatrixData = [ 8, 13, 20, 31, 35, 6, 38, 49, 22, 12, 7, 33, 16, 89, 80, 65, 73, 97, 50, 91, 82, 30, 27, 83, 40, 10, 98, 88, 71, 26, 23, 29, 56, 41, 53, 4, 58, 48, 51, 32, 1, 17, 18, 25, 28, 37, 45, 46, 5, 21, 36, 19, 69, 34, 92, 59, 100, 77, 79, 78, 68, 42, 74, 95, 60, 96, 75, 72, 11, 90, 9, 44, 54, 52, 61, 93, 99, 67, 14, 43, 62, 64, 76, 3, 57, 86, 94, 63, 87, 47, 15, 66, 55, 70, 84, 39, 85, 81, 2, 24 ];
const goodWalkMatrixData = [ 0.3369543176531483, 0.7475841645906165, 0.22148343290999106, 0.9753343279336559, 0.07171949251627063, 0.6314571742956901, 0.8597003401514846, 0.0629034883322871, 0.05602895906356853, 0.44454342270750513, 0.4184705278561023, 0.6145779386865525, 0.9755668551656638, 0.9493635274249015, 0.13300957853026052, 0.6602776306069787, 0.3131992836381994, 0.9304742495544824, 0.7536041313732724, 0.6054208181741596, 0.9883512287734862, 0.45923723786307313, 0.49024518451092647, 0.8523604383964151, 0.03494121174341802, 0.6460489972643122, 0.7294505033055466, 0.8118894000685495, 0.3841931342580417, 0.40139693178644986, 0.6348220190123802, 0.7294735091990421, 0.16118358053757686, 0.6259863451699992, 0.35517671369827164, 0.408404787066854, 0.7716057603869121, 0.7808934386362014, 0.2570749095554089, 0.516527867565138, 0.6014788355558471, 0.7791197933269675, 0.877415529911511, 0.5687084533525193, 0.6362523494315137, 0.533492944004766, 0.2899822557562578, 0.9922620938769392, 0.22703265193101685, 0.986353591320075, 0.9230195387310923, 0.5598735898812519, 0.5557787793562171, 0.06820125212862183, 0.3331005954243612, 0.8295513311472502, 0.813210928785713, 0.6798080832940311, 0.5702723428914253, 0.3826786524811153, 0.9252839819516591, 0.3336998088134061, 0.03785920896456774, 0.8065848589685845, 0.5898017431529416, 0.14765716096292725, 0.1791058942355107, 0.9582011511337313, 0.6740104441179532, 0.3129448659808334, 0.478873450953622, 0.35337879097195946, 0.42450856499053813, 0.9154926505100215, 0.4258124709947422, 0.47717785984268946, 0.09560004847962078, 0.5447580997324383, 0.30307272034335186, 0.9219955695625424, 0.38227569642461623, 0.29606372081187127, 0.8211324950805537, 0.03514764982989638, 0.7864035568633203, 0.5912839839805406, 0.8344457308228863, 0.639154180540306, 0.18071312774553416, 0.6540258249190544, 0.5732406993529225, 0.5065048468990908, 0.40370221974494214, 0.5437032181121022, 0.43694153878583464, 0.8363592625013838, 0.6121438266231511, 0.7779107840897593, 0.0723578970716997, 0.6737672430790856 ];