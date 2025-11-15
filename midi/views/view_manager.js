class ViewManager {
    constructor() {
        this.viewStack = [];
        this.views = new Map();
    }
    registerView(name, view) {
        assert(!this.views.has(name), 'Tried to register same view twice.');
        this.views.set(name, view);
    }
    getView(name) {
        return this.views.get(name);
    }
    getCurrentView() {
        assert(this.viewStack.length > 0, 'No current view set');
        return this.viewStack[this.viewStack.length - 1];
    }
    pushView(view) {
        assert(this._isValidView(view), `The argument to setActiveView was not a valid view ${view}`);
        this.viewStack.push(view);
    }
    popView() {
        return this.viewStack.pop();
    }
    _isValidView(view) {
        // TODO
        return true;
    }
}