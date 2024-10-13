"use strict";
const l = console.log;
[].__proto__.contains = function() {
    for (let i = 0; i < arguments.length; i++) {
        const element = arguments[i];
        if (this.indexOf(element) !== -1) return true;
    }
    return false;
};
[].__proto__.copy = function() {
    return this.concat();
};
[].__proto__.toString = function() { // TODO: REMOVE OVERWRITE OF ARRAY toString. 
    let result = "[";
    for (let i = 0; i < this.length-1; i++) {
        result += this[i].toString() + ', ';
    }
    result += this[this.length-1] + "]"
    return result;
}
Math.random.__proto__.randint = function(low, high) { // Does not include high
    return Math.floor(Math.random() * high) + low; 
};
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

function draw(time) {

}

const CONNECTION_POSITIONS = {
    TOP: 0, 
    TOP_RIGHT: 1,
    RIGHT: 2,
    BOTTOM_RIGHT: 3,
    BOTTOM: 4,
    BOTTOM_LEFT: 5,
    LEFT: 6,
    TOP_LEFT: 7,
    UNDECIDED: 8
}

const tileSize = 40;


function findMatches(tile, connectionPosition) {
    switch (connectionPosition) {
        case CONNECTION_POSITIONS.LEFT: {
            return [LR]
        } break;
        case CONNECTION_POSITIONS.RIGHT: {
            return [LR]
        } break;
        case CONNECTION_POSITIONS.TOP: {
            return [TB]
        } break;
        case CONNECTION_POSITIONS.BOTTOM: {
            return [TB]
        } break;
        default: {
            return [Empty]
        } break;
    }
}

function isAdjacent(positionA, positionB) {
    const dx = Math.abs(positionA.x - positionB.x);
    const dy = Math.abs(positionA.y - positionB.y);
    return dx + dy === 1;
}

function canConnect(a, b) {
    const dx = b.position.x - a.position.x; // Positive => b is right of a
    const dy = b.position.y - a.position.y; // Positive => b is down from a

    return (dy === 0 && dx === 1 && a.canConnect[RIGHT] && b.canConnect[LEFT])  ||
           (dy === 0 && dx === -1 && a.connectLeft && b.connectRight) ||
           (dx === 0 && dy === 1 && a.connectDown && b.connectUp)     ||
           (dx === 0 &&dy === -1 && a.connectUp && b.connectDown);
}

function canConnectLeft(leftConnections, rightConnections) {
    const leftHasConnection = leftConnections.contains(CONNECTION_POSITIONS.RIGHT);
    const rightHasConnection = rightConnections.contains(CONNECTION_POSITIONS.LEFT);
    return leftHasConnection === rightHasConnection; // Both has or neiter has
}

function canConnectDown(topConnections, bottomConnections) {
    const topHasConnection = topConnections.contains(CONNECTION_POSITIONS.BOTTOM);
    const bototmHasConnection = bottomConnections.contains(CONNECTION_POSITIONS.TOP);
    return topHasConnection === bototmHasConnection; // Both has or neiter has
}

class LR {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
    }

}
LR.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT];

class TB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize + tileSize/2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y + 1) * tileSize);
    }
}
TB.connectionPositions = [CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]


class LTR {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize);

    }
}
LTR.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.TOP]

class LRB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);

    }
}
LRB.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM]

class LTRB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);

    }
}
LTRB.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]

class LT {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize);

    }
}
LT.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.TOP]

class LB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}
LB.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.BOTTOM]

class RB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}
RB.connectionPositions = [CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM]

class TR {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize);
    }
}
TR.connectionPositions = [CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.TOP]


class LTB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}
LTB.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]

class TRB {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}
TRB.connectionPositions = [CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]

class R {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
    }
}
R.connectionPositions = [CONNECTION_POSITIONS.RIGHT]

class T {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {        
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize + tileSize/2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);

    }
}
T.connectionPositions = [CONNECTION_POSITIONS.TOP]

class L {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);

    }
}
L.connectionPositions = [CONNECTION_POSITIONS.LEFT]

class B {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize + tileSize/2, (y+1)*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
    }
}
B.connectionPositions = [CONNECTION_POSITIONS.BOTTOM]

class Empty {
    constructor(x, y) {
        this.position = {x, y};
    }

    line(ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(this.x * 40, this.y * 40, 20, 20)
    }
}
Empty.connectionPositions = [];

const creationArray = [
    L, T, R, B, 
    LT, LR, LB, TR, TB, RB, 
    LTR, LTB, LRB, TRB, 
    LTRB,
];

function naiveLeftUpFindCandidateTileTypes(leftTile, aboveTile) {
    const result = [];

    // If a tile is not to the left or above, then we initialize to an empty connections array, i.e. an empty cell.
    const leftConnections = leftTile === null? [] : leftTile.__proto__.constructor.connectionPositions;
    const topConnections = aboveTile === null? [] : aboveTile.__proto__.constructor.connectionPositions;

    // Check whether left and top has a connection to this position
    const leftHasConnection = leftConnections.contains(CONNECTION_POSITIONS.RIGHT);
    const topHasConnection = topConnections.contains(CONNECTION_POSITIONS.BOTTOM);

    for (const creator of creationArray) {
        // Check whether this tile type has a connection to the left and up;
        const rightHasConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.LEFT);
        const bottomHasConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.TOP);

        // Only if all tile types agree on having or not having a connection do we 
        if (leftHasConnection === rightHasConnection && topHasConnection === bottomHasConnection) {
            result.push(creator);
        } 
    }
    return result;
}

function naiveAllDirectionFindCandidateTileTypes(leftTile, aboveTile, hasRight, hasDown) {
    const result = [];

    // If a tile is not to the left or above, then we initialize to an empty connections array, i.e. an empty cell.
    const leftConnections = leftTile === null? [] : leftTile.__proto__.constructor.connectionPositions;
    const topConnections = aboveTile === null? [] : aboveTile.__proto__.constructor.connectionPositions;

    // Check whether left and top has a connection to this position
    const leftHasConnection = leftConnections.contains(CONNECTION_POSITIONS.RIGHT);
    const topHasConnection = topConnections.contains(CONNECTION_POSITIONS.BOTTOM);

    for (const creator of creationArray) {
        // Check whether this tile type has a connection to the left and up;
        const typeHasLeftConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.LEFT);
        const typeHasTopConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.TOP);
        const typeHasRightConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.RIGHT);
        const typeHasDownConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.BOTTOM);

        // Only if all tile types agree on having or not having a connection do we 
        // l(creator.name, typeHasLeftConnection, typeHasTopConnection, typeHasRightConnection, typeHasDownConnection);
        if (leftHasConnection === typeHasLeftConnection && topHasConnection === typeHasTopConnection) {
            const noRightConnection = !hasRight && !typeHasRightConnection;
            const noDownConnection = !hasDown && !typeHasDownConnection;
            if ((hasRight && hasDown) ||
                (hasDown && noRightConnection) ||
                (hasRight && noDownConnection)  ||
                (noRightConnection && noDownConnection)) {
                result.push(creator);
            }
        } 
    }
    // l(result)
    return result;
}

function allDirectionFindCandidateTileTypes(leftTile, aboveTile, hasRight, hasDown) {
    const result = [];

    // If a tile is not to the left or above, then we initialize to an empty connections array, i.e. an empty cell.
    const leftConnections = leftTile === null? [] : leftTile.__proto__.constructor.connectionPositions;
    const topConnections = aboveTile === null? [] : aboveTile.__proto__.constructor.connectionPositions;

    // Check whether left and top has a connection to this position
    const leftHasConnection = leftConnections.contains(CONNECTION_POSITIONS.RIGHT);
    const topHasConnection = topConnections.contains(CONNECTION_POSITIONS.BOTTOM);

    for (const creator of creationArray) {
        // Check whether this tile type has a connection to the left and up;
        const typeHasLeftConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.LEFT);
        const typeHasTopConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.TOP);
        const typeHasRightConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.RIGHT);
        const typeHasDownConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.BOTTOM);

        // Only if all tile types agree on having or not having a connection do we 
        // l(creator.name, typeHasLeftConnection, typeHasTopConnection, typeHasRightConnection, typeHasDownConnection);
        if (leftHasConnection === typeHasLeftConnection && topHasConnection === typeHasTopConnection) {
            const noRightConnection = !hasRight && !typeHasRightConnection;
            const noDownConnection = !hasDown && !typeHasDownConnection;
            if ((hasRight && hasDown) ||
                (hasDown && noRightConnection) ||
                (hasRight && noDownConnection)  ||
                (noRightConnection && noDownConnection)) {
                result.push(creator);
            }
        } 
    }
    // l(result)
    return result;
}
function allDirectionWithConnectionCountFindCandidateTileTypes(leftConnections, aboveConnections, rightConnections, downConnections, openConnectionsCount) {
    const result = [];

    // Check whether left and top has a connection to this position
    const leftHasConnection = leftConnections.contains(CONNECTION_POSITIONS.RIGHT);
    const leftUndecided = leftConnections.contains(CONNECTION_POSITIONS.UNDECIDED);
    const topHasConnection = aboveConnections.contains(CONNECTION_POSITIONS.BOTTOM);
    const topUndecided = aboveConnections.contains(CONNECTION_POSITIONS.UNDECIDED);
    const rightHasConnection = rightConnections.contains(CONNECTION_POSITIONS.LEFT);
    const rightUndecided = rightConnections.contains(CONNECTION_POSITIONS.UNDECIDED);
    const downHasConnection = downConnections.contains(CONNECTION_POSITIONS.TOP);
    const downUndecided = downConnections.contains(CONNECTION_POSITIONS.UNDECIDED);

    const noConnection = !leftHasConnection && !topHasConnection && !rightHasConnection && !downHasConnection;

    for (const creator of creationArray) {
        // Check whether this tile type has a connection to the left and up;
        const typeHasLeftConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.LEFT);
        const typeHasTopConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.TOP);
        const typeHasRightConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.RIGHT);
        const typeHasDownConnection = creator.connectionPositions.contains(CONNECTION_POSITIONS.BOTTOM);

        // Only if all tile types agree on having or not having a connection do we 
        // l(creator.name, typeHasLeftConnection, typeHasTopConnection, typeHasRightConnection, typeHasDownConnection);
        if ((leftUndecided || leftHasConnection === typeHasLeftConnection) && 
            (topUndecided || topHasConnection === typeHasTopConnection) && 
            (rightUndecided || rightHasConnection === typeHasRightConnection) && 
            (downUndecided || downHasConnection === typeHasDownConnection))
        {
            result.push(creator);
        } 
    }
    l('creators ',result)
    return result;
}
    
// TODO: Create connection logic.
function onbodyload() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    const offset = 3;
    const width = 30;
    const height = 20;

    // const tiles = createMapRandomly(width, height);
    // const tiles = createMapSimpleConnectionRules(width, height);
    // const tiles = createMapAllDirectionConnectionRules(width, height);
    const tiles = createMapAllDirectionFullyConnectedConnectionRules(width, height);
    l(tiles);

    drawMap(ctx, tiles, width, height, offset)
}

function drawMap(ctx, tiles, width, height, offset) {
    ctx.fillRect(0, 0, width * (tileSize+offset), height * (tileSize+offset));

    ctx.strokeStyle = 'white'
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile === null) continue;
       ctx.setTransform(1, 0, 0, 1, tile.position.x * offset, tile.position.y * offset);
       tile.line(ctx); 
    }

    ctx.stroke();
    ctx.stroke();
}


// Completely naive map creation. Does not obey any connection rules.
function createMapRandomly(width, height) {
    const result = [];
    for (let i = 0; i < width * height; i++) {
        const x = (i % width) + 1;
        const y = ~~(i / width) + 1;
        const randomChoice = Math.random.randint(0, creationArray.length); 
        result.push(new creationArray[randomChoice](x, y));   
    }
    return result;
}

// Semi-naive map creation. Creates map from top left to to bottom right, one row at a time. 
// Only takes into consideration rules of left and above tiles but not border walls. 
function createMapSimpleConnectionRules(width, height) {
    const result = [];
    for (let i = 0; i < width * height; i++) {
        const x = (i % width) + 1;
        const y = ~~(i / width) + 1;

        let above = y == 1? null : result[i - width];
        let left = x == 1? null : result[i-1];

        const availableTyleTypes = naiveLeftUpFindCandidateTileTypes(left, above); 
        const randomChoice = Math.random.randint(0, availableTyleTypes.length); 

        result.push(new availableTyleTypes[randomChoice](x,y) )
    }
    return result;
}

// Less-naive map creation. Creates map from top left to to bottom right, one row at a time. 
// Takes into consideration all surrounding positions
function createMapAllDirectionConnectionRules(width, height) {
    const result = [];
    // l(width, height);
    for (let i = 0; i < width * height; i++) {
        const x = (i % width) + 1;
        const y = ~~(i / width) + 1;

        const above = y == 1? null : result[i - width];
        const left = x == 1? null : result[i-1];
        const hasRight = x !== width;
        const hasDown = y !== height;
        // l(hasRight, hasDown, x, y);
        // l(x, y, result)

        const availableTyleTypes = naiveAllDirectionFindCandidateTileTypes(left, above, hasRight, hasDown); 
        if (availableTyleTypes.length > 0) {
            const randomChoice = Math.random.randint(0, availableTyleTypes.length); 
            result.push(new availableTyleTypes[randomChoice](x,y) )
        } else {
            result.push(new Empty(x, y));
        }

    }
    return result;
}

// Returns a list of possible connections to be made to this tile, a given default if the tile is null, or an empty list if the tile is outOfBounds.
function getConnectionsOr(tile, isOutOfBounds, nullDefault) {
    if (isOutOfBounds) return [];
    if (tile === null) return nullDefault;
    return tile.__proto__.constructor.connectionPositions; // This is ugly.
}

function createMapAllDirectionFullyConnectedConnectionRules(width, height) {
    const result = Array.from(Array(width * height)).map(() => null); // Initialize result array to fit whole map.
    const firstChoice = naiveAllDirectionFindCandidateTileTypes(null, null, true, true); // Find all possible initial tiles which works for top left (this could be any tile in theory).
    const first = firstChoice[Math.random.randint(0, firstChoice.length)]; // Pick one of the possibilities
    result[0] = new first(0, 0); // Set top left as the chosen tile

    // Initialize queue with positions
    const nextPositionQueue = [];
    if (first.connectionPositions.contains(CONNECTION_POSITIONS.RIGHT)) nextPositionQueue.push({x: 1, y: 0});
    if (first.connectionPositions.contains(CONNECTION_POSITIONS.BOTTOM)) nextPositionQueue.push({x: 0, y: 1});

    let openConnectionsCount = first.connectionPositions.length;
    while (nextPositionQueue.length > 0) {
        const {x, y} = nextPositionQueue.shift();
        const index = x + y * width;
        if (result[index] !== null) continue; // Ignore if we have already made a tile here.

        const leftConnections = getConnectionsOr(result[index-1], x == 0, [CONNECTION_POSITIONS.UNDECIDED]); 
        const aboveConnections = getConnectionsOr(result[index - width], y == 0, [CONNECTION_POSITIONS.UNDECIDED]);
        const rightConnections = getConnectionsOr(result[index + 1],  x == width-1, [CONNECTION_POSITIONS.UNDECIDED]);
        const downConnections = getConnectionsOr(result[index + width], y == height-1, [CONNECTION_POSITIONS.UNDECIDED]);

        const availableTyleTypes = allDirectionWithConnectionCountFindCandidateTileTypes(leftConnections, aboveConnections, rightConnections, downConnections, openConnectionsCount); 
        if (availableTyleTypes.length > 0) { // TODO: Keep track of open positions and make sure we don't close early 
            const randomChoice = Math.random.randint(0, availableTyleTypes.length); 
            const creator = availableTyleTypes[randomChoice];
            // openConnectionsCount = openConnectionsCount - 2 + creator.connectionPositions.length;
            l(openConnectionsCount, creator.connectionPositions.length, creator)
            addNewNeighbors(nextPositionQueue, creator.connectionPositions, {x, y});
            result[index] = new creator(x,y);
        } else {
            result[index] = new Empty(x, y); 
        }

    }
    return result;
}

function addNewNeighbors(queue, connectionPositions, {x, y}) {
    if (connectionPositions.contains(CONNECTION_POSITIONS.BOTTOM)) {
        queue.unshift({x, y:y+1});
    }
    if (connectionPositions.contains(CONNECTION_POSITIONS.TOP)) {
        queue.unshift({x, y:y-1});
    }
    if (connectionPositions.contains(CONNECTION_POSITIONS.LEFT)) {
        queue.unshift({x:x-1, y:y});
    }
    if (connectionPositions.contains(CONNECTION_POSITIONS.RIGHT)) {
        queue.unshift({x:x+1, y});
    }
}

// For every neighbor
//

function getNeighborIndices(index, width, height) {
    const result = [];
    const x = index % width;
    const y = Math.floor(index / width);
    assert(y < height);

    if (x == 0) result.push(-1);
    else result.push(index - 1);

    if (x === width-1) result.push(-1);
    else result.push(index + 1);

    if (y === 0) result.push(-1);
    else result.push(result - width);

    if (y === height-1) result.push(-1);
    else result.push(result + width);

    return result;
}

function getArrayNeighborsOrDefault(array, index, width, height, defaultValue=null) {
    return getNeighborIndices(index, width, height).map(i => {
        if (i === -1) return defaultValue;
        else return array[i];
    });
}

function isCreatorValid(creator, superstates, index) {
    // For every direction (UP, DOWN, LEFT, RIGHT)
    //      For every type in superstates[index + direction]
    //          if creator match type return true
    // return false
}

function createMapWaveFunctionNaive(width, height) {
    const result = Array.from(Array(width * height)).map(() => null); // Initialize result array to fit whole map.
    const superstates = Array.from(Array(width * height)).map(() => creationArray.copy()); // Initialize set of initially possible state for each position

    // This might be necessary if we chain reaction of events which can circle back. 
    const dirtyPositions = new Set(Array.from(Array(100)).map((_,i)=> i)); //  Keeps track of which positions we need to look at due to a change

    for (let i = 0; i < superstates.length; i++) {
        const x = i % width;
        const y = Math.floor(i / width);

        const toBeRemoved = [];
        for (let j = 0; j < superstates[i].length; j++) {
            const creator = superstates[i][j];
            // Check that this creator is valid with respect to surrounding tiles
            if (!isCreatorValid(creator, superstates, i)) {
                toBeRemoved.push(j);
            }
        }

        if (toBeRemoved > 0) {
            // Remove from superstate[i]
            // Add neighbors to dirtypositions
        }



        
    }


    const firstChoice = naiveAllDirectionFindCandidateTileTypes(null, null, true, true); // Find all possible initial tiles which works for top left (this could be any tile in theory).
    const first = firstChoice[Math.random.randint(0, firstChoice.length)]; // Pick one of the possibilities
    result[0] = new first(0, 0); // Set top left as the chosen tile

    // Initialize queue with positions
    const nextPositionQueue = [];
    if (first.connectionPositions.contains(CONNECTION_POSITIONS.RIGHT)) nextPositionQueue.push({x: 1, y: 0});
    if (first.connectionPositions.contains(CONNECTION_POSITIONS.BOTTOM)) nextPositionQueue.push({x: 0, y: 1});

    let openConnectionsCount = first.connectionPositions.length;
    while (nextPositionQueue.length > 0) {
        const {x, y} = nextPositionQueue.shift();
        const index = x + y * width;
        if (result[index] !== null) continue; // Ignore if we have already made a tile here.

        const leftConnections = getConnectionsOr(result[index-1], x == 0, [CONNECTION_POSITIONS.UNDECIDED]); 
        const aboveConnections = getConnectionsOr(result[index - width], y == 0, [CONNECTION_POSITIONS.UNDECIDED]);
        const rightConnections = getConnectionsOr(result[index + 1],  x == width-1, [CONNECTION_POSITIONS.UNDECIDED]);
        const downConnections = getConnectionsOr(result[index + width], y == height-1, [CONNECTION_POSITIONS.UNDECIDED]);

        const availableTyleTypes = allDirectionWithConnectionCountFindCandidateTileTypes(leftConnections, aboveConnections, rightConnections, downConnections, openConnectionsCount); 
        if (availableTyleTypes.length > 0) { // TODO: Keep track of open positions and make sure we don't close early 
            const randomChoice = Math.random.randint(0, availableTyleTypes.length); 
            const creator = availableTyleTypes[randomChoice];
            // openConnectionsCount = openConnectionsCount - 2 + creator.connectionPositions.length;
            l(openConnectionsCount, creator.connectionPositions.length, creator)
            addNewNeighbors(nextPositionQueue, creator.connectionPositions, {x, y});
            result[index] = new creator(x,y);
        } else {
            result[index] = new Empty(x, y); 
        }

    }
    return result;
}