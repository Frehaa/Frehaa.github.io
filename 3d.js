"use strict";
const l = console.log;

function scalerVectorMult(c, v) {
    let res = [];
    for (let i = 0; i < v.length; i++) {
        const element = v[i];
        res.push(c * element);
    }

    return res;
}

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
    const boxVertices = [
        [0, 0, 0, 1], [100, 0, 0, 1], 
        [0, 100, 0, 1], [100, 100, 0, 1], 
        [0, 0, 100, 1], [100, 0, 100, 1], 
        [0, 100, 100, 1], [100, 100, 100, 1], 
    ];
    const boxVertexColors = [
        'red',
        'green',
        'blue',
        'pink',
        'purple',
        'cyan',
        'orange',
        'black'
    ];
    const boxFaces = [
        [0, 1, 3, 2],
        [2, 3, 7, 6],
        [1, 3, 7, 5],
        [0, 1, 5, 4],
        [0, 2, 6, 4],
        [4, 5, 7, 6]
    ];

    const coordinateSystem = [
        [0, 0, 0, 1], 
        [100, 0, 0, 1],
        [0, 100, 0, 1],
        [0, 0, 100, 1],
    ];

    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    l(scalerVectorMult(1.5, coordinateSystem[1]))

    const isometricProjectionMatrix = [
        [Math.sqrt(3), 0, -Math.sqrt(3), 0], 
        [1, 2, 1, 0], 
        [Math.sqrt(2), -Math.sqrt(2), Math.sqrt(2), 0], 
        [0, 0, 0, 1], 
    ];
    
    let t = time => {
        let degreeX = 10 // time / 50;
        let degreeY = time / 100;
        let degreeZ = 0 // time / 500;
        ctx.clearRect(0, 0, w, h);

        const rotateXTransform = rotateXMatrix(degreeToRadians(degreeX));
        const rotateYTransform = rotateYMatrix(degreeToRadians(degreeY));
        const rotateZTransform = rotateZMatrix(degreeToRadians(degreeZ));
        const moveTransformation = translateMatrix(w/2, h/2, 0);

        let transformedCoordinateSystem = coordinateSystem
                .map((v, i, a) => matrixVectorMult(isometricProjectionMatrix, v))
                .map((v, i, a) => scalerVectorMult(1 / Math.sqrt(6), v))
                .map((v, i, a) => matrixVectorMult(moveTransformation, v));

        for (let i = 0; i < transformedCoordinateSystem.length; i++) {
            const point = transformedCoordinateSystem[i];
            let x = point[0];
            let y = point[1];
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();            
        }
        let p0 = transformedCoordinateSystem[0];
        for (let i = 1; i < transformedCoordinateSystem.length; i++) {
            const p1 = transformedCoordinateSystem[i];
            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.stroke();                        
        }
        return

        let transformedBox = boxVertices.map((v, i, a) => matrixVectorMult(rotateXTransform, v))
            .map((v, i, a) => matrixVectorMult(rotateYTransform, v))
            .map((v, i, a) => matrixVectorMult(rotateZTransform, v))
            .map((v, i, a) => matrixVectorMult(rotateZTransform, v))
            .map((v, i, a) => matrixVectorMult(moveTransformation, v));


        const seenLines = new Set();
        for (const face of boxFaces) {
            for (let i = 0; i < face.length; i++) {
                const u = face[i];
                const v = face[(i+1) % face.length];
                let lineId = u*u + v*v;
                if (seenLines.has(lineId)) continue;
                seenLines.add(lineId)

                let p0 = transformedBox[u];
                let p1 = transformedBox[v];

                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.stroke();
                
            }
        }
        for (let i = 0; i < transformedBox.length; i++) {
            const point = transformedBox[i];
            let x = point[0];
            let y = point[1];
            ctx.fillStyle = boxVertexColors[i];
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();            
        }

        setTimeout(e => {
            requestAnimationFrame(t)
        }, 1000)
        
    };
    requestAnimationFrame(t);

}