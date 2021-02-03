// Inspiration: https://cdn.discordapp.com/attachments/746438898615320636/762034798789001226/EhRWE2iU0AEEBZH.jpg
// TODOs
    // Change between 5 modes: QUADRANT, AUTH_LEFT, AUTH_RIGHT, LIB_LEFT, LIB_RIGHT
        // Quadrant selection animation
        // Go back button
    // Hovering quadrant font-size ease up
    // Quadrant edge artifacts (make sure they fit, no floating point white space)

// -------------------------------------------------------------------------------------------------

// Parameters
let oX, oY;
let font, fontSize;
const hoveredDarkenMult = 0.9;
const normalFont = 64;
const smallFont = 32;
// State
let quadrantList = [];

// -------------------------------------------------------------------------------------------------

function preload() {
    font = loadFont('fonts/raleway/Raleway-Bold.ttf');
    createCanvas(0, 0);

    quadrantList.push(new Quadrant('Centralized', createVector(0, 0), createVector(255, 183, 186)));
    quadrantList.push(new Quadrant('Hierarchical', createVector(1, 0), createVector(120, 219, 251)));
    quadrantList.push(new Quadrant('Consensus', createVector(0, 1), createVector(191, 230, 185)));
    quadrantList.push(new Quadrant('Emergent', createVector(1, 1), createVector(244, 247, 156)));
}

function setup() { init(); }

window.addEventListener("resize", init);

function init() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    oX = window.innerWidth * 0.5;
    oY = window.innerHeight * 0.5;

    const isSmallScreen = window.innerHeight < 700;
    fontSize = isSmallScreen ? smallFont : normalFont;

    for (i = 0; i < quadrantList.length; ++i) quadrantList[i].setPos();
}

function draw() {
    background(255);

    // Test collision
    let hoveredQuadrantIndex = (mouseX > oX ? 1 : 0) + (mouseY > oY ? 2 : 0);

    if (mouseIsPressed) {

    }

    // Draw quadrants
    cursor(HAND);
    textFont(font);
    textSize(fontSize);
    textAlign(CENTER);
    for (i = 0; i < quadrantList.length; ++i)
        quadrantList[i].draw(hoveredQuadrantIndex === i);
}

class Quadrant {
    constructor(title, offset, colorVec) {
        this.title = title;
        this.offset = offset;
        this.color = color(colorVec.x, colorVec.y, colorVec.z);
        colorVec.mult(hoveredDarkenMult);
        this.hoveredColor = color(colorVec.x, colorVec.y, colorVec.z);
    }

    setPos() {
        this.pos = createVector(oX, oY).mult(this.offset);
        this.titlePos = createVector(oX * 0.5, oY * 0.5).add(this.pos);
    }

    draw(hovered) {
        fill(hovered ? this.hoveredColor : this.color);
        rect(this.pos.x, this.pos.y, oX, oY);
        fill(0);
        text(this.title, this.titlePos.x, this.titlePos.y);
    }
}

// -- UTILS ----------------------------------------------------------------------------------------

let interpolationMap = new Map();

{
    function getInterpValue(key) {
        return interpolationMap.get(key).currentValue;
    }
    
    class Interpolation {
        constructor(start, end, interval, gain = 0, bias = 0, iterations = 1,
                    reverse = false, alternate = false) {
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
}
