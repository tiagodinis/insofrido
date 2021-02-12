export class Interpolator {
    constructor() {
        this.interpolationMap = new Map();
    }

    add(key, start, end, interval, gain = 0, bias = 0, delay = 0) {
        let interp = new Interpolation(start, end, interval, gain, bias, delay);
        this.interpolationMap.set(key, interp);
        return interp;
    }

    has(key) {
        return this.interpolationMap.has(key);
    }

    getValue(key) {
        return this.interpolationMap.get(key).value;
    }

    delete(key) {
        this.interpolationMap.delete(key);
    }

    clear() {
        this.interpolationMap.clear();
    }

    update() {
        for (let [key, val] of this.interpolationMap) {
            val.tick();
            val.interpolate();
            if (val.isFinished) this.interpolationMap.delete(key);
        }
    }
}

export class Interpolation {
    constructor(start, end, interval, gain = 0, bias = 0, delay = 0) {
        // Parameters
        this.start = start;
        this.end = end;
        this.interval = interval;
        this.gain = gain;
        this.bias = bias;
        this.delay = delay;
            // Manual setup
            this.iterations = 1; // < 1 for infinite
            this.reverse = false;
            this.alternate = false;
            this.onInterpolate = null;
            this.onFinish = null;
        // State
        this.isFinished = false;
        this.elapsed = 0;
        this.isReversing = this.reverse;
        this.value = this.start;
    }

    tick() {
        this.elapsed += deltaTime;
        if (this.elapsed > this.interval + this.delay) { // Finished iteration?
            if (this.iterations != 1) { // Not the last iteration?
                this.elapsed -= this.interval; // Loop elapsedTime
                if (this.iterations > 1) this.iterations--; // Decrement finite iteration counter
                if (this.alternate) this.isReversing = !this.isReversing;
            }
            else {
                this.isFinished = true;
                if (this.onFinish) this.onFinish(this);
            }
        }
    }

    interpolate() {
        const delayedElapsed = this.elapsed - this.delay;
        if (delayedElapsed < 0) return; // ---

        let elapsedPercentage = constrain(delayedElapsed / this.interval, 0, 1);
        if (this.isReversing) elapsedPercentage = 1 - elapsedPercentage;
        const easedPercentage = ease(elapsedPercentage, this.gain, this.bias);
        this.value = lerp(this.start, this.end, easedPercentage);
        if (this.onInterpolate) this.onInterpolate(this);
    }
}

// Maps input percentage to output percentage https://arxiv.org/abs/2010.09714
// Visualize: https://www.desmos.com/calculator/t9uwpot2of?lang=en-US
function ease(x, gain, bias, clamp = true)
{
    // Gain received as an easy to use [-1, 1] range
    // which is denormalized into a [0,∞] range to use in the Barron generalization
    const E = 0.0000000001;
    const denormalizedGain = gain <= 0 ?
        (- (pow(- gain, 0.5) / 2) + 0.5) * 2
        : -1 / ((((pow(gain, 0.5) / 2) + 0.5) - 0.5) * 2 - 1 - E);

    let value = x < bias ?
        (bias * x) / (x + denormalizedGain * (bias - x) + E)
        : ((1 - bias) * (x - 1)) / (1 - x - denormalizedGain * (bias - x) + E) + 1;

    return clamp ? constrain(value, 0, 1) : value;
}

// Eases smaller segments where x contained in [start, end], and also a bigger range
function segmentEase(start, end, x, gain, bias) {
    let offset = end - start;
    return start + offset * ease((x - start) / offset, gain, bias);
}