import {Interpolator} from '../../scripts/modules/Interpolator.js';

// Services
let interpolator;
// Parameters
let inWindow, halfWindow, fontSize; // onResize
let ralewayFont;
// State

function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf')
    interpolator = new Interpolator();
}

function setup() { 
    textFont(ralewayFont);
    onResize();
}
window.addEventListener("resize", onResize);
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);
}

function draw() {
    background(255);
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;