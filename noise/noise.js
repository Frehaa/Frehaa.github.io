"use strict";

const DEFAULT_SAMPLE_COUNT = 100;
function hash(str) {
    const [a, b, c] = [1048573, 2097143, 134217689];
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

const blueNoiseState = {
    points: [],
    previousSeed: 0,
}

function blueNoiseUpdate(count, seed, forceUpdate = false) {
    console.log('blue noise update')
    let canvas = document.getElementById('blue-noise-canvas');
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext('2d');
    seed = hash(seed);
    
    if (seed !== blueNoiseState.previousSeed) {
        blueNoiseState.points = [];
        blueNoiseState.previousSeed = seed;
    }

    const points = blueNoiseState.points;
    if (count > blueNoiseState.points.length) { // 
        console.log('regenerate', blueNoiseState, count)
        let minimumDistanceSquared = 625;
        const decayRate = 1/8;
        const repeatCountBeforeDecay = 25;
        
        let repeats = 0;
        for (let rand of document.random(seed)) {
            if (points.length >= count) break
            let pos = width * height * rand;
            let x = pos % width; 
            let y = pos / width;
            let newPointFound = true;
            for (const [Px, Py] of points) {
                const dx = Px - x;
                const dy = Py - y;
                if (dx*dx + dy*dy <= minimumDistanceSquared) {
                    newPointFound = false;
                    break;
                }
            }
            if (newPointFound) {
                points.push([x, y]);
                repeats = 0;
            } else if (repeats > repeatCountBeforeDecay) {
                minimumDistanceSquared = minimumDistanceSquared - minimumDistanceSquared * decayRate;
                // console.log('Too many repeats', minimumDistanceSquared);
                repeats = 0;
            }else {
                repeats++;
            }
        }
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
        const [x,y] = points[i];
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
