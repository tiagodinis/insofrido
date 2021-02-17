import {Interpolator, segmentEase} from '../modules/Interpolator.js';

// Services
let interpolator = new Interpolator();
// Base parameters
const MODES = Object.freeze({"CATALYSE":"Catalisar", "AUDIT":"Auditar", "MOLT":"Podar","MERGE":"Unir"});
const INTERPS = Object.freeze({"TRANS_ACCEL":"TRANS_ACCEL","TRANS_DECEL":"TRANS_DECEL", "QUEUED_FONT":"QUEUED_FONT", "INTRO_FADE_OUT":"INTRO_FADE_OUT", "INTRO_FADE_IN":"INTRO_FADE_IN", "PSTART_FADE":"PSTART_FADE", "PSTART_FADE_OUT":"PSTART_FADE_OUT",});
const SCREEN = Object.freeze({"NORMAL":"NORMAL", "SMALL_1":"SMALL_1", "SMALL_2":"SMALL_2",});
let baseNrLayers, layerDotInc, layerDistance, baseDotDiameter, layerRadiusInc, oX, oY;
// Base state
let mode, queuedMode, nrLayers, dotDiameter, linearOffset, offsetInc;

// -- SETUP & MAINLOOP -----------------------------------------------------------------------------

function preload() {
    font = loadFont('fonts/raleway/Raleway-Bold.ttf');

    createCanvas(0, 0);
    let interp = interpolator.add(INTERPS.PSTART_FADE, 255, 0, 1000);
    interp.onInterpolate = (i) => pressStartOpacity = i.value;
    interp.iterations = 0;
    interp.alternate = true;
}

function setup() { onResize(); }
window.addEventListener("resize", onResize);

function onResize() {
    // Base parameters
    layerDotInc = 3;
    layerDistance = 10;
    baseDotDiameter = 10;
    layerRadiusInc = layerDistance + baseDotDiameter;
    // Base state
    queuedMode = MODES.CATALYSE;
    dotDiameter = baseDotDiameter;
    // Menu parameters
    const screenSize = window.innerHeight < 630 ? SCREEN.SMALL_2
                     : window.innerHeight < 750 ? SCREEN.SMALL_1
                     : NORMAL;
    fontSize = screenSize === NORMAL ? 64 : 32;
    hoveredFontSize = screenSize === NORMAL ? 70 : 35;
    fontLineHeight = screenSize === NORMAL ? 20 : 15;
    baseNrLayers = screenSize === SCREEN.SMALL_2 ? 6 : 8;
    queuedFontColor = 220;
    buttonList = [ MODES.CATALYSE, MODES.AUDIT, MODES.MOLT, MODES.MERGE ];
    const menuHeight = buttonList.length * (fontSize + fontLineHeight);
    const halfHeight = window.innerHeight * 0.5;
    menuStart = halfHeight + (halfHeight - menuHeight) * (screenSize === NORMAL ? 0.8 : 0.7);
    // Catalyse parameters
    outerLayerNrDots = baseNrLayers * layerDotInc;
    maxCatalyseOffsetInc = 0.00018;
    catalyseLoopDistance = HALF_PI / (baseNrLayers * 0.75);
    // Catalyse state
    offsetInc = 0; // (!) Init required because of modeReset() initial condition
    // Molt parameters
    moltLoopDistance = 1;
    moltNrLayers = baseNrLayers + 1;
    maxMoltOffsetInc = 0.00048;
    // Audit parameters
    amplitude = 6;
    maxAuditOffsetInc = 0.0048;
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

    // Origin coords
    oX = (window.innerWidth * 0.5) - dotDiameter * 0.5;
    oY = menuStart * 0.5;

    resizeCanvas(window.innerWidth, window.innerHeight);
    noStroke();
    textFont(font);
    textAlign(CENTER);
    if (started) setMode(MODES.CATALYSE);
}

function draw() {
    background(255);

    if (started) {
        drawMenu();
        fill(0, introOpacity);
        drawDots();
        currentMode.onUpdateOffset();
    } else drawIntro();

    interpolator.update();
}

let introOpacity = 255;
let pressStartOpacity = 255;
let started = false;
function drawIntro() {
    fill(0, introOpacity);
    cursor(HAND);
    textSize(64);
    text("E L I T E S", window.innerWidth * 0.5, window.innerHeight * 0.4);
    textSize(16);
    fill(0, pressStartOpacity);
    text("Toca para começar", window.innerWidth * 0.5, window.innerHeight * 0.43);

    if (mouseIsPressed) {
        // Fade out title, set mode and fade in the actual thing
        let interp = interpolator.add(INTERPS.INTRO_FADE_OUT, 255, 0, 1000);
        interp.onInterpolate = (i) => introOpacity = i.value;
        interp.onFinish = () => {
            started = true;
            cursor(ARROW);
            fill(0);
            setMode(MODES.CATALYSE);
            let interp = interpolator.add(INTERPS.INTRO_FADE_IN, 0, 255, 1000);
            interp.onInterpolate = (i) => introOpacity = i.value;
        }

        // Fade out pressStart label from its current opacity
        interpolator.delete(INTERPS.PSTART_FADE);
        interpolator.add(INTERPS.PSTART_FADE_OUT, pressStartOpacity, 0, 1000)
            .onInterpolate = (i) => pressStartOpacity = i.value;
    }
}

// -- DRAW MODES -----------------------------------------------------------------------------------

let currentLDots, layerAngleInc, layerRadius, currentAngleInc, x, y;
function drawDots() {
    for (let j = 0; j < nrLayers; ++j) {
        if (currentMode.onLayerLoop) currentMode.onLayerLoop(j);
        for (let i = 0; i < currentLDots; ++i) {
            currentAngleInc = layerAngleInc * i;
            if (currentMode.onDotAngleInc) currentMode.onDotAngleInc();
            x = cos(currentAngleInc) * layerRadius + oX;
            y = sin(currentAngleInc) * layerRadius + oY;
            if (currentMode.onDotPosition) currentMode.onDotPosition(j, i);
            circle(x, y, dotDiameter);
        }
    }
}

// Catalyse parameters, state & logic
let outerLayerNrDots, maxCatalyseOffsetInc, catalyseLoopDistance;
let catalyseAngleOffset;
function catalyseOnLayerLoop(layerIndex) {
    baseLayer(layerIndex);
    // Layer angle offset
    catalyseAngleOffset = linearOffset * (outerLayerNrDots / currentLDots) * (nrLayers - layerIndex);
}
function catalyseOnDotAngleInc() {
    currentAngleInc += catalyseAngleOffset;
}
function catalyseOnUpdate() {
    linearOffset = (linearOffset + deltaTime * offsetInc) % catalyseLoopDistance;
}

// Audit parameters & logic
let amplitude, maxAuditOffsetInc, phaseShift, auditLoopDistance;
function auditOnLayerLoop(layerIndex) {
    baseLayer(layerIndex);
    // Layer dot diameter
    const layerOffset = phaseShift + linearOffset - layerIndex * 0.35;
    if (layerOffset > phaseShift && layerOffset < auditLoopDistance) {
        layerRadius += sin(layerOffset) * amplitude;
        const layerDotDiameterOffset = 3 + layerIndex * 0.5;
        const minDiameter = baseDotDiameter - layerDotDiameterOffset;
        const maxDiameter = baseDotDiameter + layerDotDiameterOffset;
        dotDiameter = map(sin(layerOffset), -1, 1, minDiameter, maxDiameter);
    }
    else dotDiameter = baseDotDiameter;
}
function auditOnUpdate() {
    const previous = linearOffset;
    linearOffset = (linearOffset + deltaTime * offsetInc) % auditLoopDistance;
    if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
}

// Molt parameters, state & logic
let moltLoopDistance, moltNrLayers, maxMoltOffsetInc;
let dotLifetimePercentage;
function moltOnLayerLoop(layerIndex) {
    // Layer dots, angle and radius get filled with 3 extra dots every loop
    currentLDots = ceil(layerDotInc * layerIndex + linearOffset * layerDotInc);
    layerAngleInc = TWO_PI / (currentLDots - 1 + dotLifetimePercentage);
    layerRadius = layerRadiusInc * layerIndex + linearOffset * layerRadiusInc - 5;
}
function moltOnDotPosition(layerIndex, dotIndex) {
    // "Kill" outer dots, fade-in "newborn" dots
    if (layerIndex === (nrLayers - 1)) fill(0, lerp(255, 0, linearOffset));
    else if (dotIndex === currentLDots - 1) fill(0, lerp(0, 255, dotLifetimePercentage));
    else fill(0);
}
function moltOnUpdate() {
    linearOffset = (linearOffset + deltaTime * offsetInc) % moltLoopDistance;
    dotLifetimePercentage = (linearOffset * layerDotInc) % moltLoopDistance;
}

// Merge parameters, state & logic
let maxMergeOffsetInc, mergeSwitchDistance, mergeAnimDistance, switchDotDiameter, minXOffset, maxXOffset;
let mergeOffset, layerXOffset, fadeInOpacity, mult;
function mergeOnLayerLoop(layerIndex) {
    baseLayer(layerIndex);

    if (mergeOffset < mergeSwitchDistance) {
        fill(0);
        // Layer radius & dot diameter
        layerRadius -= (mergeOffset * 2) + (2.5 * mergeOffset * layerIndex);
        dotDiameter = baseDotDiameter + mergeOffset * (layerIndex - 1);
    }
    else layerRadius = layerRadiusInc * (layerIndex + 1) * mult - 5;
}
function mergeOnDotPosition(layerIndex, dotIndex) {
    // Merge before switch xOffset
    if (mergeOffset < mergeSwitchDistance) x += layerXOffset;
    else{
        if (layerIndex === 0 && dotIndex === 0) fill(0);
        else fill(0, fadeInOpacity);
        x += layerXOffset;
    }
}
function mergeOnUpdate() {
    const previous = linearOffset;
    linearOffset = (linearOffset + deltaTime * offsetInc) % mergeAnimDistance;
    if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
    else {
        mergeOffset = linearOffset < mergeSwitchDistance ?
            segmentEase(0, mergeSwitchDistance, linearOffset, 0.2, 0)
            : segmentEase(mergeSwitchDistance, mergeAnimDistance, linearOffset, 0.6, 0);
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

function baseLayer(layerIndex) {
    currentLDots = layerDotInc * (layerIndex + 1);
    layerAngleInc = TWO_PI / currentLDots;
    layerRadius = layerRadiusInc * (layerIndex + 1) - baseDotDiameter * 0.5;
}

class ModeState {
    constructor(onLayerLoop, onDotAngleInc, onDotPosition, onUpdateOffset) {
        this.onLayerLoop = onLayerLoop;
        this.onDotAngleInc = onDotAngleInc;
        this.onDotPosition = onDotPosition;
        this.onUpdateOffset = onUpdateOffset;
    }
}

let currentMode;
let modeMap = new Map([
    [MODES.CATALYSE, new ModeState(catalyseOnLayerLoop, catalyseOnDotAngleInc, null, catalyseOnUpdate)],
    [MODES.AUDIT, new ModeState(auditOnLayerLoop, null, null, auditOnUpdate)],
    [MODES.MOLT, new ModeState(moltOnLayerLoop, null, moltOnDotPosition, moltOnUpdate)],
    [MODES.MERGE, new ModeState(mergeOnLayerLoop, null, mergeOnDotPosition, mergeOnUpdate)]]);

// -- MENU -----------------------------------------------------------------------------------------
// Parameters
let font, fontSize, hoveredFontSize, fontLineHeight, queuedFontColor, buttonList, menuStart;
// State
let hoveredButton;
let transitionFontSize = hoveredFontSize;
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
    for (let i = 0; i < buttonList.length; ++i) {
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

                    transitionFontSize = hoveredFontSize;
                    interpolator.add(INTERPS.QUEUED_FONT,
                        hoveredFontSize, fontSize, 500, 0.4, 0, 1, false, true)
                        .onInterpolate = (i) => transitionFontSize = i.value;

                    // Set deceleration interp if one of the available options was pressed
                    if (mode === MODES.CATALYSE) setDeceleration(catalyseLoopDistance, maxCatalyseOffsetInc);
                    else if (mode === MODES.MOLT) setDeceleration(moltLoopDistance, maxMoltOffsetInc);

                    function setDeceleration(loopDistance, maxOffsetInc) {
                        let distance = loopDistance - linearOffset;
                        const avgSpeed = maxOffsetInc * 0.5; // (!) Assumes linear interp
                        const requiredMS = floor(distance / avgSpeed);

                        let interp = interpolator.add(INTERPS.TRANS_DECEL, maxOffsetInc, 0, requiredMS);
                        interp.onInterpolate = (i) => offsetInc = i.value;
                        interp.onFinish = () => {
                            if (mode !== queuedMode) setMode(queuedMode); }
                    }
                }
            }
        }
        
        // Word color
        stroke(0, introOpacity);
        if (iButton === mode) fill(0, introOpacity);
        else if (iButton === queuedMode) fill(queuedFontColor);
        else fill(255);

        // Word size
        if (iButton !== mode && iButton === queuedMode && interpolator.has(INTERPS.QUEUED_FONT))
            textSize(transitionFontSize);
        else if (iButton === hoveredButton && iButton !== mode && iButton !== queuedMode)
            textSize(hoveredFontSize);
        else textSize(fontSize);

        text(iButton, 0, yMax - menuStart - fontLineHeight);
    }
  pop();
}

function setMode(newMode) {
    mode = newMode;
    currentMode = modeMap.get(mode);
    dotDiameter = baseDotDiameter;
    if (mode === MODES.CATALYSE) modeReset(maxCatalyseOffsetInc);
    else if (mode === MODES.AUDIT) {
        offsetInc = maxAuditOffsetInc;
        modeReset();
    }
    else if (mode === MODES.MOLT) {
        nrLayers = moltNrLayers;
        dotLifetimePercentage = 0;
        linearOffset = 0.00000001; // (!) Fix: 0 value same value as loop end (understand later)
        offsetInc = maxMoltOffsetInc;
    }
    else if (mode === MODES.MERGE) {
        mergeOffset = 0;
        layerXOffset = map(mergeOffset, 0, mergeAnimDistance, minXOffset, maxXOffset);
        modeReset(maxMergeOffsetInc);
    }

    function modeReset(maxOffsetInc) {
        fill(0);
        nrLayers = baseNrLayers;
        linearOffset = 0;
        if (maxOffsetInc !== undefined) {
            offsetInc = 0;
            interpolator.add(INTERPS.TRANS_ACCEL, 0, maxOffsetInc, 1000)
                .onInterpolate = (i) => offsetInc = i.value;
        }
    }
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;