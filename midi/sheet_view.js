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