// Helper functions
function isPointInRectangle(p, a) {
    return a.leftX <= p.x && p.x <= a.leftX + a.width && a.topY <= p.y && p.y <= a.topY + a.height;
}

function doesRectanglesOverlap(a, b) {
    return !(a.rightX < b.leftX || b.rightX < a.leftX || a.bottomY < b.topY || b.bottomY < a.topY);
}

class FallingNotesView extends InteractableUIELement { 
    constructor(position, size, fallingNotes, customDrawNote, customDrawKey, drawSettings) {
        super(position, size, 0)
        this.elapsedTimeMs = 0;
        this.position = position;
        this.size = size;

        this.drawSettings = { // This view consists of a bottom UI and a note view. 
            bottomAreaHeight: 120,
            timeFromTopToBottomMs: 2000,
            maxOctaves: 8,
            windowX: 0, // For displaying different subsets of keys. Keys are drawn starting from x = 0 with note value 0 and continue maxOctave octaves
            whiteKeyWidth: 24,   // Correct values found in documentation for white keys = 23.5 mm
            blackKeyWidth: 13,   // Correct values found in documentation for black keys = 9-14 mm
            defaultNoteFill: 'black',
            ...drawSettings, // For overwriting defaults
        };

        this.dragScrollSpeedX = 100;
        this.dragScrollSpeedY = 50;

        this.hoverNote = null;
        this.dragStartPosition = null;
        this.selectedElements = [];
        this.boxedElements = [];
        this.notes = fallingNotes || [];
        this.customKeyFill = customDrawKey || (_ => false); 
        this.customNoteFill = customDrawNote || (_ => {});

        this.shiftKeyDown = false;
    }
    getNoteType(note) {
        if (this.hoverNote === note) {
            return 'hovered'
        } else if (this.selectedElements.includes(note)) {
            return 'selected'
        } else if (this.boxedElements.includes(note)) {
            return 'boxed'
        } else {
            return 'normal';
        }
    }

    setElapsedTimeMs(elapsedTimeMs) {
        this.elapsedTimeMs = elapsedTimeMs;
        // A bit of a hack 
        const mousePosition = this.ui? this.ui.mousePosition : {x: -1, y: -1};
        this.hoverNote = this.findHoverNote(mousePosition);
    }

    _getRect() { // TODO?: Do something smarter which doesn't make me create an object every frame
        return {
            leftX: this.position.x,
            topY: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
    }

    drawNote(ctx, note) {
        const {leftX, topY, width, height} = this._getRect();

        const bottomAreaTopY = topY + height - this.drawSettings.bottomAreaHeight;

        // TODO?: Determine whether to draw note based on note value, startMs and durationMs? We should know which note values and times are visible in the view. This seems like a very minor optimization though. It would be a lot better to do a simple check and avoid calling drawNote multiple notes. So if 

        const noteRect = this.calculateNoteRectangle(note);
        if (noteRect.leftX + noteRect.width < leftX || leftX + width <  noteRect.leftX) { return } ; 
        if (noteRect.topY + noteRect.height < topY || bottomAreaTopY < noteRect.topY) { return } ; 

        let noteLeft = noteRect.leftX;
        let noteWidth = noteRect.width;
        let noteTop = noteRect.topY;
        let noteHeight = noteRect.height;

        if (noteRect.leftX < leftX) { // Case when note is going out of view to the left
            noteWidth = noteRect.leftX + noteRect.width - leftX
            noteLeft = leftX;
        } else if (noteRect.leftX + noteRect.width > leftX + width) { // Case when note is going out of view to the right
            noteWidth = leftX + width - noteRect.leftX;
        } 

        if (noteRect.topY < topY) {
            noteTop = topY;
            noteHeight = noteRect.height - (topY - noteRect.topY);
        } else if (noteRect.topY + noteRect.height > bottomAreaTopY) {
            noteHeight = bottomAreaTopY - noteRect.topY;
        }
        if (!this.customNoteFill(note)) {
            ctx.fillStyle = this.drawSettings.defaultNoteFill;// 'black';
        }
        ctx.fillRect(noteLeft, noteTop, noteWidth, noteHeight);
    }

    mouseMove(e) { 
        this.hoverNote = null;
        const mousePosition = this.ui.mousePosition;
        if (this.dragStartPosition !== null) {
            const boxingArea = { // TODO?: Limit selection to those in view?
                leftX:  Math.min(this.dragStartPosition.x, mousePosition.x),
                rightX: Math.max(this.dragStartPosition.x, mousePosition.x),
                topY: Math.min(this.dragStartPosition.y, mousePosition.y),
                bottomY: Math.max(this.dragStartPosition.y, mousePosition.y),
            }
            this.boxedElements = this.selectElementsInRectangle( // TODO? (Premature Optimization): Right now we do a complete recomputation, would it be better to somehow reuse the previous result?
                this.notes,
                boxingArea.leftX,
                boxingArea.rightX,
                boxingArea.topY,
                boxingArea.bottomY,
            );

        } else {
            this.hoverNote = this.findHoverNote(mousePosition);
        }
    }
    
    // Returns first note with bounding box around position or null
    findHoverNote(position) {
        for (const note of this.notes) {
            const rect = this.calculateNoteRectangle(note);
            if (isPointInRectangle(position, rect)) {
                return note;
            }
        }
        return null;
    }

    draw(ctx) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        this.drawNotes(ctx);
        this.drawSelectionBox(ctx);
        this.drawBottomArea(ctx);
        this.drawSettingsPanel(ctx); // TODO: Have this part of the UI instead?
        this.bufferedBoundingBox.draw(ctx);

        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';

        const {leftX, topY, width, height} = this._getRect();
        ctx.strokeRect(leftX, topY, width, height);
        ctx.strokeRect(leftX, topY, width, height); // Double draw make the lines sharper
    }
    isPositionInNotesView(position) {
        const {leftX, topY, width, height} = this._getRect();
        return (leftX <= position.x && position.x <= leftX + width &&
                topY <= position.y && position.y <= topY + (height - this.drawSettings.bottomAreaHeight));
    }

    // TODO: If the user clicks directly on a unit, should it be selected without boxing, or should we still initiate box if we are dragging? Maybe we can do both?
    mouseDown(e) { // TODO: Shift click does not clear selected elements
        if (!this.bufferedBoundingBox.contains(this.ui.mousePosition)) return;
        
        // Boxing functionality 
        if (e.button === LEFT_MOUSE_BUTTON && this.isPositionInNotesView(this.ui.mousePosition)) {
            if (!this.shiftKeyDown) { this.selectedElements.clear(); }
            this.dragStartPosition = this.ui.mousePosition;
            this.dragStartTime = this.elapsedTimeMs;
        }
    }
    
    mouseUp(e) { // TODO?: Right now we don't recalculate the boxed elements based on the mouse position of the mouseUp event, but rely on the last mouseMove event instead. This can in theory result in inaccuracies if the mouseUp event is performed between two mouseMove events. Should we recalculate the boxedElements for the mouseUp event?
        // TODO: Check if hovering an element when releasing the button
        // Boxing functionality
        if (e.button !== LEFT_MOUSE_BUTTON) return false;
        if (this.dragStartPosition !== null) {
            this.selectedElements = this.selectedElements.concat(...this.boxedElements); // Concat to previously selected elements (e.g. when holding shift)
            this.boxedElements = [];
            this.dragStartPosition = null;

            if (this.selectedElements.length > 0) return false;

            // Handle single click instead of boxing 
            const mousePosition = this.ui.mousePosition;
            for (const note of this.notes) {
                const rect = this.calculateNoteRectangle(note);
                if (isPointInRectangle(mousePosition, rect)) {
                    this.selectedElements = [note];
                    break;
                }
            }

        }
    }

    calculateNoteOffsetX(noteValue, whiteKeyWidth, blackKeyWidth) {
        const octave = Math.floor(noteValue / 12); // 12 is the number of keys in an octave
        const octaveNoteValue = noteValue % 12;
        let offsetX = whiteKeyWidth * octave * 7;

        switch (octaveNoteValue) {
            case 0: return offsetX;                                             // C
            case 1: return offsetX + whiteKeyWidth - 2/3 * blackKeyWidth;       // C# 
            case 2: return offsetX + whiteKeyWidth;                             // D
            case 3: return offsetX + 2 * whiteKeyWidth - 1/3 * blackKeyWidth;   // D#
            case 4: return offsetX + 2 * whiteKeyWidth;                         // E
            case 5: return offsetX + 3 * whiteKeyWidth;                         // F
            case 6: return offsetX + 4 * whiteKeyWidth - 3/4 * blackKeyWidth;   // F#
            case 7: return offsetX + 4 * whiteKeyWidth;                         // G
            case 8: return offsetX + 5 * whiteKeyWidth - 1/4 * blackKeyWidth;   // G#
            case 9: return offsetX + 5 * whiteKeyWidth;                         // A
            case 10: return offsetX + 6 * whiteKeyWidth - 1/4 * blackKeyWidth;  // A#
            case 11: return offsetX + 6 * whiteKeyWidth;                        // B
            default: assert(false, `Note value ${noteValue} out of bound. Should be in range [0, 11] after modulo 12.`);
        }
    }

    _drawBottomAreaWhiteKeys(ctx, whiteKeyWidth, maxOctaves, leftX, width, windowX, bottomAreaTop, whiteKeyLength) {
        const whiteKeysInOctave = 7;
        const iToNoteValue = [0, 2, 4, 5, 7, 9, 11]
        // TODO?: Should we use rect or lineTo to draw the white keys?
        for (let i = 0; i < whiteKeysInOctave * maxOctaves; i++) {
            const noteLeftX = leftX + i * whiteKeyWidth - windowX;
            if (leftX + width < noteLeftX) { break; } // Outside of view to the right
            if (noteLeftX < leftX) { continue; } // Outside of view to the left
            ctx.moveTo(noteLeftX, bottomAreaTop);
            ctx.lineTo(noteLeftX, bottomAreaTop + whiteKeyLength);

            // Handle pressed keys
            const noteValue = Math.floor(i / 7) * 12 + iToNoteValue[i % 7];
            if (this.customKeyFill(noteValue)) {
                ctx.fillRect(noteLeftX, bottomAreaTop, whiteKeyWidth, whiteKeyLength);
            }
        }
        // Top line
        ctx.moveTo(leftX, bottomAreaTop);
        ctx.lineTo(leftX + width, bottomAreaTop);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke()
    }
    _drawBottomAreaBlackKeys(ctx, whiteKeyWidth, blackKeyWidth, maxOctaves, leftX, width, windowX, bottomAreaTop, blackKeyLength) {
        const whiteKeysInOctave = 7;
        const octaveWidth = whiteKeysInOctave * whiteKeyWidth;
        const blackKeyOffsets = [
            whiteKeyWidth - 2/3 * blackKeyWidth,
            2 * whiteKeyWidth - 1/3 * blackKeyWidth,
            4 * whiteKeyWidth - 3/4 * blackKeyWidth,
            5 * whiteKeyWidth - 1/2 * blackKeyWidth, 
            6 * whiteKeyWidth - 1/4 * blackKeyWidth
        ];
        const jToNoteValue = [1, 3, 6, 8, 10];
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        for (let i = 0; i < maxOctaves; i++) {
            const octaveOffset = i * octaveWidth;
            if (octaveOffset - windowX > leftX + width) break
            for (let j = 0; j < blackKeyOffsets.length; j++) {
                ctx.beginPath();
                const noteLeftX = leftX + octaveOffset + blackKeyOffsets[j] - windowX;

                if (noteLeftX + blackKeyWidth < leftX) { continue; } // Outside of view to the left
                if (leftX + width < noteLeftX) { continue; } // Outside of view to the right


                if (noteLeftX < leftX) { // Partially out of view to the left
                    const diff = leftX - noteLeftX;
                    ctx.rect(leftX, bottomAreaTop, blackKeyWidth - diff, blackKeyLength);
                } else if (noteLeftX + blackKeyWidth > leftX + width) { // Partially out of view to the right
                    const diff = noteLeftX + blackKeyWidth - (leftX + width);
                    ctx.rect(noteLeftX, bottomAreaTop, blackKeyWidth - diff, blackKeyLength);
                } else {
                    ctx.rect(noteLeftX, bottomAreaTop, blackKeyWidth, blackKeyLength);
                }

                const noteValue = i * 12 + jToNoteValue[j];
                if (!this.customKeyFill(noteValue)) {
                    ctx.fillStyle = 'black';
                }
                ctx.fill()
                ctx.stroke()

            }
        }
    }

    // TODO: Give an update function to be called each frame. This is necessary to do scrolling view with selection box 
    update(dt) {
        if (this.dragStartPosition !== null) {
            if (this.ui.mousePosition.x < this.position.x) {
                this.drawSettings.windowX += this.dragScrollSpeedX * dt / 1000;
            } else if (this.ui.mousePosition.x > this.position.x + this.size.width) {
                this.drawSettings.windowX += this.dragScrollSpeedX * dt / 1000;
            }
            
            if (this.ui.mousePosition.y < this.position.y) {
                this.elapsedTimeMs += this.dragScrollSpeedY * dt / 1000;
            } else if (this.ui.mousePosition.y > this.position.y + this.size.height - this.drawSettings.bottomAreaHeight) {
                this.elapsedTimeMs += this.dragScrollSpeedY * dt / 1000;
            }
        }
    }

    drawBottomArea(ctx) { 
        const {leftX, topY, width, height} = this._getRect();
        const {
            bottomAreaHeight,
            windowX,
            whiteKeyWidth,
            blackKeyWidth,
            maxOctaves
            } = this.drawSettings;

        const bottomAreaTop = topY + height - bottomAreaHeight;
        const blackKeyLength = 2/3 * bottomAreaHeight;

        this._drawBottomAreaWhiteKeys(ctx, whiteKeyWidth, maxOctaves, leftX, width, windowX, bottomAreaTop, bottomAreaHeight);
        this._drawBottomAreaBlackKeys(ctx, whiteKeyWidth, blackKeyWidth, maxOctaves, leftX, width, windowX, bottomAreaTop, blackKeyLength);
    }

    drawSelectionBox(ctx) {
        if (this.dragStartPosition !== null) {
            const mousePosition = this.ui.mousePosition;
            let leftX = Math.min(this.dragStartPosition.x, mousePosition.x);
            let topY = Math.min(this.dragStartPosition.y, mousePosition.y);
            let width = Math.abs(this.dragStartPosition.x - mousePosition.x)
            let height = Math.abs(this.dragStartPosition.y - mousePosition.y)

            // TODO: Draw not only based off of mouse position but also time elapsed, such that if we change the time elapsed the selection box sticks to the elapsed time it was started at

            if (leftX < this.position.x) {
                width = width - (this.position.x - leftX);
                leftX = this.position.x
            } else if (leftX + width > this.position.x + this.size.width) { 
                width = this.size.width + this.position.x - leftX;
            }

            if (topY < this.position.y) {
                height = height - (this.position.y - topY);
                topY = this.position.y
            } else if (topY + height> this.position.y + this.size.height - this.drawSettings.bottomAreaHeight) {
                height = this.size.height + this.position.y - this.drawSettings.bottomAreaHeight - topY;
            }

            ctx.beginPath();
            // ctx.moveTo(this.dragStart.x, this.dragStart.y);
            // ctx.lineTo(mousePosition.x, this.dragStart.y);
            // ctx.lineTo(mousePosition.x, mousePosition.y);
            // ctx.lineTo(this.dragStart.x, mousePosition.y);
            // ctx.closePath();

            ctx.rect(leftX, topY, width, height)

            // Surprisingly nice colors
            ctx.fillStyle = 'rgba(100, 150, 200, 0.5)'; 
            ctx.fill()
            ctx.strokeStyle = 'rgba(100, 150, 200, 1)';
            ctx.strokeWidth = 4;
            ctx.stroke();
        }
    }
    
    // TODO?: Have this be done by a different module
    drawSettingsPanel() {

    }

    // Calculates a notes offset from the top of the view
    calculateNoteOffsetY(noteDurationMs, noteStartMs) {
        const {timeFromTopToBottomMs} = this.drawSettings;
        
        const t = (noteStartMs - this.elapsedTimeMs); // Normalization, we now treat the note as being t ms after 0

        const tf = t / timeFromTopToBottomMs; // This gives a fraction of how far up the note is from the bottom 

        const noteAreaHeight = this.size.height - this.drawSettings.bottomAreaHeight;
        const noteHeight = (noteDurationMs / timeFromTopToBottomMs) * noteAreaHeight;

        const noteBottom = noteAreaHeight * (1 - tf)

        return noteBottom - noteHeight;
    }

    calculateNoteHeight(durationMs, timeFromTopToBottomMs, noteAreaHeight) {
        const noteHeightFraction = durationMs / timeFromTopToBottomMs;
        return noteHeightFraction * noteAreaHeight;
    }

    calculateNoteRectangle(note) {
        const {leftX, topY, height} = this._getRect();
        const {windowX, timeFromTopToBottomMs, bottomAreaHeight, whiteKeyWidth, blackKeyWidth} = this.drawSettings;

        const noteLeftX = -windowX + leftX + this.calculateNoteOffsetX(note.value, whiteKeyWidth, blackKeyWidth);
        const noteTopY = topY + this.calculateNoteOffsetY(note.durationMs, note.startMs);

        const noteAreaHeight = height - bottomAreaHeight;
        const noteHeight = this.calculateNoteHeight(note.durationMs, timeFromTopToBottomMs, noteAreaHeight);

        // TODO?: Differentiate between key and note width?
        const noteWidth = note.isWhiteKey()? whiteKeyWidth : blackKeyWidth;

        return {leftX: noteLeftX, topY: noteTopY, width: noteWidth, height: noteHeight}
    }

    selectElementsInRectangle(notes, leftX, rightX, topY, bottomY) {
        const result = [];
        for (const note of notes) {
            const noteRectangle = this.calculateNoteRectangle(note); // TODO?: Is this really the best way to do this?
            const noteCorners = {
                leftX: noteRectangle.leftX,
                rightX: noteRectangle.leftX + noteRectangle.width,
                topY: noteRectangle.topY,
                bottomY: noteRectangle.topY + noteRectangle.height
            }
            if (doesRectanglesOverlap(noteCorners, {leftX, rightX, bottomY, topY})) 
            {
                result.push(note);
            }
        }
        return result;
    }

    // No Longer Used 
    getNoteFillStyle(note) {
        if (this.selectedElements.length > 0 && this.selectedElements.includes(note)) {
            if (note === this.hoverNote) { return 'pink'; }
            else { return 'purple'; }
        }
        else if (note === this.hoverNote) { return 'blue'; } 
        else if (this.boxedElements.includes(note)) { return 'red'; }
        else { return 'black'; }
    }

    drawNotes(ctx) {
        for (const note of this.notes) {
            this.drawNote(ctx, note);
        }
    }
}