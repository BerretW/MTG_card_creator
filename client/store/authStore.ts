import { create } from 'zustand';
import { getUserIdFromToken } from '../utils/token';

interface AuthState {
  token: string | null;
  userId: number | null;
  login: (newToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('accessToken'),
  userId: getUserIdFromToken(localStorage.getItem('accessToken')),

  login: (newToken) => {
    localStorage.setItem('accessToken', newToken);
    set({ token: newToken, userId: getUserIdFromToken(newToken) });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ token: null, userId: null });
  },
}));