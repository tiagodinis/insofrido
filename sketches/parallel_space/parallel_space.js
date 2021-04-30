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
    img = loadImage('../../images/tests/flower.jpg');
}

function setup() {
    interpolator = new Interpolator();
    textFont(ralewayFont);

    sectionScrollers = [
        // new ScrollSection(img, 0, 0, 1, 1, -10, 0, false),
        // new ScrollSection(img, .05, .05, .95, .95, 9, 0, false),
        // new ScrollSection(img, .1, .1, .9, .9, -8, 0, false),
        // new ScrollSection(img, .15, .15, .85, .85, 7, 0, false),
        // new ScrollSection(img, .2, .2, .8, .8, -6, 0, false),
        // new ScrollSection(img, .25, .25, .75, .75, 5, 0, false),
        // new ScrollSection(img, .3, .3, .7, .7, -4, 0, false),
        // new ScrollSection(img, .35, .35, .65, .65, 3, 0, false),
        // new ScrollSection(img, .4, .4, .6, .6, -2, 0, false),
        // new ScrollSection(img, .45, .45, .55, .55, 1, 0, false),

        new ScrollSection(img, 0, 0, 1, 1, -4, 0, false),
        // new ScrollSection(img, 0.2, 0.2, .8, .8, 4, 0, true),
        // new ScrollSection(img, 0.5, 0.4, .6, .6, 0, -4, true),
        // new ScrollSection(img, 0.4, 0.4, .5, .6, 0, 4, true),
        // new ScrollSection(img, 0.4, 0.4, .5, .6, 1, 4, false, false),
    ]

    onResize();
}
window.addEventListener("resize", onResize);
function onResize() {
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y, true);
    deltaSeconds = 0;

    // SCALE TO FIT
    const frameBorder = 0;
    let frameDim = createVector(inWindow.x - frameBorder, inWindow.y - frameBorder);
    imgDim = createVector(img.width, img.height);
    let ifRatio = createVector(imgDim.x / frameDim.x, imgDim.y / frameDim.y);
    const biggestRatio = max(ifRatio.x, ifRatio.y);
    if (biggestRatio > 1) imgDim.div(biggestRatio);
    let imgPos = createVector(inWindow.x - frameDim.x, inWindow.y - frameDim.y).mult(0.5);
    if (ifRatio.x < ifRatio.y) imgPos.x += (frameDim.x - imgDim.x) * 0.5;
    else if (ifRatio.y < ifRatio.x) imgPos.y += (frameDim.y - imgDim.y) * 0.5;

    for (let i = 0; i < sectionScrollers.length; ++i)
        sectionScrollers[i].setDimensions(imgPos, imgDim);

    let stateMap = new Map([
        [STATES.Idle, new IdleState()],
    ]);
    fsm = new FSM(stateMap, stateMap.get(STATES.Idle));
}

let img;
let imgDim;
let sectionScrollers;

// -------------------------------------------------------------------------------------------------
const STATES = Object.freeze({"Idle":"IdleState"});

class IdleState {
    onEnter() {}
    onExit() {}
    onUpdate() {
        for (let i = 0; i < sectionScrollers.length; ++i) {
            sectionScrollers[i].updateScroll();
            sectionScrollers[i].draw();

            // push();
            // noFill();
            // rect(sectionScrollers[i].tl.x, sectionScrollers[i].tl.y,
            //      sectionScrollers[i].dim.x, sectionScrollers[i].dim.y);
            // pop();
        }
    }
}

// -------------------------------------------------------------------------------------------------

function draw() {
    deltaSeconds = deltaTime / 1000;
    background(100);
    fsm.update();
    interpolator.update();
}

class ScrollSectionClamped {
    constructor(img, tlxP = 0, tlyP = 0, brxP = 1, bryP = 1, xInterval = 0, yInterval = 0, inert = false, startX = 0, startY = 0) {
        // Parameters
        this.img = img;
        this.minP = createVector(tlxP, tlyP);
        this.maxP = createVector(brxP, bryP);
        this.intervals = createVector(abs(xInterval), abs(yInterval));
        this.clamped = clamped;
        this.inert = inert;
        this.scrollDir = createVector(xInterval > 0 ? 1 : (xInterval < 0 ? -1 : 0),
                                      yInterval > 0 ? 1 : (yInterval < 0 ? -1 : 0));
        // State
        this.elapsed = createVector(startX, startY);
        this.scroll = createVector(startX / xInterval, startY / yInterval);
    }

    setDimensions() {
        const imgDim = createVector(this.img.width, this.img.height);
        const origBR = p5.Vector.mult(imgDim, this.maxP);
        const br = p5.Vector.add(iPos, p5.Vector.mult(iDim, this.maxP));
        // Parameters
        this.origTL = p5.Vector.mult(imgDim, this.minP);
        this.origDim = origBR.sub(this.origTL);
        this.tl = p5.Vector.add(iPos, p5.Vector.mult(iDim, this.minP));
        this.dim = p5.Vector.sub(br, this.tl);

        // Precomputations
        const sDir = createVector(constrain(this.scrollDir.x, 0, 1), constrain(this.scrollDir.y, 0, 1));
        const sDir2 = createVector(constrain(-this.scrollDir.x, 0, 1), constrain(-this.scrollDir.y, 0, 1));
        this.tlTarget = p5.Vector.mult(this.dim, sDir);
        this.origTLTarget = p5.Vector.mult(this.origDim, sDir2);
        this.tlTargetNeg = p5.Vector.mult(this.dim, sDir2);
        this.origTLTargetNeg = p5.Vector.mult(this.origDim, sDir);
        this.dimTargetNeg = p5.Vector.mult(this.dim, [abs(this.scrollDir.x), abs(this.scrollDir.y)]);
        this.origDimTargetNeg = p5.Vector.mult(this.origDim, [abs(this.scrollDir.x), abs(this.scrollDir.y)]);
    }

    draw() {
        const leaderDim = p5.Vector.sub(this.dim, p5.Vector.mult(this.dim, this.scroll));
        const leaderPos = p5.Vector.mult(this.tlTarget, this.scroll).add(this.tl);
        const leaderDimOrig = p5.Vector.sub(this.origDim, p5.Vector.mult(this.origDim, this.scroll));
        const leaderPosOrig = p5.Vector.mult(this.origTLTarget, this.scroll).add(this.origTL);

        const negScroll = createVector(1, 1).sub(this.scroll);
        const backupDim = p5.Vector.sub(this.dim, p5.Vector.mult(negScroll, this.dimTargetNeg));
        const backupDimOrig = p5.Vector.sub(this.origDim, p5.Vector.mult(negScroll, this.origDimTargetNeg));
        const backupPos = p5.Vector.mult(negScroll, this.tlTargetNeg).add(this.tl);
        const backupPosOrig = p5.Vector.mult(negScroll, this.origTLTargetNeg).add(this.origTL);

        image(  this.img, leaderPos.x, leaderPos.y, leaderDim.x, leaderDim.y,
                leaderPosOrig.x, leaderPosOrig.y, leaderDimOrig.x, leaderDimOrig.y);
        image(  this.img, backupPos.x, backupPos.y, backupDim.x,  backupDim.y,
                backupPosOrig.x, backupPosOrig.y, backupDimOrig.x, backupDimOrig.y);
        image(  this.img, backupPos.x, leaderPos.y, backupDim.x, leaderDim.y,
                backupPosOrig.x, leaderPosOrig.y, backupDimOrig.x, leaderDimOrig.y);
        image(  this.img, leaderPos.x, backupPos.y, leaderDim.x, backupDim.y,
                leaderPosOrig.x, backupPosOrig.y, leaderDimOrig.x, backupDimOrig.y);
    }
}

class ScrollSection {
    constructor(img, tlxP = 0, tlyP = 0, brxP = 1, bryP = 1, xInterval = 0, yInterval = 0, clamped = false, inert = false, startX = 0, startY = 0) {
        // Parameters
        this.img = img;
        this.minP = createVector(tlxP, tlyP);
        this.maxP = createVector(brxP, bryP);
        this.intervals = createVector(abs(xInterval), abs(yInterval));
        this.clamped = clamped;
        this.inert = inert;
        this.scrollDir = createVector(xInterval > 0 ? 1 : (xInterval < 0 ? -1 : 0),
                                      yInterval > 0 ? 1 : (yInterval < 0 ? -1 : 0));
        // State
        this.elapsed = createVector(startX, startY);
        this.scroll = createVector(startX / xInterval, startY / yInterval);
    }

    setDimensions(iPos, iDim) {
        const imgDim = createVector(this.img.width, this.img.height);
        const origBR = p5.Vector.mult(imgDim, this.maxP);
        const br = p5.Vector.add(iPos, p5.Vector.mult(iDim, this.maxP));
        // Parameters
        this.origTL = p5.Vector.mult(imgDim, this.minP);
        this.origDim = origBR.sub(this.origTL);
        this.tl = p5.Vector.add(iPos, p5.Vector.mult(iDim, this.minP));
        this.dim = p5.Vector.sub(br, this.tl);

        // Unclamped precompute
        this.dimTarget = p5.Vector.mult(imgDim, this.scrollDir);
        // Clamped precomputes
        const sDir = createVector(constrain(this.scrollDir.x, 0, 1), constrain(this.scrollDir.y, 0, 1));
        const sDir2 = createVector(constrain(-this.scrollDir.x, 0, 1), constrain(-this.scrollDir.y, 0, 1));
        this.tlTarget = p5.Vector.mult(this.dim, sDir);
        this.origTLTarget = p5.Vector.mult(this.origDim, sDir2);
        this.tlTargetNeg = p5.Vector.mult(this.dim, sDir2);
        this.origTLTargetNeg = p5.Vector.mult(this.origDim, sDir);
        this.dimTargetNeg = p5.Vector.mult(this.dim, [abs(this.scrollDir.x), abs(this.scrollDir.y)]);
        this.origDimTargetNeg = p5.Vector.mult(this.origDim, [abs(this.scrollDir.x), abs(this.scrollDir.y)]);
    }

    updateScroll() {
        if (this.inert) return; // ---

        this.elapsed.add(deltaSeconds, deltaSeconds);
        if (this.elapsed.x > this.intervals.x) this.elapsed.x -= this.intervals.x;
        if (this.elapsed.y > this.intervals.y) this.elapsed.y -= this.intervals.y;
        if (this.intervals.x !== 0) this.scroll.x = this.elapsed.x / this.intervals.x;
        if (this.intervals.y !== 0) this.scroll.y = this.elapsed.y / this.intervals.y;
    }

    draw() {
      if (this.clamped) {
        const leaderDim = p5.Vector.sub(this.dim, p5.Vector.mult(this.dim, this.scroll));
        const leaderPos = p5.Vector.mult(this.tlTarget, this.scroll).add(this.tl);
        const leaderDimOrig = p5.Vector.sub(this.origDim, p5.Vector.mult(this.origDim, this.scroll));
        const leaderPosOrig = p5.Vector.mult(this.origTLTarget, this.scroll).add(this.origTL);

        const negScroll = createVector(1, 1).sub(this.scroll);
        const backupDim = p5.Vector.sub(this.dim, p5.Vector.mult(negScroll, this.dimTargetNeg));
        const backupDimOrig = p5.Vector.sub(this.origDim, p5.Vector.mult(negScroll, this.origDimTargetNeg));
        const backupPos = p5.Vector.mult(negScroll, this.tlTargetNeg).add(this.tl);
        const backupPosOrig = p5.Vector.mult(negScroll, this.origTLTargetNeg).add(this.origTL);

        image(  this.img, leaderPos.x, leaderPos.y, leaderDim.x, leaderDim.y,
                leaderPosOrig.x, leaderPosOrig.y, leaderDimOrig.x, leaderDimOrig.y);
        image(  this.img, backupPos.x, backupPos.y, backupDim.x,  backupDim.y,
                backupPosOrig.x, backupPosOrig.y, backupDimOrig.x, backupDimOrig.y);
        image(  this.img, backupPos.x, leaderPos.y, backupDim.x, leaderDim.y,
                backupPosOrig.x, leaderPosOrig.y, backupDimOrig.x, leaderDimOrig.y);
        image(  this.img, leaderPos.x, backupPos.y, leaderDim.x, backupDim.y,
                leaderPosOrig.x, backupPosOrig.y, leaderDimOrig.x, backupDimOrig.y);
      } else {
        const leader = p5.Vector.sub(this.origTL, p5.Vector.mult(this.scroll, this.dimTarget));
        const backup = p5.Vector.sub(this.origTL, p5.Vector.sub(this.scroll, [1, 1]).mult(this.dimTarget));

        image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
                leader.x, leader.y, this.origDim.x, this.origDim.y);
        image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
                backup.x, backup.y, this.origDim.x, this.origDim.y);
        image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
                leader.x, backup.y, this.origDim.x, this.origDim.y);
        image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
                backup.x, leader.y, this.origDim.x, this.origDim.y);
      }
    }
}

// TODOs
// Scrolling edges don't touch (change background color to see)
// Explore inheritance
// Explore spring animations
// Scroll animation (receive function instead of constant linear)
// Scrollrect position can be animated
// Test masking for other types of frames


// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;