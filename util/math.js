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

function radiansToDegrees(radians) {
  return radians * 180/Math.PI;
}

function degreesToRadians(degrees) {
  return degrees/180 * Math.PI;
}

class Vec2 {
    constructor(x, y) {
        this.size = 2;
        this[0] = x;
        this[1] = y;
        this.x = x;
        this.y = y;
    }
    add(b) {
        return new Vec2(this.x + b.x, this.y + b.y);
    }
    subtract(b) {
        return new Vec2(this.x - b.x, this.y - b.y);
    }
    scale(s) {
        return new Vec2(s * this.x, s * this.y);
    }
    dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    perp_dot(b) {
      return -this.y * b.x + this.x * b.y;
    }
    perp_scale(s) {
      return new Vec2(s * -this.y, s * this.x);
    }
    lerp(b, t) {
      // a + t * (b - a)
      return this.add(b.subtract(this).scale(t));
    }
    det(b) {
        return this.x*b.y - this.y*b.x;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    angle(b) {
      const a = this.normalize();
      b = b.normalize();
      return Math.acos(a.dot(b));
    }
  // Returns a signed angle, such that for any pair of non-null vectors a.signedAngle(b) = - b.signedAngle(a)
    // signedAngle(b) {
    //   const a = this.normalize();
    //   b = b.normalize();
    //   return Math.acos(a.dot(b));
    // }
    normalize() {
        const length = this.length();
        return this.scale(1/length);
        // return new Vec2(this.x / length, this.y / length); // TODO: Test accuracy between these two approaches
    }
    rotate(radians) {
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    rotate_around(B, radians) {
      return this.subtract(B).rotate(radians).add(B);
    }
    equal(b) {
      return this.x === b.x && this.y === b.y;
    }
    toString() {
      return `(${this.x}, ${this.y})`;
    }
    copy() {
      return new Vec2(this.x, this.y);
    }
    transform(matrix) {
      const result = [0, 0];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          result[i] += matrix.getValue(i, j) * this[j];
        }
      }
      return new Vec2(result[0], result[1]);
    }
}

class Vec4 {
  constructor(a, b, c, d) {
    this.size = 4;
    this[0] = a;
    this[1] = b;
    this[2] = c;
    this[3] = d;
    this.x = a;
    this.y = b;
    this.z = z;
    this.r = z;
  }

  add(b) {
    return new Vec4(this[0] + b[0], this[1] + b[1], this[2] + b[2], this[3] + b[3]);
  }

  subtract(b) {
    return new Vec4(this[0] - b[0], this[1] - b[1], this[2] - b[2], this[3] - b[3]);
  }

  dot(b) {
    return this[0] * b[0] + this[1] * b[1] + this[2] * b[2] + this[3] * b[3];
  }

  scale(s) {
    return new Vec4(s * this[0], s * this[1], s * this[2], s * this[3]);
  }
  length() {
    return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2] + this[3]*this[3]);
  }

  normalize() {
    const l = this.length();
    return new Vec4(this[0]/l, this[1]/l, this[2]/l, this[3]/l);
  }

  transform(matrix) {
    const result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i] += matrix.getValue(i, j) * this[j];
      }
    }
    return new Vec3(result[0], result[1], result[2], result[3]);
  }
}

class Vec3 {
  // public [0]/*:number\*/;
  // public [1]/*:number\*/;
  // public [2]/*:number\*/;

  constructor(a/*:number\*/, b/*:number\*/, c/*:number\*/) {
    this.size = 3;
    this[0] = a;
    this[1] = b;
    this[2] = c;
    this.x = a;
    this.y = b;
    this.z = c;
  }

  cross(b/*: Vec3\*/) {
    // Formula from wikipedia
    return new Vec3(this[1]*b[2] - this[2]*b[1], this[2]*b[0] - this[0]*b[2], this[0]*b[1] - this[1]*b[0]);
    // return new Vec3(this[1]*b[2] - this[2]*b[1], this[0]*b[2] - this[2]*b[0], this[0]*b[1] - this[1]*b[0]); // Flip Y (i.e. second coordinate)
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
  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }
  normalize() {
    const l = this.length();
    return new Vec3(this[0]/l, this[1]/l, this[2]/l,);
  }

  transform(matrix) {
    const result = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i] += matrix.getValue(i, j) * this[j];
      }
    }
    return new Vec3(result[0], result[1], result[2]);
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

class Matrix {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.values = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        row.push(0);
      }
      this.values.push(row);
      this[i] = row;
    }
  }
  static fromArray(array) {
    return createMatrix(array);
  }
  setValue(row, column, value) {
    if (!(0 <= row && row < this.rows && 0 <= column && column < this.columns)) throw new Error('Illegal argument: index outside bounds');
    this.values[row][column] = value;
  }
  setRow(row, values) {
    if (values.length !== this.columns) throw new Error('Invalid size: There are not as many values as columns.');
    this.values[row] = values;
  }
  setColumn(column, values) {
    if (values.length !== this.rows) throw new Error('Invalid size: There are not as many values as rows.');
    for (let i = 0; i < this.rows; i++) {
      this.values[i][column] = values[i];
    }
  }
  transpose() {
    const result = new Matrix(this.columns, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        result[j][i] = this[i][j];
      }
    }
    return result;
  }
  getValue(row, column) {
    return this.values[row][column];
  }
  // TODO: Handle bigger numbers. (Should numbers be left or right aligned?)
  // For each column, find its length
  // Pad values such that they are equally long in the column
  toString() { 
    const output = [];
    for (let i = 0; i < this.rows; i++) {
      output.push("| ");
      for (let j = 0; j < this.columns; j++) {
        output.push(this.values[i][j] + " ");
      }
      output.push("|\n");
    }
    return output.join("");
  }
  _calculateDeterminantSubmatrix(column) {
      const submatrix = new Matrix(this.columns-1, this.columns-1);
      let columnIndex = 0;
      for (let j = 0; j < this.columns-1; j++) {
        if (columnIndex === column) columnIndex++;
        for (let i = 0; i < this.rows-1; i++) {
          submatrix[i][j] = this[i+1][columnIndex];
        }
        columnIndex++;
      }
      return submatrix;
  }
  determinant() {
    if (this.columns !== this.rows) throw new Error('Invalid size: Determinants are only defined for square matrices.')
    if (this.columns === 2) return this._determinant2();
    if (this.columns === 3) return this._determinant3();
    let sum = 0;
    let sign = 1;
    for (let i = 0; i < this.columns; i++) {
      const submatrix = this._calculateDeterminantSubmatrix(i);
      sum += sign * this[0][i] * submatrix.determinant();
      sign = sign * -1;
    }
    return sum;
  }
  _determinant2() {
    return this[0][0] * this[1][1] - this[0][1] * this[1][0];
  }
  _determinant3() {
    return this[0][0] * this[1][1] * this[2][2] + 
           this[0][1] * this[1][2] * this[2][0] + 
           this[0][2] * this[1][0] * this[2][1] - 
           this[0][2] * this[1][1] * this[2][0] - 
           this[0][1] * this[1][0] * this[2][2] - 
           this[0][0] * this[1][2] * this[2][1];
  }
  mult(b) {
    if (this.columns !== b.rows) throw new Error('Invalid size: Argument does not have as many rows as this matrix has columns.');
    const result = new Matrix(this.rows, b.columns);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < b.columns; j++) {
          let val = 0;
          for (let k = 0; k < this.columns; k++) {
            val += this.getValue(i, k) * b.getValue(k, j);
          }
          result.setValue(i, j, val);
      }
    }
    return result;
  }
  multv3(b) {
    if (this.columns !== 3) throw new Error('Invalid size: Matrix has invalid size.');
    const result = new Matrix(this.rows, 1);
    for (let i = 0; i < this.rows; i++) {
      result.setValue(i, 0, this.getValue(i, 0) * b[0] + this.getValue(i, 1) * b[1] + this.getValue(i, 2) * b[2]); 
    }
    return result;
  }
  multv2(b) {
    if (this.columns !== 2) throw new Error('Invalid size: Matrix has invalid size.');
    const result = new Matrix(this.rows, 1);
    for (let i = 0; i < this.rows; i++) {
      result.setValue(i, 0, this.getValue(i, 0) * b.x + this.getValue(i, 1) * b.y); 
    }
    return result;
  }
  scale(s) {
    const result = new Matrix(this.rows, this.columns);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        const val = this.getValue(i, j); 
        result.setValue(i, j, val * s);
      }
    }
    return result;
  }
}

function createMatrix(nestedList) {
  const n = nestedList.length;
  if (n === 0) return new Matrix(0,0);
  const m = nestedList[0].length;
  const result = new Matrix(n, m);
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < m; ++j) {
      // TODO: Verify that inserted values are numbers?
      result.setValue(i, j, nestedList[i][j]);
    }
  }
  return result;
}

function reduceRow(matrix, vector, baseRow, targetRow, column) {
  const n = matrix.columns;
  const multiplier = matrix.getValue(targetRow, column)/matrix.getValue(baseRow,column);

  for (let j = 0; j < n; j++) {
    matrix.setValue(targetRow, j, matrix.getValue(targetRow,j) - multiplier * matrix.getValue(baseRow, j));
  }
  matrix.setValue(targetRow, column, 0);
  vector[targetRow] = vector[targetRow] - multiplier * vector[baseRow];
}

// Assumes the only non-zero value in the matrix row is given by column
function reduceSelfRow(matrix, vector, row, column) {
  vector[row] = vector[row] / matrix.getValue(row, column);
  matrix.setValue(row, column, 1);
}


function solveLinearEquations(matrix, vector) {
  if (matrix.rows !== matrix.columns) throw new Error('Expected matrix to be square');
  if (vector.length !== matrix.columns) throw new Error("Vector and matrix are incompatible");

  // TODO: Generalize
  const m = matrix.rows;
  const n = matrix.columns;


  // a b c    x1     b1    
  // d e f    x2     b2
  // g h i    x3     b3

  // ROWS:    1 2 3
  // COLUMNS: 1 2 3
  // a*x1 + b*x2 + c*x3 = b1
  // d*x1 + e*x2 + f*x3 = b2
  // g*x1 + h*x2 + i*x3 = b3

  // ROWS:    2 1 3
  // COLUMNS: 1 2 3
  // d*x1 + e*x2 + f*x3 = b2
  // a*x1 + b*x2 + c*x3 = b1
  // g*x1 + h*x2 + i*x3 = b3

  // ROWS:    2 1 3
  // COLUMNS: 3 2 1
  // f*x3 + d*x1 + e*x2 = b2
  // c*x3 + a*x1 + b*x2 = b1
  // i*x3 + g*x1 + h*x2 = b3

  // Is any of the values 0? 
  // Move the columns and rows around such that 1,1 is none zero and 3,1 (maybe also 2,1) is zero

  // Assume none are 0
  // Then we want to take the first row and subtract it (d/a) times from the second row and (g/a) times from the third row 

  // d - (d/a)*a = d - da/a = d-d = 0

  // Now we have
  // a b c
  // 0 e f
  // 0 h i
  // And we can do the same thing to get

  // a b c
  // 0 e f
  // 0 0 i

  // and then we get 

  // a b 0
  // 0 e 0
  // 0 0 i

  // And finaly 

  // a 0 0
  // 0 e 0
  // 0 0 i

  // The algorithm.
  // Phase 1:
  // First, make sure 1,1 is non-zero. If it is zero, then look for a non-zero value in the column and swap the rows. 
  // Then, make every other value in the column except 1,1 be equal to 0 by subtracting the row 1 from the other rows

  // Next, ignore the first row and column (i.e. essentially recurse on the smaller submatrix)
  // Make sure 2,2 is non-zero. If it is zero, then loof for a non-zero value in the column (ignoring the first row) and swap the rows
  // Then, make every other value in the column except 2,2 (and 1,2) be equal to 0 by subtracting the row 2 from the other rows

  // Repeat until 1 row left.

  // Phase 2:
  // We should now have a row with only one non-zero variable in a column. Make sure the value is 1 by dividing by itself. 
  // Next, make sure the other rows have a 0 in this column by subtracting this last row from all the other 

  // Next, ignore the last row and repeat on the second to last row. 


  // const rows = [0, 1, 2];
  // const columns = [0, 1, 2];
  // // PHASE 1
  // for (let i = 0; i < m; i++) {
  //   // const topLeft = matrix[rows[i]][columns[i]];
  //   // if (topLeft === 0) { // TODO
  //   //   // Find non-zero row (abort if none)
  //   //   // Swap rows
  //   //   const noneZeroRow = 1;
  //   //   const tmp = rows[i];
  //   //   rows[0] = rows[noneZeroRow];
  //   //   rows[noneZeroRow] = tmp;
  //   // }
  //   for (let j = i+1; j < m; j++) {
  //     reduceRow(matrix, vector, i, j, i);
  //     l(matrix.toString())
  //   }
  //   // for (let j = i+1; j < m; j++) {
  //   //   reduceRow(matrix, vector, rows[i], rows[j], columns[i]);
  //   // }
    
  // }

  // for (let i = m-1; i >= 0; i--) {
  //   reduceSelfRow(matrix, vector, i, i);

  //   for (let j = 0; j < i; j++) {
  //     reduceRow(matrix, vector, i, j, i);
  //     l(matrix.toString())
  //   }
  // }

  // l('test')


  


  // const a = matrix[0][0];
  // const b = matrix[0][1];
  // const c = matrix[1][0];
  // const d = matrix[1][1];

  // Assuming 2x2 matrix and 2d vector

  // Add 1 row vector to the other until one variable is removed. (if both are removed then an infinite number of solutions exists)
}

class ImplicitPlane {
  constructor(point, normalVector) {
    this.point = point;
    this.normalVector = normalVector;
  }

  hit(point, direction) {
    return null;
  }
}

// Assuming a, b, and c are given as Vec3
// Calculates the normal vector of the plane given by the points a, b, and c
function calculatePlaneNormal(a, b, c) {
  return b.subtract(a).cross(c.subtract(a));
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

function translatePoint(point, direction, distance) {
    if (!(point instanceof Vec3 && direction instanceof Vec3)) throw Error("Both point and direction should be Vec3");
    return point + direction.normalize().scale(distance);
}

function testDeterminantFunction() {
  testDeterminantFunction1();
  testDeterminantFunction2();
  testDeterminantFunction3();
  testDeterminantFunction4();
  testDeterminantFunction5();
}

function testDeterminantFunction1() {
  const m = createMatrix([
    [1, 2, 6, 6],
    [4, 7, 3, 2],
    [0, 0, 0, 0],
    [1, 2, 2, 9],
  ]);

  const result = m.determinant();
  if (result !== 0) console.log('Expected ', m, 'to have determinant 0, but was', result)
}

function testDeterminantFunction2() {
  const m = createMatrix([
    [2, 1, 2, 3],
    [6, 7, 6, 9],
    [0, 6, 0, 0],
    [1, 2, 1, 4],
  ]);

  const result = m.determinant();
  if (result !== 0) console.log('Expected ', m, 'to have determinant 0, but was', result)
}

function testDeterminantFunction3() {
  const m = createMatrix([
    [1, 2, 3, 4],
    [2, 5, 7, 3],
    [4, 10, 14, 6],
    [3, 4, 2, 7],
  ]);

  const result = m.determinant();
  if (result !== 0) console.log('Expected ', m, 'to have determinant 0, but was', result)
}

function testDeterminantFunction4() {
  const m = createMatrix([
    [4, 3, 2, 2],
    [0, 1, -3, 3],
    [0, -1, 3, 3],
    [0, 3, 1, 1],
  ]);

  const result = m.determinant();
  if (result !== -240) console.log('Expected ', m, 'to have determinant -240, but was', result)
}


function testDeterminantFunction5() {
  const m = createMatrix([
    [1, 4, 2, 1],
    [-1, -1, 3, 2],
    [0, 5, 7, -4],
    [2, 1, -3, 2],
  ]);

  const result = m.determinant();
  const expected = 98;
  if (result !== expected) console.log('Expected ', m, 'to have determinant', expected, ', but was', result)
}

