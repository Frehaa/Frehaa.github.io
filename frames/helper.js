function combineFrames(...frames) {
    return {
        draw: function(ctx) {
            frames.forEach(f => {
                ctx.save()
                f.draw(ctx);
                ctx.restore()
            });
        }, 
        mouseMove: function() {
            frames.forEach(f => {
                if (f.mouseMove && f.isInteractable) f.mouseMove();
            });
        }, 
        mouseDown: function() {
            frames.forEach(f => {
                if (f.mouseDown && f.isInteractable) f.mouseDown();
            });
        }, 
        mouseUp: function() {
            frames.forEach(f => {
                if (f.mouseUp && f.isInteractable) f.mouseUp();
            });
        }, 
        frameEnd: function() {
            frames.forEach(f => {
                if (f.frameEnd) f.frameEnd();
            });
        }, 
        frameStart: function() {
            frames.forEach(f => {
                if (f.frameStart) f.frameStart();
            });
        },
        isInteractable: true
    }
}
