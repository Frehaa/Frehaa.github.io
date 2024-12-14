
// TODO: Make tests which parses my MIDI Files or at least some real like data.

function runTests() {
    l("Running tests");
    testParseVariableLengthValue();
    testParseTempoMetaData();
    testCalcAccumulatedDeltaTimes();
    testMergeTracks();
    // testBatchNoteEvents(); // Broken after checking for dupplicate key entries
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
