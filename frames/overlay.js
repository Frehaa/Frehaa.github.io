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
        let sr = this.drawSettings.strokeColor.r * 255
        let sg = this.drawSettings.strokeColor.g * 255
        let sb = this.drawSettings.strokeColor.b * 255
        let sa = this.drawSettings.strokeColor.a 
        let fr = this.drawSettings.fillColor.r * 255
        let fg = this.drawSettings.fillColor.g * 255
        let fb = this.drawSettings.fillColor.b * 255
        let fa = this.drawSettings.fillColor.a 
        ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${sa})`;
        ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${fa})`;
        ctx.fillRect(x, y, width, height)
        ctx.strokeRect(x, y, width, height)
    }
    mouseMove() {}
    mouseDown() {}
    mouseUp() {}
    frameStart() {}
    frameEnd(){}
    keyUp() {}
}