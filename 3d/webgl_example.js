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

function createWireframeProgram(gl, vertexShader, positionBuffer, colorBuffer) {
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, allWhiteFragmentShaderSource);
    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');
    const colorLocation = gl.getAttribLocation(glProgram, 'color');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);    
    return glProgram;
}

function sphere3d_scene() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);

    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);


    const mySphere = new Sphere3D(30, 30);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mySphere.extraVertices), gl.STATIC_DRAW);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mySphere.vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mySphere.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mySphere.extraIndices), gl.STATIC_DRAW);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mySphere.indices), gl.STATIC_DRAW);

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

    // TODO: Make things disapear after the camera moves too far forward.
    const camera = new Camera3D();
    camera.setPosition(new Vec3(0, 0, 0));
    // camera.turnHorizontal(-Math.PI / 4)
    const transformationMatrix = Transform3D.createIdentity();


    // I guess this is unnecessary when using WebGl because the shader handles this for us. We just need to make sure the object is in the canonical view volume ([-1, 1]^3)
    // const viewportTransformation = Transform3D.createViewportTransform(canvas.width, canvas.height);

    const leftPlane = -5;
    const rightPlane = 5;
    const bottomPlane = -5;
    const topPlane = 5;
    const nearPlane = 0;
    const farPlane = -10;

    document.addEventListener('keyup', e => {
        switch (e.code) {
            case "ArrowRight": {
                camera.turnHorizontal(0.1);
            } break;
            case "ArrowLeft": {
                camera.turnHorizontal(-0.1);
            } break;
            case "ArrowUp": {
                camera.turnVertical(0.1);
            } break;
            case "ArrowDown": {
                camera.turnVertical(-0.1);
            } break;
            case "KeyW": {
                camera.move(new Vec3(0, 0, -1));
            } break;
            case "KeyA": {
                camera.move(new Vec3(-1, 0, 0));
            } break;
            case "KeyS": {
                camera.move(new Vec3(0, 0, 1));
            } break;
            case "KeyD": {
                camera.move(new Vec3(1, 0, 0));
            } break;
            default:
                break;
        }
    })

    // return;

    const projectionTransformation = Transform3D.createOrthographicTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);
    const perspectiveTransformation = Transform3D.createPerspectiveTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT_AND_BACK);
    gl.lineWidth(1.0);
    gl.clearColor(0.1, 0.1, 0.1, 1.0); 
    gl.clearDepth(-0.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.GEQUAL); // Near things obscure far things

    let lastTime = 0;
    function render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const rad = time * 0.0003;
        const deltaTime = time - lastTime;
        
        lastTime = time;

        // camera.turnHorizontal(0.01);
        // TODO: Why does the object I am looking at not move when I turn horizontally or vertically? The answer is that I didn't translate before the camera transformation
        // TODO: Maybe I should try to apply the transformations to the origin point. This example makes it clear (conceptually) that translating should happen before other transformations
        // TODO: The object moves when I turn the camera, but it moves in an unexpected manner. It does not disapear even if the camera turns its back on the element. 
        //      There is no back in clip space. There is only inside or not. As long as the transformation leaves the element in clip space then it should be visible.
        //      Maybe we should try to do a viewport transformation too
        // I gues the reason stuff didn't disapear is because I was rotating things around origin which means its distance to origin was also the same (sensibly). 
        // but the view volume I had picked was even a big box around the origin so if something was inside the volume before I made my camera transformation, then it would also be inside after (ignoring corner case with corners and such). 

        transformationMatrix.reset().scale(2).rotateX(0.1).rotateY(rad).translate(0, 0, -10)._then(camera.getTransformation())._then(projectionTransformation);
        gl.uniformMatrix4fv(transformationLocation, false, transformationMatrix.toFloat32Array(), 0, 0);

        // gl.uniform1f(colorToggleLocation, 0.0);

        {
        const vertexCount = mySphere.extraIndices.length
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        // gl.drawArrays(gl.TRIANGLES, 0 , vertexCount);
        // gl.drawArrays(gl.LINE_STRIP, 0 , vertexCount);
        // gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        // gl.uniform1f(colorToggleLocation, 1.0);

        // gl.useProgram(wireframeProgram);
        // gl.uniformMatrix4fv(wireTransformationLocation, false, transformationMatrix.toFloat32Array(), 0, 0);
        gl.drawElements(gl.LINE_LOOP, vertexCount, type, offset);
        }            

        requestAnimationFrame(render);
    }

    render(0);
}
function testCullingSphere() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);
    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    const sphere = new Sphere3D(6, 12);
    const transformation = Transform3D.createIdentity();

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');
    const colorLocation = gl.getAttribLocation(glProgram, 'color');
    const transformationLocation = gl.getUniformLocation(glProgram, 'transformation');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);    


    // It seems like my sphere right now has its triangles face BACK side out which means that when culling BACK we remove the front. This is fine if we are consistent, but it might be worth looking more into. 

    gl.useProgram(glProgram);

    gl.clearDepth(0.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearColor(0, 0, 0, 1); 
    gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.FRONT);
    gl.cullFace(gl.BACK);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniformMatrix4fv(transformationLocation, false, transformation.toFloat32Array(), 0, 0);

    const vertexCount = sphere.indices.length
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);


}


function testCulling() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, positionVertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, allWhiteFragmentShaderSource);
    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    const testVertices = [
        -0.5, -0.5, 0,
        0.5, -0.5, 0,
        -0.5, 0.5, 0,
        0.5, 0.5, 0,
    ];
    // const testIndices = [2, 1, 0, 2, 3, 1];     // BACK  (Invisible when cullFace = gl.BACK )
    // const testIndices = [0, 1, 2, 2, 1, 3];  // FRONT (Invisible when cullFace = gl.FRONT )
    const testIndices = [2, 1, 0, 2, 1, 3];  // BACK&FRONT (Left is invisible when cullface = gl.BACK)


    

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(testVertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(testIndices), gl.STATIC_DRAW);


    gl.useProgram(glProgram);

    gl.clearColor(0, 0, 0, 1); 
    gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.FRONT);
    gl.cullFace(gl.BACK);

    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexCount = testIndices.length
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);

    // {
    //     const offset = 0;
    //     const vertexCount = 5;
    //     gl.drawArrays(gl.POINTS, offset, vertexCount - offset);
    // }
}

// I assume the data is given as 3 indices for each triangle
function toWireframeIndices(triangleIndices) {
    const result = [];
    for (let i = 0; i < triangleIndices.length; i+=3) {
        const a = triangleIndices[i];
        const b = triangleIndices[i+1];
        const c = triangleIndices[i+2];
        result.push(a, b, b, c, c, a);
    }
    return result;
}

// TODO: Make sure that everything is within the [-1, 1]^3 box before the division divide is made.
// We assume the camera is just the identity matrix which is equivalent to it pointing in the negative z direction with up being the positive y direction.
function testPerspective() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const box = new Box3D();

    const programInfo = createSimpleTransformColorProgram(gl);

    // const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    // const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);
    // const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.vertices), gl.STATIC_DRAW);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(testVertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.colors), gl.STATIC_DRAW);

    // const wireFrameBoxIndices = toWireframeIndices(box.indices);
    // console.log(wireFrameBoxIndices);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireFrameBoxIndices), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(box.indices), gl.STATIC_DRAW);

    const height = 4; 
    const width = 5;

    const leftPlane = -width / 2;
    const rightPlane = leftPlane + width;
    const bottomPlane = -height / 2;
    const topPlane = bottomPlane + height;
    const nearPlane = -1;
    const farPlane = -50;

    const camera = new Camera3D();
    camera.setPosition(new Vec3(0, 0, -2))

    const transformBuffer = Transform3D.createIdentity();
    const openglPerspectiveTransformation = Transform3D.createPerspectiveTransformOpenGL(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);
    const orthProjectionTransformation = Transform3D.createOrthographicTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);
    const perspectiveTransformation = Transform3D.createPerspectiveTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);
    // const projectionTransformation = orthProjectionTransformation;
    // const projectionTransformation = perspectiveTransformation;
    const projectionTransformation = openglPerspectiveTransformation;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(programInfo.locations.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.locations.position);    

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(programInfo.locations.color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.locations.color);    

    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.useProgram(programInfo.program);

    gl.clearColor(0, 0, 0, 1); 

    document.addEventListener('keydown', e => {
        switch (e.code) {
            case "ArrowUp": {
                camera.move(new Vec3(0, 0, -1));
            } break;
            case "ArrowDown": {
                camera.move(new Vec3(0, 0, 1));
            } break;
        }
    });

    const animationFrameRequestManager = new AnimationFrameRequestManager((dt, time) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // transformBuffer.reset().scale(1, 1, 1).rotateX(time * 0.001).translate(0, 0, -4)._then(camera.getTransformation())._then(projectionTransformation)
        transformBuffer.reset().scale(1, 1, 1).rotateX(time * 0.001).rotateY(time * 0.0002).rotateZ(time*0.001).translate(0, 0, -4)._then(camera.getTransformation())._then(projectionTransformation)
        const transformationData = transformBuffer.toFloat32Array();
        
        gl.uniformMatrix4fv(programInfo.locations.transform, false, transformationData, 0, 0);
        // const vertexCount = box.indices.length
        const vertexCount = box.indices.length;
        // const vertexCount = testIndices.length
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);


    });

    animationFrameRequestManager.start();

}

const simpleTransformVertexShaderSource = `
attribute vec3 position;
uniform mat4 transformation;

void main() {
    gl_Position = transformation * vec4(position, 1);
}`;

function drawDiablo() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);
}

function testMultiple() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    // How big is the house? 10x10x10? Sure
    const box = new Box3D();
    const bigBoxTransformation = Transform3D.createScale(5, 5, 5).rotateX(3.4).rotateY(-0.2).rotateZ(2.5).translate(-3, -3, 0);
    const smallBoxTransformation = Transform3D.createScale(1, 1, 1.5).rotateX(0.1).rotateY(0.2).rotateZ(0.3).translate(2, 0.6, -3.5);

    const sphere = new Sphere3D(38, 20);
    const bigSphereTransformation = Transform3D.createScale(2, 2, 2).translate(-3.5, 5, -3);
    const smallSphereTransformation = Transform3D.createScale(0.5, 0.5, 0.5).translate(1, 3, -2.5);

    // const boxProgramInfo = createIndexedVertexColorProgram(gl, box);
    // const sphereProgramInfo = createIndexedVertexColorProgram(gl, sphere);
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);
    const simpleTransformShader = compileShader(gl, gl.VERTEX_SHADER, simpleTransformVertexShaderSource);
    const allWhiteFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, allWhiteFragmentShaderSource);

    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);
    const glProgramWhite = createProgram(gl, [simpleTransformShader, allWhiteFragmentShader]);

    const spherePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.vertices), gl.STATIC_DRAW);

    const sphereColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.colors), gl.STATIC_DRAW);

    const sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

    const boxPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.vertices), gl.STATIC_DRAW);

    const boxColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.colors), gl.STATIC_DRAW);

    const boxIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(box.indices), gl.STATIC_DRAW);


    const camera = new Camera3D();
    camera.setPosition(new Vec3(0, 0, 6));

    const leftPlane = -8;
    const rightPlane = 8;
    const bottomPlane = -5.5;
    const topPlane = 5.5;
    const nearPlane = -1;
    const farPlane = -20;

    const transformBuffer = Transform3D.createIdentity();
    const projectionTransformation = Transform3D.createOrthographicTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');
    const positionLocationWhite = gl.getAttribLocation(glProgramWhite, 'position');
    const colorLocation = gl.getAttribLocation(glProgram, 'color');
    const colorLocationWhite = gl.getAttribLocation(glProgramWhite, 'color');
    const transformationLocation = gl.getUniformLocation(glProgram, 'transformation');
    const transformationLocationWhite = gl.getUniformLocation(glProgramWhite, 'transformation');

    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);    


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.useProgram(glProgram);

    // const transformationMatrix = Transform3D.createIdentity()//._then(camera.getTransformation())._then(projectionTransformation);


    gl.lineWidth(1.0);
    gl.clearColor(0, 0, 0, 1); 
    gl.clearDepth(-0.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.GEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    {    
    smallSphereTransformation.copyTo(transformBuffer)._then(camera.getTransformation())._then(projectionTransformation);
    gl.uniformMatrix4fv(transformationLocation, false, transformBuffer.toFloat32Array(), 0, 0);
    const vertexCount = sphere.indices.length
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }


    {
    bigSphereTransformation.copyTo(transformBuffer)._then(camera.getTransformation())._then(projectionTransformation);
    gl.uniformMatrix4fv(transformationLocation, false, transformBuffer.toFloat32Array(), 0, 0);
    const vertexCount = sphere.indices.length
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, boxPositionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    // gl.bindBuffer(gl.ARRAY_BUFFER, boxColorBuffer);
    // gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(colorLocation);    


    console.log("test")
    console.log(positionLocation, positionLocationWhite);
    console.log(colorLocation, colorLocationWhite);
    

    // So after I am done drawing my spheres. I need to bind the other buffers and enable them 


    // So the program is just for locations and the shaders. The buffers are somewhat decoubled


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);

    gl.useProgram(glProgramWhite);

    {    
    smallBoxTransformation.copyTo(transformBuffer)._then(camera.getTransformation())._then(projectionTransformation);
    gl.uniformMatrix4fv(transformationLocationWhite, false, transformBuffer.toFloat32Array(), 0, 0);
    const vertexCount = box.indices.length
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    {    
    bigBoxTransformation.copyTo(transformBuffer)._then(camera.getTransformation())._then(projectionTransformation);
    gl.uniformMatrix4fv(transformationLocationWhite, false, transformBuffer.toFloat32Array(), 0, 0);
    const vertexCount = box.indices.length
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }


}

// What is the appropriate way to handle drawing different elements? 
// Is changing the program often fine? 
// Should I reuse the same position buffer for two different objects? 
// Or is reuse more for the sake of LOD or something like that? 

function createSimpleTransformColorProgram(gl) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);

    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');
    const colorLocation = gl.getAttribLocation(glProgram, 'color');
    const transformationLocation = gl.getUniformLocation(glProgram, 'transformation');

    return {
        program: glProgram,
        locations: {
            position: positionLocation,
            color: colorLocation,
            transform: transformationLocation
        }
    };
}

function addCameraMouseControlEventListeners(camera) {
    let mouseDown = false;
    const leftMouse = 0;
    document.addEventListener('mousedown', e => {
        if (e.button == leftMouse) {
            mouseDown = true;
        }
    });
    document.addEventListener('mouseup', e => {
        if (e.button == leftMouse) {
            mouseDown = false;
        }
    });
    document.addEventListener('mousemove', e => {
        if (mouseDown) {
            camera.turnHorizontal(-e.movementX * 0.002);
            camera.turnVertical(-e.movementY * 0.002);
        }
    })


}
function addKeyEventListener(pressedKeysSet) {
    document.addEventListener('keydown', e => {
        pressedKeysSet.add(e.code);
    });
    document.addEventListener('keyup', e => {
        pressedKeysSet.delete(e.code);
    })
}
function updateCamera(camera, pressedKeysSet, deltaTime) {
    if (pressedKeysSet.size === 0) return;
    
    let moveDeltaX = 0;
    let moveDeltaY = 0;
    let moveDeltaZ = 0;
    for (const key of pressedKeysSet) {
        
        switch (key) {
            case "KeyW": {
                moveDeltaZ += 1;
            } break;
            case "KeyS": {
                moveDeltaZ -= 1;
            } break;
            case "KeyE": {
                moveDeltaX += 1;
            } break;
            case "KeyQ": {
                moveDeltaX -= 1;
            } break;
            case "Space": {
                moveDeltaY += 1;
            } break;
            case "KeyC": {
                moveDeltaY -= 1;
            } break;
            case "KeyA": {
                camera.turnHorizontal(-0.001 * deltaTime);
            } break;
            case "KeyD": {
                camera.turnHorizontal(0.001 * deltaTime);
            } break;
            case "ArrowUp": {
                camera.turnVertical(-0.001 * deltaTime);
            } break;
            case "ArrowLeft": {
                camera.turnHorizontal(-0.001 * deltaTime);
            } break;
            case "ArrowDown": {
                camera.turnVertical(0.001 * deltaTime);
            } break;
            case "ArrowRight": {
                camera.turnHorizontal(0.001 * deltaTime);
            } break;
        }
    }

    camera.moveRelative(new Vec3(moveDeltaX, moveDeltaY, moveDeltaZ).scale(deltaTime * 0.01));
}

function createIndexedColorBuffers(gl, surface) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surface.indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        index: indexBuffer
    }
}

function simpleScene() {
   // We are inside a box wth 4 walls, a floor and a ceiling.
    // There are 2 spheres, a box, and pyramid inside
    // There is a point light and ambient light with phong shading.
    // We have simple camera controls. 
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    // How big is the house? 10x10x10? Sure
    const box = new Box3D();
    const bigBoxTransformation = Transform3D.createScale(15, 15, 15).translate(0, 7.5, 0);
    const smallBoxTransformation = Transform3D.createScale(1, 1, 1.5).translate(2, 0.6, -3.5);

    const sphere = new Sphere3D(38, 20);
    const bigSphereTransformation = Transform3D.createScale(2, 2, 2).translate(-3.5, 5, -3);
    const smallSphereTransformation = Transform3D.createScale(0.5, 0.5, 0.5).translate(1, 3, -2.5);

    // TESTING
    const programInfo = createSimpleTransformColorProgram(gl);
    const boxBuffers = createIndexedColorBuffers(gl, box);
    const sphereBuffers = createIndexedColorBuffers(gl, sphere);

    // gl.cullFace(gl.FRONT_AND_BACK);
    // gl.lineWidth(1.0);
    gl.clearColor(0.4, 0.4, 0.4, 1.0); 
    // gl.clearDepth(-0.0); 
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const height = 1; 
    const width = 2;

    const leftPlane = -width / 2;
    const rightPlane = -leftPlane;
    const bottomPlane = -height/2;
    const topPlane = -bottomPlane;
    const nearPlane = -1;
    const farPlane = -20;

    const camera = new Camera3D();
    camera.setPosition(new Vec3(0, 0, 2));

    const pressedKeysSet = new Set();
    addCameraMouseControlEventListeners(camera, pressedKeysSet);
    addKeyEventListener(pressedKeysSet);

    // const projectionTransformation = Transform3D.createOrthographicTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);
    const projectionTransformation = Transform3D.createPerspectiveTransformOpenGL(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane);

    const drawThings = [
        {
            vertexCount: sphere.indices.length,
            buffers: sphereBuffers,
            transforms: [
                smallSphereTransformation, 
                bigSphereTransformation
            ]

        },
        {
            vertexCount: box.indices.length,
            buffers: boxBuffers,
            transforms: [
                smallBoxTransformation,
                bigBoxTransformation
            ]
        }
    ]
        gl.useProgram(programInfo.program);

    const transformBuffer = Transform3D.createIdentity();
    const animationFrameRequestManager = new AnimationFrameRequestManager((dt, time) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        updateCamera(camera, pressedKeysSet, dt);

        for (const drawThing of drawThings) {
            gl.bindBuffer(gl.ARRAY_BUFFER, drawThing.buffers.position);
            gl.vertexAttribPointer(programInfo.locations.position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.locations.position);    
            
            gl.bindBuffer(gl.ARRAY_BUFFER, drawThing.buffers.color);
            gl.vertexAttribPointer(programInfo.locations.color, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.locations.color);    

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, drawThing.buffers.index);


            for (const transform of drawThing.transforms) {
                transform.copyTo(transformBuffer)._then(camera.getTransformation())._then(projectionTransformation);
                gl.uniformMatrix4fv(programInfo.locations.transform, false, transformBuffer.toFloat32Array(), 0, 0);
                const vertexCount = drawThing.vertexCount;
                const type = gl.UNSIGNED_SHORT;
                const offset = 0;
                gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            }
        }
    });
    animationFrameRequestManager.start();
}

function dot3d_scene() {
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);

    const glProgram = createProgram(gl, [vertexShader, fragmentShader]);


    const points = [
        0, 0, 0, 
        0.9, 0, 0.1, 
        0, 0.9, 0.2, 
        -0.4, -0.3, 0.3, 
        0.8, -0.1, 0.4 
    ];

    const colors = [
        1, 0, 0, 1, 
        0, 1, 0, 1, 
        0, 0, 1, 1, 
        1, 1, 1, 1,
        1, 1, 0, 1
    ]

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mySphere.vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // const indexBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mySphere.extraIndices), gl.STATIC_DRAW);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mySphere.indices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(glProgram, 'position');
    const colorLocation = gl.getAttribLocation(glProgram, 'color');
    const transformationLocation = gl.getUniformLocation(glProgram, 'transformation');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);    

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);    

    gl.useProgram(glProgram);

    const transformationMatrix = Transform3D.createIdentity();

    gl.lineWidth(1.0);
    gl.clearColor(0, 0, 0, 1); 
    gl.clearDepth(-0.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.GEQUAL); // Near things obscure far things

    document.gl = gl;


    console.log(
     gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
    );

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(transformationLocation, false, transformationMatrix.toFloat32Array(), 0, 0);

    // TODO: Make a thick line with triangles. A thick line is really just a rectangle and a rectangle is just 2 triangles.  
    // TODO: Alternatively, we can make a cylinder 

    // gl.drawArrays(gl.LINE_STRIP, 0, 5);
    {
        const offset = 0;
        const vertexCount = 5;
        gl.drawArrays(gl.POINTS, offset, vertexCount - offset);
    }
}

function webgl_main() {
    // return testMultiple();
    return simpleScene();
    // return testCullingSphere();
    // return testCulling();
    return testPerspective()
    // return dot3d_scene();
    // return sphere3d_scene();
    return mozila_tutorial_main();
    const canvas = document.getElementById('canvas');
    const gl = initializeWebGL(canvas);

    // Create the shader program
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, varyingColorFragmentShaderSource);
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
        const logInfo = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader)
        throw new Error(logInfo);
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

const positionVertexShaderSource = `
attribute vec3 position;

void main() {
    gl_Position =  vec4(position, 1);
}
`;
const vertexShaderSource = `
attribute vec3 position;
attribute vec4 color;

uniform mat4 transformation;

varying vec4 vColor;

void main() {
    gl_Position =  transformation * vec4(position, 1);
    vColor = color;
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

            const inverseMatrix = modelViewMatrix.getInverse();
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