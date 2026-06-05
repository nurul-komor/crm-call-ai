import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  companyId: string;
  roleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth(tokens: { accessToken: string; refreshToken: string }, user: AuthUser): void;
  setAccessToken(token: string): void;
  logout(): void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens, user) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'vf-auth' },
  ),
);
