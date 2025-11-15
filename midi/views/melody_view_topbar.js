class MelodyViewTopbar extends InteractableUIELement {
    constructor(controller) {

        // Back button
        // Settings button
        // Select View dropdown
        // Slow start putton
        // Quick start putton

        this.controller = controller;

        const customMelodyMenuBarButton = function(ctx) {
            ctx.lineWidth = this.lineWidth;
            if (this.hover) {
                ctx.strokeStyle = 'red';
            } else {
                ctx.strokeStyle = 'blue';
            }
            ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
            // TODO: Center text 
            ctx.fillText(this.text, this.position.x, this.position.y);
        }

        this.backButton = new Button({
            position: {x: 100, y: 100},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Back',
            draw: customMelodyMenuBarButton
        });
        this.backButton.addCallback(button => {
            controller.changeToStartScreenView();
        });

        this.settingsButton = new Button({
            position: {x: 220, y: 100},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Settings',
            draw: customMelodyMenuBarButton
        });
        this.settingsButton.addCallback(button => {
            controller.changeToSettingsView();
        });

        this.selectViewDropdown = new Button({
            position: {x: 100, y: 100},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'selectView',
            draw: customMelodyMenuBarButton
        });
        this.selectViewDropdown.addCallback(button => {
            controller.changeMelodyView();
        });

        this.slowStartButton = new Button({
            position: {x: 100, y: 100},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Slow Start',
            draw: customMelodyMenuBarButton
        });
        this.slowStartButton.addCallback(button => {
            controller.changeToSetupPlayView();
        });

        this.quickStart = new Button({
            position: {x: 100, y: 100},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Start',
            draw: customMelodyMenuBarButton
        });
        this.quickStart.addCallback(button => {
            controller.play();
        });


    }

    draw(ctx) {

    }
    mouseMove(event) {

    } 
    mouseDown(event) {

    }
    mouseUp(event) {

    }
}