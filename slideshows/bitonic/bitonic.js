"use strict";
const FLOATING_POINT_ERROR_MARGIN = 0.000001; // TODO: Figure out if there exists some better constant. It probably depends on the precision.

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const state = initializeSlideshowState();
    const slides = state.slides;
    initializeSlideshowEventListeners(canvas, state);
    let w = canvas.width;
    let h = canvas.height;
    let generalDrawSettings = {
        green: 'rgba(54, 174, 124, 0.5)',
        red: 'rgba(235, 83, 83, 0.5)',
        blue: 'rgba(24, 116, 152, 0.8)',
        yellow: 'rgba(249, 217, 35, 0.8)',
        grey: 'rgba(100, 100, 100, 0.5)'
    };

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
                return `rgba(0, ${lerp(255, 50, t / 2)}, 0, 1)`;
            } else {
                return `rgba(${lerp(50, 255, t * 2)}, 0, 0, 1)`;
            }
        },
        drawWireOverlay: false
    };
    let wikiNetworkSlide = new NetworkFrame(wikiNetwork, wikiNetworkDrawSettings, false);
    bitonicSort(0, 16, DESCENDING, wikiNetwork, 0.1);

    let bulletPointSlideDrawSettings = {
        titleFont: '80px Arial',
        bulletFont: '60px Arial',
        titleStart: h * 0.1,
        bulletStartLeft: w * 0.1,
        bulletStartTop: h * 0.25,
        bulletOffset: 120,
        bullet: '•',
        bulletByBullet: false
    };

    slides.push(combineSlides(wikiNetworkSlide, {
        draw: function(ctx) {
            ctx.font = bulletPointSlideDrawSettings.titleFont;
            let text = "Sorting Networks and Bitonic Merge Sort";
            fillTextCanvasCenter(ctx, text, h * 0.1);
        }
    }));

    // BIT OF PRACTICAL INFORMATION
    slides.push.apply(slides, 
        createBulletPointSlides('Practical Information', [
            // 'PhD student',
            'This will be recorded',
            'I hope for some light participation',
            'This is not about Priority Queues!'
        ], bulletPointSlideDrawSettings)
    );
  
    let tinyExampleNetwork = new Network(3);
    tinyExampleNetwork.values[0] = 2
    tinyExampleNetwork.values[1] = 3
    tinyExampleNetwork.values[2] = 1
    let tinyExampleNetworkDrawSettings = {
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
            if (value == 1) {
                return generalDrawSettings.green;
            } else if (value == 2) {
                return generalDrawSettings.blue;
            } else if (value == 3){
                return generalDrawSettings.red;
            }
        }
    }
    let tinyExampleNetworkSlide = new NetworkFrame(tinyExampleNetwork, tinyExampleNetworkDrawSettings, true);
    let tinyExampleTitle = "Sorting Networks - Wires, Arrows & Sorting";

    // I show them how it works 1
    slides.push(combineSlides(tinyExampleNetworkSlide, {
        draw: function(ctx) {
            ctx.font = bulletPointSlideDrawSettings.titleFont;
            fillTextCanvasCenter(ctx, tinyExampleTitle, bulletPointSlideDrawSettings.titleStart);
        }, 
        slideStart: function() {
            tinyExampleNetworkSlide.drawSettings.drawBox = true;
            tinyExampleNetworkSlide.drawSettings.drawWireOverlay = false;
        }
    }));

    /// -------------- SLIDES ON WHY SORTING NETWORKS ---------------------
    slides.push.apply(slides, 
        createBulletPointSlides('Why Sorting Networks?', [
            'Data Oblivousness / Privacy',
            'Circuits (Switching Networks, FPGA)',
            'Parallelism / GPU Sorting',
        ], bulletPointSlideDrawSettings)
    );

    // Let them do it
    let selfExampleNetwork = new Network(5);
    let selfExampleNetworkSlide = new NetworkFrame(selfExampleNetwork, {
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
            switch (Number(value)) {
                case 1:
                    return '#fee0f9';
                case 2:
                    return '#f1dafb';
                case 3:
                    return '#e4d3fc';
                case 4:
                    return '#d7cdfe';
                case 5:
                    return '#cac7ff';
                case 6:
                    return '#c095e4';
                default:
                    return 'rgba(0, 0, 0, 0)';
            }
            
        }
    }, true);
    slides.push(selfExampleNetworkSlide);

    // Bubble sort
    let bubbleExampleNetwork = new Network(6);
    let bubbleExampleNetworkSlide = new NetworkFrame(bubbleExampleNetwork, {
        ...selfExampleNetworkSlide.drawSettings,
        squareOffset: h * 0.005,
        drawBox: false
    }, true);
    slides.push(bubbleExampleNetworkSlide);

    slides.push.apply(slides, 
        createBulletPointSlides('Mini Recap', [
            'Sorting Networks',
            'Wires',
            'Compare-and-Swaps',
            'Span & Work'
        ], bulletPointSlideDrawSettings)
    );

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
                return generalDrawSettings.green;
            } else if (value == 1) {
                return generalDrawSettings.red;
            } else {
                return 'rgba(0, 0, 0, 0)';
            }
        },
        drawWireOverlay: true
    };
    let networkSlide = new NetworkFrame(network16, defaultNetworkDrawSettings, true);

    let greenOverlaySlide = new OverlayFrame({
        position: {x: w / 2, y: networkSlide.drawSettings.marginY},
        width: w * 0.45,
        height: calcHeightFromWires(networkSlide.drawSettings, 8) -
                networkSlide.drawSettings.squareOffset,
        strokeColor: generalDrawSettings.green,
        fillColor: generalDrawSettings.green
    });
    let redOverlaySlide = new OverlayFrame({
        position: {x: w / 2, y: networkSlide.drawSettings.marginY + calcHeightFromWires(networkSlide.drawSettings, 8.5) - 
                networkSlide.drawSettings.squareOffset},
        width: w * 0.45,
        height: calcHeightFromWires(networkSlide.drawSettings, 8) - 
                networkSlide.drawSettings.squareOffset,
        strokeColor: generalDrawSettings.red,
        fillColor: generalDrawSettings.red
    });

    let nullSequence = [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ];
    function drawCenterDashLine(ctx) {
        let y = networkSlide.drawSettings.marginY + 
                calcHeightFromWires(networkSlide.drawSettings, 8) - 
                networkSlide.drawSettings.squareOffset / 2 ;
        ctx.lineWidth = 3
        drawDashLine(networkSlide.drawSettings.marginX, y, 
                        w - networkSlide.drawSettings.marginX, y, [10, 10], ctx);

    }

    let resetValuesSlide = combineSlides(networkSlide, {
        draw: function() {},
        slideStart: function() {
            networkSlide.network.values = nullSequence;
            networkSlide.network.compareAndSwaps = new LinkedList();
        }
    })
    slides.push(resetValuesSlide);

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

        slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, networkSlide, ...mergeBoxOverlays));
    }

    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, networkSlide, {
        draw: function() {},
        slideStart: function() {
            networkSlide.network.values = nullSequence;
        }
    }));

    // Slides which do not sort correctly
    let failingSequence = [ 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1 ];
    for (let i = 0; i < failingSequence.length/2; i++) {
        slides.push(combineSlides(networkSlide, {
            draw: drawCenterDashLine,
            slideStart: function() {
                networkSlide.network.values = nullSequence.slice();
                for (let j = 0; j <= i; j++) {
                    networkSlide.network.values[j] = failingSequence[j];
                    networkSlide.network.values[j + 8] = failingSequence[j + 8];
                }
            }
        }));
    }

    // Example slides which do work
    // Already sorted 1 
    let sortedSequence1 = failingSequence.slice().sort((a, b) => a > b);
    slides.push(combineSlides(networkSlide, {
        draw: drawCenterDashLine, 
        slideStart: function() {
            networkSlide.network.values = sortedSequence1;
        }
    }));

    // Already sorted 2 
    let sortedSequence2 = failingSequence.slice().sort((a, b) => a < b);
    slides.push(combineSlides(networkSlide, {
        draw: drawCenterDashLine,
        slideStart: function() {
            networkSlide.network.values = sortedSequence2;
        }
    }));

    // Odd-even
    // let oddEvenSequence = [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0];

    // Bitonic 1
    let bitonicSequence1 = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    slides.push(combineSlides(networkSlide, {
        draw: drawCenterDashLine,
        slideStart: function() {
            networkSlide.network.values = bitonicSequence1;
        }
    }));

    // Bitonic 2
    let bitonicSequence2 = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0];
    let bitonic2Slide = combineSlides(networkSlide, {
        draw: drawCenterDashLine,
        slideStart: function() {
            networkSlide.network.values = bitonicSequence2;
        }
    });
    slides.push(bitonic2Slide);

    function calcHeightFromWires(drawSettings, count) {
        return count * (drawSettings.squareLength + drawSettings.squareOffset);
    }

    slides.push(combineSlides(bitonic2Slide, {
        draw: function(ctx) {
            let x = networkSlide.drawSettings.marginX +
                                networkSlide.drawSettings.squareLength +
                                networkSlide.drawSettings.squareOffset;
            let width= defaultNetworkDrawSettings.wireLength / 2 - defaultNetworkDrawSettings.squareOffset;
            let height= calcHeightFromWires(networkSlide.drawSettings, 8) - networkSlide.drawSettings.squareOffset;
            ctx.lineWidth = 5;
            // ctx.strokeStyle = generalDrawSettings.blue;
            ctx.strokeStyle = '#000000' //generalDrawSettings.blue;
            ctx.strokeRect(x, networkSlide.drawSettings.marginY, width, height);
        }
    }));

    slides.push(combineSlides(bitonic2Slide, {
        draw: function(ctx) {
            let x = networkSlide.drawSettings.marginX +
                                networkSlide.drawSettings.squareLength +
                                networkSlide.drawSettings.squareOffset;
            let y = networkSlide.drawSettings.marginY + calcHeightFromWires(networkSlide.drawSettings, 8);
            let width= defaultNetworkDrawSettings.wireLength / 2 - defaultNetworkDrawSettings.squareOffset;
            let height= calcHeightFromWires(networkSlide.drawSettings, 8) - networkSlide.drawSettings.squareOffset;
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#000000' //generalDrawSettings.blue;
            ctx.strokeRect(x, y, width, height);
        }
    }));

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
    sortBoxOverlay1 = addTextOverlayArrow(sortBoxOverlay1, DIRECTION_DOWN);
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
    sortBoxOverlay2 = addTextOverlayArrow(sortBoxOverlay2, DIRECTION_UP);

    slides.push(combineSlides(bitonic2Slide, sortBoxOverlay1));
    slides.push(combineSlides(slides[slides.length-1], sortBoxOverlay2))

    // -------------- Beginning of boxplot sorting slides -----------------------
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
        startColor: generalDrawSettings.green, 
        endColor: generalDrawSettings.red, 
        drawHorizontal: false
    };

    let values = [1, 2, 3, 7, 9, 12, 13, 15, 16, 14, 11, 10, 8, 6, 5, 4]
    // values = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    values = addCasSlides(0, values.length / 2, boxPlotDrawSettings, values)

    // Boxed 4 biggest on left
    let boxplotSlide = new BoxplotFrame(values, boxPlotDrawSettings);
    let c = combineSlides(boxplotSlide, {
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
    slides.push(c);


    function addCasSlides(start, step, drawSettings, values) {
        slides.push(new BoxplotFrame(values, drawSettings));
        for (let i = start; i < start + step; ++i) {
            let slide = new BoxplotFrame(values, drawSettings);
            let c = combineSlides(slide, {
                vals: values.slice(),
                step,
                draw: function(ctx) {
                    let values = this.vals;
                    ctx.lineWidth = 5
                    drawCasBox(i, this.step, values, drawSettings, ctx);
                
                    let dashX = drawSettings.marginX - drawSettings.boxOffset / 2 + (drawSettings.width * (start + this.step) / values.length);
                    drawDashLine(dashX, 30, dashX, 860, [10, 10], ctx);
            }});
            slides.push(c);

            values = values.slice();
            if (values[i] > values[i + step]) {
                let tmp = values[i];
                values[i] = values[i + step];
                values[i + step] = tmp;
            }

            slide = new BoxplotFrame(values, drawSettings);
            c = combineSlides(slide, {
                vals: values.slice(),
                step,
                draw: function(ctx) {
                    let values = this.vals;
                    ctx.lineWidth = 5
                    drawCasBox(i, this.step, values, drawSettings, ctx);
                
                    let dashX = drawSettings.marginX - drawSettings.boxOffset / 2 + (drawSettings.width * (start + this.step) / values.length);
                    drawDashLine(dashX, 30, dashX, 860, [10, 10], ctx);
            }});
            slides.push(c);
        }
        return values;
    }

    values = values.slice();
    function addCasSlidesRec(start, n, drawSettings, values) {
        drawSettings = {
            ...drawSettings,
            color: function(i, values, ctx) {
                let c = generalDrawSettings.grey;
                if (i < start + n && i >= start) { // The range we are sorting
                    if (values[i] <= start + n / 2) { // The lower half of the range
                        c = generalDrawSettings.green;
                    } else {
                        c = generalDrawSettings.red;
                    }
                }             
                ctx.fillStyle = c; 
            },
        }

        if (n != 16) { // Special case, we ignore 16 since we have already added it
            values = addCasSlides(start, n / 2, drawSettings, values);
        }

        if (n > 2) {
            values = addCasSlidesRec(start, n / 2, drawSettings, values);
            values = addCasSlidesRec(start + n / 2, n / 2, drawSettings, values);

        }
        return values;
    }

    values = addCasSlidesRec(0, 16, boxPlotDrawSettings, values)
    slides.push(new BoxplotFrame(values, {
        ...boxPlotDrawSettings,
        color: function(i, values, ctx) {
            ctx.fillStyle = generalDrawSettings.green; 
        }
    }));


    let empty16NetworkSlides = new NetworkFrame(
        new Network(16),
        defaultNetworkDrawSettings,
        false
    );

    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, empty16NetworkSlides, ...mergeBoxOverlays.slice(0, 1)));
    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, empty16NetworkSlides, ...mergeBoxOverlays.slice(0, 3)));
    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, empty16NetworkSlides, ...mergeBoxOverlays.slice(0, 7)));
    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, empty16NetworkSlides, ...mergeBoxOverlays.slice(0, 15)));

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

    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, bitonicMergeNetwork, ...mergeBoxOverlays.slice(1, 15)));
    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, bitonicMergeNetwork, ...mergeBoxOverlays.slice(3, 15)));
    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, bitonicMergeNetwork, ...mergeBoxOverlays.slice(7, 15)));
    slides.push(combineSlides(greenOverlaySlide, redOverlaySlide, bitonicMergeNetwork));

    slides.push(combineSlides(bitonicMergeNetwork, sortBoxOverlay1, sortBoxOverlay2));

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
        recOverlay.push(addTextOverlayArrow(sortBoxOverlay, i % 2? DIRECTION_UP : DIRECTION_DOWN));
    }
    function addTextOverlayArrow(overlay, direction) {
        overlay.text += "  ";
        return combineSlides(overlay, {
            draw: function(ctx) {
                drawTextOverlayArrow(overlay, direction, ctx);
            }
        });
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
        recOverlay.push(addTextOverlayArrow(mergeBoxOverlay, i % 2? DIRECTION_UP : DIRECTION_DOWN));
    }

    slides.push(combineSlides(bitonicMergeNetwork, ...recOverlay));

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


    slides.push(combineSlides(bitonicMergeNetwork2, ...recOverlay.slice(0, 4)));
    slides.push(bitonicMergeNetwork2);

    // -----------------  CODE SLIDES  -----------------------
    let bitonicMergeNetwork3 = new NetworkFrame(new Network(8), {
        ...defaultNetworkDrawSettings,
        wireLength: defaultNetworkDrawSettings.wireLength / 2,
        marginX: w * 0.025
    }, false);

    let textPositionTuples = [
        ["BitonicSort(a, startWire, n, dir):", w/2 + w * 0.05, h*0.1],
        ["if n == 1: return", w/2 + w * 0.075, h*0.15],
        ["BitonicSort(a, startWire, n/2, ASC)", w / 2 + w * 0.075, h * 0.25],
        ["BitonicSort(a, startWire + n/2, n/2, DESC)", w / 2 + w * 0.075, h * 0.3],
        ["BitonicMerge(a, startWire, n, dir)", w / 2 + w * 0.075, h * 0.35],
        ["BitonicMerge(a, startWire, n, dir):", w / 2 + w * 0.05, h * 0.5],
        ["if n == 1: return", w / 2 + w * 0.075, h * 0.55],
        ["for i in range(startWire, startWire + n/2):", w / 2 + w * 0.075, h * 0.65],
        ["CompareAndSwap(a, i, i+n/2, dir)", w / 2 + w * 0.1, h * 0.70],
        ["BitonicMerge(a, startWire, n/2, dir)", w / 2 + w * 0.075, h * 0.8],
        ["BitonicMerge(a, startWire + n/2, n/2, dir)", w / 2 + w * 0.075, h * 0.85]
    ];
    let codeDrawCalls =  textPositionTuples.map(t => {
        let [text, x, y] = t;
        return {draw: function(ctx) {
            ctx.font = "40px Arial"
            ctx.fillText(text, x, y);
        }};
    });
    let indicies = [0, 1, 2, 4, 5, 6];
    indicies.forEach(idx => {
        slides.push(combineSlides(bitonicMergeNetwork3, ...recOverlay.slice(0, 2), recOverlay[4], ...codeDrawCalls.slice(0, idx)));
    });

    indicies = [6, 7, 9];
    indicies.forEach(idx => {
        slides.push(combineSlides(bitonicMergeNetwork3, ...recOverlay.slice(0, 2), ...codeDrawCalls.slice(0, idx)));
    });

    function drawTextOverlayArrow(overlay, direction, ctx) {
        let drawSettings = overlay.drawSettings;
        ctx.lineWidth = 5
        ctx.textBaseline = 'top'
        ctx.font = `${drawSettings.fontSize}px ${drawSettings.font}`;

        let measure = ctx.measureText(overlay.text);
        let spaceMeasure = ctx.measureText("  ");
        let arrowHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10;
        let y = drawSettings.position.y + drawSettings.height / 2;
        let x = drawSettings.position.x + (drawSettings.width + measure.width - spaceMeasure.width) / 2;

        if (direction == DIRECTION_DOWN) {
            drawVerticalArrow(x, y - arrowHeight / 2, arrowHeight, spaceMeasure.width / 2, spaceMeasure.width / 2, ctx)
        } else if (direction == DIRECTION_UP) {
            drawVerticalArrow(x, y + arrowHeight / 2, -arrowHeight, spaceMeasure.width / 2, spaceMeasure.width / 2, ctx)
        }
    }


    let smallMergeOverlays = [
        combineSlides(new TextBoxOverlay('MERGE  ', {
            position: {
                x: recOverlay[4].slides[0].left() + recOverlay[4].slides[0].drawSettings.width * 0.3,
                y: recOverlay[4].slides[0].top()},
            width: recOverlay[4].slides[0].drawSettings.width * 0.7 , 
            height: calcHeightFromWires(defaultNetworkDrawSettings, 4) - defaultNetworkDrawSettings.squareOffset,
            fontSize: 60,
            font: "Arial",
            strokeWidth: 3,
            drawVertical: false
        }), {
            draw: function(ctx) {
                let overlay = smallMergeOverlays[0].slides[0];
                drawTextOverlayArrow(overlay, DIRECTION_DOWN, ctx);
            }
        }),
        combineSlides(new TextBoxOverlay('MERGE  ', {
            position: {
                x: recOverlay[4].slides[0].left() + recOverlay[4].slides[0].drawSettings.width * 0.3,
                y: recOverlay[4].slides[0].top() + calcHeightFromWires(defaultNetworkDrawSettings, 4) },
            width: recOverlay[4].slides[0].drawSettings.width * 0.7 , 
            height: calcHeightFromWires(defaultNetworkDrawSettings, 4) - defaultNetworkDrawSettings.squareOffset,
            fontSize: 60,
            font: "Arial",
            strokeWidth: 3,
            drawVertical: false
        }), {
            draw: function(ctx) {
                let overlay = smallMergeOverlays[1].slides[0];
                drawTextOverlayArrow(overlay, DIRECTION_DOWN, ctx);
            }
        }),        
    ]

    for (let i = 9; i <= textPositionTuples.length-2; i++) { // Add small merge overlay
        slides.push(combineSlides(bitonicMergeNetwork3, ...recOverlay.slice(0, 2), ...smallMergeOverlays,  ...codeDrawCalls.slice(0, i)))
    }
    slides.push(combineSlides(bitonicMergeNetwork3, ...recOverlay.slice(0, 2), ...smallMergeOverlays,  ...codeDrawCalls.slice(0, textPositionTuples.length)))

    bitonicSort(0, 8, DESCENDING, bitonicMergeNetwork3.network, 0.011)
    for (const cas of bitonicMergeNetwork3.network.getCompareAndSwaps()) {
        cas.position *= 2.1;
    }

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
    let analysisSpanTitleSlides = {
        draw: function(ctx) {
            ctx.font = bulletPointSlideDrawSettings.titleFont;
            let text = "Analysis: Span";
            fillTextCanvasCenter(ctx, text, h * 0.1);
        }
    };
    slides.push(combineSlides(wikiNetworkSlide, analysisSpanTitleSlides));
    for (let i = 1; i <= 4; i++) {
        slides.push(combineSlides(wikiNetworkSlide, ...bigMergeBoxes.slice(0, 2**i - 1), analysisSpanTitleSlides));
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

    slides.push(combineSlides(...bigMergeBoxes.slice(0, 2**4 - 1), mergeBoxArrows, analysisSpanTitleSlides));

    slides.push(combineSlides(wikiNetworkSlide, {
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
    }, analysisSpanTitleSlides));

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

    slides.push(combineSlides(wikiNetworkSlide, {
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
    }, ...wikiMergeBoxOverlays, analysisSpanTitleSlides));

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

    slides.push(combineSlides( {
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
    }, ...wikiMergeBoxOverlays, innerMergeBoxArrows, analysisSpanTitleSlides));

    slides.push(combineSlides(wikiNetworkSlide, {
        draw: function(ctx) {
            ctx.clearRect(0, 0, bigMergeBoxes[0].left(), h);
            ctx.strokeStyle = generalDrawSettings.blue;
            ctx.lineWidth = 5
            createCasBox(wikiNetwork.getCompareAndSwaps(), {
                ...wikiNetworkDrawSettings,
                wireLeftX: wikiNetworkDrawSettings.marginX + wikiNetworkDrawSettings.squareLength + wikiNetworkDrawSettings.squareOffset,
                wireTopY: wikiNetworkDrawSettings.marginY,
                boxPadding: wikiNetworkDrawSettings.wireLength * 0.010,
                boxHeight: calcHeightFromWires(wikiNetworkDrawSettings, 16) - wikiNetworkDrawSettings.squareOffset
            }, 6, 16, ctx);
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
    },  analysisSpanTitleSlides));

    slides.push.apply(slides, 
        createBulletPointSlides("Analysis: Span", [
            'Network has span of log(n) merges',
            'Merges have span of O(log(n)) splits',
            'Splits have span of 1 compare',
            'Network Span ∈ O(log(n)⋅log(n))',
        ], bulletPointSlideDrawSettings)
    );

    let analysisWorkTitleSlides = {
        draw: function(ctx) {
            ctx.font = bulletPointSlideDrawSettings.titleFont;
            let text = "Analysis: Work";
            fillTextCanvasCenter(ctx, text, h * 0.1);
        }
    };
    slides.push(combineSlides(wikiNetworkSlide, analysisWorkTitleSlides));

    function createCasBox(cass, drawSettings, col, n, ctx) {
        // Find the min and max position in desired range
        let min = 1;
        let max = 0;
        let counter = 0;
        let m = n / 2;
        let start = m * col
        for (const c of cass) {
            if (counter >= start) {
                min = Math.min(min, c.position);
                max = Math.max(max, c.position);
            }
            counter++;
            if (counter >= start + m ) break;
        }
        // Draw
        let x = drawSettings.wireLeftX + 
                drawSettings.wireLength * min -
                drawSettings.boxPadding;
        let y = drawSettings.wireTopY
        let width = drawSettings.wireLength * (max - min) + 2 * drawSettings.boxPadding;
        let height = drawSettings.boxHeight 

        ctx.strokeRect(x, y, width, height);
    }


    slides.push(combineSlides(wikiNetworkSlide, analysisWorkTitleSlides, {
        draw: function(ctx) {
            ctx.strokeStyle = generalDrawSettings.blue
            ctx.lineWidth = 5
            for (let i = 0; i < 10; i++) {
                createCasBox(wikiNetwork.getCompareAndSwaps(), {
                    ...wikiNetworkDrawSettings,
                    wireLeftX: wikiNetworkDrawSettings.marginX + wikiNetworkDrawSettings.squareLength + wikiNetworkDrawSettings.squareOffset,
                    wireTopY: wikiNetworkDrawSettings.marginY - wikiNetworkDrawSettings.squareOffset / 2,
                    boxPadding: wikiNetworkDrawSettings.wireLength * 0.015,
                    boxHeight: calcHeightFromWires(wikiNetworkDrawSettings, 16)
                }, i, 16, ctx);
            }

        }
    }));

    slides.push.apply(slides, 
        createBulletPointSlides("Analysis: Work", [
            'Network split columns ∈ O(log(n)⋅log(n))',
            'Splits have 1/2n ∈ O(n) compares',
            'Network Work ∈ O(n⋅log(n)⋅log(n))',
        ], bulletPointSlideDrawSettings)
    );

    slides.push.apply(slides, 
        createBulletPointSlides('Recap', [
            'Sorting Networks',
            'Bitonic Merge Sort',
            'Span: O(log(n)⋅log(n))',
            'Work: O(n⋅log(n)⋅log(n))',
        ], bulletPointSlideDrawSettings)
    );

    /// -------------- END OF SLIDES ----------------------
    state.startSlideShow(ctx);
}