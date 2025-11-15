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
        
        this.programState.setMelody(melody);
    } 
    changeToMelodyView() {
        const viewManager = this.programState.getViewManager();
        const melodyView = viewManager.getView(Views.MELODY);
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