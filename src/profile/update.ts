
type ApplySigmoidClamp = (
    value: number,
    avg: number,
    /**
     * Registered deviation value
     */
    range: number,
    /** 
     * Learning rate
    */
    strength?: number
) => number;

const learningRate = 0.1;


/**
 * 
 * @param value Observed value to be clamped
 * @param avg Centre value that reflects the mean rate
 * @param range Value which records standard deviation from mean
 * @param strength learningRate, defaults to `0.1`. `0 ≥ strength ≥ 1`
 * @returns clamped value to be used in live prediction of type `number`. 
 */
const applySigmoidClamp: ApplySigmoidClamp = (value, avg, range, strength = learningRate) => {
    const x = (value - avg) / range;
    return avg + range * Math.tanh(x * strength);
}

type ApplyInfluenceDeviationClamp = (
    observed: number,
    avg: number,
    strength?: number
) => number;

/**
 * 
 * @param observed observed extreme value outside deviation to be clamped.
 * @param avg mean average data from user profile to be clamped towards.
 * @param strength learningRate, defaults to `0.1`. `0 ≥ strength ≥ 1`
 * @returns clamped *new average* value for profile storage of type `number`
 */
const applyInfluenceDeviationClamp: ApplyInfluenceDeviationClamp = (observed, avg, strength = learningRate) => {
    const deviation: number = observed / avg;
    const weight: number = 1 / (1 + deviation);
    return avg * (1 - strength * weight) + observed * (strength * weight);
} 

export enum ConfidenceLevel {
    OneSigma = 1,    // ~68% of values
    TwoSigma = 2,    // ~95% of values
    ThreeSigma = 3   // ~99.7% of values
}

type GetDeviationRange = (
    avg: number,
    deviation: number,
    level?: ConfidenceLevel
) => [number, number];

const getDeviationRange: GetDeviationRange = (avg, deviation, level = ConfidenceLevel.TwoSigma) => {
    return [
        avg - deviation * level,
        avg + deviation * level
    ];
}

type IsWithinDeviationRange = (
    observed: number,
    avg: number,
    deviation: number,
    level?: number,
) => boolean;

/**
 * 
 * @param observed Typing trait value observed by typace
 * @param avg Mean average typing trait value recorded in profile
 * @param deviation Standard deviation value recorded in profile
 * @param level Standard deviation multiplier
 * @returns 
 */
const isWithinDeviationRange: IsWithinDeviationRange = (observed, avg, deviation, level = ConfidenceLevel.TwoSigma) => {
    const [min, max] = getDeviationRange(avg, deviation, level);
    return observed >= min && observed <= max;
}

