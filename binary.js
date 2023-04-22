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
        for (let i = 0; i < columns; i++) {
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

function initializeTable() {
    let rows = 20;
    let columns = 16 + 1;
    let table = new ByteTable(document.getElementById('byte-table'), rows, columns, format=HEX);
    return table;
}

function updateTable() {
    let table = globalTable;

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

function countBytes() {
    let windowSize = 2;
    let dataView = new DataView(arrayBuffer);
    let a = Array(256**windowSize).fill(0);
    for (let i = 0; i < dataView.byteLength - (windowSize - 1); i++) {
        let val = 0; 
        for (let j = 0; j < windowSize; j++) {
            val = (val << 8) | dataView.getUint8(i + j);
        }
        a[val]++;
    }
    l(a)
}
let activeTab = null; 
function openTab(e, id) {
    activeTab.classList.remove('activetab');
    let tab = document.getElementById(id);
    tab.classList.add('activetab');
    activeTab = tab;
}

function initialize() {
    globalTable = initializeTable();
    initializeFileInput();

    activeTab = document.getElementById('byte-table-tab');
    openTab(null, 'byte-table-tab')

    const cellWidthInput = document.getElementById('byte-table-cell-width');
    cellWidthInput.onchange = function(event) {
        // Get the stylesheet of the HTML document
        const stylesheet = document.styleSheets[0];

        // Find the rule for the "my-class" class in the stylesheet
        const ruleIndex = Array.from(stylesheet.cssRules).findIndex(rule => rule.selectorText === '#byte-table td');
        const rule = stylesheet.cssRules[ruleIndex];

        // Modify the background color property of the "my-class" class
        rule.style["width"] = cellWidthInput.value + "px";
        rule.style["max-width"] = cellWidthInput.value + "px";
    }

    const startIndexInput = document.getElementById('byte-table-start');
    startIndexInput.onchange = function(event) {
        updateTable();
    }

    const formatInput = document.getElementById('byte-table-format');
    formatInput.onchange = function(event) {
        updateTable();
    }
}
