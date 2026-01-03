class StartScreenController extends BaseController {
    constructor(programState) {
        super(programState);
        const self = this;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style = 'display: none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', e => {
            l('files', fileInput.files)
            if (fileInput.files.length <= 0) {
                self.errorCallback(`File input change event fired even though it contained no files`);
            }

            // Read file as an ArrayBuffer, returning a promise which is handled by respective callbacks.
            fileInput.files[0].arrayBuffer().then(self.loadCallback, self.errorCallback); 
        })
        this.filePicker = fileInput;
    }
    selectFileFromFilePicker(callback, error) {
        this.loadCallback = callback;
        this.errorCallback = error;
        this.filePicker.click();
    }

    setMelody(melody) {
        console.log("Set melody", melody);

        // Make sure the given melody does not have notes overlapping with control notes in the settings
        const noteValues = melody.notes.map(n => n.value);
        const notes = new Set(noteValues);
        // TODO: Have an error case to take care of this
        assert(notes.intersection(this.programState.settings.controlNotes).size === 0, "There should be no overlap in notes to play and control notes.");

        this.programState.setMelody(melody);
    } 
    changeToMelodyView() {
        const viewManager = this.programState.getViewManager();
        const melodyView = viewManager.getView(Views.MELODY);
        assert(this.programState.melody !== null, "Should not change to melody view with no melody.");
        viewManager.pushView(melodyView);
    } 
    changeToPremadeMelodyView() {
        const viewManager = this.programState.getViewManager();
        const selectPremadeMelodyView = viewManager.getView(Views.MELODY_SELECT);
        viewManager.pushView(selectPremadeMelodyView);
    }
    displayErrorMessage(message, error) {
        alert(message);
        console.log(error)
    }
}