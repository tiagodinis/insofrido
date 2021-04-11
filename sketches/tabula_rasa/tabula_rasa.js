import {Interpolator} from '../../scripts/modules/Interpolator.js';
import {Shaker, Shake} from '../../scripts/modules/Shaker.js';

// Services
let interpolator, shaker;
// Parameters
let inWindow, halfWindow; // onResize
let ralewayFont;
const STATES = Object.freeze({
    "INTRO":"Intro",
    "IDLE":"Idle",
    "DRAG":"Drag",
    "MAGNET":"Magnet",
    "TRANSITION":"Transition"});
// State
let camPos;
let deltaSeconds;
// -------------------------------------------------------------------------------------------------

function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf');
    interpolator = new Interpolator();
    shaker = new Shaker();
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

// INTRO ON RESIZE
    subtitleOpacity = 255;
    let interp = interpolator.add("introFadeSubtitle", 255, 0, 1000);
    interp.onInterpolate = (i) => subtitleOpacity = i.value;
    interp.iterations = 0;
    interp.alternate = true;

    fadeCanvas = createGraphics(inWindow.x, inWindow.y);
    fadeCanvas.background(255, 0);
    fading = false;

// MESSAGE ON RESIZE
    // Create message masks
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
    counter = 0;

// CONTROLLER ON RESIZE
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

    controllerY = -1;
    controllerColor = cActiveColor;
    bottomReceiverY = bottomReceiverActive;
    topReceiverY = topReceiverInactive;
    ctBottomHeight = tHeight;
    ctTopHeight = 0;

// INTERACTION ON RESIZE
    downConstraints = createVector(-1, lowReceiverHeight);
    upConstraints = createVector(topReceiverHeight, inWindow.y - cHeight + 1);
    dragOffset = 0;
    dragTarget = 0;
    hoverArea = new HoverRect(createVector(controllerX, 0),
                            createVector(0, 0), createVector(cWidth, cHeight));
    setDirection(true);

    state = STATES.INTRO;
    // setTimeout(() => {
    //     uc(msgMasks[0]);
    //     uc(msgMasks[0]);
    //     uc(msgMasks[0]);
    //     uc(msgMasks[0]);
    //     uc(msgMasks[0]);
    //     uc(msgMasks[0]);
    // }, 1);
}

function draw() {
    deltaSeconds = deltaTime / 1000;

    background(255);

    if (state === STATES.INTRO) drawIntro();
    else {
        updateState();
    
        translate(camPos.x, camPos.y);

        let topCanvas = isGoingDown ? currentCanvas : previousCanvas;
        let bottomCanvas = isGoingDown ? previousCanvas : currentCanvas;
        image(topCanvas, 0, 0, inWindow.x, controllerY, 0, 0, inWindow.x, controllerY);
        image(bottomCanvas, 0, controllerY, inWindow.x, inWindow.y, 0, controllerY, inWindow.x, inWindow.y);

        drawReceivers();
        drawController();
    }

    image(fadeCanvas, 0, 0);

    interpolator.update();
    shaker.update();
}

// -- MESSAGE --------------------------------------------------------------------------------------
// Parameters
const gaussOpacity = 20;
const lineElements = 50;
const circleDiameter = 4;
let msgMasks;
const charYInc = 60;
const messages = [
    Array.from("DISPÕE ALELO")
    //, Array.from("LONGE DE CASA"),
    // Array.from("PARAM O PRELO"), Array.from("ENGOLE A BRASA"),
    // Array.from("ARRANCA OCELO")
];
// State
let previousCanvas;
let currentCanvas;
let counter;

function updateCanvas(mask) {
    console.log("Done");
    previousCanvas.clear();
    previousCanvas.copy(currentCanvas, 0, 0, inWindow.x, inWindow.y, 0, 0, inWindow.x, inWindow.y);

    let black = color(0, 0, 0, 20);
    let white = color(255, 255, 255, 40 + 5 * counter);

    currentCanvas.noStroke();

    for (let i = 0; i < lineElements; ++i) {
        for (let j = 0; j < inWindow.y; ++j) {
            let pos = createVector(randomGaussian(halfWindow.x, 70), j);

            let color = mask.get(pos.x, pos.y)[3] !== 0 ? white : black;
            currentCanvas.fill(color);

            currentCanvas.circle(pos.x, pos.y, circleDiameter);
        }
    }
}

// -- INTRO ----------------------------------------------------------------------------------------
// class IntroState {
//     onEnter() {}
//     onExit() {}
//     onUpdate() {
//         // 
//         if (mouseIsPressed && !fading) {
//             fading = true;
//             cursor(ARROW);
    
//             let interp = interpolator.add("introFadeOut", 0, 255, 1000);
//             interp.onInterpolate = (i) => {
//                 fadeCanvas.clear();
//                 fadeCanvas.background(255, i.value);
//             }
//             interp.onFinish = () => {
//                 state = STATES.IDLE;
//                 let interp = interpolator.add("introFadeIn", 255, 0, 1000);
//                 interp.onInterpolate = (i) => {
//                     fadeCanvas.clear();
//                     fadeCanvas.background(255, i.value);
//                 }
//                 interp.onFinish = () => updateCanvas(msgMasks[0]);
//             }
//         }

//         // Draw texts
//         push();
//         fill(0);
//         textSize(64);
//         text(title, halfWindow.x - textWidth(title) * 0.5, inWindow.y * 0.4);
//         textSize(16);
//         fill(0, subtitleOpacity);
//         text(subtitle, halfWindow.x - textWidth(subtitle) * 0.5, inWindow.y * 0.43);
//         pop();
//     }
// }

// Parameters
const title = "T Á B U L A   R A S A";
const subtitle = "Toca para estudar";
// State
let subtitleOpacity;
let fadeCanvas;
let fading;

function drawIntro() {
    push();
    fill(0);
    cursor(HAND);
    textSize(64);
    text(title, halfWindow.x - textWidth(title) * 0.5, inWindow.y * 0.4);
    textSize(16);
    fill(0, subtitleOpacity);
    text(subtitle, halfWindow.x - textWidth(subtitle) * 0.5, inWindow.y * 0.43);
    pop();

    if (mouseIsPressed && !fading) {
        fading = true;
        cursor(ARROW);

        let interp = interpolator.add("introFadeOut", 0, 255, 1000);
        interp.onInterpolate = (i) => {
            fadeCanvas.clear();
            fadeCanvas.background(255, i.value);
        }
        interp.onFinish = () => {
            state = STATES.IDLE;
            let interp = interpolator.add("introFadeIn", 255, 0, 1000);
            interp.onInterpolate = (i) => {
                fadeCanvas.clear();
                fadeCanvas.background(255, i.value);
            }
            interp.onFinish = () => updateCanvas(msgMasks[0]);
        }
    }
}

function returnToIntro() {
    let interp = interpolator.add("reintroFadeIn", 0, 255, 3000);
    interp.onInterpolate = (i) => {
        fadeCanvas.clear();
        fadeCanvas.background(255, i.value);
    }
    interp.onFinish = () => {
        state = STATES.INTRO;
        cursor(HAND);
        let interp = interpolator.add("reintroFadeOut", 255, 0, 1000);
        interp.onInterpolate = (i) => {
            fadeCanvas.clear();
            fadeCanvas.background(255, i.value);
        }
        interp.onFinish = () => {
            fading = false;
            counter = 0;
            controllerY = downConstraints.x;
            setDirection(true);
            previousCanvas.clear();
            currentCanvas.clear();
        }
    }
}


// -- INTERACTION ----------------------------------------------------------------------------------
// Parameters
let downConstraints;
let upConstraints;
const magnetYFactor = 0.2;
// State
let isGoingDown;
let cConstraints;
let magnetY;
let state;
let dragOffset;
let dragTarget;
let hoverArea;

function setDirection(newIsGoingDown) {
    state = STATES.IDLE
    isGoingDown = newIsGoingDown;
    cConstraints = isGoingDown ? downConstraints : upConstraints;
    magnetY = isGoingDown ? (inWindow.y * (1 - magnetYFactor)) : (inWindow.y * magnetYFactor);
    hoverArea.pos.y = controllerY;
    counter++;
}

function updateState() {
    if (state === STATES.DRAG) {
        const insideMagnetArea = isGoingDown ? (mouseY > magnetY) : (mouseY < magnetY);
        controllerColor = insideMagnetArea ? cMagnetColor : cActiveColor;

        if (mouseIsPressed) {
            dragTarget = constrain(mouseY - dragOffset, cConstraints.x, cConstraints.y);
            moveController();
        } else {
            if (insideMagnetArea) {
                state = STATES.MAGNET;
                cursor(ARROW);
                dragTarget = isGoingDown ? lowReceiverHeight : topReceiverHeight;
            } else state = STATES.IDLE;
        }
    }
    else if (state === STATES.IDLE) {
        if (hoverArea.isMouseHovering()) {
            if (mouseIsPressed) {
                cursor('grabbing');
                state = STATES.DRAG;
                dragOffset = abs(mouseY - controllerY);
            } else cursor('grab');
        } else cursor(ARROW);
    }
    else if (state === STATES.MAGNET) {
        moveController();
        if (abs((isGoingDown ? lowReceiverHeight : topReceiverHeight) - controllerY) <= 0.1) hookController();
    }

    function moveController() {
        controllerY = lerp(controllerY, dragTarget, 15 * deltaSeconds);
        hoverArea.pos = createVector(controllerX, controllerY);
    }
}

function hookController() {
    state = STATES.TRANSITION;
    controllerColor = cInactiveColor;

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
                controllerY = upConstraints.y + 1;
                bottomReceiverY = bottomReceiverInactive;
                interpolator.add("hookResolve", 0, 1, 80).onFinish = () => {
                    controllerY = upConstraints.y;
                    ctBottomHeight = 0;

                    // // Shake
                    // let shake = new Shake("hookShake", 2, 60, 350);
                    // const startPos = createVector(camPos.x, camPos.y);
                    // shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
                    // shaker.add(shake, interpolator);

                    setTimeout(reload, 300);
                }
            }
    } else {
        controllerY = topReceiverHeight;
        // targetY = downConstraints.x + tHeight + 3;
        targetY = downConstraints.x + tHeight;
        interp.onInterpolate = (i) => {
            controllerY = lerp(topReceiverHeight, targetY, i.value);
            bottomReceiverY = lerp(bottomReceiverInactive, bottomReceiverActive, i.value);
        }
        interp.onFinish = () =>
            interpolator.add("hookOvershoot", 0, 1, 300).onFinish = () => {
                controllerY = downConstraints.x - 1;
                topReceiverY = topReceiverInactive;
                interpolator.add("hookResolve", 0, 1, 80).onFinish = () => {
                    controllerY = downConstraints.x;
                    ctBottomHeight = 0;

                    // // Shake
                    // let shake = new Shake("hookShake", 2, 60, 350);
                    // const startPos = createVector(camPos.x, camPos.y);
                    // shake.onCompute = (s) => camPos = p5.Vector.add(startPos, s.value);
                    // shaker.add(shake, interpolator);

                    setTimeout(reload, 300);
                }
            }
    }
}

function reload() {
    let interp = interpolator.add("cast", 0, 1, 150);
    interp.onInterpolate = (i) => {
        ctTopHeight = lerp(isGoingDown ? 0 : tHeight, isGoingDown ? tHeight : 0, i.value);
        ctBottomHeight = lerp(isGoingDown ? tHeight : 0, isGoingDown ? 0 : tHeight, i.value);
    }
    interp.onFinish = () => {
        setTimeout(() => {
            updateCanvas(msgMasks[constrain(floor(counter / 2), 0, msgMasks.length - 1)]);
            setDirection(!isGoingDown);

            if (counter > (2 * msgMasks.length)) {
                state = STATES.TRANSITION;
                returnToIntro();
            }
            else controllerColor = cActiveColor;
        }, 10); // (!) HACKY - Draw last interpolation before doing this
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

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// TODOs
// Cleanup refactor
// Experiment drawing canvas upfront (should be fast, deal with weird loading during interaction bugs)
    // setTimeout on resize
    // Sample text updated 
// Message
    // Constrain (redo its position selection) to circles outside controllerWidth
    // Write new message
// Controller UX
    // Improve magnet suction (speed exponential with distance)
    // Magnet shake intensity & duration based on distance
    // Sounds
// Outro (progressive shake and return to intro)
// Play with distribution
// Play with dotting elements
// Optional refactoring
    // Use FSM (Intro, Normal, transition)