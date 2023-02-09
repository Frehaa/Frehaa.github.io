function combineFrames(f1, f2) {
    return {
        draw: function(ctx) {
            ctx.save()
            f1.draw(ctx);
            ctx.restore()
            f2.draw(ctx);
        }, 
        mouseMove: function() {
            if (f1.mouseMove) f1.mouseMove();
            if (f2.mouseMove) f2.mouseMove();
        }, 
        mouseDown: function() {
            if (f1.mouseDown) f1.mouseDown();
            if (f2.mouseDown) f2.mouseDown();
        }, 
        mouseUp: function() {
            if (f1.mouseUp) f1.mouseUp();
            if (f2.mouseUp) f2.mouseUp();

        }, 
        frameEnd: function() {
            if (f1.frameEnd) f1.frameEnd();
            if (f2.frameEnd) f2.frameEnd();

        }, 
        frameStart: function() {
            if (f1.frameStart) f1.frameStart();
            if (f2.frameStart) f2.frameStart();
        }
    }
}