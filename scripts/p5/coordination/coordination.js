// Inspiration: https://cdn.discordapp.com/attachments/746438898615320636/762034798789001226/EhRWE2iU0AEEBZH.jpg
// TODOs
    // Title should go up during (from quadrant position to centered top)
        // https://x.st/javascript-coroutines/
        // https://www.javascripttutorial.net/es-next/javascript-async-await/
        // https://www.javascripttutorial.net/es6/javascript-promises/

// FUTURE TODOs
    // Interpolator timeline

// -------------------------------------------------------------------------------------------------

import {Toggle} from '../modules/Utils.js';
import {Interpolator} from '../modules/Interpolator.js';
import {FSM, StateTransition} from '../modules/FSM.js';

// Services
let interpolator, fsm; // preload
// Parameters
const normalFont = 64;
const smallFont = 32;
const hoveredFontOffset = 4;
const hoveredDarkenMult = 0.9;
const INTERPS = Object.freeze({
    "TITLE_FADE":"TITLE_FADE",
    "Q_ZOOM":"Q_ZOOM",
    "ARROW_FADE":"ARROW_FADE",
    "ARROW_HOVER":"ARROW_HOVER",
});
const STATES = Object.freeze({
    "QuadrantsMenuState":"QuadrantsMenuState",
    "FadeOutQuadrantTitlesState":"FadeOutQuadrantTitlesState",
    "FadeInQuadrantTitlesState":"FadeInQuadrantTitlesState",
    "AuthLeftState":0,
    "AuthRightState":1,
    "LibLeftState":2,
    "LibRightState":3,
});
let quadrants; // preload
let inWindow, halfWindow, quadrantAnchor, fontSize, hoveredFontSize; // onResize
// State
let mode, hoveredMode, lastHoveredMode, titleOpacity;
let goBackArrow;

// -------------------------------------------------------------------------------------------------

function preload() {
    createCanvas(0, 0);

    textFont(loadFont('fonts/raleway/Raleway-Bold.ttf'));

    quadrants = [new Quadrant('Centralized', 0, 0, createVector(255, 183, 186), hoveredDarkenMult),
                new Quadrant('Hierarchical', 1, 0, createVector(120, 219, 251), hoveredDarkenMult),
                new Quadrant('Consensus', 0, 1, createVector(191, 230, 185), hoveredDarkenMult),
                new Quadrant('Emergent', 1, 1, createVector(244, 247, 156), hoveredDarkenMult)];

    titleOpacity = 255;

    interpolator = new Interpolator();

    let stateMap = new Map([[STATES.QuadrantsMenuState, new QuadrantsMenuState()],
        [STATES.FadeOutQuadrantTitlesState, new FadeQuadrantTitlesState(false)],
        [STATES.FadeInQuadrantTitlesState, new FadeQuadrantTitlesState(true)],
        [STATES.AuthLeftState, new QuadrantState(STATES.AuthLeftState, drawAuthLeft)],
        [STATES.AuthRightState, new QuadrantState(STATES.AuthRightState, drawAuthRight)],
        [STATES.LibLeftState, new QuadrantState(STATES.LibLeftState, drawLibLeft)],
        [STATES.LibRightState, new QuadrantState(STATES.LibRightState, drawLibRight, setupLibRight)]]);
    fsm = new FSM(stateMap, stateMap.get(STATES.LibRightState));
    fsm.currentState.onEnter();

    goBackArrow = new GoBackArrow(30, 50);
}

function setup() { onResize(); }
window.addEventListener("resize", onResize);
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y);
    quadrantAnchor = createVector(halfWindow.x, halfWindow.y);
    for (let i = 0; i < quadrants.length; ++i) {
        quadrants[i].computePosAndSize();
        quadrants[i].computeTitlePos();
    }

    const isSmallScreen = inWindow.x < 1000 || inWindow.y < 700;
    fontSize = isSmallScreen ? smallFont : normalFont;
    hoveredFontSize = isSmallScreen ? smallFont + hoveredFontOffset : normalFont + hoveredFontOffset;

    // TODO: remove after
    fsm.currentState.stateSetupLogic();
}

function draw() {
    fsm.update();
    interpolator.update();
}

// -- STATES ---------------------------------------------------------------------------------------

class QuadrantsMenuState {
    onEnter() {
        console.log("QuadrantsMenuState enter");

        cursor(HAND);
        mode = STATES.QuadrantsMenuState;
    }

    onExit() {}

    onUpdate() {
        // Test collision
        let lastFrameHovered = hoveredMode;
        hoveredMode = (mouseX > quadrantAnchor.x ? 1 : 0) + (mouseY > quadrantAnchor.y ? 2 : 0);

        // Set new interpolations on hovered mode change
        if (hoveredMode !== lastFrameHovered) {
            lastHoveredMode = lastFrameHovered;
            interpolator.add(lastHoveredMode, 1, 0, 200, 0.4);
            interpolator.add(hoveredMode, 0, 1, 200, 0.4);
        }

        drawQuadrants();

        // Change state on mouse press
        if (mouseIsPressed) return new StateTransition(STATES.FadeOutQuadrantTitlesState);
    }
}

class FadeQuadrantTitlesState {
    constructor(fadeIn) {
        this.fadeIn = fadeIn;
    }

    onEnter() {
        console.log("FadeQuadrantTitlesState enter");

        if (!this.fadeIn) {
            cursor(ARROW);
            mode = hoveredMode;
            goBackArrow.compute();
            goBackArrow.hoverToggle.on = false;
        }

        const modeOffset = quadrants[mode].offset;
        this.targetAnchor = createVector(modeOffset.x === 0 ? 1 : -1, modeOffset.y === 0 ? 1 : -1);
        this.targetAnchor.mult(halfWindow).add(halfWindow);

        let starts = this.fadeIn ? [0, 1, 255] : [255, 0, 0];
        let ends = this.fadeIn ? [255, 0, 0] : [0, 1, 255];
        let delays = this.fadeIn ? [1400, 200, 0] : [0, 0, 1500];
        this.interpMap = new Map([
            [INTERPS.TITLE_FADE,
                interpolator.add(INTERPS.TITLE_FADE, starts[0], ends[0], 300, 0.5, 0 , delays[0])],
            [INTERPS.Q_ZOOM,
                interpolator.add(INTERPS.Q_ZOOM, starts[1], ends[1], 1500, 0.6, 0.6, delays[1])],
            [INTERPS.ARROW_FADE,
                interpolator.add(INTERPS.ARROW_FADE, starts[2], ends[2], 200, 0, 0, delays[2])]
        ]);

        this.interpMap.get(INTERPS.TITLE_FADE).onInterpolate = (i) => titleOpacity = i.value;
        this.interpMap.get(INTERPS.Q_ZOOM).onInterpolate = (i) => {
            quadrantAnchor.x = lerp(halfWindow.x, this.targetAnchor.x, i.value);
            quadrantAnchor.y = lerp(halfWindow.y, this.targetAnchor.y, i.value);
            for (let i = 0; i < quadrants.length; ++i) quadrants[i].computePosAndSize();
            drawQuadrants();
        }
        this.interpMap.get(INTERPS.ARROW_FADE).onInterpolate = (i) => {
            goBackArrow.opacity = i.value;
            background(quadrants[mode].hoveredColor);
            goBackArrow.draw();
        }
    }

    onExit() {}

    onUpdate() {
        // Transition when every interpolation has finished
        for (let [k, v] of this.interpMap) if (v.isFinished) this.interpMap.delete(k);
        if (this.interpMap.size === 0)
            return new StateTransition(this.fadeIn ? STATES.QuadrantsMenuState : mode);
    }
}

function drawQuadrants() {
    strokeWeight(0.5);
    textAlign(CENTER);

    for (let i = 0; i < quadrants.length; ++i) {
        const isHovered = i === hoveredMode;
        const hoveredPercent = interpolator.has(i) ? interpolator.getValue(i) : null;
        const q = quadrants[i];

        // Quadrant background (pos, dimensions, color)
        stroke(0);
        if (hoveredPercent !== null) fill(lerpColor(q.color, q.hoveredColor, hoveredPercent));
        else isHovered ? fill(q.hoveredColor) : fill(q.color);
        rect(q.pos.x, q.pos.y, q.size.x, q.size.y);

        // Title (pos, font size and color)
        noFill();
        stroke(0, titleOpacity);
        if (hoveredPercent !== null) textSize(lerp(fontSize, hoveredFontSize, hoveredPercent));
        else isHovered ? textSize(hoveredFontSize) : textSize(fontSize);
        isHovered ? fill(0, titleOpacity) : noFill();
        text(q.title, q.titlePos.x, q.titlePos.y);
    }
}

class QuadrantState {
    constructor(state, stateDrawLogic, stateSetupLogic) {
        this.state = state;
        this.stateDrawLogic = stateDrawLogic;
        this.stateSetupLogic = stateSetupLogic;
    }

    onEnter() {
        console.log(this.state + " enter");

        // this.stateSetupLogic();
    }
    onExit() {}
    onUpdate() {
        background(quadrants[this.state].hoveredColor);

        this.stateDrawLogic();

        // goBackArrow.draw();

        // if (goBackArrow.hoverToggle.on && mouseIsPressed)
        //     return new StateTransition(STATES.FadeInQuadrantTitlesState);
    }
}

class GoBackArrow {
    constructor(dimension, offset) {
        // Parameters
        this.dimension = dimension;
        this.offset = offset;
        // State
        this.hoverToggle = new Toggle(() => this.onHoverChange(HAND, 0, 1),
                                      () => this.onHoverChange(ARROW, 1, 0));
        this.opacity = 0;
        this.hoverRotationOffset = 0;
        // maxRotationOffset, denormOffset, arrowOrigin, minV, maxV
    }

    onHoverChange(cursorState, start, end) {
        cursor(cursorState);
        let interp = interpolator.interpolationMap.get(INTERPS.ARROW_HOVER);
        interp = interp ?
            interpolator.add(INTERPS.ARROW_HOVER, interp.value, end, interp.elapsed, 0.7)
            : interpolator.add(INTERPS.ARROW_HOVER, start, end, 200, 0.7);
        interp.onInterpolate = (i) => this.hoverRotationOffset = this.maxRotationOffset * i.value;
    }

    compute() {
        this.maxRotationOffset = HALF_PI * (mode % 3 === 0 ? 0.5 : -0.5);
        this.denormOffset = p5.Vector.mult(quadrants[mode].offset, 2).sub([1, 1]); // [-1, 1]

        let qOrigin = p5.Vector.sub(inWindow, p5.Vector.mult(inWindow, quadrants[mode].offset));
        this.arrowOrigin = p5.Vector.add(qOrigin, p5.Vector.mult(this.denormOffset, this.offset));
        const qOffset = createVector(this.dimension * this.denormOffset.x, this.offset * this.denormOffset.y);
        qOffset.add(this.arrowOrigin);

        // Hoverable rect with qOrigin and qOffset
        this.minV = createVector(min(qOrigin.x, qOffset.x), min(qOrigin.y, qOffset.y));
        this.maxV = createVector(max(qOrigin.x, qOffset.x), max(qOrigin.y, qOffset.y));
    }

    draw() {
        // Test collision
        this.hoverToggle.set(mouseX > this.minV.x && mouseX < this.maxV.x &&
                              mouseY > this.minV.y && mouseY < this.maxV.y);

        if (!interpolator.has(INTERPS.ARROW_HOVER))
            this.hoverRotationOffset = this.hoverToggle.on ? this.maxRotationOffset : 0;

        // Draw
        push();
            noFill();
            strokeWeight(6);
            strokeJoin(ROUND);
            stroke(0, this.opacity);

            translate(this.arrowOrigin.x, this.arrowOrigin.y);
            rotate(PI * (mode % 2) + this.hoverRotationOffset); // Facing direction

            beginShape();
            vertex(0, -this.dimension);
            vertex(this.dimension, 0);
            vertex(0, this.dimension);
            endShape();
        pop();
    }
}

class Quadrant {
    constructor(title, xOffset, yOffset, colorVec, hoveredDarkenMult) {
        this.title = title;
        this.offset = createVector(xOffset, yOffset);
        this.color = color(colorVec.x, colorVec.y, colorVec.z);
        colorVec.mult(hoveredDarkenMult);
        this.hoveredColor = color(colorVec.x, colorVec.y, colorVec.z);
        // & pos size titlePos
    }

    computePosAndSize() {
        this.pos = p5.Vector.mult(quadrantAnchor, this.offset);

        this.size = createVector(
            this.offset.x === 0 ? quadrantAnchor.x : inWindow.x - quadrantAnchor.x,
            this.offset.y === 0 ? quadrantAnchor.y : inWindow.y - quadrantAnchor.y);
        if (this.pos.x > 0 && this.size.x % 1 === 0) this.pos.x -= 0.5;
        if (this.pos.y > 0 && this.size.y % 1 === 0) this.pos.y -= 0.5;
    }

    computeTitlePos() {
        this.titlePos = p5.Vector.mult(quadrantAnchor, 0.5).add(this.pos);
    }
}

// -- QUADRANT LOGIC -------------------------------------------------------------------------------

function drawAuthLeft() { console.log("drawAuthLeft"); }
function drawAuthRight() { console.log("drawAuthRight"); }
function drawLibLeft() { console.log("drawLibLeft"); }

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// -------------------------------------------------------------------------------------------------

// DOT BEHAVIOUR
    // Static type: smooth randomness (target every x seconds with interpolation)
    // Attracted type: moves in the direction

    
class Dot {
    constructor(id, position, diameter) {
        this.id = id;
        this.position = position;
        this.diameter = diameter;
    }

    draw() {
        circle(this.position.x, this.position.y, this.diameter);
    }
}

class Cable {
    constructor(dot1, dot2) {
        this.dot1 = dot1;
        this.dot2 = dot2;
    }

    draw() {
        line(this.dot1.position.x, this.dot1.position.y,
             this.dot2.position.x, this.dot2.position.y);
    }
}

// Parameters
const maxCableDistance = 50;

const dotDiameter = 10;
const nrDots = 50;
const sd = 100;
let containerDim, containerPos;
// State
let dots;
let cables;
let connectionMap;

function setupLibRight() {
    containerDim = createVector(0.8, 0.7).mult(inWindow);
    containerPos = p5.Vector.sub(inWindow, containerDim).mult(0.5);

    // Spawn dots
    dots = [];
    for (let i = 0; i < nrDots; ++i)
        dots.push(new Dot(i, createVector(randomGaussian(halfWindow.x, sd),
                                       randomGaussian(halfWindow.y, sd)), dotDiameter));

    cables = [];
    connectionMap = new Map();
    for (let i = 0; i < nrDots; ++i) {
        for (let j = 0; j < nrDots; ++j) {
            if (i !== j && dots[i].position.dist(dots[j].position) < maxCableDistance) {
                if (!connectionMap.has(i)) connectionMap.set(i, new Set());
                if (!connectionMap.has(j)) connectionMap.set(j, new Set());

                connectionMap.get(i).add(j);
                connectionMap.get(j).add(i);

                if (i < j) cables.push(new Cable(dots[i], dots[j]));
            }
        }
    }

    for (let i = 0; i < cables.length; ++i) console.log(cables[i]);
}
function drawLibRight() {
    // AUX
    // rect(containerPos.x, containerPos.y + 50, containerDim.x, containerDim.y);
    // // Title
    // textSize(fontSize);
    // fill(0);
    // textAlign(CENTER);
    // text('Emergent', inWindow.x * 0.5, containerPos.y * 0.5 + 50);

    fill(0);
    noStroke();
    for (let i = 0; i < nrDots; ++i) dots[i].draw();

    noFill();
    stroke(0);
    strokeWeight(2);
    for (let i = 0; i < cables.length; ++i) cables[i].draw();
}

