'use strict';

function randomArray(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(i);
    }
    shuffle(result);
    return result;
}

function createGradient() {
    return v => {
        if (v < 0.5) {
            return 'rgba(187, 14, 30, 1)';
        } 
        else {
            return 'rgba(18, 143, 230, 1)';
        }
    }
}

function insertionSort(data, less, swap) {
    for (let i = 1; i < data.length; i++) {
        for (let j = i-1; j >= 0; j--) {
            if (!less(j, j+1)) swap(j, j+1);
        }
    }
}

function drawData(ctx, data, gradient, {leftX, topY, width, height, minBarHeight, maxBarHeight}) {
    ctx.strokeRect(leftX, topY, width, height);

    const barWidth = width / data.length;
    const maxValue = Math.max(...data);
    const barHeightDiff = maxBarHeight - minBarHeight;
    
    for (let i = 0; i < data.length; i++) {
        const v = data[i];
        const fraction = v / maxValue;
        const barHeight = minBarHeight + fraction * barHeightDiff;
        ctx.fillStyle = gradient(fraction);
        ctx.fillRect(leftX + i * barWidth, topY + height - barHeight, barWidth, barHeight);
    }
}

function onBodyLoad() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');


    const drawSettings = {
        leftX: 100,
        topY: 60,
        width: 400,
        height: 300,
        minBarHeight: 20,
        maxBarHeight: 280
    };

    const n = 2000;
    l(n)
    const data = randomArray(n);
    const gradient = createGradient();

    drawData(ctx, data, gradient, drawSettings);


    insertionSort(data, (i, j) => data[i] < data[j], (i, j) => {
        const tmp = data[i];
        data[i] = data[j];
        data[j] = tmp;
    })

    drawData(ctx, data, gradient, {
        ...drawSettings,
        leftX: 600
    });
    l(data)
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

}