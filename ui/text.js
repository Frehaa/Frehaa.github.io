class Text extends UIElement { // Requires loading the ui.js file first
    constructor(text, {position, fontSize}) {
        const width = text.length * fontSize;
        const height = fontSize;
        super(position, {width: width, height: height}, 5)
        this.position = position;
        this.width = width; 
        this.text = text;
    }
    draw(ctx) {
        ctx.fillText(this.text, this.position.x, this.position.y);
    }
}
