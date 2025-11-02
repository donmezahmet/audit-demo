// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  managers_email?: string;
  vp_email?: string;
  department?: string;
  status: 'active' | 'inactive';
  lastLogin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalUser {
  id: number;
  email: string;
  name: string;
  company?: string;
  access_reason?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  last_login?: string;
  created_by?: string;
  notes?: string;
  role?: string;
  must_reset_password: boolean;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  created_at: string;
}

// Chart Types
export interface Chart {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RoleChart {
  id: number;
  role_id: number;
  chart_id: number;
  has_access: boolean;
  created_at: string;
}

export interface ChartPermission {
  chart_name: string;
  can_view: boolean;
  can_export: boolean;
}

// Dashboard Component Types (New Permission System)
export interface DashboardComponent {
  id: number;
  component_key: string;
  display_name: string;
  description?: string;
  component_type: 'chart' | 'widget' | 'button' | 'section' | 'feature';
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RoleComponentPermission {
  id: number;
  role_id: number;
  component_id: number;
  can_view: boolean;
  can_interact: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  component_key?: string;
  display_name?: string;
  component_type?: string;
  category?: string;
}

// Task Types
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'to_do' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  due_date?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskPermissions {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface TaskAuditLog {
  id: number;
  task_id: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  changed_at: string;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
}

// Page Types
export interface Page {
  id: number;
  name: string;
  path: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PagePermission {
  id: number;
  role_id: number;
  page_id: number;
  can_access: boolean;
  created_at: string;
  updated_at: string;
}

// Auth Types
export interface AuthState {
  user: User | ExternalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role?: string;
  permissions?: {
    charts: ChartPermission[];
    tasks: TaskPermissions;
    pages: string[];
    // New component-based permissions
    components?: string[];
    interactiveComponents?: string[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Jira Types (for existing data structure)
export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    duedate?: string;
    [key: string]: any;
  };
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    [key: string]: any;
  }[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text: string;
    };
    datalabels?: any;
    annotation?: any;
  };
  scales?: any;
  [key: string]: any;
}

// Email Types
export interface EmailLog {
  id: number;
  sender_email: string;
  recipient_email: string;
  action_responsible?: string;
  chart_type?: string;
  email_type?: string;
  sent_at: string;
  success: boolean;
  error_message?: string;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  details?: string;
  created_at: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'date' | 'checkbox' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormErrors {
  [key: string]: string;
}

// Filter and Sort Types
export interface FilterOptions {
  search?: string;
  status?: string[];
  priority?: string[];
  assignee?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Audit Plan Types
export interface AuditPlanItem {
  key: string;
  summary: string;
  auditYear: string;
  auditLead: string;
  progressLevel: number; // 1-5
  statusLabel: string;
}

