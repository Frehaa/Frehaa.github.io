const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const DELETE_KEY = "Delete";
const HOME_KEY = "Home";
const END_KEY = "End";
const PAGE_DOWN_KEY = "PageDown";
const PAGE_UP_KEY = "PageUp";
const BAKCSPACE_KEY = "Backspace";
const Z_KEY = "z";
const O_KEY = "o";
const B_KEY = "b";
const F1_KEY = "F1";
const F2_KEY = "F2";

const DIRECTION_DOWN = "DOWN";
const DIRECTION_UP = "UP";

function initializeSlideshowState() {
    return {
        mousePosition: {x:0, y: 0},
        slides: [],
        currentSlideIndex: 0,
        showSlideNumber: false,
        currentSlide: function() {
            return this.slides[this.currentSlideIndex];
        },
        startSlideShow: function(ctx) {
            this.slides[this.currentSlideIndex].slideStart();
            requestAnimationFrame(() => {
                drawCurrentSlide(this, ctx)
            });
        },
        addSlide(slide) {
            this.slides.push(slide);
        },
    };
}

function drawCurrentSlide(state, ctx) {
    const width = ctx.canvas.width
    const height = ctx.canvas.height

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    state.slides[state.currentSlideIndex].draw(ctx);
    ctx.restore();

    if (state.showSlideNumber) {
        ctx.strokeText((state.currentSlideIndex + 1).toString(), width - 100, height - 50);
    }
    requestAnimationFrame(() => {
        drawCurrentSlide(state, ctx)
    });
}

function combineSlides(...slides) {
    return {
        slides,
        draw: function(ctx) {
            this.slides.forEach(f => {
                ctx.save()
                f.draw(ctx);
                ctx.restore()
            });
        }, 
        mouseMove: function() {
            this.slides.forEach(f => {
                if (f.mouseMove && f.isInteractable) f.mouseMove();
            });
        }, 
        mouseDown: function(e) {
            this.slides.forEach(f => {
                if (f.mouseDown && f.isInteractable) f.mouseDown(e);
            });
        }, 
        mouseUp: function(e) {
            this.slides.forEach(f => {
                if (f.mouseUp && f.isInteractable) f.mouseUp(e);
            });
        }, 
        slideEnd: function() {
            this.slides.forEach(f => {
                if (f.slideEnd) f.slideEnd();
            });
        }, 
        slideStart: function() {
            this.slides.forEach(f => {
                if (f.slideStart) f.slideStart();
            });
        },
        isInteractable: true
    }
}

const DEFAULT_SLIDE = {
    draw: function() {},
    mouseMove: function() {},
    mouseDown: function() {},
    mouseUp: function() {},
    slideEnd: function() {},
    slideStart: function() {},
}

function createDrawSlide(draw) {
    return {
        ...DEFAULT_SLIDE,
        draw
    };
}

// Initializes: mouse and keyboard interactions with canvas to interact with a slide
function initializeSlideshowEventListeners(canvas, state) {
    const slides = state.slides;
    canvas.addEventListener('mousemove', function(e) {
        state.mousePosition = {
            x: (e.pageX - e.target.offsetLeft) * (canvas.width / canvas.clientWidth), 
            y: (e.pageY - e.target.offsetTop) * (canvas.height / canvas.clientHeight)
        };
        const slide = state.currentSlide();
        if (slide.isInteractable) slide.mouseMove();
    });

    canvas.addEventListener('mousedown', function(e) {
        const slide = state.currentSlide();
        if (slide.isInteractable) slide.mouseDown(e);
    });

    canvas.addEventListener('mouseup', function(e) {
        const slide = state.currentSlide();
        if (slide.isInteractable) slide.mouseUp(e);
    });

    document.addEventListener('keydown', function(e) {
        const previousSlideIndex = state.currentSlideIndex;
        switch (e.key) {
            case ARROW_RIGHT_KEY: {
                state.currentSlideIndex = Math.min(state.currentSlideIndex + 1, slides.length-1);
            } break;
            case ARROW_LEFT_KEY: {
                state.currentSlideIndex = Math.max(state.currentSlideIndex - 1, 0);
            } break;
            case HOME_KEY: {
                state.currentSlideIndex = 0;
            } break;
            case END_KEY: {
                state.currentSlideIndex = slides.length - 1;
            } break;
            case PAGE_DOWN_KEY: {
                state.currentSlideIndex = Math.min(state.currentSlideIndex + 10, slides.length-1);
            } break;
            case PAGE_UP_KEY: {
                state.currentSlideIndex = Math.max(state.currentSlideIndex - 10, 0);
            } break;
            case F1_KEY: {
                console.log(state.mousePosition);
                console.log(state.currentSlide());
            } break;
            case F2_KEY: {
                state.showSlideNumber = !state.showSlideNumber;
            } break;
           default: return;
        }
        if (previousSlideIndex != state.currentSlideIndex) {
            slides[previousSlideIndex].slideEnd();
            state.currentSlide().slideStart();
        }
    });
}

function fillTextCanvasCenter(ctx, text, y) {
    let canvas = ctx.canvas;
    let measure = ctx.measureText(text);
    let x = canvas.width / 2 - measure.width / 2;
    ctx.fillText(text, x, y);
}

function createBulletPointSlides(title, bullets, drawSettings) {
    let slides = [];
    for (let i = 0; i < bullets.length; i++) {
        slides.push(createDrawSlide(ctx => {
            ctx.font = drawSettings.titleFont;
            fillTextCanvasCenter(ctx, title, drawSettings.titleStart);
            ctx.font = drawSettings.bulletFont;
            for (let j = 0; j <= i; j++) {
                ctx.fillText(drawSettings.bullet + ' ' + bullets[j],
                            drawSettings.bulletStartLeft, 
                            drawSettings.bulletStartTop +
                                drawSettings.bulletOffset * j
                );
            }
        }));
    }

    if (drawSettings.bulletByBullet) {
        return slides;
    } else {
        return [slides[slides.length-1]];
    }

}

