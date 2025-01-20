const easeInSine = x => 1 - Math.cos((x * Math.PI) / 2);
const easeOutSine = x => Math.sin((x * Math.PI) / 2);
const easeInOutSine = x => -(Math.cos(x * Math.PI) - 1) / 2;

const easeInQuad = x => x*x;
const easeOutQuad = x => 1 - (1-x)*(1-x);
const easeInOutQuad = x => {
    if (x < 0.5) { return 2*x*x; } 
    const t = -2*x+2;
    return 1 - t*t / 2;
}

const easeInCubic = x => x*x*x;
const easeOutCubic = x => {
    const t = 1 - x;
    return 1 - t*t*t;
}
const easeInOutCubic = x => {
    if (x < 0.5) { return 4*x*x*x; }
    const t = 2 - 2*x;
    return 1 - t*t*t / 2;
}

const easeInQuart = x => x*x*x*x; 
const easeOutQuart = x => {
    const t = 1 - x;
    return 1 - t*t*t*t;
}
const easeInOutQuart = x => {
    if (x < 0.5) { return 8*x*x*x*x; } 
    const t = 2 - 2 * x;
    return 1 - t*t*t*t / 2;
}
const easeInQuint = x => x*x*x*x*x;
const easeOutQuint = x => {
    const t = 1 - x;
    return 1 - t*t*t*t*t;
}
const easeInOutQuint = x => {
    if (x < 0.5) { return 16*x*x*x*x*x; }
    const t = 2 - 2*x;
    return 1 - t*t*t*t*t / 2;
}

const easeInCirc = x => 1 - Math.sqrt(1 - x*x);
const easeOutCirc = x => {
    const t = x - 1;
    return Math.sqrt(1 - t*t);
}
const easeInOutCirc = x => {
    if (x < 0.5) { return (1 - Math.sqrt(1 - 4*x*x)) / 2; }
    const t = 2 - 2*x;
    return (Math.sqrt(1 - t*t) + 1) / 2;
}
const easeInElastic = x => {
    if (x === 0 || x === 1) { return x; }
    return -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * 2.09439510239)
}

const easeOutElastic = x => {
    if (x === 0 || x === 1) { return x; } 
    return 1 + Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * 2.09439510239);
}
const easeInOutElastic = x => {
    if (x === 0 || x == 1) { return x; }
    if (x < 0.5) { return -Math.pow(2, 20 * x - 10) * Math.sin((x * 20 - 11.125) * 1.3962634016) / 2; }
    return 1 + Math.pow(2, -20 * x + 10) * Math.sin((x * 20 - 11.125) * 1.3962634016) / 2;
}

const easeInExpo = x => {
    if (x === 0) { return x; }
    return Math.pow(2, 10 * x - 10);
}
const easeOutExpo = x => {
    if (x === 1) { return x; }
    return 1 - Math.pow(2, -10 * x);
}
const easeInOutExpo = x => {
    if (x === 0 || x == 1) { return x; }
    if (x < 0.5) { return Math.pow(2, 20 * x - 10) / 2; }
    return 1 - Math.pow(2, -20 * x + 10) / 2;
}

const easeInBack = x => {
    const a = 1.70158;
    const b = 1 + a;
    return b * x*x*x - a * x*x;
}
const easeOutBack = x => {
    const a = 1.70158;
    const b = 1 + a;
    const t = x - 1;
    return 1 + b * t*t*t + a * t*t;
}
const easeInOutBack = x => {
    const a = 2.5949095;
    if (x < 0.5) { return (4 * x*x * ((2 + 2 *a)*x - a)) / 2; }
    const t = 2*x - 2;
    return 1 + (t*t * ((a + 1) * t + a)) / 2; 
}


const easeInBounce = x => 1 - easeOutBounce(1 - x);
const easeOutBounce = x => {
    const a = 7.5625;
    if (x < 0.363636363636) { return a * x*x; }
    if (x < 0.727272727273) { 
        const t = x - 0.545454545455;
        return a * t * t + 0.75;
    }
    if (x < 0.909090909091) {
        const t = x - 0.818181818182;
        return a * t*t + 0.9375;
    }
    const t = x - 0.963636363636;
    return a * t*t + 0.984375;
}
const easeInOutBounce = x => {
    if (x < 0.5) { return (1 - easeOutBounce(1 - 2*x)) / 2; }
    return (1 + easeOutBounce(2*x - 1)) / 2;
}