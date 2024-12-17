'use strict';

function randomArray(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(i);
    }
    shuffle(result);
    return result;
}


// TODO: Why does the gradient have weird color when 
function createGradient(colorA, colorB) {
    return v => {
        assert(0 <= v & v <= 1, 'v is between 0 and 1 inclusive');
        const dr = colorB.r - colorA.r;
        const r = Math.floor(colorA.r + dr * v);

        const dg = colorB.g - colorA.g;
        const g = Math.floor(colorA.g + dg * v);

        const db = colorB.b - colorA.b;
        const b = Math.floor(colorA.b + db * v);

        return `rgba(${r}, ${g}, ${b}, 1)`;
    }
}

function swap(data, i, j) {
    const tmp = data[i];
    data[i] = data[j];
    data[j] = tmp;
}

// TODO: Since we are essentially doing dealing with state here, would it not be better to do the sorting in a class? 

function continuationSelectionSort(data, budget) {
    function continuedSort(iCont, jCont, tCont, budget) { 
        if (budget === 0) return budget => continuedSort(iCont, jCont, tCont, budget);
        assert(jCont >= iCont, "j should always be larger than i");

        let steps = 0;
        let t = tCont
        for (let j = jCont; j < data.length; j++) {
            if (data[j] < data[t]) t = j;    
            steps += 1;
            if (steps === budget) return budget => continuedSort(iCont, j + 1, t, budget);
        }
        swap(data, iCont, t);

        for (let i = iCont + 1; i < data.length; i++) {
            let t = i;
            for (let j = i+1; j < data.length; j++) {
                if (data[j] < data[t]) t = j;    
                steps += 1;
                if (steps === budget) return budget => continuedSort(i, j + 1, t, budget);
            }
            swap(data, i, t);
        }
        return true;
    }
    return continuedSort(0, 0, 0, budget);
}

function continuationInsertionSort(data, budget) {

    function continuedSort(iCont, jCont, budget) { // TODO: Make it such that we can restart from an arbitrary j value too
        if (budget === 0) return budget => continuedSort(iCont, jCont, budget);
        assert(jCont <= iCont, "j should always be smaller than i");

        let steps = 0;
        for (let j = jCont; j > 0; j--) {
            steps += 1
            if (data[j-1] <= data[j]) {
                if (steps === budget) return budget => continuedSort(iCont, 0, budget);
                else break;
            }

            swap(data, j-1, j);
            if (steps === budget) return budget => continuedSort(iCont, j-1, budget);
        }


        for (let i = iCont+1; i < data.length; i++) {
            for (let j = i; j > 0; j--) {
                steps += 1
                if (data[j-1] <= data[j]) {
                    if (steps === budget) return budget => continuedSort(i, 0, budget);
                    else break;
                }
                
                swap(data, j-1, j);
                if (steps === budget) return budget => continuedSort(i, j-1, budget);
            }

        }
        return true;
    }
    return continuedSort(0, 0, budget);
}

function insertionSort(data, less, swap) {
    for (let i = 1; i < data.length; i++) {
        for (let j = i-1; j >= 0; j--) {
            if (!less(j, j+1)) swap(j, j+1);
        }
    }
}




function drawData(ctx, data, gradient, {leftX, topY, width, height, minBarHeight, maxBarHeight}) {
    ctx.clearRect(leftX, topY, width, height);

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
    ctx.strokeRect(leftX, topY, width, height);
}

function onBodyLoad() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // TODO: Trace of Algorithms

    const drawSettings = {
        leftX: 100,
        topY: 60,
        width: 400,
        height: 300,
        minBarHeight: 30,
        maxBarHeight: 270
    };

    const n = 100;
    l(n)
    const data = randomArray(n);
    const gradient = createGradient({r: 67, g: 83, b: 150}, {r:183, g: 90, b: 43}, );

    const maxSpeed = 10;
    let sortingSpeed = 1;

    let ui = new UI();
    const speedSlider = new HorizontalSlider({
        position: {x: 100, y: 400}, size: {width: 300, height: 30}, lineWidth: 3, initialSliderMarkerRatio: sortingSpeed / maxSpeed, 
    });
    ui.add(speedSlider);

    canvas.addEventListener('mousedown', e => ui.mouseDown(e));
    canvas.addEventListener('mouseup', e => ui.mouseUp(e));
    canvas.addEventListener('mousemove', e => ui.mouseMove(e));

    // let partialSort = ContinuationInsertionSort(data, 0);
    let partialSort = continuationSelectionSort(data, 0);

    speedSlider.addCallback(value => {
        sortingSpeed = Math.floor(value * maxSpeed);
    })

    const drawFrame = time => {

        // TODO: Sorting speed with fractional value which takes multiple frames to do a step (e.g. 0.5 takes 2 frame to do 1 step)

        ctx.clearRect(80, 390, 400, 50);
        ui.draw(ctx);
        drawData(ctx, data, gradient, drawSettings);
        partialSort = partialSort(sortingSpeed)
        if (partialSort === true) {
            drawData(ctx, data, gradient, drawSettings);
        } else {
            requestAnimationFrame(drawFrame);
        }
    }
    requestAnimationFrame(drawFrame);
}