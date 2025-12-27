
class MidiProgramState {
    static EVENT = Object.freeze({
        MELODY_CHANGE: "MelodyChange",
    });
    constructor(viewManager) {
        assert(viewManager instanceof ViewManager, 'Invalid argument. viewManager not a ViewManager');
        this.currentMelody = null;
        this.viewManager = viewManager;
        this.settings = {
            currentMelodyView: null,
        };

        this.eventListeners = {
            [MidiProgramState.EVENT.MELODY_CHANGE]: []
        };
    }

    getViewManager() {
        return this.viewManager;
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) { return; }
        this.eventListeners[event].push(callback);
    }

    // TODO?: Melody history? Instead of 
    setMelody(melody) {
        assert(this._isValidMelody(melody), `The argument to setMelody was not a valid melody ${melody}`);
        this.melody = melody;

        this.eventListeners[MidiProgramState.EVENT.MELODY_CHANGE].forEach(callback => {
            callback(melody); 
        });
    }
    _isValidMelody(melody) {
        // TODO
        return true;
    }

    setMelodyView(view) {
        this.settings.currentMelodyView = view;
    }

}

