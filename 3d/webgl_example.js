
function webgl_main() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl');

    if (gl === null) {
        console.error("Unable to initialize WebGL");
        return;
    }
    console.log(gl);
    

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = pixelRatio * canvas.clientWidth;
    canvas.height = pixelRatio * canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 0.0);
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.lineWidth(1.0);


    const positions = [
        -0.9,  0.4, 0,
         0.8,  0.4, 0,
         0.6, -0.4, 0,
        -0.9,  0.4, 0,
         0.6, -0.4, 0,
        -0.8, -0.4, 0,
    ];

    const colors = [
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
        1, 0, 0, 1,
        0, 0, 1, 1,
        1, 0, 1, 1,
    ];

    const position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);
    if ( ! gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader)
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);
    if ( ! gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader)
    }

    const glProgram = gl.createProgram();
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);
    if ( ! gl.getProgramParameter(glProgram, gl.LINK_STATUS) ) {
        console.error( gl.getProgramInfoLog(glProgram) );
        return; 
    }
    
    const transformationMatrix = [
        1.0, 0, 0, 0,
        0, 0.7, 0, 0, 
        0, 0, 0.7, 0, 
        0, 0, 0, 1
    ];
    const glUniformLocationMatrix = gl.getUniformLocation(glProgram, 'transformation');
    gl.useProgram(glProgram);
    gl.uniformMatrix4fv(glUniformLocationMatrix, false, transformationMatrix);

    const glAttributeLocationPosition = gl.getAttribLocation(glProgram, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.vertexAttribPointer(glAttributeLocationPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(glAttributeLocationPosition);

    const glAttributeLocationColor = gl.getAttribLocation(glProgram, 'color');
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.vertexAttribPointer(glAttributeLocationColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(glAttributeLocationColor);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram( glProgram );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
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