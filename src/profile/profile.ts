import { Profile } from "@/types";
import { fetchProfile } from "@/engine/cookie";
import { DEFAULT_PROFILE } from "./default";

class ProfileController {
    private static instance: ProfileController;
    
    // FIX: TS(264) 
    private profile: Profile = DEFAULT_PROFILE; 
    private listeners: ((profile: Profile | null) => void)[] = [];

    private constructor () {}

    static getInstance (): ProfileController {
        if(!ProfileController.instance) {
            ProfileController.instance = new ProfileController();
            ProfileController.instance.initialise();
        }

        return ProfileController.instance;
    }

    private async initialise(): Promise<void> {
        const fetchedProfile = await fetchProfile();
        
        // FIX: Only overwrite and notify if a profile was actually found in cookies
        if (fetchedProfile) {
            this.profile = fetchedProfile;
            this.notifyListeners(); 
        }
    }

    setProfile(profile: Profile): void {
        this.profile = { ...profile, lastUpdated: Date.now()}
        this.notifyListeners();
    }

    updateProfile(update: Partial<Profile>): void {
        if(!this.profile) return;
        this.profile = {
            ...this.profile,
            ...update,
            lastUpdated: Date.now()
        }
        this.notifyListeners()
    }

    getProfile(): Profile {
        console.log("asked for profile and got this", this.profile)
        return this.profile
    }

    subscribe(listener: (profile: Profile | null) => void): () => void {
        this.listeners.push(listener);
        return () => this.listeners = this.listeners.filter(l => l !== listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.profile));
    }
}

const profileController = ProfileController.getInstance();
export default profileController; 