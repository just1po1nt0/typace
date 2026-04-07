import { getEditLikelihood, getPauseTimeout, getTypingTimeout, shouldCountAsTyping } from "./analyse";
import { updateEditProfile, updateLocalPauseProfile, updateLocalTempoProfile, updateToleranceProfile } from "@/profile/update";
import { truncateOldTimestamps } from "./util";
import { sessionStore } from "./store";
import { PauseProfile } from "@/types";
import profileController from "@/profile/profile";

const CYCLE_DURATION_MS = 20;
const HISTORY_LIMIT_MS = 5000;

let intervalId: NodeJS.Timeout | null = null;

/**
 * Facilitates atomic mutations to prevent overwriting data between event-driven and time-driven flows
 * @param updater function with previous value of `state`
 */
//const mutate = (updater: (curr: typeof state) => Partial < typeof state > ) => {
//    state = {
//        ...state,
//        ...updater(state)
//    };
//}

const startSession = () => {
    if (!intervalId) {
        intervalId = setInterval(processTick, CYCLE_DURATION_MS);
    }
};

const stopSession = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        const state = sessionStore.getState();
        profileController.updateProfile({
            ...state.profile,
            editProfile: updateEditProfile(state.profile.editProfile, state.edit)
        });
        
        sessionStore.setState(() => sessionStore.getInitialState());
    } else {
        throw new Error("Interval ID not found. Execution failed.");
    }
};

const cleanTimestamps = (timestamps: number[], now: number) => {
    return truncateOldTimestamps(timestamps, HISTORY_LIMIT_MS, now);
};

const processTick = () => {
    if (sessionStore.getState().terminated) stopSession();
    const now = Date.now();

    sessionStore.setState((curr) => {
        const cleanedTimestamps = cleanTimestamps([...curr.timestamps], performance.now());
        
        // Extracted repetitive base state updates
        const state = { 
            ...curr, 
            timestamps: cleanedTimestamps 
        };

        if (state.typing.timeout > now) {
            const interval = state.pause.start ? now - state.pause.start : undefined;
            const intervals = interval ? [...state.pause.intervals, interval] : state.pause.intervals;
            const pauseProfile = state.fire.hasFired
                ? updateLocalPauseProfile(state.profile.pauseProfile, intervals, true, true)
                : updateLocalPauseProfile(state.profile.pauseProfile, intervals);

            return {
                ...state,
                profile: {
                    ...state.profile,
                    pauseProfile: pauseProfile,
                    toleranceProfile: state.fire.hasFired 
                        ? updateToleranceProfile(state.profile.toleranceProfile, false) 
                        : state.profile.toleranceProfile
                },
                pause: {
                    ...state.pause,
                    start: null,
                    intervals: intervals,
                    awaitedFalsePositive: false,
                },
                fire: {
                    ...state.fire,
                    hasFired: false,
                }
            };
        }

        const start = !state.pause.start ? now : state.pause.start;
        // right now this will recalculate every time the conditions are met with the same outcome
        const { pauseTimeout, t } = getPauseTimeout(state.profile.pauseProfile, state.typing.timeout, state.edit.signal, state.profile.toleranceProfile.fireTolerance);
        // DRY: Extracted repetitive pause state updates used in subsequent returns
        const updatedPause = {
            ...state.pause,
            start: start,
            timeout: pauseTimeout,
            interval: t
        };

        if (pauseTimeout > now || !state.fire.fire) {
            return {
                ...state,
                pause: updatedPause
            };
        }

        

        if (!state.fire.hasFired) { 
            console.log("Data before fire:", state)
            state.fire.fire() 
        };
        
        // will also recalculate every time (FIX)
        const awaitTimeout = pauseTimeout + state.typing.interval;

        if (awaitTimeout > now) {
            return {
                ...state,
                pause: updatedPause,
                fire: {
                    ...state.fire,
                    hasFired: true,
                }
            };
        }

        // this needs to trigger only once after awaited and not once more.
        const pauseProfile: PauseProfile = state.pause.awaitedFalsePositive
            ? state.profile.pauseProfile
            : // Negative growth because we have exceeded threshold. Thus pause may have been to short.
              updateLocalPauseProfile(state.profile.pauseProfile, state.pause.intervals, true, false);
        const sessionTimeout = awaitTimeout + t;

        if (sessionTimeout > now) {
            return {
                ...state,
                profile: {
                    ...state.profile,
                    pauseProfile: pauseProfile,
                },
                pause: {
                    ...updatedPause,
                    awaitedFalsePositive: true
                }
            };
        }

        return {
            ...state,
            profile: {
                ...state.profile,
                toleranceProfile: updateToleranceProfile(state.profile.toleranceProfile, true),
            },
            terminated: true,
        };
    });
};

const addEvent = (length: number, inputType: string, isComposing: boolean, timestamp: number = Date.now(), fire: () => void) => {
    if (!intervalId) startSession();

    const isTyping = shouldCountAsTyping(inputType, isComposing);

    sessionStore.setState((state) => {
        const timestamps = isTyping
            ? [...state.timestamps, timestamp]
            : state.timestamps;

        const tempoProfile = updateLocalTempoProfile(
            state.profile.tempoProfile,
            timestamps
        );

        const editState = {
            ...state.edit,
            length: length,
            prevLength: state.edit.length,
        };

        return {
            timestamps: timestamps,
            profile: {
                ...state.profile,
                tempoProfile,
            },
            typing: getTypingTimeout(tempoProfile.meanCPS, tempoProfile.deviation, Date.now()),
            edit: getEditLikelihood(editState, state.profile.editProfile.editRate, isTyping),
            fire: {
                ...state.fire,
                fire: fire
            },
        };
    });
};

export default {
    addEvent,
    stopSession
};