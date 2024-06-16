'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

function _setDrawContextMatrixSettings(ctx, cellWidth) {
    const fontSize = cellWidth/2; // Only displays well for up to 3 digits
    ctx.lineWidth = cellWidth/20;
    ctx.font = `${fontSize}px sans-serif`; 
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'black'
}

function _pathGrid(ctx, columns, rows, drawSettings) {
    const {leftX, topY, cellWidth, } = drawSettings
    const matrixWidth = cellWidth * columns;
    ctx.rect(leftX, topY, matrixWidth, cellWidth * rows);
    for (let i = 1; i < columns; i++) {
        ctx.moveTo(leftX + i * cellWidth, topY);
        ctx.lineTo(leftX + i * cellWidth, topY + cellWidth * rows);
    }
    for (let i = 1; i < rows; i++) {
        ctx.moveTo(leftX, topY + i * cellWidth);
        ctx.lineTo(leftX + matrixWidth, topY + i * cellWidth);
    }
}
function _fillGridNumbers(ctx, numbers, columns, rows, drawSettings) {
    const {leftX, topY, cellWidth } = drawSettings

    for (let y = 0; y < rows; y++) {
        const textY = topY + cellWidth * y + cellWidth/2;
        for (let x = 0; x < columns; x++) {
            const textX = leftX + cellWidth * x + cellWidth/2;
            const number = numbers[x + y * columns];
            ctx.fillText(number, textX, textY);
        }
    }
}

class CheckoffMatrix {
    constructor(width, height) {
        this.columns = width;
        this.rows = height;
        this.numbers = [];
        this.checkedNumbers = new Set();
        this.hoverIndex = null;
        for (let i = 1; i <= width * height; i++) {
            this.numbers.push(i);
        }
    }
    draw(ctx, drawSettings) {
        const {leftX, topY, cellWidth } = drawSettings
        _setDrawContextMatrixSettings(ctx, cellWidth);
        ctx.beginPath();
        _pathGrid(ctx, this.columns, this.rows, drawSettings);
        ctx.stroke();
        _fillGridNumbers(ctx, this.numbers, this.columns, this.rows, drawSettings);

        // TODO: make the checkoff mark a nice cross or something
        for (const checkedNumber of this.checkedNumbers) {
            ctx.fillStyle = 'pink';
            const xIdx = checkedNumber % this.columns;
            const yIdx = (checkedNumber / this.columns) | 0;
            const cellLeftX = leftX + xIdx * cellWidth;
            const cellTopY = topY + yIdx * cellWidth;
            const highlightSize = cellWidth;
            ctx.fillRect(cellLeftX, cellTopY, highlightSize, highlightSize);            
        }

        // Highlight hovered cell
        if (this.hoverIndex !== null) {
            // Make the hover nice
            ctx.fillStyle = 'blue';
            const xIdx = this.hoverIndex % this.columns;
            const yIdx = (this.hoverIndex / this.columns) | 0;
            const cellLeftX = leftX + xIdx * cellWidth;
            const cellTopY = topY + yIdx * cellWidth;
            const highlightSize = cellWidth;
            ctx.fillRect(cellLeftX, cellTopY, highlightSize, highlightSize);
        }

        // TODO: add a text field for checking off by typing
    }
    checkHover(mousePosition, drawSettings) {
        const {leftX, topY, cellWidth } = drawSettings
        const matrixWidth = cellWidth * this.columns;
        const matrixHeight = cellWidth * this.rows;
        if (mousePosition.x < leftX || leftX + matrixWidth < mousePosition.x ||
            mousePosition.y < topY || topY + matrixHeight < mousePosition.y) {
            this.hoverIndex = null;
            return false;
        }
        const hoverX = Math.min(Math.floor((mousePosition.x - leftX) / cellWidth), this.columns-1);
        const hoverY = Math.min(Math.floor((mousePosition.y - topY) / cellWidth), this.rows-1)

        this.hoverIndex = hoverX + hoverY * this.columns;
        return true
    }
}

class GameMatrix {
    constructor(width, height) { // The last row of height is missing
        this.columns = width;
        this.rows = height;
        this.guessedNumbers = [];
        this.hiddenNumbers = [];
        this.numbers = [];

        this.hoverIndex = null;
        this.selectIndex = null;

        for (let i = 1; i <= width * height; i++) {
            this.numbers.push(i);
        }
        shuffle(this.numbers);
        for (let i = 0; i < width; i++) {
            this.guessedNumbers.push([]);
            this.hiddenNumbers.push(this.numbers.pop());
        }
    }
    draw(ctx, drawSettings) {
        const {leftX, topY, cellWidth } = drawSettings
        const guessRowTopY = topY + this.rows * cellWidth - cellWidth/2;
        _setDrawContextMatrixSettings(ctx, cellWidth)
        // Matrix and guess row borders
        ctx.beginPath();
        _pathGrid(ctx, this.columns, this.rows-1, drawSettings);
        _pathGrid(ctx, this.columns, 1, {
            ...drawSettings,
            topY: guessRowTopY
        });
        ctx.stroke();

        // Draw cell numbers
        _fillGridNumbers(ctx, this.numbers, this.columns, this.rows-1, drawSettings);
        const guessedNumbers = this.guessedNumbers.map(a => a.join(''));
        _fillGridNumbers(ctx, guessedNumbers, this.columns, 1, {
            ...drawSettings,
            topY: guessRowTopY
        });

        // Highlight hovered cell
        if (this.hoverIndex !== null) {
            ctx.strokeStyle = 'pink';
            const cellLeftX = leftX + this.hoverIndex * cellWidth;
            const highlightSize = cellWidth;
            ctx.strokeRect(cellLeftX, guessRowTopY, highlightSize, highlightSize);
        }
        // Highlight selected cell
        if (this.selectIndex !== null) {
            ctx.strokeStyle = 'red';
            const cellLeftX = leftX + this.selectIndex * cellWidth;
            const highlightSize = cellWidth - 2*ctx.lineWidth;
            ctx.strokeRect(cellLeftX + ctx.lineWidth, guessRowTopY + ctx.lineWidth, highlightSize, highlightSize);
        }
    }
    checkHover(mousePosition, drawSettings) {
        const {leftX, topY, cellWidth } = drawSettings
        const matrixWidth = cellWidth * this.columns;
        const guessRowTopY = topY + this.rows * cellWidth - cellWidth/2;
        if (mousePosition.x < leftX || leftX + matrixWidth < mousePosition.x ||
            mousePosition.y < guessRowTopY || guessRowTopY + cellWidth < mousePosition.y) {
            this.hoverIndex = null;
            return false;
        }

        this.hoverIndex = Math.min(Math.floor((mousePosition.x - leftX) / cellWidth), this.columns-1);
        return true
    }
}

function draw(time) {
    const dt = time - draw.lastTime;
    draw.lastTime = time;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const gameMatrixDrawSettings = {
        leftX: 10,
        topY: 5,
        cellWidth: 50
    };
    const checkoffMatrixDrawSettings = {
        leftX: 600,
        topY: 5,
        cellWidth: 50
    };
    gameMatrix.checkHover(mousePosition, gameMatrixDrawSettings);
    checkoffMatrix.checkHover(mousePosition, checkoffMatrixDrawSettings);


    // TODO: No need to redraw top. Only bottom needs to be redrawn. (Does this really matter?)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameMatrix.draw(ctx, gameMatrixDrawSettings);
    checkoffMatrix.draw(ctx, checkoffMatrixDrawSettings);

    requestAnimationFrame(draw);
}

const gameMatrix = new GameMatrix(10, 10);
const checkoffMatrix = new CheckoffMatrix(10, 10);
const mousePosition = { // Should mouse position be individual and computed for each canvas?
    x: 0,
    y: 0
}

function startGame() {

    const canvas = document.getElementById('canvas');
    canvas.addEventListener('mousemove', function(e) {
        mousePosition.x = (e.pageX - e.target.offsetLeft) * (canvas.width / canvas.clientWidth); 
        mousePosition.y = (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight);
    });
    canvas.addEventListener('mousedown', function(e) {
        if (e.button === MOUSE_LEFT_BUTTON) {
            if (gameMatrix.hoverIndex === null) {
                gameMatrix.selectIndex = null;
            } else {
                gameMatrix.selectIndex = gameMatrix.hoverIndex;
            }
        }

        if (e.button === MOUSE_LEFT_BUTTON) {
            const idx = checkoffMatrix.hoverIndex;
            if (idx !== null) {
                if (checkoffMatrix.checkedNumbers.has(idx)) {
                    checkoffMatrix.checkedNumbers.delete(idx);
                } else {
                    checkoffMatrix.checkedNumbers.add(idx);
                }
            }
        }
    })
    document.addEventListener('keydown', function(e) {
        if (gameMatrix.selectIndex === null) return;
        const numberArray = gameMatrix.guessedNumbers[gameMatrix.selectIndex];
        switch (e.key) {
            // TODO: Tab and shift tab to move between?
            case 'ArrowRight': {
                gameMatrix.selectIndex = Math.min(gameMatrix.selectIndex + 1, gameMatrix.columns-1);
            } break;
            case 'ArrowLeft': {
                gameMatrix.selectIndex = Math.max(gameMatrix.selectIndex - 1, 0);
            } break;
            case 'Escape': {
                gameMatrix.selectIndex = null;
            } break;            
            case 'Delete': {
                gameMatrix.guessedNumbers[gameMatrix.selectIndex] = [];
            } break;
            case 'Backspace': {
                numberArray.pop();
            } break;
            case '0': 
                if (numberArray.length === 0) break; // Prevent leading zeros
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7': 
            case '8': 
            case '9': {
                numberArray.push(e.key);
            } break;
        }
        // If the last pushed number made it too big. Ignore
        if (Number(numberArray.join('')) > gameMatrix.columns * gameMatrix.rows) {
            numberArray.pop();
        }

    });


    requestAnimationFrame(time => {
        draw.lastTime = time;
        draw(time)
    })

}