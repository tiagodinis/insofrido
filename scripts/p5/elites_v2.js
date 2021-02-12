// TODO
// FSM for general state with plugins for specific
// Preload and resize stuff
    // On resize, dot diameter not proper
// Dimensions with different resolutions
    // Try changing baseNrLayers (only problem on catalyse)

import {Interpolator, segmentEase} from '../p5/modules/Interpolator.js';
import {FSM, StateTransition} from '../p5/modules/FSM.js';

// Services
let interpolator, fsm; // preload
// Base parameters
let baseNrLayers, layerDotInc, layerDistance, baseDotDiameter, layerRadiusInc, oX, oY;
const MODES = Object.freeze({"CATALYSE":"Catalisar", "AUDIT":"Auditar", "MOLT":"Podar","MERGE":"Unir"});
const INTERPS = Object.freeze({"TRANS_ACCEL":"TRANS_ACCEL","TRANS_DECEL":"TRANS_DECEL", "QUEUED_FONT":"QUEUED_FONT"});
// Base state
let mode, queuedMode, nrLayers, dotDiameter, linearOffset, offsetInc;
let currentLDots, layerAngleInc, layerRadius; // Layer data

// Menu parameters
let font, fontSize, hoveredFontSize, fontLineHeight, queuedFontColor, buttonList, menuStart;
// Button state
let hoveredButton;

// Catalyse parameters
let outerLayerNrDots, maxCatalyseOffsetInc, catalyseLoopDistance;
// Catalyse state
let catalyseAngleOffset;

// Molt parameters
let moltLoopDistance, moltNrLayers, maxMoltOffsetInc;
// Molt state
let dotLifetimePercentage;

// Audit parameters
let amplitude, maxAuditOffsetInc, phaseShift, auditLoopDistance;

// Merge parameters
let maxMergeOffsetInc, mergeSwitchDistance, mergeAnimDistance, switchDotDiameter, minXOffset, maxXOffset;
// Merge state
let mergeOffset, layerXOffset, fadeInOpacity, mult;

// -------------------------------------------------------------------------------------------------

// class ModeState {
//     constructor() {

//     }

//     drawDots() {

//     }
// }

function preload() {
    font = loadFont('fonts/raleway/Raleway-Bold.ttf');

    interpolator = new Interpolator();

    // let stateMap = new Map([
    //     [MODES.CATALYSE, new ModeState()],
    // ]);
    // fsm = new FSM(stateMap, stateMap.get(MODES.CATALYSE));
    // fsm.currentState.onEnter();

    createCanvas(0, 0);
}

function setup() { onResize(); }

window.addEventListener("resize", onResize);

function onResize() {
    // Base parameters
    baseNrLayers = 8;
    layerDotInc = 3;
    layerDistance = 10;
    baseDotDiameter = 10;
    layerRadiusInc = layerDistance + baseDotDiameter;
    // Base state
    queuedMode = MODES.CATALYSE;
    dotDiameter = baseDotDiameter;
    // Menu parameters
    const isSmallScreen = window.innerHeight < 700;
    fontSize = isSmallScreen ? 32 : 64;
    hoveredFontSize = isSmallScreen ? 35 : 70;
    fontLineHeight = isSmallScreen ? 20 : 20;
    queuedFontColor = 220;
    buttonList = [ MODES.CATALYSE, MODES.AUDIT, MODES.MOLT, MODES.MERGE ];
    const menuHeight = buttonList.length * (fontSize + fontLineHeight);
    const halfHeight = window.innerHeight * 0.5;
    menuStart = halfHeight + (halfHeight - menuHeight) * (isSmallScreen ? 0.8 : 0.5);
    // Catalyse parameters
    outerLayerNrDots = baseNrLayers * layerDotInc;
    maxCatalyseOffsetInc = 0.00018;
    catalyseLoopDistance = HALF_PI / 6;
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
    setMode(MODES.CATALYSE);
}

function draw() {
    background(255);

    drawMenu();
    drawDots();
    updateOffsets();
    interpolator.update();
}

// -------------------------------------------------------------------------------------------------

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
                    interpolator.add(INTERPS.QUEUED_FONT, hoveredFontSize, fontSize, 500, 0.4, 0, 1, false, true)
                        .onInterpolate = (i) => transitionFontSize = i.value;

                    // Set deceleration interp if one of the available options was pressed
                    if (mode === MODES.CATALYSE) setDeceleration(catalyseLoopDistance, maxCatalyseOffsetInc);
                    else if (mode === MODES.MOLT) setDeceleration(moltLoopDistance, maxMoltOffsetInc);

                    function setDeceleration(loopDistance, maxOffsetInc) {
                        let distance = loopDistance - linearOffset;
                        const avgSpeed = maxOffsetInc * 0.5; // (!) Assumes linear interp
                        const requiredMS = ceil(distance / avgSpeed);

                        let interp = interpolator.add(INTERPS.TRANS_DECEL, maxOffsetInc, 0, requiredMS);
                        interp.onInterpolate = (i) => offsetInc = i.value;
                        interp.onFinish = () => {
                            if (mode !== queuedMode && mode !== MODES.MERGE) setMode(queuedMode); }
                    }
                }
            }
        }
        
        // Word color
        if (iButton === mode) fill(0);
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

// // Layer loop
// // 

function drawDots() {
// Layers
    for (let j = 0; j < nrLayers; ++j) {
        if (mode === MODES.CATALYSE) {
            baseLayer(j);
            // Layer angle offset
            catalyseAngleOffset = linearOffset * (outerLayerNrDots / currentLDots) * (nrLayers - j);
        }
        else if (mode === MODES.AUDIT) {
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
        else if (mode === MODES.MOLT) {
            // Layer dots, angle and radius get filled with 3 extra dots every loop
            currentLDots = ceil(layerDotInc * j + linearOffset * layerDotInc);
            layerAngleInc = TWO_PI / (currentLDots - 1 + dotLifetimePercentage);
            layerRadius = layerRadiusInc * j + linearOffset * layerRadiusInc - 5;
        }
        else if (mode === MODES.MERGE && mergeOffset < mergeSwitchDistance) {
            fill(0);
            baseLayer(j);
            // Layer radius & dot diameter
            layerRadius -= (mergeOffset * 2) + (2.5 * mergeOffset * j);
            dotDiameter = baseDotDiameter + mergeOffset * (j - 1);
        }
        else if (mode === MODES.MERGE) {
            baseLayer(j);
            layerRadius = layerRadiusInc * (j + 1) * mult - 5;
        }

// Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;

            // Offset by layer offset
            if (mode === MODES.CATALYSE) currentAngleInc += catalyseAngleOffset;

            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            // "Kill" outer dots, fade-in "newborn" dots
            if (mode === MODES.MOLT) {
                if (j === (nrLayers - 1)) fill(0, lerp(255, 0, linearOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, dotLifetimePercentage));
                else fill(0);
            }

            // Merge before switch xOffset
            if (mode === MODES.MERGE && mergeOffset < mergeSwitchDistance) x += layerXOffset;
            else if (mode === MODES.MERGE) {
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

function updateOffsets() {
    if (mode === MODES.CATALYSE) {
        linearOffset = (linearOffset + deltaTime * offsetInc) % catalyseLoopDistance;
    }
    else if (mode === MODES.MOLT) {
        linearOffset = (linearOffset + deltaTime * offsetInc) % moltLoopDistance;

        dotLifetimePercentage = (linearOffset * layerDotInc) % moltLoopDistance;
    }
    else if (mode === MODES.AUDIT) {
        const previous = linearOffset;
        linearOffset = (linearOffset + deltaTime * offsetInc) % auditLoopDistance;
        if (linearOffset < previous && mode !== queuedMode) setMode(queuedMode);
    }
    else if (mode === MODES.MERGE) {
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
}

function setMode(newMode) {
    mode = newMode;
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