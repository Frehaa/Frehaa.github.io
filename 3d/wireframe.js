function drawDefaultWireframeScene() {
    // So say we have a box inside the canonical box thingy
    // This means all its points are in the interval [-1, 1] on the x, y, and z axis
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // X, Y, Z
    // X jjjjjj

    const box = [
        new Vec4(0, 0, 0, 1),
        new Vec4(1, 0, 0, 1),
        new Vec4(1, 0, 1, 1),
        new Vec4(0, 0, 1, 1),
        new Vec4(0, 1, 0, 1),
        new Vec4(1, 1, 0, 1),
        new Vec4(1, 1, 1, 1),
        new Vec4(0, 1, 1, 1),
    ];


    // const box = [
    //     new Vec4(-0.75, -0.75, -0.75, 1),
    //     new Vec4(0.75, -0.75, -0.75, 1),
    //     new Vec4(0.75, 0.75, -0.75, 1),
    //     new Vec4(-0.75, 0.75, -0.75, 1),
    //     new Vec4(-0.75, -0.75, 0.75, 1),
    //     new Vec4(0.75, -0.75, 0.75, 1),
    //     new Vec4(0.75, 0.75, 0.75, 1),
    //     new Vec4(-0.75, 0.75, 0.75, 1),
    // ];

    // const box = [
    //     new Vec4(-0.75, -0.75, -0.75, 1),
    //     new Vec4(0.75, -0.75, -0.75, 1),
    //     new Vec4(0.85, 0.75, -0.65, 1),
    //     new Vec4(-0.65, 0.75, -0.65, 1),
    //     new Vec4(-0.75, -0.75, 0.75, 1),
    //     new Vec4(0.75, -0.75, 0.75, 1),
    //     new Vec4(0.85, 0.75, 0.85, 1),
    //     new Vec4(-0.65, 0.75, 0.85, 1),
    // ];


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

    const scale = Matrix.fromArray([
            [1.1,   0,   0, 0],
            [  0, 1.1,   0, 0],
            [  0,   0, 1.1, 0],
            [  0,   0,   0, 1],
        ]);
    const translate = Matrix.fromArray([
            [1, 0, 0, -0.5],
            [0, 1, 0, -0.5],
            [0, 0, 1, -0.5],
            [0, 0, 0,     1],
        ]);




    const nx = canvas.width;
    const ny = canvas.height;

    const viewportTransformation = Matrix.fromArray([
        [nx/2,    0,    0, (nx - 1)/2],
        [   0,    0, -ny/2, (ny - 1)/2], 
        [   0, 0,       0,          0],
        [   0,    0,    0,          1]
    ]);


    // const transformation = rotateZ.mult(rotateX).mult(rotateY).mult(viewportTransformation);
    const transformation = viewportTransformation.mult(translate).mult(scale).mult(rotateX).mult(rotateY).mult(rotateZ);
    // Theory: This applies the transformations in the order from right to left. So we rotate, scale, translate, and the transform to the viewport

    
    const transformedBox = [];

    for (let i = 0; i < box.length; i++) {
        const point = box[i];
        const transformedPoint = transformation.transformVec4(point);

        // For some reason it does not work to multiply all the transformations together with the viewport transformation into one big transformation
        // Never mind. It does work, but it has to be the outer transformation, not the inner one. Which I think makes sense.
        const viewpointPoint = viewportTransformation.transformVec4(transformedPoint)
        l(point, transformedPoint, viewpointPoint)

        transformedBox.push(transformedPoint);
    }


    drawBox(ctx, transformedBox);

}

function wireframeMain() {
    drawDefaultWireframeScene();
}



function drawBox(ctx, box) {
    //  0 - 1
    ctx.moveTo(box[0].x, box[0].y)
    ctx.lineTo(box[1].x, box[1].y)
    //  1 - 2
    ctx.lineTo(box[2].x, box[2].y)
    //  2 - 3
    ctx.lineTo(box[3].x, box[3].y)
    //  3 - 0
    ctx.lineTo(box[0].x, box[0].y)
    //  0 - 4
    ctx.lineTo(box[4].x, box[4].y)
    //  4 - 5
    ctx.lineTo(box[5].x, box[5].y)
    //  5 - 6
    ctx.lineTo(box[6].x, box[6].y)
    //  6 - 7
    ctx.lineTo(box[7].x, box[7].y)
    //  7 - 4
    ctx.lineTo(box[4].x, box[4].y)
    //  1 - 5
    ctx.moveTo(box[1].x, box[1].y)
    ctx.lineTo(box[5].x, box[5].y)
    //  2 - 6
    ctx.moveTo(box[2].x, box[2].y)
    ctx.lineTo(box[6].x, box[6].y)
    //  3 - 7
    ctx.moveTo(box[3].x, box[3].y)
    ctx.lineTo(box[7].x, box[7].y)
    

    ctx.stroke();



}