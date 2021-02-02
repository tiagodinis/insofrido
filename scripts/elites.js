// Base parameters
let baseNrLayers, layerDotInc, layerDistance, baseDotDiameter, layerRadiusInc, oX, oY;
let CATALYSE, AUDIT, MOLT, MERGE, TRANSITION, QUEUED_FONT; // No string errors
// Base state
let mode, queuedMode, nrLayers, transitionInterp, dotDiameter, linearOffset;
let currentLDots, layerRadius, layerAngleInc; // Layer data

// Menu parameters
let font, fontSize, hoveredFontSize, fontLineHeight, queuedFontColor, buttonList, menuStart;
// Button state
let hoveredButton;

// Catalyse parameters
let outerLayerNrDots, maxCatalyseOffsetInc, catalyseLoopDistance;
// Catalyse state
let catalyseOffsetInc, catalyseAngleOffset;

// Molt parameters
let moltLoopDistance, moltNrLayers, maxMoltOffsetInc;
// Molt state
let moltOffsetInc, dotLifetimePercentage;

// Audit parameters
let amplitude, auditOffsetInc, phaseShift, auditLoopDistance;

// Merge parameters
let maxMergeOffsetInc, mergeSwitchDistance, mergeAnimDistance, switchDotDiameter, minXOffset, maxXOffset;
// Merge state
let mergeOffset, mergeOffsetInc, layerXOffset, fadeInOpacity, mult;

// -------------------------------------------------------------------------------------------------

function preload() {
    font = loadFont('fonts/raleway/Raleway-Bold.ttf');
    createCanvas(0, 0);
}

function setup() { init(); }

window.addEventListener("resize", init);

function init() {
    // Base parameters
    baseNrLayers = 8;
    layerDotInc = 3;
    layerDistance = 10;
    baseDotDiameter = 10;
    layerRadiusInc = layerDistance + baseDotDiameter;
    CATALYSE = 'Catalyse';
    AUDIT = 'Audit';
    MOLT = 'Molt';
    MERGE = 'Merge';
    TRANSITION = 'transition';
    QUEUED_FONT = 'queuedFontSize';
    // Base state
    queuedMode = CATALYSE;
    dotDiameter = baseDotDiameter;
    // Menu parameters
    const isSmallScreen = window.innerHeight < 700;
    fontSize = isSmallScreen ? 32 : 64;
    hoveredFontSize = isSmallScreen ? 35 : 70;
    fontLineHeight = isSmallScreen ? 20 : 20;
    queuedFontColor = 220;
    buttonList = [ CATALYSE, AUDIT, MOLT, MERGE ];
    const menuHeight = buttonList.length * (fontSize + fontLineHeight);
    const halfHeight = window.innerHeight * 0.5;
    menuStart = halfHeight + (halfHeight - menuHeight) * (isSmallScreen ? 0.8 : 0.5);
    // Catalyse parameters
    outerLayerNrDots = baseNrLayers * layerDotInc;
    maxCatalyseOffsetInc = 0.00018;
    catalyseLoopDistance = HALF_PI / 6;
    // Catalyse state
    catalyseOffsetInc = 0; // (!) Init required because of modeReset() initial condition
    // Molt parameters
    moltLoopDistance = 1;
    moltNrLayers = baseNrLayers + 1;
    maxMoltOffsetInc = 0.00048;
    // Audit parameters
    amplitude = 6;
    auditOffsetInc = 0.0048;
    phaseShift = PI;
    auditLoopDistance = TWO_PI + phaseShift;
    // Merge parameters
    maxMergeOffsetInc = 0.003;
    mergeSwitchDistance = PI * 2.5;
    mergeAnimDistance = PI * 9;
    switchDotDiameter = layerRadiusInc * baseNrLayers * 2 + 2; // (!) Forgotten magic
    switchDotDiameter -= mergeSwitchDistance * baseNrLayers * 4 + baseDotDiameter; // (!) Forgotten magic
    minXOffset = 0;
    maxXOffset = layerDistance + baseDotDiameter * 0.5;
    // Merge state
    mergeOffsetInc = 0; // (!) Init required because of modeReset() initial condition

    // Origin coords
    oX = (window.innerWidth * 0.5) - dotDiameter * 0.5;
    oY = menuStart * 0.5;

    resizeCanvas(window.innerWidth, window.innerHeight);
    noStroke();
    textFont(font);
    textAlign(CENTER);
    setMode(CATALYSE);
}

function draw() {
    background(255);

    drawMenu();
    drawDots();
    updateInterpolations();
    updateTransitionOffsetIncs();
    updateOffsets();
}

// -------------------------------------------------------------------------------------------------

function drawMenu() {
  push();
    translate(window.innerWidth * 0.5, menuStart);

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
                    interpolationMap.set(QUEUED_FONT,
                        new Interpolation(hoveredFontSize, fontSize, 500, 0.4, 0, 1, false, true));

                    // Set deceleration interp if one of the available options was pressed
                    if (mode === CATALYSE) setDeceleration(catalyseLoopDistance, maxCatalyseOffsetInc);
                    else if (mode === MOLT) setDeceleration(moltLoopDistance, maxMoltOffsetInc);

                    function setDeceleration(loopDistance, offsetInc) {
                        let distance = loopDistance - linearOffset;
                        const avgSpeed = offsetInc * 0.5; // (!) Assumes linear interp
                        const requiredMS = ceil(distance / avgSpeed);
                        transitionInterp = new Interpolation(offsetInc, 0, requiredMS);
                        interpolationMap.set(TRANSITION, transitionInterp);
                    }
                }
            }
        }
        
        // Word color
        if (iButton === mode) fill(0);
        else if (iButton === queuedMode) fill(queuedFontColor);
        else fill(255);

        // Word size
        if (iButton !== mode && iButton === queuedMode && interpolationMap.has(QUEUED_FONT))
            textSize(getInterpValue(QUEUED_FONT));
        else if (iButton === hoveredButton && iButton !== mode && iButton !== queuedMode)
            textSize(hoveredFontSize);
        else textSize(fontSize);

        text(iButton, 0, yMax - menuStart - fontLineHeight);
    }
  pop();
}

function drawDots() {
// Layers
    for (let j = 0; j < nrLayers; ++j) {
        if (mode === CATALYSE) {
            baseLayer(j);
            // Layer angle offset
            catalyseAngleOffset = linearOffset * (outerLayerNrDots / currentLDots) * (nrLayers - j);
        }
        else if (mode === AUDIT) {
            baseLayer(j);
            // Layer dot diameter
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
            // Layer dots, angle and radius get filled with 3 extra dots every loop
            currentLDots = ceil(layerDotInc * j + linearOffset * layerDotInc);
            layerAngleInc = TWO_PI / (currentLDots - 1 + dotLifetimePercentage);
            layerRadius = layerRadiusInc * j + linearOffset * layerRadiusInc - 5;
        }
        else if (mode === MERGE && mergeOffset < mergeSwitchDistance) {
            fill(0);
            baseLayer(j);
            // Layer radius & dot diameter
            layerRadius -= (mergeOffset * 2) + (2.5 * mergeOffset * j);
            dotDiameter = baseDotDiameter + mergeOffset * (j - 1);
        }
        else if (mode === MERGE) {
            baseLayer(j);
            layerRadius = layerRadiusInc * (j + 1) * mult - 5;
        }

// Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;

            // Offset by layer offset
            if (mode === CATALYSE) currentAngleInc += catalyseAngleOffset;

            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            // "Kill" outer dots, fade-in "newborn" dots
            if (mode === MOLT) {
                if (j === (nrLayers - 1)) fill(0, lerp(255, 0, linearOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, dotLifetimePercentage));
                else fill(0);
            }

            // Merge before switch xOffset
            if (mode === MERGE && mergeOffset < mergeSwitchDistance) x += layerXOffset;
            else if (mode === MERGE) {
                if (j === 0 && i === 0) fill(0);
                else fill(0, fadeInOpacity);
                x += layerXOffset;
            }

            circle(x, y, dotDiameter);
        }
    }

    function baseLayer(layerIndex) {
        currentLDots = layerDotInc * (layerIndex + 1);
        layerAngleInc = TWO_PI / currentLDots;
        layerRadius = layerRadiusInc * (layerIndex + 1) - baseDotDiameter * 0.5;
    }
}

function updateInterpolations() {
    for (let [key, val] of interpolationMap) {
        val.tick();
        val.interpolate();
        if (val.isFinished) interpolationMap.delete(key);
    }
}

function updateTransitionOffsetIncs() {
    if (transitionInterp) {
        if (transitionInterp.isFinished) {
            transitionInterp = null;
            if (mode !== queuedMode && mode !== MERGE) setMode(queuedMode);
        }
        else if (mode === CATALYSE) catalyseOffsetInc = getInterpValue(TRANSITION);
        else if (mode === MOLT) moltOffsetInc = getInterpValue(TRANSITION);
        else if (mode === MERGE) mergeOffsetInc = getInterpValue(TRANSITION);
    }
}

function updateOffsets() {
    if (mode === CATALYSE) {
        linearOffset = (linearOffset + deltaTime * catalyseOffsetInc) % catalyseLoopDistance;
    }
    else if (mode === MOLT) {
        linearOffset = (linearOffset + deltaTime * moltOffsetInc) % moltLoopDistance;

        dotLifetimePercentage = (linearOffset * layerDotInc) % moltLoopDistance;
    }
    else if (mode === AUDIT) {
        const previous = linearOffset;
        linearOffset = (linearOffset + deltaTime * auditOffsetInc) % auditLoopDistance;
        if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
    }
    else if (mode === MERGE) {
        const previous = linearOffset;
        linearOffset = (linearOffset + deltaTime * mergeOffsetInc) % mergeAnimDistance;
        if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
        else {
            mergeOffset = linearOffset < mergeSwitchDistance ?
            segmentEase(0, mergeSwitchDistance, linearOffset, 0.2, 0)
            : segmentEase(mergeSwitchDistance, mergeAnimDistance, linearOffset, 0.6, 0)
        }

        fadeInOpacity = map(mergeOffset, mergeSwitchDistance, mergeAnimDistance, 0, 255);
        mult = constrain(map(mergeOffset, 0, mergeAnimDistance, 32.1, 1), 1, 32.1); // (!) Forgotten magic

        if (mergeOffset > mergeSwitchDistance) {
            layerXOffset = -map(mergeOffset, 0, mergeAnimDistance, maxXOffset, minXOffset);
            layerXOffset -= layerRadiusInc * (mult - 1);
            dotDiameter = map(mergeOffset, mergeSwitchDistance, mergeAnimDistance,
                                           switchDotDiameter, baseDotDiameter);
        }
        else layerXOffset = map(mergeOffset, 0, mergeAnimDistance, minXOffset, maxXOffset);
    }
}

function setMode(newMode) {
    mode = newMode;
    if (mode === CATALYSE) modeReset(catalyseOffsetInc, maxCatalyseOffsetInc);
    else if (mode === AUDIT) modeReset();
    else if (mode === MOLT) {
        nrLayers = moltNrLayers;
        dotLifetimePercentage = 0;
        linearOffset = maxMoltOffsetInc; // (!) Fix: 0 value same value as loop end (understand later)
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
            interpolationMap.set(TRANSITION, transitionInterp);
        }
    }
}

// -- UTILS ----------------------------------------------------------------------------------------

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