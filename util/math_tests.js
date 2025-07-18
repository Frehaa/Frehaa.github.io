function run_math_tests() {
    const tests = [
        test_rotation_does_not_move_0_0_0,
        test_x_rotation_does_not_move_1_0_0,
        test_90_degree_z_rotation_moves_1_0_0_to_0_1_0,
        test_90_degree_y_rotation_moves_1_0_0_to_0_0_1,
        test_y_rotations_does_not_move_0_1_0,
        test_90_degree_x_rotation_moves_0_1_0_to_0_0_1,
        test_90_degree_z_rotation_moves_0_1_0_to_neg1_0_0,
        test_z_rotations_does_not_move_0_0_1,
        test_90_degree_x_rotation_moves_0_0_1_to_0_neg1_0,
        test_90_degree_y_rotation_moves_0_0_1_to_1_0_0
    ]

    for (const test of tests) {
        try {
            test(); 
        } catch (error) {
            l(test.name ,error);
        }
    }
}

function test_rotation_does_not_move_0_0_0() {
    const c = Math.cos(0.4)
    const s = Math.sin(0.4)
    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 0, 0, 1);

    const resultX = rotateX.transformVec4(point);
    assert (resultX.x == 0 && resultX.y == 0 && resultX.z == 0 && resultX.r == 1, `Incorrect transformation: Expected (0, 0, 0, 1) but was (${resultX.x}, ${resultX.y}, ${resultX.z}, ${resultX.r})`);
    const resultY = rotateY.transformVec4(point);
    assert (resultY.x == 0 && resultY.y == 0 && resultY.z == 0 && resultY.r == 1, `Incorrect transformation: Expected (0, 0, 0, 1) but was (${resultY.x}, ${resultY.y}, ${resultY.z}, ${resultY.r})`);
    const resultZ = rotateZ.transformVec4(point);
    assert (resultZ.x == 0 && resultZ.y == 0 && resultZ.z == 0 && resultZ.r == 1, `Incorrect transformation: Expected (0, 0, 0, 1) but was (${resultZ.x}, ${resultZ.y}, ${resultZ.z}, ${resultZ.r})`);
}

function test_x_rotation_does_not_move_1_0_0() {
    const c = 0;
    const s = 1;

    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(1, 0, 0, 1);
    const result = rotateX.transformVec4(point);
    const expected = new Vec4(1, 0, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_90_degree_z_rotation_moves_1_0_0_to_0_1_0() {
    const c = 0;
    const s = 1;

    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(1, 0, 0, 1);
    const result = rotateZ.transformVec4(point);
    const expected = new Vec4(0, 1, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_90_degree_y_rotation_moves_1_0_0_to_0_0_1() {
    const c = 0;
    const s = 1;

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const point = new Vec4(1, 0, 0, 1);
    const result = rotateY.transformVec4(point);
    const expected = new Vec4(0, 0, -1, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_y_rotations_does_not_move_0_1_0() {
    const c = 0;
    const s = 1;

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const point = new Vec4(0, 1, 0, 1);
    const result = rotateY.transformVec4(point);
    const expected = new Vec4(0, 1, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_90_degree_x_rotation_moves_0_1_0_to_0_0_1() {
    const c = 0;
    const s = 1;

    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 1, 0, 1);
    const result = rotateX.transformVec4(point);
    const expected = new Vec4(0, 0, 1, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}
function test_90_degree_z_rotation_moves_0_1_0_to_neg1_0_0() {
    const c = 0;
    const s = 1;

    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 1, 0, 1);
    const result = rotateZ.transformVec4(point);
    const expected = new Vec4(-1, 0, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}

function test_z_rotations_does_not_move_0_0_1() {
    const c = 0;
    const s = 1;

    const rotateZ = Matrix.fromArray([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 0, 1, 1);
    const result = rotateZ.transformVec4(point);
    const expected = new Vec4(0, 0, 1, 1);
    assert (result.equal(expected), `${this.name}, Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}
function test_90_degree_x_rotation_moves_0_0_1_to_0_neg1_0() {
    const c = 0;
    const s = 1;

    const rotateX = Matrix.fromArray([
            [1, 0, 0, 0],
            [0, c,-s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ]);

    const point = new Vec4(0, 0, 1, 1);
    const result = rotateX.transformVec4(point);
    const expected = new Vec4(0, -1, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}
function test_90_degree_y_rotation_moves_0_0_1_to_1_0_0() {
    const c = 0;
    const s = 1;

    const rotateY = Matrix.fromArray([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s,0, c, 0],
            [0, 0, 0, 1],
        ]);
    const point = new Vec4(0, 0, 1, 1);
    const result = rotateY.transformVec4(point);
    const expected = new Vec4(1, 0, 0, 1);
    assert (result.equal(expected), `Incorrect transformation: Expected ${expected.toString()} but was ${result.toString()}`);
}