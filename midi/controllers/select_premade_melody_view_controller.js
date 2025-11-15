class SelectPremadeMelodyViewController extends BaseController {
    constructor(programState) {
        super(programState);
    }
    displayErrorMessage(message, error) {
        alert(message);
        console.log(error)
    }
}