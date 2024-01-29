function clamp(v/*:number\*/, min/*:number\*/, max/*:number\*/) {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
}


function lerp(v0/*:number\*/, v1/*:number\*/, t/*:number\*/) {
  return v0 + t * (v1 - v0);
}

// Fisher-yates shuffle (Based on stack overflow answer) 
// Shuffles in place
function shuffle(array/*: any[]*/) {
  let currentIndex = array.length

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    let tmp = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = tmp;
  }

  return array;
}

class Vec3 {
  // public [0]/*:number\*/;
  // public [1]/*:number\*/;
  // public [2]/*:number\*/;

  constructor(a/*:number\*/, b/*:number\*/, c/*:number\*/) {
    this[0] = a;
    this[1] = b;
    this[2] = c;
  }

  add(b/*:Vec3\*/) {
    return new Vec3(this[0] + b[0], this[1] + b[1], this[2] + b[2]);
  }

  subtract(b/*:Vec3\*/) {
    return new Vec3(this[0] - b[0], this[1] - b[1], this[2] - b[2]);
  }

  dot(b/*:Vec3\*/) {
    return this[0] * b[0] + this[1] * b[1] + this[2] * b[2];
  }

  scale(s/*:number\*/) {
    return new Vec3(s * this[0], s * this[1], s * this[2]);
  }

  normalize() {
    return new Vec3(0,0,0);
  }
}

function solveQuadraticEquation(a/*:number\*/, b/*:number\*/, c/*:number\*/) {
  const discriminant = b*b - 4*a*c
  if (discriminant < 0) {
    return [];
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const x1 = (-b + sqrtDiscriminant) / (2*a)
  if (discriminant == 0) {
    return [x1];
  } 

  const x2 = (-b - sqrtDiscriminant) / (2*a)
  return [x1, x2];
}

function solveLinearEquations(matrix, vector) {
  // TODO: Generalize
  // const m = matrix.height;
  // const n = matrix.width;
  // if (vector.dimensions !== n) throw new Error("Invalid input");


  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][0];
  const d = matrix[1][1];

  // Assuming 2x2 matrix and 2d vector

  // Add 1 row vector to the other until one variable is removed. (if both are removed then an infinite number of solutions exists)
}

function pointToBarycentric(point, triangle) { 
    const [xa, ya, xb, yb, xc, yc] = triangle;
    const [x, y] = point;

    const bn = (ya - yc) * x + (xc - xa) * y + xa * yc - xc * ya;
    const bd = (ya - yc) * xb + (xc - xa) * yb + xa * yc - xc * ya;
    const beta = bn/bd;
    const gn = (ya - yb) * x + (xb - xa) * y + xa * yb - xb * ya;
    const gd = (ya - yb)*xc + (xb - xa) * yc + xa * yb - xb * ya;
    const gamma = gn/gd;
    const alpha = 1 - beta - gamma;
    return [alpha, beta, gamma]
}