 // Requires loading the ui.js file before the slider
class Slider extends InteractableUIELement {
    // TODO if maybe some stuff is common for vertical and horizontal sliders
    constructor({position, size, lineWidth, initialSliderMarkerRatio, inverseSliderMarkerPosition}) {
        const boundingBoxPosition = { x: position.x, y: position.y };
        const boundingBoxSize = { width: size.width, height: size.height };
        super(boundingBoxPosition, boundingBoxSize, 5)

        this.position = position;
        this.size = size;
        this.lineWidth = lineWidth;
        this.inverseSliderMarkerPosition = false;

        this.isDragging = false;
        this.state = {
            value: 0,
            min: 0,
            max: 1
        };

        this.inverseSliderMarkerPosition = inverseSliderMarkerPosition;
        this.sliderMarkerRatio = initialSliderMarkerRatio;
        const slider = this;
        this.addCallback(value => {
            slider.sliderMarkerRatio = (value - slider.state.min) / (slider.state.max - slider.state.min);
        })
    }
    draw(ctx) { throw new Error('Use either HorizontalSlider or VerticalSlider') }


    mouseDown(event) {
        const mousePosition = this.ui.mousePosition;
        if (!this.bufferedBoundingBox.contains(mousePosition)) return;
        if (event.button != 0) return; // MOUSE_LEFT_BUTTON = 0
        this.isDragging = true;
        this.updateState(mousePosition);
    }
    mouseUp(event) {
        if (event.button != 0) return; // MOUSE_LEFT_BUTTON = 0
        this.isDragging = false;
    }
    mouseMove(mouseEvent) {
        if (!this.isDragging) return;
        this.updateState(this.ui.mousePosition);
    }

    _fillCircle(ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
    _setValue(value) {
        this.state.value = value;
        this.triggerCallbacks(value);
    }

}

class VerticalSlider extends Slider {
    constructor(settings) {
        super(settings);
    }
    draw(ctx) {
        const leftX = this.position.x;
        const topY = this.position.y;
        const {width, height} = this.size;
        const centerX = leftX + width /2;

        const circleTop = topY + width / 2;
        const circleBottom = topY + height - width / 2;

        ctx.beginPath()
        ctx.arc(centerX, circleBottom, width / 2, 0, Math.PI, false);
        ctx.arc(centerX, circleTop,    width / 2, Math.PI, 0, false);
        ctx.closePath()
        if (this.enabled) {
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'black';
        } else {
            ctx.strokeStyle = 'grey';
            ctx.fillStyle = 'grey';
        }
        ctx.lineWidth = this.lineWidth
        ctx.stroke()

        let markerRatio = this.sliderMarkerRatio;
        if (this.inverseSliderMarkerPosition) {
            markerRatio = 1 - this.sliderMarkerRatio;
        }

        if (this.isDragging){
            this._fillCircle(ctx, centerX, lerp(circleTop, circleBottom, markerRatio), width / 2 + this.lineWidth)
        } else {
            this._fillCircle(ctx, centerX, lerp(circleTop, circleBottom, markerRatio), width / 2 - 2)
        }
    }
    updateState(position) { 
        const circleTop = this.position.y + this.size.width / 2;
        const circleBottom = this.position.y + this.size.height - this.size.width / 2;

        const y = clamp(position.y, circleTop, circleBottom);
        const percentage = (y - circleTop) / (circleBottom - circleTop);
        if (this.inverseSliderMarkerPosition) {
            this._setValue(lerp(this.state.min, this.state.max, 1 - percentage));
        } else {
            this._setValue(lerp(this.state.min, this.state.max, percentage));
        }
    }
}

class HorizontalSlider extends Slider { 
    constructor(settings) {
        super(settings);
    }
    draw(ctx) {
        const leftX = this.position.x;
        const topY = this.position.y;
        const {width, height} = this.size;
        const centerY = topY + height /2;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = this.lineWidth

        ctx.beginPath()
        ctx.arc(leftX + width, centerY, height / 2, -Math.PI/2, Math.PI/2, false);
        ctx.arc(leftX, centerY, height / 2, Math.PI/2, -Math.PI/2, false);
        ctx.closePath()
        ctx.stroke()

        if (this.isDragging){
            this._fillCircle(ctx, lerp(leftX, leftX + width, this.sliderMarkerRatio), centerY, height / 2 + this.lineWidth)
        } else {
            this._fillCircle(ctx, lerp(leftX, leftX + width, this.sliderMarkerRatio), centerY, height / 2 - 2)
        }
    }
    updateState(position) {  // TODO: Fix like for vertical slider. Right now the ball doesn't center perfectly around the mouse
        const x = clamp(position.x, this.position.x, this.position.x + this.size.width);
        const percentage = (x - this.position.x) / this.size.width;
        this._setValue(lerp(this.state.min, this.state.max, percentage));
    }
}