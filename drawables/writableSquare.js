// Square which has text inside (only a single letter is properly centered )
function writableSquare(x, y, length) { 
    let r = {
        x,
        y,
        length,
        text: null,
        font: "Arial",
        focus: false,
        hover: false,
        borderColor: '#000000',
        focusColor: '#FF0000',
        hoverColor: '#00FF00',
        draw: function (ctx) {
            ctx.save()
            ctx.strokeStyle = this.borderColor;
            if (this.focus) {
                ctx.strokeStyle = this.focusColor;
            } else if (this.hover) {
                ctx.strokeStyle = this.hoverColor;
            }
            ctx.strokeRect(this.x, this.y, this.length, this.length);
            if (this.text != null) {
                ctx.font = this.length + "px " + this.font;
                ctx.textAlign = "center"
                let measure = ctx.measureText(this.text);
                ctx.fillText(this.text, this.x + this.length / 2, this.y + length /2 + measure.actualBoundingBoxAscent / 2);
            }
            ctx.restore();
        }, 
        isInside(point) {
            return this.x <= point.x && point.x <= this.x + this.length && this.y <= point.y && point.y <= this.y + this.length;
        }
    };
    return r;
}
