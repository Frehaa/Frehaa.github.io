class BoxplotFrame {
    constructor(values, drawSettings) {
        this.values = values;
        this.drawSettings = {
            ...drawSettings
        };

        let copy = values.slice();
        copy.sort((a, b) => a > b);
        let mid = this.values.length / 2;
        this.lowerHalf = copy.slice(0, mid);
        this.upperHalf = copy.slice(mid);
    }

    draw(ctx) {
        if (this.drawSettings.drawHorizontal) {
            this.drawHorizontal(ctx);
        } else {
            this.drawVertical(ctx);
        }
    }

    drawHorizontal(ctx) {
        let max = Math.max(...this.values);
        let leftX = this.drawSettings.marginX;
        let topY = this.drawSettings.marginY;
        let height = this.drawSettings.height;
        let width = this.drawSettings.width;
        let length = this.values.length;
        let offset = this.drawSettings.boxOffset;

        let boxHeight = (height / length) - offset;

        for (let i = 0; i < length; i++) {
            let v = this.values[i];
            let t = v / max;
            let boxWidth = t * width;
            this.colorBox(i, t, ctx)
            ctx.fillRect(leftX, topY + (boxHeight +offset )* i , boxWidth, boxHeight);
        }
    }

    drawVertical(ctx) {
        let max = Math.max(...this.values);
        let leftX = this.drawSettings.marginX;
        let topY = this.drawSettings.marginY;
        let height = this.drawSettings.height;
        let width = this.drawSettings.width;
        let length = this.values.length;
        let offset = this.drawSettings.boxOffset;

        let boxWidth = (width / length) - offset;
        

        for (let i = 0; i < length; i++) {
            let v = this.values[i];
            let t = v / max;
            let boxHeight = t * height;
            this.colorBox(i, t, ctx)
            ctx.fillRect(leftX + (boxWidth + offset) * i, topY + height - boxHeight, boxWidth, boxHeight);
        }
    }

    colorBox(i, t, ctx) {
        if (this.drawSettings.color) {
            this.drawSettings.color(i, this.values, ctx);
            return;
        }
        let start = this.drawSettings.startColor;
        let end = this.drawSettings.endColor;
        if (false) {
            let r = lerp(start.r, end.r, t) * 255;
            let g = lerp(start.g, end.g, t) * 255;
            let b = lerp(start.b, end.b, t) * 255;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`; 
        } else {
            let v = this.values[i];
            if (this.lowerHalf.findIndex(w => w == v) >= 0) {
                ctx.fillStyle = this.drawSettings.startColor;
                // let {r,g,b,a} = this.drawSettings.startColor;
                // ctx.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`; 
                // ctx.fillStyle = '#00FF00'; 
            } else {
                ctx.fillStyle = this.drawSettings.endColor;
                // let {r,g,b,a} = this.drawSettings.endColor;
                // ctx.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`; 
                // ctx.fillStyle =  '#FF0000'; 
            }
        }
    }

    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    frameStart() {}
    frameEnd(){}
    keyUp() {}
}
