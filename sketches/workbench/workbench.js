let pg;

function preload() {
}

function setup() { 
    createCanvas(100, 100);
    pg = createGraphics(100, 100);
}

function draw() {
    background(200);
    pg.background(100);
    pg.noStroke();
    pg.ellipse(pg.width / 2, pg.height / 2, 50, 50);
    image(pg, 50, 50);
    image(pg, 0, 0, 50, 50);
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;