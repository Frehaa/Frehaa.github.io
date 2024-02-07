class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class LineSegment {
    constructor(a, b) {
        if (!(a instanceof Point) || !(b instanceof Point)) throw new Error("Illegal argument: Arguments are not Points");
        this.a = a;
        this.b = b;
    }
}

// I do not get how this works
// Code from: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
function pointOrientation(p, q, r) {
    const v = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (v === 0) return 0; // Colinear 
    return (v > 0)? 1 : 2; // Clockwise / Counter-clockwise
}

// function orientation2(p, q, r) { // I still do not understand the clockwise vs counter-clockwise
//     const slope1 = (q.y - p.y) / (q.x - p.x); // Slope from p to q
//     const slope2 = (r.y - q.y) / (r.x - q.x); // Slope from q to r

//     if (slope1 === slope2) return 0;    // Colinear
//      ?????
// }


// Code from: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
function pointOnLineSegment(p, q, r) { 
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && 
           q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
} 

// Code from: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
function lineSegmentIntersection(p1, q1, p2, q2) {
    const o1 = pointOrientation(p1, q1, p2); 
    const o2 = pointOrientation(p1, q1, q2); 
    const o3 = pointOrientation(p2, q2, p1); 
    const o4 = pointOrientation(p2, q2, q1); 

    if (o1 != o2 && o3 != o4) return true;

    return ((o1 == 0 && pointOnLineSegment(p1, p2, q1)) ||
            (o2 == 0 && pointOnLineSegment(p1, q2, q1)) || 
            (o3 == 0 && pointOnLineSegment(p2, p1, q2)) ||
            (o4 == 0 && pointOnLineSegment(p2, q1, q2)));
}

function naiveLineSegmentIntersect(p1, p2, q1, q2) {
    // 1. Compute linear function for line segments (y = ax + b)
    // 2. Compute intersection
    // 3. Check if intersection is within bounds
    // Treat the lines as infinite and find the intersection
}