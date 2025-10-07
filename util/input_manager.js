class InputManager {
    static LEFT_MOUSE = 0;
    static RIGHT_MOUSE = 2;
    static MIDDLE_MOUSE = 1;
    constructor() {
        this.mouseDown = [false, false, false];
        this.pressedKeys = new Set();
        this.callbacks = new Map();
        document.addEventListener('mousedown', e => {
            this.mouseDown[e.button] = true;
        });
        document.addEventListener('mouseup', e => {
            this.mouseDown[e.button] = false;
        });
        document.addEventListener('mouseleave', e => {

        });
        document.addEventListener('keydown', e => {
            this.pressedKeys.add(e.code);
        });
        document.addEventListener('keyup', e => {
            this.pressedKeys.delete(e.code);
        });
    }
    addKeyListener(key, callback) {
        if (key in this.callbacks) {
            this.callbacks[key].add(callback);
        } else {
            this.callbacks[key] = [callback];
        }
    }
    update(deltaTime) {
        for (const key of this.pressedKeys) {
            if (key in this.callbacks) {
                for (const callback of this.callbacks[key]) {
                    callback(deltaTime); 
                }
            }
        }
    }

}