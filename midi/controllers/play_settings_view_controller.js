class PlaySettingsViewController extends BaseController {
    constructor(programState) {
        super(programState);
    }
    setRepeatOnFinish(repeatOnFinish) { 
        this.programState.playSettings.repeatOnFinish = repeatOnFinish;
    }
    setPlaySelectedNotes(playSelectedNotes) { 
        this.programState.playSettings.playSelectedNotes = playSelectedNotes;
    }
    setTempo(tempo) {
        this.programState.playSettings.tempo = tempo;
    }
    setTimeSignature(timeSignature) {
        this.programState.playSettings.timeSignature = timeSignature;
    }
    setBeginningTime(time) {
        this.programState.playSettings.beginningTime = time;
    }
    // Whether the melody should restart from the set beginning time when the user makes a mistake
    setRestartOnMistake(restartOnMistake) {
        this.programState.playSettings.restartOnMistake = restartOnMistake;
    }
    // The number of beats before the melody starts / resumes / restarts
    setBeatsToStart(beatsToStart) {
        this.programState.playSettings.beatsToStart = beatsToStart;
    }
    
    displayErrorMessage(message, error) {
        alert(message);
        console.log(error)
    }
}