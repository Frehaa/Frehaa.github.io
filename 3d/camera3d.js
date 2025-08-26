// Literature uses v for up, w for negative direction, and u for right
class Camera3D {
    // Creates a new camera with position at origin and direction in the -z direction
    constructor(worldUp) {
        this.position = new Vec4(0, 0, 0, 1);
        this.direction = new Vec4(0, 0, -1, 0);
        this.worldUp = worldUp;
        this.right = new Vec4(1, 0, 0, 0);

        this.yawRadians = 0;
        this.rollRadians = 0;
        this.pitchRadians = 0

        this.transformation = null;
    }

    turnHorizontal(radians) {
        this.yawRadians += radians;
        this.transformation = null;
    }

    turnVertical(radians) {
        this.pitchRadians += radians;
        this.transformation = null;
    }

    lean(radians) {
        this.rollRadians += radians;
        this.transformation = null;
    }

    move(delta) {
        this.position = this.position.add(delta);
        this.transformation = null;
    }

    setPosition(newPosition) {
        this.position = newPosition;
        this.transformation = null;
    }

    // TODO?: Have a class for handling transformations (e.g. a wrapper for a matrix)? 
    getTransformation() {
        // We only recompute if we need to
        if (this.transformation !== null) { return this.transformation; } 

        const cameraPosition = new Vec3(this.position.x, this.position.y, this.position.z);
        const cameraDirection = new Vec3(this.direction.x, this.direction.y, this.direction.z);
        const cameraUp = new Vec3(this.worldUp.x, this.worldUp.y, this.worldUp.z);

        this.transformation = Transform3D.createCameraTransform(cameraPosition, cameraDirection, cameraUp);
        return this.transformation;

        const cameraBasisW = cameraDirection.scale(-1).normalize();
        const cameraBasisU = cameraUp.cross(cameraBasisW).normalize();
        const cameraBasisV = cameraBasisW.cross(cameraBasisU).normalize();
        this.transformation = Matrix.fromArray([
            [cameraBasisU.x, cameraBasisU.y, cameraBasisU.z, 0],
            [cameraBasisV.x, cameraBasisV.y, cameraBasisV.z, 0], 
            [cameraBasisW.x, cameraBasisW.y, cameraBasisW.z, 0],
            [0,                           0,              0, 1]
        ]).mult(Matrix.fromArray([
            [1, 0, 0, -cameraPosition.x],
            [0, 1, 0, -cameraPosition.y],
            [0, 0, 1, -cameraPosition.z],
            [0, 0, 0,                 1],
        ])); 

        return this.transformation;
    }

    isOrthonormal() {
        return this.v.length() === 1 && this.w.length() === 1 && this.u.length() === 1;
    }
}
