function animateCanvasCode() {
    let textarea = document.getElementById("canvas-code");
    let rangeInput = document.getElementById('time-range');
    let animationList = document.getElementById('animation-list');

    document.state = {
        items: [],
        animations: [],
        durations: [],
        totalAnimationDuration: 0,
        lastTimestamp: 0,
        playing: false
    };
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

    try {
        let f = new Function('Circle', 'FadeIn', 'Wait', 'FadeOut', textarea.value);
        f(Circle, FadeIn, Wait, FadeOut);
    } catch (_ignored) {
        console.log(_ignored)
    } // Who cares about a little error.

    rangeInput.max = state.totalAnimationDuration;
    for (let i in state.animations) {
        let button = document.createElement('button');
        button.innerHTML = i;
        animationList.appendChild(button);
    }
}

function draw(time) {
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
        // console.log(remainingDt, currentAnimationIndex)
        let animation = state.animations[currentAnimationIndex];
        remainingDt = animation(remainingDt);
        // Go to next animation if current one is finished
        if (remainingDt > 0) currentAnimationIndex++;
    }; 

    // Draw elements
    ctx.clearRect(0, 0, width, height);
    state.items.forEach(item => {
        // console.log(item);
        if (item.visible) {
            item.draw(ctx);
        }
    });
}

function startAnimation() {
    let rangeInput = document.getElementById('time-range');
    let durationText = document.getElementById('duration-text');

    let state = document.state;
    state.playing = true;

    function animate(time) {
        rangeInput.value = time;
        durationText.value = Math.round(Math.min(time, state.totalAnimationDuration)) + "ms";
        let dt = time - state.lastTimestamp;
        state.lastTimestamp = time;
        draw(time);

        if (time >= state.totalAnimationDuration) state.playing = false;
        if (state.playing) requestAnimationFrame(animate);
    }

    // draw(1000);

    requestAnimationFrame(animate);
}

function initialize() {
    animateCanvasCode();

    startAnimation();

    let state = document.state;
    let rangeInput = document.getElementById('time-range');
    rangeInput.addEventListener('input', (e) => {
        state.playing = false;
        let durationText = document.getElementById('duration-text');
        durationText.value = Math.round(e.target.value) + "ms";
        draw(e.target.value);

    });

    rangeInput.addEventListener('onchange', (e) => {
        console.log("change", e.target.value);
    });
    
}