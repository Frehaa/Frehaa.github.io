'use strict';
const l = console.log;
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

// TODO:
// Place node
// Select node
// Delete node
// Connect nodes
// Draw connections
// Change settings
// Print area

let nodeId = 0;
class Node {
    constructor(x, y) {
        this.id = nodeId++;
        this.color = 0;
        this.x = x;
        this.y = y;
        this.hover = false;
        this.selected = false;
        this.connections = [];
    }
}

class Edge {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.selected = false;
        this.hover = false;
    }
}
const state = {
    mousePosition: {x: 0, y: 0},
    nodes: [],
    connections: [],
    drawSettings: {
        nodeRadius: 60,
        connectionLineWidth: 5,
        nodeLineWidth: 4,
        drawGrid: true,
        drawNewNodeIndicator: true, 
        gridWidth: 40,
        leftMargin: 10,
        topMargin: 10,
        bottomMargin: 10,
        rightMargin: 10,
        horizontalGridLines: 85,
        explanationFontSize: 50,
        explanationLineMargin: 10,
        explanationStartX: 50,
        explanationStartY: 60,
    }, 
    selectedNode: null,
    hoveredNode: null,
    savedState: {
        selectedNode: null,
        hoveredNode: null
    },
    selectNode(node) {
        if (node === null) return;
        node.selected = true;
        this.selectedNode = node;
    },
    unselectNode() {
        if (this.selectedNode === null) return;
        this.selectedNode.selected = false;
        this.selectedNode = null;
    },
    hoverNode(node) {
        if (node === null) return;
        node.hover = true;
        this.hoveredNode = node;
    }, 
    hoverEdge(edge) {

    },
    unhoverNode() {
        if (this.hoveredNode === null) return;
        this.hoveredNode.hover = false;
        this.hoveredNode = null;
    },
    prepareForPrint() {
        this.savedState = {
            selectedNode: this.selectedNode,
            hoveredNode: this.hoveredNode
        };
        this.unselectNode();
        this.unhoverNode();
        state.drawSettings.drawGrid = false;
        state.drawSettings.drawNewNodeIndicator = false;
    }, 
    restoreAfterPrint() {
        this.selectNode(state.savedState.selectedNode);
        this.hoverNode(state.savedState.hoveredNode);
        state.drawSettings.drawGrid = true;
        state.drawSettings.drawNewNodeIndicator = true;
    },
    connectNodes(nodeA, nodeB) {
        if (!(nodeA instanceof Node && nodeB instanceof Node)) {
            throw new Error('Arguments were not of type Node.');
        }
        if (nodeA === nodeB) {
            throw new Error('Cannot connect same element.');
        }
        const newLine = new Edge(nodeA, nodeB);
        // nodeA.connections.push(nodeB);
        // nodeB.connections.push(nodeA);
        this.connections.push(newLine);
        l(newLine)
    }, 
    getNodeById(id) {
        for (const node of this.nodes) {
            if (node.id === id) return node;
        }
        return null;
    }
}

function fillCircle(ctx, {x, y}, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawCircle(ctx, {x, y}, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawConnection(ctx, line, bool) {
    const radius = state.drawSettings.nodeRadius;

    ctx.beginPath();
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;

    const connectionLength = Math.sqrt(dx * dx + dy * dy);

    const diffX = (dx/connectionLength) * radius;
    const diffY = (dy/connectionLength) * radius;
    const startX = line.start.x + diffX;
    const startY = line.start.y + diffY;

    const endX = line.end.x - diffX;
    const endY = line.end.y - diffY;

    ctx.moveTo(startX, startY);
    if (!bool) {
        ctx.lineTo(endX, endY);
    } else {
        ctx.lineTo(endX + diffX, endY + diffY);
    }
    ctx.stroke();
}

function drawMouseCartesianPosition(ctx) {
    const precision = 2
    const text = "Mouse cartesian coordinates:     ("+state.mousePosition.x.toFixed(precision) + ", " + state.mousePosition.y.toFixed(precision) + ")";
    ctx.font = '32px ariel'
    ctx.fillText(text, 100, 100);
}

const leftMargin = 10;
const topMargin = 10;
const bottomMargin = 10;
const rightMargin = 10;

const gridLineWidth = 0.5;

function getClosestGridIntersectionCoordinates(position) {
    const {x, y} = position;
    const {gridWidth, leftMargin, topMargin} = state.drawSettings;
    let gridX = leftMargin + Math.round((x - leftMargin) / gridWidth) * gridWidth;
    let gridY = topMargin + Math.round((y - topMargin) / gridWidth) * gridWidth;
    return {x: gridX, y: gridY};
}

function draw(time) {
    const dt = time - draw.lastTime;
    draw.lastTime = time;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // TODO:    1. Various text description
    //          2. Color example 

    // const gameDescriptionText = "繋がている丸は別の色がついているままに、全部の丸に色を付ける" 
    const gameDescriptionText1 = "全部の丸に色を付ける";
    const gameDescriptionText2 = "線で繋がている丸は別色を使う";
    const gameDescriptionText3 = "なるべく少数色を使う";
    // const gameDescriptionText3 = "なるべくすくない色を使う";
    // 全部の丸を色を付ける
    // となり同士丸は別色を使う
    // なるべく多数色を使う
    // 隣接する頂点同士が同じ色にならないように全頂点に彩色する

    // Explanation B:
    // 全部の丸に色を付ける
    // となり同士丸は別色を使う
    ctx.font = `bold ${state.drawSettings.explanationFontSize}px serif`;
    ctx.fillStyle = 'black'

    ctx.fillText(gameDescriptionText1, state.drawSettings.explanationStartX, state.drawSettings.explanationStartY);
    ctx.fillText(gameDescriptionText2, state.drawSettings.explanationStartX, state.drawSettings.explanationStartY + state.drawSettings.explanationFontSize + state.drawSettings.explanationLineMargin);
    ctx.fillText(gameDescriptionText3, state.drawSettings.explanationStartX, state.drawSettings.explanationStartY + (state.drawSettings.explanationFontSize + state.drawSettings.explanationLineMargin) * 2);

    // TODO: Draw settings bottom in top
    if (state.drawSettings.drawGrid) {
        const gridWidth = state.drawSettings.gridWidth;
        ctx.lineWidth = gridLineWidth;
        ctx.beginPath();
        for (let x = leftMargin + gridWidth; x < canvas.width - rightMargin; x += gridWidth) {
            ctx.moveTo(x, topMargin);
            ctx.lineTo(x, canvas.height - topMargin);
        }
        for (let y = topMargin + gridWidth; y < canvas.height - topMargin; y += gridWidth) {
            ctx.moveTo(leftMargin, y);
            ctx.lineTo(canvas.width - rightMargin, y);
        }
        ctx.stroke();
    }

    if (state.drawSettings.drawNewNodeIndicator) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.9)';
        const intersectionCoordinates = getClosestGridIntersectionCoordinates(state.mousePosition);
        drawCircle(ctx, intersectionCoordinates, state.drawSettings.nodeRadius);
        // ctx.beginPath();
        // ctx.arc(x, y, 5, 0, 2 * Math.PI);
        // ctx.fill();
    }

    ctx.beginPath();

    // Draw play area
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    // ctx.strokeRect(leftMargin, topMargin, canvas.width - leftMargin - rightMargin, canvas.height - topMargin - bottomMargin);

    ctx.lineWidth = state.drawSettings.nodeLineWidth;
    for (let i = 0; i < state.nodes.length; i++) {
        const node = state.nodes[i];
        if (node.hover || node.selected) {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'black';
        }
        // if (node.selected) {
        //     ctx.strokeStyle = 'blue';
        // }
        switch (node.color) {
            case 1: {
                ctx.fillStyle = '#D81B60';
                fillCircle(ctx, node, state.drawSettings.nodeRadius);
            } break;
            case 2: {
                ctx.fillStyle = '#1E88E5';
                fillCircle(ctx, node, state.drawSettings.nodeRadius);
            } break;
            case 3: {
                ctx.fillStyle = '#FFC107';
                fillCircle(ctx, node, state.drawSettings.nodeRadius);
            } break;
            default: {
            } break;
        }
        drawCircle(ctx, node, state.drawSettings.nodeRadius);
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = state.drawSettings.connectionLineWidth;
    for (let i = 0; i < state.connections.length; i++) {
        const edge = state.connections[i];
        drawConnection(ctx, edge);
    }

    // if (state.selectedNode !== null && state.selectedNode !== state.hoverNode) {
    //     drawConnection(ctx, {start: state.selectedNode, end: state.mousePosition}, true);
    // }

    
    if (state.hoverNode === null) {
        ctx.lineWidth = state.drawSettings.nodeLineWidth;
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        drawCircle(ctx, state.mousePosition.x, state.mousePosition.y, state.drawSettings.nodeRadius);
    }

    requestAnimationFrame(draw);
}

function nodeContainsPosition(node, position) {
    const dx = position.x - node.x;
    const dy = position.y - node.y;
    return dx*dx + dy*dy <= state.drawSettings.nodeRadius * state.drawSettings.nodeRadius;
}

function edgeNearPosition(edge, position) {
    return false;
}

function initialize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // const nodes = [ { "id": 0, "x": 915.8139534883721, "y": 275.1162790697674, "hover": false, "selected": false, "connections": [] }, { "id": 1, "x": 915.8139534883721, "y": 120.46511627906978, "hover": false, "selected": false, "connections": [] }, { "id": 2, "x": 1136.7441860465117, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, { "id": 3, "x": 694.8837209302326, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, { "id": 4, "x": 1026.2790697674418, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, { "id": 5, "x": 761.1627906976744, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, { "id": 6, "x": 1291.3953488372092, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, { "id": 7, "x": 1158.8372093023256, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, { "id": 8, "x": 628.6046511627907, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, { "id": 9, "x": 540.2325581395348, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] } ]
    // for (let node of nodes) {
    //     l(`nodes.push(new Node(${node.x}, ${node.y}));`)
    // }

    // const connections = [ { "start": { "id": 0, "x": 915.8139534883721, "y": 275.1162790697674, "hover": false, "selected": false, "connections": [] }, "end": { "id": 5, "x": 761.1627906976744, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 4, "x": 1026.2790697674418, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, "end": { "id": 0, "x": 915.8139534883721, "y": 275.1162790697674, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 5, "x": 761.1627906976744, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, "end": { "id": 2, "x": 1136.7441860465117, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 4, "x": 1026.2790697674418, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, "end": { "id": 3, "x": 694.8837209302326, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 3, "x": 694.8837209302326, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, "end": { "id": 2, "x": 1136.7441860465117, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 9, "x": 540.2325581395348, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, "end": { "id": 3, "x": 694.8837209302326, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 1, "x": 915.8139534883721, "y": 120.46511627906978, "hover": false, "selected": false, "connections": [] }, "end": { "id": 0, "x": 915.8139534883721, "y": 275.1162790697674, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 6, "x": 1291.3953488372092, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, "end": { "id": 2, "x": 1136.7441860465117, "y": 407.6744186046512, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 4, "x": 1026.2790697674418, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, "end": { "id": 7, "x": 1158.8372093023256, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 5, "x": 761.1627906976744, "y": 650.6976744186046, "hover": false, "selected": false, "connections": [] }, "end": { "id": 8, "x": 628.6046511627907, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 8, "x": 628.6046511627907, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, "end": { "id": 7, "x": 1158.8372093023256, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 7, "x": 1158.8372093023256, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, "end": { "id": 6, "x": 1291.3953488372092, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 6, "x": 1291.3953488372092, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, "end": { "id": 1, "x": 915.8139534883721, "y": 120.46511627906978, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 1, "x": 915.8139534883721, "y": 120.46511627906978, "hover": false, "selected": false, "connections": [] }, "end": { "id": 9, "x": 540.2325581395348, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false }, { "start": { "id": 8, "x": 628.6046511627907, "y": 761.1627906976744, "hover": false, "selected": false, "connections": [] }, "end": { "id": 9, "x": 540.2325581395348, "y": 363.48837209302326, "hover": false, "selected": false, "connections": [] }, "selected": false, "hover": false } ]





    state.drawSettings.gridWidth = (canvas.width - leftMargin - rightMargin) / (state.drawSettings.horizontalGridLines+1);

    draw.lastTime = 0

    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    window.addEventListener('beforeprint', event => {
        state.prepareForPrint();
        draw(draw.lastTime);
    })
    window.addEventListener('afterprint', event => {
        state.restoreAfterPrint();
    })

    function mouseDown(e) {
        // TODO: Movement should be done every frame after pressing down, not until it starts repeating
        const clickedNode = state.nodes.find(node => nodeContainsPosition(node, state.mousePosition));
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: { 
                state.drag = true;
                if (clickedNode === undefined) { // Didn't click anything
                    state.unselectNode();
                } else if (state.selectedNode === null) { // Clicked something but nothing was selected
                    state.selectNode(clickedNode)
                } else { // Clicked node and selected node exists
                    // TODO: Prevent double connections? Double connection removes connection?
                    // TODO: Right now the controls are awkward because I may want to deselect one element and select another, but this connects them


                    state.unselectNode();
                    state.selectNode(clickedNode)
                }
            } break;
            case MOUSE_MIDDLE_BUTTON: {
            } break;
            case MOUSE_RIGHT_BUTTON: {
                // This is for creating nodes and connecting nodes. If we hover over a node with a different node selected, then we connect, otherwise we create a new node
                if (state.hoveredNode === null) { // Only create when we are not hovering over a node
                    const {x, y} = getClosestGridIntersectionCoordinates(state.mousePosition);
                    const newNode = new Node(x, y);
                    state.nodes.push(newNode);
                    state.hoverNode(newNode);
                }
                else if (state.selectedNode !== null) { // A node is hovered and selected
                    l('Connect', clickedNode, state.selectedNode)
                    state.connectNodes(state.selectedNode, clickedNode);
                    state.unselectNode();
                } else {
                    state.unselectNode();
                    state.selectNode(clickedNode)
                }

            } break;
            default: {}
        }
    }

    function mouseUp(e) {
        switch(e.button) {
            case MOUSE_LEFT_BUTTON: {
                state.drag = false;
            } break;
            case MOUSE_MIDDLE_BUTTON: {

            } break;
            case MOUSE_RIGHT_BUTTON: {
            }
        }
    }


    


    function keyDown(e) {
        l(e)
        switch (e.code) {
            case 'KeyN': {
            } break;
            case 'ShiftLeft': {
            } break;
            case 'KeyP': {
                let nodeString = "state.nodes = [];";
                nodeString += 'let newNode = null;'
                for (const node of state.nodes) {
                    nodeString += `newNode = new Node(${node.x}, ${node.y});`
                    nodeString += `newNode.id = ${node.id};`;
                    nodeString += `state.nodes.push(newNode);`
                }
                l(nodeString)
                let connectionsString = "state.connections = [";
                for (const connection of state.connections) {
                    connectionsString += `new Edge(state.getNodeById(${connection.start.id}), state.getNodeById(${connection.end.id})),`;
                }
                connectionsString += "];"
                l(connectionsString)
            } break;
            case 'Numpad1': {
                state.nodes = [];let newNode = null;newNode = new Node(915.8139534883721, 275.1162790697674);newNode.id = 0;state.nodes.push(newNode);newNode = new Node(915.8139534883721, 120.46511627906978);newNode.id = 1;state.nodes.push(newNode);newNode = new Node(1136.7441860465117, 407.6744186046512);newNode.id = 2;state.nodes.push(newNode);newNode = new Node(694.8837209302326, 407.6744186046512);newNode.id = 3;state.nodes.push(newNode);newNode = new Node(1026.2790697674418, 650.6976744186046);newNode.id = 4;state.nodes.push(newNode);newNode = new Node(761.1627906976744, 650.6976744186046);newNode.id = 5;state.nodes.push(newNode);newNode = new Node(1291.3953488372092, 363.48837209302326);newNode.id = 6;state.nodes.push(newNode);newNode = new Node(1158.8372093023256, 761.1627906976744);newNode.id = 7;state.nodes.push(newNode);newNode = new Node(628.6046511627907, 761.1627906976744);newNode.id = 8;state.nodes.push(newNode);newNode = new Node(540.2325581395348, 363.48837209302326);newNode.id = 9;state.nodes.push(newNode);
                state.connections = [new Edge(state.getNodeById(0), state.getNodeById(5)),new Edge(state.getNodeById(4), state.getNodeById(0)),new Edge(state.getNodeById(5), state.getNodeById(2)),new Edge(state.getNodeById(4), state.getNodeById(3)),new Edge(state.getNodeById(3), state.getNodeById(2)),new Edge(state.getNodeById(9), state.getNodeById(3)),new Edge(state.getNodeById(1), state.getNodeById(0)),new Edge(state.getNodeById(6), state.getNodeById(2)),new Edge(state.getNodeById(4), state.getNodeById(7)),new Edge(state.getNodeById(5), state.getNodeById(8)),new Edge(state.getNodeById(8), state.getNodeById(7)),new Edge(state.getNodeById(7), state.getNodeById(6)),new Edge(state.getNodeById(6), state.getNodeById(1)),new Edge(state.getNodeById(1), state.getNodeById(9)),new Edge(state.getNodeById(8), state.getNodeById(9)),];
            } break;
            case 'Numpad2': {
                state.nodes = [];let newNode = null;newNode = new Node(672.7906976744187, 164.65116279069767);newNode.id = 0;state.nodes.push(newNode);newNode = new Node(1158.8372093023256, 164.65116279069767);newNode.id = 1;state.nodes.push(newNode);newNode = new Node(1335.5813953488373, 518.1395348837209);newNode.id = 2;state.nodes.push(newNode);newNode = new Node(473.95348837209303, 518.1395348837209);newNode.id = 3;state.nodes.push(newNode);newNode = new Node(672.7906976744187, 893.7209302325582);newNode.id = 4;state.nodes.push(newNode);newNode = new Node(1158.8372093023256, 893.7209302325582);newNode.id = 5;state.nodes.push(newNode);
                state.connections = [new Edge(state.getNodeById(1), state.getNodeById(5)),new Edge(state.getNodeById(1), state.getNodeById(0)),new Edge(state.getNodeById(0), state.getNodeById(4)),new Edge(state.getNodeById(5), state.getNodeById(4)),new Edge(state.getNodeById(0), state.getNodeById(2)),new Edge(state.getNodeById(1), state.getNodeById(2)),new Edge(state.getNodeById(2), state.getNodeById(5)),new Edge(state.getNodeById(3), state.getNodeById(4)),new Edge(state.getNodeById(3), state.getNodeById(0)),new Edge(state.getNodeById(2), state.getNodeById(4)),new Edge(state.getNodeById(1), state.getNodeById(3)),new Edge(state.getNodeById(3), state.getNodeById(5)),new Edge(state.getNodeById(5), state.getNodeById(4)),];
            } break;
            case 'Numpad3': {
                state.nodes = [];let newNode = null;newNode = new Node(783.2558139534884, 142.5581395348837);newNode.id = 0;state.nodes.push(newNode);newNode = new Node(982.0930232558139, 142.5581395348837);newNode.id = 1;state.nodes.push(newNode);newNode = new Node(1136.7441860465117, 297.2093023255814);newNode.id = 2;state.nodes.push(newNode);newNode = new Node(982.0930232558139, 606.5116279069767);newNode.id = 3;state.nodes.push(newNode);newNode = new Node(783.2558139534884, 606.5116279069767);newNode.id = 4;state.nodes.push(newNode);newNode = new Node(650.6976744186046, 297.2093023255814);newNode.id = 5;state.nodes.push(newNode);newNode = new Node(1114.6511627906978, 473.95348837209303);newNode.id = 6;state.nodes.push(newNode);newNode = new Node(672.7906976744187, 473.95348837209303);newNode.id = 7;state.nodes.push(newNode);newNode = new Node(1512.3255813953488, 341.3953488372093);newNode.id = 8;state.nodes.push(newNode);newNode = new Node(275.1162790697674, 341.3953488372093);newNode.id = 9;state.nodes.push(newNode);newNode = new Node(716.9767441860465, 937.9069767441861);newNode.id = 10;state.nodes.push(newNode);newNode = new Node(1048.3720930232557, 937.9069767441861);newNode.id = 11;state.nodes.push(newNode);
                state.connections = [new Edge(state.getNodeById(1), state.getNodeById(2)),new Edge(state.getNodeById(2), state.getNodeById(6)),new Edge(state.getNodeById(6), state.getNodeById(3)),new Edge(state.getNodeById(3), state.getNodeById(4)),new Edge(state.getNodeById(4), state.getNodeById(7)),new Edge(state.getNodeById(5), state.getNodeById(7)),new Edge(state.getNodeById(5), state.getNodeById(0)),new Edge(state.getNodeById(0), state.getNodeById(1)),new Edge(state.getNodeById(8), state.getNodeById(1)),new Edge(state.getNodeById(6), state.getNodeById(8)),new Edge(state.getNodeById(9), state.getNodeById(0)),new Edge(state.getNodeById(10), state.getNodeById(8)),new Edge(state.getNodeById(9), state.getNodeById(7)),new Edge(state.getNodeById(9), state.getNodeById(11)),new Edge(state.getNodeById(4), state.getNodeById(1)),new Edge(state.getNodeById(3), state.getNodeById(0)),new Edge(state.getNodeById(5), state.getNodeById(6)),new Edge(state.getNodeById(7), state.getNodeById(2)),new Edge(state.getNodeById(10), state.getNodeById(3)),new Edge(state.getNodeById(7), state.getNodeById(10)),new Edge(state.getNodeById(11), state.getNodeById(6)),new Edge(state.getNodeById(11), state.getNodeById(4)),];
            } break;

            case 'Digit1': {
                if (state.selectedNode !== null) {
                    state.selectedNode.color = 1;
                }
            } break;
            case 'Digit2': {
                if (state.selectedNode !== null) {
                    state.selectedNode.color = 2;
                }
            } break;
            case 'Digit3': {
                if (state.selectedNode !== null) {
                    state.selectedNode.color = 3;
                }
            } break;
            case 'Delete': {
                if (state.selectedNode === null) return;
                // state.nodes
                // state.selectedNode
            } break;
            case 'Escape': {
                state.unselectNode();
            } break;
        }
    }

    function keyUp(e) {
        switch (e.code) {
            case 'ShiftLeft': {
            }
        }
    }

    function mouseMove(e) {
        state.mousePosition = {
            x: (e.pageX - e.target.offsetLeft)* (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        };

        state.unhoverNode();
        for (let i = 0; i < state.nodes.length; i++) {
            const node = state.nodes[i];
            if (nodeContainsPosition(node, state.mousePosition)) {
                state.hoverNode(node);
                break
            }
        }

        // Check for hover over connections
        for (let i = 0; i < state.connections.length; i++) {
            const edge = state.connections[i];
            if (edgeNearPosition(edge, state.mousePosition)) {
                state.hoverEdge(edge);
                break;
            }
        }

        if (state.selectedNode !== null && state.drag) {
            const gridPosition = getClosestGridIntersectionCoordinates(state.mousePosition);
            state.selectedNode.x = gridPosition.x;
            state.selectedNode.y = gridPosition.y;
        }


    }

    requestAnimationFrame(time => {
        draw.lastTime = time;
        draw(time);
    });
}