'use strict';
const KEY_CODE_SPACE = 'Space';
// const KEY_CODE_NUMPAD_PLUS = "";
// const KEY_CODE_NUMPAD_PLUS = "";
const l = console.log
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

// TODO: Understand what midiClocksPerMetronomeClick and thirtySecondNotesPerQuarterNotes mean
function parseTimeSignature(metaData) {
    assert(metaData.length >= 4, `Expected at least four values for the time signature meta data, found ${metaData.length}`);
    return {
        numerator: metaData[0],
        denominator: 2 ** metaData[1],
        midiClocksPerMetronomeClick: metaData[2],
        thirtySecondNotesPerQuarterNote: metaData[3]
    }
}

function formatParseErrorMessage(offset, msg) {
    return `At byte ${offset}(${offset.toString(16)}): ${msg}`;
}

// Transforming meta data for SET TEMPO META EVENT into value (meta data should be an array of 3 bytes)
function parseTempoMetaData(metaData) {
    assert(metaData.length >= 3, `Expected at least three values for the set tempo meta data, found ${metaData.length}`);
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
    const dataView = new DataView(buffer);
    let [chunk, offset] = parseChunk(dataView, 0, 0)
    const header = chunk;
    assert(header.type === CHUNK_TYPE.HEADER, `First chunk had invalid type. Expected header found ${header.type}`);
    const chunks = [];
    chunks.push(header);

    let trackNumber = 0;
    while (trackNumber < header.ntrks) {
        try {
            [chunk, offset] = parseChunk(dataView, offset, trackNumber);
            if (chunk.type === CHUNK_TYPE.TRACK) { // Ignore non track chunks
                chunk.trackNumber = trackNumber;
                chunks.push(chunk);
                trackNumber++;
            } else { // TODO: Silently ignore unknown chunk types (use log warn instead?) or have a list for each type 
                assert(false, `Found unknown chunk type found ${chunk.type}`);
            }
        } catch (e) {
            l('Chunks', chunks);
            throw e
        }
    }
    return chunks;
}

function parseChunk(dataview, offset, trackNumber) {
    assert(dataview.byteLength > offset + 8, formatParseErrorMessage(offset, `The dataview did not contain enough bytes to read chunk`));
    const type = dataview.getUint32(offset);
    const length = dataview.getUint32(offset + 4);

    offset += 8;
    switch (type) {
        case CHUNK_TYPE.HEADER: { // Parse Header chunk
            assert(length >= 6, formatParseErrorMessage(offset-4, `Data length too small for header chunk. Expected at least 6, found ${length}`));  
            const chunk = {
                type,
                format: dataview.getUint16(offset),
                ntrks: dataview.getUint16(offset + 2),
                division: dataview.getUint16(offset + 4)
            };
            offset += length;
            return [chunk, offset];
        } 
        case CHUNK_TYPE.TRACK: { // Parse Track chunk
            const chunk = {
                type, 
                events: [] 
            };
            const finalOffset = offset + length;
            assert(length > 0, formatParseErrorMessage(offset, `Length of Track chunk was 0`));
            let event, runningStatus = null, runningTime = 0, eventNumber = 0;
            do {
                try {
                    [event, offset] = parseEvent(dataview, offset, runningStatus, runningTime);
                    event.eventNumber = eventNumber++;
                    event.trackNumber = trackNumber;
                    chunk.events.push(event);
                    runningStatus = event.status;
                    runningTime += event.deltaTime;
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
                offset
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

// TODO: Should we make NoteOn events with velocity 0 into NoteOff events?
function parseEvent(dataView, offset, runningStatus, runningTime) {
    let dt;
    [dt, offset] = parseVariableLengthValue(dataView, offset)
    let status = dataView.getUint8(offset);
    if ((status & 0x80) === 0) { // Use running status as status and shift offset back
        assert(runningStatus !== null, formatParseErrorMessage(offset, `Expected running status to be set but was null`));
        // Running status should not be a META or SYSEX event, but we are not testing for this. Should we?
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
        assert(eventData.sysex[length-1] === 0xF7, formatParseErrorMessage(offset + length - 1, `Expected 0xF7 at end of SYSEX Event, found ${eventData.sysex[length-1]}`));
        offset = offset + length;
    } else if (status === STATUS.META_EVENT) { 
        const metaType = dataView.getUint8(offset + 1);
        [length, offset] = parseVariableLengthValue(dataView, offset + 2);
        eventData = { metaType, length, metaData: [] };
        readUint8ToArray(dataView, offset, length, eventData.metaData);
        offset = offset + length;
    } else { 
        eventData = {
            type: status & 0xF0,
            channel: status & 0x0F
        }
        switch (eventData.type) {
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
                assert(false, formatParseErrorMessage(offset, `Unknown MIDI event ${eventData.type}`));
            } break;
        }
    } 
    const event = {
        deltaTime: dt, 
        time: runningTime + dt,
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

function initializeCanvasMidiEvents(mideState) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('file-input');

    // TODO: Center and pick font
    ctx.font = '36px Aria';
    ctx.fillText("Click to pick a MIDI file", 100, 500);
    ctx.fillText("or drag and drop it in the window", 100, 540);

    canvas.addEventListener('click', (e) => {
        if (mideState.chunks === null) {
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

function initializeInputMidiEvents(midiState) {
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
            l("Inputs:", midiAccess.inputs, " - Outputs:", midiAccess.outputs, " - Sysex:", midiAccess.sysexEnabled, midiAccess);

            // TODO: Handle disconnects and reconnects
            // midiAccess.onglobalMidichange = handleMidiAccessStateChange;

            midi.inputs = midiAccess.inputs;
            midi.outputs = midiAccess.outputs;

            const midiInputSelect = document.getElementById('midi-input-select');
            const midiOutputSelect = document.getElementById('midi-output-select');
            midi.currentInput = addSelectOptionsAndReturnFirst(midiInputSelect, midiAccess.inputs);
            midi.currentOutput = addSelectOptionsAndReturnFirst(midiOutputSelect, midiAccess.outputs);
            l('', midi)
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
        reject("Cannot request MIDI Access");
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

// TODO: Wareta ringo has some weird boxes in the bottom of the falling notes. Figure out why these exist.
function drawFallingNotes(ctx, noteEvents, elapsed, { msToPixel, noteFill, topLineHeight }) {
    const noteWidth = 20
    const timeFromTopToBottomMilliseconds = topLineHeight / msToPixel;
    ctx.beginPath()
    ctx.moveTo(0, topLineHeight);
    ctx.lineTo(ctx.canvas.width, topLineHeight);
    ctx.stroke();
    for (let i = 0; i < noteEvents.length; i++) {
        const event = noteEvents[i];
        if (elapsed + timeFromTopToBottomMilliseconds < event.startMs) break; // Stop processing more events since they wont be shown anyway. (Correctness requires input to be sorted)

        const top = (-event.endMs + elapsed) * msToPixel + topLineHeight;
        if (top > topLineHeight) continue;  

        const left = 10 + event.note * 14 - noteWidth/2;
        const height = Math.min((event.endMs - event.startMs) * msToPixel, topLineHeight - top);
        ctx.fillStyle = noteFill(event, i);
        ctx.fillRect(left, top, noteWidth, height);
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

    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(canvas.width, top);
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
    const midiState = initializeMidiState();
    initializeFileInput(buffer => {
        try {
            midiState.chunks = parseMidiFile(buffer);
            const melodies = chunksToMelodiesList(midiState.chunks)
            play(melodies[0].eventMap, melodies[0].tempoMap, midiState)
        } catch(e) {
            l('Stuff went wrong', e)
        }
    });
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
        currentlyPressed: new Set(),
        currentNoteGroup: 0,
        currentTimeout: null,
        failedState: false,
        previousAnimationTime: 0,
        currentElapsed: noteEventsBatched[0][0].startMs,
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
        stepAnimation: function(currentAnimationTime) {
            assert(currentAnimationTime >= this.previousAnimationTime, "Animation time should only increase.")
            const deltaTime = currentAnimationTime - this.previousAnimationTime;
            this.previousAnimationTime = currentAnimationTime;
            const targetElapsed = noteEventsBatched[this.currentNoteGroup][0].startMs;
            if (targetElapsed > this.currentElapsed) {
                // If anything needs to be done then we do 
                this.currentElapsed = Math.min(this.currentElapsed + deltaTime, targetElapsed);
                return true;
            }
            return false;
        },
        getCurrentElapsed: function(currentAnimationTime) {
            assert(this.currentNoteGroup < noteEventsBatched.length, "Should not call get elapsed when the note group is outside the limit");
            assert(noteEventsBatched[this.currentNoteGroup].length != 0, "There should not be an empty batch of events.");
            return this.currentElapsed;
        },
        getCurrentGroup: function() {
            return noteEventsBatched[playState.currentNoteGroup]
        },
        fail: function() {
            this.failedState = true;
            // TODO: Implement something fancy 
        },
        recentlySucceded: function() {
            return true;
        },
        toBePlayed: function(key) {
            return true;
        }, 
        addKey: function(key) {
            this.currentlyPressed.add(key);
        }
    };   

    // TODO: How do I animate the transition from one state to the next?
    // One simple way may just be to keep track of the previous and the current state and if they are differernt then we have a transition state. I am however not sure what to do if we change states quickly.

    // How does the animation work? We need to change the elapsed slowly instead of instantly. So getCurrentElapsed should return something different from just the start of the note. 

    function playAnimation(time) {
        if (!playState.stepAnimation(time)) { return requestAnimationFrame(playAnimation); }
        // console.log(playState.hasChanged)
        playState.hasChanged = false;
        ctx.clearRect(0, 0, canvas.width, topLineHeight);

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
        ctx.beginPath()
        ctx.moveTo(0, topLineHeight);
        ctx.lineTo(ctx.canvas.width, topLineHeight);
        ctx.stroke();
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
            if (playState.recentlySucceded()) {

            } else {
                playState.fail()
            }
        } else if (event_type === MIDI_EVENT.NOTE_ON) { // Note on event
            if (playState.currentTimeout === null) {
                playState.startTimeout();
            }
            const key = e.data[1];
            if (playState.toBePlayed(key)) { 
                playState.addKey(key);
            } else {
                playState.fail();
            }
        }
        
        // Did we successfully play the whole thing?
        const currentGroup = playState.getCurrentGroup(); 
        if (playState.didSucceed()) {
            playState.cancelTimeout();
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

    requestAnimationFrame(playAnimation);

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

// ######################### TESTING CODE ############################

function runTests() {
    testParseVariableLengthValue();
    testParseTempoMetaData();
    testCalcAccumulatedDeltaTimes();
    testMergeTracks();
    testBatchNoteEvents();
    testComputeTempoMap();
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
    const tests = []; // TODO: Maybe redo tests
    for (const [input, expected] of tests) {
        let result = mergeTrackChunksEvents(...input);

        if (expected.length !== result.length) {
            console.log(`Expected`, input, `gave result`, expected, `but was`, result);
        } else {
            for (let i = 0; i < result.length; i++) {
                let e = expected[i].time;
                let a = result[i].time;
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

// This fucking test actually made me find an error. This is especially annoying since I thought this was an unnecessary test since my code was "obviously" correct. You live and learn.
function testBatchNoteEvents() {
    let tests = [
        {input: [], expected: []},
        {input: [{time: 0}, {time: 0}], expected: [[{time:0}, {time:0}]]},
        {input: [{time: 0}, {time: 1}], expected: [[{time:0}], [{time:1}]]},
    ];
    for (const {input, expected} of tests) {
        let result = batchNoteEvents(input);

        if (!arrayEqual(result, expected, (a, b) => arrayEqual(a, b, (x, y) => { return x.start === y.start }))) {
            console.log("Expected:", expected, " - Actual:", result, " - Input:", input);
        }
    } 
}

// TODO: Any more test?
function testComputeTempoMap() {
    let hundredThousand = [0x1, 0x86, 0xa0];    // 100000
    let twohundredThousand = [0x3, 0x0d, 0x40]; // 200000
    let fiftyThousand = [0x00, 0xc3, 0x50];     // 50000

    let tests = [
        {input: [[/* empty for default */], 100, [{time: 1000}, {time: 2000}]], expected: [{startMs: 5000}, {startMs: 10000}]}, // Default tempo map
        {input: [[{time: 0, metaData: hundredThousand}], 100, [{time: 1000}, {time: 1500}]], expected: [{startMs: 1000}, {startMs: 1500}]},
        {input: [[{time: 0, metaData: twohundredThousand}], 100, [{time: 1000}, {time: 1500}]], expected: [{startMs: 2000}, {startMs: 3000}]},
        {input: [[{time: 0, metaData: twohundredThousand}], 200, [{time: 1000}, {time: 1500}]], expected: [{startMs: 1000}, {startMs: 1500}]},
        {input: [[{time: 0, metaData: hundredThousand}, {time: 1000, metaData: twohundredThousand }], 100, [{time: 1000}, {time: 1500}]], expected: [{startMs: 1000}, {startMs: 2000}]},
        {input: [[{time: 0, metaData: twohundredThousand}, {time: 1000, metaData: fiftyThousand}], 100, [{time: 1000}, {time: 1500}]], expected: [{startMs: 2000}, {startMs: 2250}]},
        {input: [[{time: 0, metaData: twohundredThousand}, {time: 3000, metaData: fiftyThousand}], 200, [{time: 1000}, {time: 1500}]], expected: [{startMs: 1000}, {startMs: 1500}]},
        { // Test for initially undiscovered bug. When the tempo changed multiple times, the new runningTimeMilliseconds was based on difference between time quarter note time and ms which is nonsense. 
            input: [
                [{time: 0, metaData: twohundredThousand}, {time: 1000, metaData: hundredThousand}, {time: 2000, metaData: twohundredThousand}], 100, 
                [{time: 1500}, {time: 2500}]
            ], 
            expected: [{startMs: 2500}, {startMs: 4000}] 
        },
    ];    

    for (const {input, expected} of tests) {
        const mappingFunction = computeTempoMappingFunction(input[0], input[1]);
        const result = mappingFunction(input[2]);

        if (expected.length !== result.length) {
            console.log('Expected', input[2], 'gave result of length', expected.length, 'but was', result.length);
        } else {
            for (let i = 0; i < result.length; i++) {
                let e = expected[i].startMs;
                let a = result[i].startMs;
                if (a !== e) {
                    console.log(`Expected`, input, `gave result ${e}, but was ${a} at index ${i}`);
                    break;
                }
            }
        }
    } 
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