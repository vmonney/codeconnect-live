import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { getToken, clearToken, setToken } from '@/api/httpClient';

describe('Auth Store Integration', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    clearToken();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const { login } = useAuthStore.getState();

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.name).toBe('Test User');
      expect(state.user?.role).toBe('interviewer');
      expect(getToken()).toBe('mock-jwt-token');
    });

    it('should fail login with invalid credentials', async () => {
      const { login } = useAuthStore.getState();

      const result = await login('wrong@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(getToken()).toBeNull();
    });

    it('should set isLoading during login', async () => {
      const { login } = useAuthStore.getState();

      // Check initial state
      expect(useAuthStore.getState().isLoading).toBe(false);

      // Start login (don't await)
      const loginPromise = login('test@example.com', 'password123');

      // isLoading should be true immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Wait for completion
      await loginPromise;

      // isLoading should be false after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('signup', () => {
    it('should signup successfully with new email', async () => {
      const { signup } = useAuthStore.getState();

      const result = await signup('new@example.com', 'password123', 'New User', 'candidate');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('new@example.com');
      expect(state.user?.name).toBe('New User');
      expect(state.user?.role).toBe('candidate');
      expect(getToken()).toBe('mock-jwt-token-new');
    });

    it('should fail signup with existing email', async () => {
      const { signup } = useAuthStore.getState();

      const result = await signup('existing@example.com', 'password123', 'Existing', 'interviewer');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account with this email already exists');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear token and user on logout', async () => {
      const { login, logout } = useAuthStore.getState();

      // First login
      await login('test@example.com', 'password123');
      expect(getToken()).toBe('mock-jwt-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Then logout
      logout();

      expect(getToken()).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('initializeAuth', () => {
    it('should restore session from valid token', async () => {
      // Set a valid token
      setToken('mock-jwt-token');

      const { initializeAuth } = useAuthStore.getState();
      await initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should clear invalid token on initialize', async () => {
      // Set an invalid token
      setToken('invalid-token');

      const { initializeAuth } = useAuthStore.getState();
      await initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(getToken()).toBeNull();
    });

    it('should do nothing when no token exists', async () => {
      // Ensure no token
      clearToken();

      const { initializeAuth } = useAuthStore.getState();
      await initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const { login, updateProfile } = useAuthStore.getState();

      // First login
      await login('test@example.com', 'password123');

      // Update profile
      const result = await updateProfile({ name: 'Updated Name' });

      expect(result.success).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Updated Name');
    });

    it('should fail when not authenticated', async () => {
      const { updateProfile } = useAuthStore.getState();

      const result = await updateProfile({ name: 'Updated Name' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });
});
