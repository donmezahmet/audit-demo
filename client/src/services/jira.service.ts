import { api } from './api.client';
import type { ApiResponse } from '@/types';

// Jira-specific types
export interface JiraFindingAction {
  key: string;
  summary: string;
  description?: string;
  status: string;
  dueDate?: string;
  responsible?: string;
  cLevel?: string;
  auditYear?: string;
  auditName?: string;
  riskLevel?: string;
  [key: string]: any;
}

export interface FindingStatusByYear {
  [year: string]: {
    [status: string]: number;
  };
}

export interface ChartDataResponse {
  labels: string[];
  datasets: any[];
}

export const jiraService = {
  // === Audit Projects ===
  getAuditProjectsByYear: async (): Promise<any> => {
    return api.get('/api/audit-projects-by-year');
  },

  // === Investigations ===
  getInvestigationCounts: async (): Promise<any> => {
    return api.get('/api/investigation-counts');
  },

  // === Finding Status ===
  getFindingStatusByYear: async (auditTypes?: string[], auditCountries?: string[]): Promise<FindingStatusByYear> => {
    const params = new URLSearchParams();
    if (auditTypes?.length) {
      auditTypes.forEach(type => params.append('auditTypes', type));
    }
    if (auditCountries?.length) {
      auditCountries.forEach(country => params.append('auditCountries', country));
    }
    return api.get(`/api/finding-status-by-year?${params.toString()}`);
  },

  // === Finding Actions ===
  getFindingActionStatusDistribution: async (auditYear?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (auditYear) params.append('auditYear', auditYear);
    return api.get(`/api/finding-action-status-distribution?${params.toString()}`);
  },

  getFindingActionsByLead: async (): Promise<any> => {
    return api.get('/api/finding-action-status-by-lead');
  },

  getUserFindingActions: async (filters?: { auditYear?: string; cLevel?: string }): Promise<JiraFindingAction[]> => {
    const params = new URLSearchParams();
    if (filters?.auditYear) params.append('auditYear', filters.auditYear);
    if (filters?.cLevel) params.append('cLevel', filters.cLevel);
    return api.get(`/api/user-finding-actions?${params.toString()}`);
  },

  getDepartmentFindingActions: async (filters?: { auditYear?: string }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.auditYear) params.append('auditYear', filters.auditYear);
    return api.get(`/api/department-finding-actions?${params.toString()}`);
  },

  getCLevelFindingActions: async (filters?: { auditYear?: string }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.auditYear) params.append('auditYear', filters.auditYear);
    return api.get(`/api/clevel-finding-actions?${params.toString()}`);
  },

  getAllFindingActions: async (filters?: { auditYear?: string }): Promise<any> => {
    const params = new URLSearchParams();
    const auditYear = filters?.auditYear || 'all';
    params.append('auditYear', auditYear);
    return api.get(`/api/all-finding-actions?${params.toString()}`);
  },

  getVPFindingActions: async (filters?: { auditYear?: string; cLevel?: string }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.auditYear) params.append('auditYear', filters.auditYear);
    if (filters?.cLevel) params.append('cLevel', filters.cLevel);
    return api.get(`/api/vp-finding-actions?${params.toString()}`);
  },

  // === Finding Actions Aging ===
  getFindingActionsAging: async (): Promise<any> => {
    return api.get('/api/finding-actions-aging');
  },

  getFindingActionAgeSummary: async (): Promise<any> => {
    return api.get('/api/finding-action-age-summary');
  },

  // === Risk Distribution ===
  getFindingRiskDistributionByProject: async (): Promise<any> => {
    return api.get('/api/finding-risk-distribution-by-project');
  },

  getFindingDetailsByControlAndRisk: async (): Promise<any> => {
    return api.get('/api/finding-details-by-control-and-risk');
  },

  getFindingDetailsByTypeAndRisk: async (): Promise<any> => {
    return api.get('/api/finding-details-by-type-and-risk');
  },

  // === Financial Impact ===
  getFraudImpactScoreCards: async (): Promise<any> => {
    return api.get('/api/fraud-impact-score-cards');
  },

  getLpImpactScoreCards: async (): Promise<any> => {
    return api.get('/api/lp-impact-score-cards');
  },

  getFinancialImpactSum: async (): Promise<any> => {
    return api.get('/api/financial-impact-sum');
  },

  // === Audit Maturity ===
  getMatScores: async (): Promise<any> => {
    return api.get('/api/mat-scores');
  },

  getRadarChartData: async (): Promise<any> => {
    return api.get('/api/radar-chart-data');
  },

  // === Google Sheets ===
  getGoogleSheetData: async (): Promise<any> => {
    return api.get('/api/google-sheet-data');
  },

  // === Filters ===
  getAuditTypes: async (): Promise<string[]> => {
    return api.get('/api/audit-types');
  },

  getAuditCountries: async (): Promise<string[]> => {
    return api.get('/api/audit-countries');
  },

  getCLevelOptions: async (): Promise<string[]> => {
    return api.get('/api/clevel-options');
  },

  getActionResponsibleOptions: async (): Promise<string[]> => {
    return api.get('/api/action-responsible-options');
  },

  // Action Age Distribution
  getActionAgeDistribution: async (filters?: { responsibleEmail?: string; auditYear?: string }) => {
    const params = new URLSearchParams();
    if (filters?.responsibleEmail) params.append('responsibleEmail', filters.responsibleEmail);
    if (filters?.auditYear) params.append('auditYear', filters.auditYear);
    return api.get(`/api/finding-action-age?${params.toString()}`);
  },

  // Lead Status Distribution
  getLeadStatusDistribution: async (auditYear: '2024+' | 'all' = '2024+') => {
    const encodedYear = encodeURIComponent(auditYear);
    return api.get(`/api/lead-status-distribution?auditYear=${encodedYear}`);
  },

  // Project Risk Distribution
  getProjectRiskDistribution: async () => {
    return api.get('/api/project-risk-distribution');
  },

  // Department Stats
  getDepartmentStats: async () => {
    return api.get('/api/department-stats');
  },

  // === Export ===
  exportFindingActions: async (filters?: any): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    return api.get(`/api/finding-actions-export?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportFindingActionsAging: async (): Promise<Blob> => {
    return api.get('/api/finding-actions-aging-export', {
      responseType: 'blob',
    });
  },

  // === Email ===
  getActionResponsibleList: async (): Promise<ApiResponse<any>> => {
    return api.get('/api/email/action-responsible-list');
  },

  getAllActionResponsibleList: async (): Promise<ApiResponse<any>> => {
    return api.get('/api/email/all-action-responsible-list');
  },

  getCLevelList: async (): Promise<ApiResponse<any>> => {
    return api.get('/api/email/clevel-list');
  },

  getActionDataForEmail: async (
    recipientEmail: string,
    reportingTarget: 'action_responsible' | 'clevel',
    auditYear?: string
  ): Promise<ApiResponse<{
    chartHTML: string;  // HTML chart visualization
    overdueTableHTML: string;
    upcomingTableHTML: string;
    riskAcceptedTableHTML: string;
    openFinancialImpact: string;  // Formatted string like "25.5 Bin €"
    overdueFinancialImpact: string;  // Formatted string like "15.2 Bin €"
    overdueCount: number;  // Number of overdue actions
    upcomingCount: number;  // Number of upcoming actions
    riskAcceptedCount: number;  // Number of risk accepted actions
  }>> => {
    return api.get(`/api/email/action-data/${recipientEmail}`, {
      params: { reportingTarget, auditYear: auditYear || '2024+' }
    });
  },

  sendEmail: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/api/send-email', data);
  },

  sendActionResponsibleEmail: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/api/send-action-responsible-email', data);
  },

  sendCLevelEmail: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/api/send-clevel-email', data);
  },

  // Audit Plan
  getAuditPlan: async (): Promise<any[]> => {
    return api.get('/api/yearly-audit-plan');
  },

  // Finding Distribution Tables
  getControlElementDistribution: async (auditYear?: string): Promise<any[]> => {
    const params = auditYear ? `?auditYear=${encodeURIComponent(auditYear)}` : '';
    return api.get(`/api/statistics-by-control-and-risk${params}`);
  },

  getRiskTypeDistribution: async (auditYear?: string): Promise<any[]> => {
    const params = auditYear ? `?auditYear=${encodeURIComponent(auditYear)}` : '';
    return api.get(`/api/statistics-by-type-and-risk${params}`);
  },

  // Get detailed actions by status (for modal)
  getActionsByStatus: async (status: string, auditYear?: string): Promise<any[]> => {
    const params = new URLSearchParams({ status });
    if (auditYear) params.append('auditYear', auditYear);
    return api.get(`/api/finding-actions-by-status?${params.toString()}`);
  },

  // Google Sheets data
  getFraudInternalControl: async (): Promise<{ result: string[][] }> => {
    return api.get('/api/google-sheet-data');
  },

  getLossPreventionSummary: async (): Promise<{ result: string[][] }> => {
    return api.get('/api/loss-prevention-summary');
  },

  // Get overdue actions
  getOverdueActions: async (): Promise<any[]> => {
    return api.get('/api/overdue-actions');
  },

  // Get upcoming actions (within 30 days)
  getUpcomingActions: async (): Promise<any[]> => {
    return api.get('/api/upcoming-actions');
  },

  // Get Team Finding Actions (filtered by customfield_22459 - Manager Email)
  getTeamFindingActions: async (filters?: { auditYear?: string }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.auditYear && filters.auditYear !== 'all') {
      params.append('auditYear', filters.auditYear);
    }
    return api.get(`/api/team-finding-actions${params.toString() ? `?${params.toString()}` : ''}`);
  },

  // Management Finding Actions (filtered by customfield_22185 with logged-in user's email)
  getManagementFindingActions: async (filters?: { auditYear?: string }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.auditYear && filters.auditYear !== 'all') {
      params.append('auditYear', filters.auditYear);
    }
    return api.get(`/api/management-finding-actions${params.toString() ? `?${params.toString()}` : ''}`);
  },
};

