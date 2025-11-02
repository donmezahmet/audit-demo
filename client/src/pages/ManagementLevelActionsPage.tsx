import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, Button, Badge, Loading, Pagination } from '@/components/ui';
import { DoughnutChart } from '@/components/charts';
import { useManagementFindingActions, useResizableColumns, useExport } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { ChartData } from 'chart.js';
import { formatDate, formatFinancialImpact } from '@/utils/format';
import { cn } from '@/utils/cn';
import ResizableTableHeader from '@/components/ResizableTableHeader';
import ViewAsDropdown from '@/components/ViewAsDropdown';

const ManagementLevelActionsPage: React.FC = () => {
  const [scorecardFilter, setScorecardFilter] = useState<'2024+' | 'all'>('2024+');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const { role, isImpersonating, originalUser, startImpersonation } = useAuthStore();
  const { isExporting, exportFindingActions } = useExport();
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Column ordering state
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem('management-actions-column-order');
    return stored ? JSON.parse(stored) : ['key', 'summary', 'description', 'status', 'audit', 'dueDate', 'riskLevel', 'responsible', 'actions'];
  });
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Data fetching - filtered by customfield_22185 (management email) in backend
  const { data: actions = [], isLoading } = useManagementFindingActions({
    auditYear: scorecardFilter === 'all' ? undefined : scorecardFilter,
  });

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isModalOpen]);

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setAuditFilter('all');
    setRiskLevelFilter('all');
    setResponsibleFilter('all');
    setSortField(null);
    setSortDirection('asc');
  };
  
  // Handle View As functionality (only admin users)
  const handleViewAs = async (email: string) => {
    try {
      await startImpersonation(email);
      window.location.reload();
    } catch (error) {
      // Impersonation failed - error handled by auth store
    }
  };
  
  // Drag & Drop handlers for column reordering
  const handleDragStart = (columnKey: string) => {
    setDraggedColumn(columnKey);
  };
  
  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };
  
  const handleDrop = (targetColumnKey: string) => {
    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    
    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnKey);
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    
    setColumnOrder(newOrder);
    localStorage.setItem('management-actions-column-order', JSON.stringify(newOrder));
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  
  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  
  // Resizable columns
  const initialColumnWidths = {
    key: 120,
    summary: 250,
    description: 280,
    status: 120,
    audit: 200,
    dueDate: 120,
    riskLevel: 100,
    responsible: 180,
    actions: 120,
  };
  
  const { columnWidths, resizing, handleMouseDown } = useResizableColumns(
    tableRef,
    initialColumnWidths,
    'management-actions-columns'
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (!actions || !Array.isArray(actions)) return { 
      total: 0, open: 0, overdue: 0, completed: 0, 
      financialImpact: 0, completionRate: '0.0', overdueRate: '0.0',
      moneyOpen: 0, moneyOverdue: 0
    };
    
    const openActions = actions.filter((a: any) => a.status === 'Open');
    const overdueActions = actions.filter((a: any) => a.status === 'Overdue');
    
    const uniqueOpenParents = new Set(openActions.map((a: any) => a.parentKey).filter(Boolean));
    const uniqueOverdueParents = new Set(overdueActions.map((a: any) => a.parentKey).filter(Boolean));
    
    const moneyOpen = Array.from(uniqueOpenParents).reduce((sum, parentKey) => {
      const action = openActions.find((a: any) => a.parentKey === parentKey);
      return sum + (action?.monetaryImpact || 0);
    }, 0);
    
    const moneyOverdue = Array.from(uniqueOverdueParents).reduce((sum, parentKey) => {
      const action = overdueActions.find((a: any) => a.parentKey === parentKey);
      return sum + (action?.monetaryImpact || 0);
    }, 0);
    
    return {
      total: actions.length,
      open: openActions.length,
      overdue: overdueActions.length,
      completed: actions.filter((a: any) => a.status === 'COMPLETED' || a.status === 'Completed').length,
      financialImpact: moneyOpen + moneyOverdue,
      moneyOpen,
      moneyOverdue,
      completionRate: actions.length > 0 
        ? ((actions.filter((a: any) => a.status === 'COMPLETED' || a.status === 'Completed').length / actions.length) * 100).toFixed(1) 
        : '0.0',
      overdueRate: actions.length > 0 
        ? ((actions.filter((a: any) => a.status === 'Overdue').length / actions.length) * 100).toFixed(1) 
        : '0.0',
    };
  }, [actions]);

  // Status Doughnut Chart
  const statusDoughnutData: ChartData<'doughnut'> = useMemo(() => {
    if (!actions || !Array.isArray(actions)) return { labels: [], datasets: [] };

    const statusCounts: Record<string, number> = {};
    actions.forEach((a: any) => {
      const status = a.status === 'COMPLETED' ? 'Completed' : a.status === 'RISK ACCEPTED' ? 'Risk Accepted' : a.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'Open': 'rgba(59, 130, 246, 0.8)',
      'Overdue': 'rgba(239, 68, 68, 0.8)',
      'Completed': 'rgba(34, 197, 94, 0.8)',
      'Risk Accepted': 'rgba(147, 51, 234, 0.8)',
    };

    const labels = Object.keys(statusCounts);
    const data = labels.map(l => statusCounts[l] || 0);
    const backgroundColor = labels.map(l => colors[l] || 'rgba(156,163,175,0.8)');

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: '#fff',
        borderWidth: 2,
      }],
    };
  }, [actions]);

  // Sorted and filtered actions
  const sortedActions = useMemo(() => {
    let filtered = [...actions];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(action => action.status === statusFilter);
    }
    if (auditFilter !== 'all') {
      filtered = filtered.filter(action => action.auditName === auditFilter);
    }
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(action => action.riskLevel === riskLevelFilter);
    }
    if (responsibleFilter !== 'all') {
      filtered = filtered.filter(action => action.responsibleEmail === responsibleFilter);
    }
    
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [actions, sortField, sortDirection, statusFilter, auditFilter, riskLevelFilter, responsibleFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(actions.map((a: any) => a.status))].filter(Boolean) as string[];
    return statuses.map((s: string) => {
      if (s === 'COMPLETED') return 'Completed';
      if (s === 'RISK ACCEPTED') return 'Risk Accepted';
      return s;
    }).sort();
  }, [actions]);

  const uniqueAudits = useMemo(() => {
    const audits = [...new Set(actions.map((a: any) => a.auditName))].filter(Boolean) as string[];
    return audits.sort();
  }, [actions]);

  const uniqueRiskLevels = useMemo(() => {
    const levels = [...new Set(actions.map((a: any) => a.riskLevel))].filter(Boolean) as string[];
    return levels.sort();
  }, [actions]);

  const uniqueResponsibles = useMemo(() => {
    const responsibles = [...new Set(actions.map((a: any) => a.responsibleEmail))].filter(Boolean) as string[];
    return responsibles.sort();
  }, [actions]);

  const paginatedActions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedActions.slice(startIndex, endIndex);
  }, [sortedActions, currentPage, itemsPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED' || status === 'Completed') return 'success';
    if (status === 'Overdue') return 'danger';
    if (status === 'Open') return 'warning';
    if (status === 'RISK ACCEPTED' || status === 'Risk Accepted') return 'info';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Management Level Actions</h1>
          <p className="text-gray-600 mt-1">Actions assigned to you via management field</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View As Dropdown (Admin Only - Management users only) */}
          {(role === 'admin' || (isImpersonating && originalUser?.role === 'admin')) && (
            <ViewAsDropdown 
              onSelectUser={handleViewAs}
              filterByRole="management"
            />
          )}
          
          {/* Year Filter Toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
            <button
              onClick={() => setScorecardFilter('2024+')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                scorecardFilter === '2024+'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              As of 2024
            </button>
            <button
              onClick={() => setScorecardFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                scorecardFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              All Results
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card 
          variant="elevated" 
          padding="sm"
          className={`border-t-4 ${scorecardFilter === '2024+' ? 'border-t-purple-600' : 'border-t-gray-400'}`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ({scorecardFilter === '2024+' ? '2024+' : 'All Results'})
            </p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className={`border-t-4 ${scorecardFilter === '2024+' ? 'border-t-purple-600' : 'border-t-gray-400'}`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{stats.open}</p>
            <p className="text-sm text-gray-600 mt-1">Open</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ({scorecardFilter === '2024+' ? '2024+' : 'All Results'})
            </p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className={`border-t-4 ${scorecardFilter === '2024+' ? 'border-t-purple-600' : 'border-t-gray-400'}`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.overdue}</p>
            <p className="text-sm text-gray-600 mt-1">Overdue</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ({scorecardFilter === '2024+' ? '2024+' : 'All Results'})
            </p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className={`border-t-4 ${scorecardFilter === '2024+' ? 'border-t-purple-600' : 'border-t-gray-400'}`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ({scorecardFilter === '2024+' ? '2024+' : 'All Results'})
            </p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className={`border-t-4 ${scorecardFilter === '2024+' ? 'border-t-purple-600' : 'border-t-gray-400'}`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.completionRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ({scorecardFilter === '2024+' ? '2024+' : 'All Results'})
            </p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className={`border-t-4 ${scorecardFilter === '2024+' ? 'border-t-purple-600' : 'border-t-gray-400'}`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.overdueRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Overdue Rate</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ({scorecardFilter === '2024+' ? '2024+' : 'All Results'})
            </p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className="border-t-4 border-t-green-600"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatFinancialImpact(stats.moneyOpen)}</p>
            <p className="text-xs text-gray-700 font-semibold mt-1">Financial Impact</p>
            <p className="text-xs text-gray-500">(Open Status)</p>
            <p className="text-[10px] text-gray-400 mt-0.5">(2024+)</p>
          </div>
        </Card>
        <Card 
          variant="elevated" 
          padding="sm"
          className="border-t-4 border-t-green-600"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{formatFinancialImpact(stats.moneyOverdue)}</p>
            <p className="text-xs text-gray-700 font-semibold mt-1">Financial Impact</p>
            <p className="text-xs text-gray-500">(Overdue Status)</p>
            <p className="text-[10px] text-gray-400 mt-0.5">(2024+)</p>
          </div>
        </Card>
      </div>

      {/* Status Doughnut + Responsible Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Doughnut */}
        <DoughnutChart
          title="Status Distribution"
          subtitle="Actions by current status"
          data={statusDoughnutData}
          height={400}
          loading={isLoading}
          options={{
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  padding: 15,
                  usePointStyle: true,
                  font: { size: 12 },
                },
              },
              datalabels: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const dataset = context.dataset;
                    const total = (dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
            cutout: '60%',
          }}
        />

        {/* Responsible Breakdown List */}
        <Card>
          <CardHeader title="Action Ownership Breakdown" subtitle="Top action responsibles with status details" />
          <div className="p-6">
            {isLoading ? (
              <Loading size="lg" />
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {(() => {
                  // Generate distinct colors for each person
                  const colors = [
                    '#3B82F6', '#EF4444', '#22C55E', '#9333EA', '#F59E0B',
                    '#EC4899', '#0EA5E9', '#A855F7', '#22D3EE', '#FB923C'
                  ];

                  // Group by responsible
                  const grouped: Record<string, any> = {};
                  actions.forEach((a: any) => {
                    const responsible = a.responsibleEmail || 'Unassigned';
                    if (!grouped[responsible]) {
                      grouped[responsible] = { total: 0, completed: 0, open: 0, overdue: 0, riskAccepted: 0 };
                    }
                    grouped[responsible].total++;
                    const status = a.status === 'COMPLETED' ? 'Completed' : a.status === 'RISK ACCEPTED' ? 'Risk Accepted' : a.status;
                    if (status === 'Completed') grouped[responsible].completed++;
                    else if (status === 'Open') grouped[responsible].open++;
                    else if (status === 'Overdue') grouped[responsible].overdue++;
                    else if (status === 'Risk Accepted') grouped[responsible].riskAccepted++;
                  });

                  const total = actions.length;

                  // Sort and take top 10
                  return Object.entries(grouped)
                    .sort((a, b) => b[1].total - a[1].total)
                    .slice(0, 10)
                    .map(([responsible, data]: [string, any], idx) => {
                      const percentage = ((data.total / total) * 100).toFixed(1);
                      const color = colors[idx];
                      const name = responsible.split('@')[0];
                      
                      return (
                        <div key={responsible} className="border-b border-gray-200 pb-2 last:border-b-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-gray-900 truncate">{name}</div>
                                <div className="text-xs text-gray-500 truncate">{responsible}</div>
                              </div>
                              <span className="text-base font-bold text-gray-900 ml-2">{data.total} <span className="text-xs text-gray-500">({percentage}%)</span></span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 ml-5">
                            {data.open > 0 && (
                              <Badge variant="danger" size="sm">OPEN: {data.open}</Badge>
                            )}
                            {data.completed > 0 && (
                              <Badge variant="success" size="sm">COMPLETED: {data.completed}</Badge>
                            )}
                            {data.riskAccepted > 0 && (
                              <Badge variant="info" size="sm">RISK ACCEPTED: {data.riskAccepted}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Actions Table */}
      <Card variant="elevated">
        <CardHeader 
          title="Management Level Finding Actions" 
          subtitle={`${actions?.length || 0} actions found`}
          action={
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => exportFindingActions({ auditYear: scorecardFilter, role: 'management' })}
              isLoading={isExporting}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to Excel
            </Button>
          }
        />
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loading size="xl" text="Loading management actions..." />
          </div>
      ) : !actions || !Array.isArray(actions) ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No actions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No management actions available for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            {/* Modern Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  </div>

                {/* Audit Filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Audit:</label>
                  <select
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent max-w-xs"
                  >
                    <option value="all">All Audits</option>
                    {uniqueAudits.map(audit => (
                      <option key={audit} value={audit}>{audit}</option>
                    ))}
                  </select>
                  </div>

                {/* Risk Level Filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Risk Level:</label>
                  <select
                    value={riskLevelFilter}
                    onChange={(e) => setRiskLevelFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Levels</option>
                    {uniqueRiskLevels.map(risk => (
                      <option key={risk} value={risk}>{risk}</option>
                    ))}
                  </select>
                </div>

                {/* Responsible Filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Responsible:</label>
                  <select
                    value={responsibleFilter}
                    onChange={(e) => setResponsibleFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent max-w-xs"
                  >
                    <option value="all">All Responsibles</option>
                    {uniqueResponsibles.map(responsible => (
                      <option key={responsible} value={responsible}>{responsible}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetFilters}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </Button>
              </div>
            </div>

            <table ref={tableRef} className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  {columnOrder.map(colKey => {
                    const col = {
                      key: { label: 'Key', sortable: true, sortKey: 'key' },
                      summary: { label: 'Summary', sortable: false },
                      description: { label: 'Description', sortable: false },
                      status: { label: 'Status', sortable: true, sortKey: 'status' },
                      audit: { label: 'Audit', sortable: true, sortKey: 'auditName' },
                      dueDate: { label: 'Due Date', sortable: true, sortKey: 'dueDate' },
                      riskLevel: { label: 'Risk Level', sortable: true, sortKey: 'riskLevel' },
                      responsible: { label: 'Responsible', sortable: false },
                      actions: { label: 'Action Detail', sortable: false },
                    }[colKey];
                    
                    return (
                      <ResizableTableHeader
                        key={colKey}
                        columnKey={colKey}
                        width={columnWidths[colKey]}
                        onResizeStart={handleMouseDown}
                        isResizing={resizing === colKey}
                        className={cn(
                          'text-left py-3 px-4 text-sm font-semibold text-gray-700',
                          col?.sortable && 'cursor-pointer hover:bg-purple-50 transition-colors select-none',
                          colKey === 'actions' && 'text-center'
                        )}
                        onClick={col?.sortable && col?.sortKey ? () => handleSort(col.sortKey) : undefined}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedColumn === colKey}
                        isDragOver={dragOverColumn === colKey}
                      >
                        {col?.sortable && col?.sortKey ? (
                          <div className="flex items-center gap-2">
                            {col?.label}
                            <span className={sortField === col.sortKey ? 'text-purple-600' : 'text-gray-400'}>
                              {sortField === col.sortKey 
                                ? (sortDirection === 'asc' ? '↑' : '↓')
                                : '⇅'
                              }
                            </span>
                          </div>
                        ) : (
                          col?.label
                        )}
                      </ResizableTableHeader>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedActions.map((action: any) => (
                  <tr key={action.key} className="hover:bg-gray-50 transition-colors">
                    {columnOrder.map(colKey => (
                      <td
                        key={colKey}
                        className="px-4 py-3 text-sm"
                        style={{ width: columnWidths[colKey] }}
                      >
                        {colKey === 'key' && <span className="text-purple-600 font-mono font-semibold">{action.key}</span>}
                        {colKey === 'summary' && <span className="text-gray-900 font-medium">{action.summary}</span>}
                        {colKey === 'description' && <span className="text-gray-600 text-sm">{action.description || '-'}</span>}
                        {colKey === 'status' && (
                          <Badge variant={getStatusBadge(action.status)}>
                            {action.status === 'COMPLETED' ? 'Completed' : 
                             action.status === 'RISK ACCEPTED' ? 'Risk Accepted' : 
                             action.status}
                          </Badge>
                        )}
                        {colKey === 'audit' && <span className="text-gray-600 text-sm">{action.auditName || '-'}</span>}
                        {colKey === 'dueDate' && <span className="text-gray-600 text-sm">{action.dueDate ? formatDate(action.dueDate, 'PP') : '-'}</span>}
                        {colKey === 'riskLevel' && (
                          <Badge variant={
                            action.riskLevel === 'Critical' ? 'danger' :
                            action.riskLevel === 'High' ? 'warning' :
                            action.riskLevel === 'Medium' ? 'info' :
                            'default'
                          }>
                            {action.riskLevel || 'Unassigned'}
                          </Badge>
                        )}
                        {colKey === 'responsible' && <span className="text-gray-600 text-sm">{action.responsibleEmail || '-'}</span>}
                        {colKey === 'actions' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedAction(action);
                              setIsModalOpen(true);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          
          {/* Pagination */}
        {sortedActions.length > 0 && (
          <div className="mt-4 p-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
              totalItems={sortedActions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
          </div>
        )}
            </Card>

      {/* Finding Detail Modal */}
      {isModalOpen && selectedAction && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Finding Action Details</h2>
                  <p className="text-purple-100 text-sm mt-1">{selectedAction.key}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-purple-200 transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Action Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Audit Name</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedAction.auditName || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadge(selectedAction.status)}>
                      {selectedAction.status === 'COMPLETED' ? 'Completed' : 
                       selectedAction.status === 'RISK ACCEPTED' ? 'Risk Accepted' : 
                       selectedAction.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Due Date</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedAction.dueDate ? formatDate(selectedAction.dueDate, 'PPP') : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Action Responsible</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedAction.responsibleEmail || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Risk Level</label>
                  <div className="mt-1">
                    <Badge variant={
                      selectedAction.riskLevel === 'Critical' ? 'danger' :
                      selectedAction.riskLevel === 'High' ? 'warning' :
                      selectedAction.riskLevel === 'Medium' ? 'info' :
                      'default'
                    }>
                      {selectedAction.riskLevel || 'Unassigned'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Summary */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Action Summary</label>
                <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-lg">{selectedAction.summary}</p>
              </div>

              {/* Action Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Action Description</label>
                <p className="text-gray-700 mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedAction.description || 'No description available'}
                </p>
              </div>

              {/* Parent Finding Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Finding Description</label>
                <p className="text-gray-700 mt-2 p-4 bg-purple-50 rounded-lg whitespace-pre-wrap border border-purple-200">
                  {selectedAction.parentDescription || 'No description available'}
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center pt-4 border-t">
                <Button 
                  onClick={() => setIsModalOpen(false)}
                  variant="primary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementLevelActionsPage;
