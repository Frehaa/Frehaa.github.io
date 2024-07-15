function pointInTriangle(point, triangle) {
    // MIRCO OPTIMIZATION?: check bounding box first
    const [alpha, beta, gamma] = pointToBarycentric(point, triangle)
    return alpha >= 0 && beta >= 0 && gamma >= 0;
}

function drawCursor(ctx, mouseState) {
    const {x, y} = mouseState.position;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y+20);
    ctx.lineTo(x+10, y+15);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill()
}
    // USE Point lock cursor
    // // Enter mouse lock mode when clicking on canvas
    // canvas.addEventListener('click', async (e) => {
    //     if (document.pointerLockElement === null) {
    //         mouseState.position = mouseEventToCanvasCoordinates(e, canvas);
    //         await canvas.requestPointerLock({ unajustedMovement: true });
    //     }
    // });

    // // Add mouse event handlers when in mouse lock mode
    // document.addEventListener("pointerlockchange", () => {
    //     if (document.pointerLockElement === canvas) {
    //         document.addEventListener("mousemove", mouseMove);
    //         document.addEventListener("mousedown", mouseDown);
    //         document.addEventListener("mouseup", mouseUp);
    //         document.addEventListener("keydown", keyDown);
    //         document.addEventListener("keyup", keyUp);

    //     } else {
    //         document.removeEventListener("mousemove", mouseMove);
    //         document.removeEventListener("mousedown", mouseDown);
    //         document.removeEventListener("mouseup", mouseUp);
    //         document.removeEventListener("keydown", keyUp);
    //     }
    // });

    // Non interactive when do not have pointer lock
    // We click, get pointerlock, add all our event listeners, update to custom mouse (should new mouse be at location? If it is easy sure)


    function mouseMoveLockCursor(e) { // LEGACY
        // Weird bug fix for problem when mouse suddenly moves too fast. 
        // if (Math.abs(e.movementX) > 200) {l('too fast', e); return}
        // if (Math.abs(e.movementY) > 200) {l('too fast', e); return}

        // TODO: Handle things with a locked curser and MovementX / MovementY mouse event properties
        if (mouseState.cameraDrag !== null) {
            camera.move(new Vec2(e.movementX * settings.cameraSpeedDrag, e.movementY * settings.cameraSpeedDrag));
        } else {
            mouseState.position.x = clamp(mouseState.position.x + e.movementX * settings.mouseSpeed, 0, camera.viewPort.width);
            mouseState.position.y = clamp(mouseState.position.y + e.movementY * settings.mouseSpeed, 0, camera.viewPort.height);
        }

        if (mouseState.dragStartPosition !== null) {
            // Find all entities in area
                const selectionBoxCornerA = canvasCoordinatesToWorldCoordinates(mouseState.position, camera);
                const selectionBoxCornerB = canvasCoordinatesToWorldCoordinates(mouseState.dragStartPosition, camera);
                const r = findEntitiesInBox(entities, selectionBoxCornerA, selectionBoxCornerB);
                entities.forEach(entity => {
                    entity.hovered = false;
                })
                r.forEach(entity => {
                    entity.hovered = true;
                });
        }
    }
