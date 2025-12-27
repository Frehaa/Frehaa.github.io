class SettingsView { 
     constructor(controller) {
        this.controller = controller;
        this.ui = new UI();

        const customStartScreenViewButtonDraw = function(ctx) {
            ctx.lineWidth = this.lineWidth;
            if (this.hover) {
                ctx.strokeStyle = 'red';
            } else {
                ctx.strokeStyle = 'blue';
            }
            ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
            ctx.textAlign = 'center';
            ctx.baseline = 'middle';
            ctx.font = "15px Arial";
            ctx.fillText(this.text, this.position.x + this.size.width/2, this.position.y + this.size.height/2);
        }

        this.backButton = new Button({
            position: {x: 100, y: 20},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Back',
            draw: customStartScreenViewButtonDraw
        });
        this.backButton.addCallback(() => {
            controller.returnToPreviousView();
        });

        this.repeatCheckbox = new Checkbox({
            position: {x: 100, y: 120},
            size: {width: 100, height: 50},
            lineWidth: 3,
        });
        this.repeatCheckbox.addCallback(checkbox => {
            console.log('Settings checkbox clicked', checkbox.checked);
            
        });

        this.ui.add(this.backButton);
        this.ui.add(this.repeatCheckbox);
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