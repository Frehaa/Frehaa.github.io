class OverlayFrame {
    constructor(drawSettings) {
        this.drawSettings = {
            ...drawSettings
        }
    }
    draw(ctx) {
        let x = this.drawSettings.position.x
        let y = this.drawSettings.position.y
        let width = this.drawSettings.width
        let height = this.drawSettings.height
        ctx.strokeStyle = this.drawSettings.strokeColor; 
        ctx.fillStyle = this.drawSettings.fillColor; 
        ctx.fillRect(x, y, width, height)
        ctx.strokeRect(x, y, width, height)
    }
    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    slideStart() {}
    slideEnd(){}
    keyUp() {}
}