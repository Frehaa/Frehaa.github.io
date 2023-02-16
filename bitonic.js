"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
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
             case 't': {
                console.log(mousePosition)
                console.log(frames[0])
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

function initialize() {
    initializeEventListeners();
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    // TITLE 
    frames.push(combineFrames({
        draw: function(ctx) {
            ctx.font = '60px Arial';
            ctx.lineWidth = 3;
            let text = "Sorting Networks and Bitonic Merge Sort";
            let measure = ctx.measureText(text);
            let x = canvas.width / 2 - measure.width / 2;
            ctx.fillText(text, x, 100);
        }
    }));

    // BIT OF PRACTICAL INFORMATION
    frames.push(combineFrames({
        draw: function(ctx) {
            ctx.font = '60px Arial';
            ctx.lineWidth = 3;
            let text = "Practical information (PhD, feedback therefore recording, \
                student participation, can cut out if need)";
            let measure = ctx.measureText(text);
            let x = canvas.width / 2 - measure.width / 2;
            ctx.fillText(text, x, 100);
        }
    }));

    // WIKIPEDIA NETWORK
    let wikiNetwork = new Network(16);
    let wikiNetworkDrawSettings = {
        marginX: 65,
        marginY: 50,
        squareLength: 0, 
        squareOffset: 35, 
        wireLength: canvas.width - 200,
        squareBorderColor: '#FFFFFF', 
        lineWidth: 4, 
        circleRadius: 5, 
        tipLength: 10, 
        tipWidth: 7, 
        drawBox: false
    };
    let wikiNetworkFrame = new NetworkFrame(wikiNetwork, wikiNetworkDrawSettings, false);
    bitonicSort(0, 16, DESCENDING, wikiNetwork, 0.05);
    frames.push(wikiNetworkFrame);

    // I show them how it works 1
    // let tinyExampleNetwork = new Network(3);
    // tinyExampleNetwork.values[0] = 2
    // tinyExampleNetwork.values[1] = 3
    // tinyExampleNetwork.values[2] = 1
    // let tinyExampleNetworkFrame = new NetworkFrame(tinyExampleNetwork, {
    //     marginX: 40,
    //     marginY: 50,
    //     squareLength: 100, 
    //     squareOffset: 35, 
    //     wireLength: canvas.width - 300,
    //     squareBorderColor: '#000000', 
    //     lineWidth: 10, 
    //     circleRadius: 10, 
    //     tipLength: 20, 
    //     tipWidth: 15, 
    //     drawBox: true

    // }, true);

    // currentFrameIdx = frames.length
    // frames.push(tinyExampleNetworkFrame);

    // Let them do it
    let selfExampleNetwork = new Network(6);
    let selfExampleNetworkFrame = new NetworkFrame(selfExampleNetwork, {
        marginX: 40,
        marginY: 50,
        squareLength: 100, 
        squareOffset: 35, 
        wireLength: canvas.width - 300,
        squareBorderColor: '#000000', 
        lineWidth: 10, 
        circleRadius: 10, 
        tipLength: 20, 
        tipWidth: 15, 
        drawBox: true

    }, true);

    currentFrameIdx = frames.length
    frames.push(selfExampleNetworkFrame);


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

    let boxplotDrawSettings = {
        marginX: 50,
        marginY: 50,
        height: 500,
        width: 600,
        boxOffset: 1,
        startColor: {
            r: 0.1,
            g: 0.3,
            b: 0.1,
        },
        endColor: {
            r: 0.1,
            g: 0.8,
            b: 0.1,
        },
        drawHorizontal: false
    };
    
    let values = [19, 13, 17, 12, 3, 1, 8, 9, 18, 16, 2, 15, 14, 6, 5, 7, 10, 11, 4, 20]; 
    // values.sort((a, b) => a > b)
    // console.log(values)
    // let values = [5, 3, 6, 1, 4, 2]

    let values1 = values.slice(0, 9);
    let values2 = values.slice(10, 19);
    

    values1.sort((a, b) => a > b)
    // values2.sort((a, b) => a < b)
    values2.sort((a, b) => a > b)
    
    let values3 = values1.concat(values2);


    let boxplotFrame1 = new BoxplotFrame(values, boxplotDrawSettings);
    let c = combineFrames(boxplotFrame1, {draw: function(ctx) {
        ctx.lineWidth = 3
        for (let i = 0; i < values.length; i++) {

            drawVerticalArrow(10 * i, 10 * i, 50, 20, 10, ctx);
        }

    }});
    // frames.push(c);
    // frames.push(boxplotFrame1);

    // ctx.scale(2, 2);

    let wireColors = ['#FF0000', '#00FF00', '#FF0000', '#00FF00', '#00FF00', '#FF0000', '#00FF00', '#FF0000' ]; 

    let network16 = new Network(16);
    let defaultNetworkDrawSettings = {
        marginX: 0,
        marginY: 0,
        squareLength: 20, 
        wireLength: canvas.width - 2 * 40, 
        squareOffset: 20, 
        squareBorderColor: '#000000', 
        wireColor: '#000000', 
        wireWidth: 3, 
        circleRadius: 10, 
        arrowColor: '#000000',
        tipLength: 20, 
        tipWidth: 14, 
        fontSize: 60,
        drawBox: false,
    };
    let networkFrame = new NetworkFrame(network16, defaultNetworkDrawSettings, true);

    let cleanNetworkFrame = new NetworkFrame(new Network(16), defaultNetworkDrawSettings, false);

    let greenOverlayFrame = new OverlayFrame({
        position: {x: canvas.width / 2, y: 2},
        width: canvas.width / 2 - 40 + 2,
        height: canvas.height / 2 - 40 - 4,
        strokeColor: rgba(0, 1, 0, 0.5),
        fillColor: rgba(0, 1, 0, 0.5),
    });

    let redOverlayFrame = new OverlayFrame({
        position: {x: canvas.width / 2, y: canvas.height / 2 - 40 + 2},
        width: canvas.width / 2 - 40 + 2,
        height: canvas.height / 2 - 40 - 2,
        strokeColor: rgba(1, 0, 0, 0.5),
        fillColor: rgba(1, 0, 0, 0.5),
    });

    let greenWireOverlayFrames = []
    for (let i = 0; i < networkFrame.network.size; i++) {
        let y = networkFrame.drawSettings.marginY +
                (networkFrame.drawSettings.squareLength +
                    networkFrame.drawSettings.squareOffset) * i
        let frame = new OverlayFrame({
            position: {x: 40, y },
            width: networkFrame.drawSettings.wireLength,
            height: networkFrame.drawSettings.squareLength,
            strokeColor: rgba(0, 1, 0, 0.5),
            fillColor: rgba(0, 1, 0, 0.5),
        });
        greenWireOverlayFrames.push(frame)
    }
    let redWireOverlayFrames = []
    for (let i = 0; i < networkFrame.network.size; i++) {
        let y = networkFrame.drawSettings.marginY +
                (networkFrame.drawSettings.squareLength +
                    networkFrame.drawSettings.squareOffset) * i
        let frame = new OverlayFrame({
            position: {x: 40, y },
            width: networkFrame.drawSettings.wireLength,
            height: networkFrame.drawSettings.squareLength,
            strokeColor: rgba(1, 0, 0, 0.5),
            fillColor: rgba(1, 0, 0, 0.5),
        });
        redWireOverlayFrames.push(frame)
    }

    let dashedLine = {
        draw: function(ctx) {
            let y = canvas.height / 2 - 40;
            ctx.beginPath();
            ctx.setLineDash([10, 10]);
            ctx.moveTo(20, y);
            ctx.lineTo(canvas.width - 20, y);
            ctx.stroke();
        }
    }
    frames.push(networkFrame);
    let networkWidthWidthGreen = combineFrames(networkFrame, greenOverlayFrame);
    frames.push(networkWidthWidthGreen);
    let bothoverlay  = combineFrames(networkWidthWidthGreen, redOverlayFrame)
    frames.push(bothoverlay);


    // Insert merge box overlay
    let mergeBoxOverlay1 = new TextBoxOverlay("MERGE", {
        position: {x: canvas.width / 2, y: 2},
        width: 100,
        height: canvas.height - 80,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let networkMergeFrame1 = combineFrames(bothoverlay, mergeBoxOverlay1);
    frames.push(networkMergeFrame1);

    let mergeBoxOverlay2 = new TextBoxOverlay("MERGE", {
        position: {x: canvas.width / 2 + 150, y: 2},
        width: 70,
        height: (canvas.height - 80) / 2,
        fontSize: 30,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let networkMergeFrame2 = combineFrames(networkMergeFrame1, mergeBoxOverlay2)
    frames.push(networkMergeFrame2);

    let mergeBoxOverlay3 = new TextBoxOverlay("MERGE", {
        position: {x: canvas.width / 2 + 300, y: 2},
        width: 50,
        height: (canvas.height - 80) / 4,
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
    let blueOverlayFrame = new OverlayFrame({
        position: {x: 40, y: 2},
        width: canvas.width / 2 - 40 + 2,
        height: canvas.height / 2 - 40 - 2,
        strokeColor: rgba(0, 0, 1, 0.5),
        fillColor: rgba(0, 0, 1, 0.5),
    });
    frames.push(combineFrames(blueOverlayFrame, bitonic2Frame));

    let blueOverlayFrame2 = new OverlayFrame({
        position: {x: 40, y: canvas.height / 2 - 40 + 2},
        width: canvas.width / 2 - 40 + 2,
        height: canvas.height / 2 - 40 - 2,
        strokeColor: rgba(0, 0, 1, 0.5),
        fillColor: rgba(0, 0, 1, 0.5),
    });
    frames.push(combineFrames(blueOverlayFrame2, bitonic2Frame));

    // frames.push(combineFrames(wireColoredFrame, networkFrame2));
    // frames.push(combineFrames(wireColoredFrame, networkFrame));

    // frames.push(combineFrames(combineFrames(greenOverlayFrame, redOverlayFrame), wireColoredFrame));

    // frames.push(combineFrames(wireColoredFrame, dashedLine))
    // frames.push(combineFrames(wireColoredFrame, dashedLine))

    // TODO: Make the wire overlays sensitive to the placement of the arrow


    // currentFrameIdx = frames.length
    // Insert merge box overlay
    let sortBoxOverlay1 = new TextBoxOverlay("SORT↓", {
        position: {x: canvas.width / 2 - 250, y: 5},
        width: 100,
        height: (canvas.height - 100) / 2,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });
    let sortBoxOverlay2 = new TextBoxOverlay("↑SORT", {
        position: {x: canvas.width / 2 - 250, y: canvas.height / 2 - 40 + 5},
        width: 100,
        height: (canvas.height - 100) / 2 + 5,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });
    let waawframe = combineFrames(cleanNetworkFrame, sortBoxOverlay1, sortBoxOverlay2, mergeBoxOverlay1);
    frames.push(waawframe);

    let questionBoxOverlay = new TextBoxOverlay("SORT?", {
        position: {x: canvas.width / 2 + 200, y: 5},
        width: 100,
        height: (canvas.height - 80) / 2,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    let mergeBoxOverlay4 = new TextBoxOverlay("MERGE", {
        position: {x: canvas.width / 2 + 400, y: 5},
        width: 100,
        height: (canvas.height - 80) / 2,
        fontSize: 40,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: true
    });

    // currentFrameIdx = frames.length
    frames.push(combineFrames(waawframe, questionBoxOverlay, mergeBoxOverlay4));

    frames.push(combineFrames({
        draw: function(ctx) {

        }
    }));

    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}