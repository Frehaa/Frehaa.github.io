class MelodyView { 
     constructor(controller, programState) {
        this.controller = controller;
        this.programState = programState;
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
            // Add a "Are you sure?" confirmation box, right now it is too easy to go back and leave everything.
            controller.returnToPreviousView();
        })
        this.ui.add(this.backButton);
    }

    draw(ctx) {
        this.programState.settings.currentMelodyView.draw(ctx);
        this.ui.draw(ctx);
    }

    update(deltaTime) {
        this.programState.settings.currentMelodyView.update(deltaTime)
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
        this.programState.settings.currentMelodyView.mouseDown(event); 
    }
    onMouseUp(event) {
        if (this.ui.mouseUp(event)) { return; }
        this.programState.settings.currentMelodyView.mouseUp(event); 
    }
    onMouseWheel(event) {
        // this.ui.onMouseWheel(event);
        this.programState.settings.currentMelodyView.onMouseWheel(event);

        // if (trainingGameManager.settings.paused) {
        //     const min = trainingGameManager.resetTime;
        //     const max = trainingGameManager.getMaxTime();
        //     const newElapsedTime = clamp(fallingNotesView.elapsedTimeMs + e.deltaY * 5, min, max);
        //     fallingNotesView.setElapsedTimeMs(newElapsedTime);
        //     /// newElapsedTime goes form 500 to 2030 
        //     // So slider should be 0 at 500 and 1 and 2030 (or reverse maybe)
        //     elapsedTimeSlider.sliderMarkerRatio = clamp((newElapsedTime / (max - min)), 0, 1);
        // }
    }
    onMouseMove(event) {
        if (this.ui.mouseMove(event)) { return; }
        this.programState.settings.currentMelodyView.mouseMove(event);
    }
    
}