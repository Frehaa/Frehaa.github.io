// Does this class make sense? It is just a wrapper which exposes some useful helper functions that I already have, but then it adds an extra cost to using transformations.
// I guess if performance is important then I can change the implementation to do the matrix stuff here instead. Maybe even do improvements to avoid unnecessary calculations.
class Transformation3D {
    constructor(matrix4x4) {
        this.matrix = matrix4x4;
    }

    static translate(x, y, z) {
        const matrix = Matrix.fromArray([
            [1, 0, 0, x],
            [0, 1, 0, y],
            [0, 0, 1, z],
            [0, 0, 0, 1],
        ]);
        return new Transformation3D(matrix);
    }

    static scale(x, y, z) {
        const matrix = Matrix.fromArray([
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1],
        ]);
        return new Transformation3D(matrix);
    }
    
    static rotateX(radians) {
        const c = Math.cos(radians)
        const s = Math.sin(radians)

        const matrix = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);
        return new Transformation3D(matrix);
    }

    static rotateY(radians) {
        const c = Math.cos(radians)
        const s = Math.sin(radians)
        const matrix = Matrix.fromArray([
                [c, 0, s, 0],
                [0, 1, 0, 0],
                [-s,0, c, 0],
                [0, 0, 0, 1],
            ]);
        return new Transformation3D(matrix);
    }

    static rotateZ(radians) {
        const c = Math.cos(radians)
        const s = Math.sin(radians)
        const matrix = Matrix.fromArray([
                [c, -s, 0, 0],
                [s, c, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ]);
        return new Transformation3D(matrix);
    }

    then(transformation) {
        const newTransformation = new Transformation3D(transformation.matrix.mult(this.matrix));
        return newTransformation; 
    }
}