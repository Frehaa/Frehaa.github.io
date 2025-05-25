'using strict';
function translateMatrix(x, y, z) {
    return Matrix.fromArray([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1],
    ]);
}

function rotateXMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return Matrix.fromArray([
        [1, 0, 0, 0],
        [0, c,-s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1],
    ]);
}

function rotateYMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return Matrix.fromArray([
        [c, 0, s, 0],
        [0, 1, 0, 0],
        [-s,0, c, 0],
        [0, 0, 0, 1],
    ]);
}

function rotateZMatrix(rad) {
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return Matrix.fromArray([
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
        this.e = origin;
        this.direction = direction;
        this.d = direction;
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

        const ecDiff = ray.origin.subtract(this.position);

        const a = ray.direction.dot(ray.direction)
        const b = 2 * ray.direction.dot(ecDiff)

        const c = ecDiff.dot(ecDiff) - this.radius * this.radius;
 
        const result = solveQuadraticEquation(a, b, c);

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

class Cylinder {
    constructor(x, y, z, radius, height) {
        this.position = new Vec3(x, y, z);
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.height = height;
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
    hit(ray) {
        
    }
}

// For some reason, the x plane is flipped
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

class ParallelProjectionRayGenerator { 
    constructor(center, direction, up, right, width, height, nx, ny) {
        this.center = center; // Center of the viewport
        this.direction = direction; // Direction of the rays
        this.width = width; // Width of the viewport
        this.height = height; // Height of the viewport
        this.nx = nx; // Number of pixels in x direction
        this.ny = ny; // Number of pixels in y direction
        this.up = up; // Up vector of the viewport
        this.right = right; // Right vector of the viewport

        this.topLeft = this.center.add(this.right.scale(-this.width / 2)).add(this.up.scale(this.height / 2));
    }
    generateRay(x, y) {
        assert(x >= 0 && x < this.nx, `X coordinate out of bounds: ${x}`);
        assert(y >= 0 && y < this.ny, `Y coordinate out of bounds: ${y}`);
        // This does extra calculations since it calculates from the top left corner every time and adds two vectors. Alternatively, when we have calculated the coordinate for x = 1, we don't need to calculate this again, only the up vector needs to be added.
        const rayOrigin = this.topLeft.add(this.right.scale(this.width * (x + 0.5) / this.nx)).add(this.up.scale(-this.height * (y + 0.5) / this.ny));
        const rayDirection = this.direction; // Parallel projection, so direction is constant
        return new Ray(rayOrigin, rayDirection);
    }

}

const state = {
    camera: null,
    viewport: null,
    objects: []
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
        let currentObject = null;
        let currentDistance = Infinity;

        for (const object of state.objects) {
            const hit = object.hit(ray);
            if (hit !== null && hit < currentDistance) {
                currentObject = object;
                currentDistance = hit;
            }
        }

        if (currentObject === null) {
            imageData.data[4 * idx + 0] = 0; // R
            imageData.data[4 * idx + 1] = 0; // G
            imageData.data[4 * idx + 2] = 0; // B
            imageData.data[4 * idx + 3] = 255; // A
        } else if (currentObject instanceof Sphere) {
            imageData.data[4 * idx + 0] = 255; // R
            imageData.data[4 * idx + 1] = 0; // G
            imageData.data[4 * idx + 2] = 0; // B
            imageData.data[4 * idx + 3] = 255; // A
        } else if (currentObject instanceof Triangle) {
            imageData.data[4 * idx + 0] = 0; // R
            imageData.data[4 * idx + 1] = 255; // G
            imageData.data[4 * idx + 2] = 0; // B
            imageData.data[4 * idx + 3] = 255; // A

        }
    }
    ctx.putImageData(imageData, 0, 0);
}

class Triangle {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
    hit(ray) {
        const [[a, d, g],
               [b, e, h],
               [c, f, i]]  = [
            [this.a.x - this.b.x, this.a.x - this.c.x, ray.d.x],
            [this.a.y - this.b.y, this.a.y - this.c.y, ray.d.y],
            [this.a.z - this.b.z, this.a.z - this.c.z, ray.d.z],
        ];
        const [j, k, l] = [this.a.x - ray.e.x, this.a.y - ray.e.y, this.a.z - ray.e.z];

        //  a d g     x      j
        //  b e h  *  y   =  k
        //  c f i     z      l

        const eiMinushf = e*i - h*f; // A[1][1] * A[2][2] - A[1][2] * A[2][1];
        const gfMinusdi = g*f - d*i; // A[0][2] * A[2][1] - A[0][1] * A[2][2];
        const dhMinuseg = d*h - e*g; // A[0][1] * A[1][2] - A[1][1] * A[0][2];
        const akMinusjb = a*k - j*b; // A[0][0] * B[1]    - B[0]    * A[1][0];
        const jcMinusal = j*c - a*l; // B[0]    * A[2][0] - A[0][0] * B[2];
        const blMinuskc = b*l - k*c; // A[1][0] * B[2]    - B[1]    * A[2][0]; 
        const M = a*eiMinushf + b*gfMinusdi + c*dhMinuseg; // A[0][0] * eiMinushf + A[1][0] * gfMinusdi + A[2][0] * dhMinuseg;

        const t = -(f*akMinusjb + e*jcMinusal + d*blMinuskc) / M;
        if (t < 0) return null;

        const gamma = (i*akMinusjb + h*jcMinusal + g*blMinuskc) / M;
        if (gamma < 0 || gamma > 1) return null;

        
        const beta = (j* eiMinushf  + k*gfMinusdi + l*dhMinuseg) / M;
        if (beta < 0 || beta > 1 - gamma) return null;
    
        return t;

    }
    slowHit(ray) {
        const [d, e] = [ray.direction, ray.origin];
        const {a, b, c} = this;
        const A = createMatrix([
            [a.x - b.x, a.x - c.x, d.x],
            [a.y - b.y, a.y - c.y, d.y],
            [a.z - b.z, a.z - c.z, d.z],
        ]);
        const M = A.determinant();

        const T = createMatrix([
            [a.x - b.x, a.x - c.x, a.x - e.x], 
            [a.y - b.y, a.y - c.y, a.y - e.y],
            [a.z - b.z, a.z - c.z, a.z - e.z],
        ]);
        const TD = T.determinant();
        const t = TD / M;
        if (t < 0) return null;

        const G = createMatrix([
            [a.x - b.x, a.x - e.x, d.x], 
            [a.y - b.y, a.y - e.y, d.y], 
            [a.z - b.z, a.z - e.z, d.z], 
        ]);
        const GD = G.determinant();
        const gamma = GD / M;
        if (gamma < 0 || gamma > 1) return null;


        const B = createMatrix([
            [a.x - e.x, a.x - c.x, d.x],
            [a.y - e.y, a.y - c.y, d.y],
            [a.z - e.z, a.z - c.z, d.z],
        ])
        const BD = B.determinant();
        const beta = BD / M;
        if (beta < 0 || beta > 1 - gamma) return null;

        // l(t, beta, gamma)
        return t;
    }
}

const settings = {
    cameraStepMovement: 0.5,
}

// How to implement euler angles?
function rotateCamera(camera, x, y, z) {
    const rotationX = rotateXMatrix(x);
    const rotationY = rotateYMatrix(y);
    const rotationZ = rotateZMatrix(z);
    const rotationMatrix = rotationX.multiply(rotationY).multiply(rotationZ);
    camera.position = rotationMatrix.multiply(camera.position);
    camera.viewDirection = rotationMatrix.multiply(camera.viewDirection);

    camera.up = rotationMatrix.multiply(camera.up);
    camera.e = rotationMatrix.multiply(camera.e);
    camera.u = rotationMatrix.multiply(camera.u);
    camera.v = rotationMatrix.multiply(camera.v);
    camera.w = rotationMatrix.multiply(camera.w);
    camera.sideDirection = rotationMatrix.multiply(camera.sideDirection);
    camera.isOrthonormal();

    camera.viewDirection = camera.viewDirection.scale(-1);
    camera.u = camera.up.cross(camera.viewDirection);
    camera.v = camera.viewDirection.cross(camera.u);
    camera.w = camera.viewDirection;
    camera.u = camera.u.scale(-1);
    camera.v = camera.v.scale(-1);
    camera.w = camera.w.scale(-1);
    camera.sideDirection = camera.u;
    camera.isOrthonormal();
}

function initialize() {
    // const animationManager = new AnimationFrameRequestManager(() => {});
    // animationManager.start();

    // return perspectiveProjection();
    return parallelProjection();
    // const canvas = document.getElementById('canvas');

    let isDirty = true;
    const cameraPosition = new Vec3(0, 0, -5);
    const upVector = new Vec3(0, 1, 0);
    const cameraDirection = new Vec3(0, 0, 1);

    const camera = new Camera(cameraPosition, upVector, cameraDirection);
    assert(camera.isOrthonormal(), `Camera was not orthonormal.`);
    l(`Camera:`, camera);
    document.addEventListener('keydown', e => {
        switch (e.key) {
            case "ArrowUp": {
                const newPosition = camera.position.add(new Vec3(0, settings.cameraStepMovement, 0));
                camera.position = newPosition;
                camera.e = newPosition;
            } break;
            case "ArrowDown": {
                const newPosition = camera.position.add(new Vec3(0, -settings.cameraStepMovement, 0));
                camera.position = newPosition;
                camera.e = newPosition;
            } break;
            case "ArrowLeft": {
                const newPosition = state.camera.position.add(new Vec3(-settings.cameraStepMovement, 0, 0));
                camera.position = newPosition;
                camera.e = newPosition;
            } break;
            case "ArrowRight": {
                const newPosition = state.camera.position.add(new Vec3(settings.cameraStepMovement, 0, 0));
                camera.position = newPosition;
                camera.e = newPosition;
            } break;
        }
        isDirty = true;
    })

    state.camera = camera;


    // NOTE: IF VIEWPORT IS SQUARE THEN NX AND NY SHOULD BE EQUAL TO AVOID DISTORTION
    const [nx, ny] = [canvas.width, canvas.height];
    const viewportWidth = 4;
    const viewportHeight = viewportWidth * (ny/nx);
    const viewportLeft = -2;
    const viewportTop = -2;
    const viewport = new Viewport(camera, viewportLeft, viewportLeft + viewportWidth, viewportTop, viewportTop + viewportHeight, nx, ny);
    state.viewport = viewport;

    // TODO: Oblique parallel view when we can see the difference
    // TODO: oblique perspective 

    const sphere = new Sphere(0, 0, 0, 1);
    state.objects.push(sphere);

    const triangle = new Triangle(
        new Vec3(0.5, 0, -1),
        new Vec3(-1, 0, -1),
        new Vec3(0, -1, -1),
    )
    state.objects.push(triangle)

    let lastTime = 0;
    function loop(time) {
        if (!isDirty) { return requestAnimationFrame(loop); };
        const deltaTime = time - lastTime;
        l(`Delta time: ${deltaTime}`);
        lastTime = time;

        draw();
        isDirty = false;
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(time => {
        lastTime = time;
        loop(time);
    });
}

function parallelProjection() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(canvas.width, canvas.height); // Pixel / frame buffer

    const [nx, ny] = [canvas.width, canvas.height];
    const viewportWidth = 4;
    const viewportHeight = viewportWidth * (ny/nx);

    const viewPortCenter = new Vec3(0, 0, 0);

    // These initial values should be fixed and only changed by rotation
    let viewportDirection = new Vec3(0, 1, 0); 
    let viewportUp = new Vec3(0, 0, 1);
    let viewportRight = new Vec3(1, 0, 0);


    const xAngle = 0///Math.PI / 2;
    const yAngle = 0; // Math.PI / 36;
    const zAngle = 0; // Math.PI / 36;

    const Rx = rotateXMatrix(xAngle);
    const Ry = rotateYMatrix(yAngle);
    const Rz = rotateZMatrix(zAngle);
    const R = Rz.mult(Ry).mult(Rx);

    viewportDirection = viewportDirection.transform(R);
    viewportUp = viewportUp.transform(R);
    viewportRight = viewportRight.transform(R);

    const viewportTopLeft = viewPortCenter.add(viewportRight.scale(-viewportWidth / 2)).add(viewportUp.scale(viewportHeight / 2));

    const objects = [
        new Sphere(0, 5, 0, 1),
        new Sphere(0, 0, 5, 1),
    ];

    for (let screenX = 0; screenX < nx; screenX++) {
        const test = viewportTopLeft.add(viewportRight.scale(viewportWidth * (screenX + 0.5) / nx));
        for (let screenY = 0; screenY < ny; screenY++) {
            const rayOrigin = test.add(viewportUp.scale(-viewportHeight * (screenY + 0.5) / ny)); // We go down because the y axis is flipped in the canvas
            
            imageData.setPixel(screenX, screenY, 0, 0, 0, 255); // Black background
            for (let k = 0; k < objects.length; k++) {
                const object = objects[k];
                // Calculate the ray direction
                const rayDirection = viewportDirection;
                // Check if the ray hits the object
                const hit = object.hit(new Ray(rayOrigin, rayDirection));
                if (hit !== null) {
                    switch (k) {
                        case 0: // First sphere
                            imageData.setPixel(screenX, screenY, 255, 0, 0, 255); // Red sphere
                            break;
                        case 1: // Second sphere
                            imageData.setPixel(screenX, screenY, 0, 255, 0, 255); // Green sphere
                            break;
                        default:
                            imageData.setPixel(screenX, screenY, 0, 0, 255, 255); // Blue for any other object
                    }
                }
            }

        }
        // return 
    }

    ctx.putImageData(imageData, 0, 0);

}

function perspectiveProjection() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(canvas.width, canvas.height); // Pixel / frame buffer

    const cameraCenter = new Vec3(0, 0, -10);

    const viewPortCenter = new Vec3(0, 0, -5);
    const [nx, ny] = [canvas.width, canvas.height];
    const viewportWidth = 4;
    const viewportHeight = viewportWidth * (ny/nx);
    const viewportLeft = viewPortCenter.x - viewportWidth / 2;
    const viewportTop = viewPortCenter.y - viewportHeight / 2;

    const sphereX = 0;
    const sphereY = 0;
    const sphereZ = 10
    const sphereRadius = 1;

    for (let i = 0; i < nx; i++) {
        const rayX = viewportLeft + viewportWidth * (i + 0.5) / nx;
        for (let j = 0; j < ny; j++) {
            const rayY = viewportTop + viewportHeight * (j + 0.5) / ny;
            const rayTarget = new Vec3(rayX, rayY, viewPortCenter.z);

            const rayDirection = rayTarget.subtract(cameraCenter);

            const ecDiff = cameraCenter.subtract(new Vec3(sphereX, sphereY, sphereZ));
            
            const a = rayDirection.dot(rayDirection)
            const b = 2 * rayDirection.dot(ecDiff)

            const c = ecDiff.dot(ecDiff) - sphereRadius * sphereRadius;

            const discriminant = b * b - 4 * a * c;
            if (discriminant < 0) { // No intersection
                imageData.setPixel(i, j, 0, 0, 0, 255); // Black background
                continue;
            }

            const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            if (t1 < 0 && t2 < 0) {
                imageData.setPixel(i, j, 0, 0, 0, 255); // Black background
            } else { // At least one of the intersections is in front of the viewport
                imageData.setPixel(i, j, 255, 0, 0, 255); // Red sphere
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

}