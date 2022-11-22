function parseAnimationCode() {
    let state = document.state;

    function Circle(x, y, radius) {
        let c = {
            type: 'CIRCLE',
            position: {x, y},
            radius: radius,
            red: 1,
            green: 0,
            blue: 0,
            alpha: 0,
            visible: false,
            draw: function(ctx) {
                let r = c.red * 255;
                let g = c.green * 255;
                let b = c.blue * 255;
                let a = c.alpha;
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        };
        state.items.push(c);
        return c;
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
        let animations = [Circle, Show, FadeIn, FadeOut, MoveTo, Wait, RunConcurrently];
        let f = new Function(...animations.map(a => a.name), textarea.value);
        f(...animations);
    } catch (_ignored) {
        console.log(_ignored)
    } // Who cares about a little error.


    // Update UI
    let rangeInput = document.getElementById('time-range');
    let animationButtonDiv = document.getElementById('animation-list');

    rangeInput.max = state.totalAnimationDuration;
    for (let i in state.animations) {
        let button = document.createElement('button');
        button.innerHTML = i;
        animationButtonDiv.appendChild(button);
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

function startAnimation() {
    let rangeInput = document.getElementById('time-range');
    let durationText = document.getElementById('duration-text');

    let state = document.state;
    state.setPlaying(true);

    function animate(time) {
        rangeInput.value = time;
        durationText.value = Math.round(Math.min(time, state.totalAnimationDuration)) + "ms";
        draw(time);

        if (time >= state.totalAnimationDuration) state.setPlaying(false);
        if (state.isPlaying) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}


function initialize() {
    let playButton = document.getElementById('play-button');
    let rangeInput = document.getElementById('time-range');
    let durationText = document.getElementById('duration-text');

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
            if (element !== null) {
                this.totalAnimationDuration -= element.duration;
            }
            return element;
        },
        getTotalAnimationDuration() {
            return this.totalAnimationDuration;
        }, 
        getElapsed() {
            return elapsed;
        }
    };
    let state = document.state;

    parseAnimationCode();

    // let items = state.animationList.items();
    // for (let i of items) {
    //     console.log(i);
    // }
    // return;
    startAnimation();

    rangeInput.addEventListener('input', (e) => {
        state.setPlaying(false);
        durationText.value = Math.round(e.target.value) + "ms";
        draw(e.target.value);

    });

    playButton.addEventListener('click', (e) => {
        if (state.isPlaying) {
            state.setPlaying(false);
        } else if (rangeInput.value == state.getTotalAnimationDuration()) { // Start from beginning
            rangeInput.value = 0;
            durationText.value = 0 + "ms";
            state.setPlaying(true);
            startAnimation();
        } else {
            startAnimation();
        }
        
        
    });
    
}