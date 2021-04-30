import {Interpolator} from '../../scripts/modules/Interpolator.js';
import {FSM, StateTransition} from '../../scripts/modules/FSM.js';

// Services
let fsm, interpolator;
// Parameters
let inWindow, halfWindow; // onResize
let ralewayFont;
// State
let deltaSeconds;


function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf');
}

function setup() {
    interpolator = new Interpolator();
    textFont(ralewayFont);
    onResize();
}
window.addEventListener("resize", onResize);
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);
    deltaSeconds = 0;

    const widthP = constrain(map(inWindow.x, 700, 340, 1, 0), 0, 1);
    titleSize = round(lerp(32, 64, widthP));
    subtitleSize = round(lerp(12, 16, widthP));

    let stateMap = new Map([
        [STATES.Loading, new LoadingState("S L U D G E   I M P E R I U M", startLoad, load, endLoad)],
        [STATES.Idle, new IdleState()]]);
    fsm = new FSM(stateMap, stateMap.get(STATES.Idle));
    fsm.currentState.onEnter();

    initSunTest();
}

let customImg;
let sunTest;

// -- LOAD BEHAVIOUR -------------------------------------------------------------------------------

function startLoad(state) {
    customImg = createGraphics(inWindow.x, inWindow.y);
    const nrPixels = customImg.width * customImg.height;
    const nrChunks = 9;
    const chunkPixels = floor(nrPixels / nrChunks);
    state.chunkPixelTarget = [];
    for (let i = 0, currentIndex = 0; i < nrChunks; ++i) {
        currentIndex += chunkPixels;
        state.chunkPixelTarget[i] = currentIndex;
    }
    state.chunkPixelTarget[nrChunks - 1] += (nrPixels - (chunkPixels * nrChunks));
    state.loaded = 0;
    state.toLoad = nrChunks;
    customImg.loadPixels();
}

function load(state) {
    let p = state.loaded > 0 ? state.chunkPixelTarget[state.loaded - 1] : 0;
    let endP = state.chunkPixelTarget[state.loaded];
    let x = p % customImg.width;
    let y = floor(p / customImg.width);
    p *= 4;
    endP *= 4;

    for (; p < endP; p += 4) {
        let d = 255 - createVector(x, y).dist(halfWindow) * .05;
        
        customImg.pixels[p] =d;
        customImg.pixels[p+1] = d;
        customImg.pixels[p+2] = d;
        customImg.pixels[p+3] = 255;

        if (++x >= customImg.width) { x-= customImg.width; ++y; }
    }
    state.loaded++;
}

function endLoad() { customImg.updatePixels(); }

// -- STATES ---------------------------------------------------------------------------------------
const STATES = Object.freeze({"Loading":"LoadingState", "Idle":"IdleState"});
let titleSize, subtitleSize;

class LoadingState {
    constructor(title, startLoad, load, endLoad) {
        this.title = title;
        this.startLoad = startLoad;
        this.load = load;
        this.endLoad = endLoad;
    }
    onEnter() { this.startLoad(this); }
    onExit() { this.endLoad(); }
    onUpdate() {
        if (this.loaded === this.toLoad) return new StateTransition(STATES.Idle);

        this.load(this);

        push();
        background(255);
        // Title
        fill(0);
        textSize(titleSize);
        text(this.title, halfWindow.x - textWidth(this.title) * 0.52, halfWindow.y - titleSize);
        textSize(titleSize * 0.5);
        // Loading bar
        push();
        const dim = createVector(100, subtitleSize);
        const pos = createVector(halfWindow.x - dim.x * .5, halfWindow.y - titleSize * 0.5);
        rect(pos.x, pos.y, dim.x * (this.loaded / this.toLoad), dim.y);
        noFill();
        rect(pos.x, pos.y, dim.x, dim.y);
        pop();
        pop();
    }
}

class IdleState {
    onEnter() {}
    onExit() {}
    onUpdate() {
        image(sunTest, 0, 0);
    }
}

function initSunTest() {
    sunTest = createGraphics(inWindow.x, inWindow.y);
    sunTest.background(185, 194, 209);
    sunTest.push();
    const sun0Color = color(242, 147, 68, 200);
    // const sun1Color = color(242, 181, 68, 255);
    const sun1Color = color(242, 201, 68, 255);
    const sun2Color = color(210, 148, 156, 160);
    const sun3Color = color(214, 79, 56, 150);
    const smallDim = min(inWindow.x, inWindow.y);

    sunTest.noStroke();
    const sun1 = createVector(inWindow.x * .7, inWindow.y * 0.4);
    const sun2 = createVector(-smallDim * 0.05, smallDim * 0.1).add(sun1);
    const sun3 = createVector(smallDim * 0.1, smallDim * 0.0).add(sun1);
    const sun0 = createVector(smallDim * 0.06, -smallDim * 0.05).add(sun1);



    sunTest.fill(sun1Color);
    sunTest.circle(sun1.x, sun1.y, smallDim * 0.6);
    sunTest.fill(sun2Color);
    sunTest.circle(sun2.x, sun2.y, smallDim * 0.5);
    sunTest.fill(sun0Color);
    sunTest.circle(sun0.x, sun0.y, smallDim * 0.6);
    sunTest.fill(sun3Color);
    sunTest.circle(sun3.x, sun3.y, smallDim * 0.6);




    // sunTest.fill(255, 70);
    // const maxOffset = smallDim * 0.4;
    // for (let i = 0; i < 500; ++i) {
    //     const offset = createVector(random(-1, 1), random(-1, 1)).normalize().mult(random(maxOffset));
    //     sunTest.circle(sun1.x + offset.x, sun1.y + offset.y, smallDim * 0.035);
    // }

    sunTest.pop();

    sunTest.filter(BLUR, 30);
}

// -------------------------------------------------------------------------------------------------

function draw() {
    deltaSeconds = deltaTime / 1000;
    fsm.update();
    interpolator.update();
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// Fuzzy morning: #B9C2D1#F29344#DDA180#D2949C
// Death1 palette: #4F4748#686D77#676C69#6C6261
// Death2 palette: #503946#9895A0#7E798F#9C7C80