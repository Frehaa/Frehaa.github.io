class MelodyViewController extends BaseController {
    static CONTROL_NOTES = { // TODO: Read these from the program state settings? LOW PRIORITY
        21: trainingManager => trainingManager.togglePause(),
        23: trainingManager => trainingManager.reset(), 
        25: trainingManager => trainingManager.speedDown(),
        27: trainingManager => trainingManager.speedUp(),
        108: trainingManager => trainingManager.setSavePoint(),
    };
    constructor(programState) {
        super(programState)
    }

    getCurrentMelodyView() {
        const viewManager = this.programState.getViewManager();
        return viewManager.getView(Views.SETTINGS);
    }
    
    displayErrorMessage(message, error) {
        alert(message);
        console.log(error)
    }

    handleControlNote(noteValue, trainingGameManager) {
        const actionName = this.programState.getControlActionName(noteValue);
        switch (actionName) {
            case MidiProgramState.CONTROL_ACTIONS.PAUSE: {
                trainingGameManager.togglePause();
            } break;
            case MidiProgramState.CONTROL_ACTIONS.RESET: {
                trainingGameManager.reset();
            } break;
            case MidiProgramState.CONTROL_ACTIONS.SPEED_DOWN: {
                trainingGameManager.speedDown();
            } break;
            case MidiProgramState.CONTROL_ACTIONS.SPEED_UP: {
                trainingGameManager.speedUp();
            } break;
            case MidiProgramState.CONTROL_ACTIONS.SET_SAVE_POINT: {
                trainingGameManager.setSavePoint();
            } break;
            default: { 
                assert(false, "handleControlNote was called with a note value not corresponding to an action.");
            } break;
        }
    }

    handleNoteOn(noteValue) {
        const trainingGameManager = this.programState.getTrainingGameManager();
        l('Pressed:', noteValue);
        if (this.programState.isControlNote(noteValue)) {
            this.handleControlNote(noteValue, trainingGameManager);
        } else {
            trainingGameManager.handleNotePress(noteValue);
        }
    }
    // We call release note on every note, even control notes. Is there a possible issue in this?
    handleNoteOff(noteValue) {
        l('Released:', noteValue);
        const trainingGameManager = this.programState.getTrainingGameManager();
        trainingGameManager.handleNoteRelease(noteValue);
    }
}