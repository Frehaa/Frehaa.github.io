// ########### ANIMATION STUFF ##############
function playback(ctx, endTime, playbackState, createDraw) {
    const canvas = ctx.canvas;
    let previous = 0
    let elapsed = 0
    const [state, draw] = createDraw();
    const animate = t => {
        if (playbackState.pause) {
            previous = t;
            return requestAnimationFrame(animate)
        } 

        elapsed += (t - previous) * playbackState.speedMultiplier
        elapsed = clamp(0, elapsed, endTime);
        previous = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw(ctx, elapsed, state);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(t => {
        previous = t;
        animate(t);
    });
}

//TODO: Make the line draw animation 3 dimensional
function animatePointLine(ctx, framesPerSecond, endTime, points, playbackState) {
    const timeStep = 1000 / framesPerSecond; 
    const canvas = ctx.canvas
    let previous = 0;
    let elapsed = 0;
    const animate = t => {
        if (playbackState.pause) {
            previous = t;
            return requestAnimationFrame(animate)
        } 

        elapsed += (t - previous) * playbackState.speedMultiplier;
        elapsed = clamp(0, elapsed, endTime);
        previous = t;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // const frameEnd = 3;
        const frameEnd = Math.floor(elapsed / timeStep);

        ctx.beginPath();
        ctx.moveTo(...points[0]);
        for (let i = 1; i < frameEnd; i++) {
            // DEBUG COLORING
            // if (i % 3 === 0) {
            //     ctx.strokeStyle = 'red'
            // } else if (i % 3 === 1) {
            //     ctx.strokeStyle = 'blue'
            // } else if (i % 3 === 2) {
            //     ctx.strokeStyle = 'green'
            // }

            let [x0, y0] = points[i-1];
            let [x1, y1] = points[i];
            // Wrap around horizontally
            
            let x0Wraps = Math.floor(x0 / canvas.width); 
            let x1Wraps = Math.floor(x1 / canvas.width); 
            x1 = x1 - x0Wraps * canvas.width;

            let wrapDiffs = x1Wraps - x0Wraps;
            for (let j = 0; j < wrapDiffs; j++) {
                // x0 = x0 % canvas.width;
                const distW = canvas.width - x0;
                const distX = x1 - x0;
                const ratioX = distW / distX;
                const distY = y1 - y0;
                const y = y0 + distY * ratioX;
                x0 = 0;
                y0 = y;
                ctx.lineTo(canvas.width, y0);
                ctx.moveTo(x0, y0)
                x1 = x1 - canvas.width;
            }
            while (x1 < 0) {
                const distX = Math.abs(x1 - x0);
                const distW = Math.abs(x0);
                const ratioX = distW / distX;
                const distY = y1 - y0;
                const y = y0 + distY * ratioX;
                x0 = canvas.width;
                y0 = y;
                ctx.lineTo(0, y0);
                ctx.moveTo(x0, y0)
                x1 = x1 + canvas.width;
            }


            // TODO: Wrap around
            // x = x % canvas.width;
            // if (x < 0) {
            //     x = canvas.width + x;
            // }
            // y = y % canvas.height;
            // if (y < 0) {
            //     y = canvas.height + y;
            // }

            ctx.lineTo(x1, y1);
            // DEBUG COLORING
            // ctx.stroke();
            // ctx.beginPath()
            // ctx.moveTo(x1, y1);
        }
        ctx.stroke();
            // return

        requestAnimationFrame(animate)
    };
    requestAnimationFrame(t => {
        previous = t;
        animate(t);
    });
}

function pyramidUpdater(timeStep) {
    const state = {
        i: 0,
        k: 0,
        timeToUpdate: 1,
        velocity: [5 / timeStep, 0.0]
    };

    return [state, (currentPosition, currentTime, state) => {
        let {i, k, timeToUpdate, velocity} = state;
        // l(currentPosition, velocity, timeStep)
        const newPosition = [
            currentPosition[0] + velocity[0] * timeStep,
            currentPosition[1] + velocity[1] * timeStep
        ];

        // Rotate 
        if (i % timeToUpdate === 0) {
            state.i = 0;
            let tmp = velocity[0];
            if (k % 2 === 0) {
                state.velocity[0] = velocity[1];
                state.velocity[1] = tmp;
            } else {
                state.velocity[0] = -velocity[1];
                state.velocity[1] = tmp;
                state.timeToUpdate++
            }
            state.k++;
        }
        state.i++

        return newPosition
    }];
}

function spiralUpdater(timeStep) {
    const state = {
        r: 0,
        angle: 0
    };

    return [state, (currentPosition, currentTime, state) => {
        if (!state.center) {
            state.center = currentPosition;
        }
        state.r += 0.01 * timeStep;
        state.angle += 0.01 * timeStep;

        const x = state.r * Math.cos(state.angle);
        const y = state.r * Math.sin(state.angle);

        return [
            state.center[0] + x,
            state.center[1] + y,
        ];
    }];
}

// Creates a shape of points using a given update function.
function createPointShape(framesPerSecond, startPosition, duration, createUpdate) {
    const timeStep = 1000 / framesPerSecond; 
    const positions = [];
    let currentPosition = startPosition;
    positions.push(currentPosition);
    const [state, update] = createUpdate(timeStep);
    let currentTime = 0;
    while (currentTime < duration) {
        currentPosition = update(currentPosition, currentTime, state);
        positions.push(currentPosition);

        currentTime += timeStep
    }
    return positions;
}



// ################ FUNCTIONALITY TESTING #################
function playgroundCode() {
    const ctx = document.getElementById('note-canvas').getContext('2d');
    const endTime = getPlayTrackEndMsTime(noteEvents)
    return playback(ctx, endTime, playbackState, () => {
        const width = ctx.canvas.width - 400;
        const offsetY = ctx.canvas.height - 50;
        const noteFill = (note, i) => {
            return [ "#54478cff", "#2c699aff", "#048ba8ff", "#0db39eff", "#16db93ff", "#83e377ff", "#b9e769ff", "#efea5aff", "#f1c453ff", "#f29e4cff", ][i % 10];
        };
        return [{}, (ctx, elapsed, state) => {
            drawFallingNotes(ctx, [{
                "note": 60,
                "start": 0,
                "velocity": 78,
                "end": 1000,
            }], elapsed, {msToPixel: 0.27, noteFill, topLineHeight: 600});
            drawNoteNamesAndTopLine(600)
            drawTimeBar(ctx, elapsed, endTime, {
                width, offsetX: 200, offsetY, notchHeight: 6, font: "18px Courier New", textColor: 'black', lineColor: 'black'
            });
            playbackState.pause = true
        }];
    });

    const framesPerSecond = 300;
    // const positions = [
    //     [canvas.width / 2, canvas.height / 2],
    //     [0.1 * canvas.width,  50],
    //     [0.7 * canvas.width,  canvas.height -100]
    // ];
    const positions = createPointShape(framesPerSecond, [canvas.width / 2, canvas.height / 2], endTime, spiralUpdater);
}

function keyMatchGamePlaygroundCode() {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    function drawGroup(ctx, group) {
        const marginX = 450;
        const marginY = 500;
        
        const width = 100;
        const height = 80;
        const offSetX = 10;
        ctx.font = "48px Courier New";
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        for (const val of group) {
            ctx.strokeRect(marginX + (width + offSetX) * (val-1), marginY, width, height)
            ctx.fillText(val, marginX + (width + offSetX) * (val-1) + width / 2, marginY + height/2)
        }
    }

    const numbers = 4;

    // Test functionality I want on keyboard

    function createRandomGroups(length) {
        const result = [];
        for (let i = 0; i < length; i++) {
            const groupsSize = Math.round(Math.random() * numbers) + 1;
            const values = shuffle([1,2,3,4]);
            result.push(values.slice(numbers-groupsSize));
        }
        return result;
    }

    const state = {
        // groups: [[1], [2], [3], [4], [5], [1, 2], [1,2, 3], [2,3,4, 5], [1,2,3,4, 5]],
        groups: createRandomGroups(100),
        currentGroupIndex: 0,
        currentlyPressed: new Set()
    }

    function drawAllGroups() {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(0, state.currentGroupIndex * 100);
        for (let i = 0; i < state.groups.length; i++) {
            if (i === state.currentGroupIndex) {
                ctx.strokeStyle = 'red'
            } else {
                ctx.strokeStyle = 'black'
            }
            drawGroup(ctx, state.groups[i])
            ctx.translate(0, -100)
        }
        ctx.restore();
        requestAnimationFrame(drawAllGroups);
    }
    requestAnimationFrame(drawAllGroups)

    let currentOffset = 0;
    function keyInGroup(key, currentGroup) {
        return currentGroup.indexOf(key) >= 0;
    }

    const currentlyPressed = new Set();

    // TODO: what happens if we miss a key up event because the window did not have focus?
    window.addEventListener('keydown', e => {
        let key = e.key;
        if (currentlyPressed.has(key)) return;
        currentlyPressed.add(key);

        switch (key) {
            case '1': 
            case '2': 
            case '3': 
            case '4': 
            case '5': 
                state.currentlyPressed.add(Number(key));
            break;
            default: return
        }

        const currentGroup = state.groups[state.currentGroupIndex];

        console.log(currentGroup, state.currentlyPressed)
        if (currentGroup.length === state.currentlyPressed.size) {
            const result = currentGroup.reduce((s, key) => state.currentlyPressed.has(key) && s, true);
            if (result) {
                state.currentGroupIndex += 1
                console.log(state.currentGroupIndex)
                state.currentlyPressed.clear()
            }
        }

    });
    window.addEventListener('onfocus', e => {
        currentlyPressed.clear();
    })
    window.addEventListener('keyup', e => {
        currentlyPressed.delete(e.key);
        switch (e.key) {
            case '1': 
            case '2': 
            case '3': 
            case '4': 
            case '5': 
                state.currentlyPressed.delete(Number(e.key));
            break;
            default: return
        }
    });
}