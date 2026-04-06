import { useAdaptiveDebounceProps } from "@/types"
import session from "@/engine/session";

const useAdaptiveDebounce: useAdaptiveDebounceProps = (onFire, minFireLength) => {
    const bind = {
        onbeforeinput(e: React.InputEvent<HTMLInputElement | HTMLTextAreaElement>) {
            const length = e.currentTarget.value.length;
            const inputType = e.nativeEvent.inputType;
            const isComposing = e.nativeEvent.isComposing;
            const timestamp = e.nativeEvent.timeStamp;

            session.addEvent(length, inputType, isComposing, timestamp)
        }
    }

    return {
        bind
    }
}