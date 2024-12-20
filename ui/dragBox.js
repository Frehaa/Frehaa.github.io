class DragBox extends InteractableUIELement { // Requires loading the ui.js file first
    constructor({position, size, lineWidth}) {
        super(position, size, 5)
        this.position = position;
        this.size = size; 
        this.lineWidth = lineWidth;
        this.hover = false;
        this.dragStart = null;
        this.dragOffset = null;
    }
    draw(ctx) {
        if (this.hover) {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'black';
        }
        ctx.lineWidth = this.lineWidth;
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);

        this.bufferedBoundingBox.draw(ctx)
    }
    _computeBoxCenter() {
        const x = this.position.x + this.size.width / 2;
        const y = this.position.y + this.size.height / 2;
        return {x, y};
    }
    mouseMove(event) {
        const mousePosition = this.ui.mousePosition;
        this.hover = this.bufferedBoundingBox.contains(mousePosition);
        if (this.dragStart) {
            // I am assuming that we don't nobody relies on the position of this element being immutable
            this.updatePosition(
                mousePosition.x - this.dragOffset.x - this.size.width / 2,
                mousePosition.y - this.dragOffset.y - this.size.width / 2
            )

            this.triggerCallbacks(this._computeBoxCenter());
        }
    }
    mouseDown(event) {
        if (this.bufferedBoundingBox.contains(this.ui.mousePosition)) { // TODO: Update bounding box too
            this.dragStart = true;
            const boxCenter = this._computeBoxCenter();
            this.dragOffset = {
                x: this.ui.mousePosition.x - boxCenter.x,
                y: this.ui.mousePosition.y - boxCenter.y
            }
            return true;
        }
    }
    mouseUp(event) {
        this.dragStart = null;
        this.dragOffset = null;
    }
}

