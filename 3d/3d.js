'using strict';
const l = console.log;
function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

function translateMatrix(x, y, z) {
    return createMatrix([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1],
    ]);
}

function rotateXMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return createMatrix([
        [1, 0, 0, 0],
        [0, c,-s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1],
    ]);
}

function rotateYMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return createMatrix([
        [c, 0, s, 0],
        [0, 1, 0, 0],
        [-s,0, c, 0],
        [0, 0, 0, 1],
    ]);
}

function rotateZMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return createMatrix([
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]);
}

function degreeToRadians(degree) {
    return degree * Math.PI / 180;
}

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

class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
}

class Sphere {
    constructor(x, y, z, radius) {
        this.position = new Vec3(x, y, z);
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }
    setPositionV(vec) {
        this.position = vec;
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    }
    setPosition(x, y, z) {
        this.position = new Vec3(x, y, z);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Equation for sphere is x^2 + y^2 + z^2 - r = 0
    // 1. Replace x, y, and z with the corresponding expressions from the ray (i.e. ox + dx * t)
    // 2. Simplify to quadratic equation
    // 3. Solve equation
    // 4. Return smallest positive result if any
    hit(ray) { 
        // TODO: UPDATE SOLUTION TO USE SPHERE COORDINATES. THIS PROBABLY MEANS USING A TRANSLATION MATRIX
        const [ox, oy, oz] = [ray.origin.x, ray.origin.y, ray.origin.z];
        const [dx, dy, dz] = [ray.direction.x, ray.direction.y, ray.direction.z];
        const r = this.radius;

        // Polynomial pa * t^2 + pb * t + pc 
        const pa = dx*dx + dy*dy + dz*dz;
        const pb = 2*ox*dx + 2*oy*dy + 2*oz*dz;
        const pc = ox*ox + oy*oy + oz*oz - r*r;

        const result = solveQuadraticEquation(pa, pb, pc);

        if (result.length === 2) { // Two solutions
            if (result[0] >= 0 && result[1] >= 0) { // Both positive, return smallest
                return result[0] <= result[1]? result[0] : result[1];
            }
            // First is positive
            if (result[0] >= 0) {
                return result[0];
            }
            // Second is positive
            if (result[1] >= 0) {
                return result[1];
            }
            // None are positive
        }

        // Only one positive solution
        if (result.length === 1 && result[0] >= 0) {
            return result[0];
        }

        // No positive solutions
        return null;
    }
}

class Camera {
    constructor(position, up, direction) {
        this.position = position; // Viewepoint of camera
        this.e = position; // Viewepoint of camera
        this.up = up; // Up vector, perpendicular to the view direction
        this.viewDirection = direction; // View direction
        this.v = up; // Why the fuck is the up vector named v and not u? 
        this.w = direction.scale(-1);
        this.u = up.cross(this.w);
        this.sideDirection = this.u;
    }
    isOrthonormal() {
        return this.v.length() === 1 && this.w.length() === 1 && this.u.length() === 1;
    }
}

class Viewport {
    constructor(camera, left, right, top, bottom, widthInPixels, heightInPixels) {
        this.camera = camera;
        this.l = left;
        this.r = right;
        this.t = top;
        this.b = bottom;
        this.nx = widthInPixels;
        this.ny = heightInPixels;
    }
    
    getPixelCoordinatesRelativeToCamera(i, j) {
        const {l, r, t, b, nx, ny} = this;
        const u = l + (r - l) * (i + 0.5) / nx
        const v = b + (t - b) * (j + 0.5) / ny;
        return new Vec2(u, v);
    }

    getPixelCoordinatesRelativeToWorld(i, j) {
        const cameraCoordinates = this.getPixelCoordinatesRelativeToCamera(i, j);
        // ???? 
        return new Vec2(0,0);
    }

    *calculateOrthographicRays() {
        const {e, u, v, viewDirection } = this.camera;
        for (let y = 0; y < this.ny; y++) {
            for (let x = 0; x < this.nx; x++) {
                const coordinates = this.getPixelCoordinatesRelativeToCamera(x, y);
                const rayOrigin = e.add(u.scale(coordinates.x)).add(v.scale(coordinates.y));
                const ray = new Ray(rayOrigin, viewDirection);
                yield {x, y, ray};
            }
        }
    }
    *calculatePerspectiveRays(focalLength) {
        const {e, u, v, viewDirection } = this.camera;
        for (let y = 0; y < this.ny; y++) {
            for (let x = 0; x < this.nx; x++) {
                const coordinates = this.getPixelCoordinatesRelativeToCamera(x, y);
                const rayOrigin = e;
                const rayDirection = viewDirection.scale(focalLength).add(u.scale(coordinates.x)).add(v.scale(coordinates.y));
                const ray = new Ray(rayOrigin, rayDirection);
                yield {x, y, ray};
            }
        }
    }
}

const state = {
    camera: null,
    viewport: null,
    sphere: null
};

function draw() {
    const canvas = document.getElementById('canvas');// as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');// as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const {nx, ny} = state.viewport;

    const imageData = new ImageData(nx, ny); // Pixel / frame buffer
    // for (const {x, y, ray} of state.viewport.calculateOrthographicRays()) {
    for (const {x, y, ray} of state.viewport.calculatePerspectiveRays(5)) {
        const idx = y * nx + x;
        const hit = state.sphere.hit(ray);
        if (hit === null) {
            imageData.data[4 * idx + 0] = 0; // R
            imageData.data[4 * idx + 1] = 0; // G
            imageData.data[4 * idx + 2] = 0; // B
            imageData.data[4 * idx + 3] = 255; // A
        } else {
            imageData.data[4 * idx + 0] = 255; // R
            imageData.data[4 * idx + 1] = 0; // G
            imageData.data[4 * idx + 2] = 0; // B
            imageData.data[4 * idx + 3] = 255; // A
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

const settings = {
    cameraStepMovement: 0.5,
}

function initialize() {
    const canvas = document.getElementById('canvas');// as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');// as CanvasRenderingContext2D;


    const cameraPosition = new Vec3(0, 0, -5);
    const upVector = new Vec3(0, 1, 0);
    const cameraDirection = new Vec3(0, 0, 1);

    const camera = new Camera(cameraPosition, upVector, cameraDirection);
    state.camera = camera;

    assert(camera.isOrthonormal(), `Camera was not orthonormal.`);

    // NOTE: IF VIEWPORT IS SQUARE THEN NX AND NY SHOULD BE EQUAL TO AVOID DISTORTION
    const [nx, ny] = [canvas.width, canvas.height];
    const viewportWidth = 4;
    const viewportHeight = viewportWidth * (ny/nx);
    const viewportLeft = -2;
    const viewportTop = -2;
    const viewport = new Viewport(camera, viewportLeft, viewportLeft + viewportWidth, viewportTop, viewportTop + viewportHeight, nx, ny);
    state.viewport = viewport;


    // TODO: Oblique view when we can see the difference

    const imageData = new ImageData(nx, ny); // Pixel / frame buffer

    l(imageData)
    const sphere = new Sphere(0, 0, 0, 1);
    state.sphere = sphere;
    draw()



    document.addEventListener('keydown', e => {
        switch (e.key) {
            case "ArrowUp": {
                const newPosition = state.camera.position.add(new Vec3(0, settings.cameraStepMovement, 0));
                state.camera.position = newPosition;
                state.camera.e = newPosition;
                draw()
            } break;
            case "ArrowDown": {
                const newPosition = state.camera.position.add(new Vec3(0, -settings.cameraStepMovement, 0));
                state.camera.position = newPosition;
                state.camera.e = newPosition;
                draw()

            } break;
            case "ArrowLeft": {
                const newPosition = state.camera.position.add(new Vec3(-settings.cameraStepMovement, 0, 0));
                state.camera.position = newPosition;
                state.camera.e = newPosition;
                draw()

            } break;
            case "ArrowRight": {
                const newPosition = state.camera.position.add(new Vec3(settings.cameraStepMovement, 0, 0));
                state.camera.position = newPosition;
                state.camera.e = newPosition;
                draw()

            } break;
        }
    })



    // for (const {x, y, ray} of viewport.calculateOrthographicRays()) {
    //     const idx = y * nx + x;
    //     const hit = sphere.hit(ray);
    //     if (hit === null) {
    //         imageData.data[4 * idx + 0] = 0; // R
    //         imageData.data[4 * idx + 1] = 0; // G
    //         imageData.data[4 * idx + 2] = 0; // B
    //         imageData.data[4 * idx + 3] = 255; // A
    //     } else {
    //         imageData.data[4 * idx + 0] = 255; // R
    //         imageData.data[4 * idx + 1] = 0; // G
    //         imageData.data[4 * idx + 2] = 0; // B
    //         imageData.data[4 * idx + 3] = 255; // A
    //     }
    // }
    // ctx.putImageData(imageData, 100, 100);





    return
    

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

    for (let j = 0; j < ny; ++j) {
        for (let i = 0; i < nx; ++i) {
            // const u = v3add(l, v3smult(1/nx, v3smult(i + 0.5, v3sub(r, l))));
            // const v = v3add(b, v3smult(1/ny, v3smult(j + 0.5, v3sub(t, b))));
            // const x = l + (r - l)*(i + 0.5)/nx;
            // const y = b + (t - b)*(j + 0.5)/ny;

            // const ray = new Ray(e.add(u.scale(x)).add(v.scale(y)), w.scale(-1));

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