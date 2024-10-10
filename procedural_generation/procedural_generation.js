"use strict";
const l = console.log;
[].__proto__.contains = function(element) {
    return this.indexOf(element) != -1;
}
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
    TOP_LEFT: 7
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

const Empty = {
    line(ctx) {}
}

class LR {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT];
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
    }
}

class TB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize + tileSize/2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y + 1) * tileSize);
    }
}

class LTR {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize);

    }
}

class LRB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);

    }
}

class LTRB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo((x+1)*tileSize, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);

    }
}


class LT {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize);

    }
}


class LB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.BOTTOM]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}

class RB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}

class TR {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize);
    }
}



class LTB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.LEFT, CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}



class TRB {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.RIGHT, CONNECTION_POSITIONS.BOTTOM, CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
        ctx.moveTo(x * tileSize + tileSize / 2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, (y+1) * tileSize);
    }
}
class R {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.RIGHT]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo((x+1) * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
    }
}
class T {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.TOP]
    }

    line(ctx) {        
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize + tileSize/2, y*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);

    }
}
class L {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.L]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize, y*tileSize + tileSize / 2);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);

    }
}
class B {
    constructor(x, y) {
        this.position = {x, y};
        this.connectionPositions = [CONNECTION_POSITIONS.BOTTOM]
    }

    line(ctx) {
        const {x, y} = this.position;
        ctx.moveTo(x * tileSize + tileSize/2, (y+1)*tileSize);
        ctx.lineTo(x*tileSize + tileSize/2, y * tileSize + tileSize /2);
    }
}

// const tiles = [
//     new LR(1, 1),
//     new TB(2, 1),
//     new LTR(3, 1),
//     new LRB(4,1),
//     new LTRB(5, 1),
//     new LT(6, 1),
//     new LB(7, 1),
//     new RB(8, 1),
//     new TR(9, 1),
//     new LTB(10, 1),
//     new TRB(11, 1),
//     new R(12, 1),
//     new T(13, 1),
//     new L(14, 1),
//     new B(15, 1),

// // {    
// //     connectionPositions: [CONNECTION_POSITIONS.TOP_LEFT, CONNECTION_POSITIONS.BOTTOM_RIGHT],
// //     position: {x: 1, y: 2},
// //     line(ctx) {
// //         const {x, y} = this.position;
// //         ctx.moveTo(x * tileSize, y*tileSize);
// //         ctx.lineTo((x+1)*tileSize , (y + 1) * tileSize);
// //     } 
// // },

// // {    
// //     connectionPositions: [CONNECTION_POSITIONS.BOTTOM_LEFT, CONNECTION_POSITIONS.TOP_RIGHT],
// //     position: {x: 2, y: 2},
// //     line(ctx) {
// //         const {x, y} = this.position;
// //         ctx.moveTo(x * tileSize, (y+1)*tileSize);
// //         ctx.lineTo((x+1)*tileSize , y * tileSize);
// //     } 
// // },

// // {    
// //     connectionPositions: [CONNECTION_POSITIONS.TOP_LEFT, CONNECTION_POSITIONS.BOTTOM_RIGHT, CONNECTION_POSITIONS.BOTTOM],
// //     position: {x: 3, y: 2},
// //     line(ctx) {
// //         const {x, y} = this.position;
// //         ctx.moveTo(x * tileSize, y*tileSize);
// //         ctx.lineTo((x+1)*tileSize, (y + 1) * tileSize);
// //         ctx.moveTo(x * tileSize + tileSize/2, y*tileSize + tileSize/2);
// //         ctx.lineTo(x * tileSize + tileSize/2, (y+1)*tileSize);
// //     } 
// // },

// ]

// TODO: Create connection logic.
function onbodyload() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const creationArray = [
        L, T, R, B, 
        LT, LR, LB, TR, TB, RB, 
        LTR, LTB, LRB, TRB, 
        LTRB,
    ]

    const tiles = [];
    const nextPositions = [];

    for (let i = 0; i < creationArray.length; i++) {
        tiles.push(new creationArray[i](i + 1, 1));
    }

    // let t = 0;
    // for (let y = 1; y < 5; y++) {
    //     for (let x = 1; x < 10; x++) {
    //         tiles.push(new creationArray[t % creationArray.length](x, y));
    //         t++
    //     }
    // }

    for (const tile of tiles) {
       tile.line(ctx); 
    }


    ctx.stroke();

}
