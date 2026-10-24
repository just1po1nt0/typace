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
    lastUpdated: number;
}

export type NativeInputEvent = React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>;
export type NativeCompositionEvent = React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>;

export type useAdaptiveDebounceProps = ( 
    onFire: (value: any) => any,
    config?: Config,
) => {
    /**
     * Spreadable object with `onInput` and `onCompositionEnd` event listeners to activate *typace*
     */
    bind: { onInput: (e: NativeInputEvent) => void, onCompositionEnd: (e: NativeCompositionEvent) => void },
    /**
     * An object with variables typace collected into session state.
     */
    debug?: SessionState,
    /**
     * Method to manually delete profile data saved by typace
     */
    destroy: () => void,
}

export type Config = {
    /**
     * Flag to determine whether any data collected by typace should be stored after the session terminates.
     * @remarks Will store data in `localStorage` unless a separate, `useCookie` flag is enabled.
     * @remarks **DO NOT** enable this flag in deployed app unless you have the user's prior consent (see `README.md`)
     * @default false
     */
    persistentStorage: boolean;
    /**
     * Flag to determine whether a cookie should be used instead of `localStorage` for storing user profile.
     * @remarks Will compare cookie to localStorage, if present. Newer data will be used.
     * @remarks **DO NOT** enable this flag in deployed app unless you have taken the extra steps needed to disclose this storage method to the user.
     * @default false
     */
    useCookie?: boolean;
    /**
     * Duration (in days) for which the profile cookie should persist on the user's device.
     * @remarks You **must** disclose this exact duration in deployed app.
     * @default 180 (days)
     */
    cookieMaxAgeDays?: number;
    /** 
     *  The minimum number of characters required in the input field before the 
     *  search is allowed to fire. Prevents premature API calls for single-letter queries.
     * 
     *  *For example* if `minFireLength = 3`, then queries with length less than 3 characters will not fire, and queries with length greater or equal to 3 characters will.
     *  @default 1
     */
    minFireLength?: number;

    /**
     *  When enabled, applies `minFireLength` validation to all trigger types including Enter and Paste.
     *  When disabled, `minFireLength` only applies to regular typing events.
     *  
     *  @default false
     */
    strictMinLength?: boolean;

    /** 
     *  If true, pressing the 'Enter' key will bypass all adaptive delays and 
     *  trigger the search immediately. 
     *  @default true
     */
    fireOnEnter?: boolean;

    /** 
     *  If true, pasting text into the input will trigger an immediate search 
     *  instead of waiting for the user's typing cadence to be analysed.
     *  @default false
     */
    fireOnPaste?: boolean;

    /** 
     *  The duration (in milliseconds) to extend the typing timeout while the user 
     *  is using an IME (Input Method Editor) for complex character composition.
     *  @default 10000
     */
    compositionBuffer?: number;

    /** 
     *  The absolute minimum delay (in milliseconds) the engine must wait before firing, 
     *  regardless of how fast the user is typing. Useful for rate-limiting.
     *  @default 100
     * 
     *  @note
     *  May distort profiles when set above 500ms. See [#27](https://github.com/just1po1nt0/typace/issues/27).
     */
    minFireDelay?: number;

    /** 
     * The absolute maximum time (in milliseconds) a user can type continuously 
     * before a search is forced to fire, even if no pause is detected.
     * @remarks set to `-1` to disable.
     * @default -1
     */
    maxWait?: number;
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
    /**
     * Unix time of start of current pause.
     */
    start: number | null,
    /**
     * Unix time of `pauseTimeout` threshold *with weighting applied*
     */
    timeout?: number,
    /**
     * Current time calculated between `pauseTimeout` and `typingTimeout` *without weighting applied*.
     */
    interval?: number,
    /**
     * History of previous intervals pause start and stop *Unix time* data *based on user input*
     * @remarks Do not use this variable to start *implicit* intervals. 'Based on user input' stands for explicit data received from typing events.
     */
    intervals: number[],
    /**
     * Boolean value if false positive fire time window has elapsed
     */
    awaitedFalsePositive: boolean,
}

export type SessionTypingState = {
    timeout: number,
    interval: number,
}

export type SessionFireState = {
    fire?: () => void;
    hasFired: boolean;
}

/**
 * Type for storing session data
 */
export type SessionState = {
    profile: Profile;
    timestamps: number[];
    typing: SessionTypingState;
    edit: SessionEditState;
    pause: SessionPauseState;
    fire: SessionFireState;
    /** `unix` time (in miliseconds) when session began.
     */
    start: number;
    /** Flag if the session has been terminated
     */
    terminated: boolean;
    config: Config;
}

/**
 * Protects indirect children of an object with a `readonly` property
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
}