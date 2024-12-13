class UIElement {
    constructor(topLeft, size, boundingBoxPadding) {
        this.bufferedBoundingBox = new UIBoundingBox(
            topLeft.x,
            topLeft.y,
            size.width,
            size.height
        );
        this.bufferedBoundingBox.stretchBox(boundingBoxPadding);
    }
    draw(ctx) {}
    mouseMove(event) {}
    mouseDown(event) {}
    mouseUp(event) {}
}

class InteractableUIELement extends UIElement {
    constructor(topLeft, size, boundingBoxPadding) {
        super(topLeft, size, boundingBoxPadding)
        this.callbacks = [];
    }
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    triggerCallbacks(value) {
        this.callbacks.forEach(callback => callback(value));
    }
}


// Class for handling all interaction to UI elements
class UI {
    constructor() {
        this.uiElements = []; // TODO: Order UI Elements and 
        // TODO: Have different frames that can be switched between 
        // TODO: How to implement a UI popup? 
        // TODO: Toggle interactability of UI Elements. Non-interactable elements do not need mouse events. 
        // TODO: Implement something which checks if UI needs to be redrawn. E.g. Check if elements are "dirty"
    }
    add(uiElement) {
        this.uiElements.push(uiElement);
        uiElement.ui = this;
    }
    draw(ctx) {
        for (const uiElement of this.uiElements) {
            ctx.beginPath();
            uiElement.draw(ctx);
        }
        

        // DEBUGGING 
        if (this.drawBoundingBoxes) {
            for (const uiElement of this.uiElements) {
                ctx.beginPath();
                uiElement.bufferedBoundingBox.draw(ctx);
            }
        }
    }
    mouseMove(mouseMoveEvent) {
        this.mousePosition = this._getMousePosition(mouseMoveEvent);
        for (const uiElement of this.uiElements) {
            if (uiElement.mouseMove(mouseMoveEvent)) return true;
        }
        return false;
    }
    mouseDown(mouseDownEvent) {
        this.mousePosition = this._getMousePosition(mouseDownEvent);
        for (const uiElement of this.uiElements) {
            if (uiElement.mouseDown(mouseDownEvent)) return true;
        }
        return false;
    }
    mouseUp(mouseUpEvent) {
        this.mousePosition = this._getMousePosition(mouseUpEvent);
        for (const uiElement of this.uiElements) {
            if (uiElement.mouseUp(mouseUpEvent)) return true;
        }
        return false;
    }
    _getMousePosition(mouseEvent) {
        const canvas = mouseEvent.target; // Strongly assumes the canvas is the target of the mouse event.
        return {
            x: (mouseEvent.pageX - canvas.offsetLeft) * (canvas.width / canvas.clientWidth),
            y: (mouseEvent.pageY - canvas.offsetTop) * (canvas.height / canvas.clientHeight)
        }
    }
}

class UIBoundingBox {
    constructor(x, y, width, height) {
        this.xMin = x;
        this.yMin = y;
        this.xMax = x + width;
        this.yMax = y + height;
    }
    stretchBox(value) { 
        this.xMin -= value;
        this.yMin -= value;
        this.xMax += value;
        this.yMax += value;
    }
    contains(position) {
        return (this.xMin <= position.x && position.x <= this.xMax &&
                this.yMin <= position.y && position.y <= this.yMax)
    }
    draw(ctx) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'teal';
        ctx.strokeRect(this.xMin, this.yMin, this.xMax - this.xMin, this.yMax - this.yMin);
    }
}