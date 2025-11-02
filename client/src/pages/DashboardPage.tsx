import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Button, Badge, Loading } from '@/components/ui';
import { BarChart, PieChart, ActionAgeChart, AuditProgressChart, RadarChart } from '@/components/charts';
import { ChartData } from 'chart.js';
import { useAuthStore } from '@/store/auth.store';
import { PermissionGate } from '@/components/PermissionGate';
import ActionDetailsModal from '@/components/ActionDetailsModal';
import ActionsListModal from '@/components/ActionsListModal';
import { formatFinancialImpact } from '@/utils/format';
import {
  useAuditProjectsByYear,
  useInvestigationCounts,
  useFindingStatusByYear,
  useFindingActionStatusDistribution,
  useFraudImpactScoreCards,
  useLpImpactScoreCards,
  useActionAgeDistribution,
  useLeadStatusDistribution,
  useMatScores,
  useRadarChartData,
  useControlElementDistribution,
  useRiskTypeDistribution,
  useFraudInternalControl,
  useLossPreventionSummary,
  useOverdueActions,
  useUpcomingActions,
} from '@/hooks';

const DashboardPage: React.FC = () => {
  const [scorecardFilter, setScorecardFilter] = useState<'2024+' | 'all'>('2024+'); // New state for scorecard filter
  const [maturityYear, setMaturityYear] = useState<'2024' | '2025'>('2024'); // State for maturity year toggle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAllCharts, setShowAllCharts] = useState(false); // State for showing all charts
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const { user, role } = useAuthStore();

  // Fetch real data from Jira
  const { data: auditProjects, isLoading: loadingProjects } = useAuditProjectsByYear();
  const { data: investigations, isLoading: loadingInvestigations } = useInvestigationCounts();
  const { data: findingStatus, isLoading: loadingFindingStatus } = useFindingStatusByYear(
    undefined,
    undefined
  );
  const { data: actionStatus, isLoading: loadingActionStatus } = useFindingActionStatusDistribution(scorecardFilter);
  // Financial Impact always shows 2024+ data (independent of toggle)
  const { data: financialImpactData, isLoading: loadingFinancialImpact } = useFindingActionStatusDistribution('2024+');
  const { data: fraudImpact, isLoading: loadingFraud } = useFraudImpactScoreCards();
  const { data: lpImpact, isLoading: loadingLP } = useLpImpactScoreCards();
  
  // Action Age Distribution - No audit year filter (show all Open actions)
  const { data: actionAgeData, isLoading: loadingActionAge } = useActionAgeDistribution({});
  
  // Lead Status Distribution
  const { data: leadStatusData, isLoading: loadingLeadStatus } = useLeadStatusDistribution(scorecardFilter);
  
  // MAT Scores
  const { data: matScores, isLoading: loadingMAT } = useMatScores();
  
  // Radar Chart Data
  const { data: radarChartData, isLoading: loadingRadar } = useRadarChartData();
  
  // Google Sheets data
  const { data: fraudInternalControl, isLoading: loadingFraud2 } = useFraudInternalControl();
  const { data: lossPreventionSummary, isLoading: loadingLossPrevention } = useLossPreventionSummary();
  
  // Overdue and Upcoming actions
  const { data: overdueActions, isLoading: loadingOverdue } = useOverdueActions();
  const { data: upcomingActions, isLoading: loadingUpcoming } = useUpcomingActions();
  
  // Finding Distribution Tables
  const { data: controlElementData, isLoading: loadingControlElement } = useControlElementDistribution(scorecardFilter);
  const { data: riskTypeData, isLoading: loadingRiskType } = useRiskTypeDistribution(scorecardFilter);

  // Convert real Jira data to Chart.js format
  const findingActionsData: ChartData<'pie'> = useMemo(() => {
    if (!actionStatus?.statusDistribution) {
      return { labels: [], datasets: [] };
    }
    
    const statusDist = actionStatus.statusDistribution as Record<string, number>;
    const labels = Object.keys(statusDist);
    const data = Object.values(statusDist);
    
    // Updated colors to match My Tasks Status design
    const backgroundColors = {
      'Open': 'rgba(59, 130, 246, 0.8)',        // Blue
      'Risk Accepted': 'rgba(147, 51, 234, 0.8)', // Purple
      'Completed': 'rgba(34, 197, 94, 0.8)',    // Green
      'Overdue': 'rgba(239, 68, 68, 0.8)',      // Red
    };
    
    const borderColors = {
      'Open': 'rgba(59, 130, 246, 1)',        // Blue
      'Risk Accepted': 'rgba(147, 51, 234, 1)', // Purple
      'Completed': 'rgba(34, 197, 94, 1)',    // Green
      'Overdue': 'rgba(239, 68, 68, 1)',      // Red
    };
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(l => backgroundColors[l as keyof typeof backgroundColors] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: labels.map(l => borderColors[l as keyof typeof borderColors] || 'rgba(156, 163, 175, 1)'),
        borderWidth: 2,
      }],
    };
  }, [actionStatus]);
  
  // Finding Actions by Lead and Status data
  const findingActionsByLeadData: ChartData<'bar'> = useMemo(() => {
    if (!leadStatusData || typeof leadStatusData !== 'object') {
      return { labels: [], datasets: [] };
    }
    
    const leadStatusMap = leadStatusData as Record<string, Record<string, number>>;
    const leads = Object.keys(leadStatusMap).filter(lead => lead !== 'Unassigned').slice(0, 10); // Top 10 leads
    const statuses = ['Open', 'Risk Accepted', 'Completed', 'Overdue'];
    
    const colors = {
      'Open': 'rgba(59, 130, 246, 0.9)',        // Blue
      'Risk Accepted': 'rgba(147, 51, 234, 0.9)', // Purple
      'Completed': 'rgba(34, 197, 94, 0.9)',    // Green
       'Overdue': 'rgba(239, 68, 68, 0.9)',      // Red (matching pie chart)
    };
    
    return {
      labels: leads,
      datasets: statuses.map(status => ({
        label: status,
        data: leads.map(lead => {
          const leadData = leadStatusMap[lead];
          return leadData ? (leadData[status] || 0) : 0;
        }),
        backgroundColor: colors[status as keyof typeof colors] || 'rgba(156, 163, 175, 0.9)',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      })),
    };
  }, [leadStatusData]);

  const findingByYearData: ChartData<'bar'> = useMemo(() => {
    if (!findingStatus || typeof findingStatus !== 'object') {
      return { labels: [], datasets: [] };
    }
    
    const years = Object.keys(findingStatus).sort();
    
    // Define status order for stacked bar chart (bottom to top)
    const statusOrder = ['Completed', 'Risk Accepted', 'Open'];
    
    // Updated colors to match the image example
    const colors = {
      'Completed': 'rgba(34, 197, 94, 0.9)',     // Green (bottom)
      'Risk Accepted': 'rgba(147, 51, 234, 0.9)', // Purple (middle)
      'Open': 'rgba(59, 130, 246, 0.9)',         // Blue (top)
    };
    
    return {
      labels: years,
      datasets: statusOrder.map(status => ({
        label: status,
        data: years.map(year => {
          const yearData = findingStatus[year];
          return (yearData && typeof yearData === 'object') ? (yearData[status] || 0) : 0;
        }),
        backgroundColor: colors[status as keyof typeof colors] || 'rgba(156, 163, 175, 0.9)',
      })),
    };
  }, [findingStatus]);

  // Action Age Chart Data
  const actionAgeChartData: ChartData<'bar'> = useMemo(() => {
    if (!actionAgeData || typeof actionAgeData !== 'object') return { labels: [], datasets: [] };
    
    // Define correct order for age ranges
    const orderedRanges = [
      '-720—360', '-360—180', '-180—90', '-90—30', '-30—0',
      '0—30', '30—90', '90—180', '180—360', '360—720', '720+'
    ];
    
    // Color mapping: Overdue (red gradient) → Upcoming (yellow to green gradient)
    const rangeColors: Record<string, { bg: string; border: string }> = {
      // Overdue (negative) - Red gradient (darkest to lightest)
      '-720—360': { bg: 'rgba(185, 28, 28, 0.9)', border: 'rgba(185, 28, 28, 1)' },    // Dark red (most overdue)
      '-360—180': { bg: 'rgba(220, 38, 38, 0.9)', border: 'rgba(220, 38, 38, 1)' },    // Red
      '-180—90': { bg: 'rgba(239, 68, 68, 0.9)', border: 'rgba(239, 68, 68, 1)' },     // Medium red
      '-90—30': { bg: 'rgba(248, 113, 113, 0.9)', border: 'rgba(248, 113, 113, 1)' },  // Light red
      '-30—0': { bg: 'rgba(251, 146, 60, 0.9)', border: 'rgba(251, 146, 60, 1)' },     // Orange (soon overdue)
      
      // Upcoming (positive) - Yellow to green gradient
      '0—30': { bg: 'rgba(250, 204, 21, 0.9)', border: 'rgba(250, 204, 21, 1)' },      // Yellow (urgent, upcoming soon)
      '30—90': { bg: 'rgba(163, 230, 53, 0.9)', border: 'rgba(163, 230, 53, 1)' },     // Lime green
      '90—180': { bg: 'rgba(74, 222, 128, 0.9)', border: 'rgba(74, 222, 128, 1)' },    // Light green
      '180—360': { bg: 'rgba(34, 197, 94, 0.9)', border: 'rgba(34, 197, 94, 1)' },     // Green
      '360—720': { bg: 'rgba(22, 163, 74, 0.9)', border: 'rgba(22, 163, 74, 1)' },     // Dark green
      '720+': { bg: 'rgba(21, 128, 61, 0.9)', border: 'rgba(21, 128, 61, 1)' },        // Very dark green (lots of time)
    };
    
    // Filter to only include ranges that exist in data
    const ageRanges = orderedRanges.filter(range => 
      (actionAgeData as Record<string, number>)[range] !== undefined
    );
    
    return {
      labels: ageRanges,
      datasets: [{
        label: 'Number of Actions',
        data: ageRanges.map(range => (actionAgeData as Record<string, number>)[range] || 0),
        backgroundColor: ageRanges.map(range => rangeColors[range]?.bg || 'rgba(156, 163, 175, 0.9)'),
        borderColor: ageRanges.map(range => rangeColors[range]?.border || 'rgba(156, 163, 175, 1)'),
        borderWidth: 2,
      }],
    };
  }, [actionAgeData]);

  // Prepare radar chart data with groups
  const radarData: ChartData<'radar'> = useMemo(() => {
    if (!radarChartData?.labels) {
      return { labels: [], datasets: [] };
    }

    // Create labels with groups (if available) or fall back to dimension names
    const labels = radarChartData.labelsWithGroups 
      ? radarChartData.labelsWithGroups.map((item: { dimension: string; group: string; fullLabel: string }) => item.fullLabel)
      : radarChartData.labels;

    return {
      labels,
      datasets: [
        {
          label: '2024',
          data: radarChartData.data2024,
          backgroundColor: 'rgba(251, 146, 60, 0.15)', // Orange with lower opacity
          borderColor: 'rgba(251, 146, 60, 1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(251, 146, 60, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(251, 146, 60, 1)',
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.1,
        },
        {
          label: '2025',
          data: radarChartData.data2025,
          backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue with lower opacity
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.1,
        },
      ],
    };
  }, [radarChartData]);

  // Handle pie chart click to open modal
  const handlePieClick = (status: string) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  // Role-based welcome message
  const getWelcomeMessage = () => {
    switch (role) {
      case 'admin':
        return 'Admin Dashboard - Full System Control';
      case 'top_management':
        return 'Executive Dashboard - Strategic Overview';
      case 'department_director':
        return 'Director Dashboard - Department Metrics';
      case 'VP':
        return 'VP Dashboard - High-Level Insights';
      case 'team':
        return 'Team Dashboard - Your Tasks & Projects';
      case 'auditor':
        return 'Auditor Dashboard - Your Audits';
      default:
        return 'Dashboard - Overview';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Badge variant={
              role === 'admin' ? 'danger' :
              role === 'top_management' ? 'warning' :
              role === 'department_director' ? 'info' :
              'default'
            }>
              {role?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">{getWelcomeMessage()}</p>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name || 'User'}!</p>
        </div>
      </div>

      {/* Year-over-Year Performance Metrics */}
      <PermissionGate component="audit_projects_by_year_chart">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Audit Projects by Year */}
            <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-white">
              <CardHeader 
                title="Audit Projects by Year"
                className="border-b border-gray-200 pb-3"
              />
              <div className="mt-4 grid grid-cols-6 gap-3">
                {loadingProjects ? (
                  <div className="col-span-6 flex justify-center py-8">
                    <Loading size="lg" />
                  </div>
                ) : auditProjects && Array.isArray(auditProjects) ? (
                  (() => {
                    // Hard-coded per auditor values
                    const perAuditorMap: Record<string, string> = {
                      '2025': '2.17',
                      '2024': '1.84',
                      '2023': '0.86',
                      '2022': '1.15',
                      '2021': '1.94',
                    };
                    
                    return auditProjects
                      .filter((item: any) => item.auditYear && item.auditYear !== 'Unknown')
                      .slice(0, 5)
                      .map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 text-white hover:shadow-lg transition-shadow ${
                            idx < 2 ? 'col-span-3' : 'col-span-2'
                          }`}
                        >
                          <p className="text-[10px] text-blue-400 mb-1 text-center">{item.auditYear}</p>
                          <p className="text-2xl font-bold text-green-400 mb-1 text-center">{item.count}</p>
                          <p className="text-[10px] text-gray-400 text-center">{perAuditorMap[item.auditYear] || '0'} per auditor</p>
                        </div>
                      ));
                  })()
                ) : (
                  <div className="col-span-6 text-center text-gray-500 py-8">
                    No data available
                  </div>
                )}
              </div>
            </Card>

            {/* Investigations by Year */}
            <Card variant="elevated" className="bg-gradient-to-br from-purple-50 to-white">
              <CardHeader 
                title="Investigations by Year"
                className="border-b border-gray-200 pb-3"
              />
              <div className="mt-4 grid grid-cols-6 gap-3">
                {loadingInvestigations ? (
                  <div className="col-span-6 flex justify-center py-8">
                    <Loading size="lg" />
                  </div>
                ) : investigations && Array.isArray(investigations) ? (
                  (() => {
                    // Hard-coded per auditor values
                    const perAuditorMap: Record<string, string> = {
                      '2025': '10.84',
                      '2024': '10.25',
                      '2023': '14.74',
                      '2022': '23.59',
                      '2021': '10.70',
                    };
                    
                    // Group by year and sum counts
                    const yearTotals: Record<string, number> = {};
                    investigations.forEach((inv: any) => {
                      if (inv.year && inv.year !== 'Unknown' && inv.year !== '2020') {
                        yearTotals[inv.year] = (yearTotals[inv.year] || 0) + (inv.count || 1);
                      }
                    });
                    
                    // Convert to array and sort by year (newest first)
                    return Object.entries(yearTotals)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 5)
                      .map(([year, count], idx) => (
                        <div 
                          key={idx} 
                          className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 text-white hover:shadow-lg transition-shadow ${
                            idx < 2 ? 'col-span-3' : 'col-span-2'
                          }`}
                        >
                          <p className="text-[10px] text-blue-400 mb-1 text-center">{year}</p>
                          <p className="text-2xl font-bold text-green-400 mb-1 text-center">{count}</p>
                          <p className="text-[10px] text-gray-400 text-center">{perAuditorMap[year] || '0'} per auditor</p>
                        </div>
                      ));
                  })()
                ) : (
                  <div className="col-span-6 text-center text-gray-500 py-8">
                    No data available
                  </div>
                )}
              </div>
            </Card>

            {/* Fraud Internal Control by Year */}
            <Card variant="elevated" className="bg-gradient-to-br from-red-50 to-white">
              <CardHeader 
                title="Fraud Internal Control by Year"
                className="border-b border-gray-200 pb-3"
              />
              <div className="mt-4 grid grid-cols-6 gap-3">
                {loadingFraud ? (
                  <div className="col-span-6 flex justify-center py-8">
                    <Loading size="lg" />
                  </div>
                ) : fraudImpact?.scoreCards && Array.isArray(fraudImpact.scoreCards) ? (
                  (() => {
                    // Hard-coded per auditor values
                    const perAuditorMap: Record<string, string> = {
                      '2025': '€1.34M',
                      '2024': '€2.71M',
                      '2023': '€1.56M',
                      '2022': '€3.50M',
                      '2021': '€0.96M',
                    };
                    
                    // Format impact from "2,363,374" to "€2.36M"
                    const formatImpact = (impact: any) => {
                      if (!impact) return '€0';
                      // Remove commas and convert to number
                      const numericValue = typeof impact === 'string' 
                        ? parseFloat(impact.replace(/,/g, ''))
                        : impact;
                      
                      if (isNaN(numericValue)) return '€0';
                      
                      // Convert to millions
                      const millions = numericValue / 1000000;
                      return `€${millions.toFixed(2)}M`;
                    };
                    
                    return fraudImpact.scoreCards
                      .filter((item: any) => item.year && item.year !== '2020')
                      .sort((a: any, b: any) => b.year.localeCompare(a.year))
                      .slice(0, 5)
                      .map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 text-white hover:shadow-lg transition-shadow ${
                            idx < 2 ? 'col-span-3' : 'col-span-2'
                          }`}
                        >
                          <p className="text-[10px] text-blue-400 mb-1 text-center">{item.year}</p>
                          <p className="text-2xl font-bold text-green-400 mb-1 text-center">{formatImpact(item.impact)}</p>
                          <p className="text-[10px] text-gray-400 text-center">{perAuditorMap[item.year] || '€0'} per auditor</p>
                        </div>
                      ));
                  })()
                ) : (
                  <div className="col-span-6 text-center text-gray-500 py-8">
                    No data available
                  </div>
                )}
              </div>
            </Card>

            {/* Loss Prevention Internal Control by Year */}
            <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-white">
              <CardHeader 
                title="Loss Prevention Internal Control by Year"
                className="border-b border-gray-200 pb-3"
              />
              <div className="mt-4 grid grid-cols-6 gap-3">
                {loadingLP ? (
                  <div className="col-span-6 flex justify-center py-8">
                    <Loading size="lg" />
                  </div>
                ) : lpImpact?.scoreCards2 && Array.isArray(lpImpact.scoreCards2) ? (
                  (() => {
                    // Hard-coded per auditor values
                    const perAuditorMap: Record<string, string> = {
                      '2025': '€0.93M',
                      '2024': '€0.76M',
                      '2023': '€0.23M',
                      '2022': '€0.07M',
                      '2021': '€0.05M',
                    };
                    
                    // Format impact from "2,363,374" to "€2.36M"
                    const formatImpact = (impact: any) => {
                      if (!impact) return '€0';
                      // Remove commas and convert to number
                      const numericValue = typeof impact === 'string' 
                        ? parseFloat(impact.replace(/,/g, ''))
                        : impact;
                      
                      if (isNaN(numericValue)) return '€0';
                      
                      // Convert to millions
                      const millions = numericValue / 1000000;
                      return `€${millions.toFixed(2)}M`;
                    };
                    
                    return lpImpact.scoreCards2
                      .filter((item: any) => item.year && item.year !== '2020')
                      .sort((a: any, b: any) => b.year.localeCompare(a.year))
                      .slice(0, 5)
                      .map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 text-white hover:shadow-lg transition-shadow ${
                            idx < 2 ? 'col-span-3' : 'col-span-2'
                          }`}
                        >
                          <p className="text-[10px] text-blue-400 mb-1 text-center">{item.year}</p>
                          <p className="text-2xl font-bold text-green-400 mb-1 text-center">{formatImpact(item.impact)}</p>
                          <p className="text-[10px] text-gray-400 text-center">{perAuditorMap[item.year] || '€0'} per auditor</p>
                        </div>
                      ));
                  })()
                ) : (
                  <div className="col-span-6 text-center text-gray-500 py-8">
                    No data available
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </PermissionGate>

      {/* Scorecard Filter Toggle */}
      <PermissionGate component="finding_actions_status_chart">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Key Metrics</h2>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={scorecardFilter === '2024+' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setScorecardFilter('2024+')}
              className="text-sm"
            >
              📅 As of 2024
            </Button>
            <Button
              variant={scorecardFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setScorecardFilter('all')}
              className="text-sm"
            >
              📊 All Results
            </Button>
          </div>
        </div>

      {/* Role-Based Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card variant="elevated">
            <CardHeader
              title="Total Actions"
              subtitle="All finding actions"
              action={<Badge variant="default" size="sm">{scorecardFilter === '2024+' ? '2024+' : 'All'}</Badge>}
            />
            <div className="mt-4 min-h-[120px] flex flex-col justify-center">
              {loadingActionStatus ? (
                <div className="flex justify-center items-center">
                  <Loading size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-purple-600">
                    {actionStatus?.statusDistribution 
                      ? (Object.values(actionStatus.statusDistribution) as number[]).reduce((a: number, b: number) => a + b, 0) 
                      : 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    All statuses (Open, Overdue, etc.)
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card variant="elevated">
            <CardHeader
              title="Open Actions"
              subtitle="Pending finding actions"
              action={<Badge variant="default" size="sm">{scorecardFilter === '2024+' ? '2024+' : 'All'}</Badge>}
            />
            <div className="mt-4 min-h-[120px] flex flex-col justify-center">
              {loadingActionStatus ? (
                <div className="flex justify-center items-center">
                  <Loading size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-yellow-600">
                    {(actionStatus?.statusDistribution as any)?.['Open'] || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Status: Open
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card variant="elevated">
            <CardHeader
              title="Overdue Actions"
              subtitle="Past due date"
              action={<Badge variant="default" size="sm">{scorecardFilter === '2024+' ? '2024+' : 'All'}</Badge>}
            />
            <div className="mt-4 min-h-[120px] flex flex-col justify-center">
              {loadingActionStatus ? (
                <div className="flex justify-center items-center">
                  <Loading size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-red-600">
                    {(actionStatus?.statusDistribution as any)?.['Overdue'] || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Status: Overdue
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card variant="elevated">
            <CardHeader
              title="Financial Impact"
              subtitle="Total monetary impact"
              action={<Badge variant="default" size="sm">2024+</Badge>}
            />
            <div className="mt-4 min-h-[120px] flex flex-col justify-center">
              {loadingFinancialImpact ? (
                <div className="flex justify-center items-center">
                  <Loading size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-green-600">
                    {financialImpactData?.totalFinancialImpact 
                      ? formatFinancialImpact(financialImpactData.totalFinancialImpact)
                      : '0 €'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    From {financialImpactData?.parentKeys?.length || 0} findings
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader
              title="Audit Maturity"
              subtitle="Average Score"
              action={
                <div className="flex gap-1">
                  <button
                    onClick={() => setMaturityYear('2024')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      maturityYear === '2024'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    2024
                  </button>
                  <button
                    onClick={() => setMaturityYear('2025')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      maturityYear === '2025'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    2025
                  </button>
            </div>
              }
            />
            <div className="mt-4 min-h-[80px] flex flex-col justify-center">
              {loadingMAT ? (
                <div className="flex justify-center items-center">
                  <Loading size="lg" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 justify-center">
                    <p className="text-4xl font-bold text-indigo-600">
                      {maturityYear === '2024' 
                        ? (matScores?.average2024 ? matScores.average2024.toFixed(1) : '-')
                        : (matScores?.average2025 ? matScores.average2025.toFixed(1) : '-')
                      }
                    </p>
                    <span className="text-xl text-indigo-400 font-medium">/ 5.0</span>
            </div>
                </>
              )}
            </div>
          </Card>
        </div>

      {/* Toggle Charts and Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOverdueModalOpen(true)}
          className="shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Overdue Actions
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsUpcomingModalOpen(true)}
          className="shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upcoming Actions
        </Button>
        
        <Button
          variant={showAllCharts ? "outline" : "primary"}
          size="sm"
          onClick={() => setShowAllCharts(!showAllCharts)}
          className="shadow-md hover:shadow-lg transition-all"
        >
          {showAllCharts ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide Charts
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              See All Charts
            </>
          )}
        </Button>
            </div>

      </PermissionGate>

      {showAllCharts && (
        <>
      {/* Charts Section - Permission Based with Real Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGate component="finding_actions_status_chart">
            <PieChart
              title="Finding Actions Status"
            subtitle="Current distribution (Click on a slice to view details)"
              data={findingActionsData}
              height={350}
              loading={loadingActionStatus}
              options={{
              onClick: (_event, elements) => {
                if (elements && elements.length > 0 && elements[0]) {
                  const elementIndex = elements[0].index;
                  const clickedLabel = findingActionsData.labels?.[elementIndex];
                  if (clickedLabel) {
                    handlePieClick(clickedLabel as string);
                  }
                }
              },
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      usePointStyle: true,
                      font: {
                        size: 12,
                      },
                      generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.labels && data.datasets && data.datasets.length > 0) {
                          const dataset = data.datasets[0];
                          if (!dataset) return [];
                          const bgColors = dataset.backgroundColor;
                          return data.labels.map((label, i) => {
                            const dataValue = Array.isArray(dataset.data) ? dataset.data[i] : 0;
                            const bgColor = Array.isArray(bgColors) ? bgColors[i] : bgColors;
                            return {
                              text: `${label}: ${dataValue}`,
                            fillStyle: typeof bgColor === 'string' ? bgColor : 'rgba(156, 163, 175, 0.8)',
                              hidden: false,
                              index: i,
                            };
                          });
                        }
                        return [];
                      },
                    },
                  },
                  datalabels: {
                  display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const dataset = context.dataset;
                        const total = (dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ${value} (${percentage}%) - Click to view details`;
                      },
                    },
                  },
                },
              }}
            />
        </PermissionGate>

        <PermissionGate component="finding_actions_by_lead_chart">
            <BarChart
              title="Finding Actions by Lead and Status"
            subtitle={`Action distribution by lead and status (${scorecardFilter === '2024+' ? '2024+' : 'All'})`}
              data={findingActionsByLeadData}
            height={400}
              loading={loadingLeadStatus}
              options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  align: 'end',
                  labels: {
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                      size: 12,
                      weight: 'bold',
                    },
                    color: '#374151',
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12,
                  titleFont: {
                    size: 13,
                    weight: 'bold',
                  },
                  bodyFont: {
                    size: 12,
                  },
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  displayColors: true,
                  callbacks: {
                    label: (context) => {
                      const label = context.dataset.label || '';
                      const value = context.parsed.x || 0;
                      return `${label}: ${value} actions`;
                    },
                  },
                },
                datalabels: {
                  display: false,
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                  ticks: {
                    font: {
                      size: 11,
                    },
                    color: '#6B7280',
                    padding: 8,
                  },
                  border: {
                    display: false,
                  },
                  },
                  y: {
                    stacked: true,
                  grid: {
                    display: false,
                  },
                  ticks: {
                    font: {
                      size: 11,
                      weight: 'bold',
                    },
                    color: '#374151',
                    crossAlign: 'far',
                  },
                  border: {
                    display: false,
                  },
                },
              },
              interaction: {
                mode: 'y',
                intersect: false,
              },
              animation: {
                duration: 750,
                easing: 'easeInOutQuart',
                },
              }}
            />
        </PermissionGate>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGate component="audit_findings_chart">
          <BarChart
            title="Audit Findings by Year and Status"
            subtitle="Findings breakdown by year and status"
            data={findingByYearData}
            height={400}
            loading={loadingFindingStatus}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  align: 'end',
                  labels: {
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                      size: 12,
                      weight: 'bold',
                    },
                    color: '#374151',
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12,
                  titleFont: {
                    size: 13,
                    weight: 'bold',
                  },
                  bodyFont: {
                    size: 12,
                  },
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  displayColors: true,
                  callbacks: {
                    label: (context) => {
                      const label = context.dataset.label || '';
                      const value = context.parsed.y || 0;
                      return `${label}: ${value} findings`;
                    },
                  },
                },
                datalabels: {
                  display: false,
                },
              },
              scales: {
                x: {
                  stacked: true,
                  grid: {
                    display: false,
                  },
                  ticks: {
                    font: {
                      size: 11,
                      weight: 'bold',
                    },
                    color: '#374151',
                  },
                  border: {
                    display: false,
                  },
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                  ticks: {
                    font: {
                      size: 11,
                    },
                    color: '#6B7280',
                    padding: 8,
                  },
                  border: {
                    display: false,
                  },
                },
              },
              interaction: {
                mode: 'index',
                intersect: false,
              },
              animation: {
                duration: 750,
                easing: 'easeInOutQuart',
              },
            }}
          />
        </PermissionGate>

        <PermissionGate component="finding_actions_aging_chart">
          <ActionAgeChart
            data={actionAgeChartData}
            loading={loadingActionAge}
            title="Finding Actions Age Distribution"
            subtitle="All Open actions by days until/past due date"
            height={400}
          />
        </PermissionGate>
      </div>

      {/* Audit Plan - Progress Tracker */}
      <PermissionGate component="audit_plan_chart">
        <Card variant="elevated" className="bg-gradient-to-br from-violet-50 via-purple-50 to-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader
            title="Audit Plan - Progress Tracker"
            subtitle="Current audit progress across all stages"
            action={
              <a
                href="/audit-plan"
                className="group text-sm text-purple-600 hover:text-purple-700 font-semibold transition-all duration-200 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-purple-100"
              >
                View All
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            }
          />
          <div className="mt-6 p-4 bg-white rounded-xl shadow-sm">
            <AuditProgressChart selectedYear="2025" />
          </div>
        </Card>
      </PermissionGate>

      {/* Finding Distribution Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGate component="finding_distribution_risk_chart">
            <Card variant="elevated">
            <CardHeader 
              title="Finding Distribution by Risk Type and Risk Level" 
              subtitle={`Showing ${scorecardFilter === '2024+' ? 'As of 2024' : 'All Results'}`}
            />
            <div className="mt-4 overflow-x-auto">
              {loadingRiskType ? (
                <div className="h-64 flex items-center justify-center">
                <Loading size="lg" />
                </div>
              ) : riskTypeData && Array.isArray(riskTypeData) ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-purple-600">
                      <th className="text-left p-3 bg-blue-900 text-white font-semibold">RISK TYPE</th>
                      <th className="text-center p-3 bg-gray-900 text-white font-semibold">CRITICAL</th>
                      <th className="text-center p-3 bg-red-600 text-white font-semibold">HIGH</th>
                      <th className="text-center p-3 bg-orange-500 text-white font-semibold">MEDIUM</th>
                      <th className="text-center p-3 bg-green-600 text-white font-semibold">LOW</th>
                      <th className="text-center p-3 bg-blue-600 text-white font-semibold">T:</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskTypeData.map((row: any, idx: number) => {
                      const isTotal = row.type?.includes('Total');
                      return (
                        <tr key={idx} className={`border-b ${isTotal ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}>
                          <td className="p-3 text-left">{row.type}</td>
                          <td className="p-3 text-center">{row.Critical || 0}</td>
                          <td className="p-3 text-center">{row.High || 0}</td>
                          <td className="p-3 text-center">{row.Medium || 0}</td>
                          <td className="p-3 text-center">{row.Low || 0}</td>
                          <td className="p-3 text-center font-semibold">{row.Total || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-gray-500">No data available</div>
              )}
              </div>
            </Card>
        </PermissionGate>

        <PermissionGate component="finding_distribution_control_chart">
            <Card variant="elevated">
            <CardHeader 
              title="Finding Distribution by Internal Control Element and Risk Level" 
              subtitle={`Showing ${scorecardFilter === '2024+' ? 'As of 2024' : 'All Results'}`}
            />
            <div className="mt-4 overflow-x-auto">
              {loadingControlElement ? (
                <div className="h-64 flex items-center justify-center">
                <Loading size="lg" />
                </div>
              ) : controlElementData && Array.isArray(controlElementData) ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-purple-600">
                      <th className="text-left p-3 bg-blue-900 text-white font-semibold">INTERNAL CONTROL ELEMENT</th>
                      <th className="text-center p-3 bg-gray-900 text-white font-semibold">CRITICAL</th>
                      <th className="text-center p-3 bg-red-600 text-white font-semibold">HIGH</th>
                      <th className="text-center p-3 bg-orange-500 text-white font-semibold">MEDIUM</th>
                      <th className="text-center p-3 bg-green-600 text-white font-semibold">LOW</th>
                      <th className="text-center p-3 bg-blue-600 text-white font-semibold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controlElementData.map((row: any, idx: number) => {
                      const isTotal = row.control?.includes('Total');
                      return (
                        <tr key={idx} className={`border-b ${isTotal ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}>
                          <td className="p-3 text-left">{row.control}</td>
                          <td className="p-3 text-center">{row.Critical || 0}</td>
                          <td className="p-3 text-center">{row.High || 0}</td>
                          <td className="p-3 text-center">{row.Medium || 0}</td>
                          <td className="p-3 text-center">{row.Low || 0}</td>
                          <td className="p-3 text-center font-semibold">{row.Total || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-gray-500">No data available</div>
              )}
            </div>
            </Card>
        </PermissionGate>
          </div>

      {/* Google Sheets Tables - Fraud & Loss Prevention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGate component="finding_distribution_risk_chart">
          <Card variant="elevated">
            <CardHeader 
              title="Fraud Internal Control" 
              subtitle="Data from Google Sheets"
            />
            <div className="mt-4 overflow-x-auto">
              {loadingFraud2 ? (
                <div className="h-64 flex items-center justify-center">
                  <Loading size="lg" />
                </div>
              ) : fraudInternalControl?.result && Array.isArray(fraudInternalControl.result) && fraudInternalControl.result.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-purple-600">
                      {fraudInternalControl.result[0]?.map((header: string, idx: number) => (
                        <th key={idx} className="text-center p-3 bg-blue-900 text-white font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fraudInternalControl.result.slice(1).map((row: string[], rowIdx: number) => (
                      <tr key={rowIdx} className="border-b hover:bg-gray-50">
                        {row.map((cell: string, cellIdx: number) => (
                          <td key={cellIdx} className="p-3 text-center">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-gray-500">No data available</div>
              )}
              </div>
            </Card>
        </PermissionGate>

        <PermissionGate component="finding_distribution_control_chart">
          <Card variant="elevated">
            <CardHeader 
              title="Loss Prevention Internal Control" 
              subtitle="Data from Google Sheets"
            />
            <div className="mt-4 overflow-x-auto">
              {loadingLossPrevention ? (
                <div className="h-64 flex items-center justify-center">
                  <Loading size="lg" />
            </div>
              ) : lossPreventionSummary?.result && Array.isArray(lossPreventionSummary.result) && lossPreventionSummary.result.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-purple-600">
                      {lossPreventionSummary.result[0]?.map((header: string, idx: number) => (
                        <th key={idx} className={`p-3 font-semibold ${idx === 0 ? 'text-left bg-blue-900 text-white' : 'text-center bg-blue-900 text-white'}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lossPreventionSummary.result.slice(1).map((row: string[], rowIdx: number) => (
                      <tr key={rowIdx} className="border-b hover:bg-gray-50">
                        {row.map((cell: string, cellIdx: number) => (
                          <td key={cellIdx} className={`p-3 ${cellIdx === 0 ? 'text-left' : 'text-center'}`}>
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-gray-500">No data available</div>
              )}
        </div>
          </Card>
        </PermissionGate>
      </div>

      {/* Audit Maturity Radar Chart */}
      <PermissionGate component="department_actions_chart">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RadarChart
            title="Audit Maturity"
            subtitle="Maturity assessment across key dimensions"
            data={radarData}
            height={450}
            loading={loadingRadar}
            labelColors={
              radarChartData?.labelsWithGroups
                ? radarChartData.labelsWithGroups.map((item: { dimension: string; group: string; fullLabel: string }) => {
                    const groupColors: Record<string, string> = {
                      'Governance': '#1f2937',
                      'Use of Technology': '#8b5cf6',
                      'People': '#10b981',
                      'Communications': '#3b82f6',
                      'Scope of Work': '#f59e0b',
                    };
                    return groupColors[item.group] || '#374151';
                  })
                : undefined
            }
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: {
                padding: 20,
              },
              elements: {
                line: {
                  borderWidth: 3,
                  tension: 0.1,
                },
                point: {
                  radius: 5,
                  hoverRadius: 8,
                borderWidth: 2,
                },
              },
              scales: {
                r: {
                  beginAtZero: true,
                  min: 0,
                  max: 5,
                  angleLines: {
                    display: true,
                    color: 'rgba(156, 163, 175, 0.2)',
                    lineWidth: 1.5,
                  },
                  grid: {
                    color: 'rgba(156, 163, 175, 0.15)',
                    lineWidth: 1,
                  },
                  ticks: {
                    stepSize: 1,
                    font: {
                      size: 11,
                      weight: 500,
                    },
                    color: '#6b7280',
                    backdropColor: 'rgba(255, 255, 255, 0.9)',
                    backdropPadding: 6,
                  },
                  pointLabels: {
                    display: true,
                    font: {
                      size: 10,
                      weight: 600,
                    },
                    color: (context: any) => {
                      // Color labels based on groups
                      const groupColors: Record<string, string> = {
                        'Governance': '#1f2937',
                        'Use of Technology': '#8b5cf6',
                        'People': '#10b981',
                        'Communications': '#3b82f6',
                        'Scope of Work': '#f59e0b',
                      };
                      if (radarChartData?.labelsWithGroups?.[context.index]) {
                        const group = radarChartData.labelsWithGroups[context.index].group;
                        return groupColors[group] || '#374151';
                      }
                      return '#374151';
                    },
                    padding: 15,
                  },
                },
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  align: 'center',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                      size: 13,
                      weight: 600,
                    },
                    color: '#374151',
                    boxWidth: 16,
                    boxHeight: 16,
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  titleColor: '#f9fafb',
                  bodyColor: '#f9fafb',
                  borderColor: '#4b5563',
                  borderWidth: 1,
                  cornerRadius: 8,
                  padding: 8,
                  titleFont: {
                    size: 11,
                    weight: 600,
                  },
                  bodyFont: {
                    size: 10,
                  },
                  displayColors: false,
                  callbacks: {
                    title: (context) => {
                      // Extract dimension name only (without group)
                      const fullLabel = context[0]?.label || '';
                      const dimensionName = String(fullLabel).split(' (')[0];
                      return dimensionName;
                    },
                    label: (context) => {
                      const year = context.dataset.label || '';
                      const value = context.parsed.r || 0;
                      return `${year}: ${value.toFixed(1)} / 5`;
                    },
                  },
                },
              },
              animation: {
                duration: 1500,
                easing: 'easeInOutQuart',
              },
              interaction: {
                intersect: false,
                mode: 'index',
              },
            }}
          />
        </div>
      </PermissionGate>

              </>
            )}

      {/* Action Details Modal */}
      <ActionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={selectedStatus}
        auditYear={scorecardFilter}
      />

      {/* Overdue Actions Modal */}
      <ActionsListModal
        isOpen={isOverdueModalOpen}
        onClose={() => setIsOverdueModalOpen(false)}
        title="Overdue Actions"
        subtitle={`${overdueActions?.length || 0} actions past due date`}
        actions={overdueActions}
        loading={loadingOverdue}
        headerBgColor="bg-red-50"
        showDaysUntilDue={false}
      />

      {/* Upcoming Actions Modal */}
      <ActionsListModal
        isOpen={isUpcomingModalOpen}
        onClose={() => setIsUpcomingModalOpen(false)}
        title="Upcoming Actions"
        subtitle={`${upcomingActions?.length || 0} actions due within 30 days`}
        actions={upcomingActions}
        loading={loadingUpcoming}
        headerBgColor="bg-blue-50"
        showDaysUntilDue={true}
      />
    </div>
  );
};

export default DashboardPage;


