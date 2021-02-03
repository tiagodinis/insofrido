// Parameters
const nrLayers = 8;
const layerDotInc = 3;
const dotDiameter = 10;
const halfDotDiameter = dotDiameter * 0.5;
const layerDistance = 10;
const layerRadiusInc = layerDistance + dotDiameter;
const outerLayerNrDots = nrLayers * layerDotInc;
const offsetInc = 0.00018;
let loopDistance, oX, oY; // (!) Initialized after p5
// State
let currentLDots, layerAngleInc, layerRadius, catalyseAngleOffset, linearOffset;

// -------------------------------------------------------------------------------------------------

window.addEventListener("resize", init);

function init() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    oX = window.innerWidth * 0.5 - halfDotDiameter;
    oY = window.innerHeight * 0.5 - halfDotDiameter;
    linearOffset = 0;
}

function setup() {
    loopDistance = HALF_PI / 6;
    noStroke();
    fill(0);
    init();
}

function draw() {
    background(255);

    // Layers
    for (let j = 0; j < nrLayers; ++j) {
        currentLDots = layerDotInc * (j + 1);
        layerAngleInc = TWO_PI / currentLDots;
        layerRadius = layerRadiusInc * (j + 1) - halfDotDiameter;
        catalyseAngleOffset = linearOffset * (outerLayerNrDots / currentLDots) * (nrLayers - j);

        // Layer dots
        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i + catalyseAngleOffset;
            let x = cos(currentAngleInc) * layerRadius + oX;
            let y = sin(currentAngleInc) * layerRadius + oY;
            circle(x, y, dotDiameter);
        }
    }

    // Update offset
    linearOffset = (linearOffset + deltaTime * offsetInc) % loopDistance;
}