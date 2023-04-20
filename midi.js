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

function uint8ArrayToInt32(array, offset) {
    return array[offset] << 24 | array[offset + 1] << 16 | array[offset + 2] << 8 | array[offset + 3];
}
function uint8ArrayToInt16(array, offset) {
    return array[offset] << 8 | array[offset];
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

let arrayBuffer = null;
function initializeFileInput() {
    const reader = new FileReader();
    // reader.readAsArrayBuffer(file);
    reader.onload = (event) => {
        arrayBuffer = event.target.result;
        return;
        const dataView = new DataView(arrayBuffer);

        const midiHeader = parseMidiHeader(uint8Array);
        if (midiHeader == null) {
            console.log("Invalid file");
            return;
        }

        // Parse the track header
        const trackId = String.fromCharCode(...uint8Array.slice(14, 18));
        const trackLength = uint8ArrayToInt32(trackData.slice(18,22));
        const trackData = uint8Array.slice(22);

        let trackOffset = 0; // Start at the beginning of the track data
        console.log(trackId, trackLength)

        // Parse the track data
        while (trackOffset < trackData.length) {
            let delta = 0;
            let deltaBytes = [];
            while (true) {
                const deltaByte = trackData[trackOffset];
                deltaBytes.push(deltaByte);
                trackOffset++;
                delta = (delta << 7) | (deltaByte & 0x7f);
                if ((deltaByte & 0x80) === 0) break;
            }
            const statusByte = trackData[trackOffset];
            trackOffset++;
            let dataBytes = [];
            if ((statusByte & 0x80) !== 0) {
            const dataByteCount = getMidiEventLength(statusByte) - 1;
            for (let i = 0; i < dataByteCount; i++) {
                dataBytes.push(trackData[trackOffset]);
                trackOffset++;
            }
            }
            console.log(statusByte, dataBytes, delta, deltaBytes)
            break;
            // Do something with the delta time, status byte, and data bytes...
        }
    };

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        reader.readAsArrayBuffer(file)
    });
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

function initialize() {
    initializeFileInput();

    const textArea = document.getElementById('code-text-area');
    document.onkeyup = function(event) {
        if (event.ctrlKey && event.key == ENTER_KEY) {
            let f = new Function('a', 'l', textArea.value);
            let res = f(arrayBuffer, console.log);
        }
    }

}

