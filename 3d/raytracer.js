function raytraceScene(scene, camera, ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    assert(ctx.canvas.width == camera.viewport.pixelWidth, `The canvas width and the viewport width do not match ${ctx.canvas.width} - ${camera.viewport.pixelWidth}`)
    assert(ctx.canvas.height == camera.viewport.pixelHeight, `The canvas height and the viewport height do not match ${ctx.canvas.height} - ${camera.viewport.pixelHeight}`)

    // For every pixel
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const color = getPixelColor(scene, camera, x, y);
            // TODO?: Apply color correction
            const r = Math.min(255, color.r * 255); 
            const g = Math.min(255, color.g * 255);
            const b = Math.min(255, color.b * 255);

            imageData.setPixel(x, y, r, g, b, 255);
        } 
    }

    ctx.putImageData(imageData, 0, 0);
}

function drawDefaultRaytracerScene(canvas) {
    const ctx = canvas.getContext('2d');
    const scene = makeDefaultScene();    
    const camera = makeDefaultPerspectiveRaytracerCamera(canvas);

    raytraceScene(scene, camera, ctx);
}

// Contains a plane, a ball, ambient, a positional and a directional light, a box, a cylinder, a triangle with texture
function makeDefaultScene() {
    const plane = makeDefaultPlane();
    const ball = makeDefaultSphere();
    const box = makeDefaultBox();
    const cylinder = makeDefaultCylinder();
    const texturedTriangle = makeDefaultTexturedTriangle();

    const backgroundColor = RaytracerColor.black;

    const surfaces = [
        plane,
        ball,
        // box,
        cylinder,
        // texturedTriangle
    ];
    const ambientColor = new RaytracerColor(1, 1, 1); // Ambient light color

    const lights = [
        makeDefaultPositionalLight(),
        makeDefaultDirectionalLight(),
    ];

    return {
        getColor(ray) { 
            const hit = this.computeHit(ray);
            if (hit === null) { return backgroundColor; }
            assert(hit.material, "Hit must have a material");

            // return hit.material.scaledDiffuseColor;

            const hitPoint = ray.origin.add(ray.direction.scale(hit.distance)).add(hit.normal.scale(0.001)); // Add a small offset to avoid self-shadowing

            let diffuseCoefficient = hit.material.scaledDiffuseColor;
            let intensity 

            // Apply shading
            // let color = hit.material.computeAmbientColor(ambientColor);
            // for (const light of lights) {
            //     const lightDirection = light.getDirection(hitPoint);
            //     const shadowRay = {origin: hitPoint, direction: lightDirection};
            //     if (this.computeShadowHit(shadowRay)) { continue; } // If the shadow ray hits a surface, we are in shadow

            //     hit.material.computeDirectionalColor(light.color, lightDirection, hit.normal);
            //     const lightColor = hit.material.computeDirectionalColor(light.color, lightDirection, hit.normal);
            //     color = color.add(lightColor);
            // }
            // return color
        }, 
        computeHit(ray) {
            let hit = {distance: Infinity};
            for (const surface of surfaces) {
                const newHit = surface.hit(ray); 
                if (newHit != null && newHit.distance < hit.distance) { 
                    assert(newHit.distance >= 0, "Hit distance must be non-negative");
                    hit = newHit; 
                }
            }
            if (hit.distance === Infinity) { return null; }
            return hit;
        },
        computeShadowHit(ray) {
            for (const surface of surfaces) {
                if (surface.shadowHit(ray)) {
                    return true; // If any surface is hit, we are in shadow
                }
            }
            return false; // No surface was hit, so we are not in shadow
        }
    }
}

function makeDefaultOrthographicRaytracerCamera(canvas) {
}

function makeDefaultPerspectiveRaytracerCamera(canvas) {
    const nx = canvas.width;
    const ny = canvas.height;

    const viewportWorldWidth = 2; // Default value
    const viewportWorldHeight = 2 * (ny/nx); // Scaled to match canvas to avoid weird distortions

    // I like that coordinates can be given in x, y and height in z (e.g. like Minecraft)
    const cameraPosition = new Vec4(0, -15, viewportWorldHeight/2, 1); // Default value. Half of viewport height is to prevent the viewport from clipping through a z = 0 plane.
    const focalDistance = 2; // Default value

    const cameraDirection = new Vec4(0, 1, 0, 0); // Default value
    const cameraUp = new Vec4(0, 0, 1, 0); // Default value
    const cameraRight = new Vec4(1, 0, 0, 0); // Default value

    // The viewport which the camera looks through can be shifted to have funny looking rays. 
    // In this case we just want the camera to look directly through the center of the viewport and not through any angles
    const viewportCenterPosition = cameraPosition.add(cameraDirection.scale(focalDistance));
    const viewportTopLeft = viewportCenterPosition.add(cameraUp.scale(viewportWorldHeight/2)).add(cameraRight.scale(-viewportWorldWidth/2));

    return {
        viewport: {
            position: viewportCenterPosition,
            pixelWidth: nx,
            pixelHeight: ny
        },
        getRay(x, y) {
            // The position the ray passes through the viewport. This is to avoid drawing something between the camera and the viewport. Alternatively we could cull things that are within focalDistance of the camera position. However, that would require the scene knowing the focal distance. 
            const right = cameraRight.scale(viewportWorldWidth * ((x + 0.5) / nx))
            const down = cameraUp.scale(-viewportWorldHeight * ((y + 0.5)/ny));

            const origin = viewportTopLeft.add(right).add(down);
            const direction = origin.subtract(cameraPosition).normalize();

            return {origin, direction};
        }
    }
}

function getPixelColor(scene, camera, x, y) {
    const ray = camera.getRay(x, y)
    return scene.getColor(ray);
}

function makeDefaultPlane() {
    const transformation = Transformation.translate(0, 0, 0);
    const material = new MatteMaterial(0.8, new RaytracerColor(0.7, 0.7, 0.7), 1.0, new RaytracerColor(0.6, 0.6, 0.6));
    return new RaytracerPlane(transformation, material);
}

function makeDefaultSphere() {
    const rotate = Transformation.rotateX(0);
    const scale = Transformation.scale(2, 2, 2);
    const translate = Transformation.translate(3, -2, 1);
    const transformation = rotate.then(translate).then(scale);

    const material = new MatteMaterial(0.8, new RaytracerColor(0.9, 0.1, 0.0), 0.1, new RaytracerColor(1, 0, 0));
    return new RaytracerSphere(transformation, material);
}
function makeDefaultDirectionalLight() {
    return new RaytracerDirectionalLight(new Vec4(-1, 0, 0.2, 0).normalize(), new RaytracerColor(0.8, 0.8, 0.8));
}
function makeDefaultPositionalLight() {
    return new RaytracerPositionalLight(new Vec4(2, -2, 8, 1), new RaytracerColor(0.1, 0.1, 0.7));
}
function makeDefaultBox() {
    return new RaytracerBox(new Vec3(), new Vec3())
}
function makeDefaultCylinder() {
    const rotate = Transformation.rotateX(Math.PI / 6);
    const scale = Transformation.scale(1.0, 1.0, 3.0);
    const translate = Transformation.translate(0, 0, 2);
    const transformation = rotate.then(translate).then(scale);

    const material = new MatteMaterial(0.8, new RaytracerColor(0.0, 0.8, 0.1), 0.2, new RaytracerColor(0.0, 0.4, 0.05));
    const cylinder = new RaytracerOpenCylinder(transformation, material);

    return cylinder;
}
function makeDefaultTexturedTriangle() {
    return new RaytracerTexturedTriangle(new Vec3(), new Vec3(), new Vec3(), () => {return false});
}


class RaytracerPlane {
    constructor(transformation, material) {
        this.transformation = transformation;
        this.material = material;
    }
    hit(ray) {
        // For now we just assume this plane is z = 0 and then maybe we can do inverse tranform later? 
        // Then the normal is just z = 1

        const normal = new Vec4(0, 0, 1, 0); // Normal is just z = 1

        if (ray.origin.z === 0) {
            return {distance: 0, normal, point: ray.origin, surface: this}; 
        }
        else if (ray.direction.z === 0) {
            return null;
        }
        const t = - ray.origin.z / ray.direction.z

        if (t >= 0) {
            return {distance: t, normal, material: this.material};
        }

        return null;
    }
    shadowHit(ray) {
        return false;
    }
}

class RaytracerSphere {
    constructor(transformation, material) {
        this.transformation = transformation;
        this.material = material;
    }
    hit(ray) {
        ray = this.transformation.inverseTransformRay(ray);

        // ray direction is (0, 1, 0, 0) and origin is (0, -5, 0, 1)

        const a = ray.direction.dot(ray.direction);
        const b = 2 * ray.direction.dot(ray.origin);
        const c = ray.origin.dot(ray.origin) - 2; // Need to account for the ray origin being a Vec4 with w = 1 so the dot product is 1 more than for a Vec3

        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return null; // No intersection

        const dSqrt = Math.sqrt(discriminant);
        const denom = 2 * a;
        const t1 = (-b + dSqrt) / denom;
        const t2 = (-b - dSqrt) / denom;

        if (t1 < 0 && t2 < 0) return null; // Both intersections are behind the ray origin
        const t = Math.min(t1, t2); // TODO?: This does not work if the ray is inside the sphere
        const hitPoint = ray.origin.add(ray.direction.scale(t));
        const normal = new Vec4(hitPoint.x, hitPoint.y, hitPoint.z, 0).normalize(); // Normal is just the point on the sphere
        return {distance:t, normal, material: this.material}; 
    }
    shadowHit(ray) {
        const a = ray.direction.dot(ray.direction);
        const b = 2 * ray.direction.dot(ray.origin);
        const c = ray.origin.dot(ray.origin) - 1;

        const discriminant = b * b - 4 * a * c;
        return discriminant >= 0; // If the discriminant is negative, there is no intersection, so we return false
    }
}

class RaytracerBox {
    constructor(cornerA, cornerB) {
    }
    hit(ray) {
        return null;
    }
    shadowHit(ray) {
        return false;
    }
}

class RaytracerPositionalLight {
    constructor(position, color) {
        assert(color instanceof RaytracerColor, "Color must be a Color instance");
        assert(position instanceof Vec4 && position[3] === 1, "Position must be a Vec4");
        this.position = position;
        this.color = color;
    }
    getDirection(point) {
        assert(point instanceof Vec4 && point[3] === 1, "Point must be a Vec4 with w = 1");
        const direction = this.position.subtract(point).normalize();
        return direction;
    }
}

class RaytracerDirectionalLight {
    constructor(direction, color) {
        // We assume the direction is normalized and pointing towards the light source
        assert(direction instanceof Vec4 && direction[3] == 0, "Direction must be a Vec4");
        assert(direction.length() > 0, "Direction vector must not be zero length");
        assert(color instanceof RaytracerColor, "Color must be a Color instance");
        this.direction = direction;
        this.color = color;
    }
    getDirection(hitPoint) {
        return this.direction;
    }
}

class RaytracerColor {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    scale(scalar) {
        return new RaytracerColor(this.r * scalar, this.g * scalar, this.b * scalar);
    }
    add(other) {
        return new RaytracerColor(this.r + other.r, this.g + other.g, this.b + other.b);
    }
    multiply(other) {
        return new RaytracerColor(this.r * other.r, this.g * other.g, this.b * other.b);
    }
    static black = new RaytracerColor(0, 0, 0);
    static white = new RaytracerColor(1, 1, 1);
}

class MatteMaterial {
    constructor(diffuseReflectionCoefficient, diffuseColor, ambientReflectionCoefficient, ambientColor) {
        this.scaledDiffuseColor = diffuseColor.scale(diffuseReflectionCoefficient / Math.PI);
        this.scaledAmbientColor = ambientColor.scale(ambientReflectionCoefficient);
    }
    computeAmbientColor(color) {
        return color.multiply(this.scaledAmbientColor);
    }
    computeDirectionalColor(color, direction, normal) {
        const lightColor = color.scale(normal.dot(direction))
        return this.scaledDiffuseColor.multiply(lightColor);
    }
    // TODO?: Area light with l_G and l_pdf
}

class RaytracerOpenCylinder {
    constructor(transformation, material) {
        this.transformation = transformation;
        this.material = material; 
    }
    hit(ray) {
        ray = this.transformation.inverseTransformRay(ray);

        const a = ray.direction.x * ray.direction.x + ray.direction.y * ray.direction.y;
        const b = 2 * ray.origin.x * ray.direction.x + 2 * ray.origin.y * ray.direction.y;
        const c = ray.origin.x * ray.origin.x + ray.origin.y * ray.origin.y - 1;

        const result = solveQuadraticEquation(a, b, c);
        if (result.length === 0) { return null; }
        else if (result.length === 1 && result[0] >= 0) {  
            let hitPoint = ray.origin.add(ray.direction.scale(result[0]));
            if (hitPoint.z > 0.5 || hitPoint.z < -0.5) { 
                return null;
            }
            let normal = new Vec4(hitPoint.x, hitPoint.y, 0, 0).normalize();
            normal = this.transformation.transformNormal(normal);
            return {distance: result[0], normal, material: this.material};
        }

        // I believe if we get the second result the it is always the inside, but now I am not so sure.

        // How many cases do we have
        // + +  MIN In this case we need to take the minimum
        // - -  NONE
        // - +  1
        // + -  0

        if (result[0] >= 0 && result[1] >= 0) { 
            let t = Math.min(result[0], result[1]); // First we try the closest hit
            let hitPoint = ray.origin.add(ray.direction.scale(t));
            if (hitPoint.z > 0.5 || hitPoint.z < -0.5) { // Miss the closest 
                t = Math.max(result[0], result[1]);
                hitPoint = ray.origin.add(ray.direction.scale(t));
                if (hitPoint.z > 0.5 || hitPoint.z < -0.5) {  // Miss both
                    return null;
                }
                // We hit the far side of the cylinder (which is probably the inside?)
                let normal = new Vec4(hitPoint.x, hitPoint.y, 0, 0).scale(-1).normalize(); 
                normal = this.transformation.transformNormal(normal);
                return {distance: t, normal, material: this.material};
            }
            let normal = new Vec4(hitPoint.x, hitPoint.y, 0, 0).normalize(); 
            normal = this.transformation.transformNormal(normal);
            return {distance: t, normal, material: this.material};
        }


        const t = Math.max(result[0], result[1]);
        const hitPoint = ray.origin.add(ray.direction.scale(t));
        // The center of the cylinder is at origin. So we check if the hit point is too high. 
        if (hitPoint.z > 0.5 || hitPoint.z < -0.5) { 
            return null
        } 

        let normal = new Vec4(hitPoint.x, hitPoint.y, 0, 0).normalize(); // TODO: Handle the case when we see inside the cylinder
        normal = this.transformation.transformNormal(normal);
        return {distance: t, normal, material: this.material};
    }
    shadowHit(ray) {
        return false;
    }

}

class RaytracerTexturedTriangle {
    constructor(a, b, c, texture) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.texture = texture;
    }
    hit(ray) {
        return null;
    }
    shadowHit(ray) {
        return false;
    }
}

class Transformation {
    constructor() {}
    static scale(x, y, z) {
        const transformation = new Transformation();
        transformation.matrix = Matrix.fromArray([
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1],
        ]);
        transformation.inverseMatrix = Matrix.fromArray([
            [1/x, 0, 0,  0],
            [0, 1/y, 0,  0],
            [0,  0, 1/z, 0],
            [0,  0,  0,  1],
        ])
        return transformation;
    }
    static rotateX(rad) {
        const transformation = new Transformation();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        transformation.matrix = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);
        transformation.inverseMatrix = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c, s, 0],
            [0,-s, c, 0],
            [0, 0, 0, 1],
        ])
        return transformation;
    }
    static rotateY(rad) {
        const transformation = new Transformation();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        transformation.matrix = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
        transformation.inverseMatrix = Matrix.fromArray([
            [c, 0, -s, 0],
            [0, 1, 0, 0],
            [s,0, c, 0],
            [0, 0, 0, 1],
        ])
        return transformation;
    }
    static rotateZ(rad) {
        const transformation = new Transformation();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        transformation.matrix = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);
        transformation.inverseMatrix = Matrix.fromArray([
            [ c, s, 0, 0],
            [-s, c, 0, 0],
            [ 0, 0, 1, 0],
            [ 0, 0, 0, 1],
        ])
        return transformation;
    }
    static translate(x, y, z) {
        const transformation = new Transformation();
        transformation.matrix = Matrix.fromArray([
            [1, 0, 0, x],
            [0, 1, 0, y],
            [0, 0, 1, z],
            [0, 0, 0, 1],
        ]);
        transformation.inverseMatrix = Matrix.fromArray([
            [1, 0, 0, -x],
            [0, 1, 0, -y],
            [0, 0, 1, -z],
            [0, 0, 0, 1],
        ])
        return transformation;
    }
    then(that) {
        const transformation = new Transformation();
        transformation.matrix = this.matrix.mult(that.matrix);
        transformation.inverseMatrix = that.inverseMatrix.mult(this.inverseMatrix);
        return transformation;
    }
    inverseTransformRay(ray) {
        assert(ray.origin instanceof Vec4 && ray.origin[3] === 1, "Ray origin must be a Vec4 with w = 1");
        assert(ray.direction instanceof Vec4 && ray.direction[3] === 0, "Ray direction must be a Vec4 with w = 0");
        const newOrigin = this.inverseMatrix.transformVec4(ray.origin);
        const newDirection = this.inverseMatrix.transformVec4(ray.direction);
        return {origin: newOrigin, direction: newDirection};
    }
    transformPoint(point) {
        return point;
    }
    transformNormal(normal) {
        const transposedInverseMatrix = this.inverseMatrix.transpose();
        return transposedInverseMatrix.transformVec4(normal);
    }

}
