'use strict';
const KEY_CODE_SPACE = 'Space';
const LEFT_MOUSE_BUTTON = 0

// const KEY_CODE_NUMPAD_PLUS = "";
// const KEY_CODE_NUMPAD_PLUS = "";
const l = console.log
function assert(p, msg) {
    if (!p) throw new Error(msg);
}

// Assuming input is valid noteName
function flatToSharp(noteName) {
    if (noteName.length == 2 && noteName[1] == "b") {
        return noteName[0] + "#";
    }
    return res;
}
// Assuming input is valid noteName
function sharpToFlat(noteName) {
    if (noteName.length == 2 && noteName[1] == "#") {
        return noteName[0] + "b";
    }
    return res;
}

// Assumes num is an integer value between 21 and 127
function midiNoteValueToNoteName(num) {
    num = num - 12;
    const letters = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B", ];
    const l = num % letters.length;
    const n = Math.floor(num / letters.length);
    return [letters[l], n];
}


// ################ INITIALIZATION FUNCTIONS #########################

const emptyIO = {
    send: () => {}
};
const emptyMap = {
    has: () => { return false; }
}

function addSelectOptionsAndReturnFirst(select, list) {
    list.forEach((v, i, a) => {
        const option = document.createElement('option');
        option.value = i;
        option.innerHTML = i
        select.appendChild(option);
    });
    let entry = list.entries().next();
    if (!entry.done) {
        let [value, input] = entry.value;
        select.value = value;
        return input;
    }
    return emptyIO;
}

function initializeCanvasEventListeners(midiState) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('file-input');

    // TODO: Center and pick font
    ctx.font = '36px Aria';
    ctx.fillText("Click to pick a MIDI file", 100, 500);
    ctx.fillText("or drag and drop it in the window", 100, 540);

    canvas.addEventListener('click', (e) => {
        if (midiState.chunks === null) {
            fileInput.click();
        }
    });

    canvas.addEventListener('dragover', e => {
        e.preventDefault(); // This is required for drop event
    });

    canvas.addEventListener('drop', e => {
        if (e.dataTransfer.files.length == 0) return;
        e.preventDefault(); // This prevents the downloading of file

        // Add the dropped file and dispatch the change event to the fileInput
        fileInput.files = e.dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
    });


}

function initializeMidiInputOutputEventListeners(midiState) {
    const getOrEmptyIO = (value, map) => {
        return map.has(value)? map.get(value) : emptyIO;
    };
    const midiOutputSelect = document.getElementById('midi-output-select');
    midiOutputSelect.addEventListener('change', event => {
        const value = midiOutputSelect.value
        midiState.currentOutput = getOrEmptyIO(value, midiState.outputs);
        l('change output', value, midiState.currentOutput);
    });
    const midiInputSelect = document.getElementById('midi-input-select');
    midiInputSelect.addEventListener('change', event => {
        let value = midiInputSelect.value
        midiState.currentInput = getOrEmptyIO(value, midiState.inputs);
        l('change input', value, midiState.currentInput)
    });
}

function initializeMidiStateRelatedListeners(midiState) {
    initializeMidiInputOutputEventListeners(midiState);
    initializeCanvasEventListeners(midiState);
    initializeMIDIUSBAccess(
        midiAccess => {
            l("Inputs:", midiAccess.inputs, " - Outputs:", midiAccess.outputs, " - Sysex:", midiAccess.sysexEnabled, midiAccess);

            // TODO: Handle disconnects and reconnects
            // midiAccess.onglobalMidichange = handleMidiAccessStateChange;

            midiState.inputs = midiAccess.inputs;
            midiState.outputs = midiAccess.outputs;

            const midiInputSelect = document.getElementById('midi-input-select');
            const midiOutputSelect = document.getElementById('midi-output-select');
            midiState.currentInput = addSelectOptionsAndReturnFirst(midiInputSelect, midiAccess.inputs);
            midiState.currentOutput = addSelectOptionsAndReturnFirst(midiOutputSelect, midiAccess.outputs);
            l('Midi state after access success', midiState)
        }, 
        error => {
            console.log("Failed to access MIDI devices:", error);
        }
    );

}


function initializeMidiFileInputListeners(callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        callback(event.target.result);
    };

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        assert(fileInput.files.length > 0, `File input change event fired even though it contained no files`);
        const file = fileInput.files[0]; 
        reader.readAsArrayBuffer(file)
    });

}

function initializeMIDIUSBAccess(success, reject) {
    if (navigator.requestMIDIAccess) { // Check if Web MIDI API is supported
        navigator.requestMIDIAccess({sysex: false /* Send and receive system exclusive messages */, software: false /* Utilize installed software synthesizer */})
        .then(success)
        .catch(reject);
    } else {
        reject("Cannot request MIDI Access");
    }
}

// Objects which handles all program state
// State variables for playback are "pause" and "speedMultiplier"
// State variables for input and output are "inputs", "outputs", "currentInput", "currentOutput"
// Parsed MIDI file is stored in Chunks
function initializeState() {
    if (localStorage.savedStateJSON !== undefined && localStorage.savedStateJSON !== null) {
        const state = JSON.parse(localStorage.savedStateJSON);
        l('Louding saved state', state)
        return state
    }
    return {
        chunks: null,
        inputs: emptyMap,
        outputs: emptyMap,
        currentInput: emptyIO,
        currentOutput: emptyIO,
        pause: false,
        speedMultiplier: 1
    };
}

function initializePlaybackStateRelatedListeners(playbackState) {
    const input = document.getElementById('playback-speed-input');
    // General +- playback speed keyboard hotkeys
    document.addEventListener('keypress', e => {
        if (e.code === "Space") playbackState.pause = !playbackState.pause
        else if (e.key === "+") playbackState.speedMultiplier += 1
        else if (e.key === "-") playbackState.speedMultiplier -= 1
        input.value = playbackState.speedMultiplier;
    });
    // Try to do some input validation, but 
    input.addEventListener('input', e => {
        const n = Number(input.value);
        if (Number.isNaN(n)) {
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
            playbackState.speedMultiplier = n;
        }
    });
}

// // ################### DRAWING FUNCTIONS ###########

// // TODO: Wareta ringo has some weird boxes in the bottom of the falling notes. Figure out why these exist.
// function drawFallingNotes(ctx, noteEvents, elapsed, { msToPixel, noteFill, topLineHeight }) {
//     const noteWidth = 20
//     const timeFromTopToBottomMilliseconds = topLineHeight / msToPixel;
//     ctx.beginPath()
//     ctx.moveTo(0, topLineHeight);
//     ctx.lineTo(ctx.canvas.width, topLineHeight);
//     ctx.stroke();
//     for (let i = 0; i < noteEvents.length; i++) {
//         const event = noteEvents[i];
//         if (elapsed + timeFromTopToBottomMilliseconds < event.startMs) break; // Stop processing more events since they wont be shown anyway. (Correctness requires input to be sorted)

//         const top = (-event.endMs + elapsed) * msToPixel + topLineHeight;
//         if (top > topLineHeight) continue;  

//         const left = 10 + event.note * 14 - noteWidth/2;
//         const height = Math.min((event.endMs - event.startMs) * msToPixel, topLineHeight - top);
//         ctx.fillStyle = noteFill(event, i);
//         ctx.fillRect(left, top, noteWidth, height);
//     }
// }

// function drawTimeMeasures(ctx, timeMeasures) {
//     ctx.fillStyle = 'black';
//     ctx.beginPath();
//     for (let i = 0; i < timeMeasures.length; i++) {
//         const measureTime = timeMeasures[i].start;
//         let y = (elapsed - measureTime) * msToPixel;
//         if (y > topLineHeight) continue
//         ctx.fillText(i, 25, y)
//         ctx.moveTo(50, y);
//         ctx.lineTo(canvas.width, y);
//     }
//     ctx.stroke();
// }

// function drawSheet(wholeNoteImage, notes, time) {
//     let canvas = document.getElementById('note-canvas');
//     let ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.lineWidth = 4
//     let startX = 100 ;
//     let startY = 250;
//     let length = 1800;
//     let offSetY = ctx.lineWidth * 15;
//     ctx.beginPath();
//     for (let i = 0; i < 5; i++) {
//         ctx.moveTo(startX, startY + offSetY * i);
//         ctx.lineTo(startX + length, startY + offSetY * i);
//     }
//     ctx.moveTo(startX + 100, startY - 10);
//     ctx.lineTo(startX + 100, startY + offSetY * 4 + 10);
//     ctx.stroke();

//     const noteHeight = offSetY * 1.1;
//     const noteWidth = noteHeight * 40/25

//     // Positions are given as 0 being the middle of G thingy
//     // Time is now just given as numbers from 0 and up
//     function drawNote(noteValue, time, cleff) {
//         let position;
//         switch (cleff) {
//             case CLEFF.TREBLE: {
//                 position = noteValue;
//             } break;
//             case CLEFF.BASS: {
//                 position = noteValue + 12;
//             } break;
//             default: {
//                 throw new Error("Unknown cleff");
//             } break;
//         }
//         if (Math.abs(position) > 10) {
//             // TO BE FIXED SOMEHOW
//             throw new Error("Position out of bound");
//         }
//         let timeOffset = noteWidth * 2;
//         let x = startX + timeOffset * time;
//         let y = startY + 2 * offSetY - noteHeight / 2 + (-position) * offSetY / 2;

//         drawLedgerLines(position, time)

//         ctx.drawImage(wholeNoteImage, x, y, noteWidth, noteHeight);
//     }
//     function drawLedgerLines(position, time) {
//         let numberOfLines = Math.ceil((Math.abs(position) - 5) / 2);
//         const ledgerLineWidth = noteWidth * 1.1;
//         let x = startX + 2 * noteWidth * time;
        
//         if (position > 0) {
//             // Draw ledger lines
//             ctx.beginPath();
//             for (let i = 0; i < numberOfLines; i++) {
//                 ctx.moveTo(x - noteWidth * 0.1, startY - offSetY * (i+1));
//                 ctx.lineTo(x + ledgerLineWidth, startY - offSetY * (i+1));
//             }
//             ctx.stroke();
//         } else if (position < 0) {
//             ctx.beginPath();
//             for (let i = 0; i < numberOfLines; i++) {
//                 ctx.moveTo(x - noteWidth * 0.1, startY + offSetY * (5 + i));
//                 ctx.lineTo(x + ledgerLineWidth, startY + offSetY * (5 + i));
//             }
//             ctx.stroke();
//         }
//     }

//     // TODO: move treble position calculation out of draw call
//     // TODO: Move ledger lines out of draw call
//     for (const note of notes) {
//         drawNote(note[0], note[1] - time * 0.001, CLEFF.TREBLE);
        
//     }
// }

// function drawNoteNamesAndTopLine(top) {
//     const canvas = document.getElementById('note-canvas');
//     const ctx = canvas.getContext('2d');
    
//     ctx.fillStyle = 'black'
//     ctx.font = "10px Georgia";

//     const letters = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B", ];
//     // const letters = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", ];
//     for (let i = 0; i < 128; i++) {
//         const note = letters[i % letters.length];
//         // Mark boundary and middle notes
//         if (i === 60 || i === 21 || i === 108) {
//             ctx.fillStyle = 'red'
//         } else {
//             ctx.fillStyle = 'black'
//         }

//         // Draw white or black note
//         if (note.length == 2) {
//             ctx.fillText(note[0], 8 + i * 14, top + 20);
//             ctx.font = "8px Georgia";
//             ctx.fillText(note[1], 14 + i * 14, top + 16);
//             ctx.font = "10px Georgia";
//         } else {
//             ctx.fillText(note, 10 + i * 14, top + 40);
//         }

//         // Draw octave partitioner
//         if (note === "B") {
//             ctx.beginPath();
//             ctx.moveTo(21 + i * 14, top);
//             ctx.lineTo(21 + i * 14, top + 45);
//             ctx.stroke();

//         }

//     }

//     ctx.beginPath();
//     ctx.moveTo(0, top);
//     ctx.lineTo(canvas.width, top);
//     ctx.stroke();
// }

// ################# EVENT HANDLING FUNCTIONS #######################

function handleOnMidiMessage(event) {
    const data = event.data;
    const status = data[0] & 0xF0;
    const channel = data[0] & 0x0F;
    switch (status) {
        case MIDI_EVENT.NOTE_ON:
        case MIDI_EVENT.NOTE_OFF: {
            l(`Event ${status.toString(16)} Note ${midiNoteValueToNoteName(data[1])} Channel ${channel} Velocity ${data[2]}`);
        } break;
        case MIDI_EVENT.PROGRAM_CHANGE: {
            l(`Change program on channel ${channel} to program ${data[1]}`);
        } break;
        case MIDI_EVENT.CONTROL_CHANGE: {
            if ((data[1] & 0x78) === 0x78) { // Channel mode message
                l(`Change Channel Mode ${data[1] & 0x07} on Channel ${channel} to ${data[2]}`)
            } else { // Regular Control Change
                l(`Change Control ${data[1]} on Channel ${channel} to ${data[2]}`)
            }
        } break;
        default: {
            l(`Unknown MIDI Message ${status.toString(16)} -`, event);

        } break;
    }
}

function handleMidiAccessglobalMidiChange(event) {
    const midiAccess = event.currentTarget;
    const port = event.port;

    l('MidiAccess globalMidi Change', event)
}

function handleMidiIOglobalMidiChange(event) {
    l('MidiIO globalMidi Change', event);
}

// #####################################################
// ##################### MAIN ##########################
// #####################################################

// Function for handling initializing the UI elements which deal with file transfer
// The UI elements should be a file input (<input type="file">) element an element which supports drag and drop since the FileReader can only access those files: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
// When the file input detects a file has been added, it tells the file reader to read it as an array buffer and once this is done, the loadCallback is called with the result
function initializeDataTransferInterface(fileInput, dragAndDropElement, loadCallback, errorCallback) {
    function triggerFileInputClick() { fileInput.click() } 
    dragAndDropElement.addEventListener('click', triggerFileInputClick);

    // TODO: Handle multiple files?
    fileInput.addEventListener('change', _ => {
        l('files', fileInput.files)
        assert(fileInput.files.length > 0, `File input change event fired even though it contained no files`);

        // Read file as an ArrayBuffer, returning a promise which is handled by respective callbacks.
        fileInput.files[0].arrayBuffer().then(loadCallback, errorCallback); 

        dragAndDropElement.removeEventListener('click', triggerFileInputClick); // TODO: Figure out if there is a better way to handle this. Right now this does not work together with a track already being stored in the local storage and used to initialize.
    });

    dragAndDropElement.addEventListener('dragover', event => {
        event.preventDefault(); // This is required for drop event. (https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event)
    });

    dragAndDropElement.addEventListener('drop', event => {
        if (event.dataTransfer.files.length == 0) return;
        event.stopPropagation();
        event.preventDefault(); // This prevents the browser default behavior of downloading the file for the user

        // Add the dropped file and dispatch the change event to the fileInput
        fileInput.files = event.dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
    });
}

function main() {
    // const canvas = document.getElementById('note-canvas');
    // const filepicker = document.getElementById('file-input');


    // function handleFileLoad(arrayBuffer) {
    //     const parsedData = parseMidiFile(arrayBuffer);
    //     l(parsedData);

    // }

    doStuffWithParsedMidiFile();

    // // TODO: Implement error handling
    // initializeDataTransferInterface(filepicker, canvas, handleFileLoad, errorEvent => l('An error occured trying to handle file loading', errorEvent))


   

    return ;

    runTests();
    // Various initializations
    const state = initializeState(); 
    initializePlaybackStateRelatedListeners(state);
    initializeMidiStateRelatedListeners(state);
    initializeMidiFileInputListeners(buffer => {
        try {
            state.chunks = parseMidiFile(buffer);
            doStuffWithParsedMidiFile(state);
            // const melodies = chunksToMelodiesList(state.chunks)
            // play(melodies[0].eventMap, melodies[0].tempoMap, state)
        } catch(e) {
            l('Parse MIDI file error:', e)
        }
    });

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    document.body.appendChild(saveButton)
    saveButton.addEventListener('click', function() {
        localStorage.savedStateJSON = JSON.stringify(state);
    });


    if (state.chunks !== null) {
        doStuffWithParsedMidiFile(state);
    }
}

// What is it we want?

// We want some representation of the notes positioned according to their value. 
// We want to be able move these notes according to time. 
// We want multiple ways to show these notes, e.g. falling or a note sheet
// We want se

// Initial setup
// Falling notes
// The notes' x position is placed according to 


// What are our objects? 
// We have out notes. The notes are characterized by a note value, a duration, and a start time, possibly 
// We have a view which takes a note and draws it. The view calculates how the notes are seen. 
// We have some settings. Simple setting is selection. We want to use the mouse to select. 

class FallingNotesView {
    constructor() {
        this.deltaTime = 0;

        const canvas = document.getElementById('note-canvas');
        this.drawSettings = {
            top: 600,
            marginLeft: 10,
            marginRight: 10,
            leftmostNoteValue: 60 - 2*12, // 2 Octaves from middle C
            notesToShow: 12 * 3,
            whiteToBlackRatio: 0.8, // Initially we assume they have identical width
            partitionerHeight: 45,
            canvas: canvas,
            ctx: canvas.getContext('2d'), 
            timeFromTopToTopMs: 2000
        };
    }

    setDeltaTime(deltaTime) {
        this.deltaTime = deltaTime;
    }

    drawNote(note) {
        const {notesToShow, leftmostNoteValue, ctx} = this.drawSettings;
        if (note.value < leftmostNoteValue || note.value > notesToShow + leftmostNoteValue) return;
        const {leftX, topY, width, height} = this.calculateNoteRectangle(note);
        ctx.fillRect(leftX, topY, width, height);
    }

    drawBackground() {
        const {
            top, 
            marginLeft, 
            marginRight, 
            notesToShow, 
            leftmostNoteValue,
            canvas, 
            ctx} = this.drawSettings;

        const totalWidth = canvas.width - marginLeft - marginRight;
        const noteWidth = totalWidth / notesToShow;

        const letters = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B", ];

        const textOffsetY = 16;
        const textSmallOffsetY = textOffsetY -4;

        for (let i = 0; i < notesToShow; i++) {
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'black';
            ctx.font = "10px Georgia";
            const note = letters[(i + leftmostNoteValue) % letters.length];

            ctx.strokeRect(marginLeft + i * noteWidth, top, noteWidth, (i + 20));

            // Draw white or black note
            ctx.fillText(note[0], marginLeft + i * noteWidth + noteWidth/2, top + textOffsetY);
            if (note.length == 2) {
                ctx.font = "8px Georgia";
                ctx.fillText(note[1], marginLeft + i * noteWidth + noteWidth/2 + 8, top + textSmallOffsetY);
            } 
        }

        // Draw top line
        ctx.strokeStyle = 'black'
        ctx.beginPath();
        ctx.moveTo(this.drawSettings.marginLeft, top);
        ctx.lineTo(canvas.width-this.drawSettings.marginRight, top);
        ctx.stroke();
    }
    
    drawSettingsPanel() {

    }

    calculateNoteRectangle(note) {


        // How long time from 0 to top? 
        // Say it takes 2000 ms, then a duration of 2000 ms should cover the whole thing


        // Note value = leftmostNoteValue => x = marginLeft
        const {top, marginLeft, marginRight, notesToShow, leftmostNoteValue, canvas, timeFromTopToTopMs} = this.drawSettings;
        const totalWidth = canvas.width - marginLeft - marginRight;
        const noteWidth = totalWidth / notesToShow;
        const x = marginLeft + (note.value - leftmostNoteValue) * noteWidth;

        const noteHeightFraction = note.durationMs / timeFromTopToTopMs;
        const noteStartFraction = note.startMs / timeFromTopToTopMs;
        const height = noteHeightFraction * top;
        const y = top - height;

        // this.deltaTime = 0 && note.startMs = 0 => topY + height = top

        // top = 600
        // this.deltaTime = 0 && note.startMs = 500 && note.durationMs = 500 => topY = topY/2
        // topY = 300
        // height = 

        // TODO: Tomorrow. Too tired to do this now. I want a piece of paper


        // Calculate x position based on current view of keys
        // Calculate y position based on current time possibly taking into key view into consideration to account for proportions
        // return note;
        return {leftX: x, topY: y, width: noteWidth, height: height}
    }

    selectElementsInRectangle(notes, leftX, rightX, topY, bottomY) {
        const result = [];
        for (const note of notes) {
            const noteRectangle = this.calculateNoteRectangle(note);
            const noteCorners = {
                leftX: noteRectangle.leftX,
                rightX: noteRectangle.leftX + noteRectangle.width,
                topY: noteRectangle.topY,
                bottomY: noteRectangle.topY + noteRectangle.height
            }
            if (rectangleOverlap(noteCorners, {leftX, rightX, bottomY, topY})) 
            {
                result.push(note);
            }
        }
        return result;
    }
}

function rectangleOverlap(a, b) {
    return !(a.rightX < b.leftX || b.rightX < a.leftX || a.bottomY < b.topY || b.bottomY < a.topY);
}


class Note {
    // TODO: Maybe record original time values and have something to convert to time
    constructor(value, startMs, durationMs) {
        this.value = value;
        this.startMs = startMs; 
        this.durationMs = durationMs;
    }
    // TODO: Can define various shifts on everything
}

class MusicSheetView {
    constructor() {
    }
}

function doStuffWithParsedMidiFile() {
    // const melodies = chunksToMelodiesList(state.chunks)
    // l(melodies)
    const notes = [
        new Note(60, 1000, 500),
        new Note(48, 0, 500),
        new Note(36, 500, 1000),
    ]; // TODO: Do something based off of melodies
    
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fallingNotesView = new FallingNotesView();
    const mouseState = {
        position: {x: 0, y: 0},
        dragStart: null,
        updateMousePosition: function(event) {
            this.position.x = event.clientX - canvas.offsetLeft;
            this.position.y = event.clientY - canvas.offsetTop;
        }
    }

    let currentView = fallingNotesView;

    canvas.addEventListener('mousemove', e => {
        mouseState.updateMousePosition(e);
    });

    canvas.addEventListener('mousedown', e => {
        if (e.button === LEFT_MOUSE_BUTTON) {
            mouseState.updateMousePosition(e);
            mouseState.dragStart = {...mouseState.position}; // Copy
        }
    });

    canvas.addEventListener('mouseup', e => {
        if (e.button === LEFT_MOUSE_BUTTON && mouseState.dragStart !== null) {
            const selectionArea = {
                leftX: Math.min(mouseState.dragStart.x, mouseState.position.x),
                rightX: Math.max(mouseState.dragStart.x, mouseState.position.x),
                topY: Math.min(mouseState.dragStart.y, mouseState.position.y),
                bottomY: Math.max(mouseState.dragStart.y, mouseState.position.y),
            }
            const selectedElements = currentView.selectElementsInRectangle(
                notes,
                selectionArea.leftX,
                selectionArea.rightX,
                selectionArea.topY,
                selectionArea.bottomY,
            );
            l(selectionArea, selectedElements, notes)
            mouseState.dragStart = null;
        }
    })

    function myDraw(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let selectedElements = [];
        if (mouseState.dragStart != null) {
            const selectionArea = {
                leftX: Math.min(mouseState.dragStart.x, mouseState.position.x),
                rightX: Math.max(mouseState.dragStart.x, mouseState.position.x),
                topY: Math.min(mouseState.dragStart.y, mouseState.position.y),
                bottomY: Math.max(mouseState.dragStart.y, mouseState.position.y),
            }
            selectedElements = currentView.selectElementsInRectangle(
                notes,
                selectionArea.leftX,
                selectionArea.rightX,
                selectionArea.topY,
                selectionArea.bottomY,
            );
        }

        for (const note of notes) {
            if (selectedElements.includes(note)) {
                ctx.fillStyle = 'red'; 
            } else {
                ctx.fillStyle = 'black'; 
            }
            currentView.drawNote(note);
        }
        
        if (mouseState.dragStart !== null) {
            // Surprisingly nice colors
            ctx.fillStyle = 'rgba(100, 150, 200, 0.5)'; 
            ctx.strokeStyle = 'rgba(100, 150, 200, 1)';
            ctx.strokeWidth = 4;
            ctx.beginPath();
            ctx.moveTo(mouseState.dragStart.x, mouseState.dragStart.y);
            ctx.lineTo(mouseState.position.x, mouseState.dragStart.y);
            ctx.lineTo(mouseState.position.x, mouseState.position.y);
            ctx.lineTo(mouseState.dragStart.x, mouseState.position.y);
            ctx.closePath();
            ctx.fill()
            ctx.stroke();
        }

        fallingNotesView.drawBackground();
        requestAnimationFrame(myDraw)
    }

    requestAnimationFrame(myDraw);


    // const notes = new Note()

    // TODO: 
    // Create 2 view types
    // Type 1 is falling notes. 
    // Type 2 is music sheet
    // Create 5 notes to position them
    // Make it possible to select notes in view
    //

    // drawNoteNamesAndTopLine(600)


}


function chunksToMelodiesList(midiChunks) {
    l('Midi Chunks after parsing', midiChunks);
    const division = midiChunks[0].division;
    const format = midiChunks[0].format;
    l(`Format ${format} division ${division}`);
    const melodies = [];
    const trackChunks = midiChunks.slice(1);
    const playTracks = getCannonicalPlayTrackEvents(format, trackChunks);
    l(`Play tracks:`, playTracks);

    for (let t = 0; t < playTracks.length; t++) {
        assert(t === 0, `Found ${playTracks.length} tracks, which should not happen while we do not support format 2`);
        l(`Track ${t}`, playTracks[t])

        // TODO: HOW THE F DO I FIND THE TIMES FOR WHEN TO ADD MEASURE LINES??? (I FOUND TIMES BUT THEY ARE OFTEN BAD. HOW TO FIX?
        // TODO: Make the measure starts and time signatures customizable. 
        // The first one is a 0. So far so good. The next time is at??????????????
        const eventMap = splitEvents(playTracks[t]);
        l('Event map', eventMap)


        const tempoMap = computeTempoMappingFunction(eventMap[STATUS.META_EVENT][META_EVENT.SET_TEMPO], division);

        const noteOnEvents = tempoMap(eventMap[MIDI_EVENT.NOTE_ON]);
        const noteOffEvents = tempoMap(eventMap[MIDI_EVENT.NOTE_OFF]);
        eventMap["notes"] = combineNoteEvents(noteOnEvents, noteOffEvents);
        eventMap["notes"].sort((a, b) => {
            if (a.time < b.time) return -1;
            if (b.time < a.time) return 1;
            return 0;
        });
        melodies.push({
            eventMap,
            tempoMap
        });
    }
    return melodies;
}

function computeTempoMappingFunction(setTempoEvents, division) {
    let currentTempo = parseTempoMetaData([0x07, 0xA1, 0x20]);
    let tickToMsFactor = (currentTempo / division) / 1000;
    const tempos = [];
    if (setTempoEvents.length === 0 || setTempoEvents[0].time > 0) {
        console.warn("File did not contain an initial set tempo event");
        tempos.push({
            time: 0,
            startMs: 0,
            tickToMsFactor
        });
    }
    let runningTimeMs = 0;
    let previousEventTime = 0;
    for (const event of setTempoEvents) {
        runningTimeMs += (event.time - previousEventTime) * tickToMsFactor;
        currentTempo = parseTempoMetaData(event.metaData);
        tickToMsFactor = (currentTempo / division) / 1000;
        previousEventTime = event.time;
        tempos.push({
            time: event.time,
            startMs: runningTimeMs,
            tickToMsFactor
        });
    }

    // l('tempos', tempos)

    return (events) => { // Assumes that events are 
        assert(isSorted(events.map(e => e.time)), `Expected the events to tempo map to be sorted based on time`);
        let currentTempoIdx = 0;
        let currentTempo = tempos[currentTempoIdx];
        for (const event of events) {
            // While the there is a next tempo and the time of the next tempo is still smaller than the event time, increment.
            while ((currentTempoIdx+1) < tempos.length && tempos[currentTempoIdx+1].time < event.time) {
                currentTempoIdx++;
                currentTempo = tempos[currentTempoIdx];
            }
            // l(currentTempo.startMs, event.time, currentTempo.time, currentTempo.tickToMsFactor)
            event.startMs = currentTempo.startMs + (event.time - currentTempo.time) * currentTempo.tickToMsFactor;
        }
        return events;
    };
}

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



// The cannonical representation of play-track events is a list of midi events. If the format is 0 or 1, this list consists of a single list of midi events.
// If the format is 2, the list contains one list of midi events for every track in the file
function getCannonicalPlayTrackEvents(format, trackChunks) {
    const tracks = []; // Size should be 1 for format 0 and 1. Format 2 can have multiple
    switch (format) {
        case TRACK_FORMAT.SINGLE_MULTICHANNEL_TRACK: {
            assert(trackChunks.length === 1, `Expected Single track format to only 1 track chunk`);
            tracks.push(trackChunks[0].events);
        } break;
        case TRACK_FORMAT.SIMULTANEOUS_TRACKS: {
            assert(trackChunks.length > 1, `Expected simultaneous track format to have at least 2 track chunk`);
            const trackEvents = trackChunks.map(t => t.events).reduce(mergeTrackChunksEvents, []);
            tracks.push(trackEvents);
        } break; 
        case TRACK_FORMAT.INDEPENDENT_TRACKS: {
            assert(false, `Unhandled multiple independent tracks`);
            for (const chunk of trackChunks) {// TODO: Test this works with some file
                tracks.push(chunk.events);
            }
        } break;
        default: {
            assert(false, `Unknown track format ${format} in header`);
        }
    }
    return tracks;
}

// Returns a list of times of measure lines given a list of timeSignatureEvents, a tempoMap, and an end time (given in time)
function getMeasures(timeSignatureEvents, tempoMap, end) {
    let currentTimeSignature = { numerator: 4, denominator: 4 };  // Default time signature
    assert(false, 'To be implemented')
}

function splitEvents(playTrack) {
    const result = {};
    result[STATUS.META_EVENT] = {};
    result[STATUS.META_EVENT][META_EVENT.SEQUENCE_NUMBER] = [];
    result[STATUS.META_EVENT][META_EVENT.TEXT_EVENT] = [];
    result[STATUS.META_EVENT][META_EVENT.COPYRIGHT_NOTICE] = [];
    result[STATUS.META_EVENT][META_EVENT.TRACK_NAME] = [];
    result[STATUS.META_EVENT][META_EVENT.INSTRUMENT_NAME] = [];
    result[STATUS.META_EVENT][META_EVENT.LYRIC] = [];
    result[STATUS.META_EVENT][META_EVENT.MARKER] = [];
    result[STATUS.META_EVENT][META_EVENT.CUE_POINT] = [];
    result[STATUS.META_EVENT][META_EVENT.MIDI_CHANNEL_PRFIX] = [];
    result[STATUS.META_EVENT][META_EVENT.END_OF_TRACK] = [];
    result[STATUS.META_EVENT][META_EVENT.SET_TEMPO] = [];
    result[STATUS.META_EVENT][META_EVENT.SMPTE_OFFSET] = [];
    result[STATUS.META_EVENT][META_EVENT.TIME_SIGNATURE] = [];
    result[STATUS.META_EVENT][META_EVENT.KEY_SIGNATURE] = [];
    result[STATUS.META_EVENT][META_EVENT.SEQUENCE_SPECIFIC] = [];
    result[STATUS.META_EVENT]["unknown"] = [];
    result["sysex"] = {};
    result["sysex"][STATUS.SYS_EXCLUSIVE_START] = [];
    result["sysex"][STATUS.SYS_EXCLUSIVE_END] = [];
    result[MIDI_EVENT.NOTE_OFF] = [];
    result[MIDI_EVENT.NOTE_ON] = [];
    result[MIDI_EVENT.POLYPHONIC_AFTERTOUCH] = [];
    result[MIDI_EVENT.CONTROL_CHANGE] = [];
    result[MIDI_EVENT.PROGRAM_CHANGE] = [];
    result[MIDI_EVENT.CHANNEL_AFTERTOUCH] = [];
    result[MIDI_EVENT.PITCH_BEND] = [];

    for (const event of playTrack) {
        if (event.status === STATUS.META_EVENT) {
            if (result[STATUS.META_EVENT].hasOwnProperty(event.metaType)) { // Split meta events into known and unknown events
                result[STATUS.META_EVENT][event.metaType].push(event);
            } else {
                result[STATUS.META_EVENT]["unknown"].push(event);
            }
            
        } else if (event.status === STATUS.SYS_EXCLUSIVE_START || event.status === STATUS.SYS_EXCLUSIVE_END) {
            result["sysex"][event.status].push(event);
        } else {
            result[event.type].push(event);
        }
    }
    return result;
}

// TODO: Figure out whether deltaTimes are invalidated by this function. Maybe just a simple verification loop.
// TODO: There may be some issue where we merge on and off note events, but the off note events come before the on note event for events with the same time. I.e. after splitting we do not know the original order. The fix may be to push both types of event to the same list in the event map. Alternatively, we can give every event a number to indicate its relative order in the track. This may still be an issue for multiple tracks. 
// TODO: When combining note events, the track from where it came from should be taken into consideration. Right now a note off from one track can turn off a note from another track. The same is true for different channels. 
// Returns a list of note events with duration between noteOn event time and noteOff event time
function combineNoteEvents(noteOnEvents, noteOffEvents) {
    const result = [];
    const noteEvents = mergeTrackChunksEvents(noteOnEvents, noteOffEvents);
    const startedNotes = {};
    for (let i = 0; i < noteEvents.length; i++) {
        const event = noteEvents[i];
        const note = startedNotes[event.note];
        if (isNoteOffEvent(event)) {
            if (isNullOrUndefined(note)) {
                console.warn('Found a note off event which was not started', event);
                continue; 
            }
            note.duration = event.time - note.time;
            note.endMs = event.startMs;
            result.push(note);
            startedNotes[event.note] = null;
        } else if (isNullOrUndefined(note)) { // Normal noteOn event
            startedNotes[event.note] = event;
        } else {  // Unusual Double noteOn event
            // TODO: Figure out what to do about the same note being played twice before being turned off (It is hard to hear a difference. So maybe it does not matter?)
            console.warn(`Double note ${event.note} at note event`, event, `at time ${event.startMs} of the note`, note)
            note.duration = event.time - note.time;
            note.endMs = event.startMs;
            if (note.duration === 0) console.warn('0 duration note', note)
            result.push(note);
            startedNotes[event.note] = event;
        }
    }
    return result;
}

// TODO: What if the time signature changes between measures? (Who the fuck knows. Seems like undefined behavior)
// TODO: The deltaTimeStart should be based on the accumulative delta time. Right now it is useless because it is relative to deleted events.

/// ################# ANIMATE MIDI FUNCTIONS #############

// Assumes noteEvents are sorted 
// Combine with drawNoteNamesAndTopLine to have notes falling down to their respective key
function animateFallingNotes(noteEvents, timeMeasures, { noteFill, topLineHeight, msToPixel }) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    const timeFromTopToBottomMilliseconds = topLineHeight / msToPixel;
    
    const end = getPlayTrackEndMsTime(noteEvents);
    
    let startIndex = 0; // TODO: Stop processing notes already moved outside window. Use a running start index. This seems hard since the length of some notes are longer than others, so we still have to skip those in between. The gain also does not seem very significant
    let elapsed = -timeFromTopToBottomMilliseconds;
    let previous = null;
    function animate(t) {
        elapsed += t - previous;
        previous = t;

        ctx.clearRect(0, 0, canvas.width, topLineHeight);
        const songElapsed = clamp(0, elapsed, end);
        drawFallingNotes(ctx, noteEvents, elapsed, { msToPixel, noteFill, topLineHeight });
        // drawTimeMeasures(ctx, timeMeasures);
        drawTimeBar(ctx, songElapsed, end, { width: canvas.width - 200, offsetX: 100, offsetY: topLineHeight + 60, notchHeight: 6, font: "18px Courier New", textColor: 'black', lineColor: 'black' });
        if (elapsed > end) return;
        requestAnimationFrame(animate)
    }
    requestAnimationFrame(t => {
        previous = t;
        animate(t)
    });
}

function drawTimeBar(ctx, elapsed, totalDutation, drawSettings) {
    // TODO: Make a cooler time bar which is a filling tube with a neat colored effect on the filling
    // TODO: Make it possible to click time on bar (make this visualy clear)
    const { width, offsetX, offsetY, notchHeight, font, lineColor, textColor} = drawSettings;
    const playNotchX = offsetX + (elapsed / totalDutation) * width;

    ctx.font = font;
    ctx.fillStyle = textColor;
    const timeText = millisecondsToTimeString(elapsed) + "/" + millisecondsToTimeString(totalDutation);
    const textHeight = getTextHeight(ctx, timeText);

    ctx.clearRect(0, offsetY, ctx.canvas.width, 30); // TODO: Calculate height based on font size and notch heights

    ctx.fillText(timeText, offsetX, offsetY + textHeight + notchHeight);
    
    ctx.strokeTyle = lineColor;
    ctx.beginPath();
    // Time bar
    ctx.moveTo(offsetX,         offsetY + notchHeight / 2);
    ctx.lineTo(width + offsetX, offsetY + notchHeight / 2);

    // Left notch
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + notchHeight);

    // Right notch
    ctx.moveTo(offsetX + width, offsetY);
    ctx.lineTo(offsetX + width, offsetY + notchHeight);

    // Play notch
    ctx.moveTo(playNotchX, offsetY);
    ctx.lineTo(playNotchX, offsetY + notchHeight);
    ctx.stroke();
}

// ################# MIDI PLAY FUNCTIONS ########################
// TODO: Play function which synchs directly with animation. (Maybe do this with a callback on note start and end? How should this handle program change and control events?)

function playEventsByScheduling(midiState, noteEvents, controlEvents, programEvents) {
    l(`Play events MidiState:`, midiState)
    // TODO: Batch the events if possible to avoid needing multiple timouts 
    for (const event of noteEvents) {
        assert(typeof event.note === 'number', `Event note should be a number, but was ${event.note}`);
        setTimeout(() => {
            // TODO: Start by ignoring different channels. This may result in bugs if different channels play the same note
            midiState.currentOutput.send([MIDI_EVENT.NOTE_ON+1, event.note, event.velocity])
        }, event.startMs);
        setTimeout(() => {
            midiState.currentOutput.send([MIDI_EVENT.NOTE_OFF+1, event.note, 0])
        }, event.endMs);
    }
    for (const event of controlEvents) {
        setTimeout(() => {
            midiState.currentOutput.send([MIDI_EVENT.CONTROL_CHANGE, event.control, event.value])
        }, event.startMs);
    }
    for (const event of programEvents) {
        setTimeout(() => {
            midiState.currentOutput.send([MIDI_EVENT.PROGRAM_CHANGE, event.program])
        }, event.startMs);
    }
}

// ################### DEBUG FUNCTIONS (prefixed with debug) ##################

function debugChannels(tracks) {
    // TODO: The only current files which does multiple channels also do multiple play tracks
    const channels = new Set();
    for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        for (const event of track.events) {
            if (event.type === MIDI_EVENT.NOTE_ON) {
                channels.add(event.channel);
            }
        }
    }
    return channels
}

function debugEventCounter(chunks) {
    let header = chunks[0];
    let counts = [];
    for (let i = 0; i < header.ntrks; i++) {
        let counter = {};
        counter[MIDI_EVENT.NOTE_OFF] = [];
        counter[MIDI_EVENT.NOTE_ON] = [];
        counter[MIDI_EVENT.POLYPHONIC_AFTERTOUCH] = [];
        counter[MIDI_EVENT.CONTROL_CHANGE] = [];
        counter[MIDI_EVENT.PROGRAM_CHANGE] = [];
        counter[MIDI_EVENT.CHANNEL_AFTERTOUCH] = [];
        counter[MIDI_EVENT.PITCH_BEND] = [];
        counter["meta"] = [];
        counter["sysex"] = [];
        counter["min"] = Infinity;
        counter["max"] = -Infinity;
        counter["notes"] = {};
        counts.push(counter);

        let track = chunks[i + 1];
        assert(track.type === CHUNK_TYPE.TRACK, `Chunk ${i} expected track found ${track.type}`);

        for (const event of track.events) {
            if (!event.type) {
                if (event.status === 0xFF) {
                    counter["meta"].push(event)
                } else {
                    assert(event.status === 0xF0 || event.status === 0xF7, `Found event non-midi, non-meta, non-sysex event ${event}`);
                    counter["sysex"].push(event)
                }
            } else {
                counter[event.type].push(event)
                if (event.note) {
                    counter["min"] = Math.min(counter["min"], event.note);
                    counter["max"] = Math.max(counter["max"], event.note);
                }

                if (event.type === MIDI_EVENT.NOTE_OFF || (event.type === MIDI_EVENT.NOTE_ON && event.velocity === 0)) {
                    counter["notes"][event.note] -= 1
                } else if (event.type === MIDI_EVENT.NOTE_ON) {
                    if (counter["notes"][event.note] === undefined) {
                        counter["notes"][event.note] = 0
                    }
                    counter["notes"][event.note] += 1

                } 
            }
        }
        for (let note in counter["notes"]) {
            // TODO: Figure out what to do if the count is off for an otherwise fine file (e.g. This Game)
            // assert(counter["notes"][note] === 0, `Expected Number of NOTE_ON and NOTE_OFF to be equal, but was off by ${counter["notes"][note]} for note ${note} in track ${i}`);
        }
    }
    return counts;
}

// ######################## MISC HELPER FUNCTIONS #####################

function isSorted(values) {
    if (values.length === 0) return true;
    let result = true;
    let current = values[0];
    for (let i = 1; i < values.length; i++) {
        const value = values[i];
        if (value < current) {
            result = false;
            break;
        }
    }
    return result;
}

function isNullOrUndefined(o) {
    return o === null || o === undefined;
}

function isNoteOffEvent(event) {
    return event.type === MIDI_EVENT.NOTE_OFF || (event.type === MIDI_EVENT.NOTE_ON && event.velocity === 0);
}

function getTextHeight(ctx, text) {
    const textMetrics = ctx.measureText(text);
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}

// function isTempoEvent(event) {
//     return event.metaType && event.metaType === META_EVENT.setTimeout;
// }

// Assumes the list contains elements with an end time
function getPlayTrackEndMsTime(noteEvents) {
    let endMs = 0;
    for (let i = 0; i < noteEvents.length; i++) {
        const event = noteEvents[i];
        if (event.endMs > endMs) {
            endMs = event.endMs;
        }
    }
    return endMs;
}

// Takes a list of events with a start time and batches (i.e. groups) them such that events with the same start time are in the same group
// Assumes the list of events is sorted on the start time.
// TODO: Generalize to grouping on other values
function batchNoteEvents(noteEvents) {
    const noteEventsBatched = [];
    let previous = noteEvents[0]; // Works even for empty lists
    let group = [];
    for (const event of noteEvents) {
        if (event.time === previous.time) {
            assert(group.every(e => e.note != event.note), `The same note should not be added twice at the same time. ${event} already in ${group}`)
            group.push(event);
        } else {
            noteEventsBatched.push(group);
            group = [event];
            previous = event;
        }
    }
    if (group.length > 0) noteEventsBatched.push(group); // Push any lingering groups
    return noteEventsBatched;
}

// Time string is most in minutes since we do not expect to see hour long midi files. Also, if that happens then 74 or 136 minutes is not too hard to read either.
function millisecondsToTimeString(milliseconds) {
    assert(milliseconds >= 0, `Expected input to be non-negative, was ${milliseconds}`);
    var minutes = Math.floor(milliseconds / 60000);
    var seconds = Math.floor((milliseconds % 60000) / 1000);
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return (minutes + ":" + seconds);
}
function calcAccumulatedDeltaTimes(a) {
    const result = [];
    let runningTime = 0;
    for (const e of a) {
        assert(typeof e.deltaTime === 'number', `Expected event to have a deltaTime number`);
        runningTime += e.deltaTime;
        result.push(runningTime);
    }
    return result;
}
function addAccumulativeDeltaTimesToTrackEvents(trackEvents) {
    let runningTime = 0;
    for (const event of trackEvents) {
        assert(typeof event.deltaTime === 'number', `Expected event to have a deltaTime number`);
        runningTime += event.deltaTime;
        event.accumulatedDeltaTime = runningTime;
    }
}

function mergeTrackChunksEvents(a, b) {
    const result = [];
    let i = 0, j = 0, prevTime = 0;
    while (i < a.length && j < b.length) {
        if (a[i].time < b[j].time ||  // Order first by time
            (a[i].time === b[j].time && a[i].trackNumber < b[j].trackNumber) || // Next by track number
            (a[i].time === b[j].time && a[i].trackNumber === b[j].trackNumber && a[i].eventNumber <= b[j].eventNumber)) { // Finally by event number
            result.push({
                ...a[i], // Copy
                deltaTime: a[i].time - prevTime
            });
            prevTime = a[i].time;
            i++;
        } else {
            result.push({
                ...b[j], // Copy
                deltaTime: b[j].time - prevTime
            });
            prevTime = b[j].time;
            j++;
        }     
    }
    // Rest of whatever remains in the other. Loop will not enter both since either i or j was too big in the above loop
    while (j < b.length) { 
        result.push({
            ...b[j], // Copy
            deltaTime: b[j].time - prevTime
        });
        prevTime = b[j].time;
        j++;
    }
    while (i < a.length) { 
        result.push({
            ...a[i], // Copy
            deltaTime: a[i].time - prevTime
        });
        prevTime = a[i].time;
        i++;
    }
    return result; 
}