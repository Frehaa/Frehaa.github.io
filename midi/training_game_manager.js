class TrainingGameManager {
    togglePause() { 
        this.settings.paused = !this.settings.paused; 
        this.callbacks['pause'].forEach(c => (c(this.settings.paused)));
    }
    _getEarliestNoteTime(notes) {
        return Math.min(...notes.map(n => n.startMs));
    }
    reset() { 
        this.elapsedTimeMs = this.resetTime; 
        this.successNotes.clear();
        this.failedNotes.clear();
        this.failedPressCount = 0;
    }
    // TODO: Make speed ups and downs in a set interval
    speedUp() { 
        this.settings.speedMultiplier = Math.min(5, this.settings.speedMultiplier + this.settings.speedIncrement); 
    } 
    speedDown() { 
        this.settings.speedMultiplier = Math.max(0.1, this.settings.speedMultiplier - this.settings.speedIncrement); 
    } 

    isPaused() {
        return this.settings.paused;
    }

    setSavePoint() {
        this.resetTime = this.elapsedTimeMs;
    } 

    constructor() {
        this.hasMelody = false;
        this.notesToPlay = new Set();
        this.pressedKeys = new Set();
        this.successNotes = new Set();
        this.failedNotes = new Set();
        this.settings = {
            startWaitMs: 500, // TODO: Base this off of the tact to play in i.e. wait one octave in the speed of the song 
            speedMultiplier: 1,
            speedIncrement: 0.1,
            paused: true,
            timeMarginMs: 100 // How many milliseconds can be before or after a note should be pressed to the press
        };
        this.resetTime = 0;
        this.elapsedTimeMs = 0;
        this.endTime = 0;

        this.failedPressCount = 0;

        this.callbacks = {
            "pause": []
        }
    }


    // Start and stop purely to make sure the state are in a valid state for when we update stuff
    start() {
        this.settings.paused = false;
    }
    stop() {
        this.settings.paused = true;
    }

    getMaxTime() {
        return this.endTime; 
    }

    addCallback(type, callback) {
        this.callbacks[type].push(callback);
    }

    clearMelody() {
        this.hasMelody = false;
        this.notesToPlay.clear();
    }
    setMelody(melody) {
        this.notesToPlay.clear();
        melody.notes.forEach(n => this.notesToPlay.add(n));
        this.hasMelody = true;
        this.endTime = Math.max(...melody.notes.map(n => n.startMs + n.durationMs));
        this.successNotes = new Set();
        this.failedNotes = new Set();
        this.resetTime = this._getEarliestNoteTime(melody.notes) - this.settings.startWaitMs;
        this.reset();
    }

    incrementElapsedTime(deltaTimeMs) {
        if (this.settings.paused) { console.warn("Tried to increment training manager while paused."); return; }
        this.elapsedTimeMs += deltaTimeMs * this.settings.speedMultiplier;
    }

    getNoteType(note) {
        if (this.successNotes.has(note)) {
            return "success"
        } else if (this.failedNotes.has(note)) {
            return "failed"
        } else if (this.notesToPlay.has(note)) {
            return "play"
        } else {
            return "unknown"
        }
    }

    isKeyPressed(noteValue) {
        return this.pressedKeys.has(noteValue);
    }

    handleNoteRelease(noteValue) {
        return this.pressedKeys.delete(noteValue);
    }
    handleNotePress(noteValue) {
        this.pressedKeys.add(noteValue);

        const timeMarginMs = this.settings.timeMarginMs; 

        let success = false;
        for (const note of this.notesToPlay) {
            // If our note press matches a note in notes for the given elapsed time, then success, otherwise failure
            if (note.value === noteValue && note.startMs - timeMarginMs <= this.elapsedTimeMs && this.elapsedTimeMs <= note.startMs + timeMarginMs) {
                this.successNotes.add(note);
                this.failedNotes.delete(note);
                success = true;
                break;
            }
        }

        if (!success) {
            this.failedPressCount += 1
        }
    }

    checkForFailedNotes() {
        if (this.settings.paused) { return; } 
        for (const note of this.notesToPlay) {
            if (this.successNotes.has(note) || this.failedNotes.has(note) || this.elapsedTimeMs < note.startMs) { continue } ;
            this.failedNotes.add(note);
        }
    }

    getFailedNotesCount() {
        return this.failedPressCount + this.failedNotes.size;
    }

}