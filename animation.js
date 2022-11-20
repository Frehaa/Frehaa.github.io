function parseAnimationCode() {
    let state = document.state;

    function Circle(x, y, radius) {
        let c = {
            type: 'CIRCLE',
            x: x,
            y: y,
            r: radius,
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
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        };
        state.items.push(c);
        return c;
    }

    function FadeIn(target, duration) {
        let animation = (elapsed) => {
            let progress = Math.min(elapsed / duration, 1);
            target.alpha = progress;
            target.visible = true;
            return Math.max(elapsed - duration, 0);
        }
        state.totalAnimationDuration += duration;
        state.durations.push(duration);
        state.animations.push(animation);
        return animation;
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
        state.totalAnimationDuration += duration;
        state.durations.push(duration);
        state.animations.push(animation);
        return animation;
    }    

    function Wait(duration) {
        let animation = (elapsed) => {
            return Math.max(elapsed - duration, 0);
        }
        state.totalAnimationDuration += duration;
        state.durations.push(duration);
        state.animations.push(animation);
        return animation;
    }

    function RunConcurrently(...animations) {
        let duration = 0;
        animations.forEach(idx => {
            // Remove duration from global state
            let duration = state.durations[idx];
            state.totalAnimationDuration - duration;


        });

        let animation = (elapsed) => {
            return Math.max(elapsed - duration, 0);
        }
        state.totalAnimationDuration += duration;
        state.durations.push(duration);
        state.animations.push(animation);
        return animation;
    }

    try {
        let textarea = document.getElementById("canvas-code");
        let f = new Function('Circle', 'FadeIn', 'Wait', 'FadeOut', 'RunConcurrently', textarea.value);
        f(Circle, FadeIn, Wait, FadeOut, RunConcurrently);
    } catch (_ignored) {
        console.log(_ignored)
    } // Who cares about a little error.


    // Update UI
    let rangeInput = document.getElementById('time-range');
    let animationList = document.getElementById('animation-list');

    rangeInput.max = state.totalAnimationDuration;
    for (let i in state.animations) {
        let button = document.createElement('button');
        button.innerHTML = i;
        animationList.appendChild(button);
    }
}

function draw(time) {
    console.log(time);
    let canvas = document.getElementById('canvas');
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext('2d'); 

    let state = document.state;
    let currentAnimationIndex = 0;
    let animationCount = state.animations.length;
    // Handle animations
    let remainingDt = time;
    while (currentAnimationIndex != animationCount && remainingDt > 0) {
        let animation = state.animations[currentAnimationIndex];
        remainingDt = animation(remainingDt);
        // Go to next animation if current one is finished
        if (remainingDt > 0) currentAnimationIndex++;
    }; 

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
        animations: [],
        durations: [],
        totalAnimationDuration: 0,
        isPlaying: false,
        setPlaying(playing) {
            state.isPlaying = playing;
            playButton.innerHTML = playing? "Stop" : "Play";
        }
    };
    let state = document.state;

    parseAnimationCode();
    startAnimation();

    rangeInput.addEventListener('input', (e) => {
        state.setPlaying(false);
        durationText.value = Math.round(e.target.value) + "ms";
        draw(e.target.value);

    });

    playButton.addEventListener('click', (e) => {
        if (state.isPlaying) {
            state.setPlaying(false);
        } else if (rangeInput.value == state.totalAnimationDuration) { // Start from beginning
            rangeInput.value = 0;
            durationText.value = 0 + "ms";
            state.setPlaying(true);
            startAnimation();
        } else {
            startAnimation();
        }
        
        
    });
    
}