"use strict";
const DEFAULT_DRAWABLE_SETTINGS = { red: 0, green: 0, blue: 0, fill: true, alpha: 0, visible: false };
const FLOATING_POINT_ERROR_MARGIN = 0.000001;
const ENTER_KEY = "Enter";

function float_equal(a, b) {
    return Math.abs(a - b) < FLOATING_POINT_ERROR_MARGIN;   1.0 - (direction.x**2 + direction.y**2) > 0.000001 
}

function normalize(v) {
    let length = Math.sqrt(v.x**2 + v.y**2);
    return { 
        x: v.x / length,
        y: v.y / length
    };
}

function svmult(s, v) {
    return {x: s * v.x, y: s * v.y};
}

function vadd(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}

function length(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2);
}

function parseAnimationCode() {
    let state = document.state;
    state.items = [];
    state.animationList = new LinkedList();

    function Circle(x, y, radius, settings = {}) {
        let c = {
            ...DEFAULT_DRAWABLE_SETTINGS, // Initialize with default settings
            position: {x, y},
            radius: radius,
            draw: function(ctx) {
                let r = this.red * 255;
                let g = this.green * 255;
                let b = this.blue * 255;
                let a = this.alpha;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);

                if (c.fill) {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    ctx.fill();
                } else {
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    ctx.stroke();
                }
            },
            boundary: function(direction) {
                if (!float_equal(length(direction), 1)) throw new Error('Direction was not normalized');
                return vadd(this.position, svmult(this.radius, direction));
            },
            ...settings // Overwrite according to given parameters
        };
        state.items.push(c);
        return c;
    }

    function evalFromTo(from, to) {
        // From and to are functions which are partially evaluated with the
        // objects to which is to and from. But they need to know the direction
        // of the line to tell where their own boundary is.
        let direction = { x: to.position.x - from.position.x, y: to.position.y - from.position.y };
        direction = normalize(direction);
        from = from.boundary(direction); 
        to = to.boundary(svmult(-1, direction));
        return [from, to];
    }

    function Line(from, to, settings = {}) {
        let [start, end] = evalFromTo(from, to);
        let l = {
            ...DEFAULT_DRAWABLE_SETTINGS,
            start,
            end,
            draw: function(ctx) {
                let r = l.red * 255;
                let g = l.green * 255;
                let b = l.blue * 255;
                let a = l.alpha;
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.beginPath();
                ctx.moveTo(l.start.x, l.start.y);
                ctx.lineTo(l.end.x, l.end.y);
                ctx.stroke();
            },
            ...settings
        };
        state.items.push(l);
        return l;
    }

    function Arrow(from, to, settings = {}) {
        // TODO: Evaluate from and to
        let [start, end] = evalFromTo(from, to);
        let a = {
            ...DEFAULT_DRAWABLE_SETTINGS,
            start,
            end,
            draw: function(ctx) {
                ctx.strokeStyle = `rgba(0,0,0,1)`;
                ctx.beginPath();
                ctx.moveTo(a.start.x, a.start.y);
                ctx.lineTo(a.end.x, a.end.y);
                // TODO: Draw arrow tip
                ctx.stroke();
            },
            ...settings
        };
        state.items.push(a);
        return a;
    }

    function From(target) {
        // return (to) => { return target.} 
        return target;
    }

    function To(target) {
        return target;
    }

    function Show(target) {
        let animation = (elapsed) => {
            target.visible = true;
            target.alpha = 1;
            return elapsed;
        }
        return state.registerAnimation(animation, 0);
    }

    function FadeIn(target, duration) {
        let animation = (elapsed) => {
            let progress = Math.min(elapsed / duration, 1);
            target.alpha = progress;
            target.visible = true;
            return Math.max(elapsed - duration, 0);
        }
        return state.registerAnimation(animation, duration);
    }

    function FadeOut(target, duration) {
        let animation = (elapsed) => {
            if (elapsed > duration) {
                elapsed = duration;
                target.visible = false;
            }
            let progress = elapsed / duration;
            target.alpha = (1 - progress);
            return Math.max(elapsed - duration, 0);
        }
        return state.registerAnimation(animation, duration);
    }    

    function Wait(duration) {
        let animation = (elapsed) => {
            return Math.max(elapsed - duration, 0);
        }
        return state.registerAnimation(animation, duration);
    }

    function MoveTo(target, x, y, duration) {
        let originalX = target.position.x;
        let originalY = target.position.y;
        let dx = x - originalX;
        let dy = y - originalY;

        let animation = (elapsed) => {
            elapsed = Math.min(elapsed, duration);
            let progress = elapsed / duration;
            target.position.x = originalX + dx * progress;
            target.position.y = originalY + dy * progress;
            return Math.max(elapsed - duration, 0);
        }
        return state.registerAnimation(animation, duration);
    }

    function RunConcurrently(...animations) {
        let updateFunctions = [];
        let maxDuration = 0;
        animations.forEach(idx => {
            let animation = state.deregisterAnimation(idx);
            updateFunctions.push(animation.update);
            maxDuration = Math.max(maxDuration, animation.duration);
        }); 

        let animation = (elapsed) => {
            updateFunctions.forEach(u => u(elapsed));
            return Math.max(elapsed - maxDuration, 0);
        }
        return state.registerAnimation(animation, maxDuration);
    }

    try {
        let textarea = document.getElementById("canvas-code");
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        // This shit is pretty sexy if I say so myself. All the functions are written manually to the animations array.
        // They are then automatically added as function parameters to 'f' with their actual names, and the 'f' is called with them in guaranteed correct order. 
        let animations = [Circle, Arrow, Line, From, To, Show, FadeIn, FadeOut, MoveTo, Wait, RunConcurrently];
        let f = new Function('ctx',...animations.map(a => a.name), textarea.value);
        f(ctx, ...animations);
    } catch (_ignored) {
        console.log(_ignored)
    } // Who cares about a little error among friends.


    // Update UI
    let rangeInput = document.getElementById('time-range');
    rangeInput.max = state.getTotalAnimationDuration();

    let animationButtonDiv = document.getElementById('animation-list');
    function addAnimationInBetweenButton(text, elapsed) {
        let button = document.createElement('button');
        button.innerHTML = text;
        let onClick = (time) => {
            return () => {
                state.setPlaying(false);
                updateUiAndDraw(time);
            };
        }
        button.addEventListener('click', onClick(elapsed));
        animationButtonDiv.appendChild(button);
    }

    let i = 0;
    let elapsed = 0;
    animationButtonDiv.innerHTML = '';
    addAnimationInBetweenButton(i, elapsed);
    for (let a of state.animationList.items()) {
        elapsed += a.duration;
        addAnimationInBetweenButton(++i, elapsed);
    }
}

function draw(time) {
    let canvas = document.getElementById('canvas');
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext('2d'); 

    let state = document.state;

    // Handle animations
    let remainingTime = time;
    for (let item of state.animationList.items()) {
        remainingTime = item.update(remainingTime);
        if (remainingTime == 0) break;
    }

    // Draw elements
    ctx.clearRect(0, 0, width, height);
    state.items.forEach(item => {
        if (item.visible) {
            item.draw(ctx);
        }
    });
}

function updateUiAndDraw(time) {
    let rangeInput = document.getElementById('time-range');
    let durationText = document.getElementById('duration-text');
    let totalAnimationDuration = document.state.getTotalAnimationDuration();
    rangeInput.value = time;
    durationText.value = Math.round(Math.min(time, totalAnimationDuration)) + "ms";
    draw(time);
}

function startAnimation() {
    let state = document.state;
    state.setPlaying(true);

    function animate(time) {
        updateUiAndDraw(time);
        if (time >= state.getTotalAnimationDuration()) state.setPlaying(false);
        if (state.isPlaying) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

// Two (simple) ways to handle correctly drawing when jumping in time. 
//  1. Copy an initial state of the objects and update these each draw
//  2. Draw each frame once, store it in memory, and paint it on demand.
// (1.) requires handling copying elements correctly and will mean a lot of "wasted" operations
// (2.) requires a huge amount of memory for big canvas with long animations. (720x480) * 1000 frames is more than a gigabyte.
function initialize() {
    let playButton = document.getElementById('play-button');
    document.state = {
        items: [],
        // NOTE: An animation is an object with an update function and a duration value
        animationList: new LinkedList(), 
        totalAnimationDuration: 0,
        elapsed: 0,
        isPlaying: false,
        setPlaying(playing) {
            this.isPlaying = playing;
            if (this.isPlaying) {
                playButton.innerHTML = "Stop";
            } else {
                playButton.innerHTML = "Play";
            }
            
        },
        registerAnimation(update, duration) {
            this.totalAnimationDuration += duration;
            return this.animationList.addLast({ update, duration });
        }, 
        deregisterAnimation(animationId) { // Returns the deregistered animation
            let element = this.animationList.remove(animationId);
            if (element === null) throw new Error("Failed to deregister animation: The id was not registered.");
            this.totalAnimationDuration -= element.duration;
            return element;
        },
        getTotalAnimationDuration() { // Alternatively calculate on demand. This seems to work fine though.
            return this.totalAnimationDuration;
        }, 
        getElapsed() {
            return elapsed;
        }
    };
    let state = document.state;

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.save();

    parseAnimationCode();
    startAnimation();

    let rangeInput = document.getElementById('time-range');
    rangeInput.addEventListener('input', (e) => {
        state.setPlaying(false);
        updateUiAndDraw(e.target.value);

    });

    playButton.addEventListener('click', (_) => {
        if (state.isPlaying) {
            state.setPlaying(false);
        } else if (rangeInput.value == state.getTotalAnimationDuration()) { // Restart from beginning when finished
            state.setPlaying(true);
            startAnimation();
        } else {
            startAnimation();
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.ctrlKey && event.key == ENTER_KEY) {
            ctx.restore();
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            parseAnimationCode();
            updateUiAndDraw(1);
        }
    });
}