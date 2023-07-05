function clamp(v, min, max) {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
}


function lerp(v0, v1, t) {
  return v0 + t * (v1 - v0);
}

// Fisher-yates shuffle (Based on stack overflow answer)
function shuffle(array) {
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
  constructor(a, b, c) {
    this[0] = a;
    this[1] = b;
    this[2] = c;
  }

  add(b) {
    return new Vec3(this[0] + b[0], this[1] + b[1], this[2] + b[2]);
  }

  subtract(b) {
    return new Vec3(this[0] - b[0], this[1] - b[1], this[2] - b[2]);
  }

  dot(b) {
    return this[0] * b[0] + this[1] * b[1] + this[2] * b[2];
  }

  scale(s) {
    return new Vec3(s * this[0], s * this[1], s * this[2]);
  }

  normalize() {
    return new Vec3(0,0,0);
  }
}

function solveQuadraticEquation(a, b, c) {
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