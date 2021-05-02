let inWindow, halfWindow;

window.addEventListener("resize", onResize);
function setup() { onResize(); }
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);
}

function draw() {
    drawBlurAndColorShiftDemo();
}

// -------------------------------------------------------------------------------------------------

const nrFrames = 100;

// Blur
const extraSamples = 10;
const sampleOffset = 1 / extraSamples; // frameOffset / extraSamples
const subSampleAlpha = 255 / extraSamples;

// Color shift
const colorsCS = ['#FF0000', '#00FF00', '#0000FF'];
const csOffset = 1 / colorsCS.length; // frameOffset / nrColors

function drawBlurAndColorShiftDemo() {
    blendMode(BLEND);
    background(0);
    blendMode(ADD);

    // No effects
    translate(halfWindow.x, halfWindow.y * 0.25);
    fill(255);
    drawElement(frameCount / nrFrames % 1);

    // Blur
    translate(0, halfWindow.y * 0.5);
    fill(255, 255, 255, subSampleAlpha);
    for (let i = 0; i < extraSamples; ++i) {
        drawElement((frameCount - i * sampleOffset) / nrFrames % 1);
    }

    // Color shift
    translate(0, halfWindow.y * 0.5);
    for (let c = 0; c < 3; ++c) {
        fill(colorsCS[c]);
        drawElement((frameCount - c * csOffset) / nrFrames % 1);
    }

    // Blur + Color shift
    translate(0, halfWindow.y * 0.5);
    for (let i = 0; i < extraSamples; ++i) {
        for (let c = 0; c < 3; ++c) {
            let colorc = color(colorsCS[c]);
            colorc.setAlpha(subSampleAlpha);
            fill(colorc);
            drawElement((frameCount - i * sampleOffset - c * csOffset) / nrFrames % 1);
        }
    }
}

function drawElement(t) {
    push();
    translate(inWindow.x * 0.4 * sin(TWO_PI * t), 0);
    ellipse(0,0,100); 
    pop();
}

// (!) TEMP, better ways to solve the module problem
window.setup = setup;
window.draw = draw;