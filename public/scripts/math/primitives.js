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