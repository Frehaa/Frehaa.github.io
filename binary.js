let l = console.log

const HEX = 'hex';
const CHAR = 'char';
const DECIMAL = 'decimal';
const BINARY = 'binary';

let arrayBuffer = new ArrayBuffer(1000);
function initializeFileInput() {
    const reader = new FileReader();
    reader.addEventListener('load', event => {
        arrayBuffer = event.target.result;
        // Copy from array buffer
        let dataView = new DataView(arrayBuffer);
        table.data = dataView;
        updateTable();
        updateHistogram();
    });
    reader.addEventListener('abort', e => {
        l('Reader abort', e);
    });
    reader.addEventListener('loadend', e => {
        l('Reader loadend', e);
    });
    reader.addEventListener('error', e => {
        l('Reader error', e);
    });
    reader.addEventListener('loadstart', e => {
        l('Reader load start', e);
    });
    reader.addEventListener('progress', e => {
        l('Reader progress', e);
    });

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
        this.search = {needle: '', results: [] };

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
        this.table.children[row].children[col + 1].classList.remove('byte-cell-out-of-bounds')
        this.table.children[row].children[col + 1].classList.remove('byte-cell-search-hit')
    }

    setCellOutOfBounds(row, col) {
        this.table.children[row].children[col + 1].innerHTML = "";
        this.table.children[row].children[col + 1].classList.add('byte-cell-out-of-bounds')
    }
    setCellSearchHit(row, col) {
        this.table.children[row].children[col + 1].classList.add('byte-cell-search-hit')
    }

    writeCellsFrom(start) {
        const searchResult = this.search.results;
        const needleLength = this.search.needle.length;
        const dataView = this.data;
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < (this.columns - 1); column++) {
                const index = start + row * (this.columns - 1) + column;
                if (index < dataView.byteLength) {
                    const text = dataView.getUint8(index);
                    this.writeCell(row, column, text);
                } else {
                    this.setCellOutOfBounds(row, column);
                }
                
                for (let i = 0; i < searchResult.length; i++) {
                    if (index < searchResult[i]) break;
                    if (searchResult[i] <= index && index < searchResult[i] + needleLength) {
                        this.setCellSearchHit(row, column);
                        
                    } 
                }
            }
        }
    }


}
function search(needle, dataView) {
    l(needle, dataView)
    const M = needle.length;
    const N = dataView.byteLength;
    const result = [];
    for (let i = 0; i <= N - M; i++) {
        let j = 0;
        for (; j < M; j++) {
            let c = needle.charCodeAt(j);
            let d = dataView.getUint8(i + j);
            if (c != d)
                break;
        }
        if (j == M) result.push(i);
    }
    return result;
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
    let tableStart = document.getElementById('byte-table-start');
    tableStart.addEventListener('change', e => updateTable());
    document.getElementById('byte-table-format').addEventListener('change', e => updateTable());
    document.getElementById('byte-table-search').addEventListener('change', e => {
        let needle = e.target.value;
        let results = search(needle, table.data);
        table.search = { needle, results };
        let textArea = document.getElementById('byte-table-search-results');
        textArea.innerHTML = "";
        for (let i = 0; i < results.length; i++) {
            textArea.innerHTML += results[i];
            textArea.innerHTML += "\n";
        }
        updateTable()
    });
}

function updateTable() {
    // Set left side
    table.format = HEX;
    const startIndexInput = document.getElementById('byte-table-start');
    const start = Number(startIndexInput.value);
    let text = start;
    for (let row = 0; row < table.rows; row++) {
        table.writeCell(row, -1, text);
        text += (table.columns-1);
    }
    const formatInput = document.getElementById('byte-table-format');
    const format = formatInput.options[formatInput.selectedIndex].value;
    table.format = format;

    table.writeCellsFrom(start)
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


    const marginX = 50;
    const marginY = 50;

    let originX = marginX;
    let originY = marginY;


    const histogramHeight = height - 2 * marginY;
    const histogramWidth = width - 2 * marginX;
    const axisLineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, histogramHeight + originY);
    ctx.lineTo(originX + histogramWidth, histogramHeight + originY);
    ctx.lineTo(originX + histogramWidth, originY);
    ctx.closePath();
    ctx.stroke();

    ctx.font = "bold 18px serif"
    const measure = ctx.measureText(maxValue);
    const maxTextWidth = measure.width;
    const textHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
    let histogramBarAreaHeight = histogramHeight - 3 * textHeight;
    let histogramBarAreaWidth = histogramWidth - maxTextWidth - measure.width / (2 * maxValue.toString().length) - maxTextWidth;

    const barWidthRatio = 4; // width of each bar
    const barSpacingRatio = 1
    const barTotalRatio = barWidthRatio + barSpacingRatio;
    const numberOfValues = 256;
    const barWidth = histogramBarAreaWidth / numberOfValues * (barWidthRatio / barTotalRatio);
    const barSpacing = histogramBarAreaWidth / numberOfValues * (barSpacingRatio / barTotalRatio);
 
    // ctx.strokeStyle = '#000000';
    ctx.textBaseline = "top";
    ctx.textAlign = "right"
    originX += maxTextWidth

    // draw y axises and labels
    ctx.lineWidth = axisLineWidth;
    for (let i = 0; i <= maxValue; i += maxValue / 10) {
        const x = originX;
        const y = originY + textHeight + histogramBarAreaHeight - (i / maxValue) * histogramBarAreaHeight;

        ctx.beginPath();
        ctx.moveTo(x, y)
        ctx.lineTo(histogramWidth + marginX, y);
        ctx.stroke();

        ctx.fillText(i, x, y - textHeight / 2);
    }
    originX += measure.width / (2 * maxValue.toString().length)


    // draw x axis labels
    for (let i = 0; i <= counts.length; i += 16) {
        const measure = ctx.measureText(i);
        const labelX = originX + i * (barWidth + barSpacing) + measure.width / 2;
        const labelY = originY + histogramHeight - 1.5 * textHeight
        ctx.fillText(i, labelX, labelY);
    }

    // Draw bars
    for (let i = 0; i < counts.length; i++) {
        const value = counts[i];
        const barHeight = (value / maxValue) * histogramBarAreaHeight;
        const x = originX + i * (barWidth + barSpacing);
        const y = originY + histogramBarAreaHeight - barHeight + textHeight;
        // l(value, maxValue, histogramHeight, originY, x, y, barHeight)
        ctx.fillRect(x, y, barWidth, barHeight);
    }
}

function initialize() {
    initializeTabFunction('byte-table-tab');
    initializeByteTable(20, 16);
    initializeHistogram();
    initializeFileInput();
}
