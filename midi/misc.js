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



// OLD PLAY STUFF
function play(eventMap, tempoMap, midiState) {
    // TODO: Have playback with speed modifier and pause work for this too. (Possibly do this by sending MIDI events based on animation)
    l("\nMIDI State:", midiState)
    // l("Event Counts:", debugEventCounter(midi.chunks));

    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const topLineHeight = 560;
    drawNoteNamesAndTopLine(topLineHeight);
    const timeFromTopToBottomMilliseconds = 2000;
    const msToPixel = topLineHeight / timeFromTopToBottomMilliseconds;

    const noteFill = (note, i) => {
        return [ "#54478cff", "#2c699aff", "#048ba8ff", "#0db39eff", "#16db93ff", "#83e377ff", "#b9e769ff", "#efea5aff", "#f1c453ff", "#f29e4cff", ][i % 10];
    };

    const noteEvents = eventMap["notes"];
    const timeMeasures = []; 
    const controlEvents = tempoMap(eventMap[MIDI_EVENT.CONTROL_CHANGE]);
    const programEvents = tempoMap(eventMap[MIDI_EVENT.PROGRAM_CHANGE]);

    // TODO: Stop playing current song when new song is selected
    // animateFallingNotes(noteEvents, timeMeasures, { noteFill, topLineHeight, msToPixel } );
    // setTimeout(() => { // Gives a warning on long files. 
    //     playEventsByScheduling(midiState, noteEvents, controlEvents, programEvents)
    // }, timeFromTopToBottomMilliseconds)
    
    // return

    // TODO: Deal with the issue of lingering notes somehow. What should be done about a note which should be played longer than other notes? Do I keep holding it down? Should it be optional? Should it be grayed out such that it is visible that it should not be played? Should only the next notes to be played be colored? 

    // TODO: Do not draw the whole keyboard but only a subsection which can be zoomed in.

    // TODO: Filter the notes for left and right hand or other criteria. Perhaps just manually click some notes to remove in a section / group.

    // TODO: Time based. Press the right notes on time or go back a measure. 

    // TODO: Settings from where to restart from and where to restart after. (E.g. practice a specific section)
    // TODO: Have the restarting notes repeat instead of showing other notes
    // TODO: Specify the restart by measure or time with a conversion between (What happens when the time is not on the start and end of a measure? This seems like it would ruin the rhythm).

    // TODO: On correct, animate smoothly to next notes instead of instantly.

    // TODO: For the first iteration let us just do down press. So we make sure the down presses are correct. For coords where you need more key down presses, then we just make sure that we press all the keys within some time frame. 

    // TODO: Do not show notes from cleared groups. Otherwise it can be hard to see which notes to play. Maybe we can do something fancy where they disapear and the new ones light up. So only the ones in focus a bright and the other ones are greyed out.

    // INTERACTIVE STUFF


    const noteEventsBatched = batchNoteEvents(noteEvents);
    l(`Note events batched`, noteEventsBatched)
    const playStateTimeoutLimit = 1000;
    const playState = {
        currentlyPressedKeys: new Set(),
        previouslyPressedKeys: new Set(),
        currentNoteGroup: 0,
        currentTimeout: null,
        failedState: false,
        previousAnimationTime: 0,
        currentElapsedPlay: noteEventsBatched[0][0].startMs,
        startTimeout: function() {
            const self = this;
            this.currentTimeout = setTimeout(e => {
                self.fail();
                this.currentTimeout = null;
            }, playStateTimeoutLimit);
        }, 
        cancelTimeout: function() {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        },
        stepAnimation: function(currentAnimationTime) { // Returns whether a change has happened 
            assert(currentAnimationTime >= this.previousAnimationTime, "Animation time should only increase.")
            assert(this.currentNoteGroup < noteEventsBatched.length, "Should not call get elapsed when the note group is outside the limit");
            assert(noteEventsBatched[this.currentNoteGroup].length != 0, "There should not be an empty batch of events.");

            let hasChanged = false;
            const deltaTime = currentAnimationTime - this.previousAnimationTime;
            this.previousAnimationTime = currentAnimationTime;
            const targetElapsed = noteEventsBatched[this.currentNoteGroup][0].startMs;
            if (targetElapsed > this.currentElapsedPlay) {
                // If anything needs to be done then we do 
                this.currentElapsedPlay = Math.min(this.currentElapsedPlay + deltaTime, targetElapsed);
                hasChanged = true;
            }
            return hasChanged;
        },
        getCurrentElapsed: function() {
            return this.currentElapsedPlay;
        },
        getCurrentGroup: function() {
            return noteEventsBatched[playState.currentNoteGroup]
        },
        didSucceed: function() {
            const currentGroup = this.getCurrentGroup();
            if (this.currentlyPressedKeys.length !== currentGroup.length) return false;
            const result = currentGroup.reduce((s, e) => this.currentlyPressedKeys.has(e.note) && s, true);
            return result;
        },
        success: function() {
            this.previouslyPressedKeys = this.currentlyPressedKeys;
            this.currentlyPressedKeys = new Set();

        },
        fail: function() {
            this.failedState = true;
            this.previouslyPressedKeys = this.currentlyPressedKeys;
            this.currentlyPressedKeys = new Set();
            // TODO: Implement something fancy 
        },
        recentlySucceded: function() {
            return true;
        },
        toBePlayed: function(note) {
            const currentGroup = noteEventsBatched[this.currentNoteGroup];
            if (!this.currentlyPressedKeys.has(note)) return false;
            for (let event of currentGroup) {
                if (event.note === note) return true;
            }
            return false;
        }, 
        addKey: function(key) {
            this.currentlyPressedKeys.add(key);
        }
    };   

    // TODO: Scroll? 
    // TODO: Select notes and group them (e.g. left-hand right-hand)
    
    function drawThing(time) {
        ctx.fillStyle = 'black'
        ctx.fillText("Current group: " + playState.currentNoteGroup, 100, 100);
        ctx.fillText("Time elapsed: " + Math.round(time)+"ms", 100, 120);
        const timeoutHasStarted = playState.currentTimeout !== null;
        ctx.fillText("Timeout started: " + timeoutHasStarted, 100, 140);
        ctx.fillText("Failed: " + playState.failedState, 100, 160);

        const elapsed = playState.getCurrentElapsed(time);
        // Draw groups
        const noteWidth = 20
        const timeFromTopToBottomMilliseconds = topLineHeight / msToPixel;

        ctx.fillStyle = 'red';
        for (let i = 0; i < noteEventsBatched.length; ++i) {
            if (elapsed + timeFromTopToBottomMilliseconds < noteEventsBatched[i][0].startMs) break; // Stop processing more events since they wont be shown anyway. (Correctness requires input to be sorted)

            ctx.fillStyle = (i === playState.currentNoteGroup)? 'red' : 'gray';

            for (let j = 0; j < noteEventsBatched[i].length; ++j) {
                const event = noteEventsBatched[i][j];

                const top = (-event.endMs + elapsed) * msToPixel + topLineHeight;
                if (top > topLineHeight) continue;  

                const left = 10 + event.note * 14 - noteWidth/2;
                const height = Math.min((event.endMs - event.startMs) * msToPixel, topLineHeight - top);
                ctx.fillRect(left, top, noteWidth, height);
            }
        }
    }

    function playAnimation(time) {
        const hasUpdated = playState.stepAnimation(time); 
        if (!hasUpdated) { return requestAnimationFrame(playAnimation); }

        ctx.clearRect(0, 0, canvas.width, topLineHeight);
        drawThing(time);
        requestAnimationFrame(playAnimation);
    }

    window.addEventListener('keydown', e => {
        if (e.key === 'a' && playState.currentTimeout === null) {
            playState.startTimeout();
        } else if (e.key === 's') {
            playState.cancelTimeout();
        } else if (e.key === 'n') {
            playState.currentNoteGroup = Math.min(playState.currentNoteGroup + 1, noteEventsBatched.length-1);
        }
    });
    midiState.currentInput.onmidimessage = (e) => {
        // We have a current note group of some notes. As long as we press notes in this group, we do not remove fingers from notes while we have not played the whole group, and we press all the notes in the group within some timeframe, we go to the next group. Success criteria is press all notes in group without lifting finger from any and press them in time frame. Fail criteria is if press some note outside group, lift finger from note before finish, or do not press within time frame. (Easy mode is to have an infinite time frame.)

        const event_type = e.data[0] & 0xF0;
        const event_velocity = e.data[2];
        if (event_type === MIDI_EVENT.NOTE_OFF || (event_type === MIDI_EVENT.NOTE_ON && event_velocity === 0)) { // Note off event
            // If we successfuly finished the last group. Don't do anything
            // Otherwise we fail
            const key = e.data[1];
            state.currentlyPressedKeys.delete(key);
            // if (playState.recentlySucceded()) {

            // } else {
            //     playState.fail()
            // }
        } else if (event_type === MIDI_EVENT.NOTE_ON) { // Note on event
            // if (playState.currentTimeout === null) {
            //     playState.startTimeout();
            // }
            const key = e.data[1];
            // if (playState.toBePlayed(key)) { 
            playState.addKey(key);
            // } else {
            //     playState.fail();
            // }
        }
        
        // Did we successfully play the whole thing?
        const currentGroup = playState.getCurrentGroup(); 
        if (playState.didSucceed()) {
            // playState.cancelTimeout();
            playState.nextGroup();

            // const success = currentGroup.reduce((s, e) => currentlyPressed.has(e.note) && s, true);
            // if (playState.) {
            //     currentlyPressed.clear();
            //     update(currentNoteGroup + 1);
            //     if (currentNoteGroup === noteEventsBatched.length) {
            //         l('win')
            //     } 
            // }  
        }
    }

    requestAnimationFrame(time => {
        drawThing(time);
        playAnimation(time);
    });

    // Maybe we can do this as an animation loop? So we check for correctness in the loop and only do midi events in this callback. The downside of this is that in theory we can press a key and release it efore it gets checked. Maybe this should just be checked. 
}