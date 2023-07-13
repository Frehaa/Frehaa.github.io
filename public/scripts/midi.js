'use strict';
let l = console.log
function assert(p, msg) {
    if (!p) throw new Error(msg);
}
const CHUNK_TYPE = Object.freeze({
    HEADER: 1297377380, // MThd
    TRACK: 1297379947   // MTrk
});

const CONTROL_FUNCTION =  Object.freeze({
    CHANNEL_VOLUME: 7,
    PAN: 10, // The operation of playing the audio louder in one side or the other side of a stereo audio
    DAMPER_PEDAL: 64,
    SOSTENUTO: 66,
    SOFT_PEDAL: 67,
})

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
// class MidiHeader {
//     constructor(fileFormat, numTracks, timeDivision) {
//         this.fileFormat = fileFormat;
//         this.numTracks = numTracks;
//         this.timeDivision = timeDivision;
//     }
//     toString() {
//         return (this.fileFormat, this.numTracks, this.timeDivision).toString();
//     }
// }

function parseError(offset, msg) {
    return `At byte ${offset}(${offset.toString(16)}): ${msg}`;
}

// TODO: Maybe throw away chunk length information
function parseChunk(dataview, offset) {
    assert(dataview.byteLength > offset + 8, parseError(offset, `The dataview did not contain enough bytes to read chunk`));
    const type = dataview.getUint32(offset);
    const length = dataview.getUint32(offset + 4);

    offset += 8;
    switch (type) {
        case CHUNK_TYPE.HEADER: { // Parse Header chunk
            assert(length >= 6, parseError(offset-4, `Data length too small for header chunk. Expected at least 6, found ${length}`));  
            const format = dataview.getUint16(offset);
            const ntrks = dataview.getUint16(offset + 2);
            const division = dataview.getUint16(offset + 4);

            offset += length;
            const chunk = {
                type,
                length,
                format,
                ntrks,
                division
            };
            return [chunk, offset];
        } 
        case CHUNK_TYPE.TRACK: { // Parse Track chunk
            const chunk = {
                type, 
                length,
                events: [] 
            };
            let finalOffset = offset + length;
            assert(length > 0, parseError(offset, `Length of Track chunk was 0`));
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
            } while (!(event.metaType && event.metaType === 0x2F));
            assert(offset === finalOffset, parseError(offset, `Track Chunk data was different from expected. Expected ${finalOffset} - Found ${offset}`));
            return [chunk, finalOffset];
        } 
        default: {
            const chunk = {
                type,
                length
            };
            return [chunk, offset + length];
        }
    }
}

function parseEvent(dataView, offset, runningStatus) {
    let dt;
    [dt, offset] = parseDeltaTime(dataView, offset)
    const deltaTime = dt;
    let status = dataView.getUint8(offset);

    if ((status & 0x80) === 0) { // Running status
        // l(`Data byte encountered ${status.toString(16)} at offset ${offset}. Running status ${runningStatus.toString(16)}`)
        status = runningStatus;
        offset -= 1;
    }

    let eventData = null;
    if (status === 0xF0 || status === 0xF7) { // SYSEX EVENT
        [length, offset] = parseDeltaTime(dataView, offset + 1);
        eventData = {
            length,
            sysex: []
        }
        for (let i = 0; i < length; i++) { // Read length data
            eventData.sysex.push(dataView.getUint8(offset + i));
        }
        assert(eventData.sysex.length === length, parseError(offset, `System exclusive message length was different from expected. expected ${eventData.sysex.length} actual ${length}`));
        assert(eventData.sysex[length-1] === 0xF7, parseError(offset + length - 1, `Expected 0xF7 at end of SYSEX Event, found ${eventData.sysex[length-1]}`));
        offset = offset + length;
    } else if (status === 0xFF) { // META-EVENT
        const metaType = dataView.getUint8(offset + 1);
        [length, offset] = parseDeltaTime(dataView, offset + 2);
        eventData = { metaType, length, metaData: [] };
        for (let i = 0; i < length; i++) { // Read length data
            eventData.metaData.push(dataView.getUint8(offset + i));
        }
        assert(eventData.metaData.length === length, parseError(offset, `META event message length was different from expected. expected ${eventData.metaData.length} actual ${length}`));
        offset = offset + length;
    } else { // if ((status & 0xF0) !== 0xF0) { // MIDI-EVENT (Or something else?)
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
                assert(false, parseError(offset, `Unknown MIDI event ${type}`));
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

function initializeFileInput(callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        callback(event.target.result);
    };

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        reader.readAsArrayBuffer(file)
    });
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        reader.readAsArrayBuffer(file)
    }
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

// Tries to parse a variable length value in dataView from the offset
function parseDeltaTime(dataView, offset) {
    let time = 0
    let byteLength = 0;
    while (true) {
        let deltaByte = dataView.getUint8(offset + byteLength)
        byteLength++;
        time = (time << 7) | (deltaByte & 0x7F);
        if ((deltaByte & 0x80) === 0) break;
    } 

    return [time, offset + byteLength]
}


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

function handleMidiAccessStateChange(event) {
    const midiAccess = event.currentTarget;
    const port = event.port;

    l('MidiAccess State Change', event)
}

function handleMidiIOStateChange(event) {
    l('MidiIO State Change', event);
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
            chunks.push(chunk);
            if (chunk.type === CHUNK_TYPE.TRACK) {
                count++;
            }
        } catch (e) {
            l('Chunks', chunks);
            throw e
        }

    }
    return chunks;
}


function initialize() {
    l(MIDI_EVENT)
    testDeltaTime();
    const state = {
        midi: null,
        output: null
    };

    initializeFileInput(async buffer => {
        const chunks = parseMidiFile(buffer);
        state.midi = chunks;
        play()
    });


    initializeMIDIUSBAccess(
        midiAccess => {
            l("Inputs:", midiAccess.inputs, " - Outputs:", midiAccess.outputs, " - Sysex:", midiAccess.sysexEnabled, midiAccess);
            // midiAccess.onstatechange = handleMidiAccessStateChange;

            midiAccess.inputs.forEach(input => {
                // input.onstatechange = handleMidiIOStateChange;
                input.onmidimessage = handleOnMidiMessage;
            });

            midiAccess.outputs.forEach(output => {
                l(output)
                state.output = output;
            });
        }, 
        error => {
            console.log("Failed to access MIDI devices:", error);
        }
    );

    function play() {
        l(state.midi)
        if (!state.midi || !state.output) return;

        let header = state.midi[0];
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
            counts.push(counter);

            let track = state.midi[i + 1];
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
                }
            }
        }
        l(counts);

        for (let i = 0; i < header.ntrks; i++) {
            let track = state.midi[i + 1];
            sendEvents(track.events)
        }

        async function sendEvents(events) {
            for (const event of events) {
                if (event.deltaTime > 0) {
                    await sleep(event.deltaTime);
                }
                if (!event.type) continue;
                switch (event.type) {
                    case MIDI_EVENT.NOTE_OFF:
                    case MIDI_EVENT.NOTE_ON: {
                        state.output.send([event.type, event.note, event.velocity]);
                    } break;
                    case MIDI_EVENT.PROGRAM_CHANGE: {
                        assert(event.program >= 0 && event.program <= 127, `Event program was outside expected range ${event.program.toString(16)}`);
                        state.output.send([event.type, event.program]);
                    } break;
                    case MIDI_EVENT.CONTROL_CHANGE: {
                        assert(0 <= event.value && event.value <= 127, `Control Change values was outside expected range ${event.value.toString(16)}`);
                        switch (event.control) {
                            case CONTROL_FUNCTION.CHANNEL_VOLUME:  
                            case CONTROL_FUNCTION.DAMPER_PEDAL: 
                            case CONTROL_FUNCTION.SOSTENUTO: 
                            case CONTROL_FUNCTION.SOFT_PEDAL: { // Supported functions
                                state.output.send([event.type, event.control, event.value]);
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
    }

        // let notes = [];
    // for (let i = 0; i < 100; i++) {
    //     let r = Math.round((Math.random() * 10) - 5);
    //     notes.push([r, i]);
    // }

    
    // const bassCleffImg = new Image();
    // const wholeNoteImg = new Image();
    // wholeNoteImg.addEventListener('load', e => {
    //     console.clear()
    //     function myDraw(t) {
    //         draw(wholeNoteImg, notes, t);
    //         requestAnimationFrame(myDraw);
    //     }
    //     // requestAnimationFrame(myDraw)
        
    // });
    // wholeNoteImg.src = "images/wholeNote.svg"
    // // Width 40
    // // Height 25
    // // Ratio = 40/25


}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
function testDeltaTime() {
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
        let res = parseDeltaTime(dataView, 0);

        // Verify
        if (res[0] != number) {
            let hexRep = rep.map(v => v.toString(16));
            console.log(`Expected ${number.toString(16)} - Actual ${res[0].toString(16)} - Input ${hexRep}`);
        } 
    }

}
