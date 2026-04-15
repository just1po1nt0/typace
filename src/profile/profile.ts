import { Config, Profile } from "@/types";
import { DEFAULT_PROFILE } from "./default";
import { fetchProfile, pushProfile } from "@/engine/storage";
import { compareAndFilter } from "./update";

class ProfileController {
    private static instance: ProfileController;
    private profile: Profile = DEFAULT_PROFILE; 
    private listeners: ((profile: Profile | null) => void)[] = [];
    
    // Add a guard to prevent multiple reads if the hook mounts multiple times
    private isInitialised: boolean = false;

    private constructor () {}

    static getInstance (): ProfileController {
        if(!ProfileController.instance) {
            ProfileController.instance = new ProfileController();
        }
        return ProfileController.instance;
    }

    async initialise(config: Config): Promise<void> {
        if (this.isInitialised) return; 
        
        this.isInitialised = true;

        const fetchedProfile = await fetchProfile(config);
        
        if (fetchedProfile) {
            this.profile = fetchedProfile;
            this.notifyListeners(); 
        }
    }

    setProfile(profile: Profile): void {
        this.profile = { ...profile, lastUpdated: Date.now()};
        this.notifyListeners();
    }

    updateProfile(update: Profile, config: Config): void {
        if(!this.profile) return;
        this.profile = {
            ...this.profile,
            ...compareAndFilter(this.profile, update),
            lastUpdated: Date.now(),
            version: 2
        };
        this.notifyListeners();
        pushProfile(this.profile, config);
    }

    getProfile(): Profile {
        return this.profile;
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