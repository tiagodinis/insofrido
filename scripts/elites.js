// Base parameters
const baseNrLayers = 8;
const layerDotInc = 3;
const layerDistance = 10;
const baseDotDiameter = 10;
const layerRadiusInc = layerDistance + baseDotDiameter;
let oX, oY; // (!) Init on setup
// Base state
let nrLayers;
let dotDiameter = baseDotDiameter;

// Merge parameters
const mergeOffsetInc = 0.05;
let mergeSwitchDistance; // (!) Init on setup
let mergeAnimDistance; // (!) Init on setup
let switchDotDiameter; // (!) Init on setup
// Merge state
let linearOffset = 0;
let mergeOffset;



// -------------------------------------------------------------------------------------------------

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();

    // REMOVE AFTER INTEGRATION
    nrLayers = baseNrLayers;
    mergeOffset = 0;

    oX = (windowWidth / 2) - baseDotDiameter * 0.5;
    oY = (windowHeight / 2) - baseDotDiameter * 0.5;

    mergeSwitchDistance = PI * 2.5;
    mergeAnimDistance = PI * 9;
    switchDotDiameter = layerRadiusInc * nrLayers * 2 + 2; // (!) forgotten magic
    switchDotDiameter -= mergeSwitchDistance * nrLayers * 4 + baseDotDiameter; // (!) forgotten magic





}

function draw() {
    background(255);

    if (mergeOffset < mergeSwitchDistance) mergeBeforeSwitch();
    else mergeAfterSwith();

// Update offsets
    linearOffset = (linearOffset + mergeOffsetInc) % mergeAnimDistance;

    mergeOffset = linearOffset < mergeSwitchDistance ?
        segmentEase(0, mergeSwitchDistance, linearOffset, 0.2, 0)
        : segmentEase(mergeSwitchDistance, mergeAnimDistance, linearOffset, 0.6, 0)
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