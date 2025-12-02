import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

// Mock user database
const mockUsers: Map<string, { user: User; password: string }> = new Map();

// Pre-populate with demo users
mockUsers.set('interviewer@demo.com', {
  user: {
    id: 'demo-interviewer',
    email: 'interviewer@demo.com',
    name: 'Alex Chen',
    role: 'interviewer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    createdAt: new Date().toISOString(),
  },
  password: 'demo123',
});

mockUsers.set('candidate@demo.com', {
  user: {
    id: 'demo-candidate',
    email: 'candidate@demo.com',
    name: 'Jordan Smith',
    role: 'candidate',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
    createdAt: new Date().toISOString(),
  },
  password: 'demo123',
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const userData = mockUsers.get(email.toLowerCase());
        
        if (!userData) {
          set({ isLoading: false });
          return { success: false, error: 'No account found with this email' };
        }

        if (userData.password !== password) {
          set({ isLoading: false });
          return { success: false, error: 'Incorrect password' };
        }

        set({ 
          user: userData.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return { success: true };
      },

      signup: async (email, password, name, role) => {
        set({ isLoading: true });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        if (mockUsers.has(email.toLowerCase())) {
          set({ isLoading: false });
          return { success: false, error: 'An account with this email already exists' };
        }

        const newUser: User = {
          id: uuidv4(),
          email: email.toLowerCase(),
          name,
          role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
          createdAt: new Date().toISOString(),
        };

        mockUsers.set(email.toLowerCase(), { user: newUser, password });

        set({ 
          user: newUser, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
          
          // Update mock database
          const userData = mockUsers.get(user.email);
          if (userData) {
            mockUsers.set(user.email, { ...userData, user: updatedUser });
          }
        }
      },
    }),
    {
      name: 'codeview-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
