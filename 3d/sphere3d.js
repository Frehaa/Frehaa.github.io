class Sphere3D {
    constructor(bandCount, stripeCount, radius = 0.5) {
        assert(bandCount > 1 && stripeCount > 1, `bandCount (${bandCount}) or stripeCount (${stripeCount}) is too low. Should be at least 2`);

        this.triangleCount = 0;
        this.vertices = [];
        this.extraVertices = [];
        this.normals = [];
        this.indices = [];
        this.extraIndices = [];
        this.colors = [];
        this.addVertex(0, 0.5, 0);

        const singleBandAngle = Math.PI / bandCount;

        for (let i = 1; i < bandCount; i++) {
            const phi = 0.5 * Math.PI - i * singleBandAngle;
            const y = Math.sin(phi) * radius;
            const r = Math.cos(phi) * radius;
            for (let j = 0; j < stripeCount; j++) {
                const theta = j * 2 * Math.PI / stripeCount;
                const x = Math.sin(theta) * r;
                const z = Math.cos(theta) * r;
                this.addVertex(x, y, z); 
            }
        }

        this.addVertex(0, -0.5, 0);

        // This is anti-clockwise
        // TOP
        const topVertexIndex = 0;
        for (let i = 0; i < stripeCount; i++) {
            const topBandVertexAIndex = 1 + i;
            const topBandVertexBIndex = (1 + i) % stripeCount + 1;
            this.addTriangle(topVertexIndex, topBandVertexAIndex, topBandVertexBIndex);
        }

        // MIDDLE
        let upperBandStartVertexIndex = 1;
        for (let i = 0; i < bandCount - 2; i++) {
            for (let j = 0; j < stripeCount; j++) {
                const upperBandVertexA = upperBandStartVertexIndex + j;
                const upperBandVertexB = upperBandStartVertexIndex + (j + 1) % stripeCount;
                const lowerBandVertexA = upperBandVertexA + stripeCount;
                const lowerBandVertexB = upperBandVertexB + stripeCount;
                this.addTriangle(upperBandVertexA, lowerBandVertexA, upperBandVertexB);
                this.addTriangle(lowerBandVertexA, lowerBandVertexB, upperBandVertexB);
            }
            upperBandStartVertexIndex = upperBandStartVertexIndex + stripeCount;
        }

        // BOTTOM
        const bottomVertexIndex = stripeCount * (bandCount - 1) + 1;
        for (let i = 0; i < stripeCount; i++) {
            const bottomBandVertexAIndex = bottomVertexIndex - stripeCount + i;
            const bottomBandVertexBIndex = bottomVertexIndex - stripeCount + (1 + i) % stripeCount;
            this.addTriangle(bottomBandVertexAIndex, bottomBandVertexBIndex, bottomVertexIndex);
        }
    
        this.vertices = this.extraVertices;
        this.indices = this.extraIndices;
    }

    addVertex(x, y, z) {
        this.vertices.push(x);
        this.vertices.push(y);
        this.vertices.push(z);

        const length = Math.sqrt(x*x + y*y + z*z);
        const normalX = x / length;
        const normalY = y / length;
        const normalZ = z / length;


        // const v = new Vec3(normalX, normalY, normalZ);
        // console.log(v.length());
        

        // this.normals.push(normalX);
        // this.normals.push(normalY);
        // this.normals.push(normalZ);

        // TODO?: If I already know that the radius is 0.5, then the length should be 0.5, so I should just be able to multiply by 2 everywhere instead of computing length and dividin by it.
        // this.normals.push(x * 2);
        // this.normals.push(y * 2);
        // this.normals.push(z * 2);
    }

    addTriangle(a, b, c) {
        // console.log('Add Triangle', a, b, c)
        this.indices.push(a);
        this.indices.push(b);
        this.indices.push(c);

        const vertexAIdx = 3 * a;
        this.extraVertices.push(this.vertices[vertexAIdx]);
        this.extraVertices.push(this.vertices[vertexAIdx + 1]);
        this.extraVertices.push(this.vertices[vertexAIdx + 2]);
        this.normals.push(this.vertices[vertexAIdx] * 2)
        this.normals.push(this.vertices[vertexAIdx + 1] * 2)
        this.normals.push(this.vertices[vertexAIdx + 2] * 2)

        // assert(Math.abs(new Vec3(this.vertices[vertexAIdx] * 2, this.vertices[vertexAIdx + 1] * 2, this.vertices[vertexAIdx + 2] * 2).length() - 1) < 0.00001);
        

        const vertexBIdx = 3 * b;
        this.extraVertices.push(this.vertices[vertexBIdx]);
        this.extraVertices.push(this.vertices[vertexBIdx + 1]);
        this.extraVertices.push(this.vertices[vertexBIdx + 2]);
        this.normals.push(this.vertices[vertexBIdx] * 2)
        this.normals.push(this.vertices[vertexBIdx + 1] * 2)
        this.normals.push(this.vertices[vertexBIdx + 2] * 2)

        // assert(Math.abs(new Vec3(this.vertices[vertexBIdx] * 2, this.vertices[vertexBIdx + 1] * 2, this.vertices[vertexBIdx + 2] * 2).length() - 1) < 0.00001);

        const vertexCIdx = 3 * c;
        this.extraVertices.push(this.vertices[vertexCIdx]);
        this.extraVertices.push(this.vertices[vertexCIdx + 1]);
        this.extraVertices.push(this.vertices[vertexCIdx + 2]);
        this.normals.push(this.vertices[vertexCIdx] * 2)
        this.normals.push(this.vertices[vertexCIdx + 1] * 2)
        this.normals.push(this.vertices[vertexCIdx + 2] * 2)

        // assert(Math.abs(new Vec3(this.vertices[vertexCIdx] * 2, this.vertices[vertexCIdx + 1] * 2, this.vertices[vertexCIdx + 2] * 2).length() - 1) < 0.00001);

        this.extraIndices.push(this.triangleCount);
        this.triangleCount++;
        this.extraIndices.push(this.triangleCount);
        this.triangleCount++;
        this.extraIndices.push(this.triangleCount);
        this.triangleCount++;

        // if (this.vertices[vertexAIdx+2] > 0.0) {
        //     this.colors.push(1);
        //     this.colors.push(0);
        //     this.colors.push(0);
        //     this.colors.push(1.0);
        // } else {
        //     this.colors.push(0);
        //     this.colors.push(0);
        //     this.colors.push(1);
        //     this.colors.push(1.0);
        // }
        // if (this.vertices[vertexBIdx+2] > 0.0) {
        //     this.colors.push(1);
        //     this.colors.push(0);
        //     this.colors.push(0);
        //     this.colors.push(1.0);
        // } else {
        //     this.colors.push(0);
        //     this.colors.push(0);
        //     this.colors.push(1);
        //     this.colors.push(1.0);
        // }        
        // if (this.vertices[vertexCIdx+2] > 0.0) {
        //     this.colors.push(1);
        //     this.colors.push(0);
        //     this.colors.push(0);
        //     this.colors.push(1.0);
        // } else {
        //     this.colors.push(0);
        //     this.colors.push(0);
        //     this.colors.push(1);
        //     this.colors.push(1.0);
        // }


            // For now, each triangle gets a random color
            const red = Math.random();
            const green = Math.random();
            const blue = Math.random();

            this.colors.push(red);
            this.colors.push(green);
            this.colors.push(blue);
            this.colors.push(1.0);

            this.colors.push(red);
            this.colors.push(green);
            this.colors.push(blue);
            this.colors.push(1.0);

            this.colors.push(red);
            this.colors.push(green);
            this.colors.push(blue);
            this.colors.push(1.0);
    }

    // This is the problem when trying to color the tryingles differently but
    // reusing the vertices. I cannot seem to give each triangle a unique color
    // because the 


}