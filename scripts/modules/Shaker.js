export class Shaker {
    constructor() {
        this.shakeMap = new Map();
    }

    add(shake, interpolator) {
        shake.start(interpolator);
        this.shakeMap.set(shake.ID, shake);
    }

    has(key) {
        return this.shakeMap.has(key);
    }

    getValue(key) {
        return this.shakeMap.get(key).value;
    }

    update() {
        for (let [key, val] of this.shakeMap) {
            val.compute();
            if (val.isFinished) {
                if (val.onFinish) val.onFinish(val);
                this.shakeMap.delete(key);
            }
        }
    }
}

export class Shake {
    constructor(ID, amplitude, frequency, duration, gain = 0, bias = 0) {
        // Parameters
        this.ID = ID;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.duration = duration;
        this.gain = gain;
        this.bias = bias;
        this.nrSamples = (duration / 1000) * frequency;
            // Manual setup
            this.onCompute = null;
            this.onFinish = null;
        // State
        this.value = 0;
        this.isFinished = false;
    }

    start(interpolator) {
        // Generate samples
        this.samples = [];
        for (let i = 0; i < this.nrSamples; ++i)
            this.samples.push(createVector(random(-1, 1), random(-1, 1)).mult(this.amplitude));

        // Start interpolation
        this.interp = interpolator.add(this.ID, 1, 0, this.duration, this.gain, this.bias);
        this.interp.onFinish = () => this.isFinished = true;
    }

    compute() {
        // (!) Select sample with elapsed percentage (instead of eased percentage)
        const delayedElapsed = this.interp.elapsed - this.interp.delay;
        let elapsedInterpPercentage = constrain(delayedElapsed / this.interp.interval, 0, 1);

        const floatIndex = this.nrSamples * elapsedInterpPercentage;
        const previousIndex = floor(floatIndex < this.nrSamples ? floatIndex : floatIndex - 1);
        const nextIndex = ceil(floatIndex + 1 < this.nrSamples ? floatIndex : floatIndex - 1);
        const previousAmplitude = this.samples[previousIndex];
        const nextAmplitude = this.samples[nextIndex];
        let interpAmplitude = createVector(
            lerp(previousAmplitude.x, nextAmplitude.x, this.interp.value),
            lerp(previousAmplitude.y, nextAmplitude.y, this.interp.value));

        this.value = p5.Vector.mult(interpAmplitude, this.interp.value);
        if (this.onCompute) this.onCompute(this);
    }
}