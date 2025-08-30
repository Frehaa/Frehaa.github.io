// We want to create matrices and multiply them together, but we want to do it
// in a way which reuses as much memory as possible to avoid creating a lot of
// objects which are later deleted.

// This to me suggests having a static array which can be used for the computations. 

// How should the thing work? 
// Something like this?
// const modelTransformation = rotateX(30).rotateY(20).rotateZ(10).translate(10, 20, -10).scale(2, 2, 2)
// How does the matrix math work here? 
// We have 5 different matrices
// Rx Ry Rz T S
// We need to multiply them as follows
// S T Rz Ry RX I 
// So the first matrix can be a simple instantiation
//  1  0  0  0
//  0  c -s  0
//  0  s  c  0
//  0  0  0  1


// Then we want to multiply with 
//  c  0  s  0
//  0  1  0  0
// -s  s  c  0
//  0  0  0  1


// Matrix mult takes row on the left and column on the right. So we get
// 1 * c + 0 * -s    for the top left element
// 


// Furthermore, we want to give the values in column order, so starting top-left we go down instead of right. 

// How can I make this efficient? 

// Should I just always compue the inverse along with the normal transform? 
// It seems very expensive to compute the inverse directly, but maybe not 




// Can we make this matrix work like it was a float 32 array? Is that sensible? What if we want to use a Float16Array instead at some point?


class Transform3D {
    constructor() {
        this._inverse = null;
        this.length = 16;
        this.floatArray = new Float32Array(this.length);
    }
    toFloat32Array() { // This float array is reused between frames. So make sure to copy it if you want to use it between multiple calls.  
        for (let i = 0; i < this.length; i++) {
            this.floatArray[i] = this[i];
        }
        return this.floatArray;
    }
    static _createIdentity() {
        const result = new Transform3D();
        result[0] = 1;
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = 1;
        result[6] = 0;
        result[7] = 0;

        result[8] = 0;
        result[9] = 0;
        result[10] = 1;
        result[11] = 0;

        result[12] = 0;
        result[13] = 0;
        result[14] = 0;
        result[15] = 1;
        return result;
    }
    static createIdentity() {
        const result = Transform3D._createIdentity();
        result._inverse = Transform3D._createIdentity();
        result._inverse._inverse = result;
        return result;
    }
    reset() {
        this[0] = 1;
        this[1] = 0;
        this[2] = 0;
        this[3] = 0;

        this[4] = 0;
        this[5] = 1;
        this[6] = 0;
        this[7] = 0;

        this[8] = 0;
        this[9] = 0;
        this[10] = 1;
        this[11] = 0;

        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;

        this._inverse[0] = 1;
        this._inverse[1] = 0;
        this._inverse[2] = 0;
        this._inverse[3] = 0;

        this._inverse[4] = 0;
        this._inverse[5] = 1;
        this._inverse[6] = 0;
        this._inverse[7] = 0;

        this._inverse[8] = 0;
        this._inverse[9] = 0;
        this._inverse[10] = 1;
        this._inverse[11] = 0;

        this._inverse[12] = 0;
        this._inverse[13] = 0;
        this._inverse[14] = 0;
        this._inverse[15] = 1;
        return this;
    }
    static _createRotateX(cos, sin) {
        const result = new Transform3D();
        result[0] = 1;
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = cos;
        result[6] = sin;
        result[7] = 0;

        result[8] = 0;
        result[9] = -sin;
        result[10] = cos;
        result[11] = 0;

        result[12] = 0;
        result[13] = 0;
        result[14] = 0;
        result[15] = 1;
        return result;
    }
    static createRotateX(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        const result = Transform3D._createRotateX(c, s);
        result._inverse = Transform3D._createRotateX(c, -s);
        result._inverse._inverse = result;
        return result;
    }
// function rotateXMatrix(rad) {
//     let c = Math.cos(rad);
//     let s = Math.sin(rad);
//     return Matrix.fromArray([
//         [1, 0, 0, 0],    [a, b, c, d]
//         [0, c,-s, 0],    [e, f, g, h]
//         [0, s, c, 0],    [i, j, k, l]
//         [0, 0, 0, 1],    [m, n, o, p]
//     ]);
// }
    _rotateX(cos, sin) {
        let tmp = this[1] * cos - this[2] * sin;
        this[2] = this[1] * sin + this[2] * cos; 
        this[1] = tmp;

        tmp = this[5] * cos - this[6] * sin;
        this[6] = this[5] * sin + this[6] * cos
        this[5] = tmp;

        tmp = this[9] * cos - this[10] * sin,
        this[10] = this[9] * sin + this[10] * cos;
        this[9] = tmp;

        tmp = this[13] * cos - this[14] * sin,
        this[14] = this[13] * sin + this[14] * cos;
        this[13] = tmp;
    }
    rotateX(radians) {
        let c = Math.cos(radians);
        let s = Math.sin(radians);
        this._rotateX(c, s);
        this._inverse._rotateX(c, -s);
        return this;
    }
    static _createRotateY(cos, sin) {
        const result = new Transform3D();
        result[0] = cos;
        result[1] = 0;
        result[2] = -sin;
        result[3] = 0;

        result[4] = 0;
        result[5] = 1;
        result[6] = 0;
        result[7] = 0;

        result[8] = sin;
        result[9] = 0;
        result[10] = cos;
        result[11] = 0;

        result[12] = 0;
        result[13] = 0;
        result[14] = 0;
        result[15] = 1;
        return result;
    }
    static createRotateY(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        const result = Transform3D._createRotateY(c, s);
        result._inverse = Transform3D._createRotateY(c, -s);
        result._inverse._inverse = result;
        return result;
    }
// function rotateYMatrix(rad) {
//     let c = Math.cos(rad);
//     let s = Math.sin(rad);
//     return Matrix.fromArray([
//         [c, 0, s, 0],    a  b  c  d
//         [0, 1, 0, 0],    e  f  g  h
//         [-s,0, c, 0],    i  j  k  l
//         [0, 0, 0, 1],    m  n  o  p
//     ]);
// }
    _rotateY(cos, sin) {
        let tmp = this[0] * cos + this[2] * sin;
        this[2] = this[2] * cos - this[0] * sin
        this[0] = tmp;

        tmp = this[4] * cos + this[6] * sin;
        this[6] = this[6] * cos - this[4] * sin;
        this[4] = tmp;

        tmp = this[8] * cos + this[10] * sin;
        this[10] = this[10] * cos - this[8] * sin;
        this[8] = tmp;

        tmp = this[12] * cos + this[14] * sin;
        this[14] = this[14] * cos - this[12] * sin;
        this[12] = tmp;
    }
    rotateY(radians) {
        let c = Math.cos(radians);
        let s = Math.sin(radians);
        this._rotateY(c, s);
        this._inverse._rotateY(c, -s);
        return this;
    }
    static _createRotateZ(cos, sin) {
        const result = new Transform3D();
        result[0] = cos;
        result[1] = sin;
        result[2] = 0;
        result[3] = 0;

        result[4] = -sin;
        result[5] = cos;
        result[6] = 0;
        result[7] = 0;

        result[8] = 0;
        result[9] = 0;
        result[10] = 1;
        result[11] = 0;

        result[12] = 0;
        result[13] = 0;
        result[14] = 0;
        result[15] = 1;
        return result;
    }
    static createRotateZ(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        const result = Transform3D._createRotateZ(c, s);
        result._inverse = Transform3D._createRotateZ(c, -s);
        result._inverse._inverse = result;
        return result;
    }
// function rotateZMatrix(rad) {
//     let c = Math.cos(rad);
//     let s = Math.sin(rad);
//     return Matrix.fromArray([
//         [c, -s, 0, 0],   a b c d
//         [s, c, 0, 0],    e f g h
//         [0, 0, 1, 0],    i j k l
//         [0, 0, 0, 1],    m n o p
//     ]);
    _rotateZ(cos, sin) {
        let tmp = this[0] * cos - this[1] * sin;
        this[1] = this[0] * sin + this[1] * cos;
        this[0] = tmp;

        tmp = this[4] * cos - this[5] * sin;
        this[5] = this[4] * sin + this[5] * cos;
        this[4] = tmp;

        tmp = this[8] * cos - this[9] * sin;
        this[9] = this[8] * sin + this[9] * cos;
        this[8] = tmp;

        tmp = this[12] * cos - this[13] * sin;
        this[13] = this[12] * sin + this[13] * cos;
        this[12] = tmp;
    }
    rotateZ(radians) {
        let c = Math.cos(radians);
        let s = Math.sin(radians);
        this._rotateZ(c, s);
        this._inverse._rotateZ(c, -s);
        return this;
    }
    static _createTranslate(deltaX, deltaY, deltaZ) {
        const result = new Transform3D();
        result[0] = 1;
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = 1;
        result[6] = 0;
        result[7] = 0;

        result[8] = 0;
        result[9] = 0;
        result[10] = 1;
        result[11] = 0;

        result[12] = deltaX;
        result[13] = deltaY;
        result[14] = deltaZ;
        result[15] = 1;
        return result;
    }
    static createTranslate(deltaX = 0, deltaY = 0, deltaZ = 0) {
        const result = Transform3D._createTranslate(deltaX, deltaY, deltaZ);
        result._inverse =  Transform3D._createTranslate(-deltaX, -deltaY, -deltaZ);
        result._inverse._inverse = result;
        return result;
    }
    translate(dx, dy, dz) {
        this._translate(dx, dy, dz);
        this._inverse._translate(-dx, -dy, -dz);
        return this;
    }
//         [1, 0, 0, x],    0  4  8  12
//         [0, 1, 0, y],    1  5  9  13
//         [0, 0, 1, z],    2  6  10 14
//         [0, 0, 0, 1],    3  7  11 15
    _translate(dx, dy, dz) {
        this[0] = this[0] + dx * this[3];
        this[4] = this[4] + dx * this[7];
        this[8] = this[8] + dx * this[11];
        this[12] = this[12] + dx * this[15];

        this[1] = this[1] + dy * this[3];
        this[5] = this[5] + dy * this[7];
        this[9] = this[9] + dy * this[11];
        this[13] = this[13] + dy * this[15];

        this[2] = this[2] + dz * this[3];
        this[6] = this[6] + dz * this[7];
        this[10] = this[10] + dz * this[11];
        this[14] = this[14] + dz * this[15];
    }
    static createScale(x, y, z) {
        if (y === undefined) {
            return Transform3D.createScale(x, x, x);
        }
        const result = Transform3D._createScale(x, y, z);
        result._inverse = Transform3D._createScale(1/x, 1/y, 1/z);
        result._inverse._inverse = result;
        return result;
    }
    static _createScale(x, y, z) {
        const result = new Transform3D();
        result[0] = x;
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = y;
        result[6] = 0;
        result[7] = 0;

        result[8] = 0;
        result[9] = 0;
        result[10] = z;
        result[11] = 0;

        result[12] = 0;
        result[13] = 0;
        result[14] = 0;
        result[15] = 1;
        return result;
    }
//         [x, 0, 0, 0],    a b c d       ax
//         [0, y, 0, 0],    e f g h
//         [0, 0, z, 0],    i j k l
//         [0, 0, 0, 1],    m n o p
    _scale(x, y, z) {
        this[0] = this[0] * x;
        this[4] = this[4] * x;
        this[8] = this[8] * x;
        this[12] = this[12] * x;

        this[1] = this[1] * y;
        this[5] = this[5] * y;
        this[9] = this[9] * y;
        this[13] = this[13] * y;

        this[2] = this[2] * z;
        this[6] = this[6] * z;
        this[10] = this[10] * z;
        this[14] = this[14] * z;
    }
    // Note to self. We scale before we translate. If we scale after then we also multiply the translation.
    scale(x, y, z) {
        if (y === undefined) {
            return this.scale(x, x, x);
        }
        this._scale(x, y, z);
        this._inverse._scale(1/x, 1/y, 1/z);
        return this;
    }
    static createCameraTransform(position, direction, worldUp) {
        const cameraBasisW = direction.scale(-1).normalize();
        const cameraBasisU = worldUp.cross(cameraBasisW).normalize();
        const cameraBasisV = cameraBasisW.cross(cameraBasisU).normalize();

        // this.transformationMatrix = Matrix.fromArray([
        //     [cameraBasisU.x, cameraBasisU.y, cameraBasisU.z, 0],
        //     [cameraBasisV.x, cameraBasisV.y, cameraBasisV.z, 0], 
        //     [cameraBasisW.x, cameraBasisW.y, cameraBasisW.z, 0],
        //     [0,                           0,              0, 1]
        // ]).mult(Matrix.fromArray([
        //     [1, 0, 0, -position.x],
        //     [0, 1, 0, -position.y],
        //     [0, 0, 1, -position.z],
        //     [0, 0, 0,           1],
        // ])); 

        // console.log(cameraBasisW, cameraBasisU, cameraBasisV);
        


        const cameraTransform = new Transform3D();
        cameraTransform[0] = cameraBasisU.x;
        cameraTransform[1] = cameraBasisV.x;
        cameraTransform[2] = cameraBasisW.x;
        cameraTransform[3] = 0;

        cameraTransform[4] = cameraBasisU.y;
        cameraTransform[5] = cameraBasisV.y;
        cameraTransform[6] = cameraBasisW.y;
        cameraTransform[7] = 0;

        cameraTransform[8] = cameraBasisU.z;
        cameraTransform[9] = cameraBasisV.z;
        cameraTransform[10] = cameraBasisW.z;
        cameraTransform[11] = 0;

        cameraTransform[12] = 0;
        cameraTransform[13] = 0;
        cameraTransform[14] = 0;
        cameraTransform[15] = 1;

        const result = Transform3D.createTranslate(-position.x, -position.y, -position.z)._then(cameraTransform);
        return result;
    }
    static createViewportTransform(widthInPixels, heightInPixels) {
        const result = new Transform3D();
        result[0] = widthInPixels / 2;
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;
        result[4] = 0;
        result[5] = heightInPixels / 2;
        result[6] = 0;
        result[7] = 0;
        result[8] = 0;
        result[9] = 0;
        result[10] = 0;
        result[11] = 0;
        result[12] = (widthInPixels - 1) / 2;
        result[13] = (heightInPixels - 1) / 2;
        result[14] = 0;
        result[15] = 0;

        // this._inverse = new Transform3D();
        // this._inverse[0] = 1 / (widthInPixels / 2);
        // this._inverse[1] = 0;
        // this._inverse[2] = 0;
        // this._inverse[3] = 0;
        // this._inverse[4] = 0;
        // this._inverse[5] = 1 / (heightInPixels / 2);
        // this._inverse[6] = 0;
        // this._inverse[7] = 0;
        // this._inverse[8] = 0;
        // this._inverse[9] = 0;
        // this._inverse[10] = 0;
        // this._inverse[11] = 0;
        // this._inverse[12] = -(widthInPixels - 1) / 2;
        // this._inverse[13] = -(heightInPixels - 1) / 2;
        // this._inverse[14] = 0;
        // this._inverse[15] = 1;
        return result;
    }
    static createOrthographicTransformFromFieldOfView(widthInPixels, heightInPixels, fieldOfViewTheta, depth) {
        // TODO
        throw new Error("Not Implemented.");
    } 
    static createOrthographicTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane) {
        const [l,r,t,b,n,f] = [leftPlane, rightPlane, topPlane, bottomPlane, nearPlane, farPlane];
        const result = new Transform3D();
        result[0] = 2 / (r - l);
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = 2 / (t - b);
        result[6] = 0;
        result[7] = 0;

        result[8] = 0;
        result[9] = 0;
        result[10] = 2 / (n - f);
        result[11] = 0;

        result[12] = -(r + l) / (r - l);
        result[13] = -(t + b) / (t - b);
        result[14] = -(n + f) / (n - f);
        result[15] = 1;
 
        return result;
    }
    static createPerspectiveTransformOpenGL(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane) {
        const [l,r,t,b,n,f] = [leftPlane, rightPlane, topPlane, bottomPlane, Math.abs(nearPlane), Math.abs(farPlane)];
        const result = new Transform3D();
        result[0] = (2*n) / (r - l);
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = (2*n) / (t - b);
        result[6] = 0;
        result[7] = 0;

        result[8] = (r + l)/ (r - l);
        result[9] = (t + b) / (t - b);
        result[10] = (n + f) / (n - f);
        result[11] = -1;

        result[12] = 0;
        result[13] = 0;
        result[14] = -(2 * f * n) / (n - f);
        result[15] = 0;
 
        return result;
    }
    static createPerspectiveTransform(leftPlane, rightPlane, bottomPlane, topPlane, nearPlane, farPlane) {
        const [l,r,t,b,n,f] = [leftPlane, rightPlane, topPlane, bottomPlane, nearPlane, farPlane];

        const result = new Transform3D();
        result[0] = (2*n) / (r - l);
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;

        result[4] = 0;
        result[5] = (2*n) / (t - b);
        result[6] = 0;
        result[7] = 0;

        result[8] = (l + r)/ (l - r);
        result[9] = (b + t) / (b - t);
        result[10] = (f + n) / (n - f);
        result[11] = 1;

        result[12] = 0;
        result[13] = 0;
        result[14] = (2 * f * n) / (f - n);
        result[15] = 0;
 
        return result;
    }
    _swap(a, b) {
        let tmp = this[a];
        this[a] = this[b];
        this[b] = tmp;
    }
    _transpose() {
        this._swap(1, 4);
        this._swap(2, 8);
        this._swap(3, 12);
        this._swap(6, 9);
        this._swap(7, 13);
        this._swap(11, 14);
    }
    transpose() {
        this._transpose();
        this._inverse._transpose();
        return this;
    }
    getInverse() {
        return this._inverse;
    }
//         [b, b, b, b],    0  4  8  12  
//         [b, b, b, b],    1  5  9  13
//         [b, b, b, b],    2  6  10 14
//         [b, b, b, b],    3  7  11 15
    _then(b) {
        for (let i = 0; i < 4; i++) {
            const tmp0 = this[4 * i];
            const tmp1 = this[4 * i + 1];
            const tmp2 = this[4 * i + 2];
            const tmp3 = this[4 * i + 3];

            this[4 * i]     = tmp0 * b[0] + tmp1 * b[4] + tmp2 * b[8] + tmp3 * b[12];
            this[4 * i + 1] = tmp0 * b[1] + tmp1 * b[5] + tmp2 * b[9] + tmp3 * b[13];
            this[4 * i + 2] = tmp0 * b[2] + tmp1 * b[6] + tmp2 * b[10] + tmp3 * b[14];
            this[4 * i + 3] = tmp0 * b[3] + tmp1 * b[7] + tmp2 * b[11] + tmp3 * b[15];
        }
        return this;
    }
    then(b) {
        this._then(b);
        this._inverse._then(b._inverse);
        return this;
    }
    transformVec4(b) {
        const x = this[0] * b[0] + this[4] * b[1] + this[8] * b[2] + this[12] * b[3];
        const y = this[1] * b[0] + this[5] * b[1] + this[9] * b[2] + this[13] * b[3];
        const z = this[2] * b[0] + this[6] * b[1] + this[10] * b[2] + this[14] * b[3];
        const w = this[3] * b[0] + this[7] * b[1] + this[11] * b[2] + this[15] * b[3];
        const result = new Vec4(x, y, z, w);
        return result;
    }
    copyTo(target){
        for (let i = 0; i < 16; i++) {
            target[i] = this[i];
            target._inverse[i] = this._inverse[i];
        }
        return target;
    }

}

function test_transform3d() {
    const tests = [
        test_transpose_transpose_is_self,
        test_transpose,
    ]

    for (const test of tests) {
        try {
            test(); 
        } catch (error) {
            l(test.name ,error);
        }
    }
}

function test_transpose_transpose_is_self() {
    const transform = new Transform3D();
    transform._inverse = new Transform3D();
    for (let i = 0; i < transform.length; i++) {
        transform[i] = i;
    }
    transform.transpose();
    transform.transpose();

    for (let i = 0; i < transform.length; i++) {
        assert(transform[i] == i)
    }
}

function test_transpose() {
    const transform = new Transform3D();
    transform._inverse = new Transform3D();
    for (let i = 0; i < transform.length; i++) {
        transform[i] = i;
    }
    transform.transpose();

    assert(transform[0] == 0);
    assert(transform[1] == 4);
    assert(transform[2] == 8);
    assert(transform[3] == 12);
    assert(transform[4] == 1);
    assert(transform[5] == 5);
    assert(transform[6] == 9);
    assert(transform[7] == 13);
    assert(transform[8] == 2);
    assert(transform[9] == 6);
    assert(transform[10] == 10);
    assert(transform[11] == 14);
    assert(transform[12] == 3);
    assert(transform[13] == 7);
    assert(transform[14] == 11);
    assert(transform[15] == 15);
}