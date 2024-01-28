'use strict';
const l = console.log;

const NODE_SIZE = 20;
const NODE_SPACE = 10;

// TODO: Have the node size expand
function drawNode(ctx, value, position) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.beginPath()
    ctx.arc(position[0], position[1], NODE_SIZE, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillText(value, position[0], position[1]);
}


function drawNodeBySize(ctx, value, centerX, centerY, radius) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillText(value, centerX, centerY);
}


// Assumes list length is power of two
function drawTreeBySize(ctx, list, leftX, bottomY, width) {
    const n = list.length;

    const widthPerElement = width/n;
    const bufferWidth = widthPerElement * 0.1;
    const nodeRadius = widthPerElement/2 - bufferWidth/2;

    // for (let i = 0; i < list.length; i++) {
    //     drawNodeBySize(ctx, list[i], leftX + widthPerElement/2 + widthPerElement * i, bottomY - nodeRadius, nodeRadius)
    // }
    // for (let i = 0; i < list.length; i+=2) {
    //     drawNodeBySize(ctx, 2, leftX + widthPerElement * (i+1), bottomY - nodeRadius - widthPerElement, nodeRadius)
    // }
    // for (let i = 0; i < list.length; i+=4) {
    //     drawNodeBySize(ctx, 4, leftX + widthPerElement * (i+2), bottomY - nodeRadius - 2 * widthPerElement, nodeRadius)
    // }
    // for (let i = 0; i < list.length; i+=8) {
    //     drawNodeBySize(ctx, 8, leftX + widthPerElement * (i+4), bottomY - nodeRadius - 3 * widthPerElement, nodeRadius)
    // }
    // for (let i = 0; i < list.length; i+=16) {
    //     drawNodeBySize(ctx, 16, leftX + widthPerElement * (i+8), bottomY - nodeRadius - 4 * widthPerElement, nodeRadius)
    // }
    // for (let i = 0; i < list.length; i+=32) {
    //     drawNodeBySize(ctx, 32, leftX + widthPerElement * (i+16), bottomY - nodeRadius - 5 * widthPerElement, nodeRadius)
    // }

    for (let j = 0; j <= Math.log2(n); j++) {
        const increase = 2**j;
        for (let i = 0; i < n; i+=increase) {
            let value = increase;
            if (increase === 1) {
                value = list[i];
            }
            drawNodeBySize(ctx, value, leftX + widthPerElement * (i+(increase/2)), bottomY - nodeRadius - j * widthPerElement, nodeRadius)
        }
    }


}

function drawTree(ctx, list, topLeft) {
    if (list.length <= 1) {
        l(list)
        drawNode(ctx, list[0], topLeft)
        return;
    }

    const listA = list.slice(0, list.length/2);
    const listB = list.slice(list.length/2);
    l(listA, listB)

    drawNode(ctx, "", topLeft)
    drawTree(ctx, listA, [topLeft[0] - 30 * height, topLeft[1] + 50], height-1);
    drawTree(ctx, listB, [topLeft[0] + 30 * height, topLeft[1] + 50], height-1);
}

// HOW TO DRAW A TREE WITHOUT OVERLAPPING?
// WE NEED TO MAKE SURE THAT THE LEFT TREE IS NEVER MORE RIGHT THAN THE PARENT
// SO IF MY PARENT IS AT POSITION X=500, then my rightmost child should be at position X=480 or something like that
// Given my current list size, I should be able to tell how many children I have. This is equal to the size of the list
// With this many children I can calculate how much space I need based on the size of each node and the buffer between nodes
// Is this easier to make a recursive or itterative? The children should be easy to make as iterative, but parents is a bit of a pain.

function sample(list) {
    const m = list.length;
    const result = [];
    for (let i = 0; i < Math.floor(m/4); i++) {
        result.unshift(list[m - 3 - 4 * i]);
    }
    return result;
}

const state = {
    currentStage: 0,
    initialList: [64,30,89,36,21,66,122,5,94,96,19,13,26,17,85,24,15,127,57,43,124,52,107,77,71,58,108,69,79,88,75,1,59,67,49,100,120,8,123,47,117,35,45,4,104,53,114,40,0,27,54,34,14,73,62,12,101,16,102,90,22,29,111,3,48,39,87,106,99,68,7,93,25,65,84,119,9,76,28,82,72,98,115,86,97,51,50,10,113,105,121,55,91,118,33,78,95,63,32,38,56,83,109,110,20,31,37,46,125,126,80,23,116,103,61,44,81,70,6,11,92,2,18,112,74,60,41,42],
}

class Leaf {
    constructor(value) {
        this.value = value;
    } 
}

class Node {
    constructor(value) {
        this.value = value;
        this.leftChild = null;
        this.rightChild = null;
    }
}

// Assumes list has size power of 2
function createTree(list) {
    if (list.length === 1) {
        return new Leaf(list);
    } 
    const node = new Node([]);
    const listA = list.slice(0, list.length/2);
    const listB = list.slice(list.length/2);
    node.leftChild = createTree(listA, node);
    node.rightChild = createTree(listB, node);
    return node;
}

function initialize()  {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // let list = [26,23,14,11,24,6,7,8,28,29,27,5,2,25,18,13,20,22,12,19,3,10,15,30,17,21,1,31,0,4,9,16];
    // let list = [14,4,0,13,7,11,2,15,8,6,1,5,9,12,10,3];
    // const spliceSize = 8;
    // let upLists = [
    //     list.splice(0, spliceSize).sort((a, b) => a - b), 
    //     list.splice(0, spliceSize).sort((a, b) => a - b), 
    //     list.splice(0, spliceSize).sort((a, b) => a - b), 
    //     list.splice(0, spliceSize).sort((a, b) => a - b), 
    // ];

    let list = [26,23,14,11,24,6,7,8,28,29,27,5,2,25,18,13,20,22,12,19,3,10,15,30,17,21,1,31,0,4,9,16];
    // drawTree(ctx, list, [500, 50], Math.log2(list.length));
    drawTreeBySize(ctx, list, 100, 500, 1000, 500)

    let t = createTree(list, "ROOT");
    const phases = [t];
    while (t.value.length !== list.length) {
        t = nextPhase(t);
        phases.push(t);
    }

    l(phases)
}

function nextPhase(tree) {
    const copy = copyTree(tree);
    updateNode(copy);
    return copy;
}

function updateNode(node) {
    if (node instanceof Leaf) return node;

    const newValue = node.leftChild.value.concat(node.rightChild.value);
    newValue.sort((a, b) => a-b);
    if (newValue.length !== 0) {
        node.value = newValue;
    }
    updateNode(node.leftChild);
    updateNode(node.rightChild);
    return node;
}

function copyTree(node) {
    if (node instanceof Leaf) {
        return new Leaf(node.value);
    }
    const newNode = new Node();
    newNode.value = node.value;
    newNode.leftChild = copyTree(node.leftChild);
    newNode.rightChild = copyTree(node.rightChild);
    return newNode;
}


function drawTreeTest(ctx, list, position) {

    // DRAWS UP FOR THE CURRENT STAGE
    list.forEach((element, i) => {
        drawNode(ctx, element, [position[0] + i * 150, position[1]])
    });

    const sampleLists = list.map(sample);

    // DRAWS SUP FOR THE NODES 
    sampleLists.forEach((element, i) => {
        drawNode(ctx, element, [position[0] + i * 150, position[1] - 110])
    });


    const parents = [];

    for (let i = 0; i < sampleLists.length; i+=2) {
        const listV = sampleLists[i];
        const listW = sampleLists[i+1];

        const merge = listV.concat(listW);
        merge.sort();
        parents.push(merge);
    }

    // DRAWS UP FOR THE NODE PARENTS
    parents.forEach((element, i) => {
        drawNode(ctx, element, [position[0] + i * 300 + 75,  position[1] - 220])
    });



}