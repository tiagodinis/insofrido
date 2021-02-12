export class Toggle {
    constructor(activate, deactivate) {
        this.on = false;
        this.activate = activate;
        this.deactivate = deactivate;
    }

    set(newState) {
        if (this.on === newState) return; // ---
        this.on = newState;
        this.on ? this.activate() : this.deactivate();
    }
}