class MelodyView { 
     constructor(controller) {
        this.controller = controller;
        this.currentView = controller.getCurrentMelodyView();
        this.ui = new UI();
    }

    draw(ctx) {
        this.currentView.draw(ctx);
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
        if (this.ui.mouseDown(event)) { return; }
        this.currentView.mouseDown(event); 
    }
    onMouseUp(event) {
        if (this.ui.mouseUp(event)) { return; }
        this.currentView.mouseUp(event); 
    }
    onMouseWheel(event) {
        // this.ui.onMouseWheel(event);
        this.currentView.onMouseWheel(event);
    }
    onMouseMove(event) {
        if (this.ui.mouseMove(event)) { return; }
        this.currentView.mouseMove(event);
    }
}