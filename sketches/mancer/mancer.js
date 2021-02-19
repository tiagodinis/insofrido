import {Interpolator} from '../../scripts/modules/Interpolator.js';
import {Shaker, Shake} from '../../scripts/modules/Shaker.js';

// IDEAS
// Gravity & no gravity
// Cannon as key for doors (aim)
// Abilities: Hook shot, Stabilizer, Time stop, Drill (mounted opposite of)

// TODO
// Bullet firing bug
// Bullet management
    // Array
    // Collision
    // Lifetime
// Gizmos
// Anchor point
// Background grid (fix centering)
// Camera move with mouse
// Multiple forces
// Particle system

// Services
let interpolator, shaker;
// Parameters
let font;
let inWindow, halfWindow; // onResize
// State
let cam;
let squid;
let deltaSeconds;

const INTERPS = Object.freeze({"CAM_SHAKE":0, "FIRE":1});

function preload() {
    font = loadFont('../../fonts/raleway/Raleway-Bold.ttf');
    interpolator = new Interpolator();
    shaker = new Shaker();
}

function setup() { onResize(); }
window.addEventListener("resize", onResize);
function onResize() {
    textFont(font);
    inWindow = createVector(window.innerWidth, window.innerHeight);
    halfWindow = p5.Vector.mult(inWindow, 0.5);
    resizeCanvas(inWindow.x, inWindow.y);
    cam = new Camera2D(halfWindow);
    squid = new Squid();

    // anchor = createVector(0, 0);
    // anchorOffset = createVector(100, 100);
    // bullet = new Bullet(p5.Vector.add(anchor, anchorOffset), anchorOffset.heading());
}

function draw() {
    background(255);

    deltaSeconds = deltaTime / 1000;

    // if (mouseIsPressed && !shaker.has(INTERPS.CAM_SHAKE)) {
    //     const startPos = createVector(cam.pos.x, cam.pos.y);
    //     let shake = new Shake(INTERPS.CAM_SHAKE, 15, 60, 1000);
    //     shake.onCompute = (s) => cam.pos = p5.Vector.add(startPos, s.value);
    //     shaker.add(shake, interpolator);
    // }

    interpolator.update();
    shaker.update();
    cam.set();

    squid.update();
    if (bullet) bullet.update();

    drawGrid();
    if (bullet) bullet.draw();
    squid.draw();

    // push();
    //     fill(255);
    //     stroke(0);
    //     line(0, 0, anchorOffset.x, anchorOffset.y);
    //     circle(0, 0, 10);
    // pop();
}

const squareDim = 100;
function drawGrid() {
    // Compute values
    const nrCol = ceil(inWindow.x / squareDim);
    const nrRow = ceil(inWindow.y / squareDim);
    for(let i = 0; i < nrCol; ++i) {
        const width = i * squareDim - halfWindow.x;
        line(width, -halfWindow.y, width, halfWindow.y);
    }
    for(let i = 0; i < nrRow; ++i) {
        const height = i * squareDim - halfWindow.y;
        line(-halfWindow.x, height, halfWindow.x, height);
    }

}

let anchor;
let anchorOffset;
let bullet = null;
class Bullet {
    constructor(pos, angle) {
        // Parameters
        // State
        this.pos = pos;
        this.angle = angle;
        this.vel = createVector(0, 0);
    }

    update() {
        // Move
        this.pos.add(p5.Vector.mult(this.vel, deltaSeconds));
    }

    draw() {
        push();
            translate(this.pos.x, this.pos.y);
            rotate(this.angle);

            fill(0);
            noStroke();
            rectMode(CENTER);
            rect(0, 0, 30, 20);
            arc(17, 0, 30, 20, -HALF_PI, HALF_PI);
            fill(255);
            rect(16, 0, 2, 20);
        pop();
    }
}

class Squid {
    constructor() {
        // Parameters
        this.baseRadius = 25;
        this.cannonIdleDim = createVector(this.baseRadius * 1.6, 30);
        this.cannonFiredDim = createVector(this.baseRadius * 1.3, 40);
        this.animLockInterval = 600;
        this.resetInterval = 1000;
        this.resistance = 100;
        this.fireVelocity = 100;

        this.bulletOffset = createVector(23, 0);
        // State
        this.cannonDim = createVector(this.cannonIdleDim.x, this.cannonIdleDim.y);
        this.pos = createVector(0, 0);
        this.vel = createVector(0, 0);
        this.accel = createVector(0, 0);

        this.reloadBullet();
    }

    reloadBullet() {
        // bullet = new Bullet(this.bulletOffset, dir.heading() - PI);
        let dir = createVector(mouseX, mouseY).sub(this.pos).sub(cam.pos);
        let angle = dir.heading() - PI;
        let newDir = createVector(this.bulletOffset.x, this.bulletOffset.y).rotate(angle);
        this.bullet = new Bullet(newDir, angle);
    }

    fire() {
        // Set fired dimensions
        this.cannonDim.x = this.cannonFiredDim.x;
        this.cannonDim.y = this.cannonFiredDim.y;
        
        // Ease from fired to idle dimensions
        this.interp = interpolator.add(INTERPS.FIRE, 0, 1, this.resetInterval, 0.5);
        this.interp.onInterpolate = (i) => {
            this.cannonDim.x = lerp(this.cannonFiredDim.x, this.cannonIdleDim.x, i.value);
            this.cannonDim.y = lerp(this.cannonFiredDim.y, this.cannonIdleDim.y, i.value); };
        
        // Lock animation (can't fire) for animLockInterval
        this.lockedAnim = true;
        setTimeout(() => {
            this.reloadBullet();
            this.lockedAnim = false;
        }, this.animLockInterval);

        // Change velocity
        this.vel = createVector(mouseX, mouseY).sub(this.pos).sub(cam.pos).setMag(-this.fireVelocity);

        // Fire bullet (set it's velocity)
        let mouseLocal = createVector(mouseX, mouseY).sub(cam.pos).sub(this.pos);
        this.bullet.vel = mouseLocal.setMag(this.fireVelocity);
        bullet = this.bullet;
        this.bullet = null;
    }

    update() {
        if (mouseIsPressed && !this.lockedAnim) this.fire();

        // Position
        this.pos.add(p5.Vector.mult(this.vel, deltaSeconds));

        // Apply resistance
        let newMag = this.vel.mag() - this.resistance * deltaSeconds;
        this.vel.setMag(newMag <= 0 ? 0 : newMag);
    }

    draw() {
        let mouseLocal = createVector(mouseX, mouseY).sub(cam.pos).sub(this.pos);

        if (this.bullet) {
            this.bullet.angle = mouseLocal.heading();
            this.bullet.pos = p5.Vector.add(this.pos,
                createVector(this.bulletOffset.x, this.bulletOffset.y).rotate(this.bullet.angle));
            this.bullet.draw();
        }
        
        push();
            translate(this.pos.x, this.pos.y);
            // Draw base
            fill(0);
            noStroke();
            circle(0, 0, this.baseRadius * 2);
            // Draw cannon
            stroke(0);
            rotate(mouseLocal.heading());
            rect(0, -this.cannonDim.y * 0.5, this.cannonDim.x, this.cannonDim.y);
        pop();
    }
}

// (!) TEMP, better ways to solve the module problem
window.preload = preload;
window.setup = setup;
window.draw = draw;

// -- UTILS ----------------------------------------------------------------------------------------

class Camera2D {
    constructor(pos) {
        this.pos = createVector(pos.x, pos.y);
    }

    set() {
        translate(this.pos.x, this.pos.y);
    }
}

// Mouse world space: createVector(mouseX, mouseY).sub(cam.pos);
// Mouse local space: createVector(mouseX, mouseY).sub(cam.pos).sub(this.pos);