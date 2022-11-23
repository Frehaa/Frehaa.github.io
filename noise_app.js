"use strict";

const DEFAULT_SAMPLE_COUNT = 100;

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

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
        // Replace with consistent rng generator
        let r = width * height * Math.random();
        let x = r % width; 
        let y = r / width;
        drawDot(ctx, x, y);
    }
}

function blueNoiseUpdate(count, seed) {
    let canvas = document.getElementById('blue-noise-canvas');
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
        // Replace with consistent rng generator
        let r = width * height * Math.random();
        // Insert logic for blue noise
        let x = r % width;
        let y = r / width;
        drawDot(ctx, x, y);
    }
}

function initialize() {
   initializeCanvas('white-noise', whiteNoiseUpdate);
   initializeCanvas('blue-noise', blueNoiseUpdate);
}
