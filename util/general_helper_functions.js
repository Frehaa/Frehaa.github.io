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