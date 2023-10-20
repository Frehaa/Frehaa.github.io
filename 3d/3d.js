// import { Vec3 } from "./math/primitives"

// function scalerVectorMult(c, v) {
//     let res = [];
//     for (let i = 0; i < v.length; i++) {
//         const element = v[i];
//         res.push(c * element);
//     }

//     return res;
// }

// function matrixVectorMult(m, v) {
//     let res = [0, 0, 0, 0];
//     for (let i = 0; i < 4; i++) {
//         res[i] = m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2] + m[i][3] * v[3];
//     }
//     return res;
// }

// function translateMatrix(x, y, z) {
//     return [
//         [1, 0, 0, x],
//         [0, 1, 0, y],
//         [0, 0, 1, z],
//         [0, 0, 0, 1],
//     ]
// }

// function rotateXMatrix(rad) {
//     let c = Math.cos(rad);
//     let s = Math.sin(rad);
//     return [
//         [1, 0, 0, 0],
//         [0, c,-s, 0],
//         [0, s, c, 0],
//         [0, 0, 0, 1],
//     ];
// }

// function rotateYMatrix(rad) {
//     let c = Math.cos(rad);
//     let s = Math.sin(rad);
//     return [
//         [c, 0, s, 0],
//         [0, 1, 0, 0],
//         [-s,0, c, 0],
//         [0, 0, 0, 1],
//     ];
// }

// function rotateZMatrix(rad) {
//     let c = Math.cos(rad);
//     let s = Math.sin(rad);
//     return [
//         [c, -s, 0, 0],
//         [s, c, 0, 0],
//         [0, 0, 1, 0],
//         [0, 0, 0, 1],
//     ];
// }

// function degreeToRadians(degree) {
//     return degree * Math.PI / 180;
// }

// function calculateHit(origin, ray, objects) {
//     let results = [];
//     objects.forEach(object => {
//         // Calculate possible intersection and return distance and object
//         // results.append([t, object])
//     });
//     return results;
// }

// Equation for plane
// Equation for line
// 

// function hitSphere(ray, sphere) {
// }


class Sphere {
    constructor(x, y, z, radius) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }

    hit(ray) {
        const origin = ray.origin;
        const direction = ray.direction;

        const xt = origin.x + direction.x * t; // ox + dx * t
        const yt = origin.y + direction.y * t; // oy + dy * t
        const zt = origin.z + direction.z * t; // oz + dz * t

        // We want to know for which t 
        // (xt - xc)^2 + (yt - yc)^2 + (zt - zc)^2 - R^2 = 0
        // Expanding:
        // xt^2            + xc^2  - 2*xt*xc                + yt^2            + yc^2 - 2 * yt * yc            + zt^2             + zc^2 - 2*zt*zc                - R^2 = 0
        // (ox + dx * t)^2 + xc^2  - 2 * (ox + dx * t) * xc + (oy + dy * t)^2 + yc^2 - 2 * (oy + dy * t) * yc + (oz + dz * t)^2  + zc^2 - 2 * (oz + dz * t) * zc - R^2 = 0
        // (ox + dx * t)^2                     + xc^2  - 2 * (ox + dx * t) * xc       + (oy + dy * t)^2                      + yc^2 - 2 * (oy + dy * t) * yc       + (oz + dz * t)^2                  + zc^2  - 2 * (oz + dz * t) * zc         - R^2 = 0
        // ox^2   +   dx^2*t^2   +   2*ox*dx*t   +   xc^2   -   2*ox*xc   +   2*dx*xc*t   +   oy^2   +   dy^2*t^2   +   2*oy*dy*t   +   yc^2   -   2*oy*yc   +   2*dy*yz*t   +   oz^2   +   dz^2*t^2   +   2*oz*dz   +   zc^2   -   2*oz*zc   +   2*dz*zc*t   -   R^2 = 0
        // Simplifying:
        // 2*ox*dx*t  +   2*dx*xc*t   +   2*oy*dy*t   +   2*dy*yz*t   + 2*dz*zc*t   
        // dx^2*t^2d + y^2*t^2 + dz^2*t^2



        // (a + bc)^2 = (a + bc) * (a + bc) = aa + abc + abc + bcbc = a^2 + (bc)^2 + abc



    }
}


function initialize() {
    const canvas = document.getElementById('canvas');// as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');// as CanvasRenderingContext2D;

    const ny = 100;
    const nx = 100;
    const imageData = new ImageData(nx, ny); // Pixel / frame buffer

    // const w = new Vec3(0, 0, 1);
    // const e = new Vec3(0, 0, -5); // Eye / origin 
    // const u = new Vec3(1, 0, 0);
    // const v = new Vec3(0, 1, 0);
    // const l = -(nx/2);
    // const r = nx/2;
    // const b = -(ny/2);
    // const t = ny/2;
    // const l = v3add(e, [-(nx/2), 0, 0]);
    // const r = v3add(e, [  nx/2,  0, 0]);
    // const b = v3add(e, [0, -(ny/2), 0]);
    // const t = v3add(e, [0,   ny/2 , 0]);







    // const imagePlane = []; // The set of pixel points to project onto

    const sphere = {
        c : [0, 0, 5],
        R: 10
    };

    for (let j = 0; j < ny; ++j) {
        for (let i = 0; i < nx; ++i) {
            // const u = v3add(l, v3smult(1/nx, v3smult(i + 0.5, v3sub(r, l))));
            // const v = v3add(b, v3smult(1/ny, v3smult(j + 0.5, v3sub(t, b))));
            const x = l + (r - l)*(i + 0.5)/nx;
            const y = b + (t - b)*(j + 0.5)/ny;

            const ray = {
                direction: w.scale(-1), 
                origin: e.add(u.scale(x)).add(v.scale(y))
            };

            // let dist = hitSphere(ray, sphere);
            if (true) {
                const idx = j * nx + i;
                imageData.data[4 * idx + 0] = 255; // R
                imageData.data[4 * idx + 1] = 0; // G
                imageData.data[4 * idx + 2] = 0; // B
                imageData.data[4 * idx + 3] = 255; // A

            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // // Define the coefficients of the plane (A, B, C, D)
    // const planeCoefficients = { A: 0, B: 0, C: -1, D: 4 };

    // // Define the direction vector of the line
    // const lineDirection = { x: 0, y: 0, z: 1 };

    // // Define the point on the line
    // const pointOnLine = { x: 0, y: 0, z: -1 };

    // // Find the parameter t
    // const t = (-planeCoefficients.A * pointOnLine.x - planeCoefficients.B * pointOnLine.y - planeCoefficients.C * pointOnLine.z - planeCoefficients.D) /
    // (planeCoefficients.A * lineDirection.x + planeCoefficients.B * lineDirection.y + planeCoefficients.C * lineDirection.z);

    // // Calculate the point of intersection
    // const intersectionPoint = {
    //     x: pointOnLine.x + lineDirection.x * t,
    //     y: pointOnLine.y + lineDirection.y * t,
    //     z: pointOnLine.z + lineDirection.z * t,
    // };


    // console.log(intersectionPoint, t);

    // return;

    // let ray = new Vec3(0, 0, 1);
    // let square = {
    //     ul: new Vec3(0,0, 0),
    //     lr: new Vec3(1, 1, 0),
    //     normal: new Vec3(0, 0, -1),
    //     hit: function(ray, origin) {


    //     }
    // }


    // const boxVertices = [
    //     [0, 0, 0, 1], [100, 0, 0, 1], 
    //     [0, 100, 0, 1], [100, 100, 0, 1], 
    //     [0, 0, 100, 1], [100, 0, 100, 1], 
    //     [0, 100, 100, 1], [100, 100, 100, 1], 
    // ];
    // const boxVertexColors = [
    //     'red',
    //     'green',
    //     'blue',
    //     'pink',
    //     'purple',
    //     'cyan',
    //     'orange',
    //     'black'
    // ];
    // const boxFaces = [
    //     [0, 1, 3, 2],
    //     [2, 3, 7, 6],
    //     [1, 3, 7, 5],
    //     [0, 1, 5, 4],
    //     [0, 2, 6, 4],
    //     [4, 5, 7, 6]
    // ];

    // const coordinateSystem = [
    //     [0, 0, 0, 1], 
    //     [100, 0, 0, 1],
    //     [0, 100, 0, 1],
    //     [0, 0, 100, 1],
    // ];

    // // const canvas = document.getElementById('canvas')
    // // const ctx = canvas.getContext('2d');
    // // const w = canvas.width;
    // // const h = canvas.height;
    
    // l(scalerVectorMult(1.5, coordinateSystem[1]))

    // const isometricProjectionMatrix = [
    //     [Math.sqrt(3), 0, -Math.sqrt(3), 0], 
    //     [1, 2, 1, 0], 
    //     [Math.sqrt(2), -Math.sqrt(2), Math.sqrt(2), 0], 
    //     [0, 0, 0, 1], 
    // ];
    
    // // let t = time => {
    // //     let degreeX = 10 // time / 50;
    // //     let degreeY = time / 100;
    // //     let degreeZ = 0 // time / 500;
    // //     ctx.clearRect(0, 0, w, h);

    // //     const rotateXTransform = rotateXMatrix(degreeToRadians(degreeX));
    // //     const rotateYTransform = rotateYMatrix(degreeToRadians(degreeY));
    // //     const rotateZTransform = rotateZMatrix(degreeToRadians(degreeZ));
    // //     const moveTransformation = translateMatrix(w/2, h/2, 0);

    // //     let transformedCoordinateSystem = coordinateSystem
    // //             .map((v, i, a) => matrixVectorMult(isometricProjectionMatrix, v))
    // //             .map((v, i, a) => scalerVectorMult(1 / Math.sqrt(6), v))
    // //             .map((v, i, a) => matrixVectorMult(moveTransformation, v));

    // //     for (let i = 0; i < transformedCoordinateSystem.length; i++) {
    // //         const point = transformedCoordinateSystem[i];
    // //         let x = point[0];
    // //         let y = point[1];
    // //         ctx.beginPath();
    // //         ctx.arc(x, y, 3, 0, 2 * Math.PI);
    // //         ctx.fill();            
    // //     }
    // //     let p0 = transformedCoordinateSystem[0];
    // //     for (let i = 1; i < transformedCoordinateSystem.length; i++) {
    // //         const p1 = transformedCoordinateSystem[i];
    // //         ctx.beginPath();
    // //         ctx.moveTo(p0[0], p0[1]);
    // //         ctx.lineTo(p1[0], p1[1]);
    // //         ctx.stroke();                        
    // //     }
    // //     return

    // //     let transformedBox = boxVertices.map((v, i, a) => matrixVectorMult(rotateXTransform, v))
    // //         .map((v, i, a) => matrixVectorMult(rotateYTransform, v))
    // //         .map((v, i, a) => matrixVectorMult(rotateZTransform, v))
    // //         .map((v, i, a) => matrixVectorMult(rotateZTransform, v))
    // //         .map((v, i, a) => matrixVectorMult(moveTransformation, v));


    // //     const seenLines = new Set();
    // //     for (const face of boxFaces) {
    // //         for (let i = 0; i < face.length; i++) {
    // //             const u = face[i];
    // //             const v = face[(i+1) % face.length];
    // //             let lineId = u*u + v*v;
    // //             if (seenLines.has(lineId)) continue;
    // //             seenLines.add(lineId)

    // //             let p0 = transformedBox[u];
    // //             let p1 = transformedBox[v];

    // //             ctx.beginPath();
    // //             ctx.moveTo(p0[0], p0[1]);
    // //             ctx.lineTo(p1[0], p1[1]);
    // //             ctx.stroke();
                
    // //         }
    // //     }
    // //     for (let i = 0; i < transformedBox.length; i++) {
    // //         const point = transformedBox[i];
    // //         let x = point[0];
    // //         let y = point[1];
    // //         ctx.fillStyle = boxVertexColors[i];
    // //         ctx.beginPath();
    // //         ctx.arc(x, y, 3, 0, 2 * Math.PI);
    // //         ctx.fill();            
    // //     }

    // //     setTimeout(e => {
    // //         requestAnimationFrame(t)
    // //     }, 1000)
        
    // // };
    // // class Vec3 {
    // //     constructor(x, y, z) {
    // //         this.x = x;
    // //         this.y = y;
    // //         this.z = z;
    // //     }
    // // }
    // // let imageData = new ImageData(w, h);
    // l(imageData)
    // let tt = time => {

    //     for (let y = 0; y < h; y++) {
    //         for (let x = 0; x < w; x++) {
    //             const idx = (y * w + x) * 4;
    //             let origin = new Vec3(x, y, 0);
    //             let ray = new Vec3(0, 0, 1);
    //             let hit = calculateHit(origin, ray, objects);
    //             imageData.data[idx] = idx % 120 + 125
    //             imageData.data[idx + 1] = idx % 120 + 125
    //             // imageData.data[idx + 2] = idx % 255
    //             imageData.data[idx + 3] = 255

    //         }
    //     }

    //     ctx.putImageData(imageData, 0, 0);

    //     setTimeout(e => {
    //         // requestAnimationFrame(t)
    //     }, 1000)
    // }
    // requestAnimationFrame(tt);
}