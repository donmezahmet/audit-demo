import { api } from './api.client';
import type { ExternalUser, ApiResponse, AuthState } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export const authService = {
  // Get current user
  getCurrentUser: async (): Promise<any> => {
    // Backend returns: { authenticated, user, role, permissions }
    return api.get('/api/auth/status');
  },

  // Login with email/password (for external users)
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: ExternalUser; role: string }>> => {
    return api.post('/api/auth/login', credentials);
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    return api.post('/api/auth/logout');
  },

  // Google OAuth login
  googleLogin: (): void => {
    window.location.href = '/auth/google';
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    return api.post('/api/auth/request-reset-password', { email });
  },

  // Reset password with token
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse<void>> => {
    return api.post('/api/auth/reset-password', data);
  },

  // Change password (when logged in)
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    return api.post('/api/auth/change-password', { currentPassword, newPassword });
  },

  // Check if user is authenticated
  checkAuth: async (): Promise<boolean> => {
    try {
      const response = await authService.getCurrentUser();
      return response.success && !!response.data?.user;
    } catch (error) {
      return false;
    }
  },

  // Get user permissions
  getPermissions: async (): Promise<ApiResponse<AuthState['permissions']>> => {
    return api.get('/api/auth/permissions');
  },

  // View as user (admin impersonation)
  viewAsUser: async (targetEmail: string): Promise<ApiResponse<any>> => {
    return api.post('/api/admin/impersonate', { targetEmail });
  },

  // Stop impersonation
  stopImpersonation: async (): Promise<ApiResponse<void>> => {
    return api.post('/api/admin/stop-impersonation');
  },
};

