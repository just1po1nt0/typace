import { Config } from "@/types";

const DEFAULT_CONFIG: Config = {
    persistentStorage: false,
    useCookie: false,
    cookieMaxAgeDays: 180,
    minFireLength: 1,
    strictMinLength: true,
    fireOnEnter: true,
    fireOnPaste: false,
    compositionBuffer: 10000,
    minFireDelay: 100,
    maxWait: -1
}

export default DEFAULT_CONFIG;