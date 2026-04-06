import { createStore } from 'zustand/vanilla';
import ProfileController from "@/profile/profile";
import { SessionState } from "@/types";

const initialState: SessionState = {
    profile: {
        ...ProfileController.getInstance().getProfile()
    },
    timestamps: [] as number[],
    typingTimeout: 0,
    edit: {
        length: 0,
        prevLength: undefined,
        effort: 0,
        progress: 0,
        consecutiveEdits: 0,
        signal: 0,
    }
};

export const sessionStore = createStore<SessionState>(() => initialState);