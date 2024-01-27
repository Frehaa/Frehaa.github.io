'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

const MAP_TILE_SIZE = 50;

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}
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

const gameState = {
    selectedEntities: [],
    keys: {
        shiftDown: false
    }
}

const entities = [];

// const world = {
//     // How can we quickly represent a simple 2 dimensional world? (How should we extend this to 3D? Should we even do that? Why? Let us put in the maybe)
//     // We can represent the world as a series of polygons 
//     // Maybe the easiest first thing to do is to represent it as a 2 dimensional array with blocks
//     width: 20,
//     height: 20,
//     map: [
//         [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//         [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
//         [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
//         [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
//         [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
//         [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
//         [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
//         [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//         [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
//         [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
//         [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1],
//         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
//         [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//         [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//     ]
// }

const world = {
    width: 3000,
    height: 3000,
    wallThickness: 20,
    blockades: [
        [[300, 300], [330, 300], [330, 500], [300, 500]],
    ]
}

const navigationMesh = {
    convexes: [ 
        [ 
            [40, 40], [500, 40], [500, 500], [40, 500]
        ],
        [
            [500, 40], [1000, 40], [1000, 500], [500, 500]
        ],
        [
            [40, 500], [1000, 500], [1000, 1000], [40, 1000]
        ]
    ],
    connections: [
        [0, 1],
        [0,2],
        [1, 2]
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

function pathfind() {
    // TODO:

    // Maybe the trick is just that the shortest path will by definition be the one which cuts the corner the most optimally
    // The tricky part still seems to be to find 


    // How to deal with a group of units? Maybe think of the center as what needs to reach the target? (This seems like it would very easily lead to bugs. What if the units are spread out?)
    // We do euclidian distance (i.e. sqrt(x^2 + y^2), maybe ignore sqrt), and then we compress the path by checking if there is no obstacle between the start and the end

    // NAV MESHES
    // Simple Stupid Funnel Algorithm 
}


// function drawWorld(ctx, world, camera) {
//     const squarePixelSize = MAP_TILE_SIZE;
//     ctx.strokeStyle = 'black'
//     for (let x = 0; x < world.width; x++) {
//         for (let y = 0; y < world.height; y++) {
//             switch (world.map[y][x]) {
//                 case 0: {
//                     ctx.fillStyle = 'grey';
//                 } break;
//                 case 1: {
//                     ctx.fillStyle = 'white';
//                 } break;
//                 default: {
//                     l('Unknown map square', world.map[y][x])
//                 }
//             }
//             ctx.fillRect(x * squarePixelSize - camera.position.x, y * squarePixelSize - camera.position.y, squarePixelSize, squarePixelSize);
//             // ctx.strokeRect(x * squarePixelSize - camera.position.x, y * squarePixelSize - camera.position.y, squarePixelSize, squarePixelSize);
//         }
//     }
// }

function drawWorld(ctx, world, camera) {
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'white';
    ctx.fillRect(-camera.position.x, -camera.position.y, world.width, world.height);
    ctx.fillStyle = 'grey';
    ctx.fillRect(-camera.position.x + world.wallThickness, -camera.position.y + world.wallThickness, world.width - 2 * world.wallThickness, world.height - 2 * world.wallThickness);

    ctx.fillStyle = 'white';
    for (const blockade of world.blockades) {
        ctx.beginPath();
        ctx.moveTo(blockade[0][0] - camera.position.x, blockade[0][1] - camera.position.y);
        for (let i = 1; i < blockade.length; i++) {
            const [x,y] = blockade[i];
            ctx.lineTo(x - camera.position.x, y - camera.position.y);
        }
        ctx.closePath();
        ctx.fill();
    }



    // for (let x = 0; x < world.width; x++) {
    //     for (let y = 0; y < world.height; y++) {
    //         switch (world.map[y][x]) {
    //             case 0: {
    //                 ctx.fillStyle = 'grey';
    //             } break;
    //             case 1: {
    //                 ctx.fillStyle = 'white';
    //             } break;
    //             default: {
    //                 l('Unknown map square', world.map[y][x])
    //             }
    //         }
    //         ctx.fillRect(x * squarePixelSize - camera.position.x, y * squarePixelSize - camera.position.y, squarePixelSize, squarePixelSize);
    //         // ctx.strokeRect(x * squarePixelSize - camera.position.x, y * squarePixelSize - camera.position.y, squarePixelSize, squarePixelSize);
    //     }
    // }
}


function drawMinimap(ctx) {

}

function calculateConvexPolygonCenter(convexPolygon) {
    let sumX = 0;
    let sumY = 0;

    for (const point of convexPolygon) {
        sumX += point[0];
        sumY += point[1];
    }

    return [
        sumX / convexPolygon.length,
        sumY / convexPolygon.length
    ];
}

function drawNavigationMesh(ctx, camera) {
    const convexes = navigationMesh.convexes;
    ctx.fillStyle = 'rgba(50, 60, 200, 0.7)';
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(50, 60, 200, 1)';

    for (const convex of convexes) {
        ctx.beginPath();
        ctx.moveTo(convex[0][0] - camera.position.x, convex[0][1] - camera.position.y);
        for (let i = 0; i < convex.length; i++) {
            const [x, y] = convex[i];
            ctx.lineTo(x - camera.position.x, y - camera.position.y);
        }
        ctx.closePath();
        ctx.fill()
        ctx.stroke();

        // const center = findConvexCenter(convex, ctx);
        // ctx.save()
        // ctx.fillStyle = 'black'
        // ctx.beginPath()
        // ctx.arc(center[0] - camera.position.x, center[1] - camera.position.y, 10, 0, 2 * Math.PI);
        // ctx.fill();
        // ctx.restore()
    }

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3
    for (const connection of navigationMesh.connections) {
        const convexA = convexes[connection[0]];
        const convexB = convexes[connection[1]];

        const centerA = calculateConvexPolygonCenter(convexA);
        const centerB = calculateConvexPolygonCenter(convexB);


        ctx.beginPath();
        ctx.moveTo(centerA[0], centerA[1]);
        ctx.lineTo(centerB[0], centerB[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerA[0], centerA[1], 10, 0, 2 * Math.PI);
        ctx.arc(centerB[0], centerB[1], 10, 0, 2 * Math.PI);
        ctx.fill()
        
    }
}

function drawBottomThingy(ctx, gameState) {
    const bottom = ctx.canvas.height;
    const height = 200;
    const width = ctx.canvas.width;
    ctx.fillStyle = 'rgba(50, 50, 50)'
    ctx.fillRect(0, bottom - height, width, height);


    ctx.fillStyle = 'white'
    ctx.font = 'Bold 48px serif'
    ctx.fillText(String(gameState.selectedEntities.length), 250, bottom - height + 50)

    // MINIMAP (TODO: DRAW BASED ON WORLD MAP)
    ctx.fillStyle = 'rgba(255, 50, 50)'
    ctx.fillRect(0, bottom - height, height, height);

}

let lastTime = 0;
// TODO: Draw map
// We first ignore camera and just say that 
function draw(time) {
    const dt = time - lastTime;
    lastTime = time;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    for (const entity of entities) {
        entity.step(dt);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save()

    drawWorld(ctx, world, camera)

    drawNavigationMesh(ctx, camera)

    ctx.translate(-camera.position.x, -camera.position.y)

    for (const entity of entities) {
        entity.draw(ctx);
    }

    ctx.restore()
    if (mouseState.dragStartPosition !== null) {
        drawSelectionBox(ctx, mouseState.dragStartPosition, mouseState.position);
        // l(mouseState.dragStartPosition, mouseState.position)
    }

    drawBottomThingy(ctx, gameState);

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

function lengthVec2({x, y}) {
    return Math.sqrt(x*x + y*y);
}

function addVec2(a, b) {
    return {
        x: a.x+b.x,
        y: a.y+b.y
    }
}

function subtractVec2(a, b) {
    return {
        x: a.x-b.x,
        y: a.y-b.y
    }
}

function scaleVec2(s, v) {
    return {
        x: s * v.x,
        y: s * v.y,
    };
}

function pointBetween(point, a, b) {
    if (point.x < a.x && point.x < b.x) return false;
    if (point.x > a.x && point.x > b.x) return false;
    if (point.y < a.y && point.y < b.y) return false;
    if (point.y < a.y && point.y < b.y) return false;
    return true;
}

function normalizeVec2({x, y}) {
    const length = lengthVec2({x, y});
    return {
        x: x/length,
        y: y/length
    };
}

function positionToTile(position) {
    if (position.x < 0 || position.x >= world.width * MAP_TILE_SIZE) return null
    if (position.y < 0 || position.y >= world.height * MAP_TILE_SIZE) return null
    const x = Math.floor(position.x / MAP_TILE_SIZE);
    const y = Math.floor(position.y / MAP_TILE_SIZE);
    return world.map[y][x];
}

class Entity {
    constructor(x, y, speed, width, height) {
        this.position = {x, y};
        this.selected = false;
        this.hovered = false;
        this.speed = speed;
        this.moveTarget = [];
        this.size = { width, height };
    }

    draw(ctx) {
        if (this.moveTarget.length === 0) {
            ctx.fillStyle = 'rgba(50, 50, 250, 1)';
        } else {
            ctx.fillStyle = 'rgba(10, 20, 150, 1)';
            // TODO: Draw movement points
        }
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

        this.drawHitbox(ctx);
    }

    translatePositionIntoNavigationMesh(position) {
        // TODO: Translate the position into this units navigation mesh
        // TODO: Possible weird issue. Do we want the move animation to be where the player clicks or to the translated position? 
        return position;
    }

    setMoveTarget(position) {
        this.moveTarget = [];
        this.pushMoveTarget(position);
    }

    pushMoveTarget(position) {
        const newPosition = this.translatePositionIntoNavigationMesh(position);
        this.moveTarget.push(newPosition)
    }

    // TODO: 
    // We want to be able to queue a series of commands like, move there, from there, move there, and then attack there. Or move there and then patrol between there there and there. 
    // In order to do this we somehow need to make our commands smarter
    // Do we want a wait command? E.g. a command which says waits some number of seconds and then does something? Then we could do something like, move there, wait 3 times, and then attack there?
    // Seems kind of fun and interesting 



    drawHitbox(ctx) {
        const leftX = this.position.x - this.size.width / 2;
        const topY = this.position.y - this.size.height / 2;

        ctx.fillStyle = 'green';
        ctx.strokeStyle = 'blue';
        ctx.strokeRect(leftX, topY, this.size.width, this.size.height);
        ctx.fillRect(leftX, topY, this.size.width, this.size.height);
    }

    step(dt) {
        if (this.moveTarget.length === 0) return;

        l(gameState.keys.shiftDown, this.moveTarget.length)
        const nextMove = this.moveTarget[0];
        
        const direction = normalizeVec2({
            x: nextMove.x - this.position.x,
            y: nextMove.y - this.position.y
        });

        // l(dt, this.position, direction)
        const newPosition = addVec2(scaleVec2((dt/1000) * this.speed, direction), this.position);

        const targetTile = positionToTile(newPosition);
        if (targetTile === null) {
            // SOME WEIRD HAPPENED
            console.log("The entity move outside the map somehow?")
            return;
        }
        if (targetTile > 0) { // Cannot walk on this
            // TODO: Move as close as possible => orthogonal(?) to the wall and the point
            
            // this.position = this.position;
            // l(positionToTile(this.position))
        }

        // TODO: Properly handle the multimove
        // Make sure target stops exactly where we click and no longer tries to move after
        else if (pointBetween(nextMove, this.position, newPosition)) {
            this.position = nextMove;
            // TODO: use a queue instead or something
            this.moveTarget.shift(); // REMOVE THE NEXT MOVE
        } else {
            this.position = newPosition;
        }

        // this.moveTarget = null;
    }
}

function initialize() {
    const canvas = document.getElementById('canvas');
    camera.canvas = canvas;

    const entity = new Entity(250, 100, 400, 20, 20)
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
            document.addEventListener("keydown", keyDown);
            document.addEventListener("keyup", keyUp);

        } else {
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mousedown", mouseDown);
            document.removeEventListener("mouseup", mouseUp);
            document.removeEventListener("keydown", keyUp);
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
                gameState.selectedEntities.forEach(e => {
                    if (!gameState.keys.shiftDown) {
                        e.moveTarget = [];
                    } 
                    e.moveTarget.push(position);
                });
            } break;
            default: {}
        }
    }

    function mouseUp(e) {
        l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
                entities.forEach(entity => { entity.selected = false; })
                const selectionBoxCornerA = canvasCoordinatesToWorldCoordinates(mouseState.position, camera);
                const selectionBoxCornerB = canvasCoordinatesToWorldCoordinates(mouseState.dragStartPosition, camera);
                const r = findEntitiesInBox(entities, selectionBoxCornerA, selectionBoxCornerB);
                l('lift', r)
                r.forEach(entity => {
                    entity.hovered = false;
                    entity.selected = true;
                })
                gameState.selectedEntities = r;
                mouseState.dragStartPosition = null;
            } break;
            case MOUSE_MIDDLE_BUTTON: {
                mouseState.cameraDrag = null;

            } break;
        }
    }

    function keyDown(e) {
        l(e)
        switch (e.code) {
            case 'KeyN': {
                const position = canvasCoordinatesToWorldCoordinates(mouseState.position, camera);
                const newEntity = new Entity(position.x, position.y, 500, 20, 20);
                entities.push(newEntity)
            } break;
            case 'ShiftLeft': {
                gameState.keys.shiftDown = true;
            }
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case 'ShiftLeft': {
                gameState.keys.shiftDown = false;
            }
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

        const cameraWidth = 1920;
        const cameraHeight = 1080;
        const cameraBuffer = 100

        // TODO: Handle things with a locked curser and MovementX / MovementY mouse event properties
        if (mouseState.cameraDrag !== null) {
            // TODO: Clamp based on world boundaries
            camera.position.x = clamp(-cameraBuffer, world.width - cameraWidth + cameraBuffer, camera.position.x + e.movementX * settings.cameraSpeedDrag);
            const bottomThingyHeight = 200
            camera.position.y = clamp(-cameraBuffer, world.height - cameraHeight + cameraBuffer + bottomThingyHeight, camera.position.y + e.movementY * settings.cameraSpeedDrag);
        } else {
            highestXDiff = Math.max(highestXDiff, Math.abs(e.movementX));
            highestYDiff = Math.max(highestYDiff, Math.abs(e.movementY));
            mouseState.position.x = clamp(0, cameraWidth, mouseState.position.x + e.movementX * settings.mouseSpeed);
            mouseState.position.y = clamp(0, cameraHeight, mouseState.position.y + e.movementY * settings.mouseSpeed);
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


    requestAnimationFrame(time => {
        lastTime = time;
        draw(time);
    });
}