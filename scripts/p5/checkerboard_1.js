import {FSM, StateTransition} from '../../scripts/modules/FSM.js'
import {ease} from '../../scripts/modules/Interpolator.js'

let inWindow, halfWindow;
let fsm = new FSM();
const STATES = Object.freeze({"Split":"SplitState", "Fade":"FadeState"});

window.addEventListener("resize", onResize);
function setup() { onResize(); }
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);

    // Parameters
    const dimP = constrain(map(min(inWindow.x, inWindow.y), 960, 340, 1, 0), 0, 1);
    smallDim = round(lerp(20, 40, dimP));
    bigDim = 2 * smallDim;
    doubleBigDim = 2 * bigDim;
    nrRow = ceil(inWindow.y / (doubleBigDim));
    nrCol = ceil(inWindow.x / (doubleBigDim)) + 2;
    // State
    color1 = 255;
    color2 = 0;
    offset = -bigDim;

    let stateMap = new Map([[STATES.Split, new SplitState()], [STATES.Fade, new FadeState()]]);
    fsm = new FSM(stateMap, stateMap.get(STATES.Split));
    fsm.currentState.onEnter();

    noStroke();
}

let smallDim, bigDim, doubleBigDim, nrRow, nrCol;
let color1, color2, offset;

class SplitState {
    onEnter() {
        this.nrFrames = 60;
        this.counter = 0;
        fill(color2);
    }
    onExit() {}
    onUpdate() {
        const p = ease(this.counter / this.nrFrames, 0.5, 0.5);

        background(color1);
        translate(offset, 0);
    
        for (let r = 0; r < nrRow; ++r) {
            push();
            for (let c = 0; c < nrCol; ++c) {
                const dimX = constrain(p * bigDim, smallDim, bigDim);
                rect(constrain(smallDim - p * bigDim, -smallDim, 0), 0, dimX, bigDim);
                rect(smallDim, constrain(p * doubleBigDim, 0, bigDim), dimX, bigDim);
                translate(doubleBigDim, 0);
            }
            pop();
            translate(0, doubleBigDim);
        }

        if (++this.counter === this.nrFrames) return new StateTransition(STATES.Fade);
    }
}

class FadeState {
    onEnter() {
        this.nrFrames = 60;
        this.counter = 0;
        fill(color1);
    }
    onExit() {
        [color1, color2] = [color2, color1];
        offset += smallDim;
        if (offset === bigDim) offset = -bigDim;
    }
    onUpdate() {
        const p = ease(this.counter / this.nrFrames, -0.3, 0.35);

        background(color2);
        translate(offset, 0);
    
        for (let r = 0; r < 2 * nrRow; ++r) {
            push();
            translate((r % 2) * bigDim - 3 * smallDim, 0);
            for (let c = 0; c < nrCol; ++c) {
                if (r % 2 === 0) rect(0, 0, bigDim, bigDim);
                else {
                    push();
                    translate(smallDim, smallDim);
                    rotate(p * PI);
                    const tl = p * smallDim - smallDim;
                    const dim = bigDim - p * bigDim;
                    rect(tl, tl, dim, dim);
                    pop();
                }
                translate(doubleBigDim, 0);
            }
            pop();
            translate(0, bigDim);
        }

        if (++this.counter === this.nrFrames) return new StateTransition(STATES.Split);
    }
}

function draw() { fsm.update(); }

// (!) TEMP, better ways to solve the module problem
window.setup = setup;
window.draw = draw;