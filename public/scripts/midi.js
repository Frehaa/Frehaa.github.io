'use strict';
const KEY_CODE_SPACE = 'Space';
// const KEY_CODE_NUMPAD_PLUS = "";
// const KEY_CODE_NUMPAD_PLUS = "";
let l = console.log
function assert(p, msg) {
    if (!p) throw new Error(msg);
}
const TRACK_FORMAT = Object.freeze({
    SINGLE_MULTICHANNEL_TRACK: 0,
    SIMULTANEOUS_TRACKS: 1,
    INDEPENDENT_TRACKS: 2
});

const CHUNK_TYPE = Object.freeze({
    HEADER: 1297377380, // MThd
    TRACK: 1297379947   // MTrk
});

const CONTROL_FUNCTION = Object.freeze({
    BANK_SELECT: 0, // Used in some synthesizers to expand then number of sounds
    CHANNEL_VOLUME: 7,
    PAN: 10, // The operation of playing the audio louder in one side or the other side of a stereo audio
    DAMPER_PEDAL: 64,
    SOSTENUTO: 66,
    SOFT_PEDAL: 67,
});

const META_EVENT = Object.freeze({
    SEQUENCE_NUMBER: 0x00,
    TEXT_EVENT: 0x01,
    COPYRIGHT_NOTICE: 0x02,
    TRACK_NAME: 0x03,
    INSTRUMENT_NAME: 0x04,
    LYRIC: 0x05,
    MARKER: 0x06,
    CUE_POINT: 0x07,
    MIDI_CHANNEL_PRFIX: 0x20,
    END_OF_TRACK: 0x2F,
    SET_TEMPO: 0x51,
    SMPTE_OFFSET: 0x54,
    TIME_SIGNATURE: 0x58,
    KEY_SIGNATURE: 0x59,
    SEQUENCE_SPECIFIC: 0x7F
});

const STATUS = Object.freeze({
    META_EVENT: 0xFF,
    SYS_EXCLUSIVE_START: 0xF0,
    SYS_EXCLUSIVE_END: 0xF7,
});

const MIDI_EVENT = Object.freeze({  // Channel Voice Messages
    NOTE_OFF: 0x80,                 // 2 data bytes
    NOTE_ON: 0x90,                  // 2 data bytes
    POLYPHONIC_AFTERTOUCH: 0xA0,    // 2 data bytes
    CONTROL_CHANGE: 0xB0,           // 2 data bytes
    PROGRAM_CHANGE: 0xC0,           // 1 data bytes
    CHANNEL_AFTERTOUCH: 0xD0,       // 1 data bytes
    PITCH_BEND: 0xE0,               // 2 data bytes
});
const CLEFF = Object.freeze({
    TREBLE: 0,
    BASS: 1,
});
const ENTER_KEY = "Enter";

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
function numToKeyboardNoteName(num) {
    num = num - 12;
    const letters = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B", ];
    const l = num % letters.length;
    const n = Math.floor(num / letters.length);
    return [letters[l], n];
}


// #################### PARSING FUNCTIONS #####################

// TODO: 
function parseTimeSignature(metaData) {
    assert(metaData.length === 4, `Expected four values for the time signature meta data, found ${metaData.length}`);
    const numerator = metaData[0];
    const denominator = 2 ** metaData[1];

    const midiClocksPerMetronomeClick = metaData[2];
    const thirtySecondNotesPerQuarterNote = metaData[3];

    return {
        numerator,
        denominator,
        midiClocksPerMetronomeClick,
        thirtySecondNotesPerQuarterNote
    }
}

function formatParseErrorMessage(offset, msg) {
    return `At byte ${offset}(${offset.toString(16)}): ${msg}`;
}

// Transforming meta data for SET TEMPO META EVENT into value (meta data should be an array of 3 bytes)
function parseTempoMetaData(metaData) {
    return metaData[0] << 16 | metaData[1] << 8 | metaData[2];
}

// Reads a variable length value from dataView starting at offset. Returns value and new offset at end of value
function parseVariableLengthValue(dataView, offset) {
    let value = 0;
    let length = 0;
    while (true) {
        let deltaByte = dataView.getUint8(offset + length)
        length++;
        value = (value << 7) | (deltaByte & 0x7F);
        if ((deltaByte & 0x80) === 0) break;
    } 
    return [value, offset + length]
}

function parseMidiFile(buffer) {
    let dataView = new DataView(buffer);
    let offset = 0, chunk, chunks = [];
    [chunk, offset] = parseChunk(dataView, offset)
    let header = chunk;
    assert(header.type === CHUNK_TYPE.HEADER, `First chunk had invalid type. Expected header found ${header.type}`);
    chunks.push(header);

    let count = 0;
    while (count < header.ntrks) {
        try {
            [chunk, offset] = parseChunk(dataView, offset);
            if (chunk.type === CHUNK_TYPE.TRACK) { // Ignore non track chunks
                chunks.push(chunk);
                count++;
            } else {
                // TODO: Silently ignore unknown chunk types  (use log warn instead?)
                assert(false, `Found unknown chunk type found ${chunk.type}`);
            }
        } catch (e) {
            l('Chunks', chunks);
            throw e
        }
    }
    return chunks;
}

// struct MTHD_CHUNK
// {
//    /* Here's the 8 byte header that all chunks must have */
//    char           ID[4];  /* This will be 'M','T','h','d' */
//    unsigned long  Length; /* This will be 6 */

//    /* Here are the 6 bytes */
//    unsigned short Format;
//    unsigned short NumTracks;
//    unsigned short Division;
// };

// TODO: Maybe throw away chunk length information (or keep for debugging? Or assert correctness and then throw away?)
function parseChunk(dataview, offset) {
    assert(dataview.byteLength > offset + 8, formatParseErrorMessage(offset, `The dataview did not contain enough bytes to read chunk`));
    const type = dataview.getUint32(offset);
    const length = dataview.getUint32(offset + 4);

    offset += 8;
    switch (type) {
        case CHUNK_TYPE.HEADER: { // Parse Header chunk
            assert(length >= 6, formatParseErrorMessage(offset-4, `Data length too small for header chunk. Expected at least 6, found ${length}`));  
            const format = dataview.getUint16(offset);
            const ntrks = dataview.getUint16(offset + 2);
            const division = dataview.getUint16(offset + 4);
            // assert((division & 0x80) === 0, `Expected division to be given as ticks per quarter-note, but was in SMPTE format`);

            offset += length;
            const chunk = {
                type,
                format,
                ntrks,
                division
            };
            return [chunk, offset];
        } 
        case CHUNK_TYPE.TRACK: { // Parse Track chunk
            const chunk = {
                type, 
                events: [] 
            };
            let finalOffset = offset + length;
            assert(length > 0, formatParseErrorMessage(offset, `Length of Track chunk was 0`));
            let event, runningStatus = null;
            do {
                try {
                    [event, offset] = parseEvent(dataview, offset, runningStatus);
                    chunk.events.push(event);
                    runningStatus = event.status;
                } catch(e) {
                    l('Current chunk', chunk)
                    throw e
                }
            } while (!(event.metaType && event.metaType === META_EVENT.END_OF_TRACK));
            assert(offset === finalOffset, formatParseErrorMessage(offset, `Track Chunk data was different from expected. Expected ${finalOffset} - Found ${offset}`));
            return [chunk, finalOffset];
        } 
        default: {
            const chunk = {
                type,
            };
            return [chunk, offset + length];
        }
    }
}

function readUint8ToArray(dataView, offset, length, array) {
    for (let i = 0; i < length; i++) { // Read length data
        array.push(dataView.getUint8(offset + i));
    }
}

function parseEvent(dataView, offset, runningStatus) {
    let dt;
    [dt, offset] = parseVariableLengthValue(dataView, offset)
    const deltaTime = dt;
    let status = dataView.getUint8(offset);

    if ((status & 0x80) === 0) { // Use running status as status and shift offset back
        assert(runningStatus !== null, formatParseErrorMessage(offset, `Expected running status to be set but was null`));
        status = runningStatus;
        offset -= 1;
    }

    let eventData = null;
    if (status === STATUS.SYS_EXCLUSIVE_START || status === STATUS.SYS_EXCLUSIVE_END) {
        [length, offset] = parseVariableLengthValue(dataView, offset + 1);
        eventData = {
            length,
            sysex: []
        }
        readUint8ToArray(dataView, offset, length, eventData.sysex);
        assert(eventData.sysex.length === length, formatParseErrorMessage(offset, `System exclusive message length was different from expected. expected ${eventData.sysex.length} actual ${length}`));
        assert(eventData.sysex[length-1] === 0xF7, formatParseErrorMessage(offset + length - 1, `Expected 0xF7 at end of SYSEX Event, found ${eventData.sysex[length-1]}`));
        offset = offset + length;
    } else if (status === STATUS.META_EVENT) { 
        const metaType = dataView.getUint8(offset + 1);
        [length, offset] = parseVariableLengthValue(dataView, offset + 2);
        eventData = { metaType, length, metaData: [] };
        readUint8ToArray(dataView, offset, length, eventData.metaData);
        assert(eventData.metaData.length === length, formatParseErrorMessage(offset, `META event message length was different from expected. expected ${eventData.metaData.length} actual ${length}`));
        offset = offset + length;
    } else { 
        const channel = status & 0x0F;
        const type = status & 0xF0;
        eventData = {
            type,
            channel
        }
        switch (type) {
            case MIDI_EVENT.NOTE_OFF: 
            case MIDI_EVENT.NOTE_ON: {
                eventData["note"] = dataView.getUint8(offset + 1);
                eventData["velocity"] = dataView.getUint8(offset + 2);
                offset += 3;
            } break;
            case MIDI_EVENT.POLYPHONIC_AFTERTOUCH: {
                eventData["note"] = dataView.getUint8(offset + 1);
                eventData["pressure"] = dataView.getUint8(offset + 2);
                offset += 3;
            } break;
            case MIDI_EVENT.CONTROL_CHANGE: {
                eventData["control"] = dataView.getUint8(offset + 1);
                eventData["value"] = dataView.getUint8(offset + 2);
                offset += 3;
            } break;
            case MIDI_EVENT.PROGRAM_CHANGE: {
                eventData["program"] = dataView.getUint8(offset + 1);
                offset += 2;
            } break;
            case MIDI_EVENT.CHANNEL_AFTERTOUCH: {
                eventData["pressure"] = dataView.getUint8(offset + 1);
                offset += 2;
            } break;
            case MIDI_EVENT.PITCH_BEND: {
                eventData["bendlsb"] = dataView.getUint8(offset + 1);
                eventData["bendmsb"] = dataView.getUint8(offset + 2);
                offset += 3;
            } break;
            default: {
                assert(false, formatParseErrorMessage(offset, `Unknown MIDI event ${type}`));
            } break;
        }
    } 
    const event = {
        deltaTime, 
        status, 
        ...eventData
    };
    return [event, offset];
}


// ################ INITIALIZATION FUNCTIONS #########################

const emptyIO = {
    send: () => {}
};
const emptyMap = {
    has: () => { return false; }
}

function addSelectOption(select, list) {
    list.forEach((v, i, a) => {
        const option = document.createElement('option');
        option.value = i;
        option.innerHTML = i
        select.appendChild(option);
    });
}

function initializeCanvasMidiEvents(mideState) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');

    // TODO: Center and pick font
    ctx.font = '36px Aria';
    ctx.fillText("Click to Pick file", 100, 500);

    canvas.addEventListener('click', (e) => {
        if (mideState.chunks === null) {
            document.getElementById('file-input').click();
        }
    });

    canvas.addEventListener('dragover', e => {
        e.preventDefault(); // This is required for drop event
    });

    canvas.addEventListener('drop', e => {
        if (e.dataTransfer.files.length == 0) return;
        e.preventDefault(); // This prevents the downloading of file

        // Add the dropped file and dispatch the change event to the fileInput
        const fileInput = document.getElementById('file-input');
        fileInput.files = e.dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
    });
}

function initializeInputMidiEvents(midiState) {
    const midiOutputSelect = document.getElementById('midi-output-select');
    midiOutputSelect.addEventListener('change', e => {
        let value = midiOutputSelect.value
        l('change output', value)
        if (midiState.outputs.has(value)) {
            let output = midiState.outputs.get(value);
            midiState.currentOutput = output;
        } else {
            midiState.currentOutput = emptyIO;
        }
    });

    const midiInputSelect = document.getElementById('midi-input-select');
    midiInputSelect.addEventListener('change', e => {
        let value = midiInputSelect.value
        l('change input', value)
        if (midiState.outputs.has(value)) {
            let output = midiState.outputs.get(value);
            midiState.currentOutput = output;
        } else {
            midiState.currentOutput = emptyIO;
        }
    });
}

// Initialized the midi state and sets up the events for it
function initializeMidiState() {
    const midi = {
        chunks: null,
        inputs: emptyMap,
        outputs: emptyMap,
        currentInput: emptyIO,
        currentOutput: emptyIO
    };

    initializeInputMidiEvents(midi);
    initializeCanvasMidiEvents(midi);

    initializeMIDIUSBAccess(
        midiAccess => {
            // TODO: Handle disconnects and reconnects
            // midiAccess.onglobalMidichange = handleMidiAccessStateChange;
            l("Inputs:", midiAccess.inputs, " - Outputs:", midiAccess.outputs, " - Sysex:", midiAccess.sysexEnabled, midiAccess);
            midi.inputs = midiAccess.inputs;
            midi.outputs = midiAccess.outputs;

            const midiInputSelect = document.getElementById('midi-input-select');
            addSelectOption(midiInputSelect, midiAccess.inputs);
            let entry = midiAccess.inputs.entries().next();
            if (!entry.done) {
                let [value, input] = entry.value;
                midiInputSelect.value = value;
                midi.currentInput = input;
            }
            
            const midiOutputSelect = document.getElementById('midi-output-select');
            addSelectOption(midiOutputSelect, midiAccess.outputs);
            entry = midiAccess.outputs.entries().next();
            if (!entry.done) {
                let [value, input] = entry.value;
                midiOutputSelect.value = value;
                midi.currentOutput = input;
            }
            l(midi)
        }, 
        error => {
            console.log("Failed to access MIDI devices:", error);
        }
    );

    return midi;
}

function initializeFileInput(callback) {
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
        reject("Operation unsupported");
    }
}
function initializePlaybackState() {
    const playbackState = {
        pause: false,
        speedMultiplier: 1
    };
    document.addEventListener('keypress', e => {
        if (e.code === "Space") playbackState.pause = !playbackState.pause
        else if (e.key === "+") playbackState.speedMultiplier += 1
        else if (e.key === "-") playbackState.speedMultiplier -= 1
    });

    const input = document.createElement('input');
    input.type = 'number'
    input.addEventListener('input', e => {
        const n = Number(input.value);
        if (Number.isNaN(n)) {
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
            playbackState.speedMultiplier = n;
        }
    });
    document.body.appendChild(input)
    return playbackState;
}

// ################### DRAWING FUNCTIONS ###########

function drawFallingNotes(ctx, noteEvents, elapsed, { msToPixel, noteFill, topLineHeight }) {
    // TODO: Maybe draw the notes such that the start time is equal to when it hits the bottom. e.g. elapsed = 0 is when the first note is played, and so there is a short countdown before the start.
    const noteWidth = 20
    ctx.beginPath()
    ctx.moveTo(0, topLineHeight);
    ctx.lineTo(ctx.canvas.width, topLineHeight);
    ctx.stroke();
    for (let i = 0; i < noteEvents.length; i++) {
        const event = noteEvents[i];
        // l(event.start, event.end, elapsed)
        // if (elapsed < event.start) break; // Stop processing more events since they wont be shown anyway. (Requires input to be sorted)

        const top = (-event.end + elapsed) * msToPixel + topLineHeight;
        if (top > topLineHeight) continue;  

        const left = 10 + event.note * 14 - noteWidth/2;
        const height = (event.end - event.start) * msToPixel;

        ctx.fillStyle = noteFill(event, i);
        if (topLineHeight - top < height) {
            ctx.fillRect(left, top, noteWidth, topLineHeight - top);
        } else {
            ctx.fillRect(left, top, noteWidth, height);
        }            
    }
}

function drawTimeMeasures(ctx, timeMeasures) {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    for (let i = 0; i < timeMeasures.length; i++) {
        const measureTime = timeMeasures[i].start;
        let y = (elapsed - measureTime) * msToPixel;
        if (y > topLineHeight) continue
        ctx.fillText(i, 25, y)
        ctx.moveTo(50, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

function draw(wholeNoteImage, notes, time) {
    let canvas = document.getElementById('note-canvas');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4
    let startX = 100 ;
    let startY = 250;
    let length = 1800;
    let offSetY = ctx.lineWidth * 15;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.moveTo(startX, startY + offSetY * i);
        ctx.lineTo(startX + length, startY + offSetY * i);
    }
    ctx.moveTo(startX + 100, startY - 10);
    ctx.lineTo(startX + 100, startY + offSetY * 4 + 10);
    ctx.stroke();

    const noteHeight = offSetY * 1.1;
    const noteWidth = noteHeight * 40/25

    // Positions are given as 0 being the middle of G thingy
    // Time is now just given as numbers from 0 and up
    function drawNote(noteValue, time, cleff) {
        let position;
        switch (cleff) {
            case CLEFF.TREBLE: {
                position = noteValue;
            } break;
            case CLEFF.BASS: {
                position = noteValue + 12;
            } break;
            default: {
                throw new Error("Unknown cleff");
            } break;
        }
        if (Math.abs(position) > 10) {
            // TO BE FIXED SOMEHOW
            throw new Error("Position out of bound");
        }
        let timeOffset = noteWidth * 2;
        let x = startX + timeOffset * time;
        let y = startY + 2 * offSetY - noteHeight / 2 + (-position) * offSetY / 2;

        drawLedgerLines(position, time)

        ctx.drawImage(wholeNoteImage, x, y, noteWidth, noteHeight);
    }
    function drawLedgerLines(position, time) {
        let numberOfLines = Math.ceil((Math.abs(position) - 5) / 2);
        const ledgerLineWidth = noteWidth * 1.1;
        let x = startX + 2 * noteWidth * time;
        
        if (position > 0) {
            // Draw ledger lines
            ctx.beginPath();
            for (let i = 0; i < numberOfLines; i++) {
                ctx.moveTo(x - noteWidth * 0.1, startY - offSetY * (i+1));
                ctx.lineTo(x + ledgerLineWidth, startY - offSetY * (i+1));
            }
            ctx.stroke();
        } else if (position < 0) {
            ctx.beginPath();
            for (let i = 0; i < numberOfLines; i++) {
                ctx.moveTo(x - noteWidth * 0.1, startY + offSetY * (5 + i));
                ctx.lineTo(x + ledgerLineWidth, startY + offSetY * (5 + i));
            }
            ctx.stroke();
        }
    }

    // TODO: move treble position calculation out of draw call
    // TODO: Move ledger lines out of draw call
    for (const note of notes) {
        drawNote(note[0], note[1] - time * 0.001, CLEFF.TREBLE);
        
    }
}

function drawNoteNamesAndTopLine(top) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'black'
    ctx.font = "10px Georgia";

    const letters = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B", ];
    // const letters = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", ];
    for (let i = 0; i < 128; i++) {
        const note = letters[i % letters.length];
        // Mark boundary and middle notes
        if (i === 60 || i === 21 || i === 108) {
            ctx.fillStyle = 'red'
        } else {
            ctx.fillStyle = 'black'
        }

        // Draw white or black note
        if (note.length == 2) {
            ctx.fillText(note[0], 8 + i * 14, top + 20);
            ctx.font = "8px Georgia";
            ctx.fillText(note[1], 14 + i * 14, top + 16);
            ctx.font = "10px Georgia";
        } else {
            ctx.fillText(note, 10 + i * 14, top + 40);
        }

        // Draw octave partitioner
        if (note === "B") {
            ctx.beginPath();
            ctx.moveTo(21 + i * 14, top);
            ctx.lineTo(21 + i * 14, top + 45);
            ctx.stroke();

        }

    }

    const cutLineHeight = top;
    ctx.beginPath();
    ctx.moveTo(0, cutLineHeight);
    ctx.lineTo(canvas.width, cutLineHeight);
    ctx.stroke();
}

// ################# EVENT HANDLING FUNCTIONS #######################

function handleOnMidiMessage(event) {
    const data = event.data;
    const status = data[0] & 0xF0;
    const channel = data[0] & 0x0F;
    switch (status) {
        case MIDI_EVENT.NOTE_ON:
        case MIDI_EVENT.NOTE_OFF: {
            l(`Event ${status.toString(16)} Note ${numToKeyboardNoteName(data[1])} Channel ${channel} Velocity ${data[2]}`);
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

// ############# MAIN #############

function main() {
    runTests();
    const playbackState = initializePlaybackState();

    // const ctx = document.getElementById('note-canvas').getContext('2d');
    // const endTime = getPlayTrackEndTime(noteEvents)
    // return playback(ctx, endTime, playbackState, () => {
    //     const width = ctx.canvas.width - 400;
    //     const offsetY = ctx.canvas.height - 50;
    //     const noteFill = (note, i) => {
    //         return [ "#54478cff", "#2c699aff", "#048ba8ff", "#0db39eff", "#16db93ff", "#83e377ff", "#b9e769ff", "#efea5aff", "#f1c453ff", "#f29e4cff", ][i % 10];
    //     };
    //     return [{}, (ctx, elapsed, state) => {
    //         drawFallingNotes(ctx, [{
    //             "note": 60,
    //             "start": 0,
    //             "velocity": 78,
    //             "end": 1000,
    //         }], elapsed, {msToPixel: 0.27, noteFill, topLineHeight: 600});
    //         drawNoteNamesAndTopLine(600)
    //         drawTimeBar(ctx, elapsed, endTime, {
    //             width, offsetX: 200, offsetY, notchHeight: 6, font: "18px Courier New", textColor: 'black', lineColor: 'black'
    //         });
    //         playbackState.pause = true
    //     }];
    // });

    // const framesPerSecond = 300
    // const positions = [
    //     [canvas.width / 2, canvas.height / 2],
    //     [0.1 * canvas.width,  50],
    //     [0.7 * canvas.width,  canvas.height -100]
    // ]
    // const positions = createPointShape(framesPerSecond, [canvas.width / 2, canvas.height / 2], endTime, spiralUpdater);
    // return animatePointLine(ctx, framesPerSecond, endTime, positions, playbackState)

    const midiState = initializeMidiState();
    initializeFileInput(buffer => {
        try {
            midiState.chunks = parseMidiFile(buffer);
        } catch(e) {
            l('Stuff went wrong in parsing', e)
        }
        try {
            play(midiState)
        } catch(e) {
            l('Stuff went wrong in playing', e)
        }
    });
}

function play(midi) {
    // TODO: Have playback with speed modifier and pause work for this too. (Possibly do this by sending MIDI events based on animation)
    l("\nGlobal MIDI:", midi)
    l("Event Counts:", debugEventCounter(midi.chunks));

    const division = midi.chunks[0].division;
    const format = midi.chunks[0].format;
    const playTracks = getPlayTrackEvents(format, midi.chunks);
    l(`Format ${format} division ${division}`);
    l(`Play tracks:`, playTracks);

    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const topLineHeight = 560;
    drawNoteNamesAndTopLine(topLineHeight);
    const timeFromTopToBottomMilliseconds = 2000;
    const msToPixel = topLineHeight / timeFromTopToBottomMilliseconds;

    for (let t = 0; t < playTracks.length; t++) {
        assert(t === 0, `Found ${playTracks.length} tracks, which should not happen while we do not support format 2`);
        l(`Track ${t}`, playTracks[t])

        // TODO: HOW THE F DO I FIND THE TIMES FOR WHEN TO ADD MEASURE LINES??? (I FOUND TIMES BUT THEY ARE OFTEN BAD. HOW TO FIX?
        // TODO: Make the measure starts and time signatures customizable. 
        // The first one is a 0. So far so good. The next time is at??????????????
        const timeMeasures = [] //getMeasures(playTracks[t], division); 
        // l(`Time measures`, timeMeasures)

        const [noteEvents, controlEvents, programEvents, keySignatures] = splitEventsAndConvertToMilliseconds(playTracks[t], division);

        // return;

        noteEvents.sort((a, b) => {
            if (a.start < b.start) return -1;
            if (b.start < a.start) return 1;
            return 0;
        });    

        const noteEventsBatched = batchNoteEvents(noteEvents);
        // l(`Note events batched`, noteEventsBatched)

        const noteFill = (note, i) => {
            return [ "#54478cff", "#2c699aff", "#048ba8ff", "#0db39eff", "#16db93ff", "#83e377ff", "#b9e769ff", "#efea5aff", "#f1c453ff", "#f29e4cff", ][i % 10];
        };

        // TODO: Stop playing current song when new song is selected
        // animateFallingNotes(noteEvents, timeMeasures, { noteFill, topLineHeight, msToPixel } );
        // setTimeout(() => { // Gives a warning on long files. 
        //     playEventsByScheduling(midi, noteEvents, controlEvents, programEvents)
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


        // INTERACTIVE STUFF
        const currentlyPressed = new Set();
        let lastPedal = false;
        let currentNoteGroup = 0; // Start note
        let currentElapsed = noteEventsBatched[currentNoteGroup][0].start;

        ctx.clearRect(0, 0, canvas.width, topLineHeight);
        drawFallingNotes(ctx, noteEvents, currentElapsed, { msToPixel, noteFill, topLineHeight });
        // TODO: fix wrong display

        function update(newNoteGroup) {
            ctx.clearRect(0, 0, canvas.width, topLineHeight);

            currentNoteGroup = newNoteGroup;
            if (currentNoteGroup >= noteEventsBatched.length) {

            } else {
                currentElapsed = noteEventsBatched[currentNoteGroup][0].start;
                drawFallingNotes(ctx, noteEvents, currentElapsed, { msToPixel, noteFill, topLineHeight });
            }
        }

        function noteOff() {
            if (currentlyPressed.size > 0) { // Reset on error
                currentlyPressed.clear();
                update(0);
            }
        }

        midi.currentInput.onmidimessage = (e) => { 
            switch (e.data[0] & 0xF0) {
                case MIDI_EVENT.NOTE_ON: {
                    if (e.data[2] === 0) { // If velocity is 0 then it is a NOTE_OFF event
                        noteOff();
                    } else {
                        currentlyPressed.add(e.data[1]);
                    }
                } break;
                case MIDI_EVENT.NOTE_OFF: {
                    noteOff()
                } break;
                case MIDI_EVENT.CONTROL_CHANGE: {
                    if (e.data[1] === CONTROL_FUNCTION.DAMPER_PEDAL) {
                        if (e.data[2] === 0) {
                            lastPedal = false;
                        } else if (lastPedal === false) {
                            // lastPedal = true; // This gives fast return to start
                            // currentNoteGroup = Math.max(0, currentNoteGroup - 1);
                            update(0);
                        }
                    } 
                } break;
                default: {// Do not know yet? Maybe do nothing
                } break
            }
            
            const currentGroup = noteEventsBatched[currentNoteGroup]
            if (currentNoteGroup < noteEventsBatched.length && currentlyPressed.size === currentGroup.length) {
                const success = currentGroup.reduce((s, e) => currentlyPressed.has(e.note) && s, true);
                if (success) {
                    currentlyPressed.clear();
                    update(currentNoteGroup + 1);
                    if (currentNoteGroup === noteEventsBatched.length) {
                        l('win')
                    } 
                }  
            }
        }

    }
}

function getPlayTrackEvents(format, chunks) {
    const tracks = []; // Size should be 1 for format 0 and 1. Format 2 can have multiple
    switch (format) {
        case TRACK_FORMAT.SINGLE_MULTICHANNEL_TRACK: {
            assert(chunks.length === 2, `Expected Single track format to only have 1 header chunk and 1 track chunk`);
            tracks.push(chunks[1].events);
        } break;
        case TRACK_FORMAT.SIMULTANEOUS_TRACKS: {
            assert(chunks.length > 2, `Expected simultaneous track format to only have 1 header chunk and at least 2 track chunk`);
            let trackEvents = chunks[1].events
            for (let i = 2; i < chunks.length; i++) {
                trackEvents = mergeTrackChunksEvents(trackEvents, chunks[i].events)
            }
            tracks.push(trackEvents);
        } break; 
        case TRACK_FORMAT.INDEPENDENT_TRACKS: {
            assert(false, `Unhandled multiple independent tracks`);
            // TODO: Maybe just implement this as a list which adds every tracks event to the tracks list? This does not seem like an issue for play practice, but may be an issue for ?? maybe nothing. But I guess I will wait with this until I have a file
        } break;
        default: {
            assert(false, `Unknown track format ${format} in header`);
        }
    }
    return tracks;
}


function getMeasures(playTrack, division) {
    let measures = [{deltaTime: 0, measure: true}]; // First measure is at deltaTime 0 
    let summedMeasureTimes = 0;
    const deltaTimes = playTrack.map(v => v.deltaTime);
    const summedDeltaTime = deltaTimes.reduce((s, a) => s + a, 0);

    let currentTimeSignature = { numerator: 4, denominator: 4 };  // Default time signature
    for (let i = 0; i < playTrack.length; i++) {
        const event = playTrack[i];
        if (event.status === STATUS.META_EVENT && event.metaType === META_EVENT.TIME_SIGNATURE) {
            let deltaTime = event.deltaTime;
            // assert(deltaTime, `Expected the deltaTime to be at the start of a new measure, but was ${deltaTime}`); // Not sure how to write the test
            while (summedMeasureTimes < deltaTime) {
                if (currentTimeSignature.denominator === 4) {
                    const nextMeasure = currentTimeSignature.numerator * division;
                    measures.push({deltaTime: nextMeasure, measure: true });
                    summedMeasureTimes += nextMeasure;
                } else if (currentTimeSignature.denominator === 2) {
                    const nextMeasure = currentTimeSignature.numerator * division * 2;
                    measures.push({deltaTime: nextMeasure, measure: true });
                    summedMeasureTimes += nextMeasure;
                } else {
                    assert(false, `Not implemented for other time signatures`);
                }
            }
            currentTimeSignature = parseTimeSignature(event.metaData);
            l(`Updated time signature`, currentTimeSignature, "current measure times", measures)
            // return []
        }
    }
    while (summedMeasureTimes <= summedDeltaTime) { 
        if (currentTimeSignature.denominator === 4) {
            const nextMeasure = currentTimeSignature.numerator * division;
            measures.push({deltaTime: nextMeasure, measure: true });
            summedMeasureTimes += nextMeasure;
        } else if (currentTimeSignature.denominator === 2) {
            const nextMeasure = currentTimeSignature.numerator * division * 2;
            measures.push({deltaTime: nextMeasure, measure: true });
            summedMeasureTimes += nextMeasure;
        } else {
            assert(false, `Not implemented for other time signatures`);
        }
    }

    const tempos = playTrack.filter(isTempoEvent);
    return computeTimedEvents(measures, tempos, division);
}

// Midifies the events by adding a start time in milliseconds based on the tempos
function computeTimedEvents(events, tempos, division) {
    let currentTempo = parseTempoMetaData([0x07, 0xA1, 0x20]) // Default value of tempo 500.000 
    let tickToMsFactor = (currentTempo / division) / 1000;
    let result = [];

    const merged = mergeTrackChunksEvents(events, tempos);

    let runningTimeMilliseconds = 0;
    for (const event of merged) {
        runningTimeMilliseconds += event.deltaTime * tickToMsFactor;
        if (event.status === STATUS.META_EVENT && event.metaType === META_EVENT.SET_TEMPO) {
            currentTempo = parseTempoMetaData(event.metaData);
            tickToMsFactor = (currentTempo / division) / 1000;
        } else {
            result.push({
                start: runningTimeMilliseconds,
                ...event
            });
        }
    }
    return result;
}

// Splits a play track of events into separate lists for notes, controls, and program events.
// Events are transformed to have a start time in milliseconds
// Note events have a start and end time instead of two events
function splitEventsAndConvertToMilliseconds(playTrack, division) {
    // TODO: Maybe split into two functions. One for calculating milliseconds to events and another for splitting. Seriously, this method is starting to do too to much.
    const noteEvents = [];
    const controlEvents = [];
    const programEvents = [];
    const keySignatures = [];
    
    let tempo = parseTempoMetaData([0x07, 0xA1, 0x20]) // Default value of tempo 500.000 
    let tickToMsFactor = (tempo / division) / 1000;

    const startedNotes = {}; // Notes which are started but not ended.
    let runningTimeMilliseconds = 0
    for (let i = 0; i < playTrack.length; i++) {
        const event = playTrack[i];
        runningTimeMilliseconds += event.deltaTime * tickToMsFactor;
        if (event.status === STATUS.META_EVENT) {
            switch (event.metaType) {
                case META_EVENT.KEY_SIGNATURE: {
                    keySignatures.push({
                        ...event
                    });
                } break;
                case META_EVENT.SET_TEMPO: {
                    tempo = parseTempoMetaData(event.metaData);
                    tickToMsFactor = (tempo / division) / 1000;
                } break;
                case META_EVENT.TIME_SIGNATURE: { 
                } break;
            }
        }
        else if (event.type === MIDI_EVENT.NOTE_OFF || (event.type === MIDI_EVENT.NOTE_ON && event.velocity === 0)) {
            // assert(event.note !== null, `Expected ${event.note} not to be null.`);
            let note = startedNotes[event.note];
            if (note === null || note === undefined) continue;
            note.end = runningTimeMilliseconds;
            note.deltaTimeEnd = event.deltaTime;
            noteEvents.push(note);
            startedNotes[event.note] = null;
        }
        // TODO: The deltaTimeStart should be based on the accumulative delta time. Right now it is useless because it is relative to deleted events.
        else if (event.type === MIDI_EVENT.NOTE_ON) {
            let note = startedNotes[event.note];
            // assert(note === null || note === undefined, `Expected ${event.note} to be null on channel ${event.channel}, was ${startedNotes[event.note]}`);
            if (note === null || note === undefined) {
                startedNotes[event.note] = {
                    deltaTimeStart: event.deltaTime,
                    note: event.note,
                    start: runningTimeMilliseconds,
                    velocity: event.velocity,
                    channel: event.channel
                }
            } else { // TODO: Figure out what to do about the same note being played twice before being turned off (It is hard to hear a difference. So maybe it does not matter?)
                console.warn(`Double note ${event.note} at event ${i} at time ${runningTimeMilliseconds}`)
                note.end = runningTimeMilliseconds;
                note.deltaTimeEnd = event.deltaTime;
                noteEvents.push(note);
                startedNotes[event.note] = {
                    deltaTimeStart: event.deltaTime,
                    note: event.note,
                    start: runningTimeMilliseconds,
                    velocity: event.velocity,
                    channel: event.channel
                };
            }
        } else if (event.type === MIDI_EVENT.CONTROL_CHANGE) {
            controlEvents.push({
                deltaTimeStart: event.deltaTime,
                start: runningTimeMilliseconds,
                channel: event.channel,
                control: event.control,
                value: event.value
            });
        } else if (event.type === MIDI_EVENT.PROGRAM_CHANGE) {
            programEvents.push({
                deltaTimeStart: event.deltaTime,
                start: runningTimeMilliseconds,
                channel: event.channel,
                program: event.program,
            });
        }             
    }
    // Add all remaining measures
    // TODO: What if the time signature changes between measures? (Who the fuck knows. Seems like undefined behavior)

    return [noteEvents, controlEvents, programEvents, keySignatures];
}

/// ################# ANIMATE MIDI FUNCTIONS #############

// Assumes noteEvents are sorted 
// Combine with drawNoteNamesAndTopLine to have notes falling down to their respective key
function animateFallingNotes(noteEvents, timeMeasures, { noteFill, topLineHeight, msToPixel }) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    const timeFromTopToBottomMilliseconds = topLineHeight / msToPixel;
    
    const end = getPlayTrackEndTime(noteEvents);
    
    let startIndex = 0; // TODO: Stop processing notes already moved outside window. Use a running start index. This seems hard since the length of some notes are longer than others, so we still have to skip those in between. The gain also does not seem very significant
    let elapsed = -timeFromTopToBottomMilliseconds;
    let previous = null;
    function animate(t) {
        elapsed += t - previous;
        previous = t;

        ctx.clearRect(0, 0, canvas.width, topLineHeight);
        const songElapsed = Math.max(elapsed - timeFromTopToBottomMilliseconds, 0);
        drawFallingNotes(ctx, noteEvents, elapsed, { msToPixel, noteFill, topLineHeight });
        // drawTimeMeasures(ctx, timeMeasures);
        drawTimeBar(ctx, songElapsed, end, { width: canvas.width - 200, offsetX: 100, offsetY: topLineHeight + 60, notchHeight: 6, font: "18px Courier New", textColor: 'black', lineColor: 'black' });
        if (elapsed > end + timeFromTopToBottomMilliseconds) return;
        requestAnimationFrame(animate)
    }
    requestAnimationFrame(t => {
        previous = t;
        animate(t)
    });
}

function drawTimeBar(ctx, elapsed, end, drawSettings) {
    // TODO: Make a cooler time bar which is a filling tube with a neat colored effect on the filling
    // TODO: Make it possible to click time on bar (make this visualy clear)
    const endTimeString = millisecondsToTimeString(end);
    const { width, offsetX, offsetY, notchHeight, font, lineColor, textColor} = drawSettings;
    const playNotchX = offsetX + (elapsed / end) * width;

    ctx.font = font;
    ctx.fillStyle = textColor;
    const timeText = millisecondsToTimeString(elapsed) + "/" + endTimeString;
    const textHeight = getTextHeight(ctx, timeText);

    ctx.clearRect(0, offsetY, width, 30); // TODO: Calculate height based on font size and notch heights

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
        }, event.start);
        setTimeout(() => {
            midiState.currentOutput.send([MIDI_EVENT.NOTE_OFF+1, event.note, 0])
        }, event.end);
    }
    for (const event of controlEvents) {
        setTimeout(() => {
            midiState.currentOutput.send([MIDI_EVENT.CONTROL_CHANGE, event.control, event.value])
        }, event.start);
    }
    for (const event of programEvents) {
        setTimeout(() => {
            midiState.currentOutput.send([MIDI_EVENT.PROGRAM_CHANGE, event.program])
        }, event.start);
    }
}

async function playEventsBySleep(output, midiEvents) {
    for (const event of midiEvents) {
        if (event.deltaTime > 0) {
            await sleep(event.deltaTime);
        }
        assert(event.type !== undefined && event.type !== null, `midiEvents should always have a type`);
        switch (event.type) {
            case MIDI_EVENT.NOTE_OFF:
            case MIDI_EVENT.NOTE_ON: {
                output.send([event.type, event.note, event.velocity]);
            } break;
            case MIDI_EVENT.PROGRAM_CHANGE: {
                assert(event.program >= 0 && event.program <= 127, `Event program was outside expected range ${event.program.toString(16)}`);
                output.send([event.type, event.program]);
            } break;
            case MIDI_EVENT.CONTROL_CHANGE: {
                assert(0 <= event.value && event.value <= 127, `Control Change values was outside expected range ${event.value.toString(16)}`);
                switch (event.control) {
                    case CONTROL_FUNCTION.CHANNEL_VOLUME:  
                    case CONTROL_FUNCTION.DAMPER_PEDAL: 
                    case CONTROL_FUNCTION.SOSTENUTO: 
                    case CONTROL_FUNCTION.SOFT_PEDAL: { // Supported functions
                        output.send([event.type, event.control, event.value]);
                    } break;
                    default: {
                        l('Unsuported control', event.control);
                    }
                }
            } break;
            default: {
                l('Unsuported midi', event.type);
            }
        }
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

function getTextHeight(ctx, text) {
    const textMetrics = ctx.measureText(text);
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}

function clamp(min, v, max) {
    if (v < min) {
        return min;
    } 
    if (v > max) {
        return max;
    }
    return v;
}

function isTempoEvent(event) {
    return event.metaType && event.metaType === META_EVENT.setTimeout;
}

// Assumes the list contains elements with an end time
function getPlayTrackEndTime(noteEvents) {
    let end = 0;
    for (let i = 0; i < noteEvents.length; i++) {
        const event = noteEvents[i];
        if (event.end > end) {
            end = event.end;
        }
    }
    return end;
}

// Takes a list of events with a start time and batches (i.e. groups) them such that events with the same start time are in the same group
// Assumes the list of events is sorted on the start time.
// TODO: Generalize to grouping on other values
function batchNoteEvents(noteEvents) {
    const noteEventsBatched = [];
    let previous = noteEvents[0]; // Works even for empty lists
    let group = [];
    for (let i = 0; i < noteEvents.length; i++) {
        const event = noteEvents[i];
        if (event.start === previous.start) {
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

// Assumes two lists of track events which contains a deltaTime 
function mergeTrackChunksEvents(a, b) {
    const result = [];
    const aAccum = calcAccumulatedDeltaTimes(a);
    const bAccum = calcAccumulatedDeltaTimes(b);

    let i = 0, j = 0, prevTime = 0;
    while (i < a.length && j < b.length) {
        if (aAccum[i] <= bAccum[j]) {
            result.push({
                ...a[i], // Copy
                deltaTime: aAccum[i] - prevTime
            });
            prevTime = aAccum[i];
            i++;
        } else {
            result.push({
                ...b[j], // Copy
                deltaTime: bAccum[j] - prevTime
            });
            prevTime = bAccum[j];
            j++;
        }
    }
    if (i >= a.length) { // Rest of b
        while (j < b.length) {
            result.push({
                ...b[j], // Copy
                deltaTime: bAccum[j] - prevTime
            });
            prevTime = bAccum[j];
            j++;
        }
    } else {            // Rest of a
        while (i < a.length) {
            result.push({
                ...a[i], // Copy
                deltaTime: aAccum[i] - prevTime
            });
            prevTime = aAccum[i];
            i++;
        }
        
    }
    return result; 
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ######################### TESTING CODE ############################

function runTests() {
    testParseVariableLengthValue();
    testParseTempoMetaData();
    testCalcAccumulatedDeltaTimes();
    testMergeTracks();
    testBatchNoteEvents();
}

/* Implements tests based on the examples from the MIDI specification
    | Number (hex)  | Representation (hex) |
    | 00000000      | 00  |
    | 00000040      | 40  |
    | 0000007F      | 7F  |
    | 00000080      | 81 00  |
    | 00002000      | C0 00  |
    | 00003FFF      | FF 7F  |
    | 00100000      | 81 80 00  |
    | 001FFFFF      | C0 80 00  |
    | 00200000      | FF FF 7F  |
    | 08000000      | 81 80 80 00  |
    | 0FFFFFFF      | FF FF FF 7F |
*/
function testParseVariableLengthValue() {
    let tests = [];
    tests.push([[0x00], 0x00]);
    tests.push([[0x40], 0x40]);
    tests.push([[0x7F], 0x7F]);

    tests.push([[0x81, 0x00], 0x80]);
    tests.push([[0xC0, 0x00], 0x2000]);
    tests.push([[0xFF, 0x7F], 0x3FFF]);

    tests.push([[0x80, 0x80, 0x00], 0x00]);
    tests.push([[0x81, 0x80, 0x00], 0x00004000]);
    tests.push([[0xC0, 0x80, 0x00], 0x00100000]);
    tests.push([[0xFF, 0xFF, 0x7F], 0x001FFFFF]);

    tests.push([[0x81, 0x80, 0x80, 0x00], 0x00200000]);
    tests.push([[0xC0, 0x80, 0x80, 0x00], 0x08000000]);
    tests.push([[0xFF, 0xFF, 0xFF, 0x7F], 0x0FFFFFFF]);
    
    let dataView = new DataView(new ArrayBuffer(4));
    for (const test of tests) {
        // Setup
        let rep = test[0];
        let number = test[1];
        for (let i = 0; i < rep.length; i++) {
            dataView.setUint8(i, rep[i]);
        }

        // Run
        let res = parseVariableLengthValue(dataView, 0);

        // Verify
        if (res[0] != number) {
            let hexRep = rep.map(v => v.toString(16));
            console.log(`Expected ${number.toString(16)} - Actual ${res[0].toString(16)} - Input ${hexRep}`);
        } 
    }

}

function testParseTempoMetaData() {
    let tests = [
        [[0x07, 0xA1, 0x20], 500000]
    ];
    for (const test of tests) {
        let [input, expected] = test;
        let result = parseTempoMetaData(input);

        if (result !== expected) {
            console.log(`Expected ${input} gave result ${expected}, but was ${result}`);
        }
    }
}

function testCalcAccumulatedDeltaTimes() {
    const tests = [
        [   // Test 1
            [   // Inputs
                {deltaTime: 0}, {deltaTime: 0}
            ],
            [   // Output
               0, 0,
            ] 
        ], 
        [   
            [   // Inputs
                {deltaTime: 0}, {deltaTime: 5}, {deltaTime: 0}
            ],
            [   // Output
               0, 5, 5
            ] 
        ], 
        [   
            [   // Inputs
                {deltaTime: 0}, {deltaTime: 5}, {deltaTime: 5}
            ],
            [   // Output
               0, 5, 10
            ] 
        ],        
        [
            [   // Inputs
                {deltaTime: 10}, {deltaTime: 20}, {deltaTime: 30}, 
            ],
            [   // Output
               10, 30, 60
            ] 
        ],
        [
            [   // Inputs
                {deltaTime: 0}, {deltaTime: 25}, {deltaTime: 1}, 
            ],
            [   // Output
               0, 25, 26
            ] 
        ],


    ];
    for (const test of tests) {
        let [input, expected] = test;
        let result = calcAccumulatedDeltaTimes(input);

        if (expected.length !== result.length) {
            console.log(`Expected ${input} gave result ${expected}, but was ${result}`);
        } else {
            for (let i = 0; i < result.length; i++) {
                if (result[i] !== expected[i]) {
                    console.log(`Expected ${input} gave result ${expected}, but was ${result}`);
                    break;
                }
            }
        }
    } 

}

function testMergeTracks() {
    const tests = [
        [   // Test 1
            [   // Inputs
                [{deltaTime: 0}, {deltaTime: 0}], // a
                [{deltaTime: 0}]  // b
            ],
            [   // Output
                {deltaTime: 0}, {deltaTime: 0}, {deltaTime: 0}
            ] 
        ], 
        [   
            [   // Inputs
                [{deltaTime: 0}, {deltaTime: 1}], // a
                [{deltaTime: 0}]  // b
            ],
            [   // Output
                {deltaTime: 0}, {deltaTime: 0}, {deltaTime: 1}
            ] 
        ], 
        [   
            [   // Inputs
                [{deltaTime: 5}, {deltaTime: 0}], // a
                [{deltaTime: 0}]  // b
            ],
            [   // Output
                {deltaTime: 0}, {deltaTime: 5}, {deltaTime: 0}
            ] 
        ], 
        [
            [   // Inputs
                [{deltaTime: 25}, {deltaTime: 1}], // a
                [{deltaTime: 0}]  // b
            ],
            [   // Output
                {deltaTime: 0}, {deltaTime: 25}, {deltaTime: 1}
            ] 
        ],
        [
            [   // Inputs
                [{deltaTime: 0}, {deltaTime: 1}], // a
                [{deltaTime: 25}]  // b
            ],
            [   // Output
                {deltaTime: 0}, {deltaTime: 1}, {deltaTime: 24}
            ] 
        ],
        [
            [   // Inputs
                [{deltaTime: 40}, {deltaTime: 30}], // a
                [{deltaTime: 25}]  // b
            ],
            [   // Output
                {deltaTime: 25}, {deltaTime: 15}, {deltaTime: 30}
            ] 
        ],
        [
            [   // Inputs
                [{deltaTime: 10}, {deltaTime: 20}], // a
                [{deltaTime: 10}]  // b
            ],
            [   // Output
                {deltaTime: 10}, {deltaTime: 0}, {deltaTime: 20}
            ] 
        ],
        [
            [   // Inputs
                [{deltaTime: 0}, {deltaTime: 0}, {deltaTime: 20},{deltaTime: 10},{deltaTime: 0},{deltaTime: 40},], // a
                [{deltaTime: 10}, {deltaTime: 0},{deltaTime: 30},{deltaTime: 0},{deltaTime: 0},{deltaTime: 50},{deltaTime: 10},]  // b
            ],
            [   // Output
                {deltaTime: 0}, {deltaTime: 0}, {deltaTime: 10}, {deltaTime: 0}, {deltaTime: 10}, {deltaTime: 10}, {deltaTime: 0}, {deltaTime: 10}, {deltaTime: 0}, {deltaTime: 0}, {deltaTime: 30}, {deltaTime: 20}, {deltaTime: 10},
            ] 
        ],
    ];
    for (const test of tests) {
        let [input, expected] = test;
        let result = mergeTrackChunksEvents(...input);

        if (expected.length !== result.length) {
            console.log(`Expected ${input} gave result ${expected}, but was ${result}`);
        } else {
            for (let i = 0; i < result.length; i++) {
                let e = expected[i].deltaTime;
                let a = result[i].deltaTime;
                if (a !== e) {
                    console.log(`Expected`, input, `gave result ${e}, but was ${a} at index ${i}`);
                    break;
                }
            }
        }
    }

    // Test that inputs are not modified, but instead properly copied.
    let inputA = {deltaTime: 5};
    let inputB = {deltaTime: 5};
    mergeTrackChunksEvents([inputA], [inputB]);
    
    if (inputA.deltaTime !== 5 || inputB.deltaTime !== 5) {
        console.log("Expected input to mergeTracChunks to be unmodified")
    }

}

// Delegate problem of comparing elements in a list to a callback
function arrayEqual(a, b, elementCompare) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (!elementCompare(a[i], b[i])) return false;
    }
    return true;
}

// This fucking test actually made me find an error. This is especially annoying since I though this was an unnecessary test since my code was "obviously" correct. You live and learn.
function testBatchNoteEvents() {
    let tests = [
        {input: [], expected: []},
        {input: [{start: 0}, {start: 0}], expected: [[{start:0}, {start:0}]]},
        {input: [{start: 0}, {start: 1}], expected: [[{start:0}], [{start:1}]]},
    ];
    for (const test of tests) {
        let {input, expected} = test;
        let result = batchNoteEvents(input);

        if (!arrayEqual(result, expected, (a, b) => arrayEqual(a, b, (x, y) => { return x.start === y.start }))) {
            console.log("Expected:", expected, " - Actual:", result, " - Input:", input);
        }
    } 
}

