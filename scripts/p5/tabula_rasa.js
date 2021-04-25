import {Interpolator, ease} from '../modules/Interpolator.js';
import {Shaker, Shake} from '../modules/Shaker.js';
import {FSM, StateTransition} from '../modules/FSM.js';

// Services
let fsm, interpolator, shaker;
// Parameters
let inWindow, halfWindow; // onResize
let ralewayFont;
// State
let camPos;
let deltaSeconds;
let fadeCanvas;
// -------------------------------------------------------------------------------------------------

function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf');
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
    camPos = createVector(0, 0);
    deltaSeconds = 0;
    fadeCanvas = createGraphics(inWindow.x, inWindow.y);
    fadeCanvas.background(255, 0);

    const dimP = createVector(  constrain(map(inWindow.x, 540, 340, 1, 0), 0, 1),
                                constrain(map(inWindow.y, 960, 640, 1, 0), 0, 1));
// CONTROLLER & RECEIVER
    // Parameters
    cWidth = round(lerp(300, 500, dimP.x));
    cHeight = 30;
    bigTeethWOffset = round(lerp(45, 75, dimP.x));
    tHeight = round(lerp(3, 5, dimP.x));
    dhOffset = createVector(15, 4);
    cActiveColor = color(0, 255, 0);
    cMagnetColor = color(255, 255, 0);
    cInactiveColor = color(255, 0, 0);
    receiverActiveY = inWindow.y - cHeight * 0.6;
    receiverInactiveY = inWindow.y + 6;
    cHookedY = inWindow.y - cHeight + 1;
    controllerX = halfWindow.x - cWidth * 0.5;

// INTERACTION
    // Parameters
    cConstraints = createVector(-1, receiverActiveY - cHeight - tHeight);
    magnetY = inWindow.y * 0.7 - cHeight;
    // State
    previousCanvas = createGraphics(cWidth, inWindow.y);
    currentCanvas = createGraphics(cWidth, inWindow.y);
    hoverArea = new HoverRect(controllerX, 0, createVector(0, 0), createVector(cWidth, cHeight));
    leftOverTarget = 0;

// MESSAGE
    // Parameters
    charSize = lerp(32, 64, dimP.y);
    charLHeight = lerp(36, 60, dimP.y);
    gaussDeviation = lerp(38, 60, dimP.x);
    lineElements = round(lerp(60, 70, dimP.x));
    circleDiameter = round(lerp(3, 4, dimP.x));
    missAlpha = 25;
    hitBaseAlpha = round(lerp(45, 30, dimP.x));
    hitAlphaIncrement = 5;
    // State
    msgList = new Array(messages.length);
    msgMaskList = new Array(messages.length);
    for (let i = 0; i < messages.length; ++i) {
        msgList[i] = createGraphics(cWidth, inWindow.y);
        msgMaskList[i] = createGraphics(cWidth, inWindow.y);

        msgMaskList[i].background(255);
        msgMaskList[i].fill(0);
        msgMaskList[i].textSize(charSize);
        
        let charYStart = halfWindow.y - ((messages[i].length - 2) * charLHeight) * 0.5;
        for (let j = 0; j < messages[i].length; ++j) {
            msgMaskList[i].text(messages[i][j],
                cWidth * 0.5 - msgMaskList[i].textWidth(messages[i][j]) * 0.5,
                charYStart + j * charLHeight);
        }
    }

// STATES
    const widthP = constrain(map(inWindow.x, 700, 340, 1, 0), 0, 1);
    titleSize = round(lerp(32, 64, widthP));
    subtitleSize = round(lerp(12, 16, widthP));

    endPullRotMin = lerp(-HALF_PI * 0.04, -HALF_PI * 0.03, dimP.x);
    endPullRotMax = lerp(-HALF_PI * 0.08, -HALF_PI * 0.06, dimP.x);
    endPullRangeMult = round(lerp(25, 40, dimP.y));

    let stateMap = new Map([
        [STATES.Loading, new LoadingState("T Á B U L A   R A S A")],
        [STATES.Title, new TitleState("T Á B U L A   R A S A", "Toca para começar")],
        [STATES.Idle, new IdleState()],
        [STATES.Drag, new DragState()],
        [STATES.Magnet, new MagnetState()],
        [STATES.EndPull, new EndPullState()],
    ]);
    fsm = new FSM(stateMap, stateMap.get(STATES.Loading));
    interpolator = new Interpolator();
    shaker = new Shaker();
}

function draw() {
    deltaSeconds = deltaTime / 1000;


    background(255);
    fsm.update();
    image(fadeCanvas, 0, 0);

    push();
    textSize(64);
    text(pixelDensity(), halfWindow.x, halfWindow.y);
    pop();


    interpolator.update();
    shaker.update();
}

// -- CONTROLLER & RECEIVER ------------------------------------------------------------------------
// Parameters
let cWidth, cHeight, bigTeethWOffset, tHeight, dhOffset, cActiveColor, cMagnetColor, cInactiveColor,
    receiverActiveY, receiverInactiveY, cHookedY, controllerX;
// State
let controllerY, controllerRot, controllerColor, receiverY;

function drawThings(splitVersion) {
    translate(camPos.x, camPos.y);

    if (splitVersion) {
        image(currentCanvas, controllerX, 0, cWidth, controllerY, 0, 0, cWidth, controllerY);
        image(previousCanvas, controllerX, controllerY, cWidth, inWindow.y, 0, controllerY, cWidth, inWindow.y);
    } else image(previousCanvas, controllerX, 0, cWidth, inWindow.y, 0, 0, cWidth, inWindow.y);

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
    translate(controllerX + cWidth, controllerY);
    rotate(controllerRot);
    translate(-cWidth, 0);
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
        line(-dhOffset.x, -dhOffset.y, dhOffset.x, -dhOffset.y);
        line(-dhOffset.x, 0, dhOffset.x, 0);
        line(-dhOffset.x, dhOffset.y, dhOffset.x, dhOffset.y);
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

// -- INTERACTION ----------------------------------------------------------------------------------
// Parameters
let cConstraints, magnetY;
// State
let counter, previousCanvas, currentCanvas, hoverArea, leftOverTarget;

function advanceCounter() {
    counter++;
    previousCanvas.clear();
    if (counter > 0)
        previousCanvas.copy(msgList[counter - 1], 0, 0, cWidth, inWindow.y, 0, 0, cWidth, inWindow.y);
    if (counter < msgList.length) {
        currentCanvas.clear();
        currentCanvas.copy(msgList[counter], 0, 0, cWidth, inWindow.y, 0, 0, cWidth, inWindow.y);
    }
}

function setNewScroll() {
    hoverArea.pos.y = controllerY;
    controllerColor = cActiveColor;
}

class HoverRect {
    constructor(x, y, corner1, corner2) {
        this.pos = createVector(x, y);
        this.cMin = createVector(min(corner1.x, corner2.x), min(corner1.y, corner2.y));
        this.cMax = createVector(max(corner1.x, corner2.x), max(corner1.y, corner2.y));
    }

    isPointHovering(x, y) {
        return x > this.pos.x + this.cMin.x && x < this.pos.x + this.cMax.x
            && y > this.pos.y + this.cMin.y && y < this.pos.y + this.cMax.y;
    }
}

// -- MESSAGE --------------------------------------------------------------------------------------
// Parameters
const messages = [
    // Array.from("DISPÕE ALELO"),
    // Array.from("LONGE DE CASA"),
    // Array.from("ASTRO BELO"),
    Array.from("ENGOLE A BRASA"),
    // Array.from("RUI CASTELO"),
    // Array.from("O PODRE VAZA"),
    // Array.from("ARRANCA OCELO")
];
let charSize, charLHeight, gaussDeviation, lineElements, circleDiameter, missAlpha, hitBaseAlpha,
    hitAlphaIncrement, msgList, msgMaskList;

function preloadMessage(sampleIndex) {
    let black = color(0, 0, 0, missAlpha);
    let white = color(255, 255, 255, hitBaseAlpha + hitAlphaIncrement * sampleIndex);

    msgList[sampleIndex].clear();
    msgList[sampleIndex].noStroke();
    if (sampleIndex > 0) msgList[sampleIndex].copy(msgList[sampleIndex - 1], 0, 0, cWidth, inWindow.y, 0, 0, cWidth, inWindow.y);

    msgMaskList[sampleIndex].loadPixels();
    // console.log(msgMaskList[sampleIndex].pixels[4 * (inWindow.y * cWidth) - 1]);
    for (let i = 0; i < lineElements; ++i) {
        for (let y = 0; y < inWindow.y; ++y) {
            const x = constrain(round(randomGaussian(cWidth * 0.5, gaussDeviation)), 0, cWidth);

            // msgList[sampleIndex].fill(msgMaskList[sampleIndex].pixels[4 * (x + y * cWidth) + 3]);
            // msgList[sampleIndex].circle(x, y, circleDiameter);

            // if (msgMaskList[sampleIndex].pixels[4 * (x + y * cWidth) + 3] !== undefined){
            //     msgList[sampleIndex].fill(black);
            //     msgList[sampleIndex].circle(x, y, circleDiameter);
            // }

            // if (msgMaskList[sampleIndex].pixels[4 * (x + y * cWidth) + 3] !== 0){
            //     msgList[sampleIndex].fill(black);
            //     msgList[sampleIndex].circle(x, y, circleDiameter);
            // }

            const isMaskHit = msgMaskList[sampleIndex].pixels[4 * (x + y * cWidth)] !== 255;
            msgList[sampleIndex].fill(isMaskHit ? white : black);
            msgList[sampleIndex].circle(x, y, circleDiameter);

            // const isMaskHit = msgMaskList[sampleIndex].pixels[4 * (x + y * cWidth) + 3] !== 0;
            // msgList[sampleIndex].fill(isMaskHit ? white : black);
            // msgList[sampleIndex].circle(x, y, circleDiameter);
        }
    }
}

// -- STATES ---------------------------------------------------------------------------------------
// Parameters
let titleSize, subtitleSize;
const STATES = Object.freeze({
    "Loading":"LoadingState",
    "Title":"TitleState",
    "Idle":"IdleState",
    "Drag":"DragState",
    "Magnet":"MagnetState",
    "EndPull":"EndPullState",
});

class LoadingState {
    constructor(title) {
        this.title = title;
        this.sampled = 0;
    }

    onEnter() {}
    onExit() {
        
    }
    onUpdate() {
        if (this.sampled === msgList.length - 1) fsm.transition(new StateTransition(STATES.Title));

        preloadMessage(this.sampled);
        this.sampled++;

        // Draw title & loading bar
        push();
        fill(0);
        textSize(titleSize);
        text(this.title, halfWindow.x - textWidth(this.title) * 0.52, halfWindow.y - titleSize);
        textSize(titleSize * 0.5);

        let sampled = "[";
        let unsampled = "";
        for (let i = 0; i < this.sampled; ++i) sampled += "-";
        for (let i = 0; i < msgList.length - this.sampled; ++i) unsampled += "-";
        let full = sampled + unsampled + "]";
        noStroke();
        fill(0);
        const fullX = halfWindow.x - textWidth(full) * 0.5;
        text(sampled, fullX, halfWindow.y - titleSize * 0.5);
        noFill();
        text(unsampled, fullX + textWidth(sampled), halfWindow.y - titleSize * 0.5);
        fill(0);
        text("]", fullX + textWidth(sampled) + textWidth(unsampled), halfWindow.y - titleSize * 0.5);
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

        controllerY = cConstraints.x;
        controllerRot = 0;
        controllerColor = cActiveColor;
        receiverY = receiverActiveY;
        counter = -1;
    }

    onExit() {
        let interp = interpolator.add("idleFadeIn", 255, 0, 1000);
        interp.onInterpolate = (i) => {
            fadeCanvas.clear();
            fadeCanvas.background(255, i.value);
        }

        counter = -1;
        controllerY = cConstraints.x;
        controllerRot = 0;
        controllerColor = cActiveColor;
        setNewScroll();
        advanceCounter();
    }

    onUpdate() {
        // Draw title & subtitle
        push();
        fill(0);
        textSize(titleSize);
        text(this.title, halfWindow.x - textWidth(this.title) * 0.52, halfWindow.y - titleSize);
        this.elapsedTime += deltaSeconds;
        if (this.elapsedTime > 2) this.elapsedTime -= 2; // loop
        if (this.elapsedTime < 1) this.subtitleOpacity = lerp(255, 0, this.elapsedTime);
        else this.subtitleOpacity = lerp(0, 255, this.elapsedTime - 1);
        fill(0, this.subtitleOpacity);
        textSize(subtitleSize);
        text(this.subtitle, halfWindow.x - textWidth(this.subtitle) * 0.5, halfWindow.y - titleSize * 0.5);
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
    onEnter() {}
    onExit() {}
    onUpdate() {
        drawThings(true);

        if (hoverArea.isPointHovering(mouseX, mouseY)) {
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
        const dragTarget = constrain(mouseY - this.dragOffset, cConstraints.x, cConstraints.y);
        if (mouseIsPressed) {
            controllerY += constrain((dragTarget - controllerY) * 6 * deltaSeconds, -5, 5);
            hoverArea.pos.y = controllerY; // TODO: needed?
        } else {
            leftOverTarget = constrain(dragTarget, controllerY - 50, controllerY + 50);
            return new StateTransition(insideMagnetArea ? STATES.Magnet : STATES.Idle);
        }
    }
}

class MagnetState {
    onEnter() {
        cursor(ARROW);
        this.maxDistance = abs(magnetY - cConstraints.y);
        this.startDistance = abs(controllerY - cConstraints.y);
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
        const elapsedDistance = this.startDistance - abs(controllerY - cConstraints.y);
        const step = lerp(30, 800, elapsedDistance / this.maxDistance) * deltaSeconds;
        const leftOverStep = constrain((leftOverTarget - controllerY) * 6 * deltaSeconds, -10, 10);
        controllerY += (step > leftOverStep) ? step : leftOverStep;

        if (controllerY >= cConstraints.y) {
            this.locked = true;
            controllerY = cConstraints.y;
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
        let interp = interpolator.add("hookPrep", cConstraints.y, cHookedY - tHeight, 300, 0.4);
        interp.onInterpolate = (i) => controllerY = i.value;
        interp.onFinish = () => {
            interpolator.add("hookOvershoot", 0, 1, 300).onFinish = () => {
                controllerY = cHookedY + 2;
                receiverY = receiverInactiveY;
                interpolator.add("hookResolve", 0, 1, 60).onFinish = () => {
                    controllerY = cHookedY;
                    advanceCounter();
                    this.reloading = true;
                    this.retrieve(200);
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
            interp.onFinish = counter === msgList.length ? this.endSetup : this.setup;
        }
      }, waitTime);
    }

    setup() {
        let interp = interpolator.add("controllerSetup", cConstraints.x - cHeight - tHeight, cConstraints.x, 1200);
        interp.onInterpolate = (i) => controllerY = i.value;
        interp.onFinish = () => {
            let shake = new Shake("controllerSetupShake", 2, 60, 300);
            const startPos = createVector(camPos.x, camPos.y);
            shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
            shaker.add(shake, interpolator);

            setNewScroll();
            fsm.transition(new StateTransition(STATES.Idle));
        }
    }

    endSetup() {
        let interp = interpolator.add("es2", 0, 1, 1200, -0.7);
        interp.onInterpolate = (i) => {
            controllerY = lerp(cConstraints.x - cHeight - tHeight, cConstraints.x - 15, i.value);
            controllerRot = lerp(0, endPullRotMin, i.value);
        }
        interp.onFinish = () => {
            let shake = new Shake("es2Shake", 8, 60, 400);
            const startPos = createVector(camPos.x, camPos.y);
            shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
            shaker.add(shake, interpolator);
            fsm.transition(new StateTransition(STATES.EndPull));
        }
    }
}

let endPullRotMin, endPullRotMax, endPullRangeMult;
class EndPullState {
    onEnter() {
        this.endPullMin = cConstraints.x - 15;
        this.endPullMax = cConstraints.x - 5;
        
        hoverArea.pos.y = controllerY;
        controllerColor = cActiveColor;
        this.dragging = false;
        this.ripped = false;
        this.elapsedBlink = 0;
        this.blinkInterval = 1;

        this.endPullEase = 0.5;
    }
    onExit() {}

    updateDrag() {
        let offset = mouseY - this.startMouse;

        let rangeVal = constrain(this.startController + offset / endPullRangeMult, this.endPullMin, this.endPullMax);
        let oneP = (rangeVal - this.endPullMin) / (this.endPullMax - this.endPullMin);
        controllerY = lerp(this.endPullMin, this.endPullMax, ease(oneP, this.endPullEase, 0));
        controllerRot = lerp(endPullRotMin, endPullRotMax, ease(oneP, this.endPullEase, 0));
        hoverArea.pos.y = controllerY;

        if (oneP === 1) {
            this.ripped = true;
            cursor(ARROW);
            controllerColor = cInactiveColor;

            let shake = new Shake("ripShake", 15, 60, 700);
            const startPos = createVector(camPos.x, camPos.y);
            shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
            shaker.add(shake, interpolator);

            let interp = interpolator.add("ripFall", 0, 1, 5000, -0.5);
            interp.onInterpolate = (i) => {
                controllerY = lerp(this.endPullMax - 5, inWindow.y, i.value);
                controllerRot = lerp(-HALF_PI * 0.08, -HALF_PI * 0.6, i.value);
                fadeCanvas.clear();
                fadeCanvas.background(255, lerp(0, 255, i.value));
            }
            interp.onFinish = () => {
                interpolator.add("titleFadeIn", 255, 0, 1000, -0.2)
                    .onInterpolate = (i) => { fadeCanvas.clear(); fadeCanvas.background(255, i.value); }
                fsm.transition(new StateTransition(STATES.Title));
            }
        } else if (!mouseIsPressed) {
            this.dragging = false;
            let resetStartPos = controllerY;
            let resetStartRot = controllerRot;
            interpolator.add("endPullResetPos", 0, 1, 400, 0.3).onInterpolate = (i) => {
                controllerY = lerp(resetStartPos, this.endPullMin, i.value);
                controllerRot = lerp(resetStartRot, endPullRotMin, i.value);
                hoverArea.pos.y = controllerY;
            }
        }
    }

    onUpdate() {
        drawThings(false);

        if (this.ripped) return; // ---

        this.elapsedBlink += deltaSeconds;
        if (this.elapsedBlink > this.blinkInterval) {
            this.elapsedBlink -= this.blinkInterval;
            this.blinkInterval = random(0.1, 1);
            controllerColor = controllerColor === cActiveColor ? cInactiveColor : cActiveColor;
        }

        let sinus = sin(-controllerRot);
        let cosinus = cos(-controllerRot);
        let x = mouseX - (hoverArea.pos.x + cWidth);
        let y = mouseY - hoverArea.pos.y;
        x = x * cosinus - y * sinus;
        y = y * cosinus + x * sinus;
        x += (hoverArea.pos.x + cWidth);
        y += hoverArea.pos.y;

        if (this.dragging) this.updateDrag();
        else if (hoverArea.isPointHovering(x, y)) {
            if (mouseIsPressed) {
                this.dragging = true;
                cursor('grabbing');
                let cyP = (controllerY - this.endPullMin) / (this.endPullMax - this.endPullMin);
                this.startController = lerp(this.endPullMin, this.endPullMax, ease(cyP, -this.endPullEase, 0));
                this.startMouse = mouseY;
                if (interpolator.has("endPullResetPos")) interpolator.delete("endPullResetPos");
            }
            else cursor('grab');
        } else cursor(ARROW);
    }
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;