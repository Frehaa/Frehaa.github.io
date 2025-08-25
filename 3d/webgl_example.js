// What do we want? We want to render a sphere with color and lightning and transformation. 
// And then we want to render it again and again, each time with different transformations possibly different colors.


// Faces are specified clockwise
const boxPositions = [
  // Front face
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

  // Back face
  -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

  // Top face
  -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

  // Bottom face
  -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

  // Right face
  1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

  // Left face
  -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
];

function boxColors() {
    const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ];

    // Convert the array of colors into a table for all the vertices.
    let colors = [];
    for (const c of faceColors) {
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }
    return colors;
}

function sphere3d_scene() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);

    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);


    const mySphere = new Sphere3D(18, 36);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mySphere.extraVertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mySphere.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mySphere.extraIndices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');
    const colorLocation = gl.getAttribLocation(glProgram, 'color');
    const transformationLocation = gl.getUniformLocation(glProgram, 'transformation');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);    

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.useProgram(glProgram);

    const transformationMatrix = Transform3D.createRotateX(0.1);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); 
    gl.clearDepth(-2.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.GEQUAL); // Near things obscure far things

    function render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const rad = Math.PI * time * 0.0001;

        transformationMatrix.reset().rotateY(rad);
        gl.uniformMatrix4fv(transformationLocation, false, transformationMatrix.toFloat32Array(), 0, 0);

        {
        const vertexCount = mySphere.indices.length;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        // gl.drawArrays( gl.LINES, 0, 7);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        // gl.drawElements(gl.LINE_LOOP, vertexCount, type, offset);
        }            

        requestAnimationFrame(render);
    }

    render(0);



}

function webgl_main() {
    return sphere3d_scene();
    return mozila_tutorial_main();
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    // Create the shader program
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);
    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    const positionBuffer = copyBuffer(gl, boxPositions);

    const indexBuffer = moz_initIndexBuffer(gl);



    const glAttributeLocationPosition = gl.getAttribLocation(glProgram, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(glAttributeLocationPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(glAttributeLocationPosition);    



    // const colors = [
    //     1, 0, 0, 1,
    //     0, 1, 0, 1,
    //     0, 0, 1, 1,
    //     1, 0, 0, 1,
    //     0, 1, 0, 1,
    //     0, 0, 1, 1,
    // ];
    const colors = boxColors();
    const colorBuffer = copyBuffer(gl, colors);
    const glAttributeLocationColor = gl.getAttribLocation(glProgram, 'color');
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(glAttributeLocationColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(glAttributeLocationColor);
    
    const transformationMatrix = [
        0.7, 0, 0, 0,
        0, 0.7, 0, 0, 
        0, 0, 0.7, 0, 
        0, 0, 0, 1
    ];
    copyUniformMatrix4fv(gl, glProgram, transformationMatrix, "transformation");


    // DRAW
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram( glProgram );
    gl.drawArrays( gl.TRIANGLES, 0, 3);
    // l(gl)

    // const transformationMatrix2 = [
    //     -1.0, 0, 0, 0,
    //     0, -1.0, 0, 0, 
    //     0, 0, -1.0, 0, 
    //     0, 0, 0, 1
    // ];
    // copyUniformMatrix4fv(gl, glProgram, transformationMatrix2, "transformation");

    // gl.useProgram( glProgram );
    // gl.drawArrays( gl.TRIANGLES, 0, 3);

    // const transformationMatrix3 = [
    //     -1.0, 0, 0, 0,
    //     0,  1.0, 0, 0, 
    //     0, 0,  1.0, 0, 
    //     0, 0, 0, 1
    // ];
    // copyUniformMatrix4fv(gl, glProgram, transformationMatrix3, "transformation");

    // gl.useProgram( glProgram );
    // gl.drawArrays( gl.TRIANGLES, 0, 3);

    // const transformationMatrix4 = [
    //      1.0, 0, 0, 0,
    //     0, -1.0, 0, 0, 
    //     0, 0,  1.0, 0, 
    //     0, 0, 0, 1
    // ];
    // copyUniformMatrix4fv(gl, glProgram, transformationMatrix4, "transformation");

    // gl.useProgram( glProgram );
    // gl.drawArrays( gl.TRIANGLES, 0, 3);

}

function initializeWebGL(canvas) {
    const gl = canvas.getContext('webgl');

    if (gl === null) {
        throw new Error("Unable to initialize WebGL");
    }
    
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = pixelRatio * canvas.clientWidth;
    canvas.height = pixelRatio * canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.lineWidth(1.0);
    return gl;
}

function copyBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function compileShader(gl, shaderType, shaderCode) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    if ( ! gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

function createProgram(gl, shaders) {
    const glProgram = gl.createProgram();
    for (const shader of shaders) {
        gl.attachShader(glProgram, shader);
    }
    gl.linkProgram(glProgram);
    if ( ! gl.getProgramParameter(glProgram, gl.LINK_STATUS) ) {
        throw new Error(gl.getProgramInfoLog(glProgram));
    }
    return glProgram;
}
function copyUniformMatrix4fv(gl, program, matrix, locationName) {
    const glUniformLocationMatrix = gl.getUniformLocation(program, locationName);
    gl.useProgram(program);
    gl.uniformMatrix4fv(glUniformLocationMatrix, false, matrix);
}

const vertexShaderCode = `
attribute vec3 position;
attribute vec4 color;

uniform mat4 transformation;

varying vec4 vcolor;

void main() {
    gl_Position = transformation * vec4(position, 1);
    vcolor = color;
}
`;

const fragmentShaderCode = `
precision mediump float;

varying vec4 vcolor;

void main() {
    gl_FragColor = vcolor;
}
`;


// ####################################################################################
// ############################### MOZILA TUTORIAL ####################################
// ####################################################################################


function mozila_tutorial_main() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);


    const shaderProgram = moz_initShaderProgram(gl, transformColorLightVertexShaderSource, lightColorFragmentShaderSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
            vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        },
    };

    const buffers = moz_initBuffers(gl);

    // return
    moz_drawScene(gl, programInfo, buffers);
}


// Initialize a shader program, so WebGL knows how to draw our data
function moz_initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = moz_loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = moz_loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if ( ! gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) ) {
        throw new Error(gl.getProgramInfoLog(shaderProgram));
    }

    return shaderProgram;
}

// creates a shader of the given type, uploads the source and
// compiles it.
function moz_loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);
    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = new Error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw error;
    }

    return shader;
}


function moz_initBuffers(gl) {
    const positionBuffer = moz_initPositionBuffer(gl);
    const colorBuffer = moz_initColorBuffer(gl);
    const indexBuffer = moz_initIndexBuffer(gl)
    const normalBuffer = moz_initNormalBuffer(gl);
    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
        normals: normalBuffer
    }
}

function moz_initPositionBuffer(gl) {
    // // Now create an array of positions for the square.
    // const positions = [0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5];

    const positions = [
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ];

    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function moz_initColorBuffer(gl) {
//   const colors = [
//     1.0,
//     1.0,
//     1.0,
//     1.0, // white
//     1.0,
//     0.0,
//     0.0,
//     1.0, // red
//     0.0,
//     1.0,
//     0.0,
//     1.0, // green
//     0.0,
//     0.0,
//     1.0,
//     1.0, // blue
//   ];
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ];
    // const colors = [
    // ]
    // for (let i = 0; i < 4; i++) {
    //     colors.push(1);
    //     colors.push(0);
    //     colors.push(0);
    //     colors.push(1);
    // }
    // for (let i = 0; i < 8; i++) {
    //     colors.push(0);
    //     colors.push(0);
    //     colors.push(0);
    //     colors.push(1);
    // }
    // for (let i = 0; i < 12; i++) {
    //     colors.push(0);
    //     colors.push(1);
    //     colors.push(0);
    //     colors.push(1);
    // }

    // console.log(colors);
    

    // Convert the array of colors into a table for all the vertices.
    let colors = [];
    for (const c of faceColors) {
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}
function moz_initIndexBuffer(gl) {
     const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ]; 

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return buffer;
}

function moz_initNormalBuffer(gl) {
    const normals = [
        // Front
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        // Back
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        // Top
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        // Bottom
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
        // Right
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        // Left
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ];

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    return buffer
}

// NEXT STEP: Create many boxes with different transformations (SUCCESS)
// NEXT STEP: Make perspective and other projections work. 
// NEXT STEP: Make lighting work
// NEXT STEP: Draw axises 
// NEXT STEP: Make camera work
// NEXT STEP: Draw sphere
// NEXT STEP: Draw line through spheres

// ISSUE: It seems like the order of transformations is off from what I would expect. 
//      When doing translate and then scale, it acts like scale goes first for some reason. 
//      I can change this by going changing the multiplication directions in the target, but I don't understand why it is necessary. 

function moz_drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(-2.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.GEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = Transform3D.createIdentity();

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    moz_setPositionAttribute(gl, buffers, programInfo);
    moz_setColorAttribute(gl, buffers, programInfo);
    moz_setNormalAttribute(gl, buffers, programInfo);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix.toFloat32Array(),
    );


    // Need to create the matrix outside the loop and reuse the memory for everything. 
    const modelViewMatrix = Transform3D.createIdentity();

    // There seems to be an issue with the order of applications. Why does the scaling happen first? 
    const modelViewMatrices = [
        Transform3D.createRotateX(Math.PI * 0.1).rotateY(Math.PI*0.0).rotateZ(Math.PI * 0.0).scale(0.1).translate(-0.4, 0.4, 0.4), 
        // Transform3D.createTranslate(0.4, -0.4, -0.4).scale(0.1),//.rotateX(Math.PI * 0.9).rotateY(Math.PI * 0.6).rotateZ(Math.PI * 1.1), 
        // Transform3D.createTranslate(-0.1, 0.1, -0.8).scale(0.1),//.rotateX(Math.PI * 0.1).rotateY(Math.PI * 1.2).rotateZ(Math.PI * 1.8), 
    ];

    let lastTime = 0;
    function render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const rad = Math.PI * time * 0.0001;
        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        // const scaleFactor = (time % 3000) / 3000;
        // modelViewMatrix.reset().scale(0.4).rotateY(rad).rotateX(rad * 0.4)
        // const modelViewMatrix = [
        //     0.5, 0, 0, 0,
        //     0, 0.5, 0, 0,
        //     0, 0, 0.5, 0,
        //     0, 0, 0, 1,
        // ];

        // console.log(modelViewMatrix);
        // return;

        for (const modelViewMatrix of modelViewMatrices) {
            gl.uniformMatrix4fv(
                programInfo.uniformLocations.modelViewMatrix,
                false,
                modelViewMatrix.toFloat32Array()
            );

            const inverseMatrix = modelViewMatrix.inverse();
            gl.uniformMatrix4fv(
                programInfo.uniformLocations.normalMatrix,
                false,
                inverseMatrix.toFloat32Array()
            );

            {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            }            
        }



        return;

        requestAnimationFrame(render);
    }

    requestAnimationFrame(time => {
        lastTime = time;
        render(time);
    });

}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function moz_setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 3; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function moz_setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

function moz_setNormalAttribute(gl, buffers, programInfo) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}

const transformationVertexShaderSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;


const transformationAndColorVertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

      vColor = aVertexColor;
    }
  `;

const transformColorLightVertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 aVertexNormal;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.1, 0.1, 0.1);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(5.85, 5.8, 5.15));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    } 
`;

const allWhiteFragmentShaderSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

const varyingColorFragmentShaderSource = `
    varying lowp vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }
`;

const lightColorFragmentShaderSource = `
    varying highp vec3 vLighting;

    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
    }
`;