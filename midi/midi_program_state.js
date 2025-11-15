
class MidiProgramState {
    constructor(viewManager) {
        assert(viewManager instanceof ViewManager, 'Invalid argument. viewManager not a ViewManager');
        this.currentMelody = null;
        this.viewManager = viewManager;
    }

    getViewManager() {
        return this.viewManager;
    }

    // TODO?: Melody history? Instead of 
    setMelody(melody) {
        assert(this._isValidMelody(melody), `The argument to setMelody was not a valid melody ${melody}`);
        this.melody = melody;
    }
    _isValidMelody(melody) {
        // TODO
        return true;
    }

}

