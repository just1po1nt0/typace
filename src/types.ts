export type TempoProfile = {
    /**
     * Mean average of characters per second of the user.
     */
    meanCPS: number;
    /**
     * Standard deviation of characters per second of the user.
     */
    deviation: number;
    /**
     * Amount of times tempo data has been recorded into profile.
     */
    samples: number;
}

/**
 * @deprecated from profile version 2. Use samples data within individual profiles
 */
export type ProfileSamples = {
    tempo: number;
    pause: number;
    edit: number;
    fireTolerance: number;
}

export type PauseProfile = {
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
     * @deprecated please use mean and deviation instead. Will not be calculated or used in future versions
     */
    longPauseThreshold?: number; // meanPause + 2*deviationPause
    /**
     * Amount of times pause data has been recorded into profile.
     */
    samples: number;
}


export type EditProfile = {
    /**
     * Coefficient of how much this user revises their typing per total input length.
     * @remarks Higher edit rate delays firing, low edit rate trusts pauses more as signal to fire.
     */
    editRate: number;
    /**
     * Amount of times edit data has been recorded into profile.
     */
    samples: number;
}

export type ToleranceProfile = {
    /**
     * Coefficient of how often fired queries are followed by more typing.
     * i.e. probability that early fire does not interrupt user's flow.
     */
    fireTolerance: number;
    /**
     * Amount of times fire tolerance data has been recorded into profile.
     */
    samples: number;
}

export type Profile = {
    version: number;
    /**
     * General writing score data, i.e. how fast can this user type and how consistent the time between keystrokes is.
     */
    tempoProfile: TempoProfile;
    pauseProfile: PauseProfile;
    /**
     * Editing data about the user with `editRate` and number of samples taken.
     */
    editProfile: EditProfile;
    /**
     * Tolerance data about the user with `fireTolerance` and number of samples taken.
     */
    toleranceProfile: ToleranceProfile;
    lastUpdated?: number;
}

export type useAdaptiveDebounceProps = ( 
    onFire: (value: any) => any,
    minChars: number,
    config: Config,
) => any//=> { bind: any, readiness: number, fireNow: () => any};

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

export type SessionEditState = {
    length: number,
    prevLength?: number,
    effort: number,
    progress: number,
    consecutiveEdits: number,
    signal: number,
}

export type SessionPauseState = {
    start: number,
    timeout: number,
    interval: number,
    lengths: number[]
}

/**
 * Type for storing session data
 */
export type SessionState = {
    profile: Profile;
    timestamps: number[];
    typingTimeout: number;
    edit: SessionEditState;
    pause: SessionPauseState;
}

/**
 * Protects indirect children of an object with a `readonly` property
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
}