'use strict';

class SelectionSortCodeDisplay {
    constructor(drawSettings) {
        this.drawSettings = {
            textMargin: 5,
            font: '18px Consolas, Courier New, monospace',
            padding: 10,
            ...drawSettings
        }
    }
    draw(ctx) {
        ctx.font = this.drawSettings.font;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        const leftX = this.drawSettings.position.x;
        const textLeftX = leftX + this.drawSettings.padding;
        const topY = this.drawSettings.position.y;
        const textTopY = topY + this.drawSettings.padding;
        const textMeasure = ctx.measureText('()');
        const lineOffsetY = textMeasure.fontBoundingBoxDescent + this.drawSettings.textMargin;

        // TODO: Do this for different languages? 

        const backgroundColor = '#1f1f1f';
        const purple = '#C586C0';          // for / if / inner parenthesis 2
        const brightYellow = '#ffcd0e';    // curly brackets 1, square brackets 1
        const darkBlue = '#569CD6';        // let / int
        const blue = '#179fff';             // parenthesis 3
        const lightBlue = '#9CDCFE';       // variable name
        const white = '#D4D4D4';           // = / ++ / <
        const lightGreen = '#B5CEA8';      // 0 / 1
        const weakYellow = '#DCDCAA';      // swap function call
        

        // const highlightColor = '#8579a8'
        // const highlightColor = '#0078d4'
        // const highlightColor = '#add6ff26' 
        const highlightColor = '#3a3d41' 

        const longestLine = '    for( let j = i + 1; j < a.length; j++) {';
        const codeblockWidth = ctx.measureText(longestLine).width + 2 * this.drawSettings.padding;
        const textHeight = 7 * lineOffsetY + 2 * this.drawSettings.padding;
        ctx.fillStyle = backgroundColor; 
        ctx.fillRect(leftX, topY, codeblockWidth, textHeight);
        ctx.strokeRect(leftX, topY, codeblockWidth, textHeight);

        // Try some text highlighting around swap
        ctx.fillStyle = highlightColor;
        ctx.fillRect(textLeftX + ctx.measureText('    ').width, textTopY + 5 * lineOffsetY - this.drawSettings.textMargin / 2, ctx.measureText('swap(i, minIdx);').width, lineOffsetY);

        // TODO: Do automatic syntax highlighting? 
        let lineTextColor = [purple, brightYellow, darkBlue, lightBlue, white, lightGreen, white, lightBlue, white, lightBlue, white, lightBlue, white, lightBlue, white, brightYellow];
        let line = ['for ', '(', 'let ', 'i ', '= ', '0', '; ', 'i ', '< ', 'a', '.', 'length', '; ', 'i', '++', ') {'];
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY);

        lineTextColor = [darkBlue, lightBlue, white, lightBlue, white];
        line = ['    let ', 'minIdx ', '= ', 'i',';'];
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY + lineOffsetY);

        lineTextColor = [purple, darkBlue, lightBlue, white, lightBlue, white, lightGreen, white, lightBlue, white, lightBlue, white,lightBlue,white, lightBlue, white, purple];
        line = ['    for (', 'let ', 'j ', '= ', 'i ', '+ ', '1', '; ', 'j ', '< ', 'a', '.', 'length', ';', 'j', '++', ') {']
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY + 2 * lineOffsetY);

        lineTextColor = [purple, blue, lightBlue, brightYellow, lightBlue, brightYellow, white, lightBlue, brightYellow, lightBlue, brightYellow, blue, lightBlue, white, lightBlue, white];
        line = ['        if ', '(', 'a', '[', 'j', '] ', '< ', 'a', '[', 'minIdx', ']', ') ', 'minIdx ', '= ', 'j', ';' ];
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY + 3 * lineOffsetY);
        
        lineTextColor = [purple];
        line = ['    }'];
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY + 4 * lineOffsetY);

        lineTextColor = [weakYellow, purple, lightBlue, white, lightBlue, purple, white];
        line = ['    swap', '(', 'i', ', ', 'minIdx', ')', ';'];
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY + 5 * lineOffsetY);

        lineTextColor = [purple];
        line = ['}'];
        this.fillLine(ctx, line, lineTextColor, textLeftX, textTopY + 6 * lineOffsetY);
    }

    fillLine(ctx, line, lineTextColor, x, y) {
        let currentX = x;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = lineTextColor[i];
            const text = line[i];
            ctx.fillText(text, currentX, y);
            currentX += ctx.measureText(text).width;
        }
    }
}

class QubicBezierCurve {
    constructor(x0, y0, cx0, cy0, cx1, cy1, x1, y1) {
        this.x0  = x0; 
        this.y0  = y0;
        this.cx0 = cx0;
        this.cy0 = cy0;
        this.cx1 = cx1;
        this.cy1 = cy1;
        this.x1  = x1;
        this.y1  = y1;
    }

    getPoint(t) {
        const lx0 = lerp(this.x0, this.cx0, t);
        const lx1 = lerp(this.cx0, this.cx1, t);
        const lx2 = lerp(this.cx1, this.x1, t);
        const lx3 = lerp(lx0, lx1, t);
        const lx4 = lerp(lx1, lx2, t);
        const x = lerp(lx3, lx4, t);

        const ly0 = lerp(this.y0, this.cy0, t);
        const ly1 = lerp(this.cy0, this.cy1, t);
        const ly2 = lerp(this.cy1, this.y1, t);
        const ly3 = lerp(ly0, ly1, t);
        const ly4 = lerp(ly1, ly2, t);
        const y = lerp(ly3, ly4, t);

        return [x, y];
    }
}

function randomArray(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(i);
    }
    shuffle(result);
    return result;
}

function isSorted(data) {
    for (let i = 1; i < data.length; i++) {
        if (data[i-1] > data[i]) return false;
    }
    return true;
}

// TODO: Why does the gradient have weird color for data with many values. I expect it is because the same pixels (or sub-pixels, since a column may only be 0.01 pixels wide) are being painted multiple times, but why does it result does it result in the weird colors.
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

// SELECTION SORT
//  for (let i = 0; i < data.length; i++) {
//      let m = i;
//      for (let j = i + 1; j < data.length; j++) {
//          if (data[j] < data[m]) {
//              m = j;
//          }
//      }
//      swap(i, m);
//  }

// TODO?: Write values to the right? 
class SelectionSortStateStepper extends SortStepper {
    static STATES = {
        LOOP_INITIALIZE_I: 0,
        LOOP_COMPARE_I: 1,
        LOOP_INCREMENT_I: 2,
        INITIALIZE_M: 3,
        LOOP_INITIALIZE_J: 4,
        LOOP_COMPARE_J: 5,
        LOOP_INCREMENT_J: 6,
        COMPARE_J_M: 7,
        UPDATE_M: 8,
        SWAP: 9,
        COMPLETE: 10
    }
    constructor(data) {
        super(data);
        this.state = SelectionSortStateStepper.STATES.LOOP_INITIALIZE_I;
        this.i = undefined;
        this.j = undefined;
        this.m = undefined;
    }

    step() {
        switch (this.state) {
            case SelectionSortStateStepper.STATES.LOOP_INITIALIZE_I: {
                this.state = SelectionSortStateStepper.STATES.LOOP_COMPARE_I;
                this.i = 0;
            } break;
            case SelectionSortStateStepper.STATES.LOOP_COMPARE_I: {
                if (this.i < this.data.length) {
                    this.state = SelectionSortStateStepper.STATES.INITIALIZE_M;
                } else {
                    this.state = SelectionSortStateStepper.STATES.COMPLETE;
                    this.progress = 1;
                }
            } break;
            case SelectionSortStateStepper.STATES.LOOP_INCREMENT_I: {
                this.state = SelectionSortStateStepper.STATES.LOOP_COMPARE_I;
                this.i++;
            } break;
            case SelectionSortStateStepper.STATES.INITIALIZE_M: {
                this.state = SelectionSortStateStepper.STATES.LOOP_INITIALIZE_J;
                this.m = this.i;
            } break;
            case SelectionSortStateStepper.STATES.LOOP_INITIALIZE_J: {
                this.state = SelectionSortStateStepper.STATES.LOOP_COMPARE_J;
                this.j = this.i + 1;
            } break;
            case SelectionSortStateStepper.STATES.LOOP_COMPARE_J: {
                if (this.j < this.data.length) {
                    this.state = SelectionSortStateStepper.STATES.COMPARE_J_M;
                } else {
                    this.state = SelectionSortStateStepper.STATES.SWAP;
                    this.j = undefined; // Exit loop
                }
            } break;
            case SelectionSortStateStepper.STATES.LOOP_INCREMENT_J: {
                this.state = SelectionSortStateStepper.STATES.LOOP_COMPARE_J;
                this.j++;
            } break;
            case SelectionSortStateStepper.STATES.COMPARE_J_M: {
                if (this.data[this.j] < this.data[this.m]) {
                    this.state = SelectionSortStateStepper.STATES.UPDATE_M;
                } else {
                    this.state = SelectionSortStateStepper.STATES.LOOP_INCREMENT_J;
                }
            } break;
            case SelectionSortStateStepper.STATES.UPDATE_M: {
                this.state = SelectionSortStateStepper.STATES.LOOP_INCREMENT_J;
                this.m = this.j;
            } break;
            case SelectionSortStateStepper.STATES.SWAP: {
                this.state = SelectionSortStateStepper.STATES.LOOP_INCREMENT_I;
                this._swap(this.i, this.m);
                this.m = undefined;
            } break;
            case SelectionSortStateStepper.STATES.COMPLETE: {
                return true; // Return true when complete
            }
        }
        return false;
    }

}

class SelectionSortStepper extends SortStepper{
    constructor(data) {
        super(data);
        this.i = 0;
        this.j = 1;
        this.m = 0;
    }
    // TODO?: Implement as state automata?
    step() {
        if (this.isDone()) return;
        if (this.j < this.data.length) {
            if (this.data[this.j] < this.data[this.m]) this.m = this.j;
            this.j += 1
        }
        else {
            this._swap(this.m, this.i);
            this.i += 1;
            this.progress = this.i / this.data.length; // TODO: Calculate better notion of progress since selection sort always does the same amount of work
            this.j = this.i + 1;
            this.m = this.i;
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
            if (this.data[this.i] < this.data[this.j]) {
                this.aux[this.l++] = this.data[this.i++];
            } else {
                this.aux[this.l++] = this.data[this.j++];
            }
        } else if (this.i < this.mid) {
            this.aux[this.l++] = this.data[this.i++];
        } else if (this.j < this.hi) {
            this.aux[this.l++] = this.data[this.j++];
        } else { // Finished 
            for (let copyIdx = this.lo; copyIdx < this.hi; copyIdx++) { // Copy back
                this.data[copyIdx] = this.aux[copyIdx];
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
        assert(data.length > 1, 'Nothing to sort by the stepper.')
        this.q = 0;
        this.queue = [];
        this._calculatePostOrderTraversal(0, data.length, this.queue);
        this._prepareNextMerge();
    }
    _prepareNextMerge() {
        const [lo, mid, hi] = this.queue[this.q];
        this.lo = lo;
        this.mid = mid;
        this.hi = hi;
        this.i = this.lo;
        this.j = this.mid;
        this.l = this.lo;
        this.q++;
    }
    _calculatePostOrderTraversal(lo, hi, queue) {
        if ((hi - lo) === 1) return;
        const mid = lo + Math.floor((hi - lo) / 2);
        this._calculatePostOrderTraversal(lo, mid, queue);
        this._calculatePostOrderTraversal(mid, hi, queue);        
        queue.push([lo, mid, hi]) 
    }
    step() {
        if (this.isDone()) {  assert(isSorted(this.data), "Data should be sorted when done!"); return; }
        if (!this.mergeStep()) { return; } // Only do the merge step if we didn't finish merging

        this.progress = Math.min(1, this.q / this.queue.length); // TODO: Make a better progress 

        if (!this.isDone()) {
            this._prepareNextMerge();
        }
    }

    
}

class BottomUpMergeSortStepper extends MergeSortStepper { // TODO?: Is there a way to make the animation prettier?
    constructor(data) {
        super(data);
        this.k = 1;
        this.lo = 0;
        this.mid = 1;
        this.hi = 2;

        this.i = 0;
        this.l = 0;
        this.j = 1;
    }
    step() {
        if (this.isDone()) {  assert(isSorted(this.data), "Data should be sorted when done!"); return; }
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
        if (this.mid > this.hi) { // We skip by setting the iterator indices to their end value
            this.i = this.mid; 
            this.j = this.hi;
        }

        // We can call mergeStep again to compensate for the copying back taking a whole step no matter if we are copying 2 elements or the whole array.  
        // By doing an extra merge step when we have copied this means the copying step is essentially ignored.
        // this.mergeStep();
    }
}


class QuickSortStepper extends SortStepper {
    constructor(data) {
        super(data);
        shuffle(data); // TODO?: How should randomness be handled by the stepper? Pick random each step or do a shuffle? Should we step through the shuffle?
        this.lo = 0;
        this.hi = data.length;

        this.v = this.data[this.lo];
        this.i = this.lo + 1;
        this.j = this.hi - 1;
    }
    step() {
        if (this.isDone()) return;
        if (this.i < this.j) {
            while (this.data[this.i] < this.v && this.i < this.h) { this.i++; }
            while (this.data[this.j] > this.v && this.j > this.lo) { this.j--; }
            if (this.i < this.j) { this._swap(this.i, this.j); }
        } else if (this.data[this.j] < this.v) {
            this._swap(this.lo, this.j);
        }

        // We only do right recursion since I am not sure how to go back
        this.lo = 0;
        this.hi = this.j;
        this.v = this.data[this.lo];
        this.i = this.lo + 1;
        this.j = this.hi - 1;

        this.progress = 1 / this.hi

        // TODO: Implement next
    }
}
function insertionSort(data, lo, hi) {
    function swap(i, j) {
        const tmp = data[i];
        data[i] = data[j];
        data[j] = tmp;
    }
    for (let i = lo; i < hi; i++) {
        for (let j = i-1; j >= lo; j--) {
            if (data[j+1] < data[j]) { swap(j, j+1); }
            else { break; }
        }
    }
}

function quicksort(data) {
    shuffle(data);
    
    function swap(i, j) {
        const tmp = data[i];
        data[i] = data[j];
        data[j] = tmp;
    }

    // We partition based on value in lo by moving two pointers from the second element toward the end and from the last element toward the first.
    function partition(lo, hi) {
        const v = data[lo];
        let i = lo + 1;
        let j = hi - 1;
        while (i < j) {
            while (data[i] < v && i < hi) { i++; }
            while (data[j] > v && j > lo) { j--; }
            
            // Now i points to a value >= v & j points to a value <= v, so unless they have passed each other we can swap
            if (i < j) { swap(i, j); } 
        }
        // Finally swap the pivot element to the last element smaller than it. The check is to handle the case for lo + 1 = hi - 1 correctly since j data[j] may not be smaller than data[lo] in this case.
        if (data[j] < data[lo]) { swap(lo, j); }
        return j;
    }

    function sort(lo, hi) {
        if ((hi - lo) < 1) return insertionSort(data, lo, hi);
        const j = partition(lo, hi);
        sort(lo, j);
        sort(j + 1, hi);
    }

    sort(0, data.length);
}


function topDownMergeSort(data) {
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

function bottomUpMergeSort(data) { 
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


// function drawIndices(ctx, indices, drawSettings) {
function drawIndices(ctx, sortStepper, {leftX, width, topY, height}) {
    const barWidth = width / sortStepper.data.length;
    function drawIndex(i, name, topOffset) {
        let x = leftX + i * barWidth + barWidth / 2; 
        let y = topY + topOffset;
        ctx.fillText(name, x, y);
    }
    ctx.fillStyle = 'black';
    ctx.font = 'Ariel 26px'
    ctx.textAlign = 'center'
    if (sortStepper.lo !== undefined) { drawIndex(sortStepper.lo, "lo", 10); }
    if (sortStepper.hi !== undefined) { drawIndex(sortStepper.hi, "hi", 20); }
    if (sortStepper.mid !== undefined) { drawIndex(sortStepper.mid, "mid", 30); } 
    if (sortStepper.i !== undefined) { drawIndex(sortStepper.i, "i", 40); }
    if (sortStepper.j !== undefined) { drawIndex(sortStepper.j, "j", 50); }
}


function drawData(ctx, data, gradient, {leftX, topY, width, height, minBarHeight, maxBarHeight, maxValue}) {
    // ctx.clearRect(leftX, topY, width, height);

    const barWidth = width / data.length;
    // const maxValue = maxValue; //Math.max(...data);
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

// class Animation {
//     constructor(duration) {
//         this.duration = duration;
//         this.remaining = duration;
//         this.endCallbacks = [];
//     }
//     then(callback) {
//         this.endCallbacks.push(callback);
//     } 
//     step(deltaTimeMs) {
//         this.remaining -= deltaTimeMs;
//         if (this.remaining < 0) {
//             this.remaining = 0;
//             this.endCallbacks.forEach(c => c());
//         }
//     }
// }

// Maybe the best way to do this is to precompute everything and then do it?
// For the stepping we could do this on the fly because it was instant, 
// but for animation it might make more sense to do it beforehand 
// because when one thing ends we need to start the next thing which 
// we could do by checking the current animation in a frame to see if 
// it was done and then calculate the new animation and set it to start the next 
// frame. 

// Animate i enter
// Animate compare i to n
// Animate minIdx enter
// animate j enter
// animate compare j to n
// animate a[j] < a[minIdx] comparison
// animate minIdx update
// animate increment j 
// .... 
// animate swap

// Alternatively
// animate Swap 
// animate next Swap
// ...

// Is it important

class Animation {
    constructor(duration) {
        this.duration = duration;
    }
    animate(t) {}
    start() {}
    end() {}
}

class WaitAnimation extends Animation {
    constructor(duration) {
        super(duration);
    }
}

class SwapAnimation extends Animation {
    constructor(duration, a, b, easingFunction) {
        super(duration);
        this.a = a;
        this.b = b;
        this.easingFunction = easingFunction;
    }
    start() {
        const ax = this.a.position.x;
        const ay = this.a.position.y;
        const bx = this.b.position.x;
        const by = this.b.position.y;

        const diff = Math.abs(ax - bx);
        const controlPointDiffY = 0.3 * diff;
        this.upperCurve = new QubicBezierCurve(ax, ay, ax, ay - controlPointDiffY, bx, by - controlPointDiffY, bx, by);
        this.lowerCurve = new QubicBezierCurve(bx, by, bx, by + controlPointDiffY, ax, ay + controlPointDiffY, ax, ay);
    }
    animate(t) {
        t = this.easingFunction(t);
        const [lx, ly] = this.lowerCurve.getPoint(t);
        const [ux, uy] = this.upperCurve.getPoint(t);

        this.a.position.x = ux;
        this.a.position.y = uy;

        this.b.position.x = lx;
        this.b.position.y = ly;
    }

}

// Handles a sequence of animations by time steps. 
// This class is meant to be used in a requestAnimationFrame loop where the step function is called with the desired delta time (e.g. the time since last frame).
// Going back in time is supported by calling reset.
class AnimationHandler {
    constructor(animations, resetCallback) {
        this.animations = animations;
        this.currentAnimationIdx = 0;
        this.currentElapsedTimeMs = 0;
        this.resetCallback = resetCallback;
        
        this.animationStartTime = [];
        let currentTime = 0;
        for (const a of animations) {
            this.animationStartTime.push(currentTime);
            currentTime += a.duration;
        }
    }
    reset() {
        this.currentAnimationIdx = 0;
        this.currentElapsedTimeMs = 0;
        this.resetCallback();

    }
    step(deltaTimeMs) {
        assert(deltaTimeMs >= 0, 'deltaTimeMs should be positive. Call reset to go back in time.');
        this.currentElapsedTimeMs += deltaTimeMs;
        if (this.currentAnimationIdx >= this.animations.length) { return; } // We are done

        let remainingTimeMs = this.currentElapsedTimeMs -  this.animationStartTime[this.currentAnimationIdx];

        let currentAnimation = this.animations[this.currentAnimationIdx];
        while (remainingTimeMs > 0) {
            if (remainingTimeMs <= currentAnimation.duration) {
                currentAnimation.animate(remainingTimeMs / currentAnimation.duration);
                break;
            } 

            // Handle remaining aniamtion time
            currentAnimation.animate(1);
            currentAnimation.end();

            remainingTimeMs -= currentAnimation.duration;
            this.currentAnimationIdx++;
            if (this.currentAnimationIdx >= this.animations.length) { break; }
            currentAnimation = this.animations[this.currentAnimationIdx];
            currentAnimation.start();
        }
    }
}

// Compute the swaps needed to sort the objects using selection sort
// The objects are assumed to have a value property that is used for comparison
function computeSelectionSortSwaps(objects) {
    const order = []; // We need to keep track of the order of the objects without swapping them in the original array
    for (let i = 0; i < objects.length; i++) {
        order.push(i);
    }
    const swaps = [];
    function swap(i, j) {
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
        swaps.push([order[j], order[i]]);
    }
    for (let i = 0; i < objects.length; ++i) {
        let minIdx = i;
        for (let j = i + 1; j < objects.length; ++j) {
            if (objects[order[j]].value < objects[order[minIdx]].value) minIdx = j;
        }
        swap(i, minIdx)
    }
    return swaps;
}

function onBodyLoad() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // const data = randomArray(10);
    const data = [ 5, 6, 9, 7, 8, 4, 3, 2, 1, 0];
    const drawSettings = {
        leftX: 100,
        topY: 200,
        rectSize: 40,
        minBarHeight: 30,
        maxBarHeight: 270
    };
    const width = data.length * drawSettings.rectSize;
    const height = drawSettings.rectSize;
    const offSetX = width / data.length;

    const objects = [];
    for (let i = 0; i < data.length; i++) {
        objects.push({ 
            value: data[i],
            position: {
                x: drawSettings.leftX + offSetX * i + offSetX / 2,
                y: drawSettings.topY + height / 2
            }
        });
    }
    const resetCallback = () => {
        for (let i = 0; i < objects.length; i++) {
            objects[i].position.x = drawSettings.leftX + offSetX * i + offSetX / 2;
            objects[i].position.y = drawSettings.topY + height / 2;
        }
    }

    const swaps = computeSelectionSortSwaps(objects);

    const easingFunctions = [
        easeInSine,
        easeOutSine, 
        easeInOutSine,
        easeInQuad,
        easeOutQuad,
        easeInOutQuad,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic,
        easeInQuart,
        easeOutQuart,
        easeInOutQuart,
        easeInQuint, 
        easeOutQuint,
        easeInOutQuint,
        easeInCirc,
        easeOutCirc,
        easeInOutCirc,
        easeInElastic, 
        easeOutElastic,
        easeInOutElastic,
        easeInExpo,
        easeOutExpo,
        easeInOutExpo,
        easeInBack,
        easeOutBack,
        easeInOutBack,
        easeInBounce,
        easeOutBounce,
        easeInOutBounce,
    ];


    let easingFunction = easingFunctions[0];
    let changingEasingFunction = t => {
        return easingFunction(t);
    }

    const swapDuration = 1500;
    const waitDuration = 100;
    const animations = [];
    for (const [a, b] of swaps) { // We have an issue right now where I'm defining the animations beforehand, but the same element might be moved twice, but the second move is only calculated based on the the initial position.
        animations.push(new WaitAnimation(waitDuration));
        animations.push(new SwapAnimation(swapDuration, objects[a], objects[b], changingEasingFunction));
    } // We need to swap 'a' and 'b' and when we swap 'b' with 'c' we need to use the new position of 'b'

    const animationHandler = new AnimationHandler(animations, resetCallback);

    const selectionSortCode = new SelectionSortCodeDisplay({
        position: {x: 900, y: 50},
        padding: 10,
        font: '18px Consolas, Courier New, monospace',
    })


    // TODO: Draw index pointers
    // TODO: Animate update of index pointer values

    const ui = new UI();

    let topY = 50;
    for (const f of easingFunctions) {
        const button = new Button({position: {x: 530, y: topY}, size: {width: 25, height: 15}, lineWidth: 2});
        button.addCallback(_ => {
            easingFunction = f;
        });
        ui.add(button);
        topY += 20;
    }

    canvas.addEventListener('mousedown', e => ui.mouseDown(e));
    canvas.addEventListener('mouseup', e => ui.mouseUp(e));
    canvas.addEventListener('mousemove', e => ui.mouseMove(e));

    let lastTime;
    let elapsedTime = 0;
    function draw(time) {
        const dt = time - lastTime;
        elapsedTime += dt;
        lastTime = time;
        ctx.fillStyle = 'black'

        // const animationTime = elapsedTime % (swapDuration + waitDuration);
        // let t = easingFunction(Math.max(animationTime - waitDuration, 0) / swapDuration);
        // if (animationTime < waitDuration / 2 && elapsedTime > swapDuration + waitDuration) { t = 1 }; 

        animationHandler.step(dt);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = "bold 18px serif";
        ctx.fillText("Current Easing function: " + easingFunction.name, 200, 50)

        // ! Draw boxes
        ctx.beginPath();
        ctx.rect(drawSettings.leftX, drawSettings.topY, width, height);
        for (let i = 1; i < data.length; i++) {
            ctx.moveTo(drawSettings.leftX + offSetX * i, drawSettings.topY)
            ctx.lineTo(drawSettings.leftX + offSetX * i, drawSettings.topY + height);
        }
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ! Draw numbers
        ctx.font = "bold 30px serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < objects.length; i++) {
            const element = objects[i].value;
            const {x, y} = objects[i].position;
            ctx.fillText(element, x, y);
        }

        // ! Draw easing fuctions buttons
        ui.draw(ctx);

        // ! Draw easing fuctions button text
        ctx.font = "bold 10px serif";
        let topY = 58;
        for (const f of easingFunctions) {
            ctx.fillText(f.name, 600, topY)
            topY += 20;
        }
        
        // ! Code
        selectionSortCode.draw(ctx);

        requestAnimationFrame(draw);
    }
    requestAnimationFrame(time => {
        lastTime = time;
        draw(time);
    });


    // So we can animate the swaps now
    // Next step is to combine the stepping stuff from before with the animation stuff.

    // Maybe as a intermediate step is to do the code stuff 


}

function onBodyLoad2() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // TODO: Maybe use state machine to get a trace of the algorithm with the code of the algorithm next to the data
    // TODO: Select data size
    // TODO: Select data type, e.g. sorted, reverse sorted, random, etc.
    // TODO: Make a progress bar and let the algorithm go back to previous progress points of the algorithm using snapshots etc. Maybe make a snapshot class which takes a stepper and steps for it, but takes snapshots along the way.
    const drawSettings = {
        leftX: 100,
        topY: 60,
        width: 400,
        height: 300,
        minBarHeight: 30,
        maxBarHeight: 270
    };

    const n = 100
    // TODO: Different interesting types of unsorted data to show how things behave in non-random settings.
    const data = randomArray(n);



    // for (let i = 0; i < 1000; i++) {
    //     const data = randomArray(n);
    //     quicksort(data);
    //     assert(isSorted(data), `${data} is not sorted`);
    // }

    // return 

    // const data = [5, 4, 7, 2, 0, 1, 6, 3];
    const gradient = createGradient({r: 67, g: 83, b: 150}, {r:183, g: 90, b: 43}, );

    const maxSpeed = (n * n) / 100;      // Nice max speed for quadratic time algorithms
    let stepsPerFrame = maxSpeed / 100;
    // const maxSpeed = n * Math.log2(n) / 100; // This does not seem to be perfect for small arrays
    // let stepsPerFrame = 0.01; //maxSpeed / 100;

    let ui = new UI();
    const speedSlider = new HorizontalSlider({
        position: {x: 100, y: 400}, size: {width: 300, height: 30}, lineWidth: 3, initialSliderMarkerRatio: stepsPerFrame / maxSpeed, 
    });
    ui.add(speedSlider);

    canvas.addEventListener('mousedown', e => ui.mouseDown(e));
    canvas.addEventListener('mouseup', e => ui.mouseUp(e));
    canvas.addEventListener('mousemove', e => ui.mouseMove(e));

    let sortStepper = new SelectionSortStateStepper(data);

    

    speedSlider.addCallback(value => {
        stepsPerFrame = value * maxSpeed;
    });

    let totalSteps = 0;

    drawSettings.maxValue = n;
    const drawFrame = time => {
        // TODO: Frame rate display

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
        drawIndices(ctx, sortStepper, drawSettings); // TODO: Drawing indices makes the copying to auxiliary array very weird. 
        // TODO?: Maybe highlight the interesting columns? This may be useless for big n, so only show it for small
        // TODO?: Maybe show i and j from below?


        if (sortStepper.aux) { // If the sorting algorithm has an auxiliary array, draw it too
            // TODO: For merge sorts, also draw l as an index in this view
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