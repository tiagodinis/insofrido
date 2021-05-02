export class SimpleSpring {
    constructor(dampness, strength, target) {
        // Parameters
        this.dampness = dampness;
        this.strength = strength;
        // State
        this.target = target;
        this.vel = createVector(0, 0);
    }

    update(goal) {
        const force = p5.Vector.sub(goal, this.target).mult(this.strength);
        return this.target.add(this.vel.mult(this.dampness).add(force));
    }
}

export function moveTowards(current, goal, step) {
    return (goal - current) * step;
}

export function moveTowardsVec(current, goal, step) {
    return p5.Vector.sub(goal, current).mult(step);
}