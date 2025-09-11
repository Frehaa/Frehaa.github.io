class Box3D {
    constructor() {
        this.vertices = [
            // Back
            -0.5,  0.5, 0.5,    // Left top 
             0.5,  0.5, 0.5,    // right top
            -0.5, -0.5, 0.5,    // left bottom 
             0.5, -0.5, 0.5,    // Right bottom
            // Front
            -0.5,  0.5, -0.5,    // Left top 
             0.5,  0.5, -0.5,    // right top
            -0.5, -0.5, -0.5,    // left bottom 
             0.5, -0.5, -0.5,    // Right bottom
            // Left
            -0.5,  0.5, 0.5,    // top back 
            -0.5,  0.5, -0.5,   // top front 
            -0.5, -0.5, 0.5,    // bottom back 
            -0.5, -0.5, -0.5,   // bottom font 
            // Right
            0.5,  0.5,  0.5,    // top back 
            0.5,  0.5, -0.5,    // top front
            0.5, -0.5, 0.5,     // bottom back 
            0.5, -0.5,  -0.5,   // bottom font 
            // Top
            -0.5,  0.5, 0.5,    // Left back 
             0.5,  0.5, 0.5,    // right back
            -0.5,  0.5, -0.5,   // left front 
             0.5,  0.5, -0.5,   // Right front
            // Bottom
            -0.5, -0.5, 0.5,    // Left back 
             0.5, -0.5, 0.5,    // right back
            -0.5, -0.5, -0.5,   // left front 
             0.5, -0.5, -0.5,   // Right front
        ];
        // These normals point outside
        this.normals = [
            0, 0, 1, 
            0, 0, 1, 
            0, 0, 1, 
            0, 0, 1, 
            0, 0, -1, 
            0, 0, -1, 
            0, 0, -1, 
            0, 0, -1, 
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
        ];
        this.indices = [
            // Back
            0, 1, 2, 
            1, 3, 2,
            // Front
            4, 5, 6,
            5, 7, 6,
            // Left
            8, 9, 10,
            9, 11, 10,
            // Right
            12, 13, 14,
            13, 15, 14,
            // Top
            16, 17, 18,
            17, 19, 18,
            // Bottom
            20, 21, 22,
            21, 23, 22
        ];
        this.colors = [
            // Green Back
            0, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,
            // Yellow Front
            1, 1, 0, 1,
            1, 1, 0, 1,
            1, 1, 0, 1,
            1, 1, 0, 1,
            // Red Left
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,
            // Blue Right
            0, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,
            // Purple Top
            1, 0, 1, 1,
            1, 0, 1, 1,
            1, 0, 1, 1,
            1, 0, 1, 1,
            // Grey Bottom
            0.3, 0.3, 0.3, 1, 
            0.3, 0.3, 0.3, 1, 
            0.3, 0.3, 0.3, 1, 
            0.3, 0.3, 0.3, 1, 
        ];
    }
}

