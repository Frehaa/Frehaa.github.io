"use strict";

const DEFAULT_SAMPLE_COUNT = 100;
function hash(str) {
    let [a, b, c] = [1048573, 2097143, 134217689];
    let result = a;
    for (let i = 0; i < str.length; i++) {
        result = (result + b * str.charCodeAt(i)) % c;
    }
    return result;
}

function initializeCanvas(name, update) {
    let sampleRange = document.getElementById(`${name}-count-range`);
    let rangeText = document.getElementById(`${name}-count-range-text`);
    let seedInput = document.getElementById(`${name}-rng-seed`);

    sampleRange.value = DEFAULT_SAMPLE_COUNT;
    rangeText.value = sampleRange.value;
    seedInput.value = Date.now();

    sampleRange.addEventListener('input', (e) => {
        let value = e.target.value;
        rangeText.value = value;
        update(value, seedInput.value);
    });

    rangeText.addEventListener('input', (e) => {
        let value = Number(e.target.value);
        if (!value) {
            e.target.classList.add('wrong');
        } else {
            e.target.classList.remove('wrong');
            sampleRange.value = value;
            update(value, seedInput.value);
        }
    });

    seedInput.addEventListener('input', (e) => {
        update(sampleRange.value, e.target.value);
    });
}

function drawCanvas(name, update) {
    let sampleRange = document.getElementById(`${name}-count-range`);
    let seedInput = document.getElementById(`${name}-rng-seed`);
    update(sampleRange.value, seedInput.value);
}

function drawDot(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
}

function whiteNoiseUpdate(count, seed) {
    let canvas = document.getElementById('white-noise-canvas');
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext('2d');
    seed = hash(seed);

    let i = 0
    ctx.clearRect(0, 0, width, height);
    for (let rand of document.random(seed)) {
        if (++i > count) break
        let pos = width * height * rand;
        let x = pos % width; 
        let y = pos / width;
        drawDot(ctx, x, y);
    }
}

function blueNoiseUpdate(count, seed) {
    let canvas = document.getElementById('blue-noise-canvas');
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext('2d');
    seed = hash(seed);
    
    ctx.font = "bold 32px serif"
    ctx.fillText("TODO: Implement blue noise", 50, 100);


    return;

    let i = 0
    ctx.clearRect(0, 0, width, height);
    for (let rand of document.random(seed)) {
        if (++i > count) break
        let pos = width * height * rand;
        let x = pos % width; 
        let y = pos / width;
        drawDot(ctx, x, y);
    }
}

function* defaultRandom(seed) {
    // Linear congruential generator (https://en.wikipedia.org/wiki/Linear_congruential_generator)
    let state = seed;
    let a = 1664525;
    let c = 1013904223;
    let m = 2**32;
    while (true) {
        state = (a * state + c) % m
        yield state / m;
    }
}

const GeneratorFunction = function*(){}.constructor;
function parseRandomGeneratorCode() {
    let codeTextArea = document.getElementById('random-generator-code');
    let code = codeTextArea.value;
    try {
        document.random = new GeneratorFunction('seed', code);
    } catch(e) {
        console.log('Failed to parse code', e);
        return false;
    }
    return true;
}


function initialize() {
    initializeCanvas('white-noise', whiteNoiseUpdate)
    initializeCanvas('blue-noise', blueNoiseUpdate);
    parseRandomGeneratorCode();
    
    document.getElementById('random-generator-code').addEventListener('input', (e) => {
        let result = parseRandomGeneratorCode();
        if (result) {
            drawCanvas('white-noise', whiteNoiseUpdate);
            drawCanvas('blue-noise', blueNoiseUpdate);
        } else {
            // Couldn't parse
        }
    });

    drawCanvas('white-noise', whiteNoiseUpdate);
    drawCanvas('blue-noise', blueNoiseUpdate);
}
