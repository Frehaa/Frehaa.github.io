"use strict";
function initialize() {
    let canvas = document.getElementById('canvas');
    const state = {
        mousePosition: {x:0, y: 0},
        frames: [],
        currentFrameIdx: 0,
        showSlideNumber: false
    };
    initializeSlideshowEventListeners(canvas, state);

    frames.push(rectangleFrame)
    frames[currentFrameIdx].frameStart();
    requestAnimationFrame(drawCurrentFrame);
    
    // TODO: Draw matrix
    // Draw values into matrix
    // Color depending on threshold
    // Change threshold and update colors
    // 


}