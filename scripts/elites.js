// Base parameters
const baseNrLayers = 8;
const layerDotInc = 3;
const layerDistance = 10;
const baseDotDiameter = 10;
const layerRadiusInc = layerDistance + baseDotDiameter;
const CATALYSE = 'Catalyse';
const AUDIT = 'Audit';
const MOLT = 'Molt';
const MERGE = 'Merge';
let oX, oY; // (!) Setup
// Base state
let mode;
let queuedMode = CATALYSE;
let nrLayers;
let transitionInterp;
let dotDiameter = baseDotDiameter;
let linearOffset;

// Menu parameters
let font; // (!) Preload
const fontSize = 64;
const hoveredFontSize = 70;
const fontLineHeight = 20;
const queuedFontColor = 240;
let menuStart; // (!) Setup
const buttonList = [ CATALYSE, AUDIT, MOLT, MERGE ];
// Button state
let hoveredButton = CATALYSE;

// Catalyse parameters
const outerLayerNrDots = baseNrLayers * layerDotInc;
const maxCatalyseOffsetInc = 0.003;
let catalyseLoopDistance; // (!) Setup
// Catalyse state
let catalyseOffsetInc = 0;

// Molt parameters
const moltLoopDistance = 1;
const moltNrLayers = baseNrLayers + 1;
const maxMoltOffsetInc = 0.008;
// Molt state
let moltOffsetInc = 0;

// Audit parameters
const amplitude = 6;
const auditOffsetInc = 0.08;
let phaseShift; // (!) Setup
let auditLoopDistance; // (!) Setup
// Audit state

// Merge parameters
const maxMergeOffsetInc = 0.05;
let mergeSwitchDistance; // (!) Setup
let mergeAnimDistance; // (!) Setup
let switchDotDiameter; // (!) Setup
// Merge state
let mergeOffset = 0;
let mergeOffsetInc = 0;

// -------------------------------------------------------------------------------------------------

function preload() {
    font = loadFont('fonts/raleway/Raleway-Bold.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    textFont(font);
    textAlign(CENTER);
    setMode(CATALYSE);

    // Menu
    const menuHeight = buttonList.length * (fontSize + fontLineHeight);
    const halfHeight = windowHeight * 0.5;
    menuStart = halfHeight + (halfHeight - menuHeight) * 0.5;
    // Base
    oX = (windowWidth * 0.5) - dotDiameter * 0.5;
    oY = menuStart * 0.5;
    // Catalyse
    catalyseLoopDistance = HALF_PI / 6;
    // Audit
    phaseShift = PI;
    auditLoopDistance = TWO_PI + phaseShift;
    // Merge
    mergeSwitchDistance = PI * 2.5;
    mergeAnimDistance = PI * 9;
    switchDotDiameter = layerRadiusInc * baseNrLayers * 2 + 2; // (!) Cosmic horrors
    switchDotDiameter -= mergeSwitchDistance * baseNrLayers * 4 + baseDotDiameter; // (!) Forgotten magic
}

function draw() {
    background(255);

    drawMenu();

// Draw dots
    if (mode === MERGE && mergeOffset < mergeSwitchDistance) mergeBeforeSwitch();
    else if (mode === MERGE) mergeAfterSwith();
    else asd();

// Update Interpolations
    for (let [key, val] of interpolationMap) {
        val.tick();
        val.interpolate();
        if (val.isFinished) interpolationMap.delete(key);
    }

// Update transition offsets
    if (transitionInterp) {
        if (transitionInterp.isFinished) {
            transitionInterp = null;
            if (mode !== queuedMode && mode !== MERGE) setMode(queuedMode);
        }
        else if (mode === CATALYSE) catalyseOffsetInc = getInterpValue('transition');
        else if (mode === MOLT) moltOffsetInc = getInterpValue('transition');
        else if (mode === MERGE) mergeOffsetInc = getInterpValue('transition');
    }

// Update offsets
    if (mode === CATALYSE) linearOffset = (linearOffset + catalyseOffsetInc) % catalyseLoopDistance;
    else if (mode === MOLT) linearOffset = (linearOffset + moltOffsetInc) % 1;
    else if (mode === AUDIT) {
        const previous = linearOffset;
        linearOffset = (linearOffset + auditOffsetInc) % auditLoopDistance;
        if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
    }
    else if (mode === MERGE) {
        const previous = linearOffset;
        linearOffset = (linearOffset + mergeOffsetInc) % mergeAnimDistance;
        if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
        else {
            mergeOffset = linearOffset < mergeSwitchDistance ?
            segmentEase(0, mergeSwitchDistance, linearOffset, 0.2, 0)
            : segmentEase(mergeSwitchDistance, mergeAnimDistance, linearOffset, 0.6, 0)
        }
    }
}

// -------------------------------------------------------------------------------------------------

function drawMenu() {
  push();
    translate(windowWidth * 0.5, menuStart);

    // Assume hovering nothing
    cursor(ARROW);
    hoveredButton = '';

    // Buttons
    stroke(0);
    strokeWeight(1);
    textSize(fontSize); // (!) Needed for textWidth calculations
    for (i = 0; i < buttonList.length; ++i) {
        const iButton = buttonList[i];
        const halfWordWidth = textWidth(iButton) * 0.5;
        const xMax = oX + halfWordWidth + 10; // (!) Right side is a bit smaller for some reason
        const xMin = oX - halfWordWidth;
        const yMin = i * (fontSize + fontLineHeight) - fontLineHeight * 0.5 + menuStart;
        const yMax = yMin + fontSize + fontLineHeight;

        // Query hovering and pressing interactions that affect font color and size
        if (mouseX > xMin && mouseX < xMax && mouseY > yMin && mouseY < yMax) { // Is hovering?
            cursor(HAND);
            hoveredButton = iButton;
            if (mouseIsPressed) { // Is pressing?
                if (iButton !== mode && iButton !== queuedMode) { // Can queue a different mode?
                    queuedMode = iButton;
                    interpolationMap.set('queuedFontSize',
                        new Interpolation(hoveredFontSize, fontSize, 500, 0.4, 0, 1, false, true));

                    // Set deceleration interp if one of the available options was pressed
                    if (mode === CATALYSE) setDeceleration(catalyseLoopDistance, maxCatalyseOffsetInc);
                    else if (mode === MOLT) setDeceleration(moltLoopDistance, maxMoltOffsetInc);

                    function setDeceleration(loopDistance, offsetInc) {
                        let distance = loopDistance - linearOffset;
                        const avgSpeed = offsetInc * 0.5; // (!) Assumes linear interp
                        const requiredFrames = ceil((distance / avgSpeed) * (100 / 6));
                        console.log(requiredFrames);
                        transitionInterp = new Interpolation(offsetInc, 0, requiredFrames);
                        interpolationMap.set('transition', transitionInterp);
                    }
                }
            }
        }
        
        // Word color
        if (iButton === mode) fill(0);
        else if (iButton === queuedMode) fill(queuedFontColor);
        else fill(255);

        // Word size
        if (iButton !== mode && iButton === queuedMode && interpolationMap.has('queuedFontSize'))
            textSize(getInterpValue('queuedFontSize'));
        else if (iButton === hoveredButton && iButton !== mode && iButton !== queuedMode)
            textSize(hoveredFontSize);
        else textSize(fontSize);

        text(iButton, 0, yMax - menuStart - fontLineHeight);
    }
  pop();
}

function setMode(newMode) {
    mode = newMode;
    if (mode === CATALYSE) modeReset(catalyseOffsetInc, maxCatalyseOffsetInc);
    else if (mode === AUDIT) modeReset();
    else if (mode === MOLT) {
        nrLayers = moltNrLayers;
        linearOffset = 0.001; // (!) Fix: 0 value same value as loop end (understande later)
        moltOffsetInc = maxMoltOffsetInc;
    }
    else if (mode === MERGE) {
        mergeOffset = 0;
        modeReset(mergeOffsetInc, maxMergeOffsetInc);
    }

    function modeReset(offsetInc, maxOffsetInc) {
        fill(0);
        nrLayers = baseNrLayers;
        linearOffset = 0;
        if (offsetInc !== undefined) {
            offsetInc = 0;
            transitionInterp = new Interpolation(0, maxOffsetInc, 1000);
            interpolationMap.set('transition', transitionInterp);
        }
    }
}

function asd() {
    let currentLDots, layerRadius, layerAngleInc, catalyseAngleOffset; // TODO: state that should be outside
    let dotLifetimePercentage = (linearOffset * layerDotInc) % moltLoopDistance;

    // Layers
    for (let j = 0; j < nrLayers; ++j) {
        if (mode === CATALYSE) {
            baseLayer(j);
            catalyseAngleOffset = linearOffset * (outerLayerNrDots / currentLDots) * (nrLayers - j);
        }
        else if (mode === AUDIT) {
            baseLayer(j);
            const layerOffset = phaseShift + linearOffset - j * 0.35;
            if (layerOffset > phaseShift && layerOffset < auditLoopDistance) {
                layerRadius += sin(layerOffset) * amplitude;
                const layerDotDiameterOffset = 3 + j * 0.5;
                const minDiameter = baseDotDiameter - layerDotDiameterOffset;
                const maxDiameter = baseDotDiameter + layerDotDiameterOffset;
                dotDiameter = map(sin(layerOffset), -1, 1, minDiameter, maxDiameter);
            }
            else dotDiameter = baseDotDiameter;
        }
        else if (mode === MOLT) {
            currentLDots = ceil(layerDotInc * j + linearOffset * layerDotInc);
            layerAngleInc = TWO_PI / (currentLDots - 1 + dotLifetimePercentage);
            layerRadius = layerRadiusInc * j + linearOffset * layerRadiusInc - 5;
        }

        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;

            // Catalyse offsets layer angles
            if (mode === CATALYSE) currentAngleInc += catalyseAngleOffset;

            // Molt changes opacity of last layer and recently created dots
            if (mode === MOLT) {
                if (j === (nrLayers - 1)) fill(0, lerp(255, 0, linearOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, dotLifetimePercentage));
                else fill(0);
            }

            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            circle(x, y, dotDiameter);
        }
    }

    function baseLayer(layerIndex) {
        currentLDots = layerDotInc * (layerIndex + 1);
        layerAngleInc = TWO_PI / currentLDots;
        layerRadius = layerRadiusInc * (layerIndex + 1) - baseDotDiameter * 0.5;
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

let interpolationMap = new Map();

function getInterpValue(key) {
    return interpolationMap.get(key).currentValue;
}

class Interpolation {
    constructor(start, end, interval, gain = 0, bias = 0, iterations = 1,
                reverse = false, alternate = false) {
        // Parameters
        this.start = start;
        this.end = end;
        this.interval = interval;
        this.gain = gain;
        this.bias = bias;
        this.iterations = iterations; // < 1 for infinite
        this.reverse = reverse;
        this.alternate = alternate;

        // State
        this.isFinished = false;
        this.elapsed = 0;
        this.isReversing = this.reverse;
        this.currentValue = this.start;
    }

    tick() {
        this.elapsed += deltaTime;
        if (this.elapsed > this.interval) { // Finished iteration?
            if (this.iterations != 1) { // Not the last iteration?
                this.elapsed -= this.interval; // Loop elapsedTime
                if (this.iterations > 1) this.iterations--; // Decrement finite iteration counter
                if (this.alternate) this.isReversing = !this.isReversing;
            }
            else this.isFinished = true;
        }
    }

    interpolate() {
        let elapsedPercentage = constrain(this.elapsed / this.interval, 0, 1);
        if (this.isReversing) elapsedPercentage = 1 - elapsedPercentage;
        const easedPercentage = ease(elapsedPercentage, this.gain, this.bias);
        this.currentValue = lerp(this.start, this.end, easedPercentage);
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