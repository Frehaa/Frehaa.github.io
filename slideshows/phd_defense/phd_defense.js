function initializeWebGL(canvas) {
    const gl = canvas.getContext('webgl');
    if (gl === null) {
        throw new Error("Unable to initialize WebGL");
    }

    return gl;
}

function onbodyload() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const slideshowState = initializeSlideshowState();
    initializeSlideshowEventListeners(canvas, slideshowState);

    const shaderPrograms = new Map();
    shaderPrograms.set('default', program);


    // So how should this work if I want to do WebGl context too?
    // 1. The argument I get in the draw calls is just what I have given in the startSlidShow call. I can simply give it something which can be either webgl or 2dcontext
    // 2. I can simply refer to the context using a handle other than the argument.

    slideshowState.addSlide(createDrawSlide(drawSomethingWebgl));

    slideshowState.startSlideShow(gl)
}

function drawSomethingWebgl(gl) {

}

// TODO: I want to create a 3d scene with the 3 axis a camera and perspective transformation and the many matrix dots that can move position.

// Do I really care to make the point of why it is called a saddlepoint? It seems like something which could be visualy impressive and kind of fun, 
// but it doesn't really accomplish much? Maybe if there is time. I guess I have one hour right? 

