function createWireframeUI(state) {
    const container = document.createElement('div');

    const drawButton = document.createElement('button');
    drawButton.style = 'margin: 0px 475px; display:block;'
    drawButton.addEventListener('click', () => { drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes) })
    drawButton.innerHTML = 'Draw!';
    container.appendChild(drawButton);


    const cameraSettingsContainer = createCameraSettingsContainer(state); 
    cameraSettingsContainer.style = 'border: 1px solid black;margin: 5px;display:inline-block;'
    container.appendChild(cameraSettingsContainer);
    
    const objectTransformationContainer = createObjectTransformationSettingsContainer(state);
    objectTransformationContainer.style = 'border: 1px solid black;margin: 5px;display:inline-block;'
    container.appendChild(objectTransformationContainer);

    const projectionSettingsContainer = createProjectionSettingsContainer(state); 
    projectionSettingsContainer.style = 'border: 1px solid black;margin: 5px;display:inline-block;'
    container.appendChild(projectionSettingsContainer);

    document.body.appendChild(container);
}

function createXyzSettingContainer(state, setting, headerText) {
    const container = document.createElement('div');

    const cameraPosX = document.createElement('input');
    cameraPosX.value = setting.x;
    cameraPosX.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        setting.x = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const cameraPosY = document.createElement('input');
    cameraPosY.value = setting.y;
    cameraPosY.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        setting.y = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const cameraPosZ = document.createElement('input');
    cameraPosZ.value = setting.z;
    cameraPosZ.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        setting.z = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const containerHeader = document.createElement('p');
    containerHeader.innerHTML = headerText + ": X - Y - Z";

    container.appendChild(containerHeader);
    container.appendChild(cameraPosX);
    container.appendChild(cameraPosY);
    container.appendChild(cameraPosZ);

    return container;
}

function createCameraSettingsContainer(state) {
    const container = document.createElement('div');
    const text = document.createElement('p');
    text.innerHTML = "Camera Settings";
    container.append(text)

    const toggleText = document.createElement('p');
    toggleText.innerHTML = 'Turn on Perspective';
    container.append(toggleText);
    container.appendChild(createCameraProjectionToggle(state));

    container.appendChild(createXyzSettingContainer(state, state.camera.position, "Camera Position"));
    container.appendChild(createXyzSettingContainer(state, state.camera.direction, "Camera Direction"));
    container.appendChild(createXyzSettingContainer(state, state.camera.up, "Camera Up"));
    // container.appendChild(createCameraDirContainer(state));
    // container.appendChild(createCameraUpContainer(state));

    return container;
}

function createCameraProjectionToggle(state) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.addEventListener('change', e => {
        state.camera.usePerspectiveMatrix = e.target.checked;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    })

    return input
}

function createProjectionSettingsContainer(state) {
    const container = document.createElement('div');
    const text = document.createElement('p');
    text.innerHTML = "Projection Settings";
    container.append(text)

    container.appendChild(createXyzSettingContainer(state, state.projectionPlanes.leftBottomNear, "Left Bottom Near"));
    container.appendChild(createXyzSettingContainer(state, state.projectionPlanes.rightTopFar, "Right Top Far"));
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

        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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

        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const yInput = document.createElement('input');
    yInput.value = 0;
    yInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        translateTransformation.y = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const zInput = document.createElement('input');
    zInput.value = 0;
    zInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        translateTransformation.z = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const yInput = document.createElement('input');
    yInput.value = 1;
    yInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        scaleTransformation.y = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
    });

    const zInput = document.createElement('input');
    zInput.value = 1;
    zInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value); 
        scaleTransformation.z = value;
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        drawWireframeSceneFromState(state.camera, state.objects, state.projectionPlanes);
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
        const transformation = {transformationPosition: transformationsContainer.children.length, x: 1, y: 1, z: 1, constructor: (t) => { return createScaleMatrix(t.x, t.y, t.z); }};
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