'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

// TODO: Translate screen space to canvas space

function clamp(min, max, v) {
    return Math.min(max, Math.max(min, v));
}

const mouseState = {
    dragStartPosition: null, // 
    position: {x: 0, y: 0},
    cameraDrag: null
}

const camera = {
    position: {x: 0, y: 0},
    viewPort: {width: 1920, height: 1080}
}

const entities = [];

const world = {
    // How can we quickly represent a simple 2 dimensional world? (How should we extend this to 3D? Should we even do that? Why? Let us put in the maybe)
    // We can represent the world as a series of polygons 
    // Maybe the easiest first thing to do is to represent it as a 2 dimensional array with blocks

    map: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2],
        [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
        [2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 2],
        [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 2],
        [2, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 2],
        [2, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 1, 2, 2, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 2, 1, 0, 1, 1, 0, 2],
        [2, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 2, 1, 0, 1, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 1, 0, 0, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 1, 1, 1, 1, 0, 2],
        [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ]

}

// TODO: Customizable selection box

function drawSelectionBox(ctx, start, end) {
    const width = end.x - start.x;
    const height = end.y - start.y;
    ctx.fillStyle = `rgba(128, 0, 0, 0.5)`
    ctx.strokeStyle = `rgba(128, 0, 0, 0.9)`
    ctx.fillRect(start.x, start.y, width, height);
    ctx.strokeRect(start.x, start.y, width, height);
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

function draw(t) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save()

    for (const entity of entities) {
        entity.draw(ctx, camera);
    }

    ctx.restore()
    if (mouseState.dragStartPosition !== null) {
        drawSelectionBox(ctx, mouseState.dragStartPosition, mouseState.position);
        l(mouseState.dragStartPosition, mouseState.position)
    }

    if (document.pointerLockElement === canvas && mouseState.cameraDrag === null) {
        drawCursor(ctx, mouseState);
    }

    requestAnimationFrame(draw);
}

function mouseEventToCanvasCoordinates(e, canvas) {
    return {
        x: e.pageX * (canvas.width / canvas.clientWidth),
        y: e.pageY * (canvas.height / canvas.clientHeight)
    };
}

function canvasCoordinatesToWorldCoordinates(coords, camera) {
    return {
        x: coords.x + camera.position.x - camera.canvas.width/2,
        y: coords.y + camera.position.y - camera.canvas.height/2
    };
}


function initialize() {
    const canvas = document.getElementById('canvas');
    camera.canvas = canvas;

    function circleDraw(position, ctx, camera) {
        const x = position.x - camera.position.x + canvas.width/2;
        const y = position.y - camera.position.y + canvas.height/2;
        ctx.fillStyle = 'blue'
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill()
    }

    const entity = {
        position: {x: 0, y: 0},
        draw: (ctx, camera) => {circleDraw(entity.position, ctx, camera)},
    }
    entities.push(entity)

    // Prevent right click from opening context menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Enter mouse lock mode when clicking on canvas
    canvas.addEventListener('click', async (e) => {
        if (document.pointerLockElement === null) {
            mouseState.position = mouseEventToCanvasCoordinates(e, canvas);
            await canvas.requestPointerLock({ unajustedMovement: true });
        }
    });

    // Add mouse event handlers when in mouse lock mode
    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === canvas) {
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mousedown", mouseDown);
            document.addEventListener("mouseup", mouseUp);
        } else {
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mousedown", mouseDown);
            document.removeEventListener("mouseup", mouseUp);
        }
    });

    // Non interactive when do not have pointer lock
    // We click, get pointerlock, add all our event listeners, update to custom mouse (should new mouse be at location? If it is easy sure)
    // 

    function mouseDown(e) {
        l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: { // TODO: Movement should be done every frame after pressing down, not until it starts repeating
                l(mouseState.position)
                mouseState.dragStartPosition = { ...mouseState.position };
            } break;
            case MOUSE_MIDDLE_BUTTON: {
               mouseState.cameraDrag = { ...mouseState.position };
               e.preventDefault()
            } break;
            case MOUSE_RIGHT_BUTTON: {
                const newEntity = {
                    position: canvasCoordinatesToWorldCoordinates(mouseState.position, camera),
                    draw: (ctx, camera) => circleDraw(newEntity.position, ctx, camera),
                }
                entities.push(newEntity)
                l(entities)
            } break;
            default: {}
        }

    }

    function mouseUp(e) {
        l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
                mouseState.dragStartPosition = null;
            } break;
            case MOUSE_MIDDLE_BUTTON: {
                mouseState.cameraDrag = null;

            } break;
        }
    }

    const settings = {
        cameraSpeedDrag: 0.2,
        cameraSpeedArrow: 10,
        mouseSpeed: 1
    }
    
    var highestXDiff = 0;
    var highestYDiff = 0;
    function mouseMove(e) {
        // Weird bug fix. 
        if (Math.abs(e.movementX) > 100) {l(e); return}
        if (Math.abs(e.movementY) > 100) {l(e); return}

        // TODO: Handle things with a locked curser and MovementX / MovementY mouse event properties
        if (mouseState.cameraDrag !== null) {

        } else {
            highestXDiff = Math.max(highestXDiff, Math.abs(e.movementX));
            highestYDiff = Math.max(highestYDiff, Math.abs(e.movementY));
            mouseState.position.x = clamp(0, 1920, mouseState.position.x + e.movementX * settings.mouseSpeed);
            mouseState.position.y = clamp(0, 1080, mouseState.position.y + e.movementY * settings.mouseSpeed);
            // l(highestXDiff, highestYDiff)
        }

        // if (mouseState.cameraDrag !== null) { // TODO: mouse position should not move
        //     const diffX = mouseState.position.x - mouseState.cameraDrag.x;
        //     const diffY = mouseState.position.y - mouseState.cameraDrag.y;
        //     camera.position.x += diffX * settings.cameraSpeedDrag;
        //     camera.position.y += diffY * settings.cameraSpeedDrag;

        //     mouseState.cameraDrag = mouseState.position;
        // }

    }

    document.addEventListener('keydown', function(e) {
        if (e.key === "ArrowRight") {
            camera.position.x += settings.cameraSpeedArrow;
        }
        else if (e.key === "ArrowLeft") {
            camera.position.x -= settings.cameraSpeedArrow;
        }
        else if (e.key === "ArrowUp") {
            camera.position.y -= settings.cameraSpeedArrow;
        }
        else if (e.key === "ArrowDown") {
            camera.position.y += settings.cameraSpeedArrow;
        }

    })


    requestAnimationFrame(draw);
}