import { Profile } from "@/types";

/*
 * Default profile for Typace which all users start with.
*/ 
export const DEFAULT_PROFILE: Profile = {
    version: 1,
    samples: {
        tempo: 0,
        pause: 0,
        edit: 0,
        fireTolerance: 0
    },
    tempoProfile: {
        meanCPS: 4.5,
        deviation: 1.5
    },
    pauseProfile: {
        meanPause: 350,
        deviation: 120,
        longPauseThreshold: 600
    },
    editRate: 0.18,
    fireTolerance: 0.65,
    lastUpdated: undefined
}