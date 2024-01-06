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
    width: 20,
    height: 20,
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

function drawWorld(ctx, world, camera) {
    const squarePixelSize = 100;
    ctx.strokeStyle = 'black'
    for (let x = 0; x < world.width; x++) {
        for (let y = 0; y < world.height; y++) {
            switch (world.map[y][x]) {
                case 2: {
                    ctx.fillStyle = 'gray';
                } break;
                case 1: {
                    ctx.fillStyle = 'blue';
                } break;
                case 0: {
                    ctx.fillStyle = 'green';
                } break;
                default: {
                    l('Unknown map square', world.map[y][x])
                }
            }
            ctx.fillRect(x * squarePixelSize - camera.position.x, y * squarePixelSize - camera.position.y, squarePixelSize, squarePixelSize);
            // ctx.strokeRect(x * squarePixelSize - camera.position.x, y * squarePixelSize - camera.position.y, squarePixelSize, squarePixelSize);
        }
    }
}

// TODO: Draw map
// We first ignore camera and just say that 
function draw(t) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save()

    drawWorld(ctx, world, camera)

    ctx.translate(-camera.position.x, -camera.position.y)
    for (const entity of entities) {
        entity.draw(ctx);
    }

    ctx.restore()
    if (mouseState.dragStartPosition !== null) {
        drawSelectionBox(ctx, mouseState.dragStartPosition, mouseState.position);
        // l(mouseState.dragStartPosition, mouseState.position)
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
        x: coords.x + camera.position.x,
        y: coords.y + camera.position.y
    };
}

class Entity {
    constructor(x, y) {
        this.position = {x, y};
        this.selected = false;
        this.hovered = false;
    }

    draw(ctx) {
        ctx.fillStyle = 'blue'
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 30, 0, 2 * Math.PI);
        ctx.fill()
        if (this.selected) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3
            ctx.stroke();
        }
        else if (this.hovered) {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 3
            ctx.stroke();
        }
    }
}

function initialize() {
    const canvas = document.getElementById('canvas');
    camera.canvas = canvas;

    const entity = new Entity(250, 100)
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
                const position = canvasCoordinatesToWorldCoordinates(mouseState.position, camera);
                const newEntity = new Entity(position.x, position.y);
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
                const selectionBoxCornerA = canvasCoordinatesToWorldCoordinates(mouseState.position, camera);
                const selectionBoxCornerB = canvasCoordinatesToWorldCoordinates(mouseState.dragStartPosition, camera);
                const r = findEntitiesInBox(entities, selectionBoxCornerA, selectionBoxCornerB);
                l('lift', r)
                r.forEach(entity => {
                    entity.hovered = false;
                    entity.selected = true;
                })
                mouseState.dragStartPosition = null;
            } break;
            case MOUSE_MIDDLE_BUTTON: {
                mouseState.cameraDrag = null;

            } break;
        }
    }

    function findEntitiesInBox(entities, topLeft, bottomRight) {
        if (topLeft.x > bottomRight.x) {
            const tmp = topLeft.x;
            topLeft.x = bottomRight.x;
            bottomRight.x = tmp;
        }
        if (topLeft.y > bottomRight.y) {
            const tmp = topLeft.y;
            topLeft.y = bottomRight.y;
            bottomRight.y = tmp;
        }

        const result = [];
        for (const entity of entities) {
            if (topLeft.x <= entity.position.x && entity.position.x <= bottomRight.x &&
                topLeft.y <= entity.position.y && entity.position.y <= bottomRight.y)  
                {
                    result.push(entity);
                }
        }
        return result;
    }

    l(findEntitiesInBox(entities, {x: 0, y: 0}, {x:1000, y: 1000}))
    l(findEntitiesInBox(entities, {x: 500, y: 500}, {x:1000, y: 1000}))

    const settings = {
        cameraSpeedDrag: 2,
        cameraSpeedArrow: 10,
        mouseSpeed: 1
    }
    
    var highestXDiff = 0;
    var highestYDiff = 0;
    function mouseMove(e) {
        // Weird bug fix for problem when mouse suddenly moves too fast. 
        if (Math.abs(e.movementX) > 100) {l('too fast', e); return}
        if (Math.abs(e.movementY) > 100) {l('too fast', e); return}

        // TODO: Handle things with a locked curser and MovementX / MovementY mouse event properties
        if (mouseState.cameraDrag !== null) {
            // TODO: Clamp based on world boundaries
            camera.position.x = clamp(-100, 500, camera.position.x + e.movementX * settings.cameraSpeedDrag);
            camera.position.y = clamp(-100, 1180, camera.position.y + e.movementY * settings.cameraSpeedDrag);
        } else {
            highestXDiff = Math.max(highestXDiff, Math.abs(e.movementX));
            highestYDiff = Math.max(highestYDiff, Math.abs(e.movementY));
            mouseState.position.x = clamp(0, 1920, mouseState.position.x + e.movementX * settings.mouseSpeed);
            mouseState.position.y = clamp(0, 1080, mouseState.position.y + e.movementY * settings.mouseSpeed);
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

            // l('start',mouseState.dragStartPosition.x, mouseState.dragStartPosition.y, 'current', mouseState.position.x, mouseState.position.y)
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