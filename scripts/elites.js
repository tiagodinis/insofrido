// TODOS
// [ ] Make everything time instead of frame based
// [ ] Other functions other then lerp to change values (get barron)
// Catalyse
    // [ ] Change some dot colors overtime (must molt to get rid of them)
// Molt
    // BUG: nrLayers and maxOffsetInc interactions, jittery movements especially on first iteration
// [ ] Integrate Catalyse with Molt
    // [x] Catalyse -> Molt
    // [ ] Molt -> Catalyse
// [ ] Audit
// [ ] Title: Elites
// -------------------------------------------------------------------------------------------------

// let time = 0;
let catalyseOffset = 0;
let moltOffset = 0;

// Base parameters
const dotDiameter = 10;
const layerDotInc = 3;
const layerDistance = 10;
const layerRadiusInc = dotDiameter + layerDistance;
let oX, oY; // (!) Const, but must init on setup
let mode; // 1: catalyse 2: molt 3: audit
let queuedMode;
let nrLayers;


// Catalyse
const catalyseNrLayers = 8;
const maxCatalyseOffsetInc = 0.003;
let catalyseOffsetInc = maxCatalyseOffsetInc;
const outerLayerDots = catalyseNrLayers * layerDotInc;
let loopDistance; // (!) Const, but must init on setup

// Molt
const loopInterval = 1;
const moltNrLayers = 9;
const maxMoltOffsetInc = 0.008;
let moltOffsetInc = maxMoltOffsetInc;

// TODO: Audit

let anim = null;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    fill(0);
    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;
    loopDistance = HALF_PI / 6;
    setMode(1);
}

function draw() {
    background(255);

    let moltThirdPercentage = (moltOffset * layerDotInc) % loopInterval;

    let currentLDots, layerRadius, layerAngleInc, catalyseLayerOffset;

    // Layers
    for (let j = 0; j < nrLayers; ++j) {
        if (mode === 1) {
            currentLDots = layerDotInc * (j + 1);
            layerRadius = layerRadiusInc * (j + 1) - 5;
            layerAngleInc = TWO_PI / currentLDots;
            catalyseLayerOffset = catalyseOffset * (outerLayerDots / currentLDots) * (nrLayers - j);
        } else if (mode === 2) {
            currentLDots = ceil(layerDotInc * j + moltOffset * layerDotInc);
            layerRadius = layerRadiusInc * j + moltOffset * layerRadiusInc - 5;
            layerAngleInc = TWO_PI / (currentLDots - 1 + moltThirdPercentage);
        }

        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;
            if (mode === 1) currentAngleInc += catalyseLayerOffset;
            const x = cos(currentAngleInc) * layerRadius + oX;
            const y = sin(currentAngleInc) * layerRadius + oY;

            if (mode === 1) fill(0);
            else if (mode === 2) {
                // Last layer? Last dot? Everything else
                if (j === (nrLayers - 1 )) fill(0, lerp(255, 0, moltOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, moltThirdPercentage));
                else fill(0);
            }

            circle(x, y, dotDiameter);
        }
    }

    // TODO: move this up, no 1 frame lag
    // Animation request
    if (!anim) {
        if (isKeyPressed) {
            if (keyCode === UP_ARROW) { // Request molt mode and decelerate
                queuedMode = 2;
                let distance = loopDistance - (catalyseOffset % loopDistance);
                const avgSpeed = catalyseOffsetInc * 0.5; // (!) Assumes linear interp
                const requiredFrames = ceil(distance / avgSpeed);
                anim = new MyAnimation(catalyseOffsetInc, 0, requiredFrames);
            }
            else if (keyCode === DOWN_ARROW) { // Request catalyse mode and decelerate
                console.log("request");
                queuedMode = 1;
                let distance = 1 - moltOffset;
                const avgSpeed = moltOffsetInc * 0.5; // (!) Assumes linear interp
                const requiredFrames = ceil(distance / avgSpeed);
                anim = new MyAnimation(moltOffsetInc, 0, requiredFrames);
            }
            else if (keyCode === LEFT_ARROW) { // Request audit mode and decelerate
                queuedMode = 3;
                // TODO:
            }
        }
    }

    // Animation update
    if (anim) {
        anim.tElapsed++;

        // TODO: update a variable based on mode
        if (mode === 1) catalyseOffsetInc = anim.getValue();
        else if (mode === 2) moltOffsetInc = anim.getValue();

        if (anim.isDone()) {
            anim = null;
            setMode(queuedMode);
        }
    }

    // Update offsets
    if (mode === 1) catalyseOffset += catalyseOffsetInc;
    else if (mode === 2) {
        moltOffset += moltOffsetInc;
        if (moltOffset > 1) moltOffset--;
    }
    // time += deltaTime;

    console.log(catalyseOffset);
}

function setMode(newMode) {
    mode = newMode;
    if (mode === 1) {
        nrLayers = catalyseNrLayers;
        catalyseOffsetInc = maxCatalyseOffsetInc;
    }
    else if (mode === 2) {
        nrLayers = moltNrLayers;
        moltOffsetInc = maxMoltOffsetInc;
    }
}

class MyAnimation {
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