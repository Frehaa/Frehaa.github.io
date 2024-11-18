class Button extends InteractableUIELement { // Requires loading the ui.js file first
    constructor({position, size, lineWidth}) {
        super(position, size, 5)
        this.position = position;
        this.size = size; 
        this.lineWidth = lineWidth;
        this.hover = false;
        this.callbacks = [];
    }
    draw(ctx) {
        ctx.lineWidth = this.lineWidth;
        if (this.hover) {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'black';
        }
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }
    mouseMove(event) {
        this.hover = this.bufferedBoundingBox.contains(this.ui.mousePosition);
        // Hover effect
    }
    mouseDown(event) {
        if (this.bufferedBoundingBox.contains(this.ui.mousePosition)) {
            this.triggerCallbacks(this);
            return true;
        }

    }
    mouseUp(event) {}
}
