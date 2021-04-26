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

    // sectionScrollers = [
    //     // new ScrollSection(img),
    //     new ScrollSection(img, 0.25, 0.25, 0.75, 0.75, -5, 0),
    //     // new ScrollSection(img, 0, 0, 1, 1, 0, 10),
    //     // new ScrollSection(img, .25, .25, 1, 1, 1, 1),
    // ]
    // ss1 = new ScrollSection(img, 0, 0, 1, 1, 1, -1);

    createCanvas(100, 100, WEBGL);
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

    // for (let i = 0; i < sectionScrollers.length; ++i)
    //     sectionScrollers[i].setDimensions(imgPos, imgDim);
}

let img;
let imgDim;
// let sectionScrollers;

// -------------------------------------------------------------------------------------------------

function draw() {
    deltaSeconds = deltaTime / 1000;
    background(100);
    noStroke();
    texture(img);
    plane(imgDim.x, imgDim.y);
    // for (let i = 0; i < sectionScrollers.length; ++i) {
    //     // sectionScrollers[i].updateScroll();
    //     // sectionScrollers[i].drawImg();
    //     // sectionScrollers[i].drawImgClamped();
    // }
    interpolator.update();
}

// class ScrollSection {
//     constructor(img, tlxP = 0, tlyP = 0, brxP = 1, bryP = 1, xInterval = 0, yInterval = 0, clamped = false) {
//         // Parameters
//         this.img = img;
//         this.minP = createVector(tlxP, tlyP);
//         this.maxP = createVector(brxP, bryP);
//         this.scrollDir = createVector(xInterval > 0 ? 1 : (xInterval < 0 ? -1 : 0),
//                                       yInterval > 0 ? 1 : (yInterval < 0 ? -1 : 0));
//         this.intervals = createVector(abs(xInterval), abs(yInterval));
//         this.clamped = clamped;
//         // State
//         this.elapsedScroll = createVector(0, 0);
//         this.scrollX = 0;
//         this.scrollY = 0;
//     }

//     setDimensions(iPos, iDim) {
//         const imgDim = createVector(this.img.width, this.img.height);
//         const origBR = p5.Vector.mult(imgDim, this.maxP);
//         const br = p5.Vector.add(iPos, p5.Vector.mult(iDim, this.maxP));
//         // Parameters
//         this.origTL = p5.Vector.mult(imgDim, this.minP);
//         this.origDim = origBR.sub(this.origTL);
//         this.tl = p5.Vector.add(iPos, p5.Vector.mult(iDim, this.minP));
//         this.dim = br.sub(this.tl);
//         this.scrollingOffset = imgDim.mult(this.scrollDir);

//         console.log(this.scrollX);
//     }

//     updateScroll() {
//         this.elapsedScroll.add(deltaSeconds, deltaSeconds);
//         if (this.elapsedScroll.x > this.intervals.x) this.elapsedScroll.x -= this.intervals.x;
//         if (this.elapsedScroll.y > this.intervals.y) this.elapsedScroll.y -= this.intervals.y;
//         if (this.intervals.x !== 0) this.scrollX = this.elapsedScroll.x / this.intervals.x;
//         if (this.intervals.y !== 0) this.scrollY = this.elapsedScroll.y / this.intervals.y;
//     }

//     drawImg() {
//         const leader = p5.Vector.mult(this.scrollingOffset, [this.scrollX, this.scrollY]);
//         const backup = p5.Vector.mult(this.scrollingOffset, [this.scrollX - 1, this.scrollY - 1]);

//         // image(this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
//         //       this.origTL.x + leader.x, this.origTL.y + leader.y, this.origDim.x, this.origDim.y);
//         // image(this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
//         //       this.origTL.x + backup.x, this.origTL.y + backup.y, this.origDim.x, this.origDim.y);
//         // image(this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
//         //       this.origTL.x + leader.x, this.origTL.y + backup.y, this.origDim.x, this.origDim.y);
//         // image(this.img, this.tl.x, this.tl.y, this.dim.x, this.dim.y,
//         //       this.origTL.x + backup.x, this.origTL.y + leader.y, this.origDim.x, this.origDim.y);

//         push();
//         noFill();
//         rect(this.tl.x, this.tl.y, this.dim.x, this.dim.y);
//         pop();
//     }

// // TODO experiments with TEXTURES

//     drawImgClamped() {
//         const leader = p5.Vector.mult(this.dim, [this.scrollX, this.scrollY]);

//         // image(this.img,
//         //     this.tl.x + leader.x,
//         //     this.tl.y + leader.y,
//         //     this.dim.x - leader.x,
//         //     this.dim.y - leader.y,
//         //     this.origTL.x,
//         //     this.origTL.y,
//         //     this.origDim.x - this.origDim.x * this.scrollX,
//         //     this.origDim.y - this.origDim.y * this.scrollY);

//         image(this.img,
//             this.tl.x,
//             this.tl.y,
//             this.dim.x,
//             this.dim.y,
//             this.origTL.x + this.origDim.x,
//             this.origTL.y,
//             this.origDim.x,
//             this.origDim.y);

//         // image(this.img,
//         //     this.tl.x + leader.x - this.dim.x,
//         //     this.tl.y + leader.y - this.dim.y,
//         //     this.dim.x, this.dim.y, this.origTL.x, this.origTL.y, this.origDim.x, this.origDim.y);

//         push();
//         noFill();
//         rect(this.tl.x, this.tl.y, this.dim.x, this.dim.y);
//         pop();
//     }
// }


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