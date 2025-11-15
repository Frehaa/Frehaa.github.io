class PlaySettingsView { 
     constructor(controller) {
        this.controller = controller;
        this.ui = new UI();
    }

    draw(ctx) {
        this.ui.draw(ctx);
    }

    update(deltaTime) {

    }

    // RIGHT NOW THERE IS AN ISSUE WHERE WHEN I CREATE A NEW UI IT WILL AUTOMATICALLY ADD EVENT LISTENERS I MAY NOT WANT. 
    // 

    onKeyDown(event) {
        // this.ui.onKeyDown(event);
    }
    onKeyUp(event) {
        // this.ui.onKeyUp(event);
    }
    onMouseDown(event) {
        this.ui.mouseDown(event);
    }
    onMouseUp(event) {
        this.ui.mouseUp(event);
    }
    onMouseWheel(event) {
        // this.ui.onMouseWheel(event);
    }
    onMouseMove(event) {
        this.ui.mouseMove(event);
    }
}