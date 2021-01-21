// TODOS
// [ ] Title: Elites
// [x] Catalyse
// [ ] Molt
    // [ ] Press to molt 1 layer
    // [ ] Other functions other then lerp to change values (get barron)
    // BUG: nrLayers and maxOffsetInc, jittery movements especially on first iteration
// [ ] Audit
// [ ] Integrate Catalyse with Audit

const dotDiameter = 10;
const nrLayers = 9;
const layerDotInc = 3;
const layerDistance = 10;
const maxOffsetInc = 0.008;
const layerRadiusInc = dotDiameter + layerDistance;

const loopInterval = 1;
let oX, oY, x, y;
let offset = 1;
let offsetInc = maxOffsetInc;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    oX = (windowWidth / 2) - dotDiameter * 0.5;
    oY = (windowHeight / 2) - dotDiameter * 0.5;
}

function draw() {
    background(255);

    // if (!mouseIsPressed)
    //     offset += offsetInc;
    
    // if (offset > 1) offset -= 1;

    // Single dot transition percentage
    // let percentage = (offset * layerDotInc) % loopInterval;
    let percentage = 1;

    for (let j = 0; j < nrLayers; ++j) {
        // Previous layer dots + current layer dots
        let currentLDots = ceil(layerDotInc * j + offset * layerDotInc);
        // Previous layer radius + current layer radius
        let layerRadius = layerRadiusInc * j + offset * layerRadiusInc - 5;
        // Divide circle where last dot might not yet have finished its destination
        let layerAngleInc = TWO_PI / (currentLDots - 1 + percentage);

        for (let i = 0; i < currentLDots; ++i) {
            let currentAngleInc = layerAngleInc * i;
            x = cos(currentAngleInc) * layerRadius + oX;
            y = sin(currentAngleInc) * layerRadius + oY;
            // Last layer?
            if (j === (nrLayers - 1 )) fill(0, lerp(255, 0, offset));
            // Last dot?
            else if (i === currentLDots - 1) fill(0, lerp(0, 255, percentage));
            else fill(0);

            circle(x, y, dotDiameter);
        }
    }
}