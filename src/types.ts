export type Profile = {
    version: number;
    /**
     * General writing score data, i.e. how fast can this user type and how consistent the time between keystrokes is.
     */
    tempoProfile: {
        /**
         * Mean average of characters per second of the user.
         */
        meanCPS: number;
        /**
         * Standard deviation of characters per second of the user.
         */
        deviation: number;
    }
    /**
     * Contains an object with amount of times data about each type of signal had been recorded into profile.
     */
    samples: {
        tempo: number;
        pause: number;
        edit: number;
        fireTolerance: number;
    }
    pauseProfile: {
        /**
         * Mean average pause time in milliseconds
         * @example 250 (ms)
         */
        meanPause: number;
        /**
         * Standard deviation of pause times in milliseconds
         * Allows calculating normal range: meanPause ± 2*deviationPause
         * @example 50 (ms)
         */
        deviation: number;
        /**
         * 90% percentile of maximum **learnt** pause time
         */
        longPauseThreshold?: number; // meanPause + 2*deviationPause
    }
    /**
     * Coefficient of how much this user revises their typing per total input length.
     * @remarks Higher edit rate delays firing, low edit rate trusts pauses more as signal to fire.
     */
    editRate: number;
    /**
     * Coefficient of how often fired queries are followed by more typing.
     * i.e. probability that early fire does not interrupt user's flow.
     */
    fireTolerance: number;
    lastUpdated?: Date;
}

export interface useAdaptiveDebounceProps {
    onFire: (value: any) => any;
    minChars: number;
    config: Config;
}

export type Config = {
    weight?: {
        /**
        *   Controls how significant to readiness score the typing speed and typing speed variance is.
        *   Higher values lower readiness score for fast and even. Lower values lower readiness score for slow and uneven.
        */
        tempo?: number;
        /**
         *   Controls how significant pauses are to the readiness score. 
         *   Higher values lower readiness, lower values increase readiness.
         */
        pause?: number;
        /**
         * Controls how significant editing is to the readiness score.
         * Higher values lower readiness score when user is editing, lower values decrease the score to a lesser extent.
         */
       edit?: number;
    }
    /**
     * If true, only same-site cookies will by used and created for profiling.
     * @remarks Incompatible with useLocalStorage.
     * @default true
     */
    allowCrossSiteCookies?: boolean;
    /**
    * If true, cookies will be ignored for this input field and profiling.\
    * @default false
    */
    useLocalStorage?: boolean;
    /**
    * If true, typace will not use data from this this field for learning.\
    * @default false
    */
    disableLearning?: boolean;
}