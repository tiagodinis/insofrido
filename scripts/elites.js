// GOAL: like this (https://twitter.com/concinnus/status/1338831202527141894) but alternating

const dotInc = 3;
const maxAnimInc = 0.001;
const dotDiameter = 10;
const nrLayers = 15;
let topLayerDots = dotInc * nrLayers;
const layerDistance = 10;
const layerRadiusInc = dotDiameter + layerDistance;

let anim, animInc;
let oX, oY, x, y, nrDots, nextNrDots, layerRadius, inc, layerAnim, currentInc;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    anim = 0;
    animInc = maxAnimInc;
    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;
    fill(0);

    tEnd = maxAnimInc;
}

let previousHolding = false;
let tInterval = 60;
let tStart, tEnd, tElapsed, tPercent;

function draw() {
    background(225);

    x = 0;
    y = 0;
    nrDots = dotInc;
    nextNrDots = nrDots + dotInc;
    layerRadius = 15;
    inc = TWO_PI / nrDots;
    for (let j = 0; j < nrLayers; ++j) {
        layerAnim = anim * (topLayerDots / nrDots) * (nrLayers - j);
        // if (j > 0) layerAnim = 0;
        // layerAnim = 0;

        for (let i = 0; i < nrDots; ++i) {
            currentInc = inc * i + layerAnim;
            x = cos(currentInc) * layerRadius + oX;
            y = sin(currentInc) * layerRadius + oY;
            circle(x, y, dotDiameter);
        }

        nrDots = nextNrDots;
        nextNrDots += dotInc;
        layerRadius += layerRadiusInc;
        inc = TWO_PI / nrDots;
    }

    let holding = keyIsPressed && keyCode === DOWN_ARROW;
    if (holding && !previousHolding)
    {
        tElapsed = 0;
        tStart = maxAnimInc;
        tEnd = -maxAnimInc;
        previousHolding = holding;
        console.log("1");
    }
    else if (!holding && previousHolding) {
        tElapsed = 0;
        tStart = -maxAnimInc;
        tEnd = maxAnimInc;

        // animInc

        previousHolding = holding;
        console.log("2");
    }

    tElapsed++;

    if (animInc != tEnd) {
        tPercent = tElapsed / tInterval;
        animInc = lerp(tStart, tEnd, tPercent);
    }

    anim += animInc;
}

// function draw() {
//     background(225);

//     x = 0;
//     y = 0;
//     nrDots = dotInc;
//     nextNrDots = nrDots + dotInc;
//     layerRadius = 15;
//     inc = TWO_PI / nrDots;
//     for (let j = 0; j < nrLayers; ++j) {
//         layerAnim = anim * (topLayerDots / nrDots) * (nrLayers - j);

//         for (let i = 0; i < nrDots; ++i) {
//             currentInc = inc * i + layerAnim;
//             x = cos(currentInc) * layerRadius + oX;
//             y = sin(currentInc) * layerRadius + oY;
//             circle(x, y, dotDiameter);
//         }

//         nrDots = nextNrDots;
//         nextNrDots += dotInc;
//         layerRadius += layerRadiusInc;
//         inc = TWO_PI / nrDots;
//     }

//     if (!(keyIsPressed && keyCode === DOWN_ARROW))
//         anim += animInc;
// }