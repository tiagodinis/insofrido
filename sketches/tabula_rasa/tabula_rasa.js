import {Interpolator} from '../../scripts/modules/Interpolator.js';
import {Shaker, Shake} from '../../scripts/modules/Shaker.js';
import {FSM, StateTransition} from '../../scripts/modules/FSM.js';

// Services
let fsm, interpolator, shaker;
// Parameters
let inWindow, halfWindow; // onResize
let ralewayFont;
const STATES = Object.freeze({
    "Loading":"LoadingState",
    "Title":"TitleState",
    "Idle":"IdleState",
    "Drag":"DragState",
    "Magnet":"MagnetState",
});

// State
let camPos;
let deltaSeconds;
// -------------------------------------------------------------------------------------------------

function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf');

    interpolator = new Interpolator();
    shaker = new Shaker();

    let stateMap = new Map([
        [STATES.Loading, new LoadingState()],
        [STATES.Title, new TitleState("T Á B U L A   R A S A", "Toca para começar")],
        [STATES.Idle, new IdleState()],
        [STATES.Drag, new DragState()],
        [STATES.Magnet, new MagnetState()],
    ]);
    // fsm = new FSM(stateMap, stateMap.get(STATES.Title));
    fsm = new FSM(stateMap, stateMap.get(STATES.Loading));
}

function setup() { 
    textFont(ralewayFont);
    onResize();

    fsm.currentState.onEnter();
}
window.addEventListener("resize", onResize);
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);
    camPos = createVector(0, 0);
    deltaSeconds = 0;
    fadeCanvas = createGraphics(inWindow.x, inWindow.y);
    fadeCanvas.background(255, 0);

// CONTROLLER ON RESIZE
    // Parameters
    cActiveColor = color(0, 255, 0);
    cMagnetColor = color(255, 255, 0);
    cInactiveColor = color(255, 0, 0);
    bottomReceiverActive = inWindow.y - cHeight * 0.6;
    bottomReceiverInactive = inWindow.y + 6;
    topReceiverActive = -cHeight * 0.4;
    topReceiverInactive = -cHeight - 6;
    lowReceiverHeight = bottomReceiverActive - cHeight * 1.2 + 1;
    topReceiverHeight = topReceiverActive + cHeight * 1.2 - 1;
    controllerX = halfWindow.x - cWidth * 0.5;
    // State init
    controllerY = -1;
    controllerColor = cActiveColor;
    bottomReceiverY = bottomReceiverActive;
    topReceiverY = topReceiverInactive;
    ctBottomHeight = tHeight;
    ctTopHeight = 0;

// INTERACTION ON RESIZE
    leftOverTarget = 0;
    hoverArea = new HoverRect(
        createVector(controllerX, 0), createVector(0, 0), createVector(cWidth, cHeight));
    downConstraints = createVector(-1, lowReceiverHeight);
    upConstraints = createVector(topReceiverHeight, inWindow.y - cHeight + 1);

// MESSAGE ON RESIZE
    // Create message masks
    msgPainted = new Array(2 * messages.length);
    for (let i = 0; i < msgPainted.length; ++i) msgPainted[i] = createGraphics(inWindow.x, inWindow.y);

    msgMasks = new Array(messages.length);
    for (let i = 0; i < messages.length; ++i) {
        msgMasks[i] = createGraphics(inWindow.x, inWindow.y);

        msgMasks[i].fill(0, 0, 0, 255);
        msgMasks[i].textSize(64);
        
        let charYStart = halfWindow.y - ((messages[i].length - 2) * charYInc) * 0.5;
        for (let j = 0; j < messages[i].length; ++j) {
            msgMasks[i].text(messages[i][j],
                halfWindow.x - msgMasks[i].textWidth(messages[i][j]) * 0.5,
                charYStart + j * charYInc);
        }
    }

    // Create canvases
    previousCanvas = createGraphics(inWindow.x, inWindow.y);
    currentCanvas = createGraphics(inWindow.x, inWindow.y);
}

function draw() {
    deltaSeconds = deltaTime / 1000;

    background(255);

    fsm.update();

    image(fadeCanvas, 0, 0);

    interpolator.update();
    shaker.update();
}

// -- MESSAGE --------------------------------------------------------------------------------------
// // Parameters
const gaussOpacity = 20;
const lineElements = 50;
const circleDiameter = 4;
let msgMasks;
let msgPainted;
const charYInc = 60;
const messages = [
    Array.from("DISPÕE ALELO"),
    Array.from("LONGE DE CASA"),
    // Array.from("PARAM O PRELO"), Array.from("ENGOLE A BRASA"),
    // Array.from("ARRANCA OCELO")
];
// State
let previousCanvas;
let currentCanvas;
let counter;

function paintCanvas(sampleIndex) {
    let black = color(0, 0, 0, 20);
    let white = color(255, 255, 255, 40 + 5 * sampleIndex);

    msgPainted[sampleIndex].clear();
    msgPainted[sampleIndex].noStroke();
    if (sampleIndex > 0) msgPainted[sampleIndex].copy(msgPainted[sampleIndex - 1], 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);

    const msgIndex = floor(sampleIndex / 2);
    for (let i = 0; i < lineElements; ++i) {
        for (let j = 0; j < inWindow.y; ++j) {
            const x = randomGaussian(halfWindow.x, 60);
            if (abs(halfWindow.x - x) > cWidth * 0.5) continue; // ---
            const pos = createVector(x, j);
            const color = msgMasks[msgIndex].get(pos.x, pos.y)[3] !== 0 ? white : black;
            msgPainted[sampleIndex].fill(color);
            msgPainted[sampleIndex].circle(pos.x, pos.y, circleDiameter);
        }
    }
}

let fadeCanvas;
let hoverArea;


// Parameters
let downConstraints;
let upConstraints;
const magnetYFactor = 0.3;
// State
let leftOverTarget;
let isGoingDown;
let cConstraints;
let magnetY;

function setDirection(newIsGoingDown) {
    isGoingDown = newIsGoingDown;
    cConstraints = isGoingDown ? downConstraints : upConstraints;
    magnetY = isGoingDown ? (inWindow.y * (1 - magnetYFactor)) : (inWindow.y * magnetYFactor);
    hoverArea.pos.y = controllerY;
    controllerColor = cActiveColor;

    counter++;
    previousCanvas.clear();
    if (counter > 0)
        previousCanvas.copy(msgPainted[counter - 1], 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);
    currentCanvas.clear();
    currentCanvas.copy(msgPainted[counter], 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);
}

// -------------------------------------------------------------------------------------------------

class LoadingState {
    onEnter() {
        this.fading = false;
        this.sampled = 0;
    }
    onExit() {
        let interp = interpolator.add("titleFadeIn", 255, 0, 1000, -0.2);
        interp.onInterpolate = (i) => {
            fadeCanvas.clear();
            fadeCanvas.background(255, i.value);
        }
    }
    onUpdate() {
        if (this.sampled < msgPainted.length) {
            paintCanvas(this.sampled);
            this.sampled++;
        } else if (!this.fading) {
            this.fading = true;
            let interp = interpolator.add("idleFadeOut", 0, 255, 1000);
            interp.onInterpolate = (i) => { fadeCanvas.clear(); fadeCanvas.background(255, i.value); }
            interp.onFinish = () => fsm.transition(new StateTransition(STATES.Title));
        }

        push();
        textSize(32);
        let sampled = "[";
        let unsampled = "";
        for (let i = 0; i < this.sampled; ++i) sampled += "-";
        for (let i = 0; i < msgPainted.length - this.sampled; ++i) unsampled += "-";
        let full = sampled + unsampled + "]";
        noStroke();
        fill(0);
        const fullX = halfWindow.x - textWidth(full) * 0.5;
        text(sampled, fullX, inWindow.y * 0.45);
        noFill();
        text(unsampled, fullX + textWidth(sampled), inWindow.y * 0.45);
        fill(0);
        text("]", fullX + textWidth(sampled) + textWidth(unsampled), inWindow.y * 0.45);
        text("Loading", halfWindow.x - textWidth("Loading") * 0.5, inWindow.y * 0.4);
        pop();
    }
}

class TitleState {
    constructor(title, subtitle) {
        this.title = title;
        this.subtitle = subtitle;
        this.subtitleOpacity = 255;

        this.interval = 1;
        this.elapsedTime = 0;
    }

    onEnter() {
        this.fading = false;
        cursor(HAND);
    }

    onExit() {
        let interp = interpolator.add("idleFadeIn", 255, 0, 1000);
        interp.onInterpolate = (i) => {
            fadeCanvas.clear();
            fadeCanvas.background(255, i.value);
        }

        counter = -1;
        setDirection(true);
    }

    onUpdate() {

        // Draw title
        push();
        fill(0);
        textSize(64);
        text(this.title, halfWindow.x - textWidth(this.title) * 0.5, inWindow.y * 0.4);
        textSize(16);
        this.elapsedTime += deltaSeconds;
        if (this.elapsedTime > 2) this.elapsedTime -= 2; // loop
        if (this.elapsedTime < 1) this.subtitleOpacity = lerp(255, 0, this.elapsedTime);
        else this.subtitleOpacity = lerp(0, 255, this.elapsedTime - 1);
        fill(0, this.subtitleOpacity);
        text(this.subtitle, halfWindow.x - textWidth(this.subtitle) * 0.5, inWindow.y * 0.43);
        pop();

        // Query fade
        if (mouseIsPressed && mouseButton === LEFT && !this.fading) {
            this.fading = true;
            cursor(ARROW);
            let interp = interpolator.add("introFadeOut", 0, 255, 1000);
            interp.onInterpolate = (i) => { fadeCanvas.clear(); fadeCanvas.background(255, i.value); }
            interp.onFinish = () => fsm.transition(new StateTransition(STATES.Idle));
        }
    }
}

class IdleState {
    onEnter() {} // interp.onFinish = () => updateCanvas(msgMasks[0]);
    onExit() {}
    onUpdate() {
        drawThings();

        if (hoverArea.isMouseHovering()) {
            if (mouseIsPressed) return new StateTransition(STATES.Drag);
            else cursor('grab');
        } else cursor(ARROW);

        if (leftOverTarget !== 0) {
            controllerY += constrain((leftOverTarget - controllerY) * 6 * deltaSeconds, -10, 10);
            hoverArea.pos.y = controllerY;

            if (isGoingDown ? (controllerY > magnetY) : (controllerY < magnetY)) {
                controllerColor = cMagnetColor;
                fsm.transition(new StateTransition(STATES.Magnet));
            }
        }
    }
}

class DragState {
    onEnter() {
        cursor('grabbing');
        this.dragOffset = abs(mouseY - controllerY);
    }
    onExit() {}
    onUpdate() {
        drawThings();

        const insideMagnetArea = isGoingDown ? (controllerY > magnetY) : (controllerY < magnetY);
        controllerColor = insideMagnetArea ? cMagnetColor : cActiveColor;
        const dragTarget = constrain(mouseY - this.dragOffset, cConstraints.x, cConstraints.y);
        if (mouseIsPressed) {
            controllerY += constrain((dragTarget - controllerY) * 6 * deltaSeconds, -10, 10);
            hoverArea.pos.y = controllerY; // TODO: needed?
        } else {
            leftOverTarget = constrain(dragTarget, controllerY - 100, controllerY + 100);
            return new StateTransition(insideMagnetArea ? STATES.Magnet : STATES.Idle);
        }
    }
}

class MagnetState {
    onEnter() {
        cursor(ARROW);
        this.target = isGoingDown ? lowReceiverHeight : topReceiverHeight;
        this.maxDistance = abs(magnetY - this.target);
        this.startDistance = abs(controllerY - this.target);
        this.locked = false;
    }
    onExit() {
        leftOverTarget = 0;
    }
    onUpdate() {
        drawThings();

        if (this.locked) return; // ---

        // Move towards target with a step based on elapsed distance
        const elapsedDistance = this.startDistance - abs(controllerY - this.target);
        const step = lerp(30, 800, elapsedDistance / this.maxDistance) * deltaSeconds * (isGoingDown ? 1 : -1);
        const leftOverStep = constrain((leftOverTarget - controllerY) * 6 * deltaSeconds, -10, 10);
        const isStepBigger = isGoingDown ? (step > leftOverStep) : (step < leftOverStep);
        controllerY += (isStepBigger) ? step : leftOverStep;

        if (isGoingDown ? (controllerY >= this.target) : (controllerY <= this.target)) {
            this.locked = true;
            controllerY = this.target;
            controllerColor = cInactiveColor;

            const elapsedDistancePercentage = this.startDistance / this.maxDistance;

            // No shake if touching or almost touching
            if (elapsedDistancePercentage < 0.1) this.reload(100);
            else {
                const sInterval = lerp(100, 350, elapsedDistancePercentage);
                const sAmplitude = lerp(2, 10, elapsedDistancePercentage);

                let shake = new Shake("magnetLockShake", sAmplitude, 60, sInterval);
                const startPos = createVector(camPos.x, camPos.y);
                shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
                shake.onFinish = () => this.reload(300);
                shaker.add(shake, interpolator);
            }
        }
    }

    reload(waitTime) {
      setTimeout(() => {
        let interp = interpolator.add("hookPrep", 0, 1, 400, 0.25);
        let targetY;

        if (isGoingDown) {
            controllerY = lowReceiverHeight;
            targetY = upConstraints.y - tHeight
            interp.onInterpolate = (i) => {
                controllerY = lerp(lowReceiverHeight, targetY, i.value);
                topReceiverY = lerp(topReceiverInactive, topReceiverActive, i.value);
            }
            interp.onFinish = () =>
                interpolator.add("hookOvershoot", 0, 1, 300).onFinish = () => {
                    controllerY = upConstraints.y + 2;
                    bottomReceiverY = bottomReceiverInactive;
                    interpolator.add("hookResolve", 0, 1, 80).onFinish = () => {
                        controllerY = upConstraints.y;
                        ctBottomHeight = 0;
                        setTimeout(this.cast, 300);
                    }
                }
        } else {
            controllerY = topReceiverHeight;
            targetY = downConstraints.x + tHeight;
            interp.onInterpolate = (i) => {
                controllerY = lerp(topReceiverHeight, targetY, i.value);
                bottomReceiverY = lerp(bottomReceiverInactive, bottomReceiverActive, i.value);
            }
            interp.onFinish = () =>
                interpolator.add("hookOvershoot", 0, 1, 300).onFinish = () => {
                    controllerY = downConstraints.x - 2;
                    topReceiverY = topReceiverInactive;
                    interpolator.add("hookResolve", 0, 1, 80).onFinish = () => {
                        controllerY = downConstraints.x;
                        ctBottomHeight = 0;
                        setTimeout(this.cast, 300);
                    }
                }
        }

      }, waitTime);
    }

    cast() {
        let interp = interpolator.add("cast", 0, 1, 150);
        interp.onInterpolate = (i) => {
            ctTopHeight = lerp(isGoingDown ? 0 : tHeight, isGoingDown ? tHeight : 0, i.value);
            ctBottomHeight = lerp(isGoingDown ? tHeight : 0, isGoingDown ? 0 : tHeight, i.value);
        }
        interp.onFinish = () => {
            if (counter === (2 * msgMasks.length - 1)) {
                let interp = interpolator.add("magnetFadeOut", 0, 255, 1000);
                interp.onInterpolate = (i) => { fadeCanvas.clear(); fadeCanvas.background(255, i.value); }
                interp.onFinish = () => {
                    fadeCanvas.clear();
                    fadeCanvas.background(255, 0);
                    fsm.transition(new StateTransition(STATES.Title));
                }
            }
            else {
                setDirection(!isGoingDown);
                fsm.transition(new StateTransition(STATES.Idle));
            }

            // setTimeout(() => {
            //     // updateCanvas(msgMasks[constrain(floor(counter / 2), 0, msgMasks.length - 1)]);
            //     setDirection(!isGoingDown);

            //     // if (counter > (2 * msgMasks.length)) {
            //     //     state = STATES.TRANSITION;
            //     //     returnToIntro();
            //     // }
            //     // else
            // }, 10); // (!) HACKY - Draw last interpolation before doing this
        }
    }
}

// -- CONTROLLER & RECEIVERS -----------------------------------------------------------------------
// Parameters
const cWidth = 500;
const cHeight = 30;
const bigTeethWOffset = cWidth * 0.15;
const dhYOffset = 4;
const dhXOffset = 15;
const tHeight = 5;
let cActiveColor;
let cMagnetColor;
let cInactiveColor;
let bottomReceiverActive;
let bottomReceiverInactive;
let topReceiverActive;
let topReceiverInactive;
let lowReceiverHeight; // downConstraints.y
let topReceiverHeight; // upConstraints.x
let controllerX;

// State
let controllerY;
let controllerColor;
let ctBottomHeight;
let ctTopHeight;
let bottomReceiverY;
let topReceiverY;

function drawThings() {
    translate(camPos.x, camPos.y);

    let topCanvas = isGoingDown ? currentCanvas : previousCanvas;
    let bottomCanvas = isGoingDown ? previousCanvas : currentCanvas;
    image(topCanvas, 0, 0, inWindow.x, controllerY, 0, 0, inWindow.x, controllerY);
    image(bottomCanvas, 0, controllerY, inWindow.x, inWindow.y, 0, controllerY, inWindow.x, inWindow.y);

    drawReceivers();
    drawController();
}

function drawController() {
    push();
    translate(halfWindow.x - cWidth * 0.5, controllerY);

    // Controller
    beginShape();
    vertex(0, 0);

    drawTeeth(1, 0, 0, bigTeethWOffset, -ctTopHeight, true, false);
    drawTeeth(10, cWidth * 0.3, 0, cWidth * 0.7, -ctTopHeight, false, false);
    drawTeeth(1, cWidth - bigTeethWOffset, 0, cWidth, -ctTopHeight, false, true);

    vertex(cWidth, 0);
    vertex(cWidth, cHeight);

    drawTeeth(1, cWidth, cHeight, cWidth - bigTeethWOffset, cHeight + ctBottomHeight, true, false);
    drawTeeth(10, cWidth * 0.7, cHeight, cWidth * 0.3, cHeight + ctBottomHeight, false, false);
    drawTeeth(1, bigTeethWOffset, cHeight, 0, cHeight + ctBottomHeight, false, true);

    vertex(0, cHeight);
    endShape(CLOSE);

    // Light
    push();
    fill(controllerColor);
    circle(20, cHeight * 0.5, 10);
    pop();
    
    // Drag handle
    push();
    translate(cWidth * 0.5, cHeight * 0.5);
    strokeCap(SQUARE);
    line(-dhXOffset, -dhYOffset, dhXOffset, -dhYOffset);
    line(-dhXOffset, 0, dhXOffset, 0);
    line(-dhXOffset, dhYOffset, dhXOffset, dhYOffset);
    pop();
    pop();
}

function drawReceivers() {
    // Top receiver
    push();
    translate(controllerX, topReceiverY);
    beginShape();
    vertex(0, 0);
    vertex(cWidth, 0);
    vertex(cWidth, cHeight);
    drawTeeth(1, cWidth, cHeight, cWidth - bigTeethWOffset, cHeight + tHeight, false, true);
    drawTeeth(1, cWidth - bigTeethWOffset, cHeight, cWidth - 2 * bigTeethWOffset, cHeight + tHeight, false, false);
    drawTeeth(9, cWidth * 0.7, cHeight, cWidth * 0.3, cHeight + tHeight, true, true);
    drawTeeth(1, 2 * bigTeethWOffset, cHeight, bigTeethWOffset, cHeight + tHeight, false, false);
    drawTeeth(1, bigTeethWOffset, cHeight, 0, cHeight + tHeight, true, false);
    vertex(0, cHeight);
    endShape(CLOSE);
    pop();

    // Bottom receiver
    push();
    translate(controllerX, bottomReceiverY);
    beginShape();
    vertex(0, 0);
    drawTeeth(1, 0, 0, bigTeethWOffset, -tHeight, false, true);
    drawTeeth(1, bigTeethWOffset, 0, 2 * bigTeethWOffset, -tHeight, false, false);
    drawTeeth(9, cWidth * 0.3, 0, cWidth * 0.7, -tHeight, true, true);
    drawTeeth(1, cWidth - 2 * bigTeethWOffset, 0, cWidth - bigTeethWOffset, -tHeight, false, false);
    drawTeeth(1, cWidth - bigTeethWOffset, 0, cWidth, -tHeight, true, false);
    vertex(cWidth, 0);
    vertex(cWidth, cHeight);
    vertex(0, cHeight);
    endShape(CLOSE);
    pop();
}

function drawTeeth(nr, fromX, fromY, toX, toY, hasLeftGap, hasRightGap) {
    const steps = 2 * nr - 1 + (hasLeftGap ? 1 : 0) + (hasRightGap ? 1 : 0);
    const tWidth = (toX - fromX) / steps; // width / steps
    const tHeight = toY - fromY;

    let cursor = fromX + (hasLeftGap ? tWidth : 0);
    for (let i = 0; i < nr; ++i) {
        vertex(cursor, fromY);
        vertex(cursor, fromY + tHeight);
        cursor += tWidth;
        vertex(cursor, fromY + tHeight);
        vertex(cursor, fromY);
        cursor += tWidth;
    }
}

class HoverRect {
    constructor(pos, corner1, corner2) {
        this.pos = pos;
        this.cMin = createVector(min(corner1.x, corner2.x), min(corner1.y, corner2.y));
        this.cMax = createVector(max(corner1.x, corner2.x), max(corner1.y, corner2.y));
    }

    isMouseHovering() {
        return mouseX > this.pos.x + this.cMin.x && mouseX < this.pos.x + this.cMax.x
            && mouseY > this.pos.y + this.cMin.y && mouseY < this.pos.y + this.cMax.y;
    }
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// TODOs
// Improved outro: gradual shaking and fadeout and title fadein
// Performance: canvas only need controllerX width (+ margin for circle?)
// Play with distribution
// Play with dotting elements
// Finish poem
// Movement: double toggle vs single top-bottom
// Slower controller maxSpeed
// Resizing considerations