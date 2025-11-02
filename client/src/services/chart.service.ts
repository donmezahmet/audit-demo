import { api } from './api.client';
import type { Chart, ChartData, ApiResponse } from '@/types';

export interface ChartFilters {
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export const chartService = {
  // Get all available charts
  getCharts: async (): Promise<ApiResponse<Chart[]>> => {
    return api.get('/api/charts');
  },

  // Get specific chart data
  getChartData: async (chartName: string, filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/api/charts/${encodeURIComponent(chartName)}/data?${params.toString()}`);
  },

  // Export chart as image
  exportChart: async (chartName: string, filters?: ChartFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/api/charts/${encodeURIComponent(chartName)}/export?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  // Get user's accessible charts
  getUserCharts: async (): Promise<ApiResponse<Chart[]>> => {
    return api.get('/api/charts/user');
  },

  // Audit Projects by Year
  getAuditProjectsByYear: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('audit-projects-by-year', filters);
  },

  // Investigations by Year
  getInvestigationsByYear: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('investigations-by-year', filters);
  },

  // Fraud Impact by Year
  getFraudImpactByYear: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('fraud-impact-by-year', filters);
  },

  // Finding Actions Status Distribution
  getFindingActionsStatus: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('finding-actions-status', filters);
  },

  // Audit Findings by Year and Status
  getAuditFindingsByYear: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('audit-findings-by-year', filters);
  },

  // Finding Actions by Lead and Status
  getFindingActionsByLead: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('finding-actions-by-lead', filters);
  },

  // Audit Plan Progress Tracker
  getAuditPlanProgress: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('audit-plan-progress', filters);
  },

  // Finding Actions Aging
  getFindingActionsAging: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('finding-actions-aging', filters);
  },

  // Risk Level Distribution
  getRiskLevelDistribution: async (filters?: ChartFilters): Promise<ApiResponse<ChartData>> => {
    return chartService.getChartData('risk-level-distribution', filters);
  },
};

