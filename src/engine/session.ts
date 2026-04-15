import { getEditLikelihood, getPauseTimeout, getTypingTimeout, shouldCountAsTyping } from "./analyse";
import { updateEditProfile, updateLocalPauseProfile, updateLocalTempoProfile, updateToleranceProfile } from "@/profile/update";
import { truncateOldTimestamps } from "./util";
import { sessionStore } from "./store";
import { Config, PauseProfile } from "@/types";
import profileController from "@/profile/profile";

const CYCLE_DURATION_MS = 20;
const HISTORY_LIMIT_MS = 5000;

let intervalId: NodeJS.Timeout | null = null;


const startSession = () => {
    if (!intervalId) {
        sessionStore.setState((state) => ({...state, start: Date.now()}))
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
        }, state.config);
        
        sessionStore.setState(() => sessionStore.getInitialState());
    } else {
        throw new Error("Interval ID not found. Execution failed.");
    }
};

const cleanTimestamps = (timestamps: number[], now: number) => {
    return truncateOldTimestamps(timestamps, HISTORY_LIMIT_MS, now);
};

const processTick = () => {
    if (sessionStore.getState().terminated) {
        stopSession();
        return;
    }
    const now = Date.now();

    sessionStore.setState((curr) => {
        const cleanedTimestamps = cleanTimestamps([...curr.timestamps], now);
        
        // Extracted repetitive base state updates
        const state = { 
            ...curr, 
            timestamps: cleanedTimestamps 
        };

        // check if lifespan exceeds maximum wait time
        if(state.config.maxWait! > -1 && (now - state.start > state.config.maxWait!) && (state.config.strictMinLength ? state.edit.length >= state.config.minFireLength! : true)) {
            return {
                ...state,
                terminated: true
            }
        }

        if (state.typing.timeout > now) {
            // Cleaned up nested ternaries: Only calculate interval/profile if we have a valid, non-false-positive start
            const isValidPause = state.pause.start && !state.pause.awaitedFalsePositive;
            
            const interval = isValidPause ? now - state.pause.start! : undefined;
            const intervals = interval ? [...state.pause.intervals, interval] : state.pause.intervals;
            
            const pauseProfile = isValidPause 
                ? updateLocalPauseProfile(state.profile.pauseProfile, intervals)
                : state.profile.pauseProfile;

            return {
                ...state,
                profile: {
                    ...state.profile,
                    pauseProfile,
                    toleranceProfile: state.fire.hasFired 
                        ? updateToleranceProfile(state.profile.toleranceProfile, false) 
                        : state.profile.toleranceProfile
                },
                pause: {
                    ...state.pause,
                    start: null,
                    intervals,
                    awaitedFalsePositive: false,
                },
                fire: {
                    ...state.fire,
                    hasFired: false,
                }
            };
        }

        // Simplified using logical OR
        const start = state.pause.start || now;
        
        // right now this will recalculate every time the conditions are met with the same outcome
        const { pauseTimeout, t } = getPauseTimeout(state.profile.pauseProfile, state.typing.timeout, state.edit.signal, state.profile.toleranceProfile.fireTolerance);
        
        // DRY: Extracted repetitive pause state updates used in subsequent returns
        const updatedPause = {
            ...state.pause,
            start,
            timeout: pauseTimeout,
            interval: t
        };

        // time-based check and check for firing function presence
        if (pauseTimeout > now || !state.fire.fire) {
            return {
                ...state,
                pause: updatedPause
            };
        }

        // config-based checks
        if(state.config.minFireLength! > state.edit.length || now - state.start < state.config.minFireDelay!) {
            return {
                ...state,
                pause: updatedPause
            }
        }

        if (!state.fire.hasFired) {
            state.fire.fire();
        }
        
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
                    pauseProfile,
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
            pause: {
                ...state.pause,
            },
            terminated: true,
        };
    });
};

const addEvent = (length: number, inputType: string, isComposing: boolean, timestamp: number = Date.now(), fire: () => void, config: Config) => {
    if (!intervalId) startSession();

    if(
        ((inputType === "Enter" && config.fireOnEnter) 
         || 
         (inputType === "insertFromPaste" && config.fireOnPaste))
        &&
        (config.strictMinLength ? length >= config.minFireLength! : true)
    ) {
        fire();
        sessionStore.setState((state) => ({...state, terminated: true}));
    }

    if(isComposing) return;

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
            typing: getTypingTimeout(tempoProfile.meanCPS, tempoProfile.deviation, Date.now() + (isComposing ? config.compositionBuffer! : 0)),
            edit: getEditLikelihood(editState, state.profile.editProfile.editRate, isTyping),
            fire: {
                ...state.fire,
                fire: fire
            },
            config: config
        };
    });
};

export default {
    addEvent,
    stopSession,
    CYCLE_DURATION_MS
};