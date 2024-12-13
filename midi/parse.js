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

// Expects an ArrayBuffer since this is what the DataView can handle
// TODO: Make a promise do the workparse this?
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

function parseHeaderChunk(dataview, offset) {
    const length = dataview.getUint32(offset + 4);
    assert(length >= 6, formatParseErrorMessage(offset-4, `Data length too small for header chunk. Expected at least 6, found ${length}`));  
    const chunk = {
        type,
        format: dataview.getUint16(offset + 8),
        ntrks: dataview.getUint16(offset + 10),
        division: dataview.getUint16(offset + 14)
    };
    return [chunk, offset + length];
}

function parseChunk(dataview, offset, trackNumber) {
    assert(dataview.byteLength > offset + 8, formatParseErrorMessage(offset, `The dataview did not contain enough bytes to read chunk`));
    const type = dataview.getUint32(offset);
    const length = dataview.getUint32(offset + 4);

    offset += 8;
    switch (type) {
        case CHUNK_TYPE.HEADER: { // Parse Header chunk
            // return parseHeaderChunk(dataview, offset);
            assert(length >= 6, formatParseErrorMessage(offset-4, `Data length too small for header chunk. Expected at least 6, found ${length}`));  
            const chunk = {
                type,
                format: dataview.getUint16(offset),
                ntrks: dataview.getUint16(offset + 2),
                division: dataview.getUint16(offset + 4)
            };
            // return [chunk, offset + length];
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

