// (!) onEnter and onUpdate can return state transitions, unlike onExit
// (!) startingState onEnter() must be called manually, if required
export class FSM {
    constructor(stateMap, startingState) {
        this.stateMap = stateMap;
        this.currentState = startingState;
    }

    update() {
        this.transition(this.currentState.onUpdate());
    }

    transition(stateTransition) {
        if (stateTransition == null) return; // ---

        // There is a transition. Check for exit actions, transition, check for enter actions
        if (stateTransition.hasExitActions) this.currentState.onExit();
        this.currentState = this.stateMap.get(stateTransition.targetState);
        if (stateTransition.hasEnterActions) this.transition(this.currentState.onEnter());
    }
}

export class StateTransition {
    constructor(targetState, hasEnterActions = true, hasExitActions = true) {
        this.targetState = targetState;
        this.hasEnterActions = hasEnterActions;
        this.hasExitActions = hasExitActions;
    }
}