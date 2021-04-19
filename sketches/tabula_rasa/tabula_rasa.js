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
let fadeCanvas;
// -------------------------------------------------------------------------------------------------

function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf');

    let stateMap = new Map([
        [STATES.Loading, new LoadingState()],
        [STATES.Title, new TitleState("T Á B U L A   R A S A", "Toca para começar")],
        [STATES.Idle, new IdleState()],
        [STATES.Drag, new DragState()],
        [STATES.Magnet, new MagnetState()],
    ]);
    fsm = new FSM(stateMap, stateMap.get(STATES.Loading));
    interpolator = new Interpolator();
    shaker = new Shaker();
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
    receiverActiveY = inWindow.y - cHeight * 0.6;
    receiverInactiveY = inWindow.y + 6;
    cHookedY = inWindow.y - cHeight + 1;
    controllerX = halfWindow.x - cWidth * 0.5;
    // State init
    controllerY = -1;
    controllerColor = cActiveColor;
    receiverY = receiverActiveY;

// INTERACTION ON RESIZE
    // Parameters
    downConstraints = createVector(-1, receiverActiveY - cHeight * 1.2 + 1);
    // State init
    previousCanvas = createGraphics(inWindow.x, inWindow.y);
    currentCanvas = createGraphics(inWindow.x, inWindow.y);
    leftOverTarget = 0;
    magnetY = inWindow.y * 0.7;
    hoverArea = new HoverRect(
        createVector(controllerX, 0), createVector(0, 0), createVector(cWidth, cHeight));

// MESSAGE ON RESIZE
    // Parameters
    msgPainted = new Array(messages.length);
    msgMasks = new Array(messages.length);
    for (let i = 0; i < messages.length; ++i) {
        msgPainted[i] = createGraphics(inWindow.x, inWindow.y);
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
// Parameters
const messages = [
    Array.from("DISPÕE ALELO"),
    Array.from("LONGE DE CASA"),
    // Array.from("PARAM O PRELO"), Array.from("ENGOLE A BRASA"),
    // Array.from("ARRANCA OCELO")
];
const charYInc = 60;
let msgMasks;
const missAlpha = 20;
const hitBaseAlpha = 40;
const hitAlphaIncrement = 5;
const lineElements = 50;
const circleDiameter = 4;
let msgPainted;

function paintCanvas(sampleIndex) {
    let black = color(0, 0, 0, missAlpha);
    let white = color(255, 255, 255, hitBaseAlpha + hitAlphaIncrement * sampleIndex);

    msgPainted[sampleIndex].clear();
    msgPainted[sampleIndex].noStroke();
    if (sampleIndex > 0) msgPainted[sampleIndex].copy(msgPainted[sampleIndex - 1], 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);

    for (let i = 0; i < lineElements; ++i) {
        for (let j = 0; j < inWindow.y; ++j) {
            const x = randomGaussian(halfWindow.x, 60);
            if (abs(halfWindow.x - x) > cWidth * 0.5) continue; // ---
            const pos = createVector(x, j);
            const color = msgMasks[sampleIndex].get(pos.x, pos.y)[3] !== 0 ? white : black;
            msgPainted[sampleIndex].fill(color);
            msgPainted[sampleIndex].circle(pos.x, pos.y, circleDiameter);
        }
    }
}

// -- INTERACTION ----------------------------------------------------------------------------------
// Parameters
let downConstraints;
let magnetY;
// State
let previousCanvas;
let currentCanvas;
let counter;
let leftOverTarget;
let hoverArea;

function advanceCounter() {
    counter++;
    previousCanvas.clear();
    if (counter > 0)
        previousCanvas.copy(msgPainted[counter - 1], 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);
    if (counter < msgPainted.length) {
        currentCanvas.clear();
        currentCanvas.copy(msgPainted[counter], 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);
    }
}

function setNewScroll() {
    hoverArea.pos.y = controllerY;
    controllerColor = cActiveColor;
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

// -- STATES ---------------------------------------------------------------------------------------

class LoadingState {
    onEnter() {
        this.fading = false;
        this.sampled = 0;
    }
    onExit() {}
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

        interpolator.add("titleFadeIn", 255, 0, 1000, -0.2)
            .onInterpolate = (i) => { fadeCanvas.clear(); fadeCanvas.background(255, i.value); }
    }

    onExit() {
        let interp = interpolator.add("idleFadeIn", 255, 0, 1000);
        interp.onInterpolate = (i) => {
            fadeCanvas.clear();
            fadeCanvas.background(255, i.value);
        }

        counter = -1;
        setNewScroll();
        advanceCounter();
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
        drawThings(true);

        if (hoverArea.isMouseHovering()) {
            if (mouseIsPressed) return new StateTransition(STATES.Drag);
            else cursor('grab');
        } else cursor(ARROW);

        if (leftOverTarget !== 0) {
            controllerY += constrain((leftOverTarget - controllerY) * 6 * deltaSeconds, -10, 10);
            hoverArea.pos.y = controllerY;

            if (controllerY > magnetY) {
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
        drawThings(true);

        const insideMagnetArea = controllerY > magnetY;
        controllerColor = insideMagnetArea ? cMagnetColor : cActiveColor;
        const dragTarget = constrain(mouseY - this.dragOffset, downConstraints.x, downConstraints.y);
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
        this.maxDistance = abs(magnetY - downConstraints.y);
        this.startDistance = abs(controllerY - downConstraints.y);
        this.locked = false;
        this.reloading = false;
    }
    onExit() {
        leftOverTarget = 0;
    }
    onUpdate() {
        drawThings(!this.reloading);

        if (this.locked) return; // ---

        // Move towards target with a step based on elapsed distance
        const elapsedDistance = this.startDistance - abs(controllerY - downConstraints.y);
        const step = lerp(30, 800, elapsedDistance / this.maxDistance) * deltaSeconds;
        const leftOverStep = constrain((leftOverTarget - controllerY) * 6 * deltaSeconds, -10, 10);
        controllerY += (step > leftOverStep) ? step : leftOverStep;

        if (controllerY >= downConstraints.y) {
            this.locked = true;
            controllerY = downConstraints.y;
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
        let interp = interpolator.add("hookPrep", downConstraints.y, cHookedY - tHeight, 400, 0.4);
        interp.onInterpolate = (i) => controllerY = i.value;
        interp.onFinish = () => {
            interpolator.add("hookOvershoot", 0, 1, 300).onFinish = () => {
                controllerY = cHookedY + 2;
                receiverY = receiverInactiveY;
                interpolator.add("hookResolve", 0, 1, 60).onFinish = () => {
                    controllerY = cHookedY;
                    advanceCounter();
                    this.reloading = true;
                    this.retrieve(300);
                }
            }
        }
      }, waitTime);
    }

    retrieve(waitTime) {
      setTimeout(() => {
        let interp = interpolator.add("controllerRetrieval", cHookedY, inWindow.y + 1, 400, 0.6);
        interp.onInterpolate = (i) => controllerY = i.value;
        interp.onFinish = () => {
            interp = interpolator.add("receiverReload", receiverInactiveY, receiverActiveY, 500, 0.6);
            interp.onInterpolate = (i) => receiverY = i.value;
            interp.onFinish = () => {
                interp = interpolator.add("controllerSetup", downConstraints.x - cHeight, downConstraints.x, 1000);
                interp.onInterpolate = (i) => controllerY = i.value;
                interp.onFinish = () => {
                    let shake = new Shake("controllerSetupShake", 2, 60, 300);
                    const startPos = createVector(camPos.x, camPos.y);
                    shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
                    shaker.add(shake, interpolator);

                    if (counter === msgPainted.length) {
                        let interp = interpolator.add("magnetFadeOut", 0, 255, 1000);
                        interp.onInterpolate = (i) => { fadeCanvas.clear(); fadeCanvas.background(255, i.value); }
                        interp.onFinish = () => {
                            // TODO: is this necessary?
                            fadeCanvas.clear();
                            fadeCanvas.background(255, 0);
                            fsm.transition(new StateTransition(STATES.Title));
                        }
                    } else {
                        setNewScroll();
                        fsm.transition(new StateTransition(STATES.Idle));
                    }
                };
            }
        }
      }, waitTime);
    }
}

// -- CONTROLLER & RECEIVER ------------------------------------------------------------------------
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
let receiverActiveY;
let receiverInactiveY;
let cHookedY;
let controllerX;
// State
let controllerY;
let controllerColor;
let receiverY;

function drawThings(splitVersion) {
    translate(camPos.x, camPos.y);

    if (splitVersion) {
        image(currentCanvas, 0, 0, inWindow.x, controllerY, 0, 0, inWindow.x, controllerY);
        image(previousCanvas, 0, controllerY, inWindow.x, inWindow.y, 0, controllerY, inWindow.x, inWindow.y);
    } else image(previousCanvas, 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);

    drawReceiverAndController();
}

function drawReceiverAndController() {
    // Receiver
    push();
    translate(controllerX, receiverY);
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

    // Controller
    push();
    translate(halfWindow.x - cWidth * 0.5, controllerY);
        // Outline
        beginShape();
        vertex(0, 0);
        vertex(cWidth, 0);
        vertex(cWidth, cHeight);
        drawTeeth(1, cWidth, cHeight, cWidth - bigTeethWOffset, cHeight + tHeight, true, false);
        drawTeeth(10, cWidth * 0.7, cHeight, cWidth * 0.3, cHeight + tHeight, false, false);
        drawTeeth(1, bigTeethWOffset, cHeight, 0, cHeight + tHeight, false, true);
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

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// TODOs
// Improved outro: crooked controller that breaks when dragged to give way to title
// Performance: canvas only need controllerX width (+ margin for circle?)
// Play with distribution
// Play with dotting elements
// Finish poem
// Slower controller maxSpeed
// Resizing considerations