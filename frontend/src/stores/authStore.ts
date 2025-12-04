import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { httpClient, setToken, clearToken, getToken } from '@/api/httpClient';
import { TokenResponse, BackendUser, ApiError } from '@/api/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  initializeAuth: () => Promise<void>;
}

// Transform backend user format to frontend User type
function transformUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.name,
    role: backendUser.role,
    avatar: backendUser.avatar ?? undefined,
    createdAt: backendUser.created_at,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          const response = await httpClient.post<TokenResponse>('/auth/login', {
            email,
            password,
          });

          setToken(response.access_token);
          const user = transformUser(response.user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const apiError = error as ApiError;
          return { success: false, error: apiError.detail };
        }
      },

      signup: async (email, password, name, role) => {
        set({ isLoading: true });

        try {
          const response = await httpClient.post<TokenResponse>('/auth/signup', {
            email,
            password,
            name,
            role,
          });

          setToken(response.access_token);
          const user = transformUser(response.user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const apiError = error as ApiError;
          return { success: false, error: apiError.detail };
        }
      },

      logout: () => {
        clearToken();
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }

        try {
          const response = await httpClient.patch<BackendUser>(`/users/${user.id}`, {
            name: updates.name,
            avatar: updates.avatar,
          });

          const updatedUser = transformUser(response);
          set({ user: updatedUser });

          return { success: true };
        } catch (error) {
          const apiError = error as ApiError;
          return { success: false, error: apiError.detail };
        }
      },

      initializeAuth: async () => {
        const token = getToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const backendUser = await httpClient.get<BackendUser>('/auth/me');
          set({
            user: transformUser(backendUser),
            isAuthenticated: true,
          });
        } catch {
          // Token is invalid or expired
          clearToken();
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'codeview-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
