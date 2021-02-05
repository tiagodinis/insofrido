// Inspiration: https://cdn.discordapp.com/attachments/746438898615320636/762034798789001226/EhRWE2iU0AEEBZH.jpg
// TODOs
    // Change between 5 modes: QUADRANTS, AUTH_LEFT, AUTH_RIGHT, LIB_LEFT, LIB_RIGHT
        // Quadrant expansion animation
        // Go back button
        // Go back button fade in
        // Text fade in

// -------------------------------------------------------------------------------------------------

// Parameters
const normalFont = 64;
const smallFont = 32;
const hoveredFontOffset = 4;
const hoveredDarkenMult = 0.9;
const hoverTransitionInterval = 200;
const MODES = Object.freeze({"AUTH_LEFT":0, "AUTH_RIGHT":1, "LIB_LEFT":2, "LIB_RIGHT":3, "QUADRANTS":4});
const INTERPS = Object.freeze({"TITLE_FADE_OUT":"TITLE_FADE_OUT"});
const STATES = Object.freeze({"QuadrantsMenuState":0, "FadeOutQuadrantTitlesState":1});
let quadrantMap; // preload
let halfWindow, quadrantAnchor, fontSize, hoveredFontSize; // onResize
// State
let mode, hoveredMode, lastHoveredMode;

// -------------------------------------------------------------------------------------------------

function preload() {
    createCanvas(0, 0);

    textFont(loadFont('fonts/raleway/Raleway-Bold.ttf'));

    interpolator = new Interpolator();

    let stateMap = new Map([
        [STATES.QuadrantsMenuState, new QuadrantsMenuState()],
        [STATES.FadeOutQuadrantTitlesState, new FadeOutQuadrantTitlesState()],
    ]);
    fsm = new FSM(stateMap, stateMap.get(STATES.QuadrantsMenuState));

    quadrantMap = new Map();
    quadrantMap.set(MODES.AUTH_LEFT, new Quadrant('Centralized', 0, 0, createVector(255, 183, 186)));
    quadrantMap.set(MODES.AUTH_RIGHT, new Quadrant('Hierarchical', 1, 0, createVector(120, 219, 251)));
    quadrantMap.set(MODES.LIB_LEFT, new Quadrant('Consensus', 0, 1, createVector(191, 230, 185)));    
    quadrantMap.set(MODES.LIB_RIGHT, new Quadrant('Emergent', 1, 1, createVector(244, 247, 156)));
}

function setup() { onResize(); }

window.addEventListener("resize", onResize);

function onResize() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    halfWindow = createVector(window.innerWidth * 0.5, window.innerHeight * 0.5);
    quadrantAnchor = createVector(halfWindow.x, halfWindow.y);

    const isSmallScreen = window.innerHeight < 700;
    fontSize = isSmallScreen ? smallFont : normalFont;
    hoveredFontSize = isSmallScreen ? smallFont + hoveredFontOffset : normalFont + hoveredFontOffset;
}

function draw() {
    background(255);

    fsm.update();

    interpolator.update();
}

// -- STATES ---------------------------------------------------------------------------------------

class QuadrantsMenuState {
    onEnter() {}
    onExit() { console.log("QuadrantsMenuState exit"); }
    onUpdate() {
        // Test collision
        let lastFrameHovered = hoveredMode;
        hoveredMode = (mouseX > quadrantAnchor.x ? 1 : 0) + (mouseY > quadrantAnchor.y ? 2 : 0);

        // Set new interpolations on hovered mode change
        let justHovered = hoveredMode !== lastFrameHovered;
        if (justHovered) {
            lastHoveredMode = lastFrameHovered;
            interpolator.add(lastHoveredMode, 1, 0, hoverTransitionInterval, 0.4);
            interpolator.add(hoveredMode, 0, 1, hoverTransitionInterval, 0.4);
        }

        drawQuadrants();

        if (mouseIsPressed) {
            mode = hoveredMode;

            return new StateTransition(STATES.FadeOutQuadrantTitlesState);

            // if (mode === MODES.LIB_RIGHT) {
            //     return new StateTransition(STATES.FadeOutQuadrantTitlesState);

            // }
        }
    }
}
let a = 4;
let b = 2;

function testing() {
    console.log(a + b + 100);
}


let titleOpacity = 255;

class FadeOutQuadrantTitlesState {
    onEnter() {
        interpolator.add(INTERPS.TITLE_FADE_OUT, 255, 0, 500, 0.4, 0, 1, false, false,
            () => { return a + b + 100;});

            // interpolator.add(INTERPS.TITLE_FADE_OUT, 255, 0, 500, 0.4)
    }
    onExit() { console.log("FadeOutQuadrantTitlesState exit"); }
    onUpdate() {
        // Fade out title opacity
        if (interpolator.has(INTERPS.TITLE_FADE_OUT))
            titleOpacity = interpolator.getValue(INTERPS.TITLE_FADE_OUT);
        // else if (interpolate.has(INTERPS.QUADRANT_EXPANSION)) {
        //     const expansionPercentage = interpolator.getValue(INTERPS.QUADRANT_EXPANSION);
        //     let newX = lerp()
        //     quadrantAnchor
        // }
            

        drawQuadrants();

        // TODO: Transition if all interpolations have reached the end
    }
}

function drawQuadrants() {
    cursor(HAND);
    textAlign(CENTER);
    for (let [qMode, q] of quadrantMap) {
        const isHovered = qMode === hoveredMode;
        const hoveredPercent = interpolator.has(qMode) ? interpolator.getValue(qMode) : null;

        // Quadrant background (pos, dimensions, color)
        stroke(0);
        let quadrantPos = p5.Vector.mult(quadrantAnchor, q.offset);
        let w = q.offset.x === 0 ? quadrantAnchor.x : window.innerWidth - quadrantAnchor.x;
        let h = q.offset.y === 0 ? quadrantAnchor.y : window.innerHeight - quadrantAnchor.y;
        if (quadrantPos.x > 0 && w % 1 === 0) quadrantPos.x -= 0.5;
        if (quadrantPos.y > 0 && h % 1 === 0) quadrantPos.y -= 0.5;
        if (hoveredPercent !== null) fill(lerpColor(q.color, q.hoveredColor, hoveredPercent));
        else if (isHovered) fill(q.hoveredColor);
        else fill(q.color);
        rect(quadrantPos.x, quadrantPos.y, w, h);

        // Title (pos, font size and color)
        stroke(0, titleOpacity);
        let titlePos = p5.Vector.mult(quadrantAnchor, 0.5).add(quadrantPos);
        if (hoveredPercent !== null) textSize(lerp(fontSize, hoveredFontSize, hoveredPercent));
        else if (isHovered) textSize(hoveredFontSize);
        else textSize(fontSize);
        fill(isHovered ? 0 : q.color, titleOpacity);
        text(q.title, titlePos.x, titlePos.y);
    }
}

class Quadrant { // POD
    constructor(title, xOffset, yOffset, colorVec) {
        this.title = title;
        this.offset = createVector(xOffset, yOffset);
        this.color = color(colorVec.x, colorVec.y, colorVec.z);
        colorVec.mult(hoveredDarkenMult);
        this.hoveredColor = color(colorVec.x, colorVec.y, colorVec.z);
    }
}

// -- INTERPOLATION --------------------------------------------------------------------------------

let interpolator;

class Interpolator {
    constructor() {
        this.interpolationMap = new Map();
    }

    add(key, start, end, interval, gain = 0, bias = 0, iterations = 1,
        reverse = false, alternate = false, callback = null) {
        this.interpolationMap.set(key, new Interpolation(start, end, interval, gain, bias,
            iterations, reverse, alternate, callback));
    }

    has(key) {
        return this.interpolationMap.has(key);
    }

    getValue(key) {
        return this.interpolationMap.get(key).currentValue;
    }

    update() {
        for (let [key, val] of this.interpolationMap) {
            val.tick();
            val.interpolate();
            if (val.isFinished) {
                if (val.callback !== null) {
                    console.log(this.interpolationMap.callback);
                    let calVal = this.interpolationMap.callback;
                    console.log("Value: " + calVal);
                }
                this.interpolationMap.delete(key);
            }
        }
    }
}

class Interpolation {
    constructor(start, end, interval, gain = 0, bias = 0, iterations = 1,
                reverse = false, alternate = false, callback = null) {
        // Parameters
        this.start = start;
        this.end = end;
        this.interval = interval;
        this.gain = gain;
        this.bias = bias;
        this.iterations = iterations; // < 1 for infinite
        this.reverse = reverse;
        this.alternate = alternate;

        // State
        this.isFinished = false;
        this.elapsed = 0;
        this.isReversing = this.reverse;
        this.currentValue = this.start;
        this.callback = callback;
    }

    tick() {
        this.elapsed += deltaTime;
        if (this.elapsed > this.interval) { // Finished iteration?
            if (this.iterations != 1) { // Not the last iteration?
                this.elapsed -= this.interval; // Loop elapsedTime
                if (this.iterations > 1) this.iterations--; // Decrement finite iteration counter
                if (this.alternate) this.isReversing = !this.isReversing;
            }
            else this.isFinished = true;
        }
    }

    interpolate() {
        let elapsedPercentage = constrain(this.elapsed / this.interval, 0, 1);
        if (this.isReversing) elapsedPercentage = 1 - elapsedPercentage;
        const easedPercentage = ease(elapsedPercentage, this.gain, this.bias);
        this.currentValue = lerp(this.start, this.end, easedPercentage);
    }
}

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

// -- FINITE STATE MACHINE -------------------------------------------------------------------------

let fsm;

// (!) onEnter and onUpdate can return state transitions, unlike onExit
// (!) startingState onEnter() must be called manually, if required
class FSM {
    constructor(stateMap, startingState) {
        this.stateMap = stateMap;
        this.currentState = startingState;
    }

    update() {
        this.transition(this.currentState.onUpdate());
    }

    transition(stateTransition) {
        if (stateTransition == null) return; // ---

        // There is a transition. Check for exit actions, transition, check for enter actions
        if (stateTransition.hasExitActions) this.currentState.onExit();
        this.currentState = this.stateMap.get(stateTransition.targetState);
        if (stateTransition.hasEnterActions) this.transition(this.currentState.onEnter());
    }
}

class StateTransition {
    constructor(targetState, hasEnterActions = true, hasExitActions = true) {
        this.targetState = targetState;
        this.hasEnterActions = hasEnterActions;
        this.hasExitActions = hasExitActions;
    }
}
