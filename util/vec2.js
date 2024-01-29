class Vec2 {
    constructor(x, y) {
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
    // cross(b) { // Probably only used for 3d since it is the vector perpendicular to the two vectors.
    //     return 1;
    // }
    det(b) {
        return this.x*b.y - this.y*b.x;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const length = this.length();
        return this.scale(1/length);
        // return new Vec2(this.x / length, this.y / length); // TODO: Test accuracy between these two approaches
    }
}