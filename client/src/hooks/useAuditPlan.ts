import { useQuery } from '@tanstack/react-query';
import { jiraService } from '@/services/jira.service';
import type { AuditPlanItem } from '@/types';

export function useAuditPlan() {
  return useQuery({
    queryKey: ['audit-plan'],
    queryFn: async () => {
      const data = await jiraService.getAuditPlan();
      return data as AuditPlanItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

