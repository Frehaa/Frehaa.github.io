let l = console.log

const HEX = 'hex';
const CHAR = 'char';
const DECIMAL = 'decimal';
const BINARY = 'binary';

let arrayBuffer = new ArrayBuffer(1000);
function initializeFileInput() {
    const reader = new FileReader();
    reader.onload = (event) => {
        arrayBuffer = event.target.result;
        updateTable();
        updateHistogram();
    };

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        reader.readAsArrayBuffer(file)
    });
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        reader.readAsArrayBuffer(file)
    }

}

class ByteTable {
    constructor(table, rows, columns, format) {
        table.innerHTML = "";
        this.table = table;
        this.rows = 0;
        this.columns = 0;
        this.format = format;

        for (let i = 0; i < rows; i++) {
            this.addRow();
        }
        for (let i = 0; i < columns + 1; i++) {
            this.addColumn();
        }
    }
    addRow(){
        let row = document.createElement('tr');
        this.table.appendChild(row);
        this.rows++;
    }

    addColumn(){
        for (let i = 0; i < this.rows; i++) {
            let col = document.createElement('td');
            this.table.children[i].appendChild(col);
        }
        this.columns++;
    }
    writeCell(row, col, val) {
        let text = null;
        switch (this.format) {
            case HEX: {
                text = "0x" + val.toString(16)
            } break;
            case DECIMAL: {
                text = val;
            } break;
            case CHAR: {
                text = String.fromCharCode(val);
            } break;            
            case BINARY: {
                text = "00000000";
                let bString = val.toString(2);
                text = "0b" + text.slice(bString.length) + bString;
            } break;
            default: {
                throw new Error("Unkown format");
            }
        }
        this.table.children[row].children[col + 1].innerHTML = text;
    }
}

let table = null;
function initializeByteTable(rows, columns) {
    table = new ByteTable(document.getElementById('byte-table'), rows, columns, format=HEX);

    const cellWidthInput = document.getElementById('byte-table-cell-width');
    cellWidthInput.addEventListener('input', function(e) {
        // Get the stylesheet of the HTML document
        const stylesheet = document.styleSheets[0];

        // Find the rule for the "my-class" class in the stylesheet
        const ruleIndex = Array.from(stylesheet.cssRules).findIndex(rule => rule.selectorText === '#byte-table td');
        const rule = stylesheet.cssRules[ruleIndex];

        // Modify the background color property of the "my-class" class
        rule.style["width"] = e.target.value + "px";
        rule.style["max-width"] = e.target.value + "px";
    });
    document.getElementById('byte-table-start').addEventListener('change', e => updateTable());
    document.getElementById('byte-table-format').addEventListener('change', e => updateTable());
}

function updateTable() {
    // Set left side
    table.format = HEX;
    let startIndexInput = document.getElementById('byte-table-start');
    let start = Number(startIndexInput.value);
    let text = start;
    for (let row = 0; row < table.rows; row++) {
        table.writeCell(row, -1, text);
        text += (table.columns-1);
    }
    let formatInput = document.getElementById('byte-table-format');
    const format = formatInput.options[formatInput.selectedIndex].value;
    table.format = format;

    // Copy from array buffer
    let dataView = new DataView(arrayBuffer);
    for (let row = 0; row < table.rows; row++) {
        for (let column = 0; column < (table.columns - 1); column++) {
            let index = start + row * (table.columns - 1) + column;
            let text = "";
            if (index < dataView.byteLength) {
                text = dataView.getUint8(index);
            } 
            table.writeCell(row, column, text);
        }
    }
}

let globalTable = null;

function countBytes(windowSize) {
    let dataView = new DataView(arrayBuffer);
    let a = Array(256**windowSize).fill(0);
    for (let i = 0; i < dataView.byteLength - (windowSize - 1); i++) {
        let val = 0; 
        for (let j = 0; j < windowSize; j++) {
            val = (val << 8) | dataView.getUint8(i + j);
        }
        a[val]++;
    }
    return a
}

// Isolated code for managing tab functionality
function initializeTabFunction(defaultTab) {
    document.getElementById(defaultTab).classList.add('activetab');

    let tablinks = document.getElementsByClassName('tablink')
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', e => {
            document.getElementsByClassName('activetab')[0].classList.remove('activetab');
            let tabName = e.target.dataset['tabtarget'];
            document.getElementById(tabName).classList.add('activetab');
        });
    }
}

function initializeHistogram() {
}

function updateHistogram() {
    let counts = countBytes(1);
    let canvas = document.getElementById('count-histogram-canvas');
    let ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Find the max value and round up to the nearest roundest number
    let maxValue = Math.max(...counts);
    const orderOfMagnitude = Math.floor(Math.log10(maxValue));
    const roundestNumber = Math.pow(10, orderOfMagnitude);
    const quotient = maxValue / roundestNumber;
    maxValue = Math.ceil(quotient) * roundestNumber

    const originX = 50;
    const originY = 50;

    const barWidth = 4; // width of each bar
    const barSpacing = 1
    const histogramHeight = height - 50;
    const histogramWidth = width - 50;
    const axisLineWidth = 1;

    // ctx.strokeStyle = '#000000';

    // draw x axis labels
    for (let i = 0; i <= counts.length; i += 16) {
        const labelX = originX + i * (barWidth + barSpacing);
        const labelY = histogramHeight + 15
        ctx.fillText(i, labelX, labelY);
    }

    // draw y axis labels
    for (let i = 0; i <= maxValue; i += maxValue / 10) {
        const labelX = originX - 30
        const labelY = histogramHeight - (i / maxValue) * (histogramHeight - originY);
        ctx.fillText(i, labelX, labelY);
    }

    // Draw bars
    for (let i = 0; i < counts.length; i++) {
        const value = counts[i];
        const barHeight = (value / maxValue) * (histogramHeight - originY);
        const x = originX + axisLineWidth + i * (barWidth + barSpacing);
        const y = histogramHeight - barHeight - axisLineWidth;
        // l(value, maxValue, histogramHeight, originY, x, y, barHeight)
        ctx.fillRect(x, y, barWidth, barHeight);
    }

    ctx.lineWidth = axisLineWidth;
    // ctx.strokeStyle = 'grey';
    // draw y axis
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, histogramHeight + 1);

    // draw x axis
    ctx.moveTo(originX + 1, histogramHeight)
    ctx.lineTo(histogramWidth - originX, histogramHeight);
    ctx.stroke();
}

function initialize() {
    initializeTabFunction('byte-histogram-tab');
    initializeByteTable(20, 16);
    initializeHistogram();
    initializeFileInput();
}
