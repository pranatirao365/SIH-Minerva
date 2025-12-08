import { create } from 'zustand';
import { Role } from '../constants/roles';
import { Language } from '../constants/translations';

interface User {
  id: string;
  name: string;
  phone: string;
  role: Role | null;
}

interface ModuleProgress {
  video: boolean;
  briefing: boolean;
  quiz: boolean;
  game: boolean;
}

interface RoleState {
  user: User;
  language: Language;
  isAuthenticated: boolean;
  languagePreferenceSet: boolean;
  moduleProgress: ModuleProgress;
  safetyScore: number;
  setUser: (user: Partial<User>) => void;
  setLanguage: (language: Language) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setRole: (role: Role) => void;
  setLanguagePreferenceSet: (set: boolean) => void;
  completeModule: (module: keyof ModuleProgress) => void;
  updateSafetyScore: (score: number) => void;
  logout: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  user: {
    id: '',
    name: '',
    phone: '',
    role: null,
  },
  language: 'en',
  isAuthenticated: false,
  languagePreferenceSet: false,
  moduleProgress: {
    video: false,
    briefing: false,
    quiz: false,
    game: false,
  },
  safetyScore: 0,
  setUser: (user) => set((state) => ({
    user: { ...state.user, ...user },
  })),
  setLanguage: (language) => set({ language }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setRole: (role) => set((state) => ({
    user: { ...state.user, role },
  })),
  setLanguagePreferenceSet: (languagePreferenceSet) => set({ languagePreferenceSet }),
  completeModule: (module) => set((state) => ({
    moduleProgress: { ...state.moduleProgress, [module]: true },
  })),
  updateSafetyScore: (score) => set({ safetyScore: score }),
  logout: () => set({
    user: { id: '', name: '', phone: '', role: null },
    isAuthenticated: false,
    languagePreferenceSet: false,
    moduleProgress: { video: false, briefing: false, quiz: false, game: false },
    safetyScore: 0,
  }),
}));
