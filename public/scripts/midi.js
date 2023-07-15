'use strict';
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

// Transforming meta data for SET TEMPO META EVENT into value (meta data should be an array of 3 bytes)
function parseTempoMetaData(metaData) {
    return metaData[0] << 16 | metaData[1] << 8 | metaData[2];
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

function formatParseErrorMessage(offset, msg) {
    return `At byte ${offset}(${offset.toString(16)}): ${msg}`;
}

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
                length
            };
            return [chunk, offset + length];
        }
    }
}

function parseEvent(dataView, offset, runningStatus) {
    let dt;
    [dt, offset] = parseVariableLengthValue(dataView, offset)
    const deltaTime = dt;
    let status = dataView.getUint8(offset);

    if ((status & 0x80) === 0) { // Running status
        // l(`Data byte encountered ${status.toString(16)} at offset ${offset}. Running status ${runningStatus.toString(16)}`)
        status = runningStatus;
        offset -= 1;
    }

    let eventData = null;
    if (status === 0xF0 || status === 0xF7) { // SYSEX EVENT
        [length, offset] = parseVariableLengthValue(dataView, offset + 1);
        eventData = {
            length,
            sysex: []
        }
        for (let i = 0; i < length; i++) { // Read length data
            eventData.sysex.push(dataView.getUint8(offset + i));
        }
        assert(eventData.sysex.length === length, formatParseErrorMessage(offset, `System exclusive message length was different from expected. expected ${eventData.sysex.length} actual ${length}`));
        assert(eventData.sysex[length-1] === 0xF7, formatParseErrorMessage(offset + length - 1, `Expected 0xF7 at end of SYSEX Event, found ${eventData.sysex[length-1]}`));
        offset = offset + length;
    } else if (status === 0xFF) { // META-EVENT
        const metaType = dataView.getUint8(offset + 1);
        [length, offset] = parseVariableLengthValue(dataView, offset + 2);
        eventData = { metaType, length, metaData: [] };
        for (let i = 0; i < length; i++) { // Read length data
            eventData.metaData.push(dataView.getUint8(offset + i));
        }
        assert(eventData.metaData.length === length, formatParseErrorMessage(offset, `META event message length was different from expected. expected ${eventData.metaData.length} actual ${length}`));
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
                assert(false, formatParseErrorMessage(offset, `Unknown MIDI event ${type}`));
            } break;
        }
    } 
    const event = {
        deltaTime, 
        status, // TODO: Throw away status? We still need it for meta-data(no?)
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

function drawNoteNamesAndTopLine(top) {
    const canvas = document.getElementById('note-canvas');
    const ctx = canvas.getContext('2d');
    const h = canvas.height, w = canvas.width;
    
    ctx.font = "10px Georgia";

    const letters = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B", ];
    for (let i = 0; i < 128; i++) {
        const note = letters[i % letters.length];
        if (note.length == 2) {
            ctx.fillText(note, 10 + i * 14 - 5, top + 20);
        } else {
            ctx.fillText(note, 10 + i * 14, top + 40);
        }
    }
    const cutLineHeight = top;
    ctx.beginPath();
    ctx.moveTo(0, cutLineHeight);
    ctx.lineTo(w, cutLineHeight);
    ctx.stroke();
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
            if (chunk.type === CHUNK_TYPE.TRACK) {
                chunks.push(chunk);
                count++;
            } else {
                // TODO: Silently ignore unknown chunk types 
                assert(false, `Found unknown chunk type found ${chunk.type}`);
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
    runTests();

    const state = {
        midiChunks: null,
        output: null
    };

    initializeFileInput(async buffer => {
        const chunks = parseMidiFile(buffer);
        state.midiChunks = chunks;
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

    const b = document.createElement('button');
    b.innerHTML = "Play"
    document.body.appendChild(b);
    let p = false;

    b.onclick = function(e) {
        if (state.output) {
            if (!p) {
                state.output.send([0x90, 0x40, 0x30]);
            } else {
                state.output.send([0x90, 0x40, 0x00]);
            }
            p = !p;
        }
    }



    function play() {
        l("\nState:", state)
        l("Event Counts:", debugEventCounter(state.midiChunks));

        // TODO: Decide on a proper representation for track (e.g. header and tracks. Header contains format, division. There are <ntrks> track chunks in tracks. Each track chunk contains at least 1 event possibly more. Delta times are translated into ms, or there is some easy way to do it. )

        let header = state.midiChunks[0];
        const division = header.division;
        const format = header.format;
        assert(format === 0 || format === 1, `Expected file format to be 0 or 1, it was ${format}`);
        l(`Format ${format} division ${division}`);
        const playTracks = getPlayTrackEvents(format, state.midiChunks);
        l(`Play tracks:`, playTracks);

        const topLineHeight = 560;
        drawNoteNamesAndTopLine(topLineHeight);

        // SPLIT THE EVENTS, GIVE THEM START AND END IN MILLISECONDS, AND DRAW AND PLAY THEM.
        let tempo = parseTempoMetaData([0x07, 0xA1, 0x20]) // Default value of tempo 500.000 
        let tickToMsFactor = (tempo / division) / 1000;
        for (let i = 0; i < playTracks.length; i++) {
            assert(i === 0, `This should not happen while we do not support format 2`);
            // const track = state.midiChunks[1]; 
            l(`Track ${i}`, playTracks[i])

            // Create array of notes to draw
            const noteEvents = [];
            const controlEvents = [];
            const programEvents = [];
            const startedNotes = {}; // Notes which are stated but not ended.
            let runningTime = 0

            // TODO: Start by ignoring different channels. This may result in bugs if different channels play the same note
            for (const event of playTracks[i]) {
                runningTime += event.deltaTime * tickToMsFactor;
                // l(runningTime, event)
                if (event.status === STATUS.META_EVENT) {
                    switch (event.metaType) {
                        case META_EVENT.KEY_SIGNATURE: {
                            // TODO: 
                        } break;
                        case META_EVENT.SET_TEMPO: {
                            tempo = parseTempoMetaData(event.metaData);
                            tickToMsFactor = (tempo / division) / 1000;
                        } break;
                        case META_EVENT.TIME_SIGNATURE: { 
                            // TODO: 
                        } break;
                    }
                }
                else if (event.type === MIDI_EVENT.NOTE_OFF || (event.type === MIDI_EVENT.NOTE_ON && event.velocity === 0)) {
                    // assert(startedNotes[event.note] !== null, `Expected ${event.note} not to be null.`);
                    let note = startedNotes[event.note];
                    if (note === null || note === undefined) continue;
                    note.end = runningTime;
                    noteEvents.push(note);
                    startedNotes[event.note] = null;
                }
                else if (event.type === MIDI_EVENT.NOTE_ON) {
                    let note = startedNotes[event.note];
                    // assert(note === null || note === undefined, `Expected ${event.note} to be null on channel ${event.channel}, was ${startedNotes[event.note]}`);
                    if (note === null || note === undefined) {
                        startedNotes[event.note] = {
                            note: event.note,
                            start: runningTime,
                            velocity: event.velocity,
                            channel: event.channel
                        }
                    } else { // TODO: Figure out what to do about the same note being played twice before being turned off (It is hard to hear a difference. So maybe it does not matter?)
                        l(`INFO: Double note ${event.note} at ${runningTime}`)
                        note.end = runningTime;
                        noteEvents.push(note);
                        startedNotes[event.note] = {
                            note: event.note,
                            start: runningTime,
                            velocity: event.velocity,
                            channel: event.channel
                        };
                    }
                } else if (event.type === MIDI_EVENT.CONTROL_CHANGE) {
                    controlEvents.push({
                        start: runningTime,
                        channel: event.channel,
                        control: event.control,
                        value: event.value
                    });
                } else if (event.type === MIDI_EVENT.PROGRAM_CHANGE) {
                    programEvents.push({
                        start: runningTime,
                        channel: event.channel,
                        program: event.program,
                    });
                }             
            }
            l(noteEvents, controlEvents, programEvents)
        
            const canvas = document.getElementById('note-canvas');
            const ctx = canvas.getContext('2d');
            const timeFromTopToBottomMs = 2000;
            const msToPixel = topLineHeight / timeFromTopToBottomMs;
            const noteWidth = 20
            let start = null;
            function animateNotes(t) {
                if (start === null) { // Initialize Start
                    start = t;
                }
                ctx.clearRect(0, 0, canvas.width, topLineHeight);

                const elapsed = t - start;

                ctx.font = "26px Georgia";
                ctx.fillText((elapsed -2000), 50, 100);
                
                for (const event of noteEvents) {
                    const top = (-event.end + elapsed) * msToPixel; 
                    const x = 10 + event.note * 14 - noteWidth/2;
                    const height = (event.end - event.start) * msToPixel;

                    // if (elapsed < block.start) break // TODO: Implement short cut such that we do not try to draw notes outside of screen
                    if (top > topLineHeight) continue; 
                    if (topLineHeight - top < height) {
                        ctx.fillRect(x, top, noteWidth, topLineHeight - top);
                    } else {
                        ctx.fillRect(x, top, noteWidth, height);
                    }            
                }
                requestAnimationFrame(animateNotes)
            }

            requestAnimationFrame(animateNotes)

            if (state.output) {
                setTimeout(() => {
                    playEventsByScheduling(state.output, noteEvents, controlEvents, programEvents)
                }, timeFromTopToBottomMs)
            } else {
                console.log("No output found so wont be playing.")
            }
 
        }
    }
}

function getPlayTrackEvents(format, chunks) {
    const tracks = []; // Size should be 1 for format 0 and 1. Format 2 can have multiple
    if (format === TRACK_FORMAT.SINGLE_MULTICHANNEL_TRACK) { // 
        assert(state.midiChunks.length === 2, `Expected Single track format to only have 1 header chunk and 1 track chunk`);
        tracks.push(chunks[1]);
    } else if (format === TRACK_FORMAT.SIMULTANEOUS_TRACKS) {
        let trackEvents = chunks[1].events
        for (let i = 2; i < chunks.length; i++) {
            l(`Track in iteration ${i}`, trackEvents);
            trackEvents = mergeTrackChunksEvents(trackEvents, chunks[i].events)
        }
        tracks.push(trackEvents);
    } else if (format === TRACK_FORMAT.INDEPENDENT_TRACKS) {
        assert(false, `Unhandled multiple independent tracks`);
    } else {
        assert(false, `Unknown track format ${format} in header`);
    }
    return tracks;
}

// TODO: Draw note system
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

//     draw(wholeNoteImg, [], 0)
    
//     // requestAnimationFrame(myDraw)
    
// });
// wholeNoteImg.src = "images/wholeNote.svg"
// // Width 40
// // Height 25
// // Ratio = 40/25

function playEventsByScheduling(output, noteEvents, controlEvents, programEvents) {
    assert(output, `Expected output to exist but it did not`);
    // TODO: Batch the events if possible
    for (const event of noteEvents) {
        setTimeout(a => {
            output.send([MIDI_EVENT.NOTE_ON, event.note, event.velocity])
        }, event.start);
        setTimeout(a => {
            output.send([MIDI_EVENT.NOTE_OFF, event.note, 0])
        }, event.end);
    }
    for (const event of controlEvents) {
        setTimeout(a => {
            output.send([MIDI_EVENT.CONTROL_CHANGE, event.control, event.value])
        }, event.start);
    }
    for (const event of programEvents) {
        setTimeout(a => {
            output.send([MIDI_EVENT.PROGRAM_CHANGE, event.program])
        }, event.start);
    }
}

async function playEventsBySleep(midiEvents) {
    for (const event of midiEvents) {
        if (event.deltaTime > 0) {
            await sleep(event.deltaTime);
        }
        assert(event.type !== undefined && event.type !== null, `midiEvents should always have a type`);
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

function calcAccumulatedDeltaTimes(a) {
    const result = [];
    let runningTime = 0;
    for (const e of a) {
        runningTime += e.deltaTime;
        result.push(runningTime);
    }
    return result;
}

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
