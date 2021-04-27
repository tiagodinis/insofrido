import {Interpolator} from '../../scripts/modules/Interpolator.js';

// Services
let interpolator;
// Parameters
let inWindow, halfWindow; // onResize
let ralewayFont;
// State
let deltaSeconds;


function preload() {
    ralewayFont = loadFont('../../fonts/raleway/Raleway-Bold.ttf');

    // (!) TEMP
    img = loadImage('../../images/flower.jpg');
}

function setup() {
    interpolator = new Interpolator();
    textFont(ralewayFont);

    sectionScrollers = [
        new ScrollSection(img, 0, 0, 1, 1, -2, 0, true),
    ]

    mask = createGraphics(img.width, img.height);

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
}

let mask;
let img;
let imgDim;
let sectionScrollers;

// -------------------------------------------------------------------------------------------------

function draw() {
    deltaSeconds = deltaTime / 1000;
    background(100, );

    mask.background(255, 255, 255, 100);
    // mask.fill(30);
    // mask.circle(mouseX, mouseY, 50);
    // image(mask, halfWindow.x, halfWindow.y);
    img.mask(mask);
    image(img, 0, 0);

    // for (let i = 0; i < sectionScrollers.length; ++i) {
    //     sectionScrollers[i].updateScroll();
    //     sectionScrollers[i].draw();
    //     // sectionScrollers[i].drawImgClamped();

    //     push();
    //     noFill();
    //     rect(sectionScrollers[i].tl.x, sectionScrollers[i].tl.y,
    //          sectionScrollers[i].dim.x, sectionScrollers[i].dim.y);
    //     pop();
    // }



    interpolator.update();
}

class ScrollSection {
    constructor(img, tlxP = 0, tlyP = 0, brxP = 1, bryP = 1, xInterval = 0, yInterval = 0, clamped = false) {
        // Parameters
        this.img = img;
        this.minP = createVector(tlxP, tlyP);
        this.maxP = createVector(brxP, bryP);
        this.intervals = createVector(abs(xInterval), abs(yInterval));
        this.clamped = clamped;
        this.scrollDir = createVector(xInterval > 0 ? 1 : (xInterval < 0 ? -1 : 0),
                                      yInterval > 0 ? 1 : (yInterval < 0 ? -1 : 0));
        // State
        this.elapsedScroll = createVector(0, 0);
        this.scrollX = 0; // [0, 1]
        this.scrollY = 0; // [0, 1]
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
        this.scrollingOffset = p5.Vector.mult(imgDim, this.scrollDir);
    }

    updateScroll() {
        this.elapsedScroll.add(deltaSeconds, deltaSeconds);
        if (this.elapsedScroll.x > this.intervals.x) this.elapsedScroll.x -= this.intervals.x;
        if (this.elapsedScroll.y > this.intervals.y) this.elapsedScroll.y -= this.intervals.y;
        if (this.intervals.x !== 0) this.scrollX = this.elapsedScroll.x / this.intervals.x;
        if (this.intervals.y !== 0) this.scrollY = this.elapsedScroll.y / this.intervals.y;
    }

    draw() {
        image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
                this.origTL.x, this.origTL.y, this.origDim.x, this.origDim.y);

    //   if (this.clamped) {
    //     const scrolledDim = p5.Vector.mult(this.dim, [this.scrollX, this.scrollY]);
    //     const scrolledOrigDim = p5.Vector.mult(this.origDim, [this.scrollX, this.scrollY]);
    //     // const a = ;
    //     // const c = ;
    //     // const d = ;

    //     image(this.img,
    //         this.tl.x + scrolledDim.x * constrain(this.scrollDir.x, 0, 1),
    //         this.tl.y + scrolledDim.y * constrain(this.scrollDir.y, 0, 1),
    //         this.dim.x - scrolledDim.x,
    //         this.dim.y - scrolledDim.y,
    //         this.origTL.x + scrolledOrigDim.x * constrain(-this.scrollDir.x, 0, 1),
    //         this.origTL.y + scrolledOrigDim.y * constrain(-this.scrollDir.y, 0, 1),
    //         this.origDim.x - scrolledOrigDim.x,
    //         this.origDim.y - scrolledOrigDim.y);

    //     image(this.img,
    //         this.tl.x + this.dim.x * (1 - this.scrollX) * constrain(-this.scrollDir.x, 0, 1),
    //         this.tl.y + this.dim.y * (1 - this.scrollY) * constrain(-this.scrollDir.y, 0, 1),
    //         this.scrollX === 0 ? this.dim.x : scrolledDim.x,
    //         this.scrollY === 0 ? this.dim.y : scrolledDim.y,
    //         this.origTL.x + this.origDim.x * (1 - this.scrollX) * constrain(this.scrollDir.x, 0, 1),
    //         this.origTL.y + this.origDim.y * (1 - this.scrollY) * constrain(this.scrollDir.y, 0, 1),
    //         this.scrollX === 0 ? this.origDim.x : this.origDim.x * this.scrollX,
    //         this.scrollY === 0 ? this.origDim.y : this.origDim.y * this.scrollY);
    //   } else {
    //     const leader = p5.Vector.mult(this.scrollingOffset, [this.scrollX, this.scrollY]).add(this.origTL);
    //     const backup = p5.Vector.mult(this.scrollingOffset, [this.scrollX - 1, this.scrollY - 1]).add(this.origTL);
    //     image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
    //             leader.x, leader.y, this.origDim.x, this.origDim.y);
    //     image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
    //             backup.x, backup.y, this.origDim.x, this.origDim.y);
    //     image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
    //             leader.x, backup.y, this.origDim.x, this.origDim.y);
    //     image(  this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
    //             backup.x, leader.y, this.origDim.x, this.origDim.y);
    //   }
    }

    drawImgClamped() {
        // const leader = p5.Vector.mult(p5.Vector.mult(this.dim, this.scrollDir), [this.scrollX, this.scrollY]);


        // image(this.img,
        //     this.tl.x,
        //     this.tl.y + this.dim.y * (1 - this.scrollY) * constrain(-this.scrollDir.y, 0, 1),
        //     this.dim.x,
        //     this.dim.y * this.scrollY,
        //     this.origTL.x,
        //     this.origTL.y + this.origDim.y * (1 - this.scrollY) * constrain(this.scrollDir.y, 0, 1),
        //     this.origDim.x,
        //     this.origDim.y * this.scrollY);

        // image(this.img,
        //     this.tl.x + this.dim.x * (1 - this.scrollX) * constrain(-this.scrollDir.x, 0, 1),
        //     this.tl.y,
        //     this.dim.x * this.scrollX,
        //     this.dim.y,
        //     this.origTL.x + this.origDim.x * (1 - this.scrollX) * constrain(this.scrollDir.x, 0, 1),
        //     this.origTL.y,
        //     this.origDim.x * this.scrollX,
        //     this.origDim.y);
    }
}


// this.origTL.x = floor(this.origTL.x); this.origTL.y = floor(this.origTL.y);
// this.origDim.x = floor(this.origDim.x); this.origDim.y = floor(this.origDim.y);
// this.tl.x = floor(this.tl.x); this.tl.y = floor(this.tl.y);
// this.dim.x = floor(this.dim.x); this.dim.y = floor(this.dim.y);
// const leader = createVector(floor(this.scrolling.x * scrollP), floor(this.scrolling.y * scrollP));
// const backup = createVector(floor(this.scrolling.x * (scrollP - 1)), floor(this.scrolling.y * (scrollP - 1)));

// TODOs
// Apply cutting to original image too
// Split image
// Split line
// Scroll both
// Scrolling edges don't touch (change background color to see)

// 

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;