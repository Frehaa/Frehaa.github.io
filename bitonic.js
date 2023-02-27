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
const Z_KEY = "z";
const O_KEY = "o";
const F1_KEY = "F1";
const F2_KEY = "F2";

var mousePosition = {x:0, y: 0};

let frames = [];
let currentFrameIdx = 0;
let showSlideNumber = false;

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

    if (showSlideNumber) {
        ctx.strokeText((currentFrameIdx + 1).toString(), canvas.width - 100, canvas.height - 50);
    }

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
            x: (e.pageX - e.target.offsetLeft) * (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
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
            case F1_KEY: {
                console.log(mousePosition)
                console.log(frames[currentFrameIdx])
            } break;
            case F2_KEY: {
                showSlideNumber = !showSlideNumber;
            } break;
           default: return;
        }
        if (prevFrameIdx != currentFrameIdx) {
            frames[prevFrameIdx].frameEnd();
            frames[currentFrameIdx].frameStart();
        }
    });

    // let k_range_input = document.getElementById('range-input-k');
    // let m_range_input = document.getElementById('range-input-m');
    // k_range_input.addEventListener('input', function(e) {
    //     let m = Number(m_range_input.value);
    //     if (Number(e.target.value) > m) {
    //         e.target.value = m;
    //     }
    // });
    // m_range_input.addEventListener('input', function(e) {
    //     let k = Number(k_range_input.value);
    //     if (Number(e.target.value) < k) {
    //         e.target.value = k;
    //     }
    // });
}

function fillTextCenter(text, y, ctx) {
    let canvas = ctx.canvas;
    let measure = ctx.measureText(text);
    let x = canvas.width / 2 - measure.width / 2;
    ctx.fillText(text, x, y);
}

function createBulletPointSlides(title, bullets, drawSettings) {
    for (let i = 0; i < bullets.length; i++) {
        frames.push(combineFrames({
            draw: function(ctx) {
                ctx.font = drawSettings.titleFont;
                fillTextCenter(title, drawSettings.titleStart, ctx);
                ctx.font = drawSettings.bulletFont;
                for (let j = 0; j <= i; j++) {
                    ctx.fillText(drawSettings.bullet + ' ' + bullets[j],
                                drawSettings.bulletStartLeft, 
                                drawSettings.bulletStartTop +
                                    drawSettings.bulletOffset * j
                    );
                }
            }
        }));    
    }
}

function initialize() {
    initializeEventListeners();
    let canvas = document.getElementById('canvas');
    let w = canvas.width;
    let h = canvas.height;

    // TITLE + WIKIPEDIA NETWORK
    let wikiNetwork = new Network(16);
    wikiNetwork.values = Array.from(Array(16), (_, i) => 16 - i);

    let wikiNetworkDrawSettings = {
        marginX: w * 0.03,
        marginY: h * 0.18,
        squareLength: h / 44, 
        squareOffset: h / 44, 
        wireLength: w - (2 * h / 20 + w * 0.06),
        squareBorderColor: '#FFFFFF', 
        lineWidth: h / 175, 
        circleRadius: h / 110, 
        tipLength: h / 50, 
        tipWidth: h / 90, 
        drawBox: false,        
        wireOverlayColor: function(value) {
            let t = value / 16;
            if (value <= 8) {
                return `rgba(0, ${lerp(255, 50, t / 2)}, 0, 0.5)`;
            } else {
                return `rgba(${lerp(50, 255, t * 2)}, 0, 0, 0.5)`;
            }
        },
        drawWireOverlay: false
    };
    let wikiNetworkFrame = new NetworkFrame(wikiNetwork, wikiNetworkDrawSettings, false);
    bitonicSort(0, 16, DESCENDING, wikiNetwork, 0.1);

    let bulletPointSlideDrawSettings = {
        titleFont: '80px Arial',
        bulletFont: '60px Arial',
        titleStart: h * 0.1,
        bulletStartLeft: w * 0.1,
        bulletStartTop: h * 0.2,
        bulletOffset: 100,
        bullet: '•'
    };

    frames.push(combineFrames(wikiNetworkFrame, {
        draw: function(ctx) {
            ctx.font = bulletPointSlideDrawSettings.titleFont;
            let text = "Sorting Networks and Bitonic Merge Sort";
            fillTextCenter(text, h * 0.1, ctx);
        }
    }));

    // BIT OF PRACTICAL INFORMATION
    createBulletPointSlides('Practical Information', [
        // 'PhD student',
        'This will be recorded',
        'Some light participation'
    ], bulletPointSlideDrawSettings);
  
    let tinyExampleNetworkFrame1 = new NetworkFrame(new Network(3), {
        marginX: h * 0.05,
        marginY: h * 0.2,
        squareLength: h * 0.15, 
        squareOffset: h * 0.05, 
        wireLength: w - (2 * h * 0.05 + 2 * h * 0.15 + 2 * h * 0.05),
        squareBorderColor: '#000000', 
        lineWidth: 10, 
        circleRadius: 10, 
        tipLength: 20, 
        tipWidth: 15, 
        drawBox: false,        
        wireOverlayColor: function(value) {
            if (value == 0) {
                return 'rgba(0, 255, 0, 0.5)';
            } else if (value == 1) {
                return 'rgba(255, 0, 0, 0.5)';
            } else {
                return 'rgba(0, 0, 0, 0)';
            }
        }
    }, true);
    frames.push(tinyExampleNetworkFrame1);


    // I show them how it works 1
    let tinyExampleNetwork = new Network(3);
    tinyExampleNetwork.values[0] = 2
    tinyExampleNetwork.values[1] = 3
    tinyExampleNetwork.values[2] = 1
    let tinyExampleNetworkFrame = new NetworkFrame(tinyExampleNetwork, {
        marginX: h * 0.05,
        marginY: h * 0.2,
        squareLength: h * 0.15, 
        squareOffset: h * 0.05, 
        wireLength: w - (2 * h * 0.05 + 2 * h * 0.15 + 2 * h * 0.05),
        squareBorderColor: '#000000', 
        lineWidth: 10, 
        circleRadius: 10, 
        tipLength: 20, 
        tipWidth: 15, 
        drawBox: true,
        drawWireOverlay: true,
        wireOverlayColor: function(value) {
            if (value == 1) {
                return 'rgba(0, 255, 0, 0.5)';
            } else if (value == 2) {
                return 'rgba(0, 0, 255, 0.5)';
            } else {
                return 'rgba(255, 0, 0, 0.5)';
            }
        }
    }, true);
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
        drawBox: true,
        wireOverlayColor: function(value) {
            if (value == 0) {
                return 'rgba(0, 255, 0, 0.5)';
            } else if (value == 1) {
                return 'rgba(255, 0, 0, 0.5)';
            } else {
                return 'rgba(0, 0, 0, 0)';
            }
        }
    }, true);
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
        drawBox: false,
        wireOverlayColor: function(value) {
            if (value == 0) {
                return 'rgba(0, 255, 0, 0.5)';
            } else if (value == 1) {
                return 'rgba(255, 0, 0, 0.5)';
            } else {
                return 'rgba(0, 0, 0, 0)';
            }
        }
    }, true);
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
        drawBox: false,
        wireOverlayColor: function(value) {
            if (value == 0) {
                return 'rgba(0, 255, 0, 0.5)';
            } else if (value == 1) {
                return 'rgba(255, 0, 0, 0.5)';
            } else {
                return 'rgba(0, 0, 0, 0)';
            }
        },
        drawWireOverlay: true
    };
    let networkFrame = new NetworkFrame(network16, defaultNetworkDrawSettings, true);

    let greenOverlayFrame = new OverlayFrame({
        position: {x: w / 2, y: networkFrame.drawSettings.marginY},
        width: w * 0.45,
        height: calcHeightFromWires(networkFrame.drawSettings, 8) -
                networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(0, 1, 0, 0.5),
        fillColor: rgba(0, 1, 0, 0.5),
    });
    let redOverlayFrame = new OverlayFrame({
        position: {x: w / 2, y: networkFrame.drawSettings.marginY + calcHeightFromWires(networkFrame.drawSettings, 8.5) - 
                networkFrame.drawSettings.squareOffset},
        width: w * 0.45,
        height: calcHeightFromWires(networkFrame.drawSettings, 8) - 
                networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(1, 0, 0, 0.5),
        fillColor: rgba(1, 0, 0, 0.5),
    });

    let nullSequence = [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ];
    function drawCenterDashLine(ctx) {
        let y = networkFrame.drawSettings.marginY + 
                calcHeightFromWires(networkFrame.drawSettings, 8) - 
                networkFrame.drawSettings.squareOffset / 2 ;
        ctx.lineWidth = 3
        drawDashLine(networkFrame.drawSettings.marginX, y, 
                        w - networkFrame.drawSettings.marginX, y, [10, 10], ctx);

    }

    let resetValuesFrame = combineFrames(networkFrame, {
        draw: function() {},
        frameStart: function() {
            networkFrame.network.values = nullSequence;
            networkFrame.network.compareAndSwaps = new LinkedList();
        }
    })
    frames.push(resetValuesFrame);
    frames.push(combineFrames(greenOverlayFrame, resetValuesFrame));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, resetValuesFrame));

    // Insert merge box overlays
    let mergeBoxOverlays = [];
    let mergeBoxWidths = [0.075, 0.06, 0.05, 0.03];
    let mergeBoxFonts = [50, 40, 30, 13];
    let mergeBoxOverlayX = w / 2;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2**i; ++j) {
            let mergeBoxOverlayHeight = 16 / (2**i) * (defaultNetworkDrawSettings.squareLength + defaultNetworkDrawSettings.squareOffset);
            let mergeBoxOverlayY = defaultNetworkDrawSettings.marginY + j * mergeBoxOverlayHeight;
            let mergeBoxOverlay = new TextBoxOverlay("SPLIT", {
                position: {x: mergeBoxOverlayX, y: mergeBoxOverlayY },
                width: defaultNetworkDrawSettings.wireLength * mergeBoxWidths[i],
                height: mergeBoxOverlayHeight - defaultNetworkDrawSettings.squareOffset,
                fontSize: mergeBoxFonts[i],
                font: "Arial",
                strokeWidth: 3,
                drawVertical: true
            });        
            mergeBoxOverlays.push(mergeBoxOverlay);
        }
        mergeBoxOverlayX += defaultNetworkDrawSettings.wireLength * mergeBoxWidths[i] + defaultNetworkDrawSettings.wireLength / 12;

        frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, networkFrame, ...mergeBoxOverlays));
    }

    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, networkFrame, {
        draw: function() {},
        frameStart: function() {
            networkFrame.network.values = nullSequence;
            // Dirty trick to make sure the network is initialized
            if (network16.compareAndSwaps.size > 0) return 
            for (let i = 0; i < network16.size / 2; i++) {
                network16.addCompareAndSwap(0.5 + 0.01 * i, i, i + 8)    
            }
        }
    }));

    // Frames which do not sort correctly
    let failingSequence = [ 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1 ];
    for (let i = 0; i < failingSequence.length/2; i++) {
        frames.push(combineFrames(networkFrame, {
            draw: drawCenterDashLine,
            frameStart: function() {
                networkFrame.network.values = nullSequence.slice();
                for (let j = 0; j <= i; j++) {
                    networkFrame.network.values[j] = failingSequence[j];
                    networkFrame.network.values[j + 8] = failingSequence[j + 8];
                }
            }
        }));
    }

    // Example frames which do work
    // Already sorted 1 
    let sortedSequence1 = failingSequence.slice().sort((a, b) => a > b);
    frames.push(combineFrames(networkFrame, {
        draw: drawCenterDashLine, 
        frameStart: function() {
            networkFrame.network.values = sortedSequence1;
        }
    }));

    // Already sorted 2 
    let sortedSequence2 = failingSequence.slice().sort((a, b) => a < b);
    frames.push(combineFrames(networkFrame, {
        draw: drawCenterDashLine,
        frameStart: function() {
            networkFrame.network.values = sortedSequence2;
        }
    }));

    // Odd-even
    let oddEvenSequence = [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0];
    frames.push(combineFrames(networkFrame, {
        draw: drawCenterDashLine,
        frameStart: function() {
            networkFrame.network.values = oddEvenSequence;
        }
    }));

    // Bitonic 1
    let bitonicSequence1 = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    frames.push(combineFrames(networkFrame, {
        draw: drawCenterDashLine,
        frameStart: function() {
            networkFrame.network.values = bitonicSequence1;
        }
    }));

    // Bitonic 2
    let bitonicSequence2 = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0];
    let bitonic2Frame = combineFrames(networkFrame, {
        draw: drawCenterDashLine,
        frameStart: function() {
            networkFrame.network.values = bitonicSequence2;
        }
    });
    frames.push(bitonic2Frame);

    function calcHeightFromWires(drawSettings, count) {
        return count * (drawSettings.squareLength + drawSettings.squareOffset);
    }

    let blueOverlayX = networkFrame.drawSettings.marginX +
                        networkFrame.drawSettings.squareLength +
                        networkFrame.drawSettings.squareOffset;
    let blueOverlayFrame = new OverlayFrame({
        position: {x: blueOverlayX, y: networkFrame.drawSettings.marginY},
        width: w * 0.4,
        height: calcHeightFromWires(networkFrame.drawSettings, 8) - networkFrame.drawSettings.squareOffset / 2,
        strokeColor: rgba(0, 0, 1, 0.5),
        fillColor: rgba(0, 0, 1, 0.5),
    });
    frames.push(combineFrames(blueOverlayFrame, bitonic2Frame));

    let blueOverlayFrame2 = new OverlayFrame({
        position: {x: blueOverlayX, 
            y: networkFrame.drawSettings.marginY + 
            calcHeightFromWires(networkFrame.drawSettings, 8) -
            networkFrame.drawSettings.squareOffset / 2},
        width: w * 0.4,
        height: calcHeightFromWires(networkFrame.drawSettings, 8) - networkFrame.drawSettings.squareOffset / 2,
        strokeColor: rgba(0, 0, 1, 0.5),
        fillColor: rgba(0, 0, 1, 0.5),
    });
    frames.push(combineFrames(blueOverlayFrame2, bitonic2Frame));

    let whiteOverlayFrame = new OverlayFrame({
        position: {x: blueOverlayX, y: networkFrame.drawSettings.marginY},
        width: w * 0.4,
        height: calcHeightFromWires(networkFrame.drawSettings, 8) - 
                networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(0, 0, 0, 1),
        fillColor: rgba(1, 1, 1, 1),
    });

    // Insert merge box overlay
    let sortBoxOverlay1 = new TextBoxOverlay("SORT", {
        position: {
            x: defaultNetworkDrawSettings.marginX + defaultNetworkDrawSettings.squareLength + defaultNetworkDrawSettings.squareOffset, 
            y: defaultNetworkDrawSettings.marginY},
        width: defaultNetworkDrawSettings.wireLength / 2 - defaultNetworkDrawSettings.squareOffset,
        height: calcHeightFromWires(defaultNetworkDrawSettings, 8) - defaultNetworkDrawSettings.squareOffset,
        fontSize: 80,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: false
    });
    sortBoxOverlay1 = combineFrames(sortBoxOverlay1, {
        draw: function(ctx) {
            /// Draw Down arrow
            let overlay = sortBoxOverlay1.frames[0];
            let drawSettings = overlay.drawSettings;
            let height = drawSettings.height;
            ctx.lineWidth = 5
            ctx.textBaseline = 'top'
            ctx.font = `${drawSettings.fontSize}px ${drawSettings.font}`;

            let measure = ctx.measureText(overlay.text);
            let arrowHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10;
            let y = drawSettings.position.y + height / 2;
            let width = drawSettings.width;
            let x = drawSettings.position.x + width / 2 + measure.width / 2 + 20;

            drawVerticalArrow(x, y - arrowHeight / 2, arrowHeight, 20, 20, ctx)
        }
    });

    let sortBoxOverlay2 = new TextBoxOverlay("SORT", {
        position: {
            x: defaultNetworkDrawSettings.marginX +
                defaultNetworkDrawSettings.squareLength +
                defaultNetworkDrawSettings.squareOffset, 
            y: defaultNetworkDrawSettings.marginY +
                calcHeightFromWires(defaultNetworkDrawSettings, 8)},
        width: defaultNetworkDrawSettings.wireLength / 2 - defaultNetworkDrawSettings.squareOffset,
        height: calcHeightFromWires(defaultNetworkDrawSettings, 8) - defaultNetworkDrawSettings.squareOffset,
        fontSize: 80,
        font: "Arial",
        strokeWidth: 3,
        drawVertical: false
    });
    sortBoxOverlay2 = combineFrames(sortBoxOverlay2, {
        draw: function(ctx) {
            /// Draw Up arrow
            let overlay = sortBoxOverlay2.frames[0];
            let drawSettings = overlay.drawSettings;
            let height = drawSettings.height;
            ctx.lineWidth = 5
            ctx.textBaseline = 'top'
            ctx.font = `${drawSettings.fontSize}px ${drawSettings.font}`;

            let measure = ctx.measureText(overlay.text);
            let arrowHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10;
            let y = drawSettings.position.y + height / 2;
            let width = drawSettings.width;
            let x = drawSettings.position.x + width / 2 + measure.width / 2 + 20;

            drawVerticalArrow(x, y + arrowHeight / 2, -arrowHeight, 20, 20, ctx)        }
    });



    frames.push(combineFrames(bitonic2Frame, sortBoxOverlay1));

    let whiteOverlayFrame2 = new OverlayFrame({
        position: {x: blueOverlayX, 
            y: networkFrame.drawSettings.marginY + 
            calcHeightFromWires(networkFrame.drawSettings, 8) -
            networkFrame.drawSettings.squareOffset / 2 + 
            networkFrame.drawSettings.squareOffset * 0.5
         },
        width: w * 0.4,
        height: calcHeightFromWires(networkFrame.drawSettings, 8) - networkFrame.drawSettings.squareOffset,
        strokeColor: rgba(0, 0, 0, 1),
        fillColor: rgba(1, 1, 1, 1),
    });

    frames.push(combineFrames(frames[frames.length-1], sortBoxOverlay2))

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

    // values = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    // values3 = values; 

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
    }));


    let empty16NetworkFrame = new NetworkFrame(
        new Network(16),
        defaultNetworkDrawSettings,
        false
    );

    frames.push(empty16NetworkFrame);
    frames.push(combineFrames(greenOverlayFrame, empty16NetworkFrame));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, empty16NetworkFrame));
    // frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, networkFrame));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, empty16NetworkFrame, ...mergeBoxOverlays.slice(0, 1)));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, empty16NetworkFrame, ...mergeBoxOverlays.slice(0, 3)));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, empty16NetworkFrame, ...mergeBoxOverlays.slice(0, 7)));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, empty16NetworkFrame, ...mergeBoxOverlays.slice(0, 15)));
    // frames.push(combineFrames(empty16NetworkFrame, greenOverlayFrame, redOverlayFrame, sortBoxOverlay1));
    // frames.push(combineFrames(empty16NetworkFrame, greenOverlayFrame, redOverlayFrame, sortBoxOverlay1, sortBoxOverlay2));

    let bitonicMergeNetwork = new NetworkFrame(new Network(16), {
        ...defaultNetworkDrawSettings,
        drawWireOverlay: true
    }, false);


    // bitonicMergeNetwork.network.values[0] = 0

    for (let i = 0; i < 8; i++) {
        bitonicMergeNetwork.network.addCompareAndSwap(0.5 + 0.01 * i, i, i + 8)    
    }

    let start = 0.67
    for (let i = 0; i < 4; i++) {
        bitonicMergeNetwork.network.addCompareAndSwap(start + 0.01 * i, i, i + 4)    
        bitonicMergeNetwork.network.addCompareAndSwap(start + 0.01 * i, i + 8 , i + 12)    
    }
    start = 0.81
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 16; j += 4) {
            bitonicMergeNetwork.network.addCompareAndSwap(start + 0.01 * i, i + j, i + j + 2)    
        }
    }
    start = 0.95
    for (let i = 0; i < 16; i += 2) {
        bitonicMergeNetwork.network.addCompareAndSwap(start, i, i + 1)    
    }

    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, bitonicMergeNetwork, ...mergeBoxOverlays.slice(1, 15)));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, bitonicMergeNetwork, ...mergeBoxOverlays.slice(3, 15)));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, bitonicMergeNetwork, ...mergeBoxOverlays.slice(7, 15)));
    frames.push(combineFrames(greenOverlayFrame, redOverlayFrame, bitonicMergeNetwork));

    frames.push(combineFrames(bitonicMergeNetwork, sortBoxOverlay1, sortBoxOverlay2));

    let recOverlay = [];
    for (let i = 0; i < 4; i++) {
        let sortBoxOverlay = new TextBoxOverlay("SORT", {
            position: {
                x: defaultNetworkDrawSettings.marginX + defaultNetworkDrawSettings.squareLength + defaultNetworkDrawSettings.squareOffset, 
                y: defaultNetworkDrawSettings.marginY + 
                calcHeightFromWires(defaultNetworkDrawSettings, 4) * i},
            width: defaultNetworkDrawSettings.wireLength / 4 - defaultNetworkDrawSettings.squareOffset,
            height: calcHeightFromWires(defaultNetworkDrawSettings, 4) - defaultNetworkDrawSettings.squareOffset,
            fontSize: 60,
            font: "Arial",
            strokeWidth: 3,
            drawVertical: false
        });
        sortBoxOverlay = combineFrames(sortBoxOverlay, {
            draw: function(ctx) {
                /// Draw Down arrow
                let overlay = sortBoxOverlay.frames[0];
                let drawSettings = overlay.drawSettings;
                let height = drawSettings.height;
                ctx.lineWidth = 5
                ctx.textBaseline = 'top'
                ctx.font = `${drawSettings.fontSize}px ${drawSettings.font}`;

                let measure = ctx.measureText(overlay.text);
                let arrowHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10;
                let y = drawSettings.position.y + height / 2;
                let width = drawSettings.width;
                let x = drawSettings.position.x + width / 2 + measure.width / 2 + 20;

                let direction = i % 2 == 1;
                if (direction == 0) {
                    drawVerticalArrow(x, y - arrowHeight / 2, arrowHeight, 20, 20, ctx)
                } else {
                    drawVerticalArrow(x, y + arrowHeight / 2, -arrowHeight, 20, 20, ctx)
                }
            }
        });
        recOverlay.push(sortBoxOverlay);
    }
    for (let i = 0; i < 2; i++) {
        let mergeBoxOverlay = new TextBoxOverlay("MERGE", {
            position: {
                x: defaultNetworkDrawSettings.marginX + defaultNetworkDrawSettings.squareLength + defaultNetworkDrawSettings.squareOffset +
                    defaultNetworkDrawSettings.wireLength / 4, 
                y: defaultNetworkDrawSettings.marginY + 
                calcHeightFromWires(defaultNetworkDrawSettings, 8) * i},
            width: defaultNetworkDrawSettings.wireLength / 4 - defaultNetworkDrawSettings.squareOffset,
            height: calcHeightFromWires(defaultNetworkDrawSettings, 8) - defaultNetworkDrawSettings.squareOffset,
            fontSize: 60,
            font: "Arial",
            strokeWidth: 3,
            drawVertical: false
        });
        mergeBoxOverlay = combineFrames(mergeBoxOverlay, {
            draw: function(ctx) {
                /// Draw Down arrow
                let overlay = mergeBoxOverlay.frames[0];
                let drawSettings = overlay.drawSettings;
                let height = drawSettings.height;
                ctx.lineWidth = 5
                ctx.textBaseline = 'top'
                ctx.font = `${drawSettings.fontSize}px ${drawSettings.font}`;

                let measure = ctx.measureText(overlay.text);
                let arrowHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10;
                let y = drawSettings.position.y + height / 2;
                let width = drawSettings.width;
                let x = drawSettings.position.x + width / 2 + measure.width / 2 + 20;

                let direction = i % 2 == 1;
                if (direction == 0) {
                    drawVerticalArrow(x, y - arrowHeight / 2, arrowHeight, 20, 20, ctx)
                } else {
                    drawVerticalArrow(x, y + arrowHeight / 2, -arrowHeight, 20, 20, ctx)
                }
            }
        });        
        recOverlay.push(mergeBoxOverlay);
    }

    frames.push(combineFrames(bitonicMergeNetwork, ...recOverlay));

    let bitonicMergeNetwork2 = new NetworkFrame(new Network(16), defaultNetworkDrawSettings, false);

    for (let i = 0; i < 8; i++) {
        bitonicMergeNetwork2.network.addCompareAndSwap(0.5 + 0.01 * i, i, i + 8)    
    }
    start = 0.67
    for (let i = 0; i < 4; i++) {
        bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i, i + 4)    
        bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i + 8 , i + 12)    
    }
    start = 0.81
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 16; j += 4) {
            bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i + j, i + j + 2)    
        }
    }
    start = 0.95
    for (let i = 0; i < 16; i += 2) {
        bitonicMergeNetwork2.network.addCompareAndSwap(start, i, i + 1)    
    }

    // Left
    start = 0.28
    for (let i = 0; i < 4; i++) {
        bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i, i + 4)    
        bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i + 12 , i + 8)    
    }
    start = 0.36
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 8; j += 4) {
            bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i + j, i + j + 2)    
            bitonicMergeNetwork2.network.addCompareAndSwap(start + 0.01 * i, i + j + 10, i + j + 8)    
        }
    }
    start = 0.44
    for (let i = 0; i < 8; i += 2) {
        bitonicMergeNetwork2.network.addCompareAndSwap(start, i, i + 1)
        bitonicMergeNetwork2.network.addCompareAndSwap(start, i+9, i + 8)
    }

    bitonicSort(0, 4, DESCENDING, bitonicMergeNetwork2.network, 0.05);
    bitonicSort(4, 4, ASCENDING, bitonicMergeNetwork2.network, 0.05);
    bitonicSort(8, 4, DESCENDING, bitonicMergeNetwork2.network, 0.05);
    bitonicSort(12, 4, ASCENDING, bitonicMergeNetwork2.network, 0.05);


    frames.push(combineFrames(bitonicMergeNetwork2, ...recOverlay.slice(0, 4)));
    frames.push(bitonicMergeNetwork2);

    //// -----------------  CODE SLIDES  -----------------------
    let bitonicMergeNetwork3 = new NetworkFrame(new Network(8), {
        ...defaultNetworkDrawSettings,
        wireLength: defaultNetworkDrawSettings.wireLength / 2,
        marginX: w * 0.025
    }, false);

    let textPositionTuples = [
        ["BitonicSort(a, start, n, dir):", w/2 + w * 0.05, h*0.1],
        ["if n == 1: return", w/2 + w * 0.075, h*0.15],
        ["BitonicSort(a, start, n/2, ASC)", w / 2 + w * 0.075, h * 0.25],
        ["BitonicSort(a, start + n/2, n/2, DESC)", w / 2 + w * 0.075, h * 0.3],
        ["BitonicMerge(a, start, n, dir)", w / 2 + w * 0.075, h * 0.35],
        ["BitonicMerge(a, start, n, dir):", w / 2 + w * 0.05, h * 0.5],
        ["if n == 1: return", w / 2 + w * 0.075, h * 0.55],
        ["for i in range(start, start + n/2):", w / 2 + w * 0.075, h * 0.65],
        ["CompareAndSwap(a, i, i+n/2, dir)", w / 2 + w * 0.1, h * 0.70],
        ["BitonicMerge(a, start, n/2, dir)", w / 2 + w * 0.075, h * 0.8],
        ["BitonicMerge(a, start + n/2, n/2, dir)", w / 2 + w * 0.075, h * 0.85]
    ];
    let codeDrawCalls =  textPositionTuples.map(t => {
        let [text, x, y] = t;
        return {draw: function(ctx) {
            ctx.font = "40px Arial"
            ctx.fillText(text, x, y);
        }};
    });
    for (let i = 0; i <= codeDrawCalls.length; i++) {
        frames.push(combineFrames(bitonicMergeNetwork3, ...recOverlay.slice(0, 2), recOverlay[4], ...codeDrawCalls.slice(0, i)))
    }
    // TODO: Add diagram for Bitonic merge to code slides


    /// -------------- ANALYSIS SLIDES -------------------
    /// Highligh tree structure of merge/sort calls

    let bigMergeBoxes = [
        new TextBoxOverlay("MERGING", {
            position: {
                x: wikiNetworkDrawSettings.marginX +
                    wikiNetworkDrawSettings.squareLength +
                    wikiNetworkDrawSettings.squareOffset + 
                    wikiNetworkDrawSettings.wireLength * 0.6, 
                y: wikiNetworkDrawSettings.marginY - wikiNetworkDrawSettings.squareOffset / 2
            },
            width: wikiNetworkDrawSettings.wireLength * 0.4,
            height: calcHeightFromWires(wikiNetworkDrawSettings, 16),
            fontSize: 80,
            font: "Arial",
            strokeWidth: 3,
            drawVertical: false
        })]
    for (let i = 0; i < 2; i++) {
        bigMergeBoxes.push(
            new TextBoxOverlay("MERGING", {
                position: {
                    x: wikiNetworkDrawSettings.marginX +
                        wikiNetworkDrawSettings.squareLength +
                        wikiNetworkDrawSettings.squareOffset + 
                        wikiNetworkDrawSettings.wireLength * 0.33, 
                    y: wikiNetworkDrawSettings.marginY - wikiNetworkDrawSettings.squareOffset / 4 + calcHeightFromWires(wikiNetworkDrawSettings, 8) * i
                },
                width: wikiNetworkDrawSettings.wireLength * 0.2,
                height: calcHeightFromWires(wikiNetworkDrawSettings, 8) - wikiNetworkDrawSettings.squareOffset / 2,
                fontSize: 60,
                font: "Arial",
                strokeWidth: 3,
                drawVertical: false
            })
        );
    }
    for (let i = 0; i < 4; i++) {
        bigMergeBoxes.push(
            new TextBoxOverlay("MERGING", {
                position: {
                    x: wikiNetworkDrawSettings.marginX +
                        wikiNetworkDrawSettings.squareLength +
                        wikiNetworkDrawSettings.squareOffset + 
                        wikiNetworkDrawSettings.wireLength * 0.165, 
                    y: wikiNetworkDrawSettings.marginY - wikiNetworkDrawSettings.squareOffset / 4 + calcHeightFromWires(wikiNetworkDrawSettings, 4) * i
                },
                width: wikiNetworkDrawSettings.wireLength * 0.1,
                height: calcHeightFromWires(wikiNetworkDrawSettings, 4) - wikiNetworkDrawSettings.squareOffset / 2,
                fontSize: 30,
                font: "Arial",
                strokeWidth: 3,
                drawVertical: false
            })
        );
    }
    for (let i = 0; i < 8; i++) {
        bigMergeBoxes.push(
            new TextBoxOverlay("MERGING", {
                position: {
                    x: wikiNetworkDrawSettings.marginX +
                        wikiNetworkDrawSettings.squareLength +
                        wikiNetworkDrawSettings.squareOffset + 
                        wikiNetworkDrawSettings.wireLength * 0.075, 
                    y: wikiNetworkDrawSettings.marginY - wikiNetworkDrawSettings.squareOffset / 4 + calcHeightFromWires(wikiNetworkDrawSettings, 2) * i
                },
                width: wikiNetworkDrawSettings.wireLength * 0.05,
                height: calcHeightFromWires(wikiNetworkDrawSettings, 2) - wikiNetworkDrawSettings.squareOffset / 2,
                fontSize: 15,
                font: "Arial",
                strokeWidth: 3,
                drawVertical: false
            })
        );
    }
    frames.push(wikiNetworkFrame);
    for (let i = 1; i <= 4; i++) {
        frames.push(combineFrames(wikiNetworkFrame, ...bigMergeBoxes.slice(0, 2**i - 1)));
    }

    let mergeBoxArrows = {
        draw: function(ctx) {
            /// Draw left arrows 
            ctx.lineWidth = 5

            let x = bigMergeBoxes[0].left();
            let rightX = bigMergeBoxes[1].right();
            let width = rightX - x;
            for (let i = 0; i < 2; i++) {
                let y = bigMergeBoxes[0].top() + 
                            calcHeightFromWires(wikiNetworkDrawSettings, 4) +
                            calcHeightFromWires(wikiNetworkDrawSettings, 8) *  i;
                drawHorizontalArrow(x, y, width, 25, 20, ctx);
            }

            x = bigMergeBoxes[1].left();
            rightX = bigMergeBoxes[3].right();
            width = rightX - x;
            for (let i = 0; i < 4; i++) {
                let y = bigMergeBoxes[0].top() + 
                            calcHeightFromWires(wikiNetworkDrawSettings, 2) +
                            calcHeightFromWires(wikiNetworkDrawSettings, 4) *  i;
                drawHorizontalArrow(x, y, width, 25, 20, ctx);
            }

            x = bigMergeBoxes[3].left();
            rightX = bigMergeBoxes[7].right();
            width = rightX - x;
            for (let i = 0; i < 8; i++) {
                let y = bigMergeBoxes[0].top() + 
                            calcHeightFromWires(wikiNetworkDrawSettings, 1) +
                            calcHeightFromWires(wikiNetworkDrawSettings, 2) *  i;
                drawHorizontalArrow(x, y, width, 25, 20, ctx);
            }
        }
    }

    frames.push(combineFrames(...bigMergeBoxes.slice(0, 2**4 - 1), mergeBoxArrows));

    frames.push(combineFrames(wikiNetworkFrame, {
        draw: function(ctx) {
         //    
         ctx.clearRect(0, 0, bigMergeBoxes[0].left(), h);
        }
    }, ...bigMergeBoxes.slice(1), mergeBoxArrows, {
        draw: function(ctx) {
            let x = bigMergeBoxes[0].left();
            let y = bigMergeBoxes[0].top();
            let width = bigMergeBoxes[0].drawSettings.width
            let height = bigMergeBoxes[0].drawSettings.height
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.strokeRect(x, y, width, height);
        }
    }));

    let wikiMergeBoxOverlays = [];
    let wikiMergeBoxWidths = [0.09, 0.06, 0.035, 0.025];
    let wikiMergeBoxFonts = [50, 40, 30, 13];
    let wikiMergeBoxOverlayX = bigMergeBoxes[0].left() + w / 50;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2**i; ++j) {
            let overlayHeight = calcHeightFromWires(wikiNetworkDrawSettings, 16 / (2**i));
            let mergeBoxOverlayY = bigMergeBoxes[0].top() + j * overlayHeight + wikiNetworkDrawSettings.squareOffset / 8;
            let mergeBoxOverlay = new TextBoxOverlay("SPLIT", {
                position: {x: wikiMergeBoxOverlayX, y: mergeBoxOverlayY },
                width: wikiNetworkDrawSettings.wireLength * wikiMergeBoxWidths[i],
                height: overlayHeight - wikiNetworkDrawSettings.squareOffset /4,
                fontSize: wikiMergeBoxFonts[i],
                font: "Arial",
                strokeWidth: 3,
                drawVertical: true
            });        
            wikiMergeBoxOverlays.push(mergeBoxOverlay);
        }
        wikiMergeBoxOverlayX += wikiNetworkDrawSettings.wireLength * wikiMergeBoxWidths[i] + wikiNetworkDrawSettings.wireLength / 30;
    }

    frames.push(combineFrames(wikiNetworkFrame, {
        draw: function(ctx) {
            ctx.clearRect(0, 0, bigMergeBoxes[0].left(), h);
        }
    }, ...bigMergeBoxes.slice(1), mergeBoxArrows, {
        draw: function(ctx) {
            let x = bigMergeBoxes[0].left();
            let y = bigMergeBoxes[0].top();
            let width = bigMergeBoxes[0].drawSettings.width
            let height = bigMergeBoxes[0].drawSettings.height
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.strokeRect(x, y, width, height);
        }
    }, ...wikiMergeBoxOverlays));

    let innerMergeBoxArrows = {
        draw: function(ctx) {
            /// Draw left arrows 
            ctx.lineWidth = 5

            let x = wikiMergeBoxOverlays[0].right();
            let rightX = wikiMergeBoxOverlays[1].left();
            let width = rightX - x;
            for (let i = 0; i < 2; i++) {
                let y = wikiMergeBoxOverlays[i+1].top() + 
                        wikiMergeBoxOverlays[i+1].drawSettings.height / 2;
                drawHorizontalArrow(x, y, width, 25, 20, ctx);
            }

            x = wikiMergeBoxOverlays[1].right();
            rightX = wikiMergeBoxOverlays[3].left();
            width = rightX - x;
            for (let i = 0; i < 4; i++) {
                let y = wikiMergeBoxOverlays[i+3].top() + 
                        wikiMergeBoxOverlays[i+3].drawSettings.height / 2;
                drawHorizontalArrow(x, y, width, 25, 20, ctx);
            }

            x = wikiMergeBoxOverlays[3].right();
            rightX = wikiMergeBoxOverlays[7].left();
            width = rightX - x;
            for (let i = 0; i < 8; i++) {
                let y = wikiMergeBoxOverlays[i+7].top() + 
                        wikiMergeBoxOverlays[i+7].drawSettings.height / 2;
                drawHorizontalArrow(x, y, width, 25, 20, ctx);
            }
        }
    }

    frames.push(combineFrames( {
        draw: function(ctx) {
            ctx.clearRect(0, 0, bigMergeBoxes[0].left(), h);
        }
    }, ...bigMergeBoxes.slice(1), mergeBoxArrows, {
        draw: function(ctx) {
            let x = bigMergeBoxes[0].left();
            let y = bigMergeBoxes[0].top();
            let width = bigMergeBoxes[0].drawSettings.width
            let height = bigMergeBoxes[0].drawSettings.height
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.strokeRect(x, y, width, height);
        }
    }, ...wikiMergeBoxOverlays, innerMergeBoxArrows));

    // TODO SLIDE ON THE AMOUNT OF WORK

    /// -------------- SLIDES ON WHY SORTING NETWORKS ---------------------
    createBulletPointSlides('Why Sorting Networks?', [
        'Data Oblivousness / Privacy',
        'Parallelism / GPU Sorting',
        'Circuits'
    ], bulletPointSlideDrawSettings);

    /// -------------- END OF SLIDES ----------------------
    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(draw);
}