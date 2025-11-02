import { api } from './api.client';
import type { ApiResponse, DashboardComponent, RoleComponentPermission } from '@/types';

export interface UpdatePermissionsData {
  permissions: Array<{
    componentId: number;
    canView: boolean;
    canInteract: boolean;
  }>;
}

export interface BulkPermissionsData {
  roleId: number;
  componentIds: number[];
  action: 'grant' | 'revoke';
  permissionType?: 'view' | 'interact' | 'both';
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export const permissionService = {
  // Get all roles
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    return api.get('/api/admin/roles');
  },

  // Get all dashboard components
  getDashboardComponents: async (): Promise<ApiResponse<DashboardComponent[]>> => {
    return api.get('/api/admin/dashboard-components');
  },

  // Get permissions for a specific role
  getRolePermissions: async (roleId: number): Promise<ApiResponse<RoleComponentPermission[]>> => {
    return api.get(`/api/admin/role-permissions/${roleId}`);
  },

  // Update permissions for a role
  updateRolePermissions: async (
    roleId: number, 
    data: UpdatePermissionsData
  ): Promise<ApiResponse<void>> => {
    return api.put(`/api/admin/role-permissions/${roleId}`, data);
  },

  // Bulk grant or revoke permissions
  bulkUpdatePermissions: async (data: BulkPermissionsData): Promise<ApiResponse<void>> => {
    return api.post('/api/admin/bulk-permissions', data);
  },
};

