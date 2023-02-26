// TODO: Move compare and swap logic in here
// TODO: Make compare and swap positioned in a normalized manner (0 - 1)
class Network {
    constructor(size) {
        this.size = size;
        this.values = [];
        this.callbacks = [];
        this.ids = [];
        for (let i = 0; i < size; ++i) {
            this.values.push(null);
        }
        this.compareAndSwaps = new LinkedList();
        this.casById = {};
        this.casByStartWire = []
        this.casByEndWire = []
        for (let i = 0; i < this.size; i++) {
            this.casByStartWire.push([]);
            this.casByEndWire.push([]);
        }
    }
    set(i, value) {
        this.values[i] = value;
    }
    get(i) {
        return this.values[i];
    }
    addCompareAndSwap(position, i, j) {
        let value = {
            position,
            i,
            j,
            cas: (vals) => {
                if (vals[value.j] < vals[value.i]) {
                    let tmp = vals[value.i];
                    vals[value.i] = vals[value.j];
                    vals[value.j] = tmp;
                };
            }
        };
        let id = this.compareAndSwaps.insertBeforePredicate(value, n => n.position > position);
        this.ids.push(id);
        value.id = id;
        this.casById[id] = value;
        this.casByStartWire[i].push(value);
        this.casByEndWire[j].push(value);
        this.callbacks.forEach(c => c(id, position, i, j));
    }
    removeLastCompareAndSwap() {
        let id = this.ids.pop();
        if (id == undefined) return;

        let wire = this.casById[id];

        this.casById[id] = null;
        this.casByStartWire[wire.i].pop()
        this.casByEndWire[wire.j].pop()

        this.compareAndSwaps.remove(id);
    }
    *getCompareAndSwaps() {
        for (let cas of this.compareAndSwaps.items()) {
            yield cas
        }
    }
    run() {
        let result = this.values.slice(0);
        this.compareAndSwaps.forEach(c => c.cas(result));
        return result;
    }

    subscribe(callback) {
        this.callbacks.push(callback);
    }

    // TODO: Unsubscribe

}

// A "Drawable" is an object with a draw method

// TODO: Update every draw or update once and keep state in squares?
// Currently updates every frame

// Focus is the element which has been clicked on
// Invariant: There should be focus on no more elements than one

// TODO: Implement arrow focus
// TODO: Implement arrow removal
// TODO: Show path of values? In different colors and dotted line?
class NetworkFrame {
    constructor(network, drawSettings, isInteractable = true) {
        if (!network instanceof Network) {
            throw new TypeError("argument has to be instance of Network");
        }
        this.drawSettings = {
            marginX: 25, 
            marginY: 25,
            borderColor: '#000000',
            wireColor: '#000000',
            wireWidth: 3,
            circleRadius: 8,
            arrowWidth: 3,
            tipLength: 15,
            tipWidth: 10,
            arrowColor: '#000000',
            squareLength: 25,
            squareOffset: 10,
            wireLength: 400,
            ...drawSettings // Overwrite if available
        };
        this.checkInvariants()
        this.boundedKeyDownCallback = this.keyDownCallback.bind(this);

        this.isInteractable = isInteractable;
        this.network = network;
        this.compareAndSwaps = new LinkedList();

        // Static drawables
        this.leftSquares = [];
        this.rightSquares = [];
        this.wires = [];

        // Dynamic drawables
        this.arrow = verticalArrow(0, 0, 0, this.drawSettings.tipLength, this.drawSettings.tipWidth);
        this.arrow.color = this.drawSettings.arrowColor;
        this.arrowStartCircle = circle(0, 0, this.drawSettings.circleRadius);
        this.arrows = {};

        // Draw Flag
        this.displayRightSquares = true;

        // Hover and focus elements
        this.focusSquareIdx = null;
        
        this.hoverWireIdx = null;
        this.focusWireIdx = null;

        // Setup static drawables
        let squareLength = this.drawSettings.squareLength;
        let wireLength = this.drawSettings.wireLength;
        let squareOffset = this.drawSettings.squareOffset;
        for (let i = 0; i < this.network.size; ++i) {
            let wireY = this.drawSettings.marginY + squareLength / 2 + (squareLength + squareOffset) * i;
            let squareY = this.drawSettings.marginY + (squareLength + squareOffset) * i;
            this.leftSquares.push(writableSquare(this.drawSettings.marginX, squareY, squareLength));
            this.wires.push(horline(this.drawSettings.marginX + squareLength + squareOffset, wireY, wireLength));
            this.rightSquares.push(writableSquare(this.drawSettings.marginX + wireLength + squareLength + 2 * squareOffset, squareY, squareLength));
            this.leftSquares[i].borderColor = this.drawSettings.squareBorderColor;
            this.rightSquares[i].borderColor = this.drawSettings.squareBorderColor;

        }

        network.subscribe(this.createNetworkCasCallback());
    }
    drawSingleWireOverlay(wire, start, end, color, ctx) {
        let y = this.drawSettings.marginY + 
                (this.drawSettings.squareLength +
                    this.drawSettings.squareOffset) * wire;
        let x = this.drawSettings.marginX + 
                    this.drawSettings.squareOffset + 
                    this.drawSettings.squareLength + 
                    this.drawSettings.wireLength * start;

        let width = this.drawSettings.wireLength * (end - start) ;
        let height = this.drawSettings.squareLength;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }
    getWireOverlayColor(value) {
        return this.drawSettings.wireOverlayColor(value);
    }
    drawWireOverlay(ctx) {
        let a = this.network.values.slice(0);
        let start = 0;
        let cas = [...this.network.getCompareAndSwaps()]
        for (const c of cas) {
            for (let i = 0; i < this.wires.length; i++) {
                let color = this.getWireOverlayColor(a[i]);
                this.drawSingleWireOverlay(i, start, c.position, color, ctx);
            }
            c.cas(a)
            start = c.position;
        }
        for (let i = 0; i < this.wires.length; i++) {
            let color = this.getWireOverlayColor(a[i]);
            this.drawSingleWireOverlay(i, start, 1, color, ctx);
        }
    }

    draw(ctx) {
        ctx.lineWidth = this.drawSettings.wireWidth;

        if (this.drawSettings.drawWireOverlay) {
            this.drawWireOverlay(ctx);
        }
        ctx.fillStyle = this.arrow.color
        
        // Left squares and wire
        for (let i = 0; i < this.network.size; ++i) {
            let lSquare = this.leftSquares[i];
            lSquare.focus = (i == this.focusSquareIdx);
            lSquare.text = this.network.get(i);
            if (this.drawSettings.drawBox) {
                lSquare.draw(ctx);
            }

            ctx.strokeStyle = this.drawSettings.wireColor;
            this.wires[i].draw(ctx);
        }
        
        ctx.lineWidth = this.drawSettings.arrowWidth;
        // Draw place arrow start circle
        if (this.hoverWireIdx != null) {
            let w = this.wires[this.hoverWireIdx];
            if(this.focusWireIdx == null) {
                this.arrowStartCircle.x = mousePosition.x;
                this.arrowStartCircle.y = w.y;
            } else if (this.hoverWireIdx != this.focusWireIdx) {
                let wireDiff = w.y - this.wires[this.focusWireIdx].y;
                this.arrow.x = this.arrowStartCircle.x;
                this.arrow.y = this.arrowStartCircle.y;
                this.arrow.length = wireDiff;
                this.arrow.draw(ctx);
            }

            this.arrowStartCircle.draw(ctx);
        } 

        ctx.lineWidth = this.drawSettings.wireWidth;
        // Simulate network, draw right square results, and draw arrows
        if (this.drawSettings.drawBox) {
            this.updateRightSquares();
            this.rightSquares.forEach(s => s.draw(ctx));
        }
        ctx.lineWidth = this.drawSettings.arrowWidth;
        for (let cas of this.network.getCompareAndSwaps()) {
            this.drawArrow(cas, ctx);
        }
        // for (let k in this.arrows) {
        //     this.arrows[k].forEach(d => d.draw(ctx));
        // }
    }
    mouseMove() {
        this.hoverWireIdx = null;
        for (let i = 0; i < this.network.size; ++i) {
            let dist = this.wires[i].distance(mousePosition);
            // Assumption: radius is smaller than the offset between wires
            if (dist <= this.drawSettings.circleRadius * 2) {
                this.hoverWireIdx = i; 
            }
            this.leftSquares[i].hover = this.leftSquares[i].isInside(mousePosition);
        }
    }

    mouseDown() {
        // Handle wire focus
        if (this.hoverWireIdx != null) {
            this.focusWireIdx = this.hoverWireIdx;
            this.arrowStartCircle.y = this.wires[this.hoverWireIdx].y;
            this.focusSquareIdx = null;
            return;
        }

        // Handle square focus
        for (let i = 0; i < this.network.size; ++i) {
            let s = this.leftSquares[i];
            if (s.isInside(mousePosition)) {
                this.focusSquareIdx = i;
            }
        }
    }
    mouseUp() {
        // Handle place arrow mode 
        if (this.focusWireIdx != null && this.hoverWireIdx != null && this.hoverWireIdx != this.focusWireIdx) {
            // Add compare-and-swap in correct order
            let normalizedPosition = (this.arrow.x - this.wires[0].x) / this.wires[0].length;
            this.network.addCompareAndSwap(normalizedPosition, this.focusWireIdx, this.hoverWireIdx);
            // The new arrow will be added through the callback
        }
        this.focusWireIdx = null;
    }
    keyDownCallback(e) {
        let key = e.key;
        if (key === DELETE_KEY || key === BAKCSPACE_KEY) { // Delete value in left square
            this.network.set(this.focusSquareIdx, null);
            this.focusSquareIdx = null;
        }
        else if (this.focusSquareIdx != null && '0' <= key && key <= '9') { // Write to left square
            this.network.set(this.focusSquareIdx, key);
            this.focusSquareIdx = null;
        }
        else if (key == 'h') { // Toggle display of right squares
            this.displayRightSquares = !this.displayRightSquares;
        } else if (this.isInteractable && e.ctrlKey && key == Z_KEY) {
            // Remove last arrow
            this.network.removeLastCompareAndSwap()
        } else if (this.isInteractable && key === O_KEY) {
            this.drawSettings.drawWireOverlay = !this.drawSettings.drawWireOverlay;
        }
    }
    frameStart() {
        document.addEventListener('keydown', this.boundedKeyDownCallback);
    }
    frameEnd(){
        document.removeEventListener('keydown', this.boundedKeyDownCallback);
    }
    keyUp() {}
    updateRightSquares() {
        if (this.displayRightSquares) {
            let vals = this.network.run();
            for (let i = 0; i < vals.length; ++i) {
                this.rightSquares[i].text = vals[i];
            }
        } else {
            for (let i = 0; i < this.network.size; ++i) {
                this.rightSquares[i].text = null;
            }
        }
    }

    drawArrow(compareAndSwap, ctx) {
        let xOffset = this.drawSettings.marginX + this.drawSettings.squareLength + this.drawSettings.squareOffset;
        let position = compareAndSwap.position;

        let x = xOffset + position * this.drawSettings.wireLength;
        let y1 = this.wires[compareAndSwap.i].y;
        let y2 = this.wires[compareAndSwap.j].y;

        drawCircle(x, y1, this.drawSettings.circleRadius, ctx)
        drawVerticalArrow(x, y1, y2 - y1, this.drawSettings.tipLength, this.drawSettings.tipWidth, ctx);
    }

    createNetworkCasCallback() {
        let xOffset = this.drawSettings.marginX + this.drawSettings.squareLength + this.drawSettings.squareOffset;
        let wires = this.wires;
        let wireLength = this.drawSettings.wireLength;
        let arrowTipLength = this.drawSettings.tipLength;
        let arrowTipWidth = this.drawSettings.tipWidth;
        let circleRadius = this.drawSettings.circleRadius;

        return (id, position, startWireIdx, endWireIdx) => {
            // Create new drawables 
            let x = xOffset + position * wireLength;
            let y1 = wires[startWireIdx].y;
            let y2 = wires[endWireIdx].y;
            let arrow = verticalArrow(x, y1, y2 - y1, arrowTipLength, arrowTipWidth);
            arrow.color = this.drawSettings.arrowColor;
            let arrowStartCircle = circle(x, y1, circleRadius);

            // Add compare-and-swap in correct order
            this.arrows[id] = [arrowStartCircle, arrow];
        };
    }

    checkInvariants() {
        let wireDistance = this.drawSettings.squareLength + this.drawSettings.squareOffset; 
        if (wireDistance < 2 * this.drawSettings.circleRadius) {
            let errorMessage = 'Wire circles overlap: The circle radius is too big compared to distance between wires.'
            throw new Error(errorMessage)
        }
    }
}


const ASCENDING = true;
const DESCENDING = false;

function bitonicSort(start, n, direction, network, pos) {
    if (n == 1) return pos;

    let m = n / 2;
    let newPos = bitonicSort(start, m, DESCENDING, network, pos);
    bitonicSort(start + m, m, ASCENDING, network, pos);
    return bitonicMerge(start, n, direction, network, newPos);
}

function bitonicMerge(start, n, direction, network, pos) {
    if (n == 1) return pos;
    var space = 0.01; // This value is good for n = 16
    // var space = canv.width / 96000; //0.02; //canv.width / 1000;

    let m = n / 2;
    for (let i = start; i < start + m; i++) {
        addCas(i, i + m, direction, network, pos + space * (i - start));
    }

    bitonicMerge(start, m, direction, network, pos + space * (m + 5));
    pos = bitonicMerge(start + m, m, direction, network, pos + space * (m + 5));

    return pos  + space * 2
}

function addCas(i, j, direction, network, pos) {
    if (direction === DESCENDING) {
        network.addCompareAndSwap(pos, i, j);
    } else {
        network.addCompareAndSwap(pos, j, i);
    }
}

