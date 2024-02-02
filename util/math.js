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
    }
  }
  setValue(row, column, value) {
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
  getValue(row, column) {
    return this.values[row][column];
  }
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


  const rows = [0, 1, 2];
  const columns = [0, 1, 2];
  // PHASE 1
  for (let i = 0; i < m; i++) {
    // const topLeft = matrix[rows[i]][columns[i]];
    // if (topLeft === 0) { // TODO
    //   // Find non-zero row (abort if none)
    //   // Swap rows
    //   const noneZeroRow = 1;
    //   const tmp = rows[i];
    //   rows[0] = rows[noneZeroRow];
    //   rows[noneZeroRow] = tmp;
    // }
    for (let j = i+1; j < m; j++) {
      reduceRow(matrix, vector, i, j, i);
      l(matrix.toString())
    }
    // for (let j = i+1; j < m; j++) {
    //   reduceRow(matrix, vector, rows[i], rows[j], columns[i]);
    // }
    
  }

  for (let i = m-1; i >= 0; i--) {
    reduceSelfRow(matrix, vector, i, i);

    for (let j = 0; j < i; j++) {
      reduceRow(matrix, vector, i, j, i);
      l(matrix.toString())
    }
  }

  l('test')


  


  // const a = matrix[0][0];
  // const b = matrix[0][1];
  // const c = matrix[1][0];
  // const d = matrix[1][1];

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