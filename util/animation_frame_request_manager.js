class AnimationFrameRequestManager {
    constructor(updateCallback) {
        this.lastTimeMs = null;
        this.paused = false;
        this.elapsedTimeMs = 0;
        this.updateCallback = updateCallback;
        this.running = false;

        const self = this;
        this.handleAnimationFrame = time => {
            if (self.paused) { 
                self.running = false;
                return; 
            }
            self.dt = time - self.lastTimeMs;
            self.elapsedTimeMs += self.dt;

            self.updateCallback(self.dt);

            self.lastTimeMs = time;
            requestAnimationFrame(self.handleAnimationFrame);
        }
    }
    togglePause() { // TODO?: Maybe there is some racecondition bug here about runnign and not running
        this.paused = !this.paused;
        if (!this.paused && this.running == false) {
            this.start();
        }
    }

    start() {
        if (this.running) { return; }
        const self = this;
        requestAnimationFrame(time => {
            self.lastTimeMs = time;
            self.running = true;
            self.handleAnimationFrame(time);
        })
    }
}