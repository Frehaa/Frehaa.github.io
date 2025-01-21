class UIElement {
    constructor(topLeft, size, boundingBoxPadding) {
        this.bufferedBoundingBox = new UIBoundingBox(
            topLeft.x,
            topLeft.y,
            size.width,
            size.height,
            boundingBoxPadding
        );
    }
    draw(ctx) {}
    updatePosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        
        // TODO: Fix this monstrosity
        this.bufferedBoundingBox.xMin = x;
        this.bufferedBoundingBox.yMin = y;
        this.bufferedBoundingBox.xMax = x + this.size.width;
        this.bufferedBoundingBox.yMax = y + this.size.height;
    }
    // TODO: Make bounding box stuff part of the UIElement itself
}

class InteractableUIELement extends UIElement { // TODO: Relative position of elements
    constructor(topLeft, size, boundingBoxPadding) {
        super(topLeft, size, boundingBoxPadding)
        this.enabled = true;
        this.callbacks = [];
    }
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    triggerCallbacks(value) {
        this.callbacks.forEach(callback => callback(value));
    }
    mouseMove(event) {} 
    mouseDown(event) {}
    mouseUp(event) {}
}


// Class for handling all interaction to UI elements
class UI {
    constructor() {
        this.uiElements = []; // TODO: Order UI Elements and 
        this.interactableUIElements = [];
        // TODO: Have different frames that can be switched between 
        // TODO: How to implement a UI popup? 
        // TODO: Toggle interactability of UI Elements. Non-interactable elements do not need mouse events. 
        // TODO: Implement something which checks if UI needs to be redrawn. E.g. Check if elements are "dirty"
        // TODO: Check for mouse leaving mouse event area. E.g. to guard against the case when the mouse up event is not triggered because it happened outside window

    }
    add(uiElement) {
        if (!(uiElement instanceof UIElement)) { throw new Error("Element was not a UIElement."); }
        if (uiElement instanceof InteractableUIELement) {
            this.interactableUIElements.push(uiElement);
        }
        this.uiElements.push(uiElement);
        uiElement.ui = this; // TODO: Maybe find a better way to do this
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
        this.mousePosition = this._getMousePosition(mouseMoveEvent); // TODO?: Only call event on elements where the mouse position falls within the bounding box?
        for (const uiElement of this.interactableUIElements) {
            if (uiElement.enabled && uiElement.mouseMove(mouseMoveEvent)) return true;
        }
        return false;
    }
    mouseDown(mouseDownEvent) {
        this.mousePosition = this._getMousePosition(mouseDownEvent);
        for (const uiElement of this.interactableUIElements) {
            if (uiElement.enabled && uiElement.mouseDown(mouseDownEvent)) return true;
        }
        return false;
    }
    mouseUp(mouseUpEvent) {
        this.mousePosition = this._getMousePosition(mouseUpEvent);
        for (const uiElement of this.interactableUIElements) {
            if (uiElement.enabled && uiElement.mouseUp(mouseUpEvent)) return true;
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
    constructor(x, y, width, height, padding = 0) {
        this.xMin = x;
        this.yMin = y;
        this.xMax = x + width;
        this.yMax = y + height;
        this.padding = padding;
    }
    moveBy(dx, dy) {
        this.xMax += dx;
        this.xMin += dx;
        this.yMax += dy;
        this.yMin += dy;
    }
    moveTo(x, y) {
        const width = this.xMax - this.xMin;
        const height = this.yMax - this.yMin;
        this.xMin = x;
        this.yMin = y;
        this.xMax = x + width;
        this.yMax = y + height;        
    }
    setPadding(value) { 
        this.padding = value;
    }
    contains(position) {
        return (this.xMin <= position.x && position.x <= this.xMax &&
                this.yMin <= position.y && position.y <= this.yMax)
    }
    containsPadded(position) {
        return (this.xMin - this.padding <= position.x && position.x <= this.xMax + this.padding &&
                this.yMin - this.padding <= position.y && position.y <= this.yMax + this.padding)

    }
    draw(ctx) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'teal';
        ctx.strokeRect(this.xMin, this.yMin, this.xMax - this.xMin, this.yMax - this.yMin);

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'turquise';
        ctx.strokeRect(this.xMin - this.padding, this.yMin - this.padding, this.xMax - this.xMin + 2 * this.padding, this.yMax - this.yMin + 2 * this.padding);
    }
}