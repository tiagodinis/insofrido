// TODOS
// [ ] Merge transition animations (in & out)
// [ ] Make everything time instead of frame based
// [ ] Title: Elites
// [ ] Selection buttons
// [ ] 3 color palettes
// [ ] Change some dot colors overtime (must molt to get rid of them)
// -------------------------------------------------------------------------------------------------

// Base parameters
const baseNrLayers = 8;
const layerDotInc = 3;
const layerDistance = 10;
const baseDotDiameter = 10;
const layerRadiusInc = layerDistance + baseDotDiameter;
let oX, oY; // (!) Init on setup
// TODO: REMOVE AVAILABLE OPTIONS WHEN SELECTION IS DONE ANOTHER WAY
let availableOptions; // (!) Init on setup
// Base state
let mode; // 1: catalyse 2: molt 3: audit
let queuedMode; // 1: catalyse 2: molt 3: audit
let nrLayers;
let transitionInterp;
let dotDiameter = baseDotDiameter;

// Catalyse parameters
const outerLayerNrDots = baseNrLayers * layerDotInc;
const maxCatalyseOffsetInc = 0.003;
let catalyseLoopDistance; // (!) Init on setup
// Catalyse state
let catalyseOffsetInc;
let catalyseOffset;

// Molt parameters
const moltLoopDistance = 1;
const moltNrLayers = baseNrLayers + 1;
const maxMoltOffsetInc = 0.008;
// Molt state
let moltOffsetInc;
let moltOffset;

// Audit parameters
const amplitude = 6;
const auditOffsetInc = 0.08;
let phaseShift; // (!) Init on setup
let auditLoopDistance; // (!) Init on setup
// Audit state
let auditOffset;

// Merge parameters
const mergeOffsetInc = 0.05;
let mergeSwitchDistance; // (!) Init on setup
let mergeAnimDistance; // (!) Init on setup
let switchDotDiameter; // (!) Init on setup
// Merge state
let linearOffset;
let mergeOffset;

// -------------------------------------------------------------------------------------------------

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();

    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;

    catalyseLoopDistance = HALF_PI / 6;

    phaseShift = PI;
    auditLoopDistance = TWO_PI + phaseShift;

    mergeSwitchDistance = PI * 2.5;
    mergeAnimDistance = PI * 9;
    switchDotDiameter = layerRadiusInc * baseNrLayers * 2 + 2; // (!) forgotten magic
    switchDotDiameter -= mergeSwitchDistance * baseNrLayers * 4 + baseDotDiameter; // (!) forgotten magic

    setMode(1);
    queuedMode = 1;

    // TODO: REMOVE AVAILABLE OPTIONS WHEN SELECTION IS DONE ANOTHER WAY
    availableOptions = [LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW];
}

function draw() {
    background(255);

    let currentLDots, layerRadius, layerAngleInc, catalyseAngleOffset;
    let dotLifetimePercentage = (moltOffset * layerDotInc) % moltLoopDistance;

    if (mode === 4 && mergeOffset < mergeSwitchDistance) mergeBeforeSwitch();
    else if (mode === 4) mergeAfterSwith();
    else

    // Layers
    for (let j = 0; j < nrLayers; ++j) {
        if (mode === 1) {
            currentLDots = layerDotInc * (j + 1);
            layerAngleInc = TWO_PI / currentLDots;
            layerRadius = layerRadiusInc * (j + 1) - 5;

            catalyseAngleOffset = catalyseOffset * (outerLayerNrDots / currentLDots) * (nrLayers - j);
        }
        else if (mode === 2) {
            currentLDots = ceil(layerDotInc * j + moltOffset * layerDotInc);
            layerAngleInc = TWO_PI / (currentLDots - 1 + dotLifetimePercentage);
            layerRadius = layerRadiusInc * j + moltOffset * layerRadiusInc - 5;
        }
        else if (mode === 3) {
            currentLDots = layerDotInc * (j + 1);
            layerAngleInc = TWO_PI / currentLDots;
            layerRadius = layerRadiusInc * (j + 1) - 5;

            const layerOffset = phaseShift + auditOffset - j * 0.35;
            if (layerOffset > phaseShift && layerOffset < auditLoopDistance) {
                layerRadius += sin(layerOffset) * amplitude;
                const layerDotDiameterOffset = 3 + j * 0.5;
                const minDiameter = baseDotDiameter - layerDotDiameterOffset;
                const maxDiameter = baseDotDiameter + layerDotDiameterOffset;
                dotDiameter = map(sin(layerOffset), -1, 1, minDiameter, maxDiameter);
            }
            else dotDiameter = baseDotDiameter;
        }

        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;

            // Catalyse offsets layer angles
            if (mode === 1) currentAngleInc += catalyseAngleOffset;

            // Molt changes opacity of last layer and recently created dots
            if (mode === 2) {
                if (j === (nrLayers - 1 )) fill(0, lerp(255, 0, moltOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, dotLifetimePercentage));
                else fill(0);
            }

            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            circle(x, y, dotDiameter);
        }
    }

// Request new mode
    if (!transitionInterp && isKeyPressed && availableOptions.includes(keyCode)) {
        // Queue requested mode
        if (keyCode === RIGHT_ARROW && mode !== 1 && queuedMode !== 1) queuedMode = 1;
        else if (keyCode === LEFT_ARROW && mode !== 2 && queuedMode !== 2) queuedMode = 2;
        else if (keyCode === UP_ARROW && mode !== 3 && queuedMode !== 3) queuedMode = 3;
        else if (keyCode === DOWN_ARROW && mode !== 4 && queuedMode !== 4) queuedMode = 4;

        // Set deceleration interp if one of the available options was pressed
        if (mode === 1 && queuedMode !== mode) {
            let distance = catalyseLoopDistance - catalyseOffset;
            const avgSpeed = catalyseOffsetInc * 0.5; // (!) Assumes linear interp
            const requiredFrames = ceil(distance / avgSpeed);
            transitionInterp = new LInterpolator(catalyseOffsetInc, 0, requiredFrames);
        }
        else if (mode === 2 && queuedMode !== mode) {
            let distance = moltLoopDistance - moltOffset;
            const avgSpeed = moltOffsetInc * 0.5; // (!) Assumes linear interp
            const requiredFrames = ceil(distance / avgSpeed);
            transitionInterp = new LInterpolator(moltOffsetInc, 0, requiredFrames);
        }
    }

// Update transition interpolation
    if (transitionInterp) {
        transitionInterp.tElapsed++;

        if (mode === 1) catalyseOffsetInc = transitionInterp.getValue();
        else if (mode === 2) moltOffsetInc = transitionInterp.getValue();

        if (transitionInterp.isDone()) {
            transitionInterp = null;
            if (mode !== queuedMode) setMode(queuedMode);
        }
    }

// Update offsets
    if (mode === 1) {
        catalyseOffset += catalyseOffsetInc;
        if (catalyseOffset > catalyseLoopDistance) catalyseOffset -= catalyseLoopDistance;
    }
    else if (mode === 2) {
        moltOffset += moltOffsetInc;
        if (moltOffset > 1) moltOffset--;
    }
    else if (mode === 3) {
        auditOffset += auditOffsetInc;
        if (auditOffset > auditLoopDistance) {
            auditOffset -= auditLoopDistance;
            // (!) Audit is an exception, transitions after pulse loop without interp
            if (mode !== queuedMode) setMode(queuedMode);
        }
    }
    else if (mode === 4) {
        // TODO: can this be reused?
        linearOffset += mergeOffsetInc;

        if (linearOffset > mergeAnimDistance) {
            linearOffset -= mergeAnimDistance;
            // (!) Merge is an exception, transitions afte loop without interp
            if (mode !== queuedMode) setMode(queuedMode);
        }
        else {
            mergeOffset = linearOffset < mergeSwitchDistance ?
            segmentEase(0, mergeSwitchDistance, linearOffset, 0.2, 0)
            : segmentEase(mergeSwitchDistance, mergeAnimDistance, linearOffset, 0.6, 0)
        }
    }
}

// -------------------------------------------------------------------------------------------------

function setMode(newMode) {
    mode = newMode;
    if (mode === 1) {
        fill(0);
        nrLayers = baseNrLayers;
        catalyseOffset = 0;
        catalyseOffsetInc = 0;
        transitionInterp = new LInterpolator(0, maxCatalyseOffsetInc, 60);
        console.log("S: catalyse");
    }
    else if (mode === 2) {
        nrLayers = moltNrLayers;
        moltOffset = 0.001; // (!) Fix: 0 value same value as loop end (understande later)
        moltOffsetInc = maxMoltOffsetInc;
        console.log("S: molt");
    }
    else if (mode === 3) {
        fill(0);
        nrLayers = baseNrLayers;
        auditOffset = 0;
        console.log("S: audit");
    }
    else if (mode === 4) {
        nrLayers = baseNrLayers;
        linearOffset = 0;
        mergeOffset = 0;
        console.log("S: merge");
    }
}

class LInterpolator {
    constructor(tStart, tEnd, tInterval) {
        this.tStart = tStart;
        this.tEnd = tEnd;
        this.tInterval = tInterval;
        this.tElapsed = 0;
    }

    getValue() {
        const elapsedPercentage = constrain(this.tElapsed / this.tInterval, 0, 1);
        return lerp(this.tStart, this.tEnd, elapsedPercentage);
    }

    isDone() {
        return this.tElapsed > this.tInterval;
    }
}

function mergeBeforeSwitch() {
    fill(0);
    for (let j = 0; j < nrLayers; ++j) {
        let currentLDots = layerDotInc * (j + 1);
        let layerAngleInc = TWO_PI / currentLDots;
        let layerRadius = layerRadiusInc * (j + 1) - 5 - (mergeOffset * 2) - (2.5 * mergeOffset * j);

        // Diameter
        dotDiameter = baseDotDiameter + mergeOffset * (j - 1);

        // Dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;
            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            // xOffset
            let min = 0;
            let max = layerRadiusInc - 5;
            x += constrain(map(mergeOffset, 0, mergeAnimDistance, min, max), min, max);

            circle(x, y, dotDiameter);
        }
    }
}

function mergeAfterSwith() {
    let fadeInOpacity = map(mergeOffset, mergeSwitchDistance, mergeAnimDistance, 0, 255);
    let mult = constrain(map(mergeOffset, 0, mergeAnimDistance, 32.1, 1), 1, 32.1); // (!) forgotten magic

    // Diameter
    dotDiameter = map(mergeOffset, mergeSwitchDistance, mergeAnimDistance, switchDotDiameter, baseDotDiameter);

    for (let j = 0; j < nrLayers; ++j) {
        let currentLDots = layerDotInc * (j + 1);
        let layerAngleInc = TWO_PI / currentLDots;
        let layerRadius = layerRadiusInc * (j + 1) * mult - 5;

        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;
            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            // xOffset
            let min = 0;
            let max = layerRadiusInc - 5;
            x -= constrain(map(mergeOffset, 0, mergeAnimDistance, max, min), min, max);
            x -= layerRadiusInc * (mult - 1);

            // Opacity
            if (j === 0 && i === 0) fill(0);
            else fill(0, fadeInOpacity);

            circle(x, y, dotDiameter);
        }
    }
}

// -- NOTES ----------------------------------------------------------------------------------------

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