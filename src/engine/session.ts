import { getEditLikelihood, getTypingTimeout, shouldCountAsTyping } from "./analyse";
import { updateLocalTempoProfile } from "@/profile/update";
import { truncateOldTimestamps } from "./util";
import { sessionStore } from "./store";

const CYCLE_DURATION_MS = 5;
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
    }
};

const cleanTimestamps = (timestamps: number[], now: number) => {
    return truncateOldTimestamps(timestamps, HISTORY_LIMIT_MS, now);
};

const processTick = () => {
    const now = Date.now()
    sessionStore.setState((state) => ({
        timestamps: cleanTimestamps([...state.timestamps], now)
    }))
    

};


const addEvent = (length: number, inputType: string, isComposing: boolean, timestamp: number = Date.now()) => {
    if (!intervalId) startSession();

    const isTyping = shouldCountAsTyping(inputType, isComposing);

    sessionStore.setState((state) => {
        const timestamps = isTyping ? 
            [...state.timestamps, timestamp] :
            state.timestamps

        const tempoProfile = updateLocalTempoProfile(
            state.profile.tempoProfile,
            timestamps
        );

        const editState = {
            ...state.edit,
            length: length,
            prevLength: state.edit.length,
        }

        return {
            timestamps: timestamps,
            profile: {
                ...state.profile,
                tempoProfile,
            },
            typingTimeout: getTypingTimeout(tempoProfile.meanCPS, tempoProfile.deviation, Date.now()),
            edit: getEditLikelihood(editState, state.profile.editProfile.editRate, isTyping)
        }
    })
};

export default {
    addEvent,
    stopSession
};