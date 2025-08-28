// Literature uses v for up, w for negative direction, and u for right
class Camera3D {
    // Creates a new camera with position at origin and direction in the -z direction
    constructor() {
        this.position = new Vec3(0, 0, 0);
        // this.direction = new Vec4(0, 0, -1, 0);
        // this.right = new Vec4(1, 0, 0, 0);

        this.yawRadians = 0;
        this.rollRadians = 0;
        this.pitchRadians = 0

        this.transformation = null;
    }

    // Turn horizontally in clockwise direction.
    turnHorizontal(radians) {
        this.yawRadians += radians;
        this.transformation = null;
    }

    // Turn vertically in clockwise direction.
    turnVertical(radians) {
        this.pitchRadians -= radians;
        this.transformation = null;
    }

    // Lean in clockwise direction (right). Leans left with negative values.
    lean(radians) {
        this.rollRadians = clamp(this.rollRadians + radians, -Math.PI / 2, Math.PI / 2);
        this.transformation = null;
    }

    move(delta) {
        this.position = this.position.add(delta);
        this.transformation = null;
    }

    moveRelative(delta) {
        const dirX = Math.sin(this.yawRadians);
        const dirZ = -Math.cos(this.yawRadians);
        const direction = new Vec3(dirX, 0, dirZ).normalize();

        const right = new Vec3(-dirZ, 0, dirX);

        this.position = this.position.add(direction.scale(delta.z)).add(right.scale(delta.x)).add(new Vec3(0, delta.y, 0))
        this.transformation = null;
    }

    setPosition(newPosition) {
        this.position = newPosition;
        this.transformation = null;
    }

    getTransformation() {
        // Only recompute if needed
        if (this.transformation !== null) { return this.transformation; } 

        const dirX = Math.sin(this.yawRadians);
        const dirY = Math.sin(this.pitchRadians);
        const dirZ = -Math.cos(this.yawRadians);
        const direction = new Vec3(dirX, dirY, dirZ);

        const upX = Math.sin(this.rollRadians);
        const upY = Math.cos(this.rollRadians);
        const cameraUp = new Vec3(upX, upY, 0);

        this.transformation = Transform3D.createCameraTransform(this.position, direction, cameraUp);
        return this.transformation;
    }

    isOrthonormal() {
        return this.v.length() === 1 && this.w.length() === 1 && this.u.length() === 1;
    }
}
