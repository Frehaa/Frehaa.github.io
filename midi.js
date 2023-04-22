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
const ENTER_KEY = "Enter";

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
}

function initializeMIDIUSBAccess() {
    // Check if Web MIDI API is supported
    if (navigator.requestMIDIAccess) {
        // Request access to MIDI devices
        navigator.requestMIDIAccess()
        .then(function(midiAccess) {
            // Get the list of MIDI inputs
            var inputs = midiAccess.inputs.values();

            // Iterate over each input and create a new list item for it
            for (var input of inputs) {
                // Create a new list item for the input
                var li = document.createElement("li");
                li.innerHTML = input.name;
                document.getElementById("midi-input").appendChild(li);

                // Add an event listener to the input to display the received data
                input.onmidimessage = function(event) {
                    console.log("Received MIDI data:", event.data);
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

function playSound() {
    // request microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => {
      // Create an AudioContext object
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Create an OscillatorNode
  const oscillator = audioCtx.createOscillator();

  // Set the oscillator frequency to middle C (261.63 Hz)
  oscillator.frequency.value = 256;

  // Create a GainNode to control the volume
  const gainNode = audioCtx.createGain();
  const duration = 2;

  // Set the initial gain to 0
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

  // Ramp up the gain to 1 over 50 milliseconds (attack)
  gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);

  // Ramp down the gain to 0 over 500 milliseconds (decay)
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

  // Connect the oscillator to the gain node, and the gain node to the AudioContext destination
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Start the oscillator
  oscillator.start();

  // Stop the oscillator after 500 milliseconds
  oscillator.stop(audioCtx.currentTime + duration);
  })
  .catch((err) => {
    console.error(err);
  });

}

function initialize() {
    // playSound();
    defaultCode();

    initializeFileInput();

    const textArea = document.getElementById('code-text-area');
    document.onkeyup = function(event) {
        if (event.ctrlKey && event.key == ENTER_KEY) {
            let f = new Function('a', 'l', textArea.value);
            let res = f(arrayBuffer, console.log);
        }
    }

}

function defaultCode() {
    let code = `
l()
let dataView = new DataView(a);
const META_EVENT = 0xFF;
const SYS_EX_EVENT = 0xF0;

function getString(dataView, offset, length) {
    let string = "";
    for (let i = 0; i < length; i++) {
        string += String.fromCharCode(dataView.getInt8(offset + i));
    }
    return string;
}

let header = getString(dataView, 0, 4);

let length = dataView.getUint32(4);

let fileFormat = dataView.getUint16(8);
let numTracks = dataView.getUint16(10);
let timeDivision = dataView.getUint16(12);


let trackHeader = getString(dataView, 14, 4);


let trackLength = dataView.getUint32(18);


// Tries to parse a variable length value in dataView from the offset
function getDeltaTime(dataView, offset) {
    let delta = 0
    let length = 0;
    while (true) {
        let deltaByte = dataView.getUint8(offset + length)
        length++;
        delta = (delta << 7) | (deltaByte & 0x7F);
        if ((deltaByte & 0x80) === 0) break;
    } 

    return [delta, length]
}

function isNoteOnEvent(eventType) {
    return (eventType & 0xF0) === 0x90;
}
function isNoteOffEvent(eventType) {
    return (eventType & 0xF0) === 0x80;
}
function isControlChangeEvent(eventType) {
    return (eventType & 0xF0) === 0xB0;
}
function isProgramChangeEvent(eventType) {
    return (eventType & 0xF0) === 0xC0;
}
function isSystemExclusiveEvent(eventType) {
    return (eventType & 0xFF) === 0xF0;
}
function isMetaEvent(eventType) {
    return eventType === 0xFF;
}

function getMetaEventType(dataView, offset) {
    return dataView.getUint8(offset);
}

function parseTrackEvent(dataView, offset) {
    let eventType = dataView.getUint8(offset);
    if (isNoteOnEvent(eventType)) {
        l(offset, "Note On");
        return offset + 3;
    } else if (isNoteOffEvent(eventType)) {
        l(offset, "Note Off");
        return offset + 3;        
    } else if (isControlChangeEvent(eventType)) {
        l(offset, "Control Change");
        return offset + 3;
    } else if (isProgramChangeEvent(eventType)) {
        l(offset, "Program Change");
        return offset + 2;
    } else if (isSystemExclusiveEvent(eventType)) {
        l(offset, "System Exclusive");
        return offset + 1;
    } else if (isMetaEvent(eventType)) {
        let metaEventType = dataView.getUint8(offset + 1)
        let length = dataView.getUint8(offset + 2);
        l(offset, "Meta Event", "0x"+metaEventType.toString(16), length);
        for (let i = 0; i < length; ++i) {
            let val = dataView.getUint8(offset + 3 + i);
            l(val)
        }
        return offset + 3 + length + 1; // I do not understand why the + 1
    } else {
        l(offset, "Unknown Event: 0x" + eventType.toString(16));
        return offset + 1;
    }
}

let [vTime, vTimeLength] = getDeltaTime(dataView, 22)
l(trackLength)


return 
let offset = 23 + trackLength;
let i = 0;
while(i < 5) {
    i++;
    offset = parseTrackEvent(dataView, offset);
}

// Start of next track
l(getString(dataView, 22 + trackLength, 4));

`;

    document.getElementById('code-text-area').innerHTML = code;

}