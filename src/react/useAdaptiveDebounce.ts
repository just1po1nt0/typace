import { NativeCompositionEvent, NativeInputEvent, SessionState, useAdaptiveDebounceProps } from "../types"
import DEFAULT_CONFIG from "@/engine/config";
import session from "@/engine/session";
import { sessionStore } from "@/engine/store";
import React, { useEffect, useState } from "react";
import profileController from "@/profile/profile"; // Ensure this is imported
import { destroy } from "@/engine/storage";

const useAdaptiveDebounce: useAdaptiveDebounceProps = (onFire, config) => {
    const [debug, setDebug] = useState<SessionState>();

    const mergedConfig = {
        persistentStorage: DEFAULT_CONFIG.persistentStorage,
        useCookie: DEFAULT_CONFIG.useCookie,
        cookieMaxAgeDays: DEFAULT_CONFIG.cookieMaxAgeDays,
        ...config
    };
    
    useEffect(() => {
        profileController.initialise(mergedConfig);

        const unsubscribe = sessionStore.subscribe((state) => setDebug(state));
        setDebug(sessionStore.getState());

        return () => {
            unsubscribe();
        };
    }, [mergedConfig]);

    const handleEvent = (e: NativeInputEvent | NativeCompositionEvent, inputType: string, isComposing: boolean) => {
        const target = e.currentTarget;
        if (!target) return;
        
        const value = target.value;
        const fire = () => onFire(value);
        
        session.addEvent(value.length, inputType, isComposing, Date.now(), fire, mergedConfig);
    };
    
    const bind = {
        onInput(e: NativeInputEvent) {
            const nativeEvent = e.nativeEvent as InputEvent;
            handleEvent(e, nativeEvent.inputType, nativeEvent.isComposing ?? false);
        },
        onCompositionEnd(e: NativeCompositionEvent) {
            handleEvent(e, 'insertCompositionText', false);
        }
    };

    return { bind, debug, destroy };
};

export default useAdaptiveDebounce;