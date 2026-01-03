
class MidiProgramState {
    static EVENT = Object.freeze({
        MELODY_CHANGE: "MelodyChange",
    });
    static CONTROL_ACTIONS = {
        PAUSE: 'pause',
        RESET: 'reset',
        SPEED_UP: 'speedUp',
        SPEED_DOWN: 'speedDown',
        SET_SAVE_POINT: 'setSavePoint'
    }
    constructor(viewManager) {
        assert(viewManager instanceof ViewManager, 'Invalid argument. viewManager not a ViewManager');
        this.currentMelody = null;
        this.viewManager = viewManager;
        this.settings = {
            currentMelodyView: null,
            controlNotes: new Map([
                [21, MidiProgramState.CONTROL_ACTIONS.PAUSE], 
                [23, MidiProgramState.CONTROL_ACTIONS.RESET], 
                [25, MidiProgramState.CONTROL_ACTIONS.SPEED_UP], 
                [27, MidiProgramState.CONTROL_ACTIONS.SPEED_DOWN], 
                [108, MidiProgramState.CONTROL_ACTIONS.SET_SAVE_POINT]
            ]),
        };

        this.trainingGameManager = new TrainingGameManager();

        this.eventListeners = {
            [MidiProgramState.EVENT.MELODY_CHANGE]: []
        };
    }

    isControlNote(noteValue) {
        return this.settings.controlNotes.has(noteValue);
    }
    getControlActionName(noteValue) {
        assert(this.isControlNote(noteValue), "Called getControlAction for non-control note.");
        return this.settings.controlNotes.get(noteValue);
    }

    getViewManager() {
        return this.viewManager;
    }

    getTrainingGameManager() {
        return this.trainingGameManager;
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) { return; }
        this.eventListeners[event].push(callback);
    }

    // TODO?: Melody history? Instead of 
    setMelody(melody) {
        assert(this._isValidMelody(melody), `The argument to setMelody was not a valid melody ${melody}`);
        this.melody = melody;

        this.trainingGameManager.setMelody(melody);

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

