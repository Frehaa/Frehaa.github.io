class MelodyViewController extends BaseController {
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
}