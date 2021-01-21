const dotDiameter = 10;
const nrLayers = 8;
const layerDotInc = 3;
const outerLayerDots = layerDotInc * nrLayers;
const layerDistance = 10;
const maxOffsetInc = 0.001;
const layerRadiusInc = dotDiameter + layerDistance;

let oX, oY, x, y, layerDots, nextLayerDots, layerRadius, layerAngleInc, layerOffset, currentAngleInc;
let offset = 0;
let offsetInc = maxOffsetInc;

let tStart, tElapsed, tPercent;
let tEnd = offsetInc;
let tInterval = 60;
let previousHolding = false;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    fill(0);
    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;
}

function draw() {
    background(255);

    x = 0;
    y = 0;
    nextLayerDots = layerDotInc;
    layerRadius = -5; // A bit closer together on first layer

    for (let j = 0; j < nrLayers; ++j) {
        layerDots = nextLayerDots;
        nextLayerDots += layerDotInc;
        layerRadius += layerRadiusInc;
        layerAngleInc = TWO_PI / layerDots;

        layerOffset = offset * (outerLayerDots / layerDots) * (nrLayers - j);

        for (let i = 0; i < layerDots; ++i) {
            currentAngleInc = layerAngleInc * i + layerOffset;
            x = cos(currentAngleInc) * layerRadius + oX;
            y = sin(currentAngleInc) * layerRadius + oY;
            circle(x, y, dotDiameter);
        }
    }

    {// Mouse holding interaction
        let holding = mouseIsPressed;
        if (holding !== previousHolding)
        {
            tElapsed = 0;
            tStart = offsetInc;
            tEnd = holding ? -maxOffsetInc : maxOffsetInc;
            tInterval = tInterval;
            previousHolding = holding;
        }
    
        tElapsed++;
    
        if (offsetInc != tEnd) {
            tPercent = tElapsed / tInterval;
            offsetInc = lerp(tStart, tEnd, tPercent);
        }
    }

    offset += offsetInc;
}