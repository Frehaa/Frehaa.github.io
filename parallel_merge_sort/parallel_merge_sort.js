'use strict';
const l = console.log;

function drawContentSensitiveNode() {
    // TODO: Node which expands according to content size
}

function drawNode(ctx, node) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = '18px ariel'

    if (node.externalPhase >= 0) {
        ctx.lineWidth = 2;
    } else {
        ctx.lineWidth = 1;
    }

    if (node === state.selectedNode) {
        ctx.strokeStyle = 'red';
    } else {
        ctx.strokeStyle = 'black';
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, state.settings.node_size/2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillText(node.up.length, node.x, node.y);
}

function drawNodeBySize(ctx, value, centerX, centerY, radius) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = '18px ariel'
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillText(value, centerX, centerY);
}

function isInternal(node) {
    return node.externalPhase === -1;
}
function isExternal(node) {
    return !isInternal(node);
}

function sample(node, currentPhase) {
    const result = [];
    const list = node.up;
    const m = list.length;

    const phasesAfterBecommingExternal = currentPhase - node.externalPhase;
    if (isInternal(node) || phasesAfterBecommingExternal === 0) { // "For the first stage in which u is external, phase 1 is unchanged"
        for (let i = 0; i < Math.floor(m/4); i++) {
            result.unshift(list[m - 3 - 4 * i]);
        }
    } else if (phasesAfterBecommingExternal === 1) { // "For the second stage, SUP(u) is defined to be every second item in UP(u)"
        // Paper states "Every second element", but this time not which way it is measured. 
        // I assume that it is still from the right end and then it should probably look something like the following?
        for (let i = 0; i < Math.floor(m/2); i++) {
            result.unshift(list[m - 1 - 2 * i]);
        }
    } else {//if ((node.externalPhase + 2) === currentPhase){ // "For the third stage, SUP(u) is defined to be every item in UP(u) in sorted order"
        return result.concat(node.up);
    }
    return result;        
}

const state = {
    currentStage: 0,
    initialList: [64,30,89,36,21,66,122,5,94,96,19,13,26,17,85,24,15,127,57,43,124,52,107,77,71,58,108,69,79,88,75,1,59,67,49,100,120,8,123,47,117,35,45,4,104,53,114,40,0,27,54,34,14,73,62,12,101,16,102,90,22,29,111,3,48,39,87,106,99,68,7,93,25,65,84,119,9,76,28,82,72,98,115,86,97,51,50,10,113,105,121,55,91,118,33,78,95,63,32,38,56,83,109,110,20,31,37,46,125,126,80,23,116,103,61,44,81,70,6,11,92,2,18,112,74,60,41,42],
    settings: {
        node_size: 30,
        node_horizontal_buffer: 10,
        node_vertical_buffer: 20
    },
    mousePosition: {x: 0, y: 0},
    selectedNode: null,
    stages: []
}

class Leaf {
    constructor(value) {
        this.up = value;
        this.sampleUp = null;
        this.externalPhase = 0; // Phase in which the node became external
    } 
}

class Node {
    constructor() {
        this.oldUp = [];
        this.up = [];
        this.newUp = [];
        this.sampleUp = null;
        this.leftChild = null;
        this.rightChild = null;
        this.externalPhase = -1; // -1 means the node is still internal
    }
}

// Assumes list has size power of 2
function createTree(list) {
    if (list.length === 1) {
        return new Leaf(list);
    } 
    const node = new Node();
    const listA = list.slice(0, list.length/2);
    const listB = list.slice(list.length/2);
    node.leftChild = createTree(listA, node);
    node.rightChild = createTree(listB, node);
    return node;
}

function initialize()  {



    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // let list = [6,1,5,9,12,10,3,8];
    // let list = [26,23,14,11,24,6,7,8,28,29,27,5,2,25,18,13,20,22,12,19,3,10,15,30,17,21,1,31,0,4,9,16];
    let list = state.initialList

    state.stages.push(createTree(list, "ROOT"));
    
    // CODE FOR CHANGING PHASE
    document.addEventListener('keydown', e => {
        switch(e.key) {
            case 'ArrowLeft': {
                state.currentStage = Math.max(0, state.currentStage-1);
            } break;
            case 'ArrowRight': {
                const lastStage = state.stages[state.currentStage];
                if (isExternal(lastStage)) break;

                state.currentStage += 1
                if (state.currentStage === state.stages.length) {
                    const newStage = nextStage(lastStage, state.currentStage);
                    state.stages.push(newStage);
                }
            } break;
            case '+': {
                state.settings.node_size += 2;
            } break;
            case '-': {
                state.settings.node_size = Math.max(0, state.settings.node_size - 2);
            } break;
        }
    });

    // CODE FOR INSPECTING NODE OF TREE
    canvas.addEventListener('mousedown', e => {
        state.mousePosition = {
            x: (e.pageX - e.target.offsetLeft)* (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        }
        // Iterate over all nodes
        state.selectedNode = null;
        for (const node of treeNodes(state.stages[state.currentStage])) {
            if (nodeContainsPosition(node, state.mousePosition)) {
                state.selectedNode = node;
                l(node)
                break
            }
        }
    });

    let lastFrameTime = 0;
    const draw = time => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.font = '32px ariel'
        ctx.fillText("Current Stage: " + state.currentStage, 10, 100)
        // const dt = time - lastFrameTime;
        lastFrameTime = time;
        drawMyTree(ctx, state.stages[state.currentStage]);

        if (state.selectedNode !== null) {
            drawNodeInfo(ctx, state.selectedNode);
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(time => {
        lastFrameTime = time;
        draw(time);
    });
}

function drawNodeInfo(ctx, node) {
    const leftX = node.x + 50;
    const topY = node.y + 20;

    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.font = '18px ariel'

    const height = 100;
    const width = 270;

    ctx.strokeStyle = 'black'
    ctx.clearRect(leftX, topY, width, height);
    ctx.strokeRect(leftX, topY, width, height);
    ctx.fillText('OLDUP: [' + node.oldUp + ']', leftX, topY);
    ctx.fillText('UP: [' + node.up + ']', leftX, topY + 20);
    ctx.fillText('NEWUP: [' + node.newUp + ']', leftX, topY + 40);
    ctx.fillText('SUP: [' + node.sampleUp + ']', leftX, topY + 60);
    ctx.fillText('external phase:' + node.externalPhase, leftX, topY + 80);
    // if (!isInternal(node)) {
    //     const text = 'Stages since becoming external: ' + (state.currentStage - node.externalPhase);
    //     ctx.fillText(text, leftX, topY + 60)

    // }

    
}

function* treeNodes(node) {
    yield node
    if (node instanceof Leaf) return;
    for (const leftNode of treeNodes(node.leftChild)) {
        yield leftNode;
    }
    for (const rightNode of treeNodes(node.rightChild)) {
        yield rightNode;
    }
}

function nodeContainsPosition(node, position) {
    const x1 = node.x;
    const y1 = node.y;

    const x2 = position.x;
    const y2 = position.y;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= state.settings.node_size/2;
}

function countLeaves(node) {
    if (node instanceof Leaf) return 1;
    return countLeaves(node.leftChild) + countLeaves(node.rightChild);
}

function countNodes(node) {
    if (node instanceof Leaf) return 1;
    return countNodes(node.leftChild) + countNodes(node.rightChild) + 1;
}

// Assuming number of leaves is a power of 2
function drawMyTree(ctx, node) {
    const leaves = countLeaves(node);
    const totalWidth = leaves * state.settings.node_size + (leaves-1) * state.settings.node_horizontal_buffer;
    drawMyTreeRec(ctx, node, totalWidth, 50, 200 + state.settings.node_size/2);
}

function drawMyTreeRec(ctx, node, totalWidth, offset, height) {
    node.x = offset + totalWidth / 2;
    node.y = height;

    drawNode(ctx, node);

    if (node instanceof Leaf) return;

    const nextLayerHeight = height + state.settings.node_size + state.settings.node_vertical_buffer;
    drawMyTreeRec(ctx, node.leftChild, totalWidth/2, offset, nextLayerHeight);
    drawMyTreeRec(ctx, node.rightChild, totalWidth / 2, offset + totalWidth / 2, nextLayerHeight)

    // TODO: Start and end at circle border
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(node.leftChild.x, node.leftChild.y);
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(node.rightChild.x, node.rightChild.y);
    ctx.stroke();
}

function nextStage(tree, currentStage) {
    const newTree = copyTree(tree);
    updateNode(newTree, currentStage);
    runPhase1(newTree, currentStage)
    runPhase2(newTree)
    return newTree
}

function rank(element, list) {
    for (let i = 0; i < list.length; i++) {
        if (element < list[i]) {
            return i;
        }
    }
    return list.length;
}

// Closer approximation of the merge algorithm, but with a slow calculation of crossrank
function merge(nodeA, nodeB) { 
    const listA = nodeA.sampleUp;
    const listB = nodeB.sampleUp;
    let result = Array(listA.length + listB.length);
    const mergeList = (list, crossrank) => {
        for (let i = 0; i < list.length; i++) {
            const element = list[i];
            const index = i + crossrank(element);
            result[index] = element;
        }        
    }
    mergeList(listA, e => rank(e, listB));
    mergeList(listB, e => rank(e, listA));
    return result;
}

// Set up = newUp and change to external if full
function updateNode(node, currentStage) {
    if (isExternal(node)) return;
    node.oldUp = node.up;
    node.up = node.newUp;
    // node.newUp = null;

    if (isExternal(node.leftChild) && isExternal(node.rightChild) && node.up.length === (node.leftChild.up.length + node.rightChild.up.length)) {
        node.externalPhase = currentStage;
    }

    updateNode(node.leftChild, currentStage);
    updateNode(node.rightChild, currentStage);
}

// Phase 1 (Form the array SUP(u))
function runPhase1(node, currentPhase) {
    node.sampleUp = sample(node, currentPhase); 
    if (node instanceof Leaf) return;
    runPhase1(node.leftChild, currentPhase);
    runPhase1(node.rightChild, currentPhase);
}

// Phase 2 (compute NEWUP(u))
function runPhase2(node) {
    if (isExternal(node)) return;
    node.newUp = merge(node.leftChild, node.rightChild);
    runPhase2(node.leftChild)
    runPhase2(node.rightChild)
}

function copyLeaf(leaf) {
    const newLeaf = new Leaf(null);
    newLeaf.up = leaf.up;
    newLeaf.sampleUp = leaf.sampleUp;
    newLeaf.externalPhase = leaf.externalPhase;
    return newLeaf;
}

function copyNode(node) {
    const newNode = new Node(null);
    newNode.oldUp = node.oldUp;
    newNode.up = node.up;
    newNode.newUp = node.newUp;
    newNode.sampleUp = node.sampleUp;
    newNode.externalPhase = node.externalPhase;
    return newNode;
}

function copyTree(node) {
    if (node instanceof Leaf) {
        return copyLeaf(node);
    } 
    const newNode = copyNode(node);
    newNode.leftChild = copyTree(node.leftChild);
    newNode.rightChild = copyTree(node.rightChild);
    return newNode;
}


function isKCover(k, listA, listB) {
    let prev = -Infinity;
    let j = 0;
    for (let i = 0; i < listA.length; i++) {
        const current = listA[i];
        
        let counter = 0;
        while (prev <= listB[j] && listB[j] < current && j < listB.length) {
            j++;
            counter++;
        }
        if (counter > k) return false;

        prev = current;
    }

    const current = Infinity;
    let counter = 0;
    while (prev <= listB[j] && listB[j] < current && j < listB.length) {
        j++;
        counter++;
    }
    if (counter > k) return false;

    return true;
}

function testKCover() {
    const a = [1,3,5,7];
    const b = [2,4,6];

    l(isKCover(1, a, b)) // True
    l(isKCover(1, b, a)) // True
    l(isKCover(1, a, a)) // True
    l(isKCover(1, a, [8,9,10, 11])) // False
    l(isKCover(3, a, [8,9,10, 11])) // False
    l(isKCover(4, a, [8,9,10, 11])) // true

    l(isKCover(3, [1, 10, 20, 30], [2, 3, 4, 12, 13, 14, 22, 23, 24, 32, 33, 34])) // True
    l(isKCover(2, [1, 10, 20, 30], [2, 3, 4, 12, 13, 14, 22, 23, 24, 32, 33, 34])) // False 
    l(isKCover(2, [2, 3, 4, 12, 13, 14, 22, 23, 24, 32, 33, 34], [1, 10, 20, 30])) // True
}

// function drawTreeTest(ctx, list, position) {

//     // DRAWS UP FOR THE CURRENT STAGE
//     list.forEach((element, i) => {
//         drawNode(ctx, element, [position[0] + i * 150, position[1]])
//     });

//     const sampleLists = list.map(sample);

//     // DRAWS SUP FOR THE NODES 
//     sampleLists.forEach((element, i) => {
//         drawNode(ctx, element, [position[0] + i * 150, position[1] - 110])
//     });


//     const parents = [];

//     for (let i = 0; i < sampleLists.length; i+=2) {
//         const listV = sampleLists[i];
//         const listW = sampleLists[i+1];

//         const merge = listV.concat(listW);
//         merge.sort();
//         parents.push(merge);
//     }

//     // DRAWS UP FOR THE NODE PARENTS
//     parents.forEach((element, i) => {
//         drawNode(ctx, element, [position[0] + i * 300 + 75,  position[1] - 220])
//     });



// }