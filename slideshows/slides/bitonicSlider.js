// NOTE THAT IT ONLY WORKS FOR k <= m
class BitonicSliderFrame {
    constructor(drawSettings, isInteractable = true) {
        this.drawSettings = {
            marginX: 25, 
            marginY: 25,
            width: 400,
            height: 25,
            innerColor: `#999999`,
            outColor: `#FFFFFF`,
            borderColor: `#000000`,
            inOutSeperatorColor: `#777777`,
            borderColor: '#000000',
            lineWidth: 3,
            offset: 25,
            ...drawSettings // Overwrite if available
        };
        this.isInteractable = isInteractable;
    }
    draw(ctx) {
        ctx.save()
        ctx.lineWidth = this.drawSettings.lineWidth;

        let k = document.getElementById('range-input-k').value / document.getElementById('range-input-k').max;
        let m = document.getElementById('range-input-m').value / document.getElementById('range-input-m').max;
        if (k > m ) return

        this.drawSimple(ctx);
        this.draw2half(ctx);
        this.drawPostMerge(ctx);
        ctx.restore()
    }

    drawSimple(ctx) {
        let width = this.drawSettings.width;
        let height = this.drawSettings.height
        let x1 = this.drawSettings.marginX;
        let y1 = this.drawSettings.marginY;

        let k = document.getElementById('range-input-k').value / document.getElementById('range-input-k').max;
        let m = document.getElementById('range-input-m').value / document.getElementById('range-input-m').max;
        
        this.drawBox(ctx, x1, y1, width, height, k, m);
    }
    drawBox(ctx, leftX, topY, width, height, k, m, flipColor = false) {
        let xInStart = leftX + width * k;
        let xInEnd = leftX + width * m
        let outColor = flipColor? this.drawSettings.innerColor : this.drawSettings.outColor;
        let innerColor = flipColor? this.drawSettings.outColor : this.drawSettings.innerColor;

        // console.log(innerColor, outColor, this.drawSettings)

        // Outer parts
        // TODO?: Fill all and remove?
        ctx.fillStyle = outColor;
        ctx.fillRect(leftX, topY, xInStart - leftX, height);
        ctx.fillRect(xInEnd, topY, leftX + width - xInEnd, height);

        // Inner part
        ctx.fillStyle = innerColor;
        ctx.fillRect(xInStart, topY, xInEnd - xInStart, height);

        // TODO: Make sure seperator does not draw out of 'in' area
        if (Math.abs(k - m) > FLOATING_POINT_ERROR_MARGIN) {
        // if (false) {
            // Seperator
            let sepOffset = this.drawSettings.lineWidth / 2;
            if (flipColor) {
                sepOffset = -sepOffset;
            }
            ctx.strokeStyle = this.drawSettings.inOutSeperatorColor;
            ctx.beginPath();
            ctx.moveTo(xInStart+sepOffset, topY);
            ctx.lineTo(xInStart+sepOffset, topY + height);
            ctx.moveTo(xInEnd-sepOffset, topY);
            ctx.lineTo(xInEnd-sepOffset, topY + height);
            ctx.stroke();
        }

        // Draw Border
        ctx.strokeStyle = this.drawSettings.borderColor;
        ctx.strokeRect(leftX, topY, width, height);
    }
    draw2half(ctx) {
        let width = this.drawSettings.width / 2;
        let height = this.drawSettings.height
        let x = this.drawSettings.marginX + width / 2;
        let y = this.drawSettings.marginY + this.drawSettings.height + this.drawSettings.offset;

        let k = document.getElementById('range-input-k').value / document.getElementById('range-input-k').max;
        let m = document.getElementById('range-input-m').value / document.getElementById('range-input-m').max;

        let k1 = Math.min(k * 2, 1);
        let k2 = Math.max((k - 0.5) * 2, 0);

        let m1 = Math.min(m * 2, 1);
        let m2 = Math.max((m - 0.5) * 2, 0);
        
        this.drawBox(ctx, x, y, width, height, k1, m1);
        this.drawBox(ctx, x, y + height, width, height, k2, m2);
    }
    drawPostMerge(ctx) {
        let width = this.drawSettings.width / 2;
        let height = this.drawSettings.height
        let x = this.drawSettings.marginX + width / 2;
        let y = this.drawSettings.marginY + 3 * this.drawSettings.height + 2 * this.drawSettings.offset;

        let k = document.getElementById('range-input-k').value / document.getElementById('range-input-k').max;
        let m = document.getElementById('range-input-m').value / document.getElementById('range-input-m').max;

        // Top 
        let k1 = Math.min(k * 2, 1);
        let m1 = Math.min(m * 2, 1);

        // Bottom
        let k2 = Math.max((k - 0.5) * 2, 0);
        let m2 = Math.max((m - 0.5) * 2, 0);

        if (k1 == 1) {
            this.drawBox(ctx, x, y, width, height, 1, 1);
            this.drawBox(ctx, x, y + height, width, height, k2, m2);
        } else if (m1 < 1) {
            this.drawBox(ctx, x, y, width, height, 1, 1);
            this.drawBox(ctx, x, y + height, width, height, k1, m1);
        } else if (k1 > m2) {
            this.drawBox(ctx, x, y, width, height, 1, 1);
            this.drawBox(ctx, x, y + height, width, height, m2, k1, true);
        } else if (k1 <= m2) {
            this.drawBox(ctx, x, y, width, height, k1, m2);
            this.drawBox(ctx, x, y + height, width, height, 0, 1);
        }
    }
    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    slideStart() {}
    slideEnd(){}
    keyUp() {}
}
