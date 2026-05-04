import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals'
import { sessionStore } from '../src/engine/store'
import profileController from '../src/profile/profile'
import * as analyse from '../src/engine/analyse'
import session from '../src/engine/session'
import type { Config } from '../src/types'

jest.mock('@/engine/store', () => {
    let initialState = {
        terminated: false,
        timestamps: [],
        start: 0,
        typing: { timeout: 0, interval: 0 },
        pause: { start: null, intervals: [], awaitedFalsePositive: false },
        fire: { hasFired: false, fire: jest.fn() },
        edit: { length: 0, signal: 0, prevLength: undefined },
        profile: { editProfile: {}, pauseProfile: {}, toleranceProfile: {}, tempoProfile: {} },
        config: { maxWait: 5000, minFireDelay: 100, minFireLength: 0, fireOnEnter: true, fireOnPaste: true, strictMinLength: false }
    };

    let state = {...initialState}

    return {
        sessionStore: {
            getState: jest.fn(() => state),
            setState: jest.fn((updater: any) => {
                const nextState = typeof updater === 'function' ? updater(state) : updater;
                state = { ...state, ...nextState };
            }),
            getInitialState: jest.fn(() => ({...initialState}))
        }
    };
});

jest.mock('@/profile/profile', () => ({
    updateProfile: jest.fn()
}));

jest.mock('@/engine/analyse', () => ({
    shouldCountAsTyping: jest.fn(() => true),
    getTypingTimeout: jest.fn(() => ({ timeout: 0, interval: 0 })),
    getPauseTimeout: jest.fn(() => ({ pauseTimeout: 0, t: 0 })),
    getEditLikelihood: jest.fn((editState: any) => ({
        length: editState.length,
        prevLength: undefined,
        effort: 0,
        progress: 0,
        consecutiveEdits: 0,
        signal: 0
    }))
}));

const fireMock = jest.fn() as () => void;
const cfg = {} as Config

describe('Session Orchestrator', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
        try {
            session.stopSession();
        } catch(e) {
            
        }
    })

    describe("Lifecycle", () => {
        it('should start the interval and set start time on first event', () => {
            session.addEvent(5, 'insertText', false, Date.now(), fireMock, cfg);

            jest.advanceTimersByTime(session.CYCLE_DURATION_MS);

            expect(sessionStore.setState).toHaveBeenCalled();
            expect(sessionStore.getState().start).toBeGreaterThan(0);
        });

        it('should clear interval and push profile on stopSession', () => {
            session.addEvent(5, 'insertText', false, Date.now(), fireMock, cfg);

            session.stopSession();

            expect(profileController.updateProfile).toHaveBeenCalled();
            expect(sessionStore.getInitialState).toHaveBeenCalled()
            expect(() => session.stopSession()).toThrow("Interval ID not found");
        })
    })

    describe("Configuration behaviours", () => {
        it("should terminate immediatelly if fireOnEnter is triggered", () => {
            session.addEvent(5, "Enter", false, Date.now(), fireMock, {...cfg, strictMinLength: false, fireOnEnter: true, minFireLength: 10}),

            expect(sessionStore.getState().terminated).toBe(true)
        })

        it("should terminate immediatelly if fireOnPaste is triggered", () => {
            session.addEvent(5, "insertFromPaste", false, Date.now(), fireMock, {...cfg, strictMinLength: false, fireOnPaste: true, minFireLength: 10})

            expect(sessionStore.getState().terminated).toBe(true);
        })

        it("should enforce minFireLength", () => {
            const config = {...cfg, strictMinLength: false, fireOnPaste: true, fireOnEnter: true, minFireLength: 6}
            session.addEvent(5, "insertText", false, Date.now(), fireMock, config);

            jest.advanceTimersByTime(session.CYCLE_DURATION_MS);

            expect(fireMock).not.toHaveBeenCalled()
        })

        it("should enforce strict minFireLength when strictMinLength is true", () => {
            const config = {...cfg, strictMinLength: true, fireOnPaste: true, fireOnEnter: true, minFireLength: 6}

            session.addEvent(5, "insertParagraph", false, Date.now(), fireMock, config)
            expect(sessionStore.getState().terminated).toBe(false);

            session.addEvent(5, "insertFromPaste", false, Date.now(), fireMock, config)

            expect(sessionStore.getState().terminated).toBe(false);

            session.addEvent(5, "insertText", false, Date.now(), fireMock, config)

            jest.advanceTimersByTime(session.CYCLE_DURATION_MS);

            expect(sessionStore.getState().terminated).toBe(false);
        })

        it("should terminate when maxWait is exceeded", () => {
            const config = {...cfg, maxWait: 1, minFireLength: 6}
            session.addEvent(5, 'insertText', false, Date.now(), jest.fn(), config);

            jest.advanceTimersByTime(session.CYCLE_DURATION_MS);

            expect(sessionStore.getState().terminated).toBe(true);
        })

        it("should not fire before minimum delay time minFireDelay", () => {
            const config = {...cfg, minFireDelay: session.CYCLE_DURATION_MS * 2 - 1 }
            session.addEvent(5, 'insertText', false, Date.now(), jest.fn(), config);
            jest.advanceTimersByTime(session.CYCLE_DURATION_MS);

            expect(sessionStore.getState().terminated).toBe(false);

            jest.advanceTimersByTime(session.CYCLE_DURATION_MS);

            expect(sessionStore.getState().terminated).toBe(true);
        })

        it("should apply compositionBuffer to typing timeout when isComposing is true", () => {
            const MOCK_TIME = 10000;
            const COMPOSITION_BUFFER = 5000;
            jest.setSystemTime(MOCK_TIME); 
        
            const config = { ...cfg, compositionBuffer: COMPOSITION_BUFFER };
            session.addEvent(5, "insertCompositionText", true, MOCK_TIME, fireMock, config);
        
            // buffer applies
            expect(analyse.getTypingTimeout).toHaveBeenCalledWith(
                expect.anything(), 
                expect.anything(),
                MOCK_TIME + COMPOSITION_BUFFER   
            );
        
            jest.clearAllMocks();
            session.addEvent(5, "insertText", false, MOCK_TIME, fireMock, config);

            // buffer does not apply
            expect(analyse.getTypingTimeout).toHaveBeenCalledWith(
                expect.anything(), 
                expect.anything(), 
                MOCK_TIME
            );
        });
    })
})