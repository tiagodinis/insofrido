// Don't forget to reference in html: <script src=".../CCapture.all.min.js"></script>

export class CaptureWrapper {
    constructor(endFrame) {
        // Parameters
        this.endFrame = endFrame;
        // State
        this.capturing = false;
        this.capturer = new CCapture({format:'png'});
    }

    queryCaptureStart(onResize) {
        if (!keyIsPressed || key !== 'c' || this.capturing) return; // ---

        this.capturing = true;
        frameCount = 0;
        onResize();
        this.capturer.start();
    }

    // Draw inbetween these 2

    capture() {
        if (!this.capturing) return; // ---

        this.capturer.capture(canvas);
        if (frameCount === this.endFrame) {
            this.capturer.stop(); 
            this.capturer.save(); 
        }
    }
}