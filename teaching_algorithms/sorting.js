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

// TODO: Since we are essentially doing dealing with state here, would it not be better to do the sorting in a class? 
class SortStepper {
    constructor(data) {
        this.data = data;
        this.progress = 0;
    }
    isDone() { return this.progress >= 1}
    _swap(i, j) {
        let tmp = this.data[i];
        this.data[i] = this.data[j];
        this.data[j] = tmp;
    }
}

class SelectionSortStepper extends SortStepper{
    constructor(data) {
        super(data);
        this.i = 0;
        this.j = 1;
        this.t = 0;
    }
    // TODO?: Implement as state automata?
    step() {
        if (this.isDone()) return;
        if (this.j < this.data.length) {
            if (this.data[this.j] < this.data[this.t]) this.t = this.j;
            this.j += 1
        }
        else {
            this._swap(this.t, this.i);
            this.i += 1;
            this.progress = this.i / this.data.length; // TODO: Calculate better notion of progress since selection sort always does the same amount of work
            this.j = this.i + 1;
            this.t = this.i;
        }
    }
}

class InsertionSortStepper extends SortStepper {
    constructor(data) {
        super(data);
        this.i = 0;
        this.j = 0;
    }
    step() {
        if (this.isDone()) return;
        if (this.j > 0) {
            if (this.data[this.j] < this.data[this.j - 1]) {
                this._swap(this.j, this.j - 1);
                this.j -= 1;
            } else {
                this.i += 1
                this.j = this.i;
                this.progress = this.i / this.data.length;

            }
        } else {
                this.i += 1
                this.j = this.i;
                this.progress = this.i / this.data.length;
        }

    }
}

class MergeSortStepper extends SortStepper {
    constructor(data) {
        super(data);
    }
    step() {

    }
}

function topDownMergeSort(data) { // TODO: Fix
    const result = Array(data.length);
    function merge(a, b) {
        l('Merge', a[0],a[1], b[0], b[1])
        const [lo1, hi1] = a;
        const [lo2, hi2] = b;
        let lo = lo1; 
        const hi = hi2;

        let i = lo1;
        let j = lo2;
        // while (lo < hi) {
        //     if (data[i] < data[j]) {
        //         result[lo] = data[i]; 
        //         lo += 1
        //         i += 1
        //         if (i == hi1) {// If list a is done, merge remainig 
        //             for (;j < hi2; j++, lo++) {
        //                 result[lo] = data[j]; 
        //             }
        //             break;
        //         }
        //     } else {
        //         result[lo] = data[j];
        //         lo += 1
        //         j += 1
        //         if (j == hi2) { // If list b is done, merge remainig 
        //             for (;i < hi1; i++, lo++) {
        //                 result[lo] = data[i];
        //             }
        //             break;
        //         }
        //     }
        // }
        return [lo1, hi2];
    }
    function sort(lo, hi) {
        if ((hi - lo) === 1) { return [lo, hi]; } 

        const mid = lo + Math.floor((hi - lo) / 2);
        const a = sort(lo, mid);
        const b = sort(mid, hi);
        return merge(a, b);
    }
    sort(0, data.length);
    return result;
}

function bottomUpMergeSort(data) { // TODO: Implement
    const result = Array(data.length);

    function merge(lo, mid, hi) {
        l(lo, mid, hi);
        let i = lo;
        let j = mid;
        
        while (i < mid && j < hi) {
            if (data[i] < data[j]) {
                result[lo++] = data[i++];
            } else {
                result[lo++] = data[j++];
            }
        }
        while (i < mid) {
            result[lo++] = data[i++];
        }
        while (j < hi) {
            result[lo++] = data[j++];
        }
    }

    for (let k = 1; k < data.length; k *= 2) {
        for (let i = 0; i < data.length; i += 2 * k) {
            merge(i, i + k, i + 2 * k);
        }
        
    }
    
    return result;
}


function drawData(ctx, data, gradient, {leftX, topY, width, height, minBarHeight, maxBarHeight}) {
    // ctx.clearRect(leftX, topY, width, height);

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

    // TODO: Maybe use state machine to get a trace of the algorithm with the code of the algorithm next to the data
    // TODO: Select data size
    // TODO: Select data type, e.g. sorted, reverse sorted, random, etc.
    // TODO: Make a progress bar and let the algorithm go back to previous progress points of the algorithm using snapshots etc. 

    const drawSettings = {
        leftX: 100,
        topY: 60,
        width: 400,
        height: 300,
        minBarHeight: 30,
        maxBarHeight: 270
    };

    const n = 8
    // const data = randomArray(n);
    const data = [5, 4, 7, 2, 0, 1, 6, 3];
    const gradient = createGradient({r: 67, g: 83, b: 150}, {r:183, g: 90, b: 43}, );

    const maxSpeed = (n * n) / 100;
    let stepsPerFrame = maxSpeed / 100;

    let ui = new UI();
    const speedSlider = new HorizontalSlider({
        position: {x: 100, y: 400}, size: {width: 300, height: 30}, lineWidth: 3, initialSliderMarkerRatio: stepsPerFrame / maxSpeed, 
    });
    ui.add(speedSlider);

    canvas.addEventListener('mousedown', e => ui.mouseDown(e));
    canvas.addEventListener('mouseup', e => ui.mouseUp(e));
    canvas.addEventListener('mousemove', e => ui.mouseMove(e));

    let sortStepper = new InsertionSortStepper(data);

    speedSlider.addCallback(value => {
        stepsPerFrame = value * maxSpeed;
    });

    let totalSteps = 0;

    let mergeSorted = bottomUpMergeSort(data)
    l(data, mergeSorted)

    drawData(ctx, mergeSorted, gradient, drawSettings);

    return ;

    const drawFrame = time => {
        // TODO: Sorting speed with fractional value which takes multiple frames to do a step (e.g. 0.5 takes 2 frame to do 1 step)

        // ctx.clearRect(80, 390, 700, 100);
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ui.draw(ctx);

        // Handle fractional sorting speed. We add the stepsPerFrame to the total steps and take the floor of this and the total steps. 
        // If these are integers it will simply return stepsPerFrame, if not, it may give 1 step higher in case the sum of fractions of totalSteps and StepsPerFrame add to 1 or more
        const steps = Math.floor(totalSteps + stepsPerFrame) - Math.floor(totalSteps);
        for (let i = 0; i < steps; i++) {
            sortStepper.step();
        }
        drawData(ctx, data, gradient, drawSettings);
        totalSteps += stepsPerFrame; // Add the (possibly fractional) stepsPerFrame to the total number of steps 
        // Note that the number of steps we have actually take is only the integer part of totalSteps

        ctx.fillStyle = 'black';
        ctx.font = '16px Ariel'
        if (stepsPerFrame >= 1) {
            ctx.fillText("Steps per Frame", 430, 410);
            ctx.fillText(stepsPerFrame.toFixed(2), 430, 435);
        } else {
            ctx.fillText("Frames per Step", 430, 410);
            ctx.fillText(Math.round(1/stepsPerFrame), 430, 435);
        }

        ctx.fillText((sortStepper.progress * 100).toFixed(1) + '%', 100, 450);

        requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
}