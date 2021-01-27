// TODOS
// Merge
    // [ ] Move to dot position
    // [ ] Other points (start on switch)
// [ ] Change some dot colors overtime (must molt to get rid of them)
// [ ] Make everything time instead of frame based
// [ ] Title: Elites
// [ ] Selection buttons
// [ ] 3 color palettes
// BUG ?? nrLayers and maxOffsetInc interactions, jittery movements especially on first iteration
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
let mergeLoopDistance; // (!) Init on setup
// Merge state
let mergeOffset;

// -------------------------------------------------------------------------------------------------

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    fill(0);
    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;
    catalyseLoopDistance = HALF_PI / 6;
    phaseShift = PI;
    auditLoopDistance = TWO_PI + phaseShift;
    mergeLoopDistance = PI * 4;
    setMode(4);
    queuedMode = 4;

    // TODO: REMOVE AVAILABLE OPTIONS WHEN SELECTION IS DONE ANOTHER WAY
    availableOptions = [DOWN_ARROW, UP_ARROW, LEFT_ARROW];
}

function draw() {
    background(255);

    let TEMPCOLOR;

    let currentLDots, layerRadius, layerAngleInc, catalyseAngleOffset;
    let dotLifetimePercentage = (moltOffset * layerDotInc) % moltLoopDistance;

    // mergeOffset = TWO_PI + HALF_PI;

// Mult circles from 0 pi to 2.5pi
// Single circle from 2.5 pi to 3pi and hold

    // const transitionDiameter = layerRadiusInc * nrLayers * 2 - (TWO_PI + HALF_PI ) * nrLayers * 4 - baseDotDiameter + 2;
    // console.log(transitionDiameter);

    // mergeOffset < TWO_PI + HALF_PI
    if (mode === 4) {
        fill(150);
        const baseSingleDiameter = layerRadiusInc * nrLayers * 2;
        let newDiameter = baseSingleDiameter - mergeOffset * nrLayers * 4 - baseDotDiameter + 2;
        if (newDiameter < baseDotDiameter) newDiameter = baseDotDiameter;

        let extra = constrain(map(mergeOffset, 0, TWO_PI + PI, 0, layerRadiusInc - 5), 0, layerRadiusInc - 5);
        // let extra = layerRadiusInc - 5;
        // extra = 0;

        circle(oX + extra, oY, newDiameter);
    }

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

            const layerOffset = phaseShift + auditOffset + -j * 0.35;
            if (layerOffset > phaseShift && layerOffset < auditLoopDistance) {
                layerRadius += sin(layerOffset) * amplitude;
                const layerDotDiameterOffset = 3 + j * 0.5;
                const minDiameter = baseDotDiameter - layerDotDiameterOffset;
                const maxDiameter = baseDotDiameter + layerDotDiameterOffset;
                dotDiameter = map(sin(layerOffset), -1, 1, minDiameter, maxDiameter);
            }
            else dotDiameter = baseDotDiameter;
        }
        else if (mode === 4) {
            // 1st part, before switch
                if (mergeOffset < TWO_PI + HALF_PI) {
                    fill(0, 255, 0, 255);
                    currentLDots = layerDotInc * (j + 1);
                    layerAngleInc = TWO_PI / currentLDots;
                    layerRadius = layerRadiusInc * (j + 1) - 5;

                    layerRadius -= mergeOffset * 2 * (j + 1);
                    layerRadius -= mergeOffset * j * 0.5;
                    if (layerRadius < 0) layerRadius = 0;

                    dotDiameter = baseDotDiameter + mergeOffset * (j - 1);
                }

            // 2nd part, on switch
                // currentLDots = layerDotInc * (j + 1);
                // layerAngleInc = TWO_PI / currentLDots;
                // layerRadius = layerRadiusInc * (j + 1) - 5;

                // dotDiameter = baseDotDiameter + mergeOffset * TWO_PI;
        }

        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;
            fill(0, 150);

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

            // 1st part, before switch
                if (mode === 4) x += map(mergeOffset, 0, TWO_PI + PI, 0, layerRadiusInc - 5);

            // 2nd part, on switch
                // if (mode === 4) x -= layerRadiusInc * 2;

            circle(x, y, dotDiameter);
        }
    }

// Request new mode
    if (!transitionInterp && isKeyPressed && availableOptions.includes(keyCode)) {
        // Queue requested mode
        if (keyCode === DOWN_ARROW && mode !== 1 && queuedMode !== 1) queuedMode = 1;
        else if (keyCode === UP_ARROW && mode !== 2 && queuedMode !== 2) queuedMode = 2;
        else if (keyCode === LEFT_ARROW && mode !== 3 && queuedMode !== 3) queuedMode = 3;

        // Set deceleration interp if one of the available options was pressed
        if (mode === 1) {
            let distance = catalyseLoopDistance - catalyseOffset;
            const avgSpeed = catalyseOffsetInc * 0.5; // (!) Assumes linear interp
            const requiredFrames = ceil(distance / avgSpeed);
            transitionInterp = new LInterpolator(catalyseOffsetInc, 0, requiredFrames);
        }
        else if (mode === 2) {
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
        if (!mouseIsPressed) mergeOffset += mergeOffsetInc;
        if (mergeOffset > mergeLoopDistance) mergeOffset -= mergeLoopDistance;
    }
}

// -------------------------------------------------------------------------------------------------

function setMode(newMode) {
    mode = newMode;
    if (mode === 1) {
        nrLayers = baseNrLayers;
        catalyseOffset = 0;
        catalyseOffsetInc = 0;
        transitionInterp = new LInterpolator(0, maxCatalyseOffsetInc, 60);
    }
    else if (mode === 2) {
        nrLayers = moltNrLayers;
        moltOffset = 0.001; // (!) Fix: 0 value same value as loop end (understande later)
        moltOffsetInc = maxMoltOffsetInc;
    }
    else if (mode === 3) {
        nrLayers = baseNrLayers;
        auditOffset = 0;
    }
    else if (mode === 4) {
        nrLayers = baseNrLayers;
        mergeOffset = 0;
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