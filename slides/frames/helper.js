function combineFrames(...frames) {
    return {
        frames,
        draw: function(ctx) {
            this.frames.forEach(f => {
                ctx.save()
                f.draw(ctx);
                ctx.restore()
            });
        }, 
        mouseMove: function() {
            this.frames.forEach(f => {
                if (f.mouseMove && f.isInteractable) f.mouseMove();
            });
        }, 
        mouseDown: function() {
            this.frames.forEach(f => {
                if (f.mouseDown && f.isInteractable) f.mouseDown();
            });
        }, 
        mouseUp: function() {
            this.frames.forEach(f => {
                if (f.mouseUp && f.isInteractable) f.mouseUp();
            });
        }, 
        frameEnd: function() {
            this.frames.forEach(f => {
                if (f.frameEnd) f.frameEnd();
            });
        }, 
        frameStart: function() {
            this.frames.forEach(f => {
                if (f.frameStart) f.frameStart();
            });
        },
        isInteractable: true
    }
}
