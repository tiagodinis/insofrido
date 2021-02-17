import {Interpolator} from '../../scripts/modules/Interpolator.js';
import {Shaker, Shake} from '../../scripts/modules/Shaker.js';

// Services
let interpolator, shaker;
// Parameters
let inWindow, halfWindow; // onResize
let font;
// State
let cam;

let CAM_SHAKE = 'camShake';

function preload() {
    font = loadFont('../../fonts/raleway/Raleway-Bold.ttf');
    interpolator = new Interpolator();
    shaker = new Shaker();
}

function setup() { onResize(); }
window.addEventListener("resize", onResize);
function onResize() {
    textFont(font);
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y);
    cam = new Camera2D(halfWindow);
}


function draw() {
    background(255);

    if (mouseIsPressed && !shaker.has(CAM_SHAKE)) {
        let shake = new Shake(CAM_SHAKE, 15, 60, 1000);
        const startPos = createVector(cam.pos.x, cam.pos.y);
        shake.onCompute = (s) => cam.pos = p5.Vector.add(startPos, s.value);
        shaker.add(shake, interpolator);
    }

    interpolator.update();
    shaker.update();
    cam.draw();

    push();
    fill(0);
    noStroke();
    circle(0, 0, 100);
    circle(200, 200, 100);
    circle(-200, 200, 100);
    pop();
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// -- UTILS ----------------------------------------------------------------------------------------

class Camera2D {
    constructor(pos) {
        this.pos = createVector(pos.x, pos.y);
    }

    draw() {
        translate(this.pos.x, this.pos.y);
    }
}