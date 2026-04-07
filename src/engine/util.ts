export const EMA = (avg: number, value: number, samples: number, alpha: number | null = null) => {
    if(!alpha) alpha = getAlpha(samples);
    return (value * alpha) + (avg * (1 - alpha))
}

export const meanAvg = (values: number[]) => {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Calculate variance from an array of numbers
 * @param values any array of numeric values (`values[] || Array<values>`)
 * @param avg mean average to compare values against
 * @param useSample whether to use sample (n-1) vs population (n) formula
 * @returns Variance of the values provided
 */
export const variance = (values: number[], avg: number | null = null, useSample: boolean = true) => {
    if(values.length < 2) return 0;

    if(!avg) avg = meanAvg(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) /
        (useSample ? values.length - 1 : values.length);
    
    return variance;
}

/**
 * Calculate standard deviation from an array of numbers
 * @param values any array of numeric values (`values[] || Array<values>`)
 * @param avg mean average to compare values against
 * @param useSample whether to use sample (n-1) vs population (n) formula
 * @returns Standard deviation
 */
export const stdDev = (values: number[], avg: number | null = null, useSample: boolean = true) => {
    return Math.sqrt(variance(values, avg, useSample));
}

const alpha_min = 0.04;
const alpha_max = 0.135;
const decay_rate = 80;
const rise_rate = 12;

export const getAlpha = (n: number): number => {
    return alpha_min + alpha_max * (1 - Math.exp(-n / rise_rate)) - alpha_max * (1 - Math.exp(-n / decay_rate));
}

/**
 * 
 * @param values `Array<values>` of timestamps at each event
 * @returns `Array<intervals>` of time between those events.
 * @remarks Truncates data — useful for only ≥2 samples. 
 */
export const getIntervals = (values: number[]): number[] => {
    if(values.length < 2 ) return [];
    let result: number[] = [];
    for(let i = 1; i < values.length; i++) {
        result.push(values[i] - values[i-1]);
    }
    return result;
}

/**
 * Function used to calculate frequency between events `events/second`, for example, keystrokes per second.
 * @param intervals `Array<intervals>` of time intervals between events in miliseconds.
 * @returns frequency `1000 / mean time between intervals` of events per second.
 */
export const intervalsToFrequency = (intervals: number[]): number => {
    if(intervals.length < 1) return 0;
    return 1000 / meanAvg(intervals);
}

/**
 * Function which combines `getIntervals()` and `intervalsToFrequency()` to transform timestamps into number of events/second
 * @param timestamps `Array<timestamps>` of valid input event timestamps 
 * @returns frequency `1000 / mean time between timestamp intervals` of events per second.
 */
export const timestampsToFrequency = (timestamps: number[]): number => {
    const intervals = getIntervals(timestamps);
    return intervalsToFrequency(intervals);
} 

export const intervalsToFrequencyDeviation = (intervals: number[]): number => {
    if(intervals.length < 1) return 0;
    const frequencyValues = intervals.map(i => 1000 / i);
    const mean = meanAvg(frequencyValues);
    return stdDev(frequencyValues, mean);
}

/**
 * Function used in array of timestamps to remove those older than `timestamp - threshold`
 * @param timestamps `Array<timestamps>` of valid input event timestamps.
 * @param threshold Maximum timestamp age. Values older than threshold will be removed from array.
 * @returns new `Array<timestamps>` where every timestamp is newer than `timestamp - threshold`
 */
export const truncateOldTimestamps = (timestamps: number[], threshold: number = 2000, now: number = new Date().getTime()) => {
    return timestamps.filter(t => now - t <= threshold);
}

/**
 * Calculates a continuous weight (0 to 1) for a deletion event.
 * Uses a smooth curve so massive deletions approach 0 weight.
 */
export const getEditWeight = (expectedEditSize: number, consecutiveEdits: number): number => {
    // Fallback to prevent division by zero in edge cases
    if (expectedEditSize <= 0) return 1; 
    return expectedEditSize / (expectedEditSize + consecutiveEdits);
};