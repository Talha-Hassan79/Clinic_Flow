import { create } from 'zustand';
import type { UserProfile } from '../services/auth.service';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const STORAGE_KEY = 'clinicflow_auth';

const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        user: parsed.user || null,
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
        isAuthenticated: !!parsed.accessToken,
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create<AuthState>((set) => {
  const initial = getInitialState();

  return {
    ...initial,
    isLoading: false,

    setAuth: (user, accessToken, refreshToken) => {
      const newState = { user, accessToken, refreshToken, isAuthenticated: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      set(newState);
    },

    setTokens: (accessToken, refreshToken) => {
      set((state) => {
        const newState = { ...state, accessToken, refreshToken, isAuthenticated: true };
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user: state.user,
            accessToken,
            refreshToken,
          })
        );
        return newState;
      });
    },

    setUser: (user) => {
      set((state) => {
        const newState = { ...state, user };
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          })
        );
        return newState;
      });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },

    setLoading: (isLoading) => set({ isLoading }),
  };
});
