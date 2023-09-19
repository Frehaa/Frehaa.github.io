"use strict";
// ######### HELPER FUNCTIONS ######
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
    const {leftX, topY, cellWidth, valueWidthRatio} = drawSettings;
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

function writeMatrixValue(ctx, x, y, matrix, drawSettings) {
    const [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, drawSettings);
    ctx.fillStyle = 'black';
    // TODO: Font size dependent on cellwidth
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
        ctx.fillStyle = 'yellow'
    }
    drawMatrixCircle(ctx, x, y, drawSettings);
}

// ######## SLIDES ######

// TODO: Add dog image to walk
function createWalkSlides(matrix, threshold, matrixDrawSettings, dogImage) {
    const {leftX, topY, cellWidth, valueWidthRatio} = matrixDrawSettings;

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
                
                ctx.save();
                ctx.fillStyle = 'black';    
                let [centerX, centerY] = matrixIndicesToCanvasCoords(previousX, previousY, matrixDrawSettings);
                if (x != previousX) {
                    // drawHorizontalArrow(centerX, centerY, cellWidth *0.9, cellWidth * 0.15, cellWidth * 0.15, ctx);
                } else {
                    // drawVerticalArrow(centerX, centerY, cellWidth *0.9, cellWidth * 0.15, cellWidth * 0.15, ctx);
                }
                ctx.restore();
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
// 1. Knut gave some O(n^2) algorithms for finding non-strict saddlepoints in (19??)
// 2. Somebody else gave O(n^2-?) for the strict saddlepoint (and conjectured optimality>) and proved that non-strict had a lower bound of O(n^2) in (19??)
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

// TODO: Draw matrix with numbers

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;

    const state = initializeSlideshowState()
    initializeSlideshowEventListeners(canvas, state);

    const matrix = {
        columns: 10,
        rows: 10, 
        data: [],
        getValue: function(x, y) {
            return this.data[x + y * this.columns];
        }, 
        setValue: function(x, y, v) {
            this.data[x + y * this.columns] = v;
        }
    };
    const defaultMatrixDrawSettings = {
        leftX: 10,
        topY: 10,
        cellWidth: 100,
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

    matrix.data = goodNumberedMatrixData;
    let threshold = matrix.getValue(thresholdX, thresholdY);
    const thresholdState = {
        threshold: threshold
    }

    // Number slide
    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawNumberedOnly);
    }));

    // Number slide with circled saddlepoint
    state.slides.push(createDrawSlide(ctx => {
        ctx.fillStyle = 'yellow'
        drawMatrixCircle(ctx, thresholdX, thresholdY, defaultMatrixDrawSettings)
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawNumberedOnly);
    }));

    // Number slide all values circled
    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettingsDrawColoredCircledValue);
    }));

    const dogImage = new Image();
    dogImage.src = "dog_shibainu_brown.png";
    dogImage.onload = function() {
        console.log('dog')
        ctx.drawImage(dogImage, 10, 10)
    }


    // Make slide 3 interactive to allow changing current threshold
    state.slides[2].isInteractable = true
    state.slides[2].mouseDown = function() {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(state.mousePosition.x, state.mousePosition.y, defaultMatrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;
        
        thresholdState.threshold = matrix.getValue(matrixX, matrixY);
    }

    // Create slides for walk
    // const walkData = randomList(matrix.columns * matrix.rows);
    // console.log(walkData)
    const walkMatrix = {...matrix, data: goodWalkMatrixData}
    state.slides.push(...createWalkSlides(walkMatrix, goodWalkMatrixData[99], matrixDrawSettingsDrawCircleOnly, dogImage));

    // state.currentSlideIndex = 3;
    state.startSlideShow(ctx);
}

const goodNumberedMatrixData = [ 53, 86, 20, 31, 35, 65, 49, 99, 22, 64, 7, 33, 16, 89, 80, 6, 9, 97, 50, 91, 82, 30, 27, 83, 40, 10, 98, 88, 71, 26, 23, 94, 56, 41, 8, 4, 58, 81, 51, 32, 1, 17, 18, 25, 28, 37, 5, 46, 45, 21, 36, 19, 69, 34, 92, 59, 100, 77, 79, 78, 68, 42, 74, 95, 60, 96, 75, 72, 11, 90, 73, 44, 54, 52, 61, 93, 38, 67, 14, 43, 62, 12, 76, 3, 57, 13, 29, 63, 87, 47, 15, 66, 55, 70, 84, 39, 85, 48, 2, 24 ];
const goodWalkMatrixData = [ 0.3369543176531483, 0.7475841645906165, 0.22148343290999106, 0.9753343279336559, 0.07171949251627063, 0.6314571742956901, 0.8597003401514846, 0.0629034883322871, 0.05602895906356853, 0.44454342270750513, 0.4184705278561023, 0.6145779386865525, 0.9755668551656638, 0.9493635274249015, 0.13300957853026052, 0.6602776306069787, 0.3131992836381994, 0.9304742495544824, 0.7536041313732724, 0.6054208181741596, 0.9883512287734862, 0.45923723786307313, 0.49024518451092647, 0.8523604383964151, 0.03494121174341802, 0.6460489972643122, 0.7294505033055466, 0.8118894000685495, 0.3841931342580417, 0.40139693178644986, 0.6348220190123802, 0.7294735091990421, 0.16118358053757686, 0.6259863451699992, 0.35517671369827164, 0.408404787066854, 0.7716057603869121, 0.7808934386362014, 0.2570749095554089, 0.516527867565138, 0.6014788355558471, 0.7791197933269675, 0.877415529911511, 0.5687084533525193, 0.6362523494315137, 0.533492944004766, 0.2899822557562578, 0.9922620938769392, 0.22703265193101685, 0.986353591320075, 0.9230195387310923, 0.5598735898812519, 0.5557787793562171, 0.06820125212862183, 0.3331005954243612, 0.8295513311472502, 0.813210928785713, 0.6798080832940311, 0.5702723428914253, 0.3826786524811153, 0.9252839819516591, 0.3336998088134061, 0.03785920896456774, 0.8065848589685845, 0.5898017431529416, 0.14765716096292725, 0.1791058942355107, 0.9582011511337313, 0.6740104441179532, 0.3129448659808334, 0.478873450953622, 0.35337879097195946, 0.42450856499053813, 0.9154926505100215, 0.4258124709947422, 0.47717785984268946, 0.09560004847962078, 0.5447580997324383, 0.30307272034335186, 0.9219955695625424, 0.38227569642461623, 0.29606372081187127, 0.8211324950805537, 0.03514764982989638, 0.7864035568633203, 0.5912839839805406, 0.8344457308228863, 0.639154180540306, 0.18071312774553416, 0.6540258249190544, 0.5732406993529225, 0.5065048468990908, 0.40370221974494214, 0.5437032181121022, 0.43694153878583464, 0.8363592625013838, 0.6121438266231511, 0.7779107840897593, 0.0723578970716997, 0.6737672430790856 ];