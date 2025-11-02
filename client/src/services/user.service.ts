import { api } from './api.client';
import type { User, ExternalUser, Role, ApiResponse, ChartPermission } from '@/types';

export interface CreateUserData {
  email: string;
  name: string;
  managers_email?: string;
  vp_email?: string;
  department?: string;
  role_id: number;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  status?: 'active' | 'inactive';
}

export interface CreateExternalUserData {
  email: string;
  name: string;
  company?: string;
  access_reason?: string;
  expires_at?: string;
  chart_permissions?: ChartPermission[];
  role?: string;
}

export const userService = {
  // Internal Users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return api.get('/api/users');
  },

  // Access Management - Get all users with full details
  getAccessManagementUsers: async (): Promise<ApiResponse<User[]>> => {
    return api.get('/api/access-management/users');
  },

  getUser: async (id: number): Promise<ApiResponse<User>> => {
    return api.get(`/api/users/${id}`);
  },

  createUser: async (data: CreateUserData): Promise<ApiResponse<User>> => {
    return api.post('/api/users', data);
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<ApiResponse<User>> => {
    return api.put(`/api/users/${id}`, data);
  },

  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/api/users/${id}`);
  },

  getUserRole: async (userId: number): Promise<ApiResponse<Role>> => {
    return api.get(`/api/users/${userId}/role`);
  },

  // External Users
  getExternalUsers: async (): Promise<ApiResponse<ExternalUser[]>> => {
    return api.get('/api/external-users');
  },

  getExternalUser: async (id: number): Promise<ApiResponse<ExternalUser>> => {
    return api.get(`/api/external-users/${id}`);
  },

  createExternalUser: async (data: CreateExternalUserData): Promise<ApiResponse<ExternalUser>> => {
    return api.post('/api/external-users', data);
  },

  updateExternalUser: async (id: number, data: Partial<CreateExternalUserData>): Promise<ApiResponse<ExternalUser>> => {
    return api.put(`/api/external-users/${id}`, data);
  },

  deleteExternalUser: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/api/external-users/${id}`);
  },

  getExternalUserPermissions: async (userId: number): Promise<ApiResponse<ChartPermission[]>> => {
    return api.get(`/api/external-users/${userId}/permissions`);
  },

  updateExternalUserPermissions: async (userId: number, permissions: ChartPermission[]): Promise<ApiResponse<void>> => {
    return api.put(`/api/external-users/${userId}/permissions`, { permissions });
  },

  // Roles
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    return api.get('/api/roles');
  },

  getRole: async (id: number): Promise<ApiResponse<Role>> => {
    return api.get(`/api/roles/${id}`);
  },

  createRole: async (data: { name: string; description?: string }): Promise<ApiResponse<Role>> => {
    return api.post('/api/roles', data);
  },

  updateRole: async (id: number, data: { name?: string; description?: string }): Promise<ApiResponse<Role>> => {
    return api.put(`/api/roles/${id}`, data);
  },

  deleteRole: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/api/roles/${id}`);
  },

  // Google Group Sync
  syncGoogleGroup: async (): Promise<ApiResponse<{ stats: any; timestamp: string }>> => {
    return api.post('/api/admin/sync-google-group');
  },
};

