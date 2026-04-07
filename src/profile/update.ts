import { EditProfile, PauseProfile, Profile, ProfileSamples, SessionEditState, TempoProfile, ToleranceProfile } from "@/types";
import ProfileController from "./profile";
import { EMA, getAlpha, getIntervals, intervalsToFrequency, intervalsToFrequencyDeviation, meanAvg, stdDev } from "@/engine/util";

const alpha_min = 0.04;
const alpha_max = 0.135;
const decay_rate = 80;
const rise_rate = 12;

const calculateLearningRate = (n: number): number => {
    return alpha_min + alpha_max * (1 - Math.exp(-n / rise_rate)) - alpha_max * (1 - Math.exp(-n / decay_rate));
}

type ApplyInfluenceDeviationClamp = (
    observed: number,
    avg: number,
    n: number,
    strength?: number
) => number;

/**
 * 
 * @param mean mean average as recorded in profile
 * @param observed value observed during typing session
 * @param deviation deviation as recorded in profile
 * @param n number of samples for that specific event
 * @returns new mean average to be recoreded in profile
 */
function emaUpdate(
  mean: number,
  observed: number,
  deviation: number | undefined,
  n: number
) {
  const alpha = calculateLearningRate(n);

  if (!deviation || deviation === 0) {
    return mean + alpha * (observed - mean);
  }

  const z = Math.abs((observed - mean) / deviation);
  const weight = 1 / (1 + z);

  return mean + alpha * weight * (observed - mean);
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

type Signal = "type" | "edit" | "pause" | "fire";

//const signalToData = (signal: Signal): {value: number, deviation?: number, n: number} => {
//    const profile = ProfileController.getInstance().getProfile();
//    switch(signal) {
//        case "type":
//            return {
//                value: profile.tempoProfile.meanCPS,
//                deviation: profile.tempoProfile.deviation,
//                n: profile.tempoProfile.samples
//            }
//        case "edit":
//            return {
//                value: profile.editProfile.editRate,
//                n: profile.editProfile.samples,
//            }
//        case "fire":
//            return {
//                value: profile.toleranceProfile.fireTolerance,
//                n: profile.toleranceProfile.samples
//            }
//        case "pause":
//            return {
//                value: profile.pauseProfile.meanPause,
//                deviation: profile.pauseProfile.deviation,
//                n: profile.pauseProfile.samples
//            }
//    }
//}

/**
 * Updates local profile with new tempo values to include recent data.
 * @remarks Use in sessions only, DO NOT calculate long-term profile using this function.
 * @param profile an instance of localProfile stored in `Session`.
 * @param timestamps timestamps of typing events with omitted deletion events.
 * @returns new `tempoProfile` and `samples`
*/
export const updateLocalTempoProfile = (tempoProfile: TempoProfile, timestamps: number[]): TempoProfile => {
    const s = tempoProfile.samples
    const intervals = getIntervals(timestamps);
    if(intervals.length < 1) return tempoProfile;

    tempoProfile.meanCPS = EMA(tempoProfile.meanCPS, intervalsToFrequency(intervals), s);
    tempoProfile.deviation = EMA(tempoProfile.deviation, intervalsToFrequencyDeviation(intervals), s);
    tempoProfile.samples++

    return tempoProfile;
}

export const updateLocalPauseProfile = (pauseProfile: PauseProfile, intervals: number[], applyDefaultGrowth: boolean = false, positiveGrowth: boolean = false): PauseProfile => {
    const s = pauseProfile.samples
    if(applyDefaultGrowth) { 
        const multiplier = positiveGrowth ?
            1 + getAlpha(s)
            :
            1 - getAlpha(s);
        intervals = [...intervals, pauseProfile.meanPause * multiplier]
    }
    if(intervals.length === 0) return pauseProfile;
    const mean = meanAvg(intervals);
    const dev = stdDev(intervals, mean);

    pauseProfile.meanPause = EMA(pauseProfile.meanPause, mean, s);
    pauseProfile.deviation = EMA(pauseProfile.deviation, dev, s)
    pauseProfile.samples++

    return pauseProfile
}

export const updateToleranceProfile = (toleranceProfile: ToleranceProfile, exceededSessionTimeout: boolean): ToleranceProfile => {
    const s = toleranceProfile.samples
    const multiplier = exceededSessionTimeout 
        ? Math.min(1, 1 - getAlpha(s))
        : Math.max(0, 1 + getAlpha(s));

    const fireTolerance = toleranceProfile.fireTolerance * multiplier;
    
    toleranceProfile.fireTolerance = fireTolerance;
    toleranceProfile.samples++;

    return toleranceProfile;
} 

export const updateEditProfile = (editProfile: EditProfile, editState: SessionEditState): EditProfile => {
    const s = editProfile.samples;
    const editRate = editState.progress / editState.effort;

    editProfile.editRate = EMA(editProfile.editRate, editRate, s);
    editProfile.samples++

    return editProfile;
}