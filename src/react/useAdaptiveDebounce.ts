import { SessionState, useAdaptiveDebounceProps } from "../types"
import session from "@/engine/session";
import { sessionStore } from "@/engine/store";
import React, { useEffect, useState } from "react";

type NativeEvent = React.InputEvent<HTMLInputElement | HTMLTextAreaElement>;

const useAdaptiveDebounce: useAdaptiveDebounceProps = (onFire, minFireLength) => {
    const [debug, setDebug] = useState<SessionState>();
    
    useEffect(() => {
        const unsubscribe = sessionStore.subscribe((state) => setDebug(state));
        setDebug(sessionStore.getState());

        return () => {
            unsubscribe();
        }
    }, [])

    const handleEvent = (e: NativeEvent, inputType: string, isComposing: boolean) => {
        const target = e.currentTarget;
        if (!target) return;
        
        const value = target.value;
        const fire = () => onFire(value);
        
        session.addEvent(value.length, inputType, isComposing, Date.now(), fire);
    };
    
    const bind = {
        onInput(e: NativeEvent) {
            const nativeEvent = e.nativeEvent as InputEvent;
            handleEvent(e, nativeEvent.inputType, nativeEvent.isComposing ?? false);
        },
        onCompositionEnd(e: NativeEvent) {
            handleEvent(e, 'insertCompositionText', false);
        }
    };

    return { bind, debug };
};

export default useAdaptiveDebounce