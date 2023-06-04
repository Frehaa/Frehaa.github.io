"use strict";
const l = console.log;

function matrixVectorMult(m, v) {
    let res = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        res[i] = m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2] + m[i][3] * v[3];
    }
    return res;
}

function translateMatrix(x, y, z) {
    return [
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1],
    ]
}

function rotateXMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return [
        [1, 0, 0, 0],
        [0, c,-s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1],
    ];
}

function rotateYMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return [
        [c, 0, s, 0],
        [0, 1, 0, 0],
        [-s,0, c, 0],
        [0, 0, 0, 1],
    ];
}

function rotateZMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return [
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];
}

function degreeToRadians(degree) {
    return degree * Math.PI / 180;
}

function initialize() {
    // requestAnimationFrame(time => drawDynamic(time, undefined));

    // 0 - 1
    // 0 - 2
    // 0 - 4
    // 1 - 3
    // 1 - 5
    // 2 - 3
    // 2 - 6
    // 3 - 7
    // 4 - 5
    // 4 - 6
    // 5 - 7
    // 6 - 7
    const box = [
        [0, 0, 0, 1], [100, 0, 0, 1], 
        [0, 100, 0, 1], [100, 100, 0, 1], 
        [0, 0, 100, 1], [100, 0, 100, 1], 
        [0, 100, 100, 1], [100, 100, 100, 1], 
    ];
    const boxConnections = [
        [0, 1],
        [0, 2],
        [0, 4],
        [1, 3],
        [1, 5],
        [2, 3],
        [2, 6],
        [3, 7],
        [4, 5],
        [4, 6],
        [5, 7],
        [6, 7],
    ];


    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    l(boxConnections)
    
    let t = time => {
        let degreeX = 10 // time / 50;
        let degreeY = time / 100;
        let degreeZ = 0 // time / 500;
        ctx.clearRect(0, 0, w, h);

        const rotateXTransform = rotateXMatrix(degreeToRadians(degreeX));
        const rotateYTransform = rotateYMatrix(degreeToRadians(degreeY));
        const rotateZTransform = rotateZMatrix(degreeToRadians(degreeZ));
        const moveTransformation = translateMatrix(w/2 - 50, h/2 + 10, 41215);

        let transformedBox = box.map((v, i, a) => matrixVectorMult(rotateXTransform, v))
            .map((v, i, a) => matrixVectorMult(rotateYTransform, v))
            .map((v, i, a) => matrixVectorMult(rotateZTransform, v))
            .map((v, i, a) => matrixVectorMult(rotateZTransform, v))
            .map((v, i, a) => matrixVectorMult(moveTransformation, v));

        let colors = [
            'red',
            'green',
            'blue',
            'pink',
            'purple',
            'cyan',
            'orange',
            'black'
        ]
        for (const idx of boxConnections) {
            let p0 = transformedBox[idx[0]];
            let p1 = transformedBox[idx[1]];

            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.stroke();
        }
        let i = 0;
        for (const point of transformedBox) {
            let x = point[0];
            let y = point[1];
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            i++;
        }

        requestAnimationFrame(t)
    };
    requestAnimationFrame(t);

}