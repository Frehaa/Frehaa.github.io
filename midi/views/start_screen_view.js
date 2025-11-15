class StartScreenView { 
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
            // TODO: Center text 
            ctx.fillText(this.text, this.position.x, this.position.y);
        }

        this.continueButton = this._createContinueButton(customStartScreenViewButtonDraw)
        this.selectFileButton = this._createSelectFileButton(customStartScreenViewButtonDraw);
        this.usePremadeMelodyButton = this._createSelectPremadeButton(customStartScreenViewButtonDraw);
        this.settingsButton = this._createSettingsButton(customStartScreenViewButtonDraw);

        this.ui.add(this.continueButton);
        this.ui.add(this.selectFileButton);
        this.ui.add(this.usePremadeMelodyButton);
        this.ui.add(this.settingsButton);
    }

    draw(ctx) {
        this.drawBackground(ctx);
        this.ui.draw(ctx);
    }

    update(deltaTime) {

    }

    drawBackground(ctx) {

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

    _createContinueButton(draw) {
        const button = new Button({
            position: {x: 100, y: 20},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Continue',
            draw // TODO: If no melody is selected then it is disabled and grayed out. So this UI element should be a listener on the melody changed event
        });
        button.addCallback(() => {
            this.controller.goToView(Views.MELODY);
        });

        return button;
    }

    _createSelectFileButton(draw) {
        const button = new Button({
            position: {x: 100, y: 100},
            size: {width: 100, height: 50},
            lineWidth: 3,
            text: 'Select File',
            draw
        });
        button.addCallback(() => {
            this.controller.selectFileFromFilePicker(file => {
                const result = file; // PARSE FILE
                console.log(file);
                
                if (result) { // If successfully selected file
                    this.controller.setMelody(result);
                    this.controller.changeToMelodyView();
                }
            }, error => {
                console.log(error);
                this.controller.displayErrorMessage('Failed to select file', error);
            });

            
        });
        return button;
    } 
    _createSelectPremadeButton(draw) {
        const button = new Button({
            position: {x: 100, y: 200},
            size: {width: 100, height: 50},
            lineWidth: 3, 
            text: 'Use Existing Melody',
            draw
        });
        button.addCallback(() => {
            this.controller.goToView(Views.MELODY_SELECT);
        });
        return button;
    } 

    _createSettingsButton(draw) {
        const button = new Button({
            position: {x: 100, y: 300},
            size: {width: 100, height: 50},
            lineWidth: 3, 
            text: 'Settings',
            draw
        });
        button.addCallback(() => {
            this.controller.goToView(Views.SETTINGS);
        });

        return button;
    }


}