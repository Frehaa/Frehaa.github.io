class Checkbox extends InteractableUIELement { // Requires loading the ui.js file first
 // Requires loading the ui.js file first
    constructor({position, width, lineWidth}) {
        super(position, {width: width, height: width}, 5)
        this.position = position;
        this.width = width; 
        this.lineWidth = lineWidth;
        this.hover = false;
        this.checked = false;
    }
    draw(ctx) {
        ctx.lineWidth = this.lineWidth;
        if (this.hover) {
            ctx.strokeStyle = 'red';
            ctx.fillStyle = 'red';
        } else {
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'black';
        }
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.width);
        if (this.checked) {
            ctx.arc(this.position.x + this.width/2, this.position.y + this.width/2, this.width * 0.3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    mouseMove(event) {
        this.hover = this.bufferedBoundingBox.contains(this.ui.mousePosition);
        // Hover effect
    }
    mouseDown(event) {
        if (this.bufferedBoundingBox.contains(this.ui.mousePosition)) {
            this.checked = !this.checked;
            this.triggerCallbacks(this);
            return true;
        }

    }
    mouseUp(event) {}
}
