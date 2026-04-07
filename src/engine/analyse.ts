import { PauseProfile, SessionEditState, SessionTypingState, ToleranceProfile } from "@/types";
import { getEditWeight } from "./util";

interface GetTempoProfileProps {
    timestamps: number[];
}

type ShouldCountAsTyping = (
    inputType: string,
    isComposing: boolean,
) => boolean;

/**
 * 
 * @param inputType type of input as recorded by event onbeforeinput
 * @param isComposing if user is composing via IME language composer
 * @returns `boolean` if typing action should be recorded as timestamp for computing meanCPS, etc.
 */
export const shouldCountAsTyping: ShouldCountAsTyping = (inputType, isComposing) => {
    switch(inputType) {
        case "insertText": {
            return true;
        }
        case "insertCompositionText": {
            if(isComposing) return false;
            return true;
        }
        default: {
            return false;
        }
    }
}

// event-driven
/**
 * Calculate the latest time at which to expect user input, with deviation confidence of `2σ`
 * @param avgCPS mean average CPS collected in localProfile
 * @param devCPS standard deviation from mean average CPS
 * @param timestamp unix timestamp of current time
 * @returns `timestamp + t` time threshold before which to expect a new input.
 * @remarks event-driven in `Session`.
 */
export const getTypingTimeout = (avgCPS: number, devCPS: number, timestamp: number = new Date().getTime()): SessionTypingState => {
    const devConfidence = 2;

    // convert to ms
    const avgInterval = 1000 / avgCPS;
    const devInterval = 1000 / devCPS;

    const t = avgInterval + (devConfidence * devInterval);

    return {timeout: timestamp + t, interval: t};
}

type GetPauseTimeout = (
    pauseProfile: PauseProfile,
    typingTimeout: number,
    editSignal: number,
    fireTolerance: number,
) => {pauseTimeout: number, t: number};

/**
 * Calculate time threshold where pause will fire without further user input
 * @param pauseProfile session pause profile (with mean and deviation)
 * @param typingTimeout typing timeout calculated with `getTypingTimeout()`
 * @returns `timestamp + t` tiem threshold before which to expect input before firing
 * @remarks time-driven in `session`
 */
export const getPauseTimeout: GetPauseTimeout = (pauseProfile, typingTimeout, editSignal, fireTolerance) => {
    const devConfidence = 2;

    const t = pauseProfile.meanPause + (devConfidence * pauseProfile.deviation);

    const pauseTimeout = typingTimeout + getWeightedPauseThreshold(t, editSignal, fireTolerance);
    return {pauseTimeout, t}
}

type GetWeightedPauseInterval = (
    timeoutInterval: number,
    editSignal: number,
    fireTolerance: number,
) => number

export const getWeightedPauseThreshold: GetWeightedPauseInterval = (timeoutInterval, editSignal, fireTolerance) => {
    return (timeoutInterval - (1 - editSignal)) * (1.2 * Math.exp(-0.4 * fireTolerance));
}

/**
 * Processes new event with previous data from `SessionEditState` and adds new edit signal
 * @param editState session editing state captured from session state variables
 * @param editRate user profile edit rate
 * @param isTyping boolean value whether an event is a valid typing (insertion) event
 * @returns `SessionEditState` with updated state variables
 */
export const getEditLikelihood = (editState: SessionEditState, editRate: number, isTyping: boolean): SessionEditState => {
    if(!editState.prevLength) editState.prevLength = 0;
    const delta = Math.abs(editState.length - editState.prevLength)

    console.log(isTyping);

    if(delta === 0) {
        return { ...editState, effort: editState.effort++, consecutiveEdits: 0}
    }
    const expectedEditSize = Math.max(1, 1 / (editRate || 0.01));

    if(isTyping) {
        const DECAY_RATE = Math.exp(-delta / expectedEditSize);
        return {
            ...editState,
            prevLength: editState.length,
            progress: editState.progress + delta,
            effort: editState.effort + delta,
            consecutiveEdits: 0,
            signal: editState.signal * DECAY_RATE
        }
    }

    editState.consecutiveEdits = editState.consecutiveEdits + delta;
    const weight = getEditWeight(expectedEditSize, editState.consecutiveEdits);
    const spike = (1 - editState.signal) * weight;

    return {
        ...editState,
        prevLength: length,
        effort: editState.effort + delta,
        signal: editState.signal + spike
    }
}