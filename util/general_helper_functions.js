function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

const l = console.log;

function hash(str) {
    const [a, b, c] = [1048573, 2097143, 134217689];
    let result = a;
    for (let i = 0; i < str.length; i++) {
        result = (result + b * str.charCodeAt(i)) % c;
    }
    return result;
}

function d(...m) {
    if (false) l(...m);
}

[].__proto__.clear = function() {
    this.splice(0, this.length);
}

ImageData.prototype.setPixel = function(x, y, r, g, b, a) {
    const idx = (x + y * this.width) * 4;
    this.data[idx + 0] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = a;
}

CanvasRenderingContext2D.prototype.clear = function() {
    const { canvas } = this;
    this.clearRect(0, 0, canvas.width, canvas.height);
}

CanvasRenderingContext2D.prototype.getTextHeight = function(text) {
    const textMetrics = this.measureText(text);
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}

function getTextHeight(ctx, text) {
    const textMetrics = ctx.measureText(text);
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}

function isNullOrUndefined(o) {
    return o === null || o === undefined;
}

function isSorted(values) {
    if (values.length === 0) return true;
    let result = true;
    let current = values[0];
    for (let i = 1; i < values.length; i++) {
        const value = values[i];
        if (value < current) {
            result = false;
            break;
        }
    }
    return result;
}