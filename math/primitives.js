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