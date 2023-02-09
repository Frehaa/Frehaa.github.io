function rectangle(x, y, width, height) {
    let r = {
        x,
        y,
        width,
        height,
        draw: function (ctx) {
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }, 
        isInside(point) {
            return this.x <= point.x && point.x <= this.x + this.width && this.y <= point.y && point.y <= this.y + this.height;
        }
    };
    return r;
}

function circle(x, y, radius) {
    let r = {
        x,
        y,
        radius,
        draw: function (ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }, 
        isInside(point) {
            return false;
        }
    };
    return r;
}

function horline(x, y, length) {
    let r = {
        x,
        y,
        length,
        draw: function(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.length, this.y);
            ctx.stroke();
        },
        distance: function(point) {
            if (this.x <= point.x && point.x <= this.x + this.length) {
                return Math.abs(point.y - this.y);
            }
            return 1000000; // TODO
        }
    };
    return r;
}

function drawVerticalArrow(x, y, length, tipLength, tipWidth, ctx) {
    let directionY = Math.sign(length);
    let arrowEndY = y + length;
    let arrowTipStartY = arrowEndY - tipLength * directionY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, arrowTipStartY);
    ctx.stroke();

    // Arrow tip
    ctx.beginPath();
    ctx.moveTo(x, arrowEndY);
    ctx.lineTo(x + tipWidth, arrowTipStartY);
    ctx.lineTo(x - tipWidth, arrowTipStartY);
    ctx.closePath();
    ctx.fill();
}

function verticalArrow(x, y, length, tipLength = 15, tipWidth = 10) {
    let r = {
        x,
        y,
        length,
        tipLength,
        tipWidth,
        color: '#000000',
        draw: function(ctx) {
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
            drawVerticalArrow(this.x, this.y, this.length, this.tipLength, this.tipWidth, ctx);
        },
    };
    return r;
}
