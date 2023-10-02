"use strict";
function tableCoordinatesToCanvasCoordinates(x, y, drawSettings) {
    const {leftX, topY, cellWidth} = drawSettings;
    const centerX = leftX + cellWidth / 2 + x * cellWidth;
    const centerY = topY  + cellWidth / 2 + y * cellWidth;
    return [centerX, centerY];
}

// ######## Draw functions
function a(ctx, x, y, fontSize) {
    ctx.beginPath();
    ctx.moveTo(x + fontSize, y);
    ctx.lineTo(x + ctx.lineWidth, y + fontSize / 2);
    ctx.lineTo(x + fontSize, y + fontSize);
    ctx.stroke();
};
function i(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + fontSize, y + fontSize);
    ctx.stroke();
};
function u(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.arc(x,y, fontSize / 2, 0, 2 * Math.PI);
    ctx.stroke();
};
function e(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x + fontSize, y);
    ctx.lineTo(x, y + fontSize);
    ctx.stroke();
};
function o(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + fontSize, y + fontSize / 2);
    ctx.lineTo(x, y + fontSize);
    ctx.stroke();
};
function k(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + fontSize);
    ctx.stroke();
};
function ka(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    k(ctx, x, y, fontSize);
};
function ki(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    k(ctx, x, y, fontSize);
};
function ku(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    k(ctx, x, y, fontSize);
};
function ke(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    k(ctx, x, y, fontSize);
};
function ko(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    k(ctx, x, y, fontSize);
};
function g(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x + fontSize, y);
    ctx.lineTo(x + fontSize, y + fontSize);
    ctx.stroke();
}
function ga(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    g(ctx, x, y, fontSize);
};
function gi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    g(ctx, x, y, fontSize);
};
function gu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    g(ctx, x, y, fontSize);
};
function ge(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    g(ctx, x, y, fontSize);
};
function go(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    g(ctx, x, y, fontSize);
};
function s(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x, y + fontSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + fontSize, y);
    ctx.stroke();
}
function sa(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    s(ctx, x, y, fontSize);
};
function si(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    s(ctx, x, y, fontSize);
};
function su(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    s(ctx, x, y, fontSize);
};
function se(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    s(ctx, x, y, fontSize);
};
function so(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    s(ctx, x, y, fontSize);
};
function z(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.moveTo(x, y + fontSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + fontSize, y);
    ctx.stroke();
}
function za(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    z(ctx, x, y, fontSize);
};
function zi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    z(ctx, x, y, fontSize);
};
function zu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    z(ctx, x, y, fontSize);
};
function ze(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    z(ctx, x, y, fontSize);
};
function zo(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    z(ctx, x, y, fontSize);
};
function t(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function ta(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    t(ctx, x, y, fontSize);
};
function ti(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    t(ctx, x, y, fontSize);
};
function tu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    t(ctx, x, y, fontSize);
};
function te(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    t(ctx, x, y, fontSize);
};
function to(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    t(ctx, x, y, fontSize);
};
function d(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function da(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    d(ctx, x, y, fontSize);
};
function di(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    d(ctx, x, y, fontSize);
};
function du(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    d(ctx, x, y, fontSize);
};
function de(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    d(ctx, x, y, fontSize);
};
function do_(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    d(ctx, x, y, fontSize);
};
function n(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function na(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    n(ctx, x, y, fontSize);
};
function ni(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    n(ctx, x, y, fontSize);
};
function nu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    n(ctx, x, y, fontSize);
};
function ne(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    n(ctx, x, y, fontSize);
};
function no(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    n(ctx, x, y, fontSize);
};
function h(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function ha(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    h(ctx, x, y, fontSize);
};
function hi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    h(ctx, x, y, fontSize);
};
function hu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    h(ctx, x, y, fontSize);
};
function he(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    h(ctx, x, y, fontSize);
};
function ho(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    h(ctx, x, y, fontSize);
};
function b(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function ba(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    b(ctx, x, y, fontSize);
};
function bi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    b(ctx, x, y, fontSize);
};
function bu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    b(ctx, x, y, fontSize);
};
function be(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    b(ctx, x, y, fontSize);
};
function bo(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    b(ctx, x, y, fontSize);
};
function p(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function pa(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    p(ctx, x, y, fontSize);
};
function pi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    p(ctx, x, y, fontSize);
};
function pu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    p(ctx, x, y, fontSize);
};
function pe(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    p(ctx, x, y, fontSize);
};
function po(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    p(ctx, x, y, fontSize);
};
function m(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function ma(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    m(ctx, x, y, fontSize);
};
function mi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    m(ctx, x, y, fontSize);
};
function mu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    m(ctx, x, y, fontSize);
};
function me(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    m(ctx, x, y, fontSize);
};
function mo(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    m(ctx, x, y, fontSize);
};
function y(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function ya(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    y(ctx, x, y, fontSize);
};
function yi(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    y(ctx, x, y, fontSize);
};
function yu(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    y(ctx, x, y, fontSize);
};
function ye(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    y(ctx, x, y, fontSize);
};
function yo(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    y(ctx, x, y, fontSize);
};
function r(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function ra(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    r(ctx, x, y, fontSize);
};
function ri(ctx, x, y, fontSize){
    i(ctx, x, y, fontSize);
    r(ctx, x, y, fontSize);
};
function ru(ctx, x, y, fontSize){
    u(ctx, x, y, fontSize);
    r(ctx, x, y, fontSize);
};
function re(ctx, x, y, fontSize){
    e(ctx, x, y, fontSize);
    r(ctx, x, y, fontSize);
};
function ro(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    r(ctx, x, y, fontSize);
};
function w(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}
function wa(ctx, x, y, fontSize){
    a(ctx, x, y, fontSize);
    w(ctx, x, y, fontSize);
};
function wo(ctx, x, y, fontSize){
    o(ctx, x, y, fontSize);
    w(ctx, x, y, fontSize);
};
function n(ctx, x, y, fontSize){
    ctx.beginPath();
    ctx.stroke();
}

function initialize() {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d');

    const leftX = 20;
    const topY = 20
    const columns = 6;
    const rows = 10;
    const cellWidth = 50;

    const width = columns * cellWidth;
    const height = rows * cellWidth;

    ctx.lineWidth = 2
    ctx.beginPath();
    ctx.rect(leftX, topY, width, height);
    for (let i = 1; i < rows; ++i) {
        ctx.moveTo(leftX, topY + i * cellWidth);
        ctx.lineTo(leftX + width, topY + i * cellWidth);
    }

    for (let j = 1; j < columns; ++j) {
        ctx.moveTo(leftX + j * cellWidth, topY);
        ctx.lineTo(leftX + j * cellWidth, topY + height);
    }
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif'

    let [x, y] = tableCoordinatesToCanvasCoordinates(1, 0, {leftX, topY, cellWidth});
    ctx.fillText("A", x, y);

    [x, y] = tableCoordinatesToCanvasCoordinates(2, 0, {leftX, topY, cellWidth});
    ctx.fillText("I", x, y);

    [x, y] = tableCoordinatesToCanvasCoordinates(3, 0, {leftX, topY, cellWidth});
    ctx.fillText("U", x, y);

    [x, y] = tableCoordinatesToCanvasCoordinates(4, 0, {leftX, topY, cellWidth});
    ctx.fillText("E", x, y);

    [x, y] = tableCoordinatesToCanvasCoordinates(5, 0, {leftX, topY, cellWidth});
    ctx.fillText("O", x, y);

    ctx.lineWidth = 4;
    // [x, y] = tableCoordinatesToCanvasCoordinates(1, 1, {leftX, topY, cellWidth});
    // a(ctx, x - cellWidth*0.4, y - cellWidth*0.4, cellWidth * 0.8)

    // [x, y] = tableCoordinatesToCanvasCoordinates(2, 1, {leftX, topY, cellWidth});
    // i(ctx, x - cellWidth*0.4, y - cellWidth*0.4, cellWidth * 0.8)

    // [x, y] = tableCoordinatesToCanvasCoordinates(3, 1, {leftX, topY, cellWidth});
    // u(ctx, x, y, cellWidth * 0.8)

    // [x, y] = tableCoordinatesToCanvasCoordinates(4, 1, {leftX, topY, cellWidth});
    // e(ctx, x - cellWidth*0.4, y - cellWidth*0.4, cellWidth * 0.8)

    // [x, y] = tableCoordinatesToCanvasCoordinates(5, 1, {leftX, topY, cellWidth});
    // o(ctx, x - cellWidth*0.4, y - cellWidth*0.4, cellWidth * 0.8)

    // [x, y] = tableCoordinatesToCanvasCoordinates(1, 2, {leftX, topY, cellWidth});
    // ka(ctx, x - cellWidth*0.4, y - cellWidth*0.4, cellWidth * 0.8)

    // [x, y] = tableCoordinatesToCanvasCoordinates(1, 3, {leftX, topY, cellWidth});
    // ki(ctx, x - cellWidth*0.4, y - cellWidth*0.4, cellWidth * 0.8)

    const lookupTable = {
        "あ": a,
        "い": i,
        "う": u,
        "え": e,
        "お": o,
        "か": ka,
        "き": ki,
        "く": ku,
        "け": ke,
        "こ": ko,
        "さ": sa,
        "し": si,
        "す": su,
        "せ": se,
        "そ": so,
        "た": ta,
        "ち": ti,
        "つ": tu,
        "て": te,
        "と": to,
        "な": na,
        "に": ni,
        "ぬ": nu,
        "ね": ne,
        "の": no,
        "は": ha,
        "ひ": hi,
        "ふ": hu,
        "へ": he,
        "ほ": ho,
        "ま": ma,
        "み": mi,
        "む": mu,
        "め": me,
        "も": mo,
        "や": ya,
        // "": yi,
        "ゆ": yu,
        // "": ye,
        "よ": yo,
        "ら": ra,
        "り": ri,
        "る": ru,
        "れ": re,
        "ろ": ro,
        "わ": wa,
        // "": wi,
        // "": wu,
        // "": we,
        "を": wo,
        "ん": n,
        "が": ga,
        "ぎ": gi,
        "ぐ": gu,
        "げ": ge,
        "ご": go,
        "だ": da,
        "ぢ": di,
        "づ": du,
        "で": de,
        "ど": do_,
        "ぱ": pa,
        "ぴ": pi,
        "ぷ": pu,
        "ぺ": pe,
        "ぽ": po,
        "ば": ba,
        "び": bi,
        "ぶ": bu,
        "べ": be,
        "ぼ": bo,
        "ざ": za,
        "じ": zi,
        "ず": zu,
        "ぜ": ze,
        "ぞ": zo,
    };

    const translate = (text, lookupTable) => {
        const result = [];
        for (let i = 0; i < text.length; ++i) {
            const symbol = text[i];
            if (symbol in lookupTable) {
                result.push(lookupTable[symbol]);
            } else {
                throw new Error(`Could not translate text(${text}). Error unkown symbol(${symbol}) at position ${i}`);
            }
        }
        return result;
    }

    const write = (ctx, text, drawSettings) => {
        const {leftX, topY, fontSize} = drawSettings;
        for (let i = 0; i < text.length; i++) {
            const symbol = text[i];
            // console.log(symbol)
            symbol(ctx, leftX + i * fontSize, topY, fontSize);
        }
    }

    const translation = translate("こんにちは", lookupTable);
    write(ctx, translation, {leftX: 400, topY: 100, fontSize: 40});

}