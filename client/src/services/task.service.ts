import { api } from './api.client';
import type { Task, ApiResponse, PaginatedResponse, TaskAuditLog, TaskPermissions } from '@/types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assignee?: string;
  due_date?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: number;
}

export interface TaskFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  assignee?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export const taskService = {
  // Get all tasks with optional filters
  getTasks: async (filters?: TaskFilters): Promise<ApiResponse<Task[]>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });
    }
    return api.get(`/api/tasks?${params.toString()}`);
  },

  // Get paginated tasks
  getPaginatedTasks: async (page: number = 1, limit: number = 10, filters?: TaskFilters): Promise<PaginatedResponse<Task>> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });
    }
    return api.get(`/api/tasks/paginated?${params.toString()}`);
  },

  // Get single task
  getTask: async (id: number): Promise<ApiResponse<Task>> => {
    return api.get(`/api/tasks/${id}`);
  },

  // Create task
  createTask: async (data: CreateTaskData): Promise<ApiResponse<Task>> => {
    return api.post('/api/tasks', data);
  },

  // Update task
  updateTask: async (id: number, data: Partial<UpdateTaskData>): Promise<ApiResponse<Task>> => {
    return api.put(`/api/tasks/${id}`, data);
  },

  // Delete task
  deleteTask: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/api/tasks/${id}`);
  },

  // Get task audit log
  getTaskAuditLog: async (taskId: number): Promise<ApiResponse<TaskAuditLog[]>> => {
    return api.get(`/api/tasks/${taskId}/audit-log`);
  },

  // Get task permissions
  getTaskPermissions: async (): Promise<ApiResponse<TaskPermissions>> => {
    return api.get('/api/tasks/permissions');
  },

  // Export tasks to Excel
  exportTasks: async (filters?: TaskFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });
    }
    return api.get(`/api/tasks/export?${params.toString()}`, {
      responseType: 'blob',
    });
  },
};

