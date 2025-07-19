function drawFace(face, vertexSet) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeWidth = 0.5

    const a = vertexSet[face.a];
    const b = vertexSet[face.b];
    const c = vertexSet[face.c];

    if (!a || !b || !c) {
        l('Something went wrong', a, b, c, face, vertexSet[face.a], vertexSet[face.b], vertexSet[face.c]);
    }

    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();
}

function transformVertexSet(vertexSet, transformation) { 
    const result = new Array(vertexSet.length);
    for (let i = 1; i < vertexSet.length; i++) {
        result[i] = transformation.transformVec4(vertexSet[i]);    
    }
    return result;
}

function getDefaultTransformation() {
    const canvas = document.getElementById('canvas');
    const nx = canvas.width;
    const ny = canvas.height;
    const viewportTransformation = Matrix.fromArray([
        [nx/2,    0,    0, (nx - 1)/2],
        [   0,   -ny/2, 0, (ny - 1)/2], 
        [   0,    0,     0,         0],
        [   0,    0,    0,          1]
    ]);

    // ### Create Orthographic projection
    const leftPlane = -1;
    const rightPlane = 1;
    const bottomPlane = -1;
    const topPlane = 1;
    const nearPlane = 1;
    const farPlane = -1;

    // For some reason I have to flip the Y coordinate here. I do not have to flip it if I do not do my camera transformation.
    const orthographicProjectionTransformation = Matrix.fromArray([
        [2 / (rightPlane - leftPlane),                               0,                          0, -(rightPlane + leftPlane) / (rightPlane - leftPlane)],
        [                           0,    2 / (topPlane - bottomPlane),                          0, -(topPlane + bottomPlane) / (topPlane - bottomPlane)], 
        [                           0,                               0, 2 / (nearPlane - farPlane), -(nearPlane + farPlane) / (nearPlane - farPlane)],
        [                           0,                               0,                          0, 1]
    ])

    const perspectiveProjectionTransform = Matrix.fromArray([
        [ (2*nearPlane) / (rightPlane - leftPlane),                                         0,  (leftPlane + rightPlane)/ (rightPlane - leftPlane),                                                   0],
        [                                        0,  (2*nearPlane) / (topPlane - bottomPlane), (bottomPlane + topPlane) / (topPlane - bottomPlane),                                                   0],
        [                                        0,                                         0,     -(farPlane + nearPlane) / (farPlane - nearPlane), -(2 * farPlane * nearPlane) / (farPlane - nearPlane)],
        [                                        0,                                         0,                                                   -1,                                                   0],
    ]);


    const cameraPosition = new Vec3(0, 0, 2);
    const cameraDirection = new Vec3(0, 0, -1);
    const cameraUp = new Vec3(0, 1, 0);

    const cameraBasisW = cameraDirection.scale(-1).normalize();
    const cameraBasisU = cameraUp.cross(cameraBasisW).normalize();
    const cameraBasisV = cameraBasisW.cross(cameraBasisU).normalize();

    const cameraTransformation = Matrix.fromArray([
        [cameraBasisU.x, cameraBasisU.y, cameraBasisU.z, 0],
        [cameraBasisV.x, cameraBasisV.y, cameraBasisV.z, 0], 
        [cameraBasisW.x, cameraBasisW.y, cameraBasisW.z, 0],
        [0,                           0,              0, 1]
    ]).mult(Matrix.fromArray([
        [1, 0, 0, -cameraPosition.x],
        [0, 1, 0, -cameraPosition.y],
        [0, 0, 1, -cameraPosition.z],
        [0, 0, 0,                 1],
    ]));

    const projectionTransformation = false? orthographicProjectionTransformation : perspectiveProjectionTransform;

    const viewTransformation = viewportTransformation.mult(projectionTransformation).mult(cameraTransformation);
    return viewTransformation;
}

function handleWavefrontString(wavefrontString) {
    const [vertexSet, faces] = parseWavefrontString(wavefrontString); // We simply assume the file is an wavefront .obj file

    const transformation = getDefaultTransformation();
    const transformedVertexSet = transformVertexSet(vertexSet, transformation);

    l(transformation, vertexSet, transformedVertexSet, faces);
    for (const face of faces) {
        drawFace(face, transformedVertexSet);    
    }
}

function test_load_Wavefront() {
    const reader = new FileReader();
    reader.addEventListener('load', event => {
        const result = event.target.result;
        handleWavefrontString(result);
    });

    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', e => {
        if (input.files.length === 1) {
            const file = input.files[0];
            reader.readAsText(file);
        }
    })
    document.body.appendChild(input);

    handleWavefrontString(globalWavefrontString);
}

// What is it we want to do? 
// I want to implement camera controls. 
// This means being able to move the camera direction with the mouse and the camera position with keys (or also mouse)

// TODO: 
// Implement thing to prevent double drawing lines when drawing phases (The dot thing)
// Implement simple coloring using the triangle faces and their u, v coordinates
// Implement clipping
// Implement texture mapping
// Implement Shading
// Implement ??? 

function wireframeMain() {
    return test_load_Wavefront();


    const state = {        
        camera: { 
            position: {x: 5, y: 5, z: 5},
            direction: {x: -1, y: -1, z: -1},
            up: {x: 0, y: 1, z: 0},
            usePerspectiveMatrix: false,
        },
        projectionPlanes: {
            leftBottomNear: {x: -2, y: -2, z: 2},
            rightTopFar: {x: 2, y: 2, z: -2}
        },
        objects: [
            {
                points: [
                    new Vec4(0,0,0, 1),
                    new Vec4(1,0,0, 1),
                    new Vec4(1,0,1, 1),
                    new Vec4(0,0,1, 1),
                    new Vec4(0,1,0, 1),
                    new Vec4(1,1,0, 1),
                    new Vec4(1,1,1, 1),
                    new Vec4(0,1,1, 1),
                ],
                transformations: []
            }
        ]
    }

    drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes)
}

function drawWireframeSceneFromState(camera, objects, projection) {
    // l(camera,objects, projection)
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    ctx.clear();

    const boxPoints = objects[0].points;
    const transformations = objects[0].transformations.map(c => c.constructor(c));
    let objectTransformation = null;
    if (transformations.length > 0) {
        objectTransformation = transformations.reduceRight((a, c) => c.mult(a));
    } else {
        objectTransformation = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);
    }

    const nx = canvas.width;
    const ny = canvas.height;

    // The y coordinate is negative since we draw with pixel coordinates that start in to left and increases down.
    // If we don't do this, then for example movign the orthographic projection matrix up by increasing the value of the bottom plane results in the object also moving up instead of down as expected.
    const viewportTransformation = Matrix.fromArray([
        [nx/2,    0,    0, (nx - 1)/2],
        [   0,   -ny/2, 0, (ny - 1)/2], 
        [   0,    0,     0,         0],
        [   0,    0,    0,          1]
    ]);

    // ### Create Orthographic projection
    const leftPlane = projection.leftBottomNear.x;
    const rightPlane = projection.rightTopFar.x
    const bottomPlane = projection.leftBottomNear.y;
    const topPlane = projection.rightTopFar.y;
    const nearPlane = projection.leftBottomNear.z;
    const farPlane = projection.rightTopFar.z;

    // For some reason I have to flip the Y coordinate here. I do not have to flip it if I do not do my camera transformation.
    const orthographicProjectionTransformation = Matrix.fromArray([
        [2 / (rightPlane - leftPlane),                               0,                          0, -(rightPlane + leftPlane) / (rightPlane - leftPlane)],
        [                           0,    2 / (topPlane - bottomPlane),                          0, -(topPlane + bottomPlane) / (topPlane - bottomPlane)], 
        [                           0,                               0, 2 / (nearPlane - farPlane), -(nearPlane + farPlane) / (nearPlane - farPlane)],
        [                           0,                               0,                          0, 1]
    ])

    const perspectiveProjectionTransform = Matrix.fromArray([
        [ (2*nearPlane) / (rightPlane - leftPlane),                                         0,  (leftPlane + rightPlane)/ (rightPlane - leftPlane),                                                   0],
        [                                        0,  (2*nearPlane) / (topPlane - bottomPlane), (bottomPlane + topPlane) / (topPlane - bottomPlane),                                                   0],
        [                                        0,                                         0,     -(farPlane + nearPlane) / (farPlane - nearPlane), -(2 * farPlane * nearPlane) / (farPlane - nearPlane)],
        [                                        0,                                         0,                                                   -1,                                                   0],
    ]);


    const cameraPosition = new Vec3(camera.position.x, camera.position.y, camera.position.z);
    const cameraDirection = new Vec3(camera.direction.x, camera.direction.y, camera.direction.z);
    const cameraUp = new Vec3(camera.up.x, camera.up.y, camera.up.z);

    const cameraBasisW = cameraDirection.scale(-1).normalize();
    const cameraBasisU = cameraUp.cross(cameraBasisW).normalize();
    const cameraBasisV = cameraBasisW.cross(cameraBasisU).normalize();

    const cameraTransformation = Matrix.fromArray([
        [cameraBasisU.x, cameraBasisU.y, cameraBasisU.z, 0],
        [cameraBasisV.x, cameraBasisV.y, cameraBasisV.z, 0], 
        [cameraBasisW.x, cameraBasisW.y, cameraBasisW.z, 0],
        [0,                           0,              0, 1]
    ]).mult(Matrix.fromArray([
        [1, 0, 0, -cameraPosition.x],
        [0, 1, 0, -cameraPosition.y],
        [0, 0, 1, -cameraPosition.z],
        [0, 0, 0,                 1],
    ]));

    const projectionTransform = camera.usePerspectiveMatrix? perspectiveProjectionTransform : orthographicProjectionTransformation;
   
    const viewTransformation = viewportTransformation.mult(projectionTransform).mult(cameraTransformation);
    // const viewTransformation = viewportTransformation.mult(perspectiveProjectionTransform).mult(cameraTransformation);

    objectTransformation = viewTransformation.mult(objectTransformation);
    const transformedPoints = boxPoints.map(p => {
        const v = objectTransformation.transformVec4(p)
        return v ; //.scale(1/v[3]);
    });

    const lineLengths = 3;

    const origin = new Vec4(0, 0, 0, 1);
    const right = new Vec4(lineLengths, 0, 0, 1);
    const up = new Vec4(0, lineLengths, 0, 1);
    const near = new Vec4(0, 0, lineLengths, 1);


    const originTransform = viewTransformation.transformVec4(origin);
    const rightTransform = viewTransformation.transformVec4(right);
    const upTransform = viewTransformation.transformVec4(up);
    const nearTransform = viewTransformation.transformVec4(near);

    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.moveTo(originTransform.x, originTransform.y);
    ctx.lineTo(rightTransform.x, rightTransform.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.moveTo(originTransform.x, originTransform.y);
    ctx.lineTo(upTransform.x, upTransform.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.moveTo(originTransform.x, originTransform.y);
    ctx.lineTo(nearTransform.x, nearTransform.y);
    ctx.stroke();

    l(rightTransform)
}

function drawBox(ctx, box) {
    ctx.strokeStyle = 'black'
    ctx.beginPath();
    //  0 - 1
    ctx.moveTo(box[0].x, box[0].y)
    ctx.lineTo(box[1].x, box[1].y)
    //  1 - 2
    ctx.lineTo(box[2].x, box[2].y)
    //  2 - 3
    ctx.lineTo(box[3].x, box[3].y)
    //  3 - 0
    ctx.lineTo(box[0].x, box[0].y)
    //  0 - 4
    ctx.lineTo(box[4].x, box[4].y)
    //  4 - 5
    ctx.lineTo(box[5].x, box[5].y)
    //  5 - 6
    ctx.lineTo(box[6].x, box[6].y)
    //  6 - 7
    ctx.lineTo(box[7].x, box[7].y)
    //  7 - 4
    ctx.lineTo(box[4].x, box[4].y)
    //  1 - 5
    ctx.moveTo(box[1].x, box[1].y)
    ctx.lineTo(box[5].x, box[5].y)
    //  2 - 6
    ctx.moveTo(box[2].x, box[2].y)
    ctx.lineTo(box[6].x, box[6].y)
    //  3 - 7
    ctx.moveTo(box[3].x, box[3].y)
    ctx.lineTo(box[7].x, box[7].y)
    ctx.stroke();



    // 0 = 0,0,0 = Black
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.beginPath();
    ctx.arc(box[0].x, box[0].y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 1 = 1,0,0 = Red
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.beginPath();
    ctx.arc(box[1].x, box[1].y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 2 = 1,0,1 = Purple
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(box[2].x, box[2].y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 3 = 0,0,1 = Blue
    ctx.fillStyle = 'rgb(0,0,255)';
    ctx.beginPath();
    ctx.arc(box[3].x, box[3].y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 4 = 0,1,0 = Green
    ctx.fillStyle = 'rgb(0,255,0)';
    ctx.beginPath();
    ctx.arc(box[4].x, box[4].y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 5 = 1,1,0 = Yellow
    ctx.fillStyle = 'rgb(255,255,0)';
    ctx.beginPath();
    ctx.arc(box[5].x, box[5].y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 6 = 1,1,1 = White
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.arc(box[6].x, box[6].y, 5, 0, 2 * Math.PI);
    ctx.stroke();

    // 7 = 0,1,1 = Cyan
    ctx.fillStyle = 'rgb(0,255,255)';
    ctx.beginPath();
    ctx.arc(box[7].x, box[7].y, 5, 0, 2 * Math.PI);
    ctx.fill();
}