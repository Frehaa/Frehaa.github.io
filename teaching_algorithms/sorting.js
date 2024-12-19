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
        this.aux = data.map(v => v); // Copy
        // This class only manages the aux array. Sub-classes have to manage the variables it uses to replicate the order things are merged
        // this.lo is the start index of the left sub-array
        // this.hi is the end index of the right sub-array, after the last index of the sub-array (i.e. it is not an index to an element of the sub-array)
        // this.mid is the end index of the left sub-array, and the start index of the right sub-array
        // this.i is for traversing elements in the left sub-array
        // this.j is for traversing elements in the right sub-array
        // this.l is for copying elements from aux to data in the merge 
    }
    mergeStep() {
        if (this.i < this.mid && this.j < this.hi) {
            if (this.aux[this.i] < this.aux[this.j]) {
                this.data[this.l++] = this.aux[this.i++];
            } else {
                this.data[this.l++] = this.aux[this.j++];
            }
        } else if (this.i < this.mid) {
            this.data[this.l++] = this.aux[this.i++];
        } else if (this.j < this.hi) {
            this.data[this.l++] = this.aux[this.j++];
        } else { // Finished
            l('Finished merge step', this.lo, this.mid, this.hi);
            for (let copyIdx = this.lo; copyIdx < this.hi; copyIdx++) { // Copy back
                this.aux[copyIdx] = this.data[copyIdx];
            }
            return true; // Returns true when done with merging the current values
        }
        return false; // Returns false when the merge is still not finished
    }
    step() { assert(false, 'Use either TopDownMergeSort or BottomUpMergeSort' )}
}

class TopDownMergeSortStepper extends MergeSortStepper { // This should track the recursive stuff
    constructor(data) {
        super(data);
        // TODO: figure out the values that lo, hi, mid go through in the different recursions
    }
    step() {
        if (this.isDone()) { return; }
        if (!this.mergeStep()) { return; } // Only do the merge step if we didn't finish merging

        // TODO: Update internal variables to handle next merge step 
    }

    
}

class BottomUpMergeSortStepper extends MergeSortStepper {
    constructor(data) {
        super(data);
        this.k = 1;
        this.lo = 0;
        this.mid = 1;
        this.hi = 2;

        this.i = 0;
        this.l = 1;
        this.j = 0;
    }
    step() {
        if (this.isDone()) { return; }
        if (!this.mergeStep()) { return; } // Only do the merge step if we didn't finish merging

        this.lo = this.lo + 2 * this.k;
        if (this.lo >= this.data.length) {
            this.k = this.k * 2;
            this.progress = Math.min(1, this.k / this.data.length); // TODO: Find a better measure of progress
            if (this.isDone()) { return; }

            this.lo = 0;
        }

        this.hi = Math.min(this.lo + 2 * this.k, this.data.length);
        this.mid = this.lo + this.k;

        this.i = this.lo;
        this.l = this.lo;
        this.j = this.mid;

        // If there are not enough for two sub-arrays to be merged, skipping seems to work
        if (this.mid > this.hi) { 
            this.i = this.mid; 
            this.j = this.hi;
        }
    }
}

function topDownMergeSort(data) { // TODO: Fix
    const aux = Array(data.length);
    function merge(lo, mid, hi) {
        let i = lo;
        let j = mid;
        let l = lo;
        
        while (i < mid && j < hi) {
            if (data[i] < data[j]) {  // We need to read from the merged lists. This is 
                aux[l++] = data[i++];
            } else {
                aux[l++] = data[j++];
            }
        }
        while (i < mid) {
            aux[l++] = data[i++];
        }
        while (j < hi) {
            aux[l++] = data[j++];
        }
        // Copy back
        for (let l = lo; l < hi; l++) {
            data[l] = aux[l];
        }
    }

    function sort(lo, hi) {
        if ((hi - lo) === 1) { return [lo, hi]; } 

        const mid = lo + Math.floor((hi - lo) / 2);
        sort(lo, mid);
        sort(mid, hi);
        return merge(lo, mid, hi);
    }
    sort(0, data.length);
    return data
}

function bottomUpMergeSort(data) { // TODO: Implement
    const aux = Array(data.length); 

    function merge(lo, mid, hi) {
        let i = lo;
        let j = mid;
        let l = lo;
        
        while (i < mid && j < hi) {
            if (data[i] < data[j]) {  // We need to read from the merged lists. This is 
                aux[l++] = data[i++];
            } else {
                aux[l++] = data[j++];
            }
        }
        while (i < mid) {
            aux[l++] = data[i++];
        }
        while (j < hi) {
            aux[l++] = data[j++];
        }
        // Copy back
        for (let l = lo; l < hi; l++) {
            data[l] = aux[l];
        }
    }

    for (let k = 1; k < data.length; k *= 2) {
        for (let i = 0; i < data.length; i += 2 * k) {
            merge(i, i + k, i + 2 * k);
        }
        
    }
    
    return data;
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

    const n = 300
    const data = randomArray(n);
    // const data = [5, 4, 7, 2, 0, 1, 6, 3];
    const gradient = createGradient({r: 67, g: 83, b: 150}, {r:183, g: 90, b: 43}, );

    const maxSpeed = (n * n) / 100;
    let stepsPerFrame = 1//maxSpeed / 100;

    let ui = new UI();
    const speedSlider = new HorizontalSlider({
        position: {x: 100, y: 400}, size: {width: 300, height: 30}, lineWidth: 3, initialSliderMarkerRatio: stepsPerFrame / maxSpeed, 
    });
    ui.add(speedSlider);

    canvas.addEventListener('mousedown', e => ui.mouseDown(e));
    canvas.addEventListener('mouseup', e => ui.mouseUp(e));
    canvas.addEventListener('mousemove', e => ui.mouseMove(e));

    let sortStepper = new BottomUpMergeSortStepper(data);

    speedSlider.addCallback(value => {
        stepsPerFrame = value * maxSpeed;
    });

    let totalSteps = 0;

    // let mergeSorted = topDownMergeSort(data)
    // l(data, mergeSorted)
    // return drawData(ctx, mergeSorted, gradient, drawSettings);

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

        if (sortStepper.aux) { // If the sorting algorithm has an auxiliary array, draw it too
            drawData(ctx, sortStepper.aux, gradient, {
                ...drawSettings,
                leftX: 600
            });
        }
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