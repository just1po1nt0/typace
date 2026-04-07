type useAdaptiveDebounceProps = (onFire: (value: any) => any, minChars?: number, config?: Config) => any;
type Config = {
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
    };
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
};

declare const useAdaptiveDebounce: useAdaptiveDebounceProps;

export { useAdaptiveDebounce, type useAdaptiveDebounceProps };
