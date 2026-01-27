import { DEFAULT_PROFILE } from "@/profile/defaultProfile";
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
    ts: string; // timestamp
};

export const COOKIE_NAME = "typace_profile_v1";
export const DEFAULT_EXPIRES_DAYS = 365;

/** 
 * @returns serialised data prepared for storage within a cookie 
 */
export const serialiseProfile = (profile: Profile): ProfileCookie => ({
    v: profile.version,
    st: profile.samples.tempo,
    sp: profile.samples.pause,
    se: profile.samples.edit,
    sf: profile.samples.fireTolerance,
    tc: Math.round(profile.tempoProfile.meanCPS * 100) / 100,
    td: Math.round(profile.tempoProfile.deviation * 100) / 100,
    pc: Math.round(profile.pauseProfile.meanPause / 10),
    pd: Math.round(profile.pauseProfile.deviation / 10),
    er: Math.round(profile.editRate * 100) / 100,
    ft: Math.round(profile.fireTolerance * 100) / 100,
    ts: profile.lastUpdated?.toISOString() ?? new Date().toISOString()
});

/**
 * @returns deserialised data for usage within the library
 */
export const deserialiseProfile = (cookie: ProfileCookie): Profile => ({
    version: cookie.v,
    samples: {
        tempo: cookie.st,
        pause: cookie.sp,
        edit: cookie.se,
        fireTolerance: cookie.sf
    },
    tempoProfile: {
        meanCPS: cookie.tc,
        deviation: cookie.td
    },
    pauseProfile: {
        meanPause: cookie.pc * 10,
        deviation: cookie.pd * 10,
        longPauseThreshold: (cookie.pc * 10) + (2 * cookie.pd * 10)
    },
    editRate: cookie.er,
    fireTolerance: cookie.ft,
    lastUpdated: new Date(cookie.ts)
});

const getCookie = async (name: string): Promise<string | undefined> => {
    const cookies = new CookieStore();
    return (await cookies.get({name: name})).name;
}

const setCookie = async (name: string, value: string, expiresDays: number = DEFAULT_EXPIRES_DAYS): Promise<void> => {
    const cookies = new CookieStore();
    await cookies.set({name: name, value: value, expires: Date.now() + expiresDays * 24 * 60 * 60 * 1000,
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