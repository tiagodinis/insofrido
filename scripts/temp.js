let time = 0;
let catalyseOffset = 0;
let moltOffset = 0;

// Base parameters
const dotDiameter = 10;
let nrLayers = 8;
const layerDotInc = 3;
const layerDistance = 10;
const layerRadiusInc = dotDiameter + layerDistance;
let oX, oY; // (!) Const, but must init on setup
let mode = 1; // 1: catalyse 2: molt 3: audit
let queuedMode;

// Catalyse
const maxCatalyseOffsetInc = 0.001;
// const maxCatalyseOffsetInc = 0.003;
let catalyseOffsetInc = maxCatalyseOffsetInc;
const outerLayerDots = nrLayers * layerDotInc;

// Molt
const loopInterval = 1;
const maxMoltOffsetInc = 0.008;
let moltOffsetInc = maxMoltOffsetInc;


// Audit

let anim = null;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    fill(0);
    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;
}

function draw() {
    background(255);

    // How much time for nrLayer inner loops? TWO_PI
    // How much time for one inner loop? TWO_PI / nrLayers
    // How many loops? floor(catalyseOffset / (TWO_PI / nrLayers))
    // How much remaining time for nrLayer inner loops?
    // TWO_PI - catalyseOffset

    //
    let moltThirdPercentage = (moltOffset * layerDotInc) % loopInterval;

    let currentLDots;
    let layerRadius;
    let layerAngleInc;
    let catalyseLayerOffset;

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
            catalyseLayerOffset = catalyseOffset;
        }

        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;
            if (mode === 1) currentAngleInc += catalyseLayerOffset;
            else if (mode === 2) currentAngleInc += TWO_PI / 3;
            const x = cos(currentAngleInc) * layerRadius + oX;
            const y = sin(currentAngleInc) * layerRadius + oY;

            if (mode === 2) {
                // Last layer? Last dot? Everything else
                if (j === (nrLayers - 1 )) fill(0, lerp(255, 0, moltOffset));
                else if (i === currentLDots - 1) fill(0, lerp(0, 255, moltThirdPercentage));
                else fill(0);
            }

            circle(x, y, dotDiameter);
        }
    }


    // Animation
    // TODO: move this up, no 1 frame lag
    if (!anim && isKeyPressed && keyCode === UP_ARROW) // c: 67, m: 77, a: 65
    {
        // Set molt process and start decelerating
        queuedMode = 2;
        anim = new MyAnimation(catalyseOffsetInc, 0, 120, lerp);
    }
    // else if (isKeyPressed && keyCode === DOWN_ARROW)
    // {
    //     // TODO: start audit offset
    //     // TODO: decelerate
    // }

    // Animation update
    if (anim) {
        anim.tElapsed++;

        // TODO: update a variable based on mode
        catalyseOffsetInc = anim.getValue();

        if (anim.isDone()) {
            anim = null;
            mode = queuedMode;
            if (mode === 2) nrLayers = 9;
        }
    }

    if (!mouseIsPressed && mode === 1) {
        catalyseOffset += catalyseOffsetInc;
        if (catalyseOffset > HALF_PI) catalyseOffset -= HALF_PI;
        console.log(catalyseOffset);

    }
    else if (mode === 2) {
        moltOffset += moltOffsetInc;
        if (moltOffset > 1) moltOffset--;
    }
    time += deltaTime;

    // console.log("catalyse: " + catalyseOffset + " molt: " + moltOffset);
}

class MyAnimation {
    constructor(tStart, tEnd, tInterval) {
        this.tStart = tStart;
        this.tEnd = tEnd;
        this.tInterval = tInterval;
        this.tElapsed = 0;
    }

    getValue() {
        const percentage = constrain(this.tElapsed / this.tInterval, 0, 1);
        return lerp(this.tStart, this.tEnd, percentage);
    }

    isDone() {
        return this.tElapsed > this.tInterval;
    }
}

    // {// Mouse holding interaction
    //     let holding = mouseIsPressed;
    //     if (holding !== previousHolding)
    //     {
    //         tElapsed = 0;
    //         tStart = catalyseOffsetInc;
    //         tEnd = holding ? 0 : maxCatalyseOffsetInc;
    //         tInterval = tInterval;
    //         previousHolding = holding;
    //     }
    
    //     tElapsed++;
    
    //     if (catalyseOffsetInc != tEnd) {
    //         tPercent = tElapsed / tInterval;
    //         catalyseOffsetInc = lerp(tStart, tEnd, tPercent);
    //     }
    // }