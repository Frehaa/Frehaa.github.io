"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
const HOME_KEY = "Home";
const END_KEY = "End";
const PAGE_DOWN_KEY = "PageDown";
const PAGE_UP_KEY = "PageUp";
const BAKCSPACE_KEY = "Backspace";

var mousePosition = {x:0, y: 0};

let frames = [];
let currentFrameIdx = 0;

function rgba(r, g, b, a) {
    return { r, g, b, a };
}

function draw() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    frames[currentFrameIdx].draw(ctx);
    ctx.restore();

    ctx.strokeText((currentFrameIdx + 1).toString(), canvas.width - 100, canvas.height - 50);

    requestAnimationFrame(draw);
}

let rectangleFrame = {
    r: rectangle(250, 250, 100, 100),
    isInteractable: true,
    draw: function(ctx) {
        if (this.r.drag) {
            ctx.strokeStyle = '#FF0000';
        } else if (this.r.isInside(mousePosition)) {
            ctx.strokeStyle = '#00FF00';
        } else {
            ctx.strokeStyle = '#0000FF';
        }
        this.r.draw(ctx);
    }, 
    mouseMove: function() {
        if (this.r.drag) {
            this.r.x = clamp(mousePosition.x - this.r.width/2, 200, 400);
        }
    }, 
    mouseDown: function() {
        if (this.r.isInside(mousePosition)) {
            this.r.drag = true;
            this.r.x = clamp(mousePosition.x - this.r.width/2, 200, 400);
        } 
    }, 
    mouseUp: function() {
        this.r.drag = false;
    },
    frameStart: function() {

    },
    frameEnd: function(){
        this.r.drag = false;
    },
    keyUp: function() {}
};

function initializeEventListeners() {
    let canvas = document.getElementById('canvas');
    canvas.addEventListener('mousemove', function(e) {
        mousePosition = {
            x: e.pageX - e.target.offsetLeft, 
            y:e.pageY - e.target.offsetTop
        };
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseMove();
    });

    canvas.addEventListener('mousedown', function(e) {
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseDown();
    });

    canvas.addEventListener('mouseup', function(e) {
        let frame = frames[currentFrameIdx];
        if (frame.isInteractable) frame.mouseUp();
    });

    document.addEventListener('keydown', function(e) {
        let prevFrameIdx = currentFrameIdx;
        switch (e.key) {
            case ARROW_RIGHT_KEY: {
                currentFrameIdx = Math.min(currentFrameIdx + 1, frames.length-1);
            } break;
            case ARROW_LEFT_KEY: {
                currentFrameIdx = Math.max(currentFrameIdx - 1, 0);
            } break;
            case HOME_KEY: {
                currentFrameIdx = 0;
            } break;
            case END_KEY: {
                currentFrameIdx = frames.length - 1;
            } break;
            case PAGE_DOWN_KEY: {
                currentFrameIdx = Math.min(currentFrameIdx + 10, frames.length-1);
            } break;
            case PAGE_UP_KEY: {
                currentFrameIdx = Math.max(currentFrameIdx - 10, 0);
            } break;
            case 't': {
                console.log(mousePosition)
                console.log(frames[currentFrameIdx])
            } break;
           default: return;
        }
        if (prevFrameIdx != currentFrameIdx) {
            frames[prevFrameIdx].frameEnd();
            frames[currentFrameIdx].frameStart();
        }
    });

    let k_range_input = document.getElementById('range-input-k');
    let m_range_input = document.getElementById('range-input-m');
    k_range_input.addEventListener('input', function(e) {
        let m = Number(m_range_input.value);
        if (Number(e.target.value) > m) {
            e.target.value = m;
        }
    });
    m_range_input.addEventListener('input', function(e) {
        let k = Number(k_range_input.value);
        if (Number(e.target.value) < k) {
            e.target.value = k;
        }
    });
}

class OverlayFrame {
    constructor(drawSettings) {
        this.drawSettings = {
            ...drawSettings
        }
    }
    draw(ctx) {
        let x = this.drawSettings.position.x
        let y = this.drawSettings.position.y
        let width = this.drawSettings.width
        let height = this.drawSettings.height
        let sr = this.drawSettings.strokeColor.r * 255
        let sg = this.drawSettings.strokeColor.g * 255
        let sb = this.drawSettings.strokeColor.b * 255
        let sa = this.drawSettings.strokeColor.a 
        let fr = this.drawSettings.fillColor.r * 255
        let fg = this.drawSettings.fillColor.g * 255
        let fb = this.drawSettings.fillColor.b * 255
        let fa = this.drawSettings.fillColor.a 
        ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${sa})`;
        ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${fa})`;
        ctx.fillRect(x, y, width, height)
        ctx.strokeRect(x, y, width, height)
    }
    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    frameStart() {}
    frameEnd(){}
    keyUp() {}
}

class TextBoxOverlay {
    constructor(text, drawSettings) {
        this.text = text;
        this.drawSettings = drawSettings;
    }
    draw(ctx) {
        let x = this.drawSettings.position.x; 
        let width = this.drawSettings.width; 
        let y = this.drawSettings.position.y;
        let textHeight = this.drawSettings.fontSize; 
        let font = this.drawSettings.font;
        let height = this.drawSettings.height; 
        let word = this.text; 
        let combinedTextHeight = textHeight * word.length;
        let drawVertical = this.drawSettings.drawVertical;
        ctx.font = `${textHeight}px ${font}`

        let measure = ctx.measureText(word[0]);
        ctx.lineWidth = this.drawSettings.strokeWidth;
        ctx.clearRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        if (drawVertical) {
            for (let i = 0; i < word.length; i++) {
                let centerX = x + width / 2 - measure.width / 2;
                let centerY = y + (height - combinedTextHeight) / 2;
                ctx.fillText(word[i], centerX, centerY + textHeight * i + measure.actualBoundingBoxAscent)    
            }
        } else {
            ctx.fillText(word, x, y);
        }

    }

    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    frameStart() {}
    frameEnd(){}
    keyUp() {}
}

function fillTextCenter(text, y, ctx) {
    let canvas = ctx.canvas;
    let measure = ctx.measureText(text);
    let x = canvas.width / 2 - measure.width / 2;
    ctx.fillText(text, x, y);
}

function initialize() {
    initializeEventListeners();
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    let w = canvas.width;
    let h = canvas.height;

    // TITLE 
    // WIKIPEDIA NETWORK
    let wikiNetwork = new Network(16);
    let wikiNetworkDrawSettings = {
        marginX: w * 0.03,
        marginY: h * 0.18,
        squareLength: 0, 
        squareOffset: h / 22, 
        wireLength: w - (2 * h / 20 + w * 0.06),
        squareBorderColor: '#FFFFFF', 
        lineWidth: h / 175, 
        circleRadius: h / 110, 
        tipLength: h / 50, 
        tipWidth: h / 90, 
        drawBox: false
    };
    // currentFrameIdx = frames.length
    let wikiNetworkFrame = new NetworkFrame(wikiNetwork, wikiNetworkDrawSettings, false);
    bitonicSort(0, 16, DESCENDING, wikiNetwork, 0.04);

    frames.push(combineFrames(wikiNetworkFrame, {
        draw: function(ctx) {
            ctx.font = '80px Arial';
            ctx.lineWidth = 3;
            let text = "Sorting Networks and Bitonic Merge Sort";
            fillTextCenter(text, 100, ctx);
        }
    }));

    // currentFrameIdx = frames.length
    // BIT OF PRACTICAL INFORMATION
    frames.push(combineFrames({
        draw: function(ctx) {
            ctx.font = '80px Arial';
            ctx.lineWidth = 3;
            let text = "Practical information (PhD, feedback therefore recording, \
                student participation, can cut out if need)";

            fillTextCenter('Practical Information', 100, ctx);

            ctx.font = '60px Arial';
            let bullets = [
                '• PhD student                      ',
                '• Recording                         ',
                '• Participation                     '
            ];
            for (let i = 0; i < bullets.length; i++) {
                const bullet = bullets[i];
                ctx.fillText(bullet, 100, 200 + 100 * i);
                
            }
        }
    }));



    // I show them how it works 1
    let tinyExampleNetwork = new Network(3);
    tinyExampleNetwork.values[0] = 2
    tinyExampleNetwork.values[1] = 3
    tinyExampleNetwork.values[2] = 1
    let tinyExampleNetworkFrame = new NetworkFrame(tinyExampleNetwork, {
        marginX: w * 0.03,
        marginY: h * 0.1,
        squareLength: w * 0.05, 
        squareOffset: w * 0.02, 
        wireLength: w * 0.8,
        squareBorderColor: '#000000', 
        lineWidth: 10, 
        circleRadius: 10, 
        tipLength: 20, 
        tipWidth: 15, 
        drawBox: true

    }, true);
    // currentFrameIdx = frames.length;

    frames.push(tinyExampleNetworkFrame);


    // Let them do it
    let selfExampleNetwork = new Network(5);
    let selfExampleNetworkFrame = new NetworkFrame(selfExampleNetwork, {
        marginX: h / 20,
        marginY: h / 20,
        squareLength: h / 7, 
        squareOffset: w / 100, 
        wireLength: w - (2 * w / 100 + 2 * h / 7 + 2 * h / 20),
        squareBorderColor: '#000000', 
        lineWidth: h / 100, 
        circleRadius: h / 100, 
        tipLength: h / 50, 
        tipWidth: w / 200,
        // strokeWidth: ???, // TODO: The square width is not customizable
        drawBox: true

    }, true);
    // currentFrameIdx = frames.length
    frames.push(selfExampleNetworkFrame);

    // Bubble sort
    let bubbleExampleNetwork = new Network(6);
    let bubbleExampleNetworkFrame = new NetworkFrame(bubbleExampleNetwork, {
        marginX: h / 20,
        marginY: h / 20,
        squareLength: h / 9, 
        squareOffset: w / 100, 
        wireLength: w - (2 * w / 100 + 2 * h / 9 + 2 * h / 20),
        squareBorderColor: '#000000', 
        lineWidth: h / 100, 
        circleRadius: h / 100, 
        tipLength: h / 50, 
        tipWidth: w / 200,
        // strokeWidth: ???, // TODO: The square width is not customizable
        drawBox: false

    }, true);
    // currentFrameIdx = frames.length
    frames.push(bubbleExampleNetworkFrame);

    // let bitonicDrawSettings = {
    //         marginX: 50, 
    //         marginY: 50,
    //         width: 1600,
    //         height: 50,
    //         innerColor: 'rgba(255, 0, 0, 0.7)', // `#FF0000`,
    //         outColor: 'rgba(0, 255, 0, 0.7)', // `#00FF00`,
    //         borderColor: `#000000`,
    //         inOutSeperatorColor: 'rgba(255, 0, 0, 0.2)', // `#777777`,
    //         borderColor: '#000000',
    //         lineWidth: 3,
    //         offset: 100,
    // };
    // let bitonicSliderFrame = new BitonicSliderFrame(bitonicDrawSettings);
    // frames.push(bitonicSliderFrame);

    // ctx.scale(2, 2);

    let wireColors = ['#FF0000', '#00FF00', '#FF0000', '#00FF00', '#00FF00', '#FF0000', '#00FF00', '#FF0000' ]; 

    let network16 = new Network(16);
    let defaultNetworkDrawSettings = {
        marginX: w * 0.03,
        marginY: h * 0.08,
        squareLength: h / 40, 
        squareOffset: h / 40, 
        wireLength: w - (2 * h / 20 + w * 0.06),
        squareBorderColor: '#FFFFFF', 
        lineWidth: h / 175, 
        circleRadius: h / 110, 
        tipLength: h / 50, 
        tipWidth: h / 90, 
        drawBox: false
        // marginX: 0,
        // marginY: 0,
        // squareLength: 0, 
        // wireLength: w , 
        // squareOffset: h / 20, 
        // squareBorderColor: '#000000', 
        // wireColor: '#000000', 
        // wireWidth: 3, 
        // circleRadius: 10, 
        // arrowColor: '#000000',
        // tipLength: 20, 
        // tipWidth: 14, 
        // fontSize: 60,
        // drawBox: false,
    };
    let networkFrame = new NetworkFrame(network16, defaultNetworkDrawSettings, true);

    let cleanNetworkFrame = new NetworkFrame(new Network(16), defaultNetworkDrawSettings, false);

    let greenOverlayFrame = new OverlayFrame({
        position: {x: w / 2, y: networkFrame.drawSettings.marginY},
        width: w * 0.45,
        height: 8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - 
                networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(0, 1, 0, 0.5),
        fillColor: rgba(0, 1, 0, 0.5),
    });

    let redOverlayFrame = new OverlayFrame({
        position: {x: w / 2, y: networkFrame.drawSettings.marginY + 8.5 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - 
                networkFrame.drawSettings.squareOffset},
        width: w * 0.45,
        height: 8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - 
                networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(1, 0, 0, 0.5),
        fillColor: rgba(1, 0, 0, 0.5),
    });

    function createWireOverlay(i, drawSettings, color) {
        let y = drawSettings.marginY +
                (drawSettings.squareLength +
                    drawSettings.squareOffset) * i
        let x = drawSettings.marginX + 
                    drawSettings.squareOffset +
                    drawSettings.squareLength;
        return new OverlayFrame({
            position: {x, y },
            width: networkFrame.drawSettings.wireLength,
            height: networkFrame.drawSettings.squareLength,
            strokeColor: color,
            fillColor: color
        });
    }

    let greenWireOverlayFrames = []
    let redWireOverlayFrames = []
    for (let i = 0; i < networkFrame.network.size; i++) {
        let gframe = createWireOverlay(i, networkFrame.drawSettings, rgba(0, 1, 0, 0.5));
        let rframe = createWireOverlay(i, networkFrame.drawSettings, rgba(1, 0, 0, 0.5));
        greenWireOverlayFrames.push(gframe)
        redWireOverlayFrames.push(rframe)
    }

    function drawDashLine(x1, y1, x2, y2, dash, ctx) {
        ctx.beginPath();
        ctx.setLineDash(dash);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    let dashedLine = {
        draw: function(ctx) {
            let y = networkFrame.drawSettings.marginY + 
                8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) -
                networkFrame.drawSettings.squareOffset / 2 ;

            ctx.lineWidth = 3
            drawDashLine(networkFrame.drawSettings.marginX, y, w -
            networkFrame.drawSettings.marginX, y, [10, 10], ctx);
        }
    }
    frames.push(networkFrame);

    let networkWidthWidthGreen = combineFrames(networkFrame, greenOverlayFrame);
    frames.push(networkWidthWidthGreen);
    let bothoverlay  = combineFrames(networkWidthWidthGreen, redOverlayFrame)
    frames.push(bothoverlay);


    // Insert merge box overlay
    let mergeBoxOverlay1 = new TextBoxOverlay("MERGE", {
        position: {x: w / 2, y: 2},
        width: 100,
        height: h - 80,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let networkMergeFrame1 = combineFrames(bothoverlay, mergeBoxOverlay1);
    frames.push(networkMergeFrame1);

    let mergeBoxOverlay2 = new TextBoxOverlay("MERGE", {
        position: {x: w / 2 + 150, y: 2},
        width: 70,
        height: (h - 80) / 2,
        fontSize: 30,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let networkMergeFrame2 = combineFrames(networkMergeFrame1, mergeBoxOverlay2)
    frames.push(networkMergeFrame2);

    let mergeBoxOverlay3 = new TextBoxOverlay("MERGE", {
        position: {x: w / 2 + 300, y: 2},
        width: 50,
        height: (h - 80) / 4,
        fontSize: 20,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let networkMergeFrame3 = combineFrames(networkMergeFrame2, mergeBoxOverlay3)
    frames.push(networkMergeFrame3);

    frames.push(combineFrames(bothoverlay, {
        draw: function() {},
        frameStart: function() {
            // Dirty trick to make sure the network is initialized
            if (network16.compareAndSwaps.size > 0) return 
            for (let i = 0; i < network16.size / 2; i++) {
                network16.addCompareAndSwap(0.5 + 0.01 * i, i, i + 8)    
            }
        }
    }));

    // Frames which do not sort correctly
    let test = [ 8, 2, 3, 14, 15, 5, 6, 10, 1, 9, 12, 11, 7, 0, 4, 13 ];
    let wireColoredFrame = dashedLine
    for (let i = 0; i < networkFrame.network.size / 2; i++) {
        if (test[i] < 8) {
            wireColoredFrame = combineFrames(wireColoredFrame, greenWireOverlayFrames[i]);
        } else {
            wireColoredFrame = combineFrames(wireColoredFrame, redWireOverlayFrames[i]);
        }
        let k = i + 8;
        if (test[k] < 8) {
            wireColoredFrame = combineFrames(wireColoredFrame, greenWireOverlayFrames[k]);
        } else {
            wireColoredFrame = combineFrames(wireColoredFrame, redWireOverlayFrames[k]);
        }
        frames.push(combineFrames(wireColoredFrame, networkFrame))
    }

    // Example frames which do
    // Already sorted 1 
    let sorted1Frame = dashedLine;
    for (let i = 0; i < networkFrame.network.size / 2; i++) {
        sorted1Frame = combineFrames(sorted1Frame, greenWireOverlayFrames[i]);
        sorted1Frame = combineFrames(sorted1Frame, redWireOverlayFrames[i+8]);
    }
    frames.push(combineFrames(sorted1Frame, networkFrame));

    // Already sorted 2 
    let sorted2Frame = dashedLine;
    for (let i = 0; i < networkFrame.network.size / 2; i++) {
        sorted2Frame = combineFrames(sorted2Frame, redWireOverlayFrames[i]);
        sorted2Frame = combineFrames(sorted2Frame, greenWireOverlayFrames[i+8]);
    }
    frames.push(combineFrames(sorted2Frame, networkFrame));

    // Odd-even
    let oddEvenFrame = dashedLine;
    for (let i = 0; i < networkFrame.network.size / 2; i++) {
        if (i % 2 == 0) {
            oddEvenFrame = combineFrames(oddEvenFrame, greenWireOverlayFrames[i]);
            oddEvenFrame = combineFrames(oddEvenFrame, redWireOverlayFrames[i+8]);
        } else {
            oddEvenFrame = combineFrames(oddEvenFrame, redWireOverlayFrames[i]);
            oddEvenFrame = combineFrames(oddEvenFrame, greenWireOverlayFrames[i+8]);
        }
    }
    frames.push(combineFrames(oddEvenFrame, networkFrame));

    // Bitonic 1
    let bitonic1Frame = dashedLine;
    for (let i = 0; i < networkFrame.network.size / 2; i++) {
        if (i >= 4 ) {
            bitonic1Frame = combineFrames(bitonic1Frame, greenWireOverlayFrames[i]);
            bitonic1Frame = combineFrames(bitonic1Frame, redWireOverlayFrames[i+8]);
        } else {
            bitonic1Frame = combineFrames(bitonic1Frame, redWireOverlayFrames[i]);
            bitonic1Frame = combineFrames(bitonic1Frame, greenWireOverlayFrames[i+8]);
        }
    }
    frames.push(combineFrames(bitonic1Frame, networkFrame));
    // Bitonic 2
    let bitonic2Frame = dashedLine;
    for (let i = 0; i < networkFrame.network.size / 2; i++) {
        if (i < 4 ) {
            bitonic2Frame = combineFrames(bitonic2Frame, greenWireOverlayFrames[i]);
            bitonic2Frame = combineFrames(bitonic2Frame, redWireOverlayFrames[i+8]);
        } else {
            bitonic2Frame = combineFrames(bitonic2Frame, redWireOverlayFrames[i]);
            bitonic2Frame = combineFrames(bitonic2Frame, greenWireOverlayFrames[i+8]);
        }
    }
    bitonic2Frame = combineFrames(bitonic2Frame, networkFrame);
    frames.push(bitonic2Frame);


    // currentFrameIdx = 17
    let blueOverlayX = networkFrame.drawSettings.marginX +
                        networkFrame.drawSettings.squareLength +
                        networkFrame.drawSettings.squareOffset;
    let blueOverlayFrame = new OverlayFrame({
        position: {x: blueOverlayX, y: networkFrame.drawSettings.marginY},
        width: w * 0.4,
        height: 8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - networkFrame.drawSettings.squareOffset / 2,
        strokeColor: rgba(0, 0, 1, 0.5),
        fillColor: rgba(0, 0, 1, 0.5),
    });
    currentFrameIdx = frames.length
    frames.push(combineFrames(blueOverlayFrame, bitonic2Frame));

    let blueOverlayFrame2 = new OverlayFrame({
        position: {x: blueOverlayX, 
            y: networkFrame.drawSettings.marginY + 8 *
            (networkFrame.drawSettings.squareLength +
            networkFrame.drawSettings.squareOffset) -
            networkFrame.drawSettings.squareOffset / 2},
        width: w * 0.4,
        height: 8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - networkFrame.drawSettings.squareOffset / 2,
        strokeColor: rgba(0, 0, 1, 0.5),
        fillColor: rgba(0, 0, 1, 0.5),
    });
    frames.push(combineFrames(blueOverlayFrame2, bitonic2Frame));

    let whiteOverlayFrame = new OverlayFrame({
        position: {x: blueOverlayX, y: networkFrame.drawSettings.marginY},
        width: w * 0.4,
        height: 8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - 
                networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(0, 0, 0, 1),
        fillColor: rgba(1, 1, 1, 1),
    });

    frames.push(combineFrames(bitonic2Frame, whiteOverlayFrame, {
        draw: function(ctx) {
            ctx.font = '40px Arial';
            ctx.fillText('Sort ASC', 300, 200);
        }
    }));

    let whiteOverlayFrame2 = new OverlayFrame({
        position: {x: blueOverlayX, 
            y: networkFrame.drawSettings.marginY + 8 *
            (networkFrame.drawSettings.squareLength +
            networkFrame.drawSettings.squareOffset) -
            networkFrame.drawSettings.squareOffset / 2 + 
            networkFrame.drawSettings.squareOffset * 0.5
         },
        width: w * 0.4,
        height: 8 * (networkFrame.drawSettings.squareLength + networkFrame.drawSettings.squareOffset) - networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(0, 0, 0, 1),
        fillColor: rgba(1, 1, 1, 1),
    });

    frames.push(combineFrames(frames[frames.length-1], whiteOverlayFrame2, {
        draw: function(ctx) {
            ctx.font = '40px Arial';
            ctx.fillText('Sort DESC', 300, h / 2 + 200);
        }
    }))
    



    // frames.push(combineFrames(wireColoredFrame, networkFrame2));
    // frames.push(combineFrames(wireColoredFrame, networkFrame));

    // frames.push(combineFrames(combineFrames(greenOverlayFrame, redOverlayFrame), wireColoredFrame));

    // frames.push(combineFrames(wireColoredFrame, dashedLine))
    // frames.push(combineFrames(wireColoredFrame, dashedLine))

    // TODO: Make the wire overlays sensitive to the placement of the arrow


    // currentFrameIdx = frames.length
    // Insert merge box overlay
    let sortBoxOverlay1 = new TextBoxOverlay("SORT↓", {
        position: {x: w / 2 - 250, y: 5},
        width: 100,
        height: (h - 100) / 2,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });
    let sortBoxOverlay2 = new TextBoxOverlay("↑SORT", {
        position: {x: w / 2 - 250, y: h / 2 - 40 + 5},
        width: 100,
        height: (h - 100) / 2 + 5,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });
    let waawframe = combineFrames(cleanNetworkFrame, sortBoxOverlay1, sortBoxOverlay2, mergeBoxOverlay1);
    // frames.push(waawframe);

    let questionBoxOverlay = new TextBoxOverlay("SORT?", {
        position: {x: w / 2 + 200, y: 5},
        width: 100,
        height: (h - 80) / 2,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let mergeBoxOverlay4 = new TextBoxOverlay("MERGE", {
        position: {x: w / 2 + 400, y: 5},
        width: 100,
        height: (h - 80) / 2,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });


    // -------------- Beginning of boxplot sorting frames -----------------------
    let values = [13, 12, 3, 1, 7, 9, 15, 2, 16, 14, 5, 6, 8, 10, 11, 4]; 

    let values1 = values.slice(0, 8);
    let values2 = values.slice(8, 16);

    values1.sort((a, b) => a > b)
    values2.sort((a, b) => a < b)
    
    let values3 = values1.concat(values2);

    function drawCasBox(i, step, values, drawSettings, ctx) {
        let max = Math.max(...values);
        let leftX = drawSettings.marginX;
        let topY = drawSettings.marginY;
        let height = drawSettings.height;
        let width = drawSettings.width;
        let length = values.length;
        let offset = drawSettings.boxOffset;

        let boxWidth = (width / length) - offset;
        
        let x = leftX + (boxWidth + offset) * i +  boxWidth / 2;
        let boxHeight = height * (values[i] / max)
        let boxHeight2 = height * (values[i + step] / max)
        let y = topY + height - (boxHeight / 2);
        if (boxHeight > boxHeight2) {
            y = topY + height - (boxHeight2 / 2);
        } 
        drawHorizontalArrow(x, y, (boxWidth + offset) * step, 10, 10, ctx)
        ctx.strokeRect(leftX + (boxWidth + offset) * i, topY + height - boxHeight, boxWidth, boxHeight);
        ctx.strokeRect(leftX + (boxWidth + offset) * (i + step), topY + height - boxHeight2, boxWidth, boxHeight2);
    }

    let boxPlotDrawSettings = {
        marginX: w / 2 - w * 0.35,
        marginY: 50,
        height: 800,
        width: w * 0.7,
        boxOffset: 15,
        startColor: rgba(0, 1, 0, 0.5),
        endColor: rgba(1, 0, 0, 0.5),
        drawHorizontal: false
    };
    values = values3
    values = addCasFrames(0, values.length / 2, boxPlotDrawSettings, values)

    // Boxed 4 biggest on left
    let boxplotFrame = new BoxplotFrame(values, boxPlotDrawSettings);
    let c = combineFrames(boxplotFrame, {
        vals: values.slice(),
        draw: function(ctx) {
            let values = this.vals;
            ctx.lineWidth = 5
            let max = Math.max(...values);
            let leftX = boxPlotDrawSettings.marginX;
            let topY = boxPlotDrawSettings.marginY;
            let height = boxPlotDrawSettings.height;
            let width = boxPlotDrawSettings.width;
            let length = values.length;
            let offset = boxPlotDrawSettings.boxOffset;

            let boxWidth = (width / length) - offset;
            
            let boxHeight = height * (values[4] / max)
            let boxHeight2 = height * (values[13] / max)
            ctx.strokeRect(leftX - offset /2 + (boxWidth + offset) * 3, topY + height - boxHeight, 4 * (boxWidth + offset), boxHeight);
            ctx.strokeRect(leftX - offset /2 + (boxWidth + offset) * 10, topY + height - boxHeight2, 4 * (boxWidth + offset), boxHeight2);
            
            let dashX = w / 2 - offset / 2;
            drawDashLine(dashX, 30, dashX, 860, [10, 10], ctx);
    }});
    frames.push(c);


    function addCasFrames(start, step, drawSettings, values) {
        frames.push(new BoxplotFrame(values, drawSettings));
        for (let i = start; i < start + step; ++i) {
            let frame = new BoxplotFrame(values, drawSettings);
            let c = combineFrames(frame, {
                vals: values.slice(),
                step,
                draw: function(ctx) {
                    let values = this.vals;
                    ctx.lineWidth = 5
                    drawCasBox(i, this.step, values, drawSettings, ctx);
                
                    let dashX = drawSettings.marginX - drawSettings.boxOffset / 2 + (drawSettings.width * (start + this.step) / values.length);
                    drawDashLine(dashX, 30, dashX, 860, [10, 10], ctx);
            }});
            frames.push(c);

            values = values.slice();
            if (values[i] > values[i + step]) {
                let tmp = values[i];
                values[i] = values[i + step];
                values[i + step] = tmp;
            }

            frame = new BoxplotFrame(values, drawSettings);
            c = combineFrames(frame, {
                vals: values.slice(),
                step,
                draw: function(ctx) {
                    let values = this.vals;
                    ctx.lineWidth = 5
                    drawCasBox(i, this.step, values, drawSettings, ctx);
                
                    let dashX = drawSettings.marginX - drawSettings.boxOffset / 2 + (drawSettings.width * (start + this.step) / values.length);
                    drawDashLine(dashX, 30, dashX, 860, [10, 10], ctx);
            }});
            frames.push(c);
        }
        return values;
    }

    values = values.slice();
    currentFrameIdx = frames.length-1

    function addCasFramesRec(start, n, drawSettings, values) {
        drawSettings = {
            ...drawSettings,
            color: function(i, values, ctx) {
                let c = rgba(0.2, 0.2, 0.2, 0.5);
                if (i < start + n && i >= start) { // The range we are sorting
                    if (values[i] <= start + n / 2) { // The lower half of the range
                        c = rgba(0, 1, 0, 0.5);
                    } else {
                        c = rgba(1, 0, 0, 0.5);
                    }
                }             
                let {r,g,b,a} = c;
                ctx.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`; 
            },
        }

        if (n != 16) { // Special case, we ignore 16 since we have already added it
            values = addCasFrames(start, n / 2, drawSettings, values);
        }

        if (n > 2) {
            values = addCasFramesRec(start, n / 2, drawSettings, values);
            values = addCasFramesRec(start + n / 2, n / 2, drawSettings, values);

        }
        return values;
    }

    values = addCasFramesRec(0, 16, boxPlotDrawSettings, values)
    frames.push(new BoxplotFrame(values, {
        ...boxPlotDrawSettings,
        color: function(i, values, ctx) {
            let {r,g,b,a} = rgba(0, 1, 0, 0.5);
            ctx.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`; 
            
        }
    }))

    currentFrameIdx = frames.length

    frames.push(wikiNetworkFrame)

    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}