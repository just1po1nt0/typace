import { Profile } from "@/types";

/*
 * Default profile for Typace which all users start with.
*/ 
export const DEFAULT_PROFILE: Profile = {
    version: 2,
    tempoProfile: {
        meanCPS: 4.5,
        deviation: 1.5,
        samples: 0,
    },
    pauseProfile: {
        meanPause: 500,
        deviation: 150,
        samples: 0,
    },
    editProfile: {
        editRate: 0.18,
        samples: 0,
    },
    toleranceProfile: {
        fireTolerance: 0.65,
        samples: 0
    },
    lastUpdated: undefined
}