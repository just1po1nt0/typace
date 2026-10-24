import { 
    shouldCountAsTyping, getTypingTimeout, getPauseTimeout, 
    getEditLikelihood, getWeightedPauseThreshold
} from '@/engine/analyse';
import {
    test,
    expect,
    describe
} from "@jest/globals";

describe('Analysis Functions', () => {
    describe('shouldCountAsTyping', () => {
        test('insertText always counts', () => {
            expect(shouldCountAsTyping('insertText', false)).toBe(true);
            expect(shouldCountAsTyping('insertText', true)).toBe(true);
        });

        test('insertCompositionText only counts when not composing', () => {
            expect(shouldCountAsTyping('insertCompositionText', false)).toBe(true);
            expect(shouldCountAsTyping('insertCompositionText', true)).toBe(false);
        });

        test('other input types do not count', () => {
            const otherTypes = ['deleteContentBackward', 'deleteContentForward', 'insertParagraph', 'formatBold'];
            otherTypes.forEach(type => {
                expect(shouldCountAsTyping(type, false)).toBe(false);
                expect(shouldCountAsTyping(type, true)).toBe(false);
            });
        });
    });

    describe('getTypingTimeout', () => {
        test('calculates timeout with 2σ confidence', () => {
            const avgCPS = 5;
            const devCPS = 1;
            const timestamp = 10000;
            
            // Mean interval = 200ms, deviation ~40ms, timeout = 200 + 2*40 = 280ms
            const result = getTypingTimeout(avgCPS, devCPS, timestamp);
            expect(result.timeout).toBe(timestamp + 280);
            expect(result.interval).toBeCloseTo(280, 0);
        });

        test('handles edge cases', () => {
            expect(getTypingTimeout(0, 1, 1000).timeout).toBe(Infinity);
            expect(getTypingTimeout(5, 0, 1000).interval).toBe(200);
        });
    });

    describe('getPauseTimeout', () => {
        test('combines typing timeout with weighted pause threshold', () => {
            const pauseProfile = { meanPause: 500, deviation: 100, samples: 10 };
            const typingTimeout = 10000;
            const editSignal = 0.5;
            const fireTolerance = 0.3;
            const meanTypingInterval = 200;
            
            const result = getPauseTimeout(pauseProfile, typingTimeout, meanTypingInterval, editSignal, fireTolerance);
            // t = 500 + 2*100 = 700
            // weighted = (700 - (1-0.5)) * (1.2 * exp(-0.4*0.3)) = ~699.5 * 1.07 = ~748
            // pauseTimeout = 10000 + 748 = 10748
            expect(result.pauseTimeout).toBeGreaterThan(typingTimeout);
            expect(result.t).toBe(700);
        });
    });

    describe('getWeightedPauseThreshold', () => {
        test('decreases with higher fire tolerance', () => {
            const timeoutInterval = 1000;
            const editSignal = 0.3;
            
            const lowTolerance = getWeightedPauseThreshold(timeoutInterval, editSignal, 0.1);
            const highTolerance = getWeightedPauseThreshold(timeoutInterval, editSignal, 0.9);
            
            expect(highTolerance).toBeLessThan(lowTolerance);
        });

        test('increases with higher edit signal', () => {
            const timeoutInterval = 1000;
            const fireTolerance = 0.5;
            
            const lowEdit = getWeightedPauseThreshold(timeoutInterval, 0.1, fireTolerance);
            const highEdit = getWeightedPauseThreshold(timeoutInterval, 0.9, fireTolerance);
            
            expect(highEdit).toBeGreaterThan(lowEdit);
        });
    });

    describe('getEditLikelihood', () => {
        const mockEditState = {
            length: 10,
            prevLength: 5,
            effort: 100,
            progress: 50,
            consecutiveEdits: 0,
            signal: 0.2
        };

        test('no change increases effort and resets consecutive edits', () => {
            const state = { ...mockEditState, length: 10, prevLength: 10 };
            const result = getEditLikelihood(state, 0.1, true);
            
            expect(result.effort).toBe(state.effort + 1);
            expect(result.consecutiveEdits).toBe(0);
        });

        test('typing events decay signal', () => {
            const state = { ...mockEditState, length: 15, prevLength: 10 };
            const result = getEditLikelihood(state, 0.2, true);
            
            expect(result.signal).toBeLessThan(state.signal);
            expect(result.progress).toBe(state.progress + 5);
        });

        test('non-typing events increase signal', () => {
            const state = { ...mockEditState, length: 15, prevLength: 10 };
            const result = getEditLikelihood(state, 0.2, false);
            
            expect(result.signal).toBeGreaterThan(state.signal);
            expect(result.consecutiveEdits).toBe(5);
        });

        test('random property testing for edit likelihood', () => {
            // Signal should always remain between 0 and 1
            const randomTests = Array.from({ length: 50 }, () => ({
                length: Math.floor(Math.random() * 100),
                prevLength: Math.floor(Math.random() * 100),
                effort: Math.random() * 1000,
                progress: Math.random() * 500,
                consecutiveEdits: Math.floor(Math.random() * 20),
                signal: Math.random()
            }));
            
            randomTests.forEach(state => {
                const result = getEditLikelihood(state, Math.random() * 0.5, Math.random() > 0.5);
                expect(result.signal).toBeGreaterThanOrEqual(0);
                expect(result.signal).toBeLessThanOrEqual(1);
            });
        });
    });
});