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


function ContinuationInsertionSort(data, budget) {

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

    let partialSort = ContinuationInsertionSort(data, 0);

    speedSlider.addCallback(value => {
        sortingSpeed = Math.floor(value * maxSpeed);
    })

    const drawFrame = time => {
        ctx.clearRect(80, 390, 400, 50);
        ui.draw(ctx);
        drawData(ctx, data, gradient, drawSettings);
        partialSort = partialSort(sortingSpeed)
        if (partialSort === true) {
            l('Finished')
            drawData(ctx, data, gradient, drawSettings);
        } else {
            requestAnimationFrame(drawFrame);
        }
    }
    requestAnimationFrame(drawFrame);

    // TODO: This does not work since the sorting will freeze everything until it is finished, meaning an animation frame won't come. 
    // TODO: Instead we should do something like run a partial sort some steps and then draw. So something like
    // TODO: (1) Measure the time to do some comparisons and swaps (2) Measure frame time (3) calculate the number of steps doable in one frame (4) for every frame, draw the current data and perform the number of allowed steps


    // What do I want to finish today? I want to do a partial sorting, i.e. do x steps of the sorting and return a continuation or similar 

    // const startSort = e => {
    //     insertionSort(data, (i, j) => {
    //         comparisons += 1;
    //         return data[i] < data[j]
    //     }, (i, j) => {
    //         swaps += 1
    //         const tmp = data[i];
    //         data[i] = data[j];
    //         data[j] = tmp;
    //     })

    //     canvas.removeEventListener('mousedown', startSort);
    // }
    // canvas.addEventListener('mousedown', startSort)
}