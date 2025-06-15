function drawScene(scene, camera, ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    assert(ctx.canvas.width == camera.viewport.pixelWidth, `The canvas width and the viewport width do not match ${ctx.canvas.width} - ${camera.viewport.pixelWidth}`)
    assert(ctx.canvas.height == camera.viewport.pixelHeight, `The canvas height and the viewport height do not match ${ctx.canvas.height} - ${camera.viewport.pixelHeight}`)

    // For every pixel
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const color = getPixelColor(scene, camera, x, y);
            // TODO?: Apply color correction
            const r = color.r * 255; 
            const g = color.g * 255;
            const b = color.b * 255;

            imageData.setPixel(x, y, r, g, b, 255);
        } 
    }

    ctx.putImageData(imageData, 0, 0);
}

function drawDefaultRaytracerScene(canvas) {
    const ctx = canvas.getContext('2d');
    const scene = makeDefaultScene();    
    const camera = makeDefaultPerspectiveRaytracerCamera(canvas);

    drawScene(scene, camera, ctx);
}

// Contains a plane, a ball, a light, a box, a cylinder, a triangle with texture
function makeDefaultScene() {
    const plane = makeDefaultPlane();
    const ball = makeDefaultShpere();
    const light = makeDefaultLight();
    const box = makeDefaultBox();
    const cylinder = makeDefaultCylinder();
    const texturedTriangle = makeDefaultTexturedTriangle();

    const backgroundColor = {r: 0, g: 0, b: 0};

    const surfaces = [
        plane,
        ball,
        // box,
        // cylinder,
        // texturedTriangle
    ];

    return {
        getColor(ray) { 
            let hit = {distance: Infinity, point: null};
            for (const surface of surfaces) {
                const newHit = surface.hit(ray);
                if (newHit != null && newHit.distance < hit.distance) { hit = newHit; }
            }

            if (hit.point == null) { return backgroundColor; }
            else {
                return hit.surface.color;
            }

            const shadowRay = {origin: hit.point, direction: light.position.subtract(hit.point)}
            let shadowHit = false;
            for (const surface of surfaces) {
                if (surface.shadowHit(shadowRay)) { 
                    shadowHit = true;
                    break;
                }
            }

            return {r: 1, g: 0, b: 0};
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
    const cameraPosition = new Vec3(0, -5, viewportWorldHeight/2); // Default value. Half of viewport height is to prevent the viewport from clipping through a z = 0 plane.
    const focalDistance = 2; // Default value

    const cameraDirection = new Vec3(0, 1, 0); // Default value
    const cameraUp = new Vec3(0, 0, 1); // Default value
    const cameraRight = new Vec3(1, 0, 0); // Default value

    // The viewport which the camera looks through can be shifted to have funny looking rays. 
    // In this case we just want the camera to look directly through the center of the viewport and not through any angles
    const viewportCenterPosition = cameraDirection.scale(focalDistance).add(cameraPosition);
    const viewportTopLeft = viewportCenterPosition.add(cameraUp.scale(viewportWorldHeight/2)).add(cameraRight.scale(-viewportWorldWidth/2));

    // TODO: Should we just use a vec4? Or something which acts like it? I think the things which acts like it would just be for the purpose of optimization, so maybe just use a normal Vec4.

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
    return new RaytracerPlane(new Vec3(0,0, 1));
}
function makeDefaultShpere() {
    return new RaytracerSphere(new Vec3(1.5, 1, 1), 2);
}
function makeDefaultLight() {
    return new RaytracerPositionalLight(new Vec3(0, 0, 5));
}
function makeDefaultBox() {
    return new RaytracerBox(new Vec3(), new Vec3())
}
function makeDefaultCylinder() {
    return new RaytracerCylinder(new Vec3(-1, -1, 0), 3, 2);
}
function makeDefaultTexturedTriangle() {
    return new RaytracerTexturedTriangle(new Vec3(), new Vec3(), new Vec3(), () => {return false});
}


class RaytracerPlane {
    constructor(position, normal) {
        this.position = position;
        this.normal = normal;
        this.color = {r:0.4, g:0.4, b:0.4};
    }
    hit(ray) {
        // For now we just assume this plane is z = 0 and then maybe we can do inverse tranform later? 
        // Then the normal is just z = 1
        const normal = new Vec3(0, 0, 1);

        if (ray.origin.z === 0) {
            return {distance: 0, normal, point: ray.origin, surface: this}; 
        }
        else if (ray.direction.z === 0) {
            return null;
        }
        const t = - ray.origin.z / ray.direction.z

        if (t >= 0) {
            return {distance: t, normal, point: ray.origin.add(ray.direction.scale(t)).add(normal.scale(0.00001)), surface: this};
        }

        return null;
    }
    shadowHit(ray) {
        return false;
    }
}

class RaytracerSphere {
    constructor(position, radius) {
        this.position = position;
        this.radius = radius;
        this.color = {r: 1, g:0, b: 0};
    }
    hit(ray) {
        const ecDiff = ray.origin.subtract(this.position);
        const a = ray.direction.dot(ray.direction);
        const b = 2 * ray.direction.dot(ecDiff);
        const c = ecDiff.dot(ecDiff) - this.radius * this.radius;

        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return null; // No intersection

        const dSqrt = Math.sqrt(discriminant);
        const denom = 2 * a;
        const t1 = (-b + dSqrt) / denom;
        const t2 = (-b - dSqrt) / denom;

        if (t1 < 0 && t2 < 0) return null; // Both intersections are behind the ray origin
        const t = Math.min(t1, t2);
        const normal = ray.origin.add(ray.direction.scale(t)).subtract(this.position).normalize();
        const hitPoint = ray.origin.add(ray.direction.scale(t)).add(normal.scale(0.00001)); // Offset the hit point slightly to avoid self-intersection

        return {distance:t, normal, point:hitPoint, surface:this}; 
    }
    shadowHit(ray) {
        return this.hit(ray) != null;
    }
}

class RaytracerBox {
    constructor(cornerA, cornerB) {
        
        this.color = {r:0,g:0, b:1};
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
        this.position = position;
        this.color = color;
        this.color = {r: 0.9, g: 0.7, b: 0.8};
    }
}

class RaytracerCylinder {
    constructor(position, height, radius) {
        this.position = position;
        this.height = height;
        this.radius = radius;
        this.color = {r: 0, g:1, b:0};
    }
    hit(ray) {
        return null;
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