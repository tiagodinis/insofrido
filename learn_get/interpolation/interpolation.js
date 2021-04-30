import {Interpolator} from '../../scripts/modules/Interpolator.js';

// Services
let interpolator;
// Parameters
let inWindow, halfWindow;
let ralewayFont, fontSize;
// State

function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf')
}
window.addEventListener("resize", onResize);
function setup() { 
    textFont(ralewayFont);
    interpolator = new Interpolator();
    onResize();
}
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight * 2);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);

    // const yBigger = inWindow.y > inWindow.x;
    // start = createVector(inWindow.x * 0.04 + smallDim * 0.1, halfWindow.y);
    // end = createVector(halfWindow.x, inWindow.y * 0.04 + smallDim * 0.1);
    // if (yBigger) { const temp = start; start = end; end = temp; } // swap

    const diameter = 50;// inWindow.y * 0.1;
    dummyList = [];
    for (let i = 0, cursor = createVector(diameter, diameter); i < 1; ++i) {
        dummyList.push(new Dummy(cursor.copy(), diameter));
        cursor.y += diameter * 1.5;
    }

    // interpolator.add("linear", 0, 1, 2000).onInterpolate = (i) =>
    //     dummyList[0].pos = p5.Vector.lerp(dummyList[0].start, dummyList[0].end, i.value);
    // interpolator.add("easeIn", 0, 1, 2000, 0.5).onInterpolate = (i) =>
    //     dummyList[1].pos = p5.Vector.lerp(dummyList[1].start, dummyList[1].end, i.value);
    // interpolator.add("easeOut", 0, 1, 2000, -0.5).onInterpolate = (i) =>
    //     dummyList[2].pos = p5.Vector.lerp(dummyList[2].start, dummyList[2].end, i.value);
    // interpolator.add("easeInOutSmooth", 0, 1, 2000, 0.3, 0.5).onInterpolate = (i) =>
    //     dummyList[3].pos = p5.Vector.lerp(dummyList[3].start, dummyList[3].end, i.value);
    // interpolator.add("easeInOutExtreme", 0, 1, 2000, 0.8, 0.5).onInterpolate = (i) =>
    //     dummyList[4].pos = p5.Vector.lerp(dummyList[4].start, dummyList[4].end, i.value);

    fill(0);
}

function draw() {
    interpolator.update();

    background(255, 255, 255, 100);
    for (let i = 0; i < dummyList.length; ++i) dummyList[i].draw();
}

let dummyList;

class Dummy {
    constructor(pos, dim) {
        this.pos = pos;
        this.dim = dim;
        this.start = pos;
        this.end = createVector(inWindow.x - this.dim, pos.y);
    }

    draw() {
        circle(this.pos.x, this.pos.y, this.dim);
    }
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;