// Literature uses v for up, w for negative direction, and u for right
class Camera3D {
    constructor(worldUp) {
        this.position = new Vec4(0, 0, 0, 1);
        this.direction = new Vec4(0, 0, -1, 0);
        this.worldUp = worldUp;
        this.right = new Vec4(1, 0, 0, 0);

        this.yawRadians = 0;
        this.rollRadians = 0;
        this.pitchRadians = 0

        this.transformationMatrix = null;
    }

    turnHorizontal(radians) {
        this.yawRadians += radians;
        this.transformationMatrix = null;
    }

    turnVertical(radians) {
        this.pitchRadians += radians;
        this.transformationMatrix = null;
    }

    lean(radians) {
        this.rollRadians += radians;
        this.transformationMatrix = null;
    }

    move(delta) {
        this.position = this.position.add(delta);
        this.transformationMatrix = null;
    }

    setPosition(newPosition) {
        this.position = newPosition;
        this.transformationMatrix = null;
    }

    // TODO?: Have a class for handling transformations (e.g. a wrapper for a matrix)? 
    getTransformation() {
        // We only recompute if we need to
        if (this.transformationMatrix !== null) { return this.transformationMatrix; } 

        const cameraPosition = new Vec3(this.position.x, this.position.y, this.position.z);

        const cameraDirection = new Vec3(this.direction.x, this.direction.y, this.direction.z);

        const cameraUp = new Vec3(this.worldUp.x, this.worldUp.y, this.worldUp.z);

        const cameraBasisW = cameraDirection.scale(-1).normalize();
        const cameraBasisU = cameraUp.cross(cameraBasisW).normalize();
        const cameraBasisV = cameraBasisW.cross(cameraBasisU).normalize();

        this.transformationMatrix = Matrix.fromArray([
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

        return this.transformationMatrix;
    }

    isOrthonormal() {
        return this.v.length() === 1 && this.w.length() === 1 && this.u.length() === 1;
    }
}
