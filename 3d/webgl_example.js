function webgl_main() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    // Create the shader program
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);
    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    // Prepare data
    const positions = [
        -0.9,  0.4, 0,
         0.8,  0.4, 0,
         0.6, -0.4, 0,
        -0.9,  0.4, 0,
         0.6, -0.4, 0,
        -0.8, -0.4, 0,
    ];
    const positionBuffer = copyBuffer(gl, positions);

    const glAttributeLocationPosition = gl.getAttribLocation(glProgram, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(glAttributeLocationPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(glAttributeLocationPosition);    

    const colors = [
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
        1, 0, 0, 1,
        0, 0, 1, 1,
        1, 0, 1, 1,
    ];
    const colorBuffer = copyBuffer(gl, colors);
    const glAttributeLocationColor = gl.getAttribLocation(glProgram, 'color');
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(glAttributeLocationColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(glAttributeLocationColor);
    
    const transformationMatrix = [
        1.0, 0, 0, 0,
        0, 0.7, 0, 0, 
        0, 0, 0.7, 0, 
        0, 0, 0, 1
    ];
    copyUniformMatrix4fv(gl, glProgram, transformationMatrix, "transformation");


    // DRAW
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram( glProgram );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
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

    gl.clearColor(1.0, 1.0, 1.0, 0.0);
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