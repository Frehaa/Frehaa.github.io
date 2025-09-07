class Face {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
}

// Parse wavefront data to flat arrays ready for submitting to a WebGL buffer
function parseWavefrontStringToFlatArrays(wavefrontString) {
    // For every line
    const lines = wavefrontString.split('\n');

    // What is a good data structure for this? 
    // Right now I just want to know the vertices and faces to figure out where lines are. 

    // The arrays contain a dummy element since the file is 1 indexed.
    const vertices = [0, 0, 0]; 
    const vertexNormals = [0, 0, 0];
    const vertexTextures = [null];
    const indices = [];

    for (const line of lines) {
        const tokens = line.split(' ');
        switch (tokens[0]) {
            case '#': {
                console.log('Comment: ', line);
            } break;
            case 'v': {
                const x = parseFloat(tokens[1]);
                const y = parseFloat(tokens[2]);
                const z = parseFloat(tokens[3]);
                vertices.push(x, y, z);
            } break;
            case 'vt': {
                // TODO: 
                vertexTextures.push('todo');
            } break;
            case 'vp': {
                console.log('Parameter space vertices', line);
            } break;
            case 'f': {
                // TODO: Handle texture and normal
                const a = tokens[1].split('/');
                const vertexAIndex = parseInt(a[0]);
                const av = vertices[vertexAIndex]

                const b = tokens[2].split('/');
                const vertexBIndex = parseInt(b[0]);
                const bv = vertices[vertexBIndex]

                const c = tokens[3].split('/');
                const vertexCIndex = parseInt(c[0]);
                const cv = vertices[vertexCIndex]
                if (!av || !bv || !cv) {
                    console.log('Something Wrong', line, av, bv, cv);
                    
                }
                indices.push(vertexAIndex, vertexBIndex, vertexCIndex);
            } break;
            case 'l': {
                console.log('Line elements', line);
            } break;
            case 'vn': {
                vertexNormals.push('todo');
            } break;
            case 'mtllib': {
                console.log('Material file', line);
            } break;
            case 'usemtl': {
                console.log('Use Material', line);
            } break;
            case 's': {
                console.log('Smoothing Group', line);
            } break;
            case 'o': {
                console.log('Object:', line)
            } break;
            case 'g': {
                console.log('Group:', line)
            } break;
            default: {
                console.log("Don't know", line);
            } break;
        }
    }
    return [vertices, indices];
}

function parseWavefrontStringToVec4Arrays(wavefrontString) {
    // For every line
    const lines = wavefrontString.split('\n');

    // What is a good data structure for this? 
    // Right now I just want to know the vertices and faces to figure out where lines are. 

    // The arrays contain a dummy element since the file is 1 indexed.
    const vertices = [null]; 
    const vertexNormals = [null];
    const vertexTextures = [null];
    const faces = [];

    for (const line of lines) {
        const tokens = line.split(' ');
        switch (tokens[0]) {
            case '#': {
                console.log('Comment: ', line);
            } break;
            case 'v': {
                const x = parseFloat(tokens[1]);
                const y = parseFloat(tokens[2]);
                const z = parseFloat(tokens[3]);
                vertices.push(new Vec4(x, y, z, 1));
            } break;
            case 'vt': {
                // TODO: 
                vertexTextures.push('todo');
            } break;
            case 'vp': {
                console.log('Parameter space vertices', line);
            } break;
            case 'f': {
                // TODO: Handle texture and normal
                const a = tokens[1].split('/');
                const ia = parseInt(a[0]);
                const av = vertices[ia]

                const b = tokens[2].split('/');
                const ib = parseInt(b[0]);
                const bv = vertices[ib]

                const c = tokens[3].split('/');
                const ic = parseInt(c[0]);
                const cv = vertices[ic]
                if (!av || !bv || !cv) {
                    console.log('Something Wrong', line, av, bv, cv);
                    
                }
                faces.push(new Face(ia, ib, ic));
            } break;
            case 'l': {
                console.log('Line elements', line);
            } break;
            case 'vn': {
                vertexNormals.push('todo');
            } break;
            case 'mtllib': {
                console.log('Material file', line);
            } break;
            case 'usemtl': {
                console.log('Use Material', line);
            } break;
            case 's': {
                console.log('Smoothing Group', line);
            } break;
            case 'o': {
                console.log('Object:', line)
            } break;
            case 'g': {
                console.log('Group:', line)
            } break;
            default: {
                console.log("Don't know", line);
            } break;
        }
    }
    return [vertices, faces];
}