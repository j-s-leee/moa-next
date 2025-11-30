import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));

