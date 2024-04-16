'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

const MAP_TILE_SIZE = 50;

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

const mouseState = {
    dragStartPosition: null, // 
    position: {x: 0, y: 0},
}

const drawSettings = {
    bezierPointRadius: 10,
    bezierControlPointColor: 'blue',
    bezierEndPointColor: 'black',
    canvas: null,
    canvasContex: null,
    drawPrimaryCurvePoints: true,
    drawSecondaryCurvePoints: true,
    drawTertiaryCurvePoints: true,
    drawControlPoints: true,
    drawControlLines: true,
    drawLerpPointConnections: true,
    drawLerpPoints: true,
    controlLineColor: 'black',
    primaryCurveColor: 'red',
    secondaryCurveColor: 'green',
    tertiaryCurveColor: 'blue',
    curveWidth: 3,
    controlLineWidth: 2
};

class BezierPoint {
    constructor(position) {
        this.position = position;
    }
    draw(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, drawSettings.bezierPointRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class BezierCurve {
    constructor(...points) {
        this.n = points.length;
        this.points = points;
        this.curvePoints = [];
    }
    initializeCurvePoints(numberOfPointsToCreate) {
        this.curvePoints = [];
        for (let i = 0; i <= numberOfPointsToCreate-1; i++) {
            const t = i / numberOfPointsToCreate;
            const lerpPoints = this.getLerpPoints(t);
            this.curvePoints.push(lerpPoints[lerpPoints.length-1]);
        }
    }
    drawControlPoints(ctx) {
        this.points[0].draw(ctx, drawSettings.bezierEndPointColor);
        for (let i = 1; i < this.n-1; i++) {
            this.points[i].draw(ctx, drawSettings.bezierControlPointColor);
        }
        this.points[this.n-1].draw(ctx, drawSettings.bezierEndPointColor);
    }
    drawControlLines(ctx) {
        ctx.strokeStyle = drawSettings.controlLineColor;
        ctx.strokeWidth = drawSettings.controlLineWidth; 
        ctx.beginPath();
        let currentPoint = this.points[0];
        ctx.moveTo(currentPoint.position.x, currentPoint.position.y);
        for (let i = 1; i < this.n; i++) {
            currentPoint = this.points[i];
            ctx.lineTo(currentPoint.position.x, currentPoint.position.y);
        }
        ctx.stroke();
    }
    getLerpPoints(t) {
        const points = this.points.map(p => p.position);
        return this._getLerpPointsRec(t, [], points);
    }
    _getLerpPointsRec(t, result, points) {
        if (points.length === 1) return result;
        const newPoints = [];
        for (let i = 1; i < points.length; i++) {
            const previousPoint = points[i-1];
            const currentPoint = points[i];
            const newPoint = previousPoint.lerp(currentPoint, t);
            newPoints.push(newPoint);
            result.push(newPoint);
        }
        return this._getLerpPointsRec(t, result, newPoints);
    }
}

class QubicCurveSpline {
    constructor(...points) {
        this.points = points;
        if (this.points.length < 4) throw new Error('Too few points');

        // Silently remove excessive points
        while ((this.points.length-4) % 3 !== 0) {
            this.points.pop();
        }
        this.parts = (this.points.length / 3) | 0;
    }
    initializeCurvePoints(numberOfPointsToCreate) {
        this.curvePoints = [];
        this.secondaryCurvePoints = [];
        this.tertiaryCurvePoints = [];
        for (let i = 0; i <= numberOfPointsToCreate-1; i++) {
            const t = (i * this.parts) / numberOfPointsToCreate;
            const lerpPoints = this.getLerpPoints(t);
            this.curvePoints.push(lerpPoints[5]);
            this.secondaryCurvePoints.push(lerpPoints[3]);
            this.tertiaryCurvePoints.push(lerpPoints[4]);
        }

    }
    drawControlPoints(ctx) {
        for (let i = 0; i < this.points.length; i++) {
            let color = drawSettings.bezierControlPointColor;
            if (i % 3 === 0) {
                color = drawSettings.bezierEndPointColor;
            }
            this.points[i].draw(ctx, color);
        }
    }
    drawControlLines(ctx) {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 4
        ctx.beginPath();
        let currentPoint = this.points[0];
        ctx.moveTo(currentPoint.position.x, currentPoint.position.y);
        for (let i = 1; i < this.points.length; i++) {
            currentPoint = this.points[i];
            ctx.lineTo(currentPoint.position.x, currentPoint.position.y);
        }
        ctx.stroke();
    }
    getLerpPoints(t) {
        let i = Math.floor(t);
        if (t === this.parts) {
            i = this.parts-1;
        }
        const j = i * 3;
        t = t - i;

        const p0 = this.points[j].position;
        const p1 = this.points[j+1].position;
        const p2 = this.points[j+2].position;
        const p3 = this.points[j+3].position;

        const lerp1 = p0.lerp(p1, t);
        const lerp2 = p1.lerp(p2, t);
        const lerp3 = p2.lerp(p3, t);

        const lerp4 = lerp1.lerp(lerp2, t);
        const lerp5 = lerp2.lerp(lerp3, t);
        const lerp6 = lerp4.lerp(lerp5, t);

        return [lerp1, lerp2, lerp3, lerp4, lerp5, lerp6]
    }
}

const qubicSpline = new QubicCurveSpline(
    new BezierPoint(new Vec2(100, 400)),
    new BezierPoint(new Vec2(350, 200)),
    new BezierPoint(new Vec2(700, 400)),
    new BezierPoint(new Vec2(800, 500)),
    new BezierPoint(new Vec2(1000, 200)),
    new BezierPoint(new Vec2(1200, 800)),
    new BezierPoint(new Vec2(1500, 500)),
    new BezierPoint(new Vec2(1600, 200)),
    new BezierPoint(new Vec2(1700, 600)),
    new BezierPoint(new Vec2(1800, 500)),
);

const quadraticCurve = new BezierCurve(
    new BezierPoint(new Vec2(100, 400)),
    new BezierPoint(new Vec2(350, 200)),
    new BezierPoint(new Vec2(700, 400))
);

const qubicCurve = new BezierCurve(
    new BezierPoint(new Vec2(800, 500)),
    new BezierPoint(new Vec2(1000, 200)),
    new BezierPoint(new Vec2(1200, 800)),
    new BezierPoint(new Vec2(1500, 500))
);

const line = new BezierCurve(
    new BezierPoint(new Vec2(100, 300)),
    new BezierPoint(new Vec2(1500, 500)),
);

const beyondCurve = new BezierCurve(
    new BezierPoint(new Vec2(100, 300)),
    new BezierPoint(new Vec2(500, 100)),
    new BezierPoint(new Vec2(300, 600)),
    new BezierPoint(new Vec2(900, 550)),
    new BezierPoint(new Vec2(500, 200)),
    new BezierPoint(new Vec2(1800, 100)),
    new BezierPoint(new Vec2(1200, 50)),
    new BezierPoint(new Vec2(1500, 500)),
);

const quadraticBezierCurvePoints = [];
const qubicBezierCurvePoints = [];

function setLineColor(ctx, howManyConnectedPositionsInARow) {
    switch (howManyConnectedPositionsInARow) {
        case 2: {
            ctx.strokeStyle = 'violet';
        } break;
        case 3: {
            ctx.strokeStyle = 'green';
        } break;
        case 4: {
            ctx.strokeStyle = 'aqua';
        } break;
        case 5: {
            ctx.strokeStyle = 'blue';
        } break;
        case 6: {
            ctx.strokeStyle = 'brown';
        } break;
        default: {
            ctx.strokeStyle = 'black';
        }
    }
}

function drawPositionLines(ctx, lerpPositions, howManyConnectedPositionsInARow) {
    ctx.lineWidth = 2;
    let currentIndex = 0;
    ctx.strokeStyle = 'red'

    while (howManyConnectedPositionsInARow > 1) {
        setLineColor(ctx, howManyConnectedPositionsInARow);
        ctx.beginPath();
        ctx.moveTo(lerpPositions[currentIndex].x, lerpPositions[currentIndex].y);
        currentIndex++;
        for (let i = 0; i < howManyConnectedPositionsInARow-1; i++) {
            ctx.lineTo(lerpPositions[currentIndex].x, lerpPositions[currentIndex].y);
            currentIndex++;
        }
        ctx.stroke();
        howManyConnectedPositionsInARow--;
    }
}

function drawQubicSpline(ctx, spline) {
    const lerpPositions = spline.getLerpPoints(drawSettings.slider.state.value * spline.parts);

    if (drawSettings.drawControlLines) {
        spline.drawControlLines(ctx);
    }

    if (drawSettings.drawLerpPointConnections){
        drawPositionLines(ctx, lerpPositions, 3); 
    }
    if (drawSettings.drawLerpPoints) {
        lerpPositions.forEach(position => {
            drawCircle(ctx, position.x, position.y, 5);
        });
    }

    const pointsToDraw = Math.round(drawSettings.slider.state.value * spline.curvePoints.length);
    for (let i = 0; i < pointsToDraw; i++) {
        if (drawSettings.drawPrimaryCurvePoints) {
            const currentPoint = spline.curvePoints[i];
            drawCircle(ctx, currentPoint.x, currentPoint.y, drawSettings.curveWidth, drawSettings.primaryCurveColor);
        }
        if (drawSettings.drawSecondaryCurvePoints) {
            const secondaryPoint = spline.secondaryCurvePoints[i];
            drawCircle(ctx, secondaryPoint.x, secondaryPoint.y, drawSettings.curveWidth, drawSettings.secondaryCurveColor);
        }
        if (drawSettings.drawTertiaryCurvePoints) {
            const tertiaryPoint = spline.tertiaryCurvePoints[i];
            drawCircle(ctx, tertiaryPoint.x, tertiaryPoint.y, drawSettings.curveWidth, drawSettings.tertiaryCurveColor);
        }
    }

    if (drawSettings.drawControlPoints) {
        spline.drawControlPoints(ctx);
    }
}

function drawCurve(ctx, curve) {
    const lerpPositions = curve.getLerpPoints(drawSettings.slider.state.value);
    curve.drawControlLines(ctx);
    drawPositionLines(ctx, lerpPositions, curve.points.length-1);
    lerpPositions.forEach(position => {
        drawCircle(ctx, position.x, position.y, 5);
    });

    const pointsToDraw = Math.round(drawSettings.slider.state.value * curve.curvePoints.length);
    for (let i = 1; i < pointsToDraw; i++) {
        const currentPoint = curve.curvePoints[i];
        drawCircle(ctx, currentPoint.x, currentPoint.y, 2, 'red');
    }

    curve.drawControlPoints(ctx);
}

function draw() {
    const ctx = drawSettings.canvasContex;
    ctx.clearRect(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);

    drawQubicSpline(ctx, qubicSpline);
    // drawCurve(ctx, line)
    // drawCurve(ctx, beyondCurve);

    drawSettings.slider.draw(ctx, 'black')
}

function drawCircle(ctx, x, y, radius, color = 'black') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
}

function createHorizontalSlider(mouseState, {position, size, lineWidth}) {
    const leftX = position.x;
    const topY = position.y;
    const {width, height} = size;
    const centerY = topY + height /2;
    const slider = {
        isInteractable: true,
        isDragging: false,
        state: {value: 0, min: 0, max: 1, callbacks: {}, setValue: function(value) {
            this.value = value;
            for (const c in this.callbacks) {
                this.callbacks[c](this);
            }
        }},
        currentPosition: 0,
        draw: function(ctx) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = lineWidth
            ctx.beginPath()
            ctx.arc(leftX + width, centerY, height / 2, -Math.PI/2, Math.PI/2 + 0.001, false);
            ctx.moveTo(leftX, topY);
            ctx.lineTo(leftX + width, topY);
            ctx.arc(leftX, centerY, height / 2, -Math.PI/2, Math.PI/2 + 0.001, true);
            ctx.moveTo(leftX, topY + height);
            ctx.lineTo(leftX + width, topY + height);
            ctx.stroke()
            if (this.isDragging){
                drawCircle(ctx, lerp(leftX, leftX + width, this.currentPosition), centerY, height / 2 + lineWidth)
            } else {
                drawCircle(ctx, lerp(leftX, leftX + width, this.currentPosition), centerY, height / 2 - 2)
            }
        },
        updateState: function() { 
            const x = clamp(mouseState.position.x, leftX, leftX + width);
            const percentage = (x - leftX) / width;
            this.state.setValue(lerp(this.state.min, this.state.max, percentage));
        },
        mouseDown: function(e) {
            if (mouseState.position.x < leftX || mouseState.position.x > leftX + width ||
                mouseState.position.y < topY || mouseState.position.y > topY + height) return;
            if (e.button != MOUSE_LEFT_BUTTON) return; 
            this.isDragging = true;
            this.updateState();
        }, 
        mouseUp: function(e) {
            if (e.button != MOUSE_LEFT_BUTTON) return; 
            this.isDragging = false;
        },
        mouseMove: function(e) {
            if (!this.isDragging) return;
            this.updateState();
        }
    }
    // The slider position is updated based on a callback from the threshold state
    slider.state.callbacks["slider"] = function(state) {
        slider.currentPosition = (state.value - state.min) / (state.max - state.min);
    }
    return slider;
}

function initialize() {
    drawSettings.canvas = document.getElementById('canvas');
    drawSettings.canvasContex = drawSettings.canvas.getContext('2d');
    drawSettings.slider = createHorizontalSlider(mouseState, {position:{x: 100, y: 700}, size: {height: 20, width: 500}, lineWidth: 4});
    drawSettings.slider.state.callbacks['draw'] = function() {
        draw()
    }

    // const pointsToCreate = (p2.position.x - p0.position.x) || 0;
    const pointsToCreate = 1000;
    quadraticCurve.initializeCurvePoints(pointsToCreate);
    qubicCurve.initializeCurvePoints(pointsToCreate);
    beyondCurve.initializeCurvePoints(pointsToCreate);
    qubicSpline.initializeCurvePoints(pointsToCreate);
    line.initializeCurvePoints(pointsToCreate);


    // Prevent right click from opening context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);


    function mouseDown(e) {
        drawSettings.slider.mouseDown(e);
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {            
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
            case MOUSE_RIGHT_BUTTON: {
            } break;
            default: {}
        }
    }

    function mouseUp(e) {
        drawSettings.slider.mouseUp(e);
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
        }
        draw();
    }

    function keyDown(e) {
        switch (e.code) {
            case 'KeyN': {
            } break;
            case 'ShiftLeft': {
            }
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case 'ShiftLeft': {
            }
        }
    }
    function mouseMove(e) {
        mouseState.position = {
            x: (e.pageX - e.target.offsetLeft) * (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        }; 
        drawSettings.slider.mouseMove(e);
    }

    requestAnimationFrame(() => {
        draw();
    });
}