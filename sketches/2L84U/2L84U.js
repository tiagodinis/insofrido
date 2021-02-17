let workspaceColor;
let gridColor;
let bodyRedColor;
let bodyGreenColor;
let wickRedColor;
let wickGreenColor;

let candleStickWidth = 30;
let halfCandleStickWidth = candleStickWidth * 0.5;
let candleStickSpacing = 10;
let cStickArr;

let oX, oY;
// TODOs
    // Random generation
        // Anchor points 
            // Major, medium, minor with gizmos (dots and straight lines)
            // ?? Google: common market patterns and create a library of it
            // ?? Intermediate points Bezier curve
        // CandleSticks
            // Based on majo patterns

    // Scale when difference too big?
        // That would imply bigger size
    
    // Scrolling (with generation)

// TEMP
const nrCSticks = 10;

function setup() {
    createCanvas(windowWidth, windowHeight);

    workspaceColor = color('#191B20FF');
    gridColor = color('#2B2F36FF');
    bodyRedColor = color('#E0294AFF');
    bodyGreenColor = color('#2EBD85FF');
    wickRedColor = color('#7F323FFF');
    wickGreenColor = color('#336854FF');

    oX = windowWidth * 0.5;
    oY = windowHeight * 0.5;

    // cStickArr = [];
    // for (i = 0; i < nrCSticks; ++i)
    //     cStickArr.push(new Candlestick(50, 0, -20, 150));
}

// Rules
    // x close is x + 1 open
    // high >= open || high >= close
    // low >= open || low >= close

function draw() {
    background(workspaceColor);

    for (i = 0; i < cStickArr.length; ++i)
        cStickArr[i].draw(i * (candleStickSpacing + candleStickWidth));
    
    fill(255);
    let dim = 5; let halfDim = dim * 0.5;
    rect(oX - halfDim, oY - halfDim, dim, dim);
}

class Candlestick {
    constructor(open, close, low, high) {
        this.open = open;
        this.close = close;
        this.low = low;
        this.high = high;
    }

    draw(x) {
        let up = this.close > this.open;

        push();
            translate(oX, oY); // Go to origin
            translate(x, -this.open); // Go to open position

            // Draw line
            stroke(up ? wickGreenColor : wickRedColor);
            let lowOffset = abs(this.open - this.low);
            let highOffset = abs(this.open - this.high);
            line(0, lowOffset, 0, -highOffset);
            
            noStroke();
            fill(up ? bodyGreenColor : bodyRedColor);
            rect(-halfCandleStickWidth, 0, candleStickWidth, this.open - this.close);
        pop();
    }
}

// -- UTILS ----------------------------------------------------------------------------------------

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