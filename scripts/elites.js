// TODOS
// [ ] Selection buttons
    // [ ] Ease arrow with hovering or selecting
    // [ ] Arrow jittering around when selection is final
    // [ ] Quick text color fade in and fade out when actually transitioning
// [ ] Test with different screen compositions
// -------------------------------------------------------------------------------------------------

// Base parameters
const baseNrLayers = 8;
const layerDotInc = 3;
const layerDistance = 10;
const baseDotDiameter = 10;
const layerRadiusInc = layerDistance + baseDotDiameter;
let oX, oY; // (!) Init on setup
// Base state
let mode;
let queuedMode;
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
const maxMergeOffsetInc = 0.05;
let mergeSwitchDistance; // (!) Init on setup
let mergeAnimDistance; // (!) Init on setup
let switchDotDiameter; // (!) Init on setup
// Merge state
let linearOffset;
let mergeOffset;
let mergeOffsetInc;

// Menu
let font; // (!) Init on preload
const fontSize = 64;
const fontLineHeight = 20;
const arrowDimension = 20;
const arrowStrokeWeight = 4;
const rectW = 300;
const rectH = 300;

let CATALYSE = 'Catalyse';
let AUDIT = 'Audit';
let MOLT = 'Molt';
let MERGE = 'Merge';
let wordList = [CATALYSE, AUDIT, MOLT, MERGE];

const arrowOffset = 40;
const menuHeight = wordList.length * (fontSize + fontLineHeight);
let menuWidth; // (!) Init on setup
let halfHeight; // (!) Init on setup
let menuStart; // (!) Init on setup
let halfUpper; // (!) Init on setup

let hoveredIndex;

// -------------------------------------------------------------------------------------------------

function drawButtons() {
    push();
        // push(); // Aux gizmos
        //     stroke(0);
        //     strokeWeight(1);
        //     noFill();
        //     line(0, halfHeight, windowWidth, halfHeight);
        //     line(0, menuStart, windowWidth, menuStart);
        //     line(0, halfUpper, windowWidth, halfUpper);
            
        //     translate(windowWidth * 0.5 - menuWidth * 0.5, menuStart);
            
        //     rect(0, 0, menuWidth, menuHeight);
        // pop();

        translate(windowWidth * 0.5 - menuWidth * 0.5, menuStart);

        let modeIndex = wordList.indexOf(mode);
        let queuedModeIndex = wordList.indexOf(queuedMode);

        // Buttons style
        noFill();
        stroke(0);
        strokeWeight(1);
        // Buttons
        cursor(ARROW);
        for (i = 0; i < wordList.length; ++i) {
            // Collision detection
            let yMin = i * (fontSize + fontLineHeight) - 10;
            let yMax = (i + 1) * (fontSize + fontLineHeight) - 10;
            // line(0, yMin, menuWidth, yMin);
            // line(0, yMax, menuWidth, yMax);

            // Query hoveredIndex and change cursor if hovering
            if (mouseY > yMin + menuStart && mouseY < yMax + menuStart) {
                cursor(HAND);
                hoveredIndex = i;
                if (!transitionInterp && mouseIsPressed) {
                    if (i !== modeIndex && i !== queuedModeIndex) {
                        queuedMode = wordList[i];
                        queuedModeIndex = i;
                    }

                    // Set deceleration interp if one of the available options was pressed
                    if (mode === CATALYSE && queuedMode !== mode) {
                        let distance = catalyseLoopDistance - catalyseOffset;
                        const avgSpeed = maxCatalyseOffsetInc * 0.5; // (!) Assumes linear interp
                        const requiredFrames = ceil(distance / avgSpeed);
                        transitionInterp = new LInterpolator(maxCatalyseOffsetInc, 0, requiredFrames);
                    }
                    else if (mode === MOLT && queuedMode !== mode) {
                        let distance = moltLoopDistance - moltOffset;
                        const avgSpeed = maxMoltOffsetInc * 0.5; // (!) Assumes linear interp
                        const requiredFrames = ceil(distance / avgSpeed);
                        transitionInterp = new LInterpolator(maxMoltOffsetInc, 0, requiredFrames);
                    }
                }
            }
            
            // Draw words (fill the one corresponding to the selected one)
            if (i === modeIndex) fill(0);
            else noFill();
            text(wordList[i], arrowOffset, yMax - fontLineHeight);
        }

        // Arrow style change
        noFill();
        strokeWeight(arrowStrokeWeight);
        strokeJoin(ROUND);
        // stroke(255, 0, 0);
        // Arrow
        beginShape();
        let hasRequested = queuedMode !== mode;
        let arrowIndex = hasRequested ? queuedModeIndex : hoveredIndex;
        vertex(0, arrowIndex * (fontSize + fontLineHeight) + 10);
        vertex(arrowDimension, arrowIndex * (fontSize + fontLineHeight) + arrowDimension + 10);
        vertex(0, arrowIndex * (fontSize + fontLineHeight) + arrowDimension * 2 + 10);
        endShape();
    pop();
}

function preload() {
    font = loadFont('fonts/raleway/Raleway-Bold.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    textFont(font);
    textSize(fontSize);

    catalyseLoopDistance = HALF_PI / 6;

    phaseShift = PI;
    auditLoopDistance = TWO_PI + phaseShift;

    mergeSwitchDistance = PI * 2.5;
    mergeAnimDistance = PI * 9;
    switchDotDiameter = layerRadiusInc * baseNrLayers * 2 + 2; // (!) forgotten magic
    switchDotDiameter -= mergeSwitchDistance * baseNrLayers * 4 + baseDotDiameter; // (!) forgotten magic

    setMode(CATALYSE);
    queuedMode = CATALYSE;

    // TODO: REMOVE AVAILABLE OPTIONS WHEN SELECTION IS DONE ANOTHER WAY
    // availableOptions = [LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW];

    menuWidth = 0;
    for (i = 0; i < wordList.length; ++i)
        if (menuWidth < textWidth(wordList[i])) menuWidth = textWidth(wordList[i]);
    menuWidth += arrowOffset;
    halfHeight = windowHeight * 0.5;
    menuStart = halfHeight + (halfHeight - menuHeight) * 0.5;
    halfUpper = menuStart * 0.5;

    oX = (windowWidth * 0.5) - dotDiameter * 0.5;
    oY = halfUpper;

    hoveredIndex = 0;
}

function draw() {
    background(255);

    let currentLDots, layerRadius, layerAngleInc, catalyseAngleOffset;
    let dotLifetimePercentage = (moltOffset * layerDotInc) % moltLoopDistance;

    if (mode === MERGE && mergeOffset < mergeSwitchDistance) mergeBeforeSwitch();
    else if (mode === MERGE) mergeAfterSwith();
    else

    // Layers
    for (let j = 0; j < nrLayers; ++j) {
        if (mode === CATALYSE) {
            currentLDots = layerDotInc * (j + 1);
            layerAngleInc = TWO_PI / currentLDots;
            layerRadius = layerRadiusInc * (j + 1) - 5;

            catalyseAngleOffset = catalyseOffset * (outerLayerNrDots / currentLDots) * (nrLayers - j);
        }
        else if (mode === AUDIT) {
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
        else if (mode === MOLT) {
            currentLDots = ceil(layerDotInc * j + moltOffset * layerDotInc);
            layerAngleInc = TWO_PI / (currentLDots - 1 + dotLifetimePercentage);
            layerRadius = layerRadiusInc * j + moltOffset * layerRadiusInc - 5;
        }


        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;

            // Catalyse offsets layer angles
            if (mode === CATALYSE) currentAngleInc += catalyseAngleOffset;

            // Molt changes opacity of last layer and recently created dots
            if (mode === MOLT) {
                if (j === (nrLayers - 1 )) fill(0, lerp(255, 0, moltOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, dotLifetimePercentage));
                else fill(0);
            }

            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;

            circle(x, y, dotDiameter);
        }
    }

    drawButtons();

// // Request new mode
//     if (!transitionInterp && isKeyPressed && availableOptions.includes(keyCode)) {
//         // Queue requested mode
//         if (keyCode === RIGHT_ARROW && mode !== CATALYSE && queuedMode !== CATALYSE) queuedMode = CATALYSE;
//         else if (keyCode === UP_ARROW && mode !== AUDIT && queuedMode !== AUDIT) queuedMode = AUDIT;
//         else if (keyCode === LEFT_ARROW && mode !== MOLT && queuedMode !== MOLT) queuedMode = MOLT;
//         else if (keyCode === DOWN_ARROW && mode !== MERGE && queuedMode !== MERGE) queuedMode = MERGE;

//         // Set deceleration interp if one of the available options was pressed
//         if (mode === CATALYSE && queuedMode !== mode) {
//             let distance = catalyseLoopDistance - catalyseOffset;
//             const avgSpeed = maxCatalyseOffsetInc * 0.5; // (!) Assumes linear interp
//             const requiredFrames = ceil(distance / avgSpeed);
//             transitionInterp = new LInterpolator(maxCatalyseOffsetInc, 0, requiredFrames);
//         }
//         else if (mode === MOLT && queuedMode !== mode) {
//             let distance = moltLoopDistance - moltOffset;
//             const avgSpeed = maxMoltOffsetInc * 0.5; // (!) Assumes linear interp
//             const requiredFrames = ceil(distance / avgSpeed);
//             transitionInterp = new LInterpolator(maxMoltOffsetInc, 0, requiredFrames);
//         }
//     }

// Update transition interpolation
    if (transitionInterp) {
        transitionInterp.tElapsed++;

        if (mode === CATALYSE) catalyseOffsetInc = transitionInterp.getValue();
        else if (mode === MOLT) moltOffsetInc = transitionInterp.getValue();
        else if (mode === MERGE) mergeOffsetInc = transitionInterp.getValue();

        if (transitionInterp.isDone()) {
            transitionInterp = null;
            if (mode !== queuedMode) setMode(queuedMode);
        }
    }

// Update offsets
    if (mode === CATALYSE) {
        catalyseOffset += catalyseOffsetInc;
        if (catalyseOffset > catalyseLoopDistance) catalyseOffset -= catalyseLoopDistance;
    }
    else if (mode === AUDIT) {
        auditOffset += auditOffsetInc;
        if (auditOffset > auditLoopDistance) {
            auditOffset -= auditLoopDistance;
            // (!) Audit is an exception, transitions after pulse loop without interp
            if (mode !== queuedMode) setMode(queuedMode);
        }
    }
    else if (mode === MOLT) {
        moltOffset += moltOffsetInc;
        if (moltOffset > 1) moltOffset--;
    }
    else if (mode === MERGE) {
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
    if (mode === CATALYSE) {
        fill(0);
        nrLayers = baseNrLayers;
        catalyseOffset = 0;
        catalyseOffsetInc = 0;
        transitionInterp = new LInterpolator(0, maxCatalyseOffsetInc, 60);
        console.log("S: catalyse");
    }
    else if (mode === AUDIT) {
        fill(0);
        nrLayers = baseNrLayers;
        auditOffset = 0;
        console.log("S: audit");
    }
    else if (mode === MOLT) {
        nrLayers = moltNrLayers;
        moltOffset = 0.001; // (!) Fix: 0 value same value as loop end (understande later)
        moltOffsetInc = maxMoltOffsetInc;
        console.log("S: molt");
    }
    else if (mode === MERGE) {
        nrLayers = baseNrLayers;
        linearOffset = 0;
        mergeOffset = 0;
        mergeOffsetInc = 0;
        transitionInterp = new LInterpolator(0, maxMergeOffsetInc, 60);
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