'use strict';
let l = console.log
const MIDI_EVENT = Object.freeze({
    NOTE_OFF: 0x80,
    NOTE_ON: 0x90,
    POLYPHONIC_AFTERTOUCH: 0xa0,
    CONTROL_CHANGE: 0xb0,
    PITCH_BEND: 0xe0,
    PROGRAM_CHANGE: 0xc0,
    CHANNEL_AFTERTOUCH: 0xd0,
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
class MidiHeader {
    constructor(fileFormat, numTracks, timeDivision) {
        this.fileFormat = fileFormat;
        this.numTracks = numTracks;
        this.timeDivision = timeDivision;
    }
    toString() {
        return (this.fileFormat, this.numTracks, this.timeDivision).toString();
    }
}


// Helper function to determine the length of a MIDI event based on its status byte
function getMidiEventLength(statusByte) {
    if ((statusByte & 0xf0) === 0xf0) {
        // System exclusive or meta event
        return 1;
    } else if ((statusByte & 0x80) !== 0) {
        // Regular MIDI event
        switch (statusByte & 0xf0) {
            case 0x80: // Note off
            case 0x90: // Note on
            case 0xa0: // Polyphonic aftertouch
            case 0xb0: // Control change
            case 0xe0: // Pitch bend
            return 3;
            case 0xc0: // Program change
            case 0xd0: // Channel aftertouch
            return 2;
        }
    }
    // Invalid or unsupported MIDI event
    return 1;
}

function parseMidiHeader(uint8Array) {
    const headerChunk = uint8Array.slice(0, 14);
    const headerChunkType = String.fromCharCode(...headerChunk.slice(0, 4));
    if (headerChunkType != "MThd") return null; // If not a MIDI file exit

    const headerChunkLength = uint8ArrayToInt32(headerChunk, 4);        
    if (headerChunkLength != 6) return null; // Not standard length. Do not know how to handle yet.

    const fileFormat = uint8ArrayToInt16(headerChunk, 8);
    const numTracks = uint8ArrayToInt16(headerChunk, 10);
    const timeDivision = uint8ArrayToInt16(headerChunk, 12);

    return new MidiHeader(fileFormat, numTracks, timeDivision);
}

let arrayBuffer = new ArrayBuffer(1000);
function initializeFileInput() {
    // What we want to do now is to read a MIDI file, detect only the NoteOn and NoteOff events, keep their data, and replay the file
    const reader = new FileReader();
    reader.onload = (event) => {
        arrayBuffer = event.target.result;
        updateTable();
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

    return new Promise()
}

function initializeMIDIUSBAccess() {
    // Check if Web MIDI API is supported
    l(navigator.requestMIDIAccess)
    if (navigator.requestMIDIAccess) {
        // Request access to MIDI devices
        navigator.requestMIDIAccess()
        .then(function(midiAccess) {
            // Get the list of MIDI inputs
            var inputs = midiAccess.inputs.values();
            l("Inputs:", midiAccess.inputs, " - Outputs:", midiAccess.outputs, " - Sysex:", midiAccess.sysexEnabled);

            // Iterate over each input and create a new list item for it
            for (const input of inputs) {
                input.onmidimessage = function(event) { // Add an event listener to the input to display the received data
                    // if (event.data[2] ==0) return
                    const data = event.data;
                    l(numToKeyboardNoteName(data[1]), data)
                };
            }

        })
        .catch(function(error) {
            console.log("Failed to access MIDI devices:", error);
        });
    } else {
        console.log("Web MIDI API is not supported");
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
function parseVariableTime(dataView, offset) {
    let time = 0
    let byteLength = 0;
    while (true) {
        let deltaByte = dataView.getUint8(offset + byteLength)
        byteLength++;
        time = (time << 7) | (deltaByte & 0x7F);
        if ((deltaByte & 0x80) === 0) break;
    } 

    return [time, byteLength]
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
        let res = parseVariableTime(dataView, 0);

        // Verify
        if (res[0] != number) {
            let hexRep = rep.map(v => v.toString(16));
            console.log(`Expected ${number.toString(16)} - Actual ${res[0].toString(16)} - Input ${hexRep}`);
        } 
    }

}

function initialize() {
    // How do we want the file thing to work? 
    // 1. Wait for user input (e.g. set up file handler)
    // 2. Given input read it, parse it and send it to somewhere else

    // const myFirstPromise = new Promise((resolve, reject) => {
    //     // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
    //     // In this example, we use setTimeout(...) to simulate async code.
    //     // In reality, you will probably be using something like XHR or an HTML API.
    //     setTimeout(() => {
    //         console.log(`Yay!`);
    //         resolve("Success!"); // Yay! Everything went well!
    //     }, 250);
    // });

    // myFirstPromise.then((successMessage) => {
    //     // successMessage is whatever we passed in the resolve(...) function above.
    //     // It doesn't have to be a string, but if it is only a succeed message, it probably will be.
    //     console.log(`Yay! ${successMessage}`);
    // });



    // initializeMIDIUSBAccess();
    // initializeFileInput();


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