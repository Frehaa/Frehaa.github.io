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
        const value = matrix.data[i];
        if (value > threshold) {
            ctx.fillStyle = 'red';
        } else if (value < threshold) {
            ctx.fillStyle = 'green'
        } else {
            ctx.fillStyle = 'yellow'
        }

        drawValue(ctx, x, y, matrix, drawSettings);
    }
}   

function makePositionStrictSaddlepoint(matrix, x, y) {
    const value = matrix.getValue(x, y);
    console.log(value);

    for (let i = 0; i < matrix.columns; ++i) {
        if (i == x) continue;
        const val = matrix.getValue(i, y);
        if (val > value) {
            matrix.data[i + y * matrix.columns] = Math.random() * value;
        }
    }
    for (let i = 0; i < matrix.rows; ++i) {
        if (i == y) continue;
        const val = matrix.getValue(x, i);
        if (val < value) {
            matrix.data[x + i * matrix.columns] = Math.random() * (1 - value) + value;
        }
    }
}

function drawValue(ctx, x, y, matrix, drawSettings) {
    const {leftX, topY, cellWidth, valueWidthRatio} = drawSettings;
    const centerX = leftX + cellWidth / 2 + x * cellWidth;
    const centerY = topY + cellWidth / 2 + y * cellWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellWidth * valueWidthRatio/2 , 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.font = "20px sans-serif";
    let value = matrix.getValue(x, y);
    value = value.toString().slice(0, 6)
    //ctx.fillText(value, centerX - cellWidth * valueWidthRatio/2, centerY);    
}

function drawThresholdPicker(ctx, state) {
    // TODO: Threshold slider (Scuffed solution could be just to pick thresholds based on slide. E.g. 0.25, 0.5, 0.75, etc.)
    // The slider can go from 0 to 1 with random values, or we can go in increments of values in the matrix with 1 to n^2
    // In either case we would have to create the slider functionality
    // Maybe even simpler would be to be able to click on a value and use that as the new threshold
    const threshold = state.threshold;
    ctx.font = "32px sans-serif";
    ctx.fillText(threshold, 100, 1000)
}

function matrixIndicesToCanvasCoords(x, y, matrixDrawSettings) {
    const {leftX, topY, cellWidth, valueWidthRatio} = matrixDrawSettings;
    const centerX = leftX + cellWidth / 2 + x * cellWidth;
    const centerY = topY + cellWidth / 2 + y * cellWidth;
    return [centerX, centerY];
}

function createWalkSlides(matrix, threshold, matrixDrawSettings) {
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
            drawMatrix(ctx, matrix, threshold, matrixDrawSettings);
            ctx.fillStyle = 'black';
            
            let [centerX, centerY] = matrixIndicesToCanvasCoords(0, 0, matrixDrawSettings);
            ctx.beginPath();
            ctx.arc(centerX, centerY, cellWidth * valueWidthRatio/5, 0, 2 * Math.PI);
            ctx.fill();

            
            for (let j = 1; j <= i; ++j) {
                const x = path[j][0];
                const y = path[j][1];
                const previousX = path[j-1][0];
                const previousY = path[j-1][1];
                if (x != previousX) {
                    let [centerX, centerY] = matrixIndicesToCanvasCoords(previousX, previousY, matrixDrawSettings);
                    drawHorizontalArrow(centerX, centerY, cellWidth *0.8, 10, 10, ctx);
                } else {
                    let [centerX, centerY] = matrixIndicesToCanvasCoords(previousX, previousY, matrixDrawSettings);
                    drawVerticalArrow(centerX, centerY, cellWidth *0.8, 10, 10, ctx);
                }
                if (j == path.length-1) continue;
                let [centerX, centerY] = matrixIndicesToCanvasCoords(x, y, matrixDrawSettings);
                ctx.beginPath();
                ctx.arc(centerX, centerY, cellWidth * valueWidthRatio/5, 0, 2 * Math.PI);
                ctx.fill();
            }
        }));
    }

    return result;
}

function canvasCoordsToMatrixIndices(x, y, matrixDrawSettings) {
    const {leftX, topY, cellWidth, valueWidthRatio} = matrixDrawSettings;

    let matrixX = Math.floor((x - leftX) / cellWidth);
    let matrixY = Math.floor((y - topY) / cellWidth);
    return [matrixX, matrixY];
}

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
        }
    };
    const matrixDrawSettings = {
        leftX: 10,
        topY: 10,
        cellWidth: 75,
        valueWidthRatio: 0.8
    };
    const thresholdX = 7;
    const thresholdY = 4
    matrix.data = randomList(matrix.rows * matrix.columns); 
    makePositionStrictSaddlepoint(matrix, thresholdX, thresholdY); // Assumes random entries between 0 and 1
    console.log(matrix.data)

    //matrix.data = numberList(matrix.rows * matrix.columns); 
    //shuffle(matrix.data);
    // let threshold = matrix.getValue(thresholdX, thresholdY) + (Math.random() > 0.5? 0.000000001 : -0.000000001);
    let threshold = matrix.getValue(thresholdX, thresholdY) + (Math.random() > 0.5? 0.1 : -0.1);
    const thresholdState = {
        threshold: threshold
    }
    state.slides.push(createDrawSlide(ctx => {
        drawMatrix(ctx, matrix, thresholdState.threshold, matrixDrawSettings);
        drawThresholdPicker(ctx, thresholdState);
    }));
    console.log(state.slides[0])
    state.slides[0].isInteractable = true
    state.slides[0].mouseDown = function() {
        const [matrixX, matrixY] = canvasCoordsToMatrixIndices(state.mousePosition.x, state.mousePosition.y, matrixDrawSettings);
        if (matrixX < 0 || matrixX >= matrix.columns) return;
        if (matrixY < 0 || matrixY >= matrix.rows) return;
        
        thresholdState.threshold = matrix.getValue(matrixX, matrixY);
        console.log(matrixX, matrixY, thresholdState.threshold);
    }

    
    state.slides.push(...createWalkSlides(matrix, thresholdState.threshold, matrixDrawSettings));

    state.startSlideShow(ctx);

    // TODO: Draw matrix
    // Draw values into matrix
    // Color depending on threshold
    // Change threshold and update colors
    // 

}


const goodMatrixData1 = [
    0.5783696505963202,
    0.985697926979153,
    0.11626742806173151,
    0.6054379500095455,
    0.8610416832259858,
    0.8246996867991002,
    0.12343647097115118,
    0.493444273857037,
    0.1696316042168322,
    0.2059781768503124,
    0.06041321176553438,
    0.801056369879798,
    0.5001468875418165,
    0.817171534525559,
    0.5159278470105586,
    0.0040295268759615865,
    0.020549473787932593,
    0.8870504912164895,
    0.15832104092880073,
    0.12608538629143706,
    0.06199100353649556,
    0.0672143456988098,
    0.7737829629879243,
    0.8521723555934376,
    0.14901526731786763,
    0.6421086395336717,
    0.7836551582807221,
    0.969745730911979,
    0.1451064443897101,
    0.0991465036063579,
    0.1930880691579483,
    0.20595271025039696,
    0.13471022545140965,
    0.6339933659153378,
    0.7202210960110605,
    0.7663720285374862,
    0.5063749436094988,
    0.9337468761237933,
    0.5585943919014148,
    0.5014123084609514,
    0.23466004347187605,
    0.37534576089651506,
    0.09087395322680106,
    0.1628580861295604,
    0.1776609623263944,
    0.3801750931920415,
    0.4153082408380675,
    0.459633654394096,
    0.14265285158169613,
    0.3017770754585809,
    0.511238700525012,
    0.644864028347516,
    0.07857650385838089,
    0.9752134598107661,
    0.40034749247239176,
    0.8899578842782456,
    0.2788899379959414,
    0.9943132614360279,
    0.35672091672944073,
    0.1467898154360303,
    0.7276785335149746,
    0.8646491757722975,
    0.16951786771957222,
    0.30695564421273813,
    0.3381847273607629,
    0.6031178496969438,
    0.15940889706487504,
    0.9083841335166264,
    0.0018519961459101397,
    0.6686142517510997,
    0.0852225189689606,
    0.3069749231700939,
    0.2798874496822523,
    0.11597745552565464,
    0.992346217592813,
    0.4641361268823011,
    0.14218262031956153,
    0.6347341672018512,
    0.7180414018962394,
    0.9766117472703761,
    0.3600684702417658,
    0.5057709730236956,
    0.8988753001764275,
    0.8143916929815103,
    0.37936419659876763,
    0.87405793522659,
    0.7152260824985552,
    0.7038698231085518,
    0.731862620338478,
    0.0426517801443711,
    0.4310019738764421,
    0.19821944369224387,
    0.6250585170369808,
    0.9752549659825793,
    0.47363728271802275,
    0.8288517550463775,
    0.8542235863764309,
    0.554183108431055,
    0.7646462956166976,
    0.31535100966164464
  ]