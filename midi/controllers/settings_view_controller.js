class SettingsViewController extends BaseController {
    constructor(programState) {
        super(programState);
    }

    selectMelodyView(view) {
        const viewManager = this.programState.getViewManager();
        const melodyView = viewManager.getView(Views.MELODY);

        console.log(view);
    }
    
    displayErrorMessage(message, error) {
        alert(message);
        console.log(error)
    }
}