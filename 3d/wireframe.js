function createTranslationMatrix(x, y, z) {
    return Matrix.fromArray([
            [1, 0, 0, x],
            [0, 1, 0, y],
            [0, 0, 1, z],
            [0, 0, 0, 1],
        ]);
}
function createScaleMatrix(x, y, z) {
    return Matrix.fromArray([
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1],
        ]);
}

function createRotateXMatrix(degrees) { 
    const radians = degreesToRadians(degrees);
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    return Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);
}

function createRotateYMatrix(degrees) { 
    const radians = degreesToRadians(degrees);
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    return Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
}
function createRotateZMatrix(degrees) { 
    const radians = degreesToRadians(degrees);
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    return Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);
}

function drawDefaultWireframeScene() {
    // So say we have a box inside the canonical box thingy
    // This means all its points are in the interval [-1, 1] on the x, y, and z axis
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // X, Y, Z
    // X jjjjjj


    const box = [
        new Vec4(0,0,0, 1),
        new Vec4(1,0,0, 1),
        new Vec4(1,0,1, 1),
        new Vec4(0,0,1, 1),
        new Vec4(0,1,0, 1),
        new Vec4(1,1,0, 1),
        new Vec4(1,1,1, 1),
        new Vec4(0,1,1, 1),
    ];


    // const box = [
    //     new Vec4(-0.75, -0.75, -0.75, 1),
    //     new Vec4(0.75, -0.75, -0.75, 1),
    //     new Vec4(0.75, 0.75, -0.75, 1),
    //     new Vec4(-0.75, 0.75, -0.75, 1),
    //     new Vec4(-0.75, -0.75, 0.75, 1),
    //     new Vec4(0.75, -0.75, 0.75, 1),
    //     new Vec4(0.75, 0.75, 0.75, 1),
    //     new Vec4(-0.75, 0.75, 0.75, 1),
    // ];

    // const box = [
    //     new Vec4(-0.75, -0.75, -0.75, 1),
    //     new Vec4(0.75, -0.75, -0.75, 1),
    //     new Vec4(0.85, 0.75, -0.65, 1),
    //     new Vec4(-0.65, 0.75, -0.65, 1),
    //     new Vec4(-0.75, -0.75, 0.75, 1),
    //     new Vec4(0.75, -0.75, 0.75, 1),
    //     new Vec4(0.85, 0.75, 0.85, 1),
    //     new Vec4(-0.65, 0.75, 0.85, 1),
    // ];


    const c = Math.cos(0.4)
    const s = Math.sin(0.4)
    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const scale = Matrix.fromArray([
            [1.1,   0,   0, 0],
            [  0, 1.1,   0, 0],
            [  0,   0, 1.1, 0],
            [  0,   0,   0, 1],
        ]);
    const originCenterTranslate = Matrix.fromArray([
            [1, 0, 0, -0.5],
            [0, 1, 0, -0.5],
            [0, 0, 1, -0.5],
            [0, 0, 0, 1],
        ]);
    const translate = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);


    // Current issue is that when I translate the object's y coordinate up such that it should be inside the orthographic projection box, then it moves down. 


    const nx = canvas.width;
    const ny = canvas.height;

    // The y coordinate is negative since we draw with pixel coordinates that start in to left and increases down.
    // If we don't do this, then for example movign the orthographic projection matrix up by increasing the value of the bottom plane results in the object also moving up instead of down as expected.
    const viewportTransformation = Matrix.fromArray([
        [nx/2,    0,    0, (nx - 1)/2],
        [   0,   -ny/2, 0, (ny - 1)/2], 
        [   0,    0,     0,          0],
        [   0,    0,    0,          1]
    ]);

    // ### Create Orthographic projection
    const leftPlane = -2;
    const rightPlane = 2
    const bottomPlane = -2;
    const topPlane = 2;
    const nearPlane = 1
    const farPlane = -1;

    // For some reason I have to flip the Y coordinate here. I do not have to flip it if I do not do my camera transformation.
    const orthographicProjectionTransformation = Matrix.fromArray([
        [2 / (rightPlane - leftPlane),                               0,                          0, -(rightPlane + leftPlane) / (rightPlane - leftPlane)],
        [                           0,    2 / (topPlane - bottomPlane),                          0, -(topPlane + bottomPlane) / (topPlane - bottomPlane)], 
        [                           0,                               0, 2 / (nearPlane - farPlane), -(nearPlane + farPlane) / (nearPlane - farPlane)],
        [                           0,                               0,                          0, 1]
    ])


    // const objectTransformation = translate.mult(scale).mult(rotateZ).mult(rotateX).mult(rotateY).mult(originCenterTranslate)
    const objectTransformation = originCenterTranslate;


    const cameraPosition = new Vec3(0, 0, 0);
    const cameraDirection = new Vec3(0, 0, 1);
    const cameraUp = new Vec3(0, 1, 0);

    const cameraBasisW = cameraDirection.scale(-1).normalize();
    const cameraBasisU = cameraUp.cross(cameraBasisW).scale(-1).normalize();
    const cameraBasisV = cameraBasisW.cross(cameraBasisU).scale(-1).normalize();

    const cameraTransformation = Matrix.fromArray([
        [cameraBasisU.x, cameraBasisU.y, cameraBasisU.z, 0],
        [cameraBasisV.x, cameraBasisV.y, cameraBasisV.z, 0], 
        [cameraBasisW.x, cameraBasisW.y, cameraBasisW.z, 0],
        [0, 0, 0, 1]
    ]).mult(Matrix.fromArray([
        [1, 0, 0, -cameraPosition.x],
        [0, 1, 0, -cameraPosition.y],
        [0, 0, 1, -cameraPosition.z],
        [0, 0, 0,                 1],
    ]));
    


    // const transformation = rotateZ.mult(rotateX).mult(rotateY).mult(viewportTransformation);
    const transformation = viewportTransformation.mult(orthographicProjectionTransformation).mult(objectTransformation)
    // Theory: This applies the transformations in the order from right to left. So we rotate, scale, translate, and the transform to the viewport

    const transformedBox = [];

    for (let i = 0; i < box.length; i++) {
        const point = box[i];
        const transformedPoint = transformation.transformVec4(point);
        transformedBox.push(transformedPoint);
    }


    drawBox(ctx, transformedBox);

}

function wireframeMain() {

    run_tests();


    drawDefaultWireframeScene();


    const state = {        
        camera: { 
            position: {x: 0, y: 0, z: 0},
            direction: {x: 0, y: 0, z: -1},
            up: {x: 0, y: 1, z: 0}
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

    createUI(state);
}


function createCameraPosContainer(state) {
    const container = document.createElement('div');

    const cameraPosX = document.createElement('input');
    cameraPosX.value = state.camera.position.x;
    cameraPosX.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.position.x = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const cameraPosY = document.createElement('input');
    cameraPosY.value = state.camera.position.y;
    cameraPosY.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.position.y = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const cameraPosZ = document.createElement('input');
    cameraPosZ.value = state.camera.position.z;
    cameraPosZ.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.position.z = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = "Camera Position: X - Y - Z";

    container.appendChild(containerHeader);
    container.appendChild(cameraPosX);
    container.appendChild(cameraPosY);
    container.appendChild(cameraPosZ);

    return container;
}

function createCameraDirContainer(state) {
    const container = document.createElement('div');

    const cameraDirX = document.createElement('input');
    cameraDirX.value = state.camera.direction.x;
    cameraDirX.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.direction.x = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const cameraDirY = document.createElement('input');
    cameraDirY.value = state.camera.direction.y;
    cameraDirY.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.direction.y = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const cameraDirZ = document.createElement('input');
    cameraDirZ.value = state.camera.direction.z;
    cameraDirZ.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.direction.z = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = "Camera Direction: X - Y - Z";

    container.appendChild(containerHeader);
    container.appendChild(cameraDirX);
    container.appendChild(cameraDirY);
    container.appendChild(cameraDirZ);

    return container;
}

function createCameraUpContainer(state) {
    const container = document.createElement('div');

    const cameraUpX = document.createElement('input');
    cameraUpX.value = 0;
    cameraUpX.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.up.x = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const cameraUpY = document.createElement('input');
    cameraUpY.value = 1;
    cameraUpY.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.up.y = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const cameraUpZ = document.createElement('input');
    cameraUpZ.value = 0;
    cameraUpZ.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        state.camera.up.z = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = "Camera Up: X - Y - Z";

    container.appendChild(containerHeader);
    container.appendChild(cameraUpX);
    container.appendChild(cameraUpY);
    container.appendChild(cameraUpZ);

    return container;
}

function createCameraSettingsContainer(state) {
    const container = document.createElement('div');
    const text = document.createElement('p');
    text.innerHTML = "Camera Settings";
    container.append(text)

    container.appendChild(createCameraPosContainer(state));
    container.appendChild(createCameraDirContainer(state));
    container.appendChild(createCameraUpContainer(state));

    return container;

}

function createUpButton(container, state, transformation) {
    const upButton = document.createElement('button');
    upButton.innerHTML = '↑'
    upButton.addEventListener('click', () => {
        const idx = transformation.transformationPosition;
        if (idx === 0) { return; } // Already at top


        // Swap in state
        const tmp = state.objects[0].transformations[idx - 1];
        state.objects[0].transformations[idx - 1] = state.objects[0].transformations[idx];
        state.objects[0].transformations[idx] = tmp;

        // Swap in UI 
        const parent = container.parentNode;
        parent.insertBefore(parent.children[idx], parent.children[idx-1]);

        state.objects[0].transformations[idx - 1].transformationPosition = idx - 1;
        state.objects[0].transformations[idx].transformationPosition = idx;

        l(transformation.transformationPosition)
        drawWireframeSceneFromState(state.camera, state.objects)
    })
    return upButton;
}

function createDownButton(container, state, transformation) {
    const upButton = document.createElement('button');
    upButton.innerHTML = '↓'
    upButton.addEventListener('click', () => {
        const idx = transformation.transformationPosition;
        if (idx === state.objects[0].transformations.length - 1) { return; } // Already at bottom. 

        // Swap in state
        const tmp = state.objects[0].transformations[idx + 1];
        state.objects[0].transformations[idx + 1] = state.objects[0].transformations[idx];
        state.objects[0].transformations[idx] = tmp;

        // Swap in UI 
        const parent = container.parentNode;
        parent.insertBefore(parent.children[idx+1], parent.children[idx]);

        state.objects[0].transformations[idx + 1].transformationPosition = idx + 1;
        state.objects[0].transformations[idx].transformationPosition = idx;

        l(transformation.transformationPosition)
        drawWireframeSceneFromState(state.camera, state.objects)
    })
    return upButton;
}

function createTranslateTransformationContainer(state, translateTransformation) {
    const container = document.createElement('div');

    const xInput = document.createElement('input');
    xInput.value = 0;
    xInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        translateTransformation.x = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const yInput = document.createElement('input');
    yInput.value = 0;
    yInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        translateTransformation.y = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const zInput = document.createElement('input');
    zInput.value = 0;
    zInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        translateTransformation.z = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = "Translate: X - Y - Z";

    const upButton = createUpButton(container, state, translateTransformation);
    const downButton = createDownButton(container, state, translateTransformation);
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'X'
    deleteButton.addEventListener('click', () => {
        // Slow delete which moves every item back. This is necessary to make sure their position id correspond to their position in the array and UI. A smarter solution may exist but this was simple. 
        const transformations = state.objects[0].transformations;
        for (let i = translateTransformation.transformationPosition + 1; i < transformations.length; i++) {
            transformations[i].transformationPosition = i - 1;
            transformations[i - 1] = transformations[i];
        }
        transformations.pop();
        container.parentNode.removeChild(container);
        drawWireframeSceneFromState(state.camera, state.objects)
    })

    container.appendChild(containerHeader);
    container.appendChild(upButton);
    container.appendChild(downButton);
    container.appendChild(xInput);
    container.appendChild(yInput);
    container.appendChild(zInput);
    container.appendChild(deleteButton);

    return container;
}

function createScaleTransformationContainer(state, scaleTransformation) {
    const container = document.createElement('div');

    const xInput = document.createElement('input');
    xInput.value = 1;
    xInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        scaleTransformation.x = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const yInput = document.createElement('input');
    yInput.value = 1;
    yInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        scaleTransformation.y = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const zInput = document.createElement('input');
    zInput.value = 1;
    zInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        scaleTransformation.z = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = "Scale: X - Y - Z";

    const upButton = createUpButton(container, state, scaleTransformation);
    const downButton = createDownButton(container, state, scaleTransformation);
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'X'
    deleteButton.addEventListener('click', () => {
        // Slow delete which moves every item back. This is necessary to make sure their position id correspond to their position in the array and UI. A smarter solution may exist but this was simple. 
        const transformations = state.objects[0].transformations;
        for (let i = scaleTransformation.transformationPosition + 1; i < transformations.length; i++) {
            transformations[i].transformationPosition = i - 1;
            transformations[i - 1] = transformations[i];
        }
        transformations.pop();
        container.parentNode.removeChild(container);
        drawWireframeSceneFromState(state.camera, state.objects)
    })

    container.appendChild(containerHeader);
    container.appendChild(upButton);
    container.appendChild(downButton);
    container.appendChild(xInput);
    container.appendChild(yInput);
    container.appendChild(zInput);
    container.appendChild(deleteButton);

    return container;
}

function createRotateTransformationContainer(state, transformation, headerText) {
    const container = document.createElement('div');

    const degreesInput = document.createElement('input');
    degreesInput.value = 0;
    degreesInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        transformation.degrees = value;
        drawWireframeSceneFromState(state.camera, state.objects)
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = headerText;

    const upButton = createUpButton(container, state, transformation);
    const downButton = createDownButton(container, state, transformation);
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'X'
    deleteButton.addEventListener('click', () => {
        // Slow delete which moves every item back. This is necessary to make sure their position id correspond to their position in the array and UI. A smarter solution may exist but this was simple. 
        const transformations = state.objects[0].transformations;
        for (let i = transformation.transformationPosition + 1; i < transformations.length; i++) {
            transformations[i].transformationPosition = i - 1;
            transformations[i - 1] = transformations[i];
        }
        transformations.pop();
        container.parentNode.removeChild(container);
        drawWireframeSceneFromState(state.camera, state.objects)
    })

    container.appendChild(containerHeader);
    container.appendChild(upButton);
    container.appendChild(downButton);
    container.appendChild(degreesInput);
    container.appendChild(deleteButton);

    return container;
}


function createObjectTransformationSettingsContainer(state) {
    const container = document.createElement('div');
    const transformationsContainer =  document.createElement('div');
    let counter = 1;

    const addTranslateTransformationButton = document.createElement('button');
    addTranslateTransformationButton.innerHTML = "Add Translate";
    addTranslateTransformationButton.addEventListener('click', () => {
        const transformation = {transformationPosition: transformationsContainer.children.length, x: 0, y: 0, z: 0, constructor: (t) => { return createTranslationMatrix(t.x, t.y, t.z); }};
        state.objects[0].transformations.push(transformation);
        const container = createTranslateTransformationContainer(state, transformation);
        transformationsContainer.appendChild(container);
    })

    const addScaleTransformationButton = document.createElement('button');
    addScaleTransformationButton.innerHTML = "Add Scale";
    addScaleTransformationButton.addEventListener('click', () => { 
        const transformation = {transformationPosition: transformationsContainer.children.length, x: 0, y: 0, z: 0, constructor: (t) => { return createScaleMatrix(t.x, t.y, t.z); }};
        state.objects[0].transformations.push(transformation);
        const container = createScaleTransformationContainer(state, transformation);
        transformationsContainer.appendChild(container);
    });

    const addRotateXTransformationButton = document.createElement('button');
    addRotateXTransformationButton.innerHTML = "Add Rotate X";
    addRotateXTransformationButton.addEventListener('click', () => {
        const transformation = {transformationPosition: transformationsContainer.children.length, degrees: 0, constructor: (t) => { return createRotateXMatrix(t.degrees); }};
        state.objects[0].transformations.push(transformation);
        const container = createRotateTransformationContainer(state, transformation, 'Rotate X: degrees');
        transformationsContainer.appendChild(container);
    })

    const addRotateYTransformationButton = document.createElement('button');
    addRotateYTransformationButton.innerHTML = "Add Rotate Y";
    addRotateYTransformationButton.addEventListener('click', () => {
        const transformation = {transformationPosition: transformationsContainer.children.length, degrees: 0, constructor: (t) => { return createRotateYMatrix(t.degrees); }};
        state.objects[0].transformations.push(transformation);
        const container = createRotateTransformationContainer(state, transformation, 'Rotate Y: degrees');
        transformationsContainer.appendChild(container);

    })


    const addRotateZTransformationButton = document.createElement('button');
    addRotateZTransformationButton.innerHTML = "Add Rotate Z";
    addRotateZTransformationButton.addEventListener('click', () => {
        const transformation = {transformationPosition: transformationsContainer.children.length, degrees: 0, constructor: (t) => { return createRotateZMatrix(t.degrees); }};
        state.objects[0].transformations.push(transformation);
        const container = createRotateTransformationContainer(state, transformation, 'Rotate Z: degrees');
        transformationsContainer.appendChild(container);

    })


    container.appendChild(addTranslateTransformationButton);
    container.appendChild(addScaleTransformationButton);
    container.appendChild(addRotateXTransformationButton);
    container.appendChild(addRotateYTransformationButton);
    container.appendChild(addRotateZTransformationButton);

    container.appendChild(transformationsContainer);

    return container;
}

function createUI(state) {
    const container = document.createElement('div');

    const drawButton = document.createElement('button');
    drawButton.style = 'margin: 0px 475px; display:block;'
    drawButton.addEventListener('click', () => { drawWireframeSceneFromState(state.camera, state.objects) })
    drawButton.innerHTML = 'Draw!';
    container.appendChild(drawButton);


    const cameraSettingsContainer = createCameraSettingsContainer(state); 
    cameraSettingsContainer.style = 'border: 1px solid black;margin: 5px;display:inline-block;'
    container.appendChild(cameraSettingsContainer);
    
    const objectTransformationContainer = createObjectTransformationSettingsContainer(state);
    objectTransformationContainer.style = 'border: 1px solid black;margin: 0px;display:inline-block;'
    container.appendChild(objectTransformationContainer);

    document.body.appendChild(container);
}

function drawWireframeSceneFromState(camera, objects) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    ctx.clear();

    const boxPoints = objects[0].points;
    const transformations = objects[0].transformations.map(c => c.constructor(c));
    let objectTransformation = Matrix.fromArray([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]);
    if (transformations.length > 0) {
        objectTransformation = transformations.reduceRight((a, c) => c.mult(a));
    }

    const nx = canvas.width;
    const ny = canvas.height;

    // The y coordinate is negative since we draw with pixel coordinates that start in to left and increases down.
    // If we don't do this, then for example movign the orthographic projection matrix up by increasing the value of the bottom plane results in the object also moving up instead of down as expected.
    const viewportTransformation = Matrix.fromArray([
        [nx/2,    0,    0, (nx - 1)/2],
        [   0,   -ny/2, 0, (ny - 1)/2], 
        [   0,    0,     0,          0],
        [   0,    0,    0,          1]
    ]);

    // ### Create Orthographic projection
    const leftPlane = -2;
    const rightPlane = 2
    const bottomPlane = -2;
    const topPlane = 2;
    const nearPlane = 1
    const farPlane = -1;

    // For some reason I have to flip the Y coordinate here. I do not have to flip it if I do not do my camera transformation.
    const orthographicProjectionTransformation = Matrix.fromArray([
        [2 / (rightPlane - leftPlane),                               0,                          0, -(rightPlane + leftPlane) / (rightPlane - leftPlane)],
        [                           0,    2 / (topPlane - bottomPlane),                          0, -(topPlane + bottomPlane) / (topPlane - bottomPlane)], 
        [                           0,                               0, 2 / (nearPlane - farPlane), -(nearPlane + farPlane) / (nearPlane - farPlane)],
        [                           0,                               0,                          0, 1]
    ])


    const transformation = viewportTransformation.mult(orthographicProjectionTransformation).mult(objectTransformation);
    const transformedPoints = boxPoints.map(p => transformation.transformVec4(p));


    drawBox(ctx, transformedPoints);

}


function drawBox(ctx, box) {
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



/// ############################################ TESTS ############################################
// TODO: MOVE THESE TO MATH TESTS? 

function run_tests() {
    const tests = [
        test_rotation_does_not_move_0_0_0,
        test_x_rotation_does_not_move_1_0_0,
        test_90_degree_z_rotation_moves_1_0_0_to_0_1_0,
        test_90_degree_y_rotation_moves_1_0_0_to_0_0_1,
        test_y_rotations_does_not_move_0_1_0,
        test_90_degree_x_rotation_moves_0_1_0_to_0_0_1,
        test_90_degree_z_rotation_moves_0_1_0_to_neg1_0_0,
        test_z_rotations_does_not_move_0_0_1,
        test_90_degree_x_rotation_moves_0_0_1_to_0_neg1_0,
        test_90_degree_y_rotation_moves_0_0_1_to_1_0_0
    ]

    for (const test of tests) {
        try {
            test(); 
        } catch (error) {
            l(test.name ,error);
        }
    }
}

function test_rotation_does_not_move_0_0_0() {
    const c = Math.cos(0.4)
    const s = Math.sin(0.4)
    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 0, 0, 1);

    const resultX = rotateX.transformVec4(point);
    assert (resultX.x == 0 && resultX.y == 0 && resultX.z == 0 && resultX.r == 1, `Incorrect transformation: Expected (0, 0, 0, 1) but was (${resultX.x}, ${resultX.y}, ${resultX.z}, ${resultX.r})`);
    const resultY = rotateY.transformVec4(point);
    assert (resultY.x == 0 && resultY.y == 0 && resultY.z == 0 && resultY.r == 1, `Incorrect transformation: Expected (0, 0, 0, 1) but was (${resultY.x}, ${resultY.y}, ${resultY.z}, ${resultY.r})`);
    const resultZ = rotateZ.transformVec4(point);
    assert (resultZ.x == 0 && resultZ.y == 0 && resultZ.z == 0 && resultZ.r == 1, `Incorrect transformation: Expected (0, 0, 0, 1) but was (${resultZ.x}, ${resultZ.y}, ${resultZ.z}, ${resultZ.r})`);
}

function test_x_rotation_does_not_move_1_0_0() {
    const c = 0;
    const s = 1;

    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(1, 0, 0, 1);
    const result = rotateX.transformVec4(point);
    const expected = new Vec4(1, 0, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_90_degree_z_rotation_moves_1_0_0_to_0_1_0() {
    const c = 0;
    const s = 1;

    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(1, 0, 0, 1);
    const result = rotateZ.transformVec4(point);
    const expected = new Vec4(0, 1, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_90_degree_y_rotation_moves_1_0_0_to_0_0_1() {
    const c = 0;
    const s = 1;

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const point = new Vec4(1, 0, 0, 1);
    const result = rotateY.transformVec4(point);
    const expected = new Vec4(0, 0, -1, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_y_rotations_does_not_move_0_1_0() {
    const c = 0;
    const s = 1;

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const point = new Vec4(0, 1, 0, 1);
    const result = rotateY.transformVec4(point);
    const expected = new Vec4(0, 1, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_90_degree_x_rotation_moves_0_1_0_to_0_0_1() {
    const c = 0;
    const s = 1;

    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 1, 0, 1);
    const result = rotateX.transformVec4(point);
    const expected = new Vec4(0, 0, 1, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}
function test_90_degree_z_rotation_moves_0_1_0_to_neg1_0_0() {
    const c = 0;
    const s = 1;

    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 1, 0, 1);
    const result = rotateZ.transformVec4(point);
    const expected = new Vec4(-1, 0, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_z_rotations_does_not_move_0_0_1() {
    const c = 0;
    const s = 1;

    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 0, 1, 1);
    const result = rotateZ.transformVec4(point);
    const expected = new Vec4(0, 0, 1, 1);
    assert (result.equal(expected), `${this.name}, Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}
function test_90_degree_x_rotation_moves_0_0_1_to_0_neg1_0() {
    const c = 0;
    const s = 1;

    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 0, 1, 1);
    const result = rotateX.transformVec4(point);
    const expected = new Vec4(0, -1, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}
function test_90_degree_y_rotation_moves_0_0_1_to_1_0_0() {
    const c = 0;
    const s = 1;

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const point = new Vec4(0, 0, 1, 1);
    const result = rotateY.transformVec4(point);
    const expected = new Vec4(1, 0, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}