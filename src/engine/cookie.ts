import { DEFAULT_PROFILE } from "@/profile/default";
import { Profile } from "@/types";

export type ProfileCookie = {
    v: number;
    st: number; // samples
    sp: number;
    se: number;
    sf: number;
    tc: number; // tempo
    td: number;
    pc: number; // pause
    pd: number;
    er: number; // edit rate
    ft: number; // fire tolerance
    ts: number; // timestamp
};

export const COOKIE_NAME = "typace_profile";
export const DEFAULT_EXPIRES_DAYS = 365;

/** 
 * @returns serialised data prepared for storage within a cookie 
 */
export const serialiseProfile = (profile: Profile): ProfileCookie => ({
    v: profile.version,
    st: profile.tempoProfile.samples,
    sp: profile.pauseProfile.samples,
    se: profile.editProfile.samples,
    sf: profile.toleranceProfile.samples,
    tc: Math.round(profile.tempoProfile.meanCPS * 100) / 100,
    td: Math.round(profile.tempoProfile.deviation * 100) / 100,
    pc: Math.round(profile.pauseProfile.meanPause / 10),
    pd: Math.round(profile.pauseProfile.deviation / 10),
    er: Math.round(profile.editProfile.editRate * 100) / 100,
    ft: Math.round(profile.toleranceProfile.fireTolerance * 100) / 100,
    ts: profile.lastUpdated ?? Date.now()
});

/**
 * @returns deserialised data for usage within the library
 */
export const deserialiseProfile = (cookie: ProfileCookie): Profile => ({
    version: cookie.v,
    tempoProfile: {
        meanCPS: cookie.tc,
        deviation: cookie.td,
        samples: cookie.st,
    },
    pauseProfile: {
        meanPause: cookie.pc * 1000,
        deviation: cookie.pd * 1000,
        //longPauseThreshold: (cookie.pc * 10) + (2 * cookie.pd * 10),
        samples: cookie.sp
    },
    editProfile: {
        editRate: cookie.er,
        samples: cookie.se
    },
    toleranceProfile: {
        fireTolerance: cookie.ft,
        samples: cookie.sf
    },
    lastUpdated: cookie.ts
});

const getCookie = async (name: string): Promise<string | undefined> => {
    // Using the native global cookieStore
    const cookie = await cookieStore.get({name: name});
    return cookie ? cookie.value : undefined; 
}

const setCookie = async (name: string, value: string, expiresDays: number = DEFAULT_EXPIRES_DAYS): Promise<void> => {
    await cookieStore.set({
        name: name, 
        value: value, 
        expires: Date.now() + expiresDays * 24 * 60 * 60 * 1000,
        sameSite: "none"
    });
}

export const fetchProfile = async (): Promise<Profile | undefined> => {
    const cookieData: string | undefined = await getCookie(COOKIE_NAME) ?? undefined;
    if(!cookieData) return DEFAULT_PROFILE;
    return deserialiseProfile(JSON.parse(cookieData));
}

export const pushProfile = async (profile: Profile): Promise<void> => {
    const pushableData = JSON.stringify(serialiseProfile(profile));
    await setCookie(COOKIE_NAME, pushableData);
}