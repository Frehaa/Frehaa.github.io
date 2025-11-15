class BaseController {
    constructor(programState) {
        this.programState = programState;
        this.viewManager = programState.getViewManager();
    }

    goToView(viewName) {
        console.log('Go to view', viewName);
        
        const view = this.viewManager.getView(viewName);
        this.viewManager.pushView(view);
    }

    returnToPreviousView() {
        this.viewManager.popView();
    }
}