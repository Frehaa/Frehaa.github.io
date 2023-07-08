class TextBoxOverlay {
    constructor(text, drawSettings) {
        this.text = text;
        this.drawSettings = drawSettings;
    }
    draw(ctx) {
        let x = this.drawSettings.position.x; 
        let width = this.drawSettings.width; 
        let y = this.drawSettings.position.y;
        let textHeight = this.drawSettings.fontSize; 
        let font = this.drawSettings.font;
        let height = this.drawSettings.height; 
        let word = this.text; 
        let combinedTextHeight = textHeight * word.length;
        let drawVertical = this.drawSettings.drawVertical;
        ctx.font = `${textHeight}px ${font}`

        ctx.lineWidth = this.drawSettings.strokeWidth;
        ctx.clearRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        if (drawVertical) {
            for (let i = 0; i < word.length; i++) {
                let measure = ctx.measureText(word[i]);
                let centerX = x + width / 2 - measure.width / 2;
                let centerY = y + (height - combinedTextHeight) / 2;
                ctx.fillText(word[i], centerX, centerY + textHeight * i + measure.actualBoundingBoxAscent)    
            }
        } else {
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            let measure = ctx.measureText(word);
            let textHeight = measure.actualBoundingBoxDescent + measure.actualBoundingBoxAscent;
            let centerX = x + width / 2;
            let centerY = y + height / 2 - textHeight / 2 + measure.actualBoundingBoxAscent;
            ctx.fillText(word, centerX, centerY);
            // ctx.strokeRect(x, y + height / 2, width, 1)
            // ctx.strokeRect(x + width /2, y, 1, height)
            // ctx.strokeRect(centerX - measure.width /2, centerY - measure.actualBoundingBoxAscent, measure.width, textHeight)
        }

    }
    left() {
        return this.drawSettings.position.x;
    }
    right() {
        return this.drawSettings.position.x + this.drawSettings.width
    }
    top() {
        return this.drawSettings.position.y;
    }
    bottom() {
        return this.drawSettings.position.y + this.drawSettings.height;
    }

    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    frameStart() {}
    frameEnd(){}
    keyUp() {}
}
