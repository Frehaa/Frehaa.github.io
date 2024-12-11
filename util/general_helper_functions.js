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