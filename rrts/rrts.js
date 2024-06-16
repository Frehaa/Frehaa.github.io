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

const settings = {
    cameraSpeedDrag: 2,
    cameraSpeedArrow: 2,
    mouseSpeed: 1,
    gameSpeedModifier: 1, // TODO,
    ui: {
        bottomThingyHeight: 200
    }
}

const mouseState = {
    dragStartPosition: null, // 
    position: new Vec2(0, 0),
    cameraDrag: null
}

const camera = {
    position: {x: 0, y: 0},
    moveDirection: new Vec2(0, 0),
    viewPort: {width: 1920, height: 1080},
    updatePosition(dt) {
        this.move(this.moveDirection.scale(settings.cameraSpeedArrow * dt))
    },
    move(direction) { // Camera movement is isolated to this function
        // TODO: Clamp based on world boundaries (Is )
        const buffer = 100;
        this.position.x = clamp(camera.position.x + direction.x, 0, world.width - this.viewPort.width);
        this.position.y = clamp(camera.position.y + direction.y, 0, world.height - this.viewPort.height + settings.ui.bottomThingyHeight);
    }
}

const gameState = {
    selectedEntities: [],
    keys: {
        shiftDown: false
    },
    paused: false,
    elapsedTime: 0,
    collisions: []
}

const entities = [];
const enemies = [];

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

const blockade1Points = [];
blockade1Points.push(new Point(300, 300));
blockade1Points.push(new Point(330, 300));
blockade1Points.push(new Point(330, 500));
blockade1Points.push(new Point(300, 500));
blockade1Points.push(new Point(300, 300));
const blockade1 = new Polygon(blockade1Points);

const blockade2Points = [];
blockade2Points.push(new Point(400, 350));
blockade2Points.push(new Point(600, 350));
blockade2Points.push(new Point(600, 700));
blockade2Points.push(new Point(400, 700));
blockade2Points.push(new Point(400, 350));
const blockade2 = new Polygon(blockade2Points);


const world = {
    width: 3000,
    height: 3000,
    wallThickness: 20,
    blockades: [
        blockade1,
        blockade2
    ]
}

// TODO?: Color picker? Do I need it for my game with my color scheme? Probably.

// TODO: Figure out if the points of the faces should be in clockwise or counterclockwise position, or whether it does not matter. (Right now they seem to be clockwise)
// This matters for some tests for (1) points in triangle, (2) for the determinant, (3) ??? add more if I find 

// Connect faces if they share a common edge 
const navigationMesh = {
    faces: [ 
        [ [40, 40], [500, 40], [40, 500] ],
        [ [40, 500], [500, 40], [500, 500] ],
        [ [500, 40], [1000, 40], [500, 500] ],
        [ [1000, 40], [1000, 500], [500, 500] ],
        [ [40, 500], [1000, 500], [40, 1000] ],
        [ [1000, 500], [1000, 1000], [40, 1000] ]

    ],
    connections: [
        [{to: 1, range: [40, 500, 500, 40]}],
        [{to: 0, range: [40, 500, 500, 40]},
         {to: 2, range: []},
         {to: 4, range: []}],
        [{to: 1, range: []},
         {to: 3, range: []}],
        [{to: 2, range: []},
         {to: 4, range: []}],
        [{to: 1, range: []},
         {to: 3, range: []}, 
         {to: 5, range: []}],
        [{to: 4, range: []}]
    ], 
}

// Cases. Two corners of triangle A (a1, a2) and of triangle B (b1, b2)
// 1. BOTH BETWEEN: a1 and a2 are between b1 and b2 (and opposite)
// 2. SAME: a1 = b1 and a2 = b2
// 3. SINGLE BETWEEN: a1 is between b1 and b2, but a2 is not between (or any other scenario) 


// TODO: To test function, loop over all positions in area of navigation mesh

// TODO: Customizable selection box

function pointInTriangle(point, triangle) {
    // TODO: check bounding box first
    const [alpha, beta, gamma] = pointToBarycentric(point, triangle)
    return alpha >= 0 && beta >= 0 && gamma >= 0;
}

// TODO: Selection box should have world positions, not camera positions
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
    // DONE: 
    // DIJKSTRA

    // TODO:
    // 


    // How to deal with a group of units? Maybe think of the center as what needs to reach the target? (This seems like it would very easily lead to bugs. What if the units are spread out?) First we need to figure out which units are clumped.
    // We do euclidian distance (i.e. sqrt(x^2 + y^2), maybe ignore sqrt), and then we compress the path by checking if there is no obstacle between the start and the end

    // NAV MESHES
    // Simple Stupid Funnel Algorithm 
}

function drawWorld(ctx, world, camera) {
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'white';
    ctx.fillRect(-camera.position.x, -camera.position.y, world.width, world.height);
    ctx.fillStyle = 'grey';
    ctx.fillRect(-camera.position.x + world.wallThickness, -camera.position.y + world.wallThickness, world.width - 2 * world.wallThickness, world.height - 2 * world.wallThickness);

    ctx.fillStyle = 'white';
    for (const blockade of world.blockades) {
        ctx.beginPath();
        ctx.moveTo(blockade.points[0].x - camera.position.x, blockade.points[0].y - camera.position.y);
        for (let i = 1; i < blockade.points.length; i++) {
            const p = blockade.points[i];
            ctx.lineTo(p.x - camera.position.x, p.y - camera.position.y);
        }
        ctx.closePath();
        ctx.fill();
    }
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
    const triangles = navigationMesh.faces;
    ctx.fillStyle = 'rgba(50, 60, 200, 0.7)';
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(50, 60, 200, 1)';

    for (let i = 0; i < triangles.length; i++) {
        const triangle = triangles[i];
        ctx.beginPath();
        ctx.moveTo(triangle[0][0] - camera.position.x, triangle[0][1] - camera.position.y);
        for (let i = 0; i < triangle.length; i++) {
            const [x, y] = triangle[i];
            ctx.lineTo(x - camera.position.x, y - camera.position.y);
        }
        ctx.closePath();
        ctx.fill()
        ctx.stroke();

        const center = calculateConvexPolygonCenter(triangle, ctx);

        ctx.fillStyle = 'black'
        ctx.fillText(i, center[0] - camera.position.x, center[1] - camera.position.y);
        ctx.fillStyle = 'rgba(50, 60, 200, 0.7)';

        // ctx.save()
        // ctx.fillStyle = 'black'
        // ctx.beginPath()
        // ctx.arc(center[0] - camera.position.x, center[1] - camera.position.y, 10, 0, 2 * Math.PI);
        // ctx.fill();
        // ctx.restore()
    }

    // LINE BETWEEN TRIANGLES
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3
    for (let i = 0; i < triangles.length; i++) {
        const triangleA = triangles[i];
        const centerA = calculateConvexPolygonCenter(triangleA);
        for (let j = 0; j < navigationMesh.connections[i].length; j++) {
            const index = navigationMesh.connections[i][j].to;
            const triangleB = navigationMesh.faces[index];
            const centerB = calculateConvexPolygonCenter(triangleB);
            ctx.beginPath();
            ctx.moveTo(centerA[0] - camera.position.x, centerA[1] - camera.position.y);
            ctx.lineTo(centerB[0] - camera.position.x, centerB[1] - camera.position.y);
            ctx.stroke();           
        }
    }
    // for (const connection of navigationMesh.connections) {
    //     const convexA = convexes[connection[0]];
    //     const convexB = convexes[connection[1]];

    //     const centerA = calculateConvexPolygonCenter(convexA);
    //     const centerB = calculateConvexPolygonCenter(convexB);


    //     ctx.beginPath();
    //     ctx.moveTo(centerA[0], centerA[1]);
    //     ctx.lineTo(centerB[0], centerB[1]);
    //     ctx.stroke();

    //     ctx.beginPath();
    //     ctx.arc(centerA[0], centerA[1], 10, 0, 2 * Math.PI);
    //     ctx.arc(centerB[0], centerB[1], 10, 0, 2 * Math.PI);
    //     ctx.fill()
    // }
}

function polygonContainsPoint(polygon, point) {
    // TODO 
}


function drawBottomThingy(ctx, gameState) {
    const bottom = ctx.canvas.height;
    const height = settings.ui.bottomThingyHeight;
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

function drawWaypointGraph(ctx, camera) {

    ctx.beginPath(); 
    for (const edge of waypointGraph.graph.edges()) {
        const eitherIndex = edge.either();
        const p1 = waypointGraph.waypoints[eitherIndex]
        const p2 = waypointGraph.waypoints[edge.other(eitherIndex)];
        ctx.moveTo(p1.x - camera.position.x, p1.y - camera.position.y);
        ctx.lineTo(p2.x - camera.position.x, p2.y - camera.position.y);
    }
    ctx.stroke();

    for (const waypoint of waypointGraph.waypoints) {
        ctx.fillStyle = waypoint.color;
        ctx.beginPath(); 
        ctx.arc(waypoint.x - camera.position.x, waypoint.y - camera.position.y, 10, 0, 2 * Math.PI);
        ctx.fill()
        ctx.stroke();
    }
}



function updateEntityPositions(dt) {
    // Move entities while handling collision
    for (const entity of entities) {
        entity.computeNewPosition(dt);
    }

    const result = [];
    // For every pair. Check for overlap. 
    for (let i = 0; i < entities.length; i++) {
        const a = entities[i];
        for (let j = i+1; j < entities.length; j++) {
            const b = entities[j];

            // First we assume everything is just a circle
            const v = a.newPosition.subtract(b.newPosition); // Vector from b to a 
            const distance = v.length();
            if (distance < a.size.width + b.size.width) { // Collision
                // TODO: CALCULATE CONTACT POINT
                const contactPoint = b.position.add(v.scale(b.size.width / v.length()));
                result.push([i, j, contactPoint]);
            }
        }
    }
    if (result.length > 0){
        l(result.length, result)
    }

    // We only do collision of two things now. We try to handle more later
    for (let i = 0; i < result.length; i++) {
        const a = entities[result[i][0]];
        const b = entities[result[i][1]];

        // if (a.dire)
        // Clearly bad if they are moving in the same direction
        a.newPosition = a.position; // NAIVE: NOBODY MOVES
        b.newPosition = b.position; // NAIVE: NOBODY MOVES

        assert(a.direction.length() > 0 || b.direction.length() > 0, 'One of the entities have to move for there to be a collision');
        if (a.direction.length() === 0) {

        } else if (b.direction.length() === 0) {

        } else {
            l(a.direction.dot(b.direction))
        }
        

        // HOW TO FIGURE OUT WHETHER THEY ARE MOVING IN SIMILAR DIRECTION AND WHICH IS IN FRONT OF THE OTHER?

        // TODO: Calculate the directions in terms of degrees angle to [1, 0] vector.
        // Split into 4 general cases, NW, NE, SW, SE
        // Consider which xy-quadrant the entities are in (Maybe it is easier if 0,0 is bottom left (or top left) such that we are always in the same quadrant)  
        // Determine which is in front of the other by calculating their length
        // 

        // TODO: Draw different scenarios 


        // b.newPosition.subtract(a.position).length()

        // If direction are the same, and a is further back than b, then move a as much as possible until it hits b
        // If directions are opposite, then met in the middle and slide a bit against each other
        // If one is stationary, then push a bit (depend on unit size and mass? Should a zergling be able to push a ultralisk?)

        
    }

    gameState.collisions = result;

    for (const entity of entities) {
        entity.position = entity.newPosition;
    }


    // 1. Update positions based on velocity (This needs to check for )
    // 2. Detect collision
    // 3. Handle collision: When a collision is found, between two entities, check the velocity of
    // the two entities and move them away from each other in a way which makes
    // sense according to their velocity. (e.g. if moving against each other, we
    // can move them a little back, and maybe to the side such that they pass
    // each other. If moving the same direction, move the on behind a little
    // back, as if it is blocked.)
    // 4. Go to step 2
}


// TODO: Draw map
// We first ignore camera and just say that 
function handleAnimationFrame(time) {
    const dt = time - handleAnimationFrame.lastTime;
    handleAnimationFrame.lastTime = time;

    const modifiedDt = dt * settings.gameSpeedModifier;

    camera.updatePosition(dt);

    if (!gameState.paused) { // DO NOT UPDATE STATE
        updateEntityPositions(modifiedDt);
    } else {
        gameState.elapsedTime += modifiedDt;

    }


    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save()

    drawWorld(ctx, world, camera)

    // drawNavigationMesh(ctx, camera)

    drawWaypointGraph(ctx, camera);

    ctx.translate(-camera.position.x, -camera.position.y)

    for (const entity of entities) {
        entity.draw(ctx);
    }
    for (const entity of enemies) {
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


    ctx.fillStyle = 'red'
    for (const collision of gameState.collisions) {
        const collisionPoint = collision[2];
        ctx.beginPath();
        ctx.arc(collisionPoint.x, collisionPoint.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    }


    requestAnimationFrame(handleAnimationFrame);
}

// Should we care about the inefficiency of creating new vectors every time we
// make do something? No. The goal of the javascript project is to get some
// ground work going to test ideas and understand the math. After that we can improve by doing
// everything in an engine or C++ or something.

// TODO: MICRO OPTIMIZATION. Store the ratio between width and clientWidth, and height and clientHeight, and only update it when it changes.
function mouseEventToCanvasCoordinates(e, canvas) {
    return new Vec2(e.pageX * (canvas.width / canvas.clientWidth), e.pageY * (canvas.height / canvas.clientHeight));
}

function canvasCoordinatesToWorldCoordinates(coords, camera) {
    return new Vec2(coords.x + camera.position.x, coords.y + camera.position.y);
}

function pointBetween(point, a, b) {
    if (point.x < a.x && point.x < b.x) return false;
    if (point.x > a.x && point.x > b.x) return false;
    if (point.y < a.y && point.y < b.y) return false;
    if (point.y < a.y && point.y < b.y) return false;
    return true;
}

function positionToTile(position) {
    if (position.x < 0 || position.x >= world.width * MAP_TILE_SIZE) return null
    if (position.y < 0 || position.y >= world.height * MAP_TILE_SIZE) return null
    const x = Math.floor(position.x / MAP_TILE_SIZE);
    const y = Math.floor(position.y / MAP_TILE_SIZE);
    return world.map[y][x];
}

function isPositionInPolygon(polygon, position) {
    // Get the bounding box of the polygon. 
    // Create a line from the given position, to some point just outside the bounding box.
    // Count how many lines of the polygon the created line intersects. 
    // If odd number, then we are inside, otherwise we are outside.
    return true;
}

// TODO: Try the naive scatter waypoint strategy.
//  How to do this? Do we add a point where we click and the connect it to all other nodes within some area? That seems fine.
// Next we can try some square search
// Finally Navigation Mesh
// The tricky part seems to be corners, but I will try to ignore this in the beginning.

class Entity {
    constructor(x, y, speed, width, height) {
        this.position = new Vec2(x, y);
        this.selected = false;
        this.hovered = false;
        this.speed = speed;
        this.moveTarget = [];
        this.size = { width, height };
        this.direction = new Vec2(0, 0);
        this.newPosition = new Vec2(x, y);
        
        this.currentNavMeshTileIndex = null;
        for (let i = 0; i < navigationMesh.faces.length; i++) {
            const convex = navigationMesh.faces[i];
            if (isPositionInPolygon(convex, this.position)) {
                this.currentNavMeshTileIndex = i;
                break;
            }
        }
        l("Entity is in nav mesh with index: ", this.currentNavMeshTileIndex, navigationMesh.faces[this.currentNavMeshTileIndex]);
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
        ctx.lineWidth = 2

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
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size.width, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        // ctx.strokeRect(leftX, topY, this.size.width, this.size.height);
        // ctx.fillRect(leftX, topY, this.size.width, this.size.height);
    }

    computeNewPosition(dt) {
        if (this.moveTarget.length === 0) return; // TODO: Handle different actions than just moving

        const nextMove = this.moveTarget[0];
        this.direction =  nextMove.subtract(this.position).normalize();
        this.newPosition = this.direction.scale((dt/1000) * this.speed).add(this.position);

        // TODO: Properly handle the multimove. Right now we don't move the full
        // distance we could. So we need to calculate how much we moved and how
        // much movement is left
        // Make sure target stops exactly where we click and no longer tries to move after
        if (pointBetween(nextMove, this.position, this.newPosition)) {
            this.newPosition = new Vec2(nextMove.x, nextMove.y);
            // TODO: OPTIMIZATION: use a queue instead or something
            this.moveTarget.shift(); // REMOVE THE NEXT MOVE
        }
    }
}

class Waypoint {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.color = 'red';
    }

    isCloseTo(other, distanceSq) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return (dx*dx + dy*dy) <= distanceSq;
    }
    distance(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx*dx + dy*dy);
    }
}

class WorldGraph {
    constructor(waypointCount, world) {
        this.waypoints = []
        this.graph = new Graph(waypointCount);
        this._generateGraphPoints(world);
    }
    _generateGraphPoints(world) {
        const points = this.graph.size;

        const worldSeed = 153216987;
        const randomGenerator = customRandom(worldSeed);
        const repeatCountBeforeDecay = 25;
        const decayRate = 1/8;

        let minimumDistanceSquared = 100*100
        let repeat = 0;
        // DANGER OF INFINITE LOOP IF EVERYTHING IS A BLOCKADE
        while (this.waypoints.length < points) { 
            const x = randomGenerator.next().value * world.width;
            const y = randomGenerator.next().value * world.height;
            const newPoint = new Waypoint(x,y);

            const isPointBlocked = world.blockades.findIndex(b => b.contains(newPoint)) >= 0;
            if (isPointBlocked) {
                continue;
            }

            const isCloseToOtherPoint = this.waypoints.findIndex(p => newPoint.isCloseTo(p, minimumDistanceSquared)) >= 0;
            if (isCloseToOtherPoint) { // A close point
                repeat++;
                if (repeat >= repeatCountBeforeDecay) {
                    minimumDistanceSquared = minimumDistanceSquared - minimumDistanceSquared * decayRate;
                    repeat = 0;
                }
                continue;
            }

            const connectDistanceSquared = 175 * 175
            // Connect point to other points
            for (let i = 0; i < this.waypoints.length; i++) {
                const otherPoint = this.waypoints[i];
                if (newPoint.isCloseTo(otherPoint, connectDistanceSquared) && doesPointsHaveNoObstructionsBetweenThem(newPoint, otherPoint, world)) {
                    this.graph.addEdge(new Edge(this.waypoints.length, i, newPoint.distance(otherPoint)));
                } 
            }
            this.waypoints.push(newPoint);
        }


    }
}

function* customRandom(seed) {
    // Linear congruential generator (https://en.wikipedia.org/wiki/Linear_congruential_generator)
    let state = seed;
    let a = 1664525;
    let c = 1013904223;
    let m = 2**32;
    while (true) {
        state = (a * state + c) % m
        yield state / m;
    }
}

function createWaypointGraph(world, entity, points) {
    let minimumDistanceSquared = 100*100
    const repeatCountBeforeDecay = 25;
    const decayRate = 1/8;
    let repeat = 0;
    const worldSeed = 153216987;
    const randomGenerator = customRandom(worldSeed);
    const result = [];
    // DANGER OF INFINITE LOOP IF EVERYTHING IS A BLOCKADE
    while (result.length < points) { 
        const x = randomGenerator.next().value * world.width;
        const y = randomGenerator.next().value * world.height;
        const newPoint = new Waypoint(x,y);

        const isPointBlocked = world.blockades.findIndex(b => b.contains(newPoint)) >= 0;
        if (isPointBlocked) {
            continue;
        }

        const isCloseToOtherPoint = result.findIndex(p => newPoint.isCloseTo(p, minimumDistanceSquared)) >= 0;
        if (isCloseToOtherPoint) { // A close point
            repeat++;
            if (repeat >= repeatCountBeforeDecay) {
                minimumDistanceSquared = minimumDistanceSquared - minimumDistanceSquared * decayRate;
                repeat = 0;
            }
            continue;
        }

        const connectDistanceSquared = 175 * 175
        // Connect point to other points
        for (const otherPoint of result) {
            if (newPoint.isCloseTo(otherPoint, connectDistanceSquared) && doesPointsHaveNoObstructionsBetweenThem(newPoint, otherPoint, world)) {
                newPoint.connect(otherPoint);
            }
        }
        result.push(newPoint);
    }

    return result;
}

function doesPointsHaveNoObstructionsBetweenThem(pointA, pointB, world) {
    for (const blockade of world.blockades) {
        for (let i = 0; i < blockade.points.length-1; i++) {
            if (lineSegmentIntersection(pointA, pointB, blockade.points[i], blockade.points[i+1])) return false
        }
    }

    return true
}

const waypointGraph = new WorldGraph(1000, world); // createWaypointGraph(world, null, 1000);


function initialize() {
    const canvas = document.getElementById('canvas');
    camera.canvas = canvas;


    const shortestPath = dijkstraShortestPath(waypointGraph.graph, 0, 1);
    shortestPath.forEach(idx => {
        waypointGraph.waypoints[idx].color = 'blue';
    })
    const shortestPath2 = dijkstraShortestPath(waypointGraph.graph, 3, 4);
    shortestPath2.forEach(idx => {
        waypointGraph.waypoints[idx].color = 'green';
    })

    const shortestPath3 = dijkstraShortestPath(waypointGraph.graph, 8, 10);
    shortestPath3.forEach(idx => {
        waypointGraph.waypoints[idx].color = 'pink';
    })

    const entity = new Entity(250, 100, 400, 20, 20)
    entities.push(entity)


    const enemy = new Entity(300, 300, 500, 30, 30);
    enemy.hitpoint = 30;
    enemy.draw = function(ctx) {
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
    enemies.push(enemy);


    // Prevent right click from opening context menu
    canvas.addEventListener('contextmenu', e => {e.preventDefault(); return false;});

    // Use native cursor
    document.addEventListener("mousemove", mouseMoveNative);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);


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
    // 

    function mouseDown(e) {
        // l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: { // TODO: Movement should be done every frame after pressing down, not until it starts repeating
                mouseState.dragStartPosition = mouseState.position.copy(); //{ ...mouseState.position };


                l('mouseDown - mouse position:', mouseState.position)

            } break;
            case MOUSE_MIDDLE_BUTTON: {
               mouseState.cameraDrag = mouseState.position.copy(); //{ ...mouseState.position };
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

                // Manual test
                // navigationMesh.faces.forEach((triangle, index) => {
                //     if (pointInTriangle([position.x, position.y], triangle.flatMap(a => a))) {
                //         l("Mouse click in triangle", index)
                //     }
                // });

            } break;
            default: {}
        }
    }

    // for (let y = 40; y <= 1000; y++) {
    //     for (let x = 40; x <= 1000; x++) {
    //         const result = navigationMesh.faces.findIndex(triangle => {
    //             return pointInTriangle([x, y], triangle.flat());
    //         })
    //         if (result < 0) {
    //             l(x, y, result)
    //         }

    //     }
    // }

    // TODO: Unit hover and click select
    // TODO: Stop mouse capture and just use mouse position (This means scrolling is weird, but that is fine. We don't have scrolling anyway right now, it also ruins middle mouse scroll ... not sure what to do about that) 
    function mouseUp(e) {
        l(e)
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
                if (mouseState.dragStartPosition === null) break
                entities.forEach(entity => { entity.selected = false; })
                const selectionBoxCornerA = canvasCoordinatesToWorldCoordinates(mouseState.position, camera);
                const selectionBoxCornerB = canvasCoordinatesToWorldCoordinates(mouseState.dragStartPosition, camera);
                const r = findEntitiesInBox(entities, selectionBoxCornerA, selectionBoxCornerB);
                l('Entities in selection box', r)
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
            } break;
            case 'KeyP': {
                gameState.paused = !gameState.paused;
            } break;
            case 'NumpadAdd': {
                l('Increase game speed modifier');
                settings.gameSpeedModifier += 0.1;
            } break;
            case 'NumpadSubtract': {
                l('Decrease game speed modifier');
                settings.gameSpeedModifier = Math.max(0, settings.gameSpeedModifier - 0.1);
            } break;

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

    // l(findEntitiesInBox(entities, {x: 0, y: 0}, {x:1000, y: 1000}))
    // l(findEntitiesInBox(entities, {x: 500, y: 500}, {x:1000, y: 1000}))


   function mouseMoveNative(e) { 
        if (mouseState.cameraDrag !== null) {
            camera.move(new Vec2(e.movementX * settings.cameraSpeedDrag, e.movementY * settings.cameraSpeedDrag));
        } else {
            mouseState.position.x = e.pageX * (canvas.width / canvas.clientWidth), 
            mouseState.position.y = e.pageY * (canvas.height / canvas.clientHeight)
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
    function mouseMoveLockCursor(e) { 
        // Weird bug fix for problem when mouse suddenly moves too fast. 
        // if (Math.abs(e.movementX) > 200) {l('too fast', e); return}
        // if (Math.abs(e.movementY) > 200) {l('too fast', e); return}

        const cameraWidth = 1920;
        const cameraHeight = 1080;
        const cameraBuffer = 100
        const bottomThingyHeight = 200

        // TODO: Handle things with a locked curser and MovementX / MovementY mouse event properties
        if (mouseState.cameraDrag !== null) {
            // TODO: Clamp based on world boundaries
            camera.position.x = clamp(camera.position.x + e.movementX * settings.cameraSpeedDrag, -cameraBuffer, world.width - cameraWidth + cameraBuffer);
            camera.position.y = clamp(camera.position.y + e.movementY * settings.cameraSpeedDrag, -cameraBuffer, world.height - cameraHeight + cameraBuffer + bottomThingyHeight);
        } else {
            mouseState.position.x = clamp(mouseState.position.x + e.movementX * settings.mouseSpeed, 0, cameraWidth);
            mouseState.position.y = clamp(mouseState.position.y + e.movementY * settings.mouseSpeed, 0, cameraHeight);
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

    const keyset = new Set();
    document.addEventListener('keydown', function(e) {
        if (keyset.has(e.key)) return;

        if (e.key === "ArrowRight") {
            camera.moveDirection.x += 1;
        }
        else if (e.key === "ArrowLeft") {
            camera.moveDirection.x -= 1;
        }
        else if (e.key === "ArrowUp") {
            camera.moveDirection.y -= 1;
        }
        else if (e.key === "ArrowDown") {
            camera.moveDirection.y += 1;
        }
        keyset.add(e.key);
    });
    document.addEventListener('keyup', function(e) {
        keyset.delete(e.key);

        if (e.key === "ArrowRight") {
            camera.moveDirection.x -= 1;
        }
        else if (e.key === "ArrowLeft") {
            camera.moveDirection.x += 1;
        }
        else if (e.key === "ArrowUp") {
            camera.moveDirection.y += 1;
        }
        else if (e.key === "ArrowDown") {
            camera.moveDirection.y -= 1;
        }
    });

    requestAnimationFrame(time => {
        handleAnimationFrame.lastTime = time;
        handleAnimationFrame(time);
    });
}