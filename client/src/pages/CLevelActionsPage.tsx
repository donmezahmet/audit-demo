import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, Button, Badge, Loading, Pagination } from '@/components/ui';
import { PieChart } from '@/components/charts';
import { useCLevelFindingActions, useResizableColumns, useExport } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { ChartData } from 'chart.js';
import { formatDate, formatFinancialImpact } from '@/utils/format';
import { cn } from '@/utils/cn';
import ResizableTableHeader from '@/components/ResizableTableHeader';
import ViewAsDropdown from '@/components/ViewAsDropdown';

const CLevelActionsPage: React.FC = () => {
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
  const [hoveredSegment, setHoveredSegment] = useState<{ responsible: string; status: string; percentage: string } | null>(null);
  const { role, isImpersonating, originalUser, startImpersonation } = useAuthStore();
  const { isExporting, exportFindingActions } = useExport();
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Column ordering state
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem('clevel-actions-column-order');
    return stored ? JSON.parse(stored) : ['key', 'summary', 'description', 'status', 'audit', 'dueDate', 'riskLevel', 'responsible', 'actions'];
  });
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Data fetching
  const { data: actions = [], isLoading } = useCLevelFindingActions({
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
    setSortField(null);
    setSortDirection('asc');
  };
  
  // Handle View As functionality (only top_management users)
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
    localStorage.setItem('clevel-actions-column-order', JSON.stringify(newOrder));
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
    'clevel-actions-columns'
  );

  // Calculate stats - Her parent sadece 1 kez sayılmalı
  const stats = useMemo(() => {
    if (!actions || !Array.isArray(actions)) return { 
      total: 0, open: 0, overdue: 0, completed: 0, 
      financialImpact: 0, completionRate: '0.0', overdueRate: '0.0',
      moneyOpen: 0, moneyOverdue: 0
    };
    
    // Open ve Overdue için unique parent'ları bul ve impact'leri topla
    const openActions = actions.filter((a: any) => a.status === 'Open');
    const overdueActions = actions.filter((a: any) => a.status === 'Overdue');
    
    // Her parent'ın impact'ini sadece 1 kez say - unique parent'lara göre
    const uniqueOpenParents = new Set(openActions.map((a: any) => a.parentKey).filter(Boolean));
    const uniqueOverdueParents = new Set(overdueActions.map((a: any) => a.parentKey).filter(Boolean));
    
    // Her unique parent için impact'i topla
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

  // Status pie chart data - birebir Department Actions ile aynı
  const statusChartData: ChartData<'pie'> = useMemo(() => {
    if (!actions || !Array.isArray(actions)) return { labels: [], datasets: [] };

    const statusCounts: Record<string, number> = {};
    actions.forEach((action: any) => {
      statusCounts[action.status] = (statusCounts[action.status] || 0) + 1;
    });

    // Normalize status labels to proper case for display
    const statusMapping: Record<string, string> = {
      'COMPLETED': 'Completed',
      'Completed': 'Completed',
      'RISK ACCEPTED': 'Risk Accepted',
      'Risk Accepted': 'Risk Accepted',
      'Open': 'Open',
      'Overdue': 'Overdue',
      'In Progress': 'In Progress',
    };

    // Colors matching Dashboard's Finding Actions Status chart
    const colors: Record<string, string> = {
      'Open': 'rgba(59, 130, 246, 0.8)',        // Blue (same as Dashboard)
      'Overdue': 'rgba(239, 68, 68, 0.8)',      // Red (same as Dashboard)
      'Completed': 'rgba(34, 197, 94, 0.8)',    // Green (same as Dashboard)
      'Risk Accepted': 'rgba(147, 51, 234, 0.8)', // Purple (same as Dashboard)
      'In Progress': 'rgba(59, 130, 246, 0.8)',
    };

    // Normalize labels and aggregate counts
    const normalizedCounts: Record<string, number> = {};
    Object.entries(statusCounts).forEach(([status, count]) => {
      const normalizedStatus = statusMapping[status] || status;
      normalizedCounts[normalizedStatus] = (normalizedCounts[normalizedStatus] || 0) + count;
    });

    const labels = Object.keys(normalizedCounts);
    const data = labels.map(label => normalizedCounts[label] || 0);
    const backgroundColors = labels.map(label => colors[label] || 'rgba(156, 163, 175, 0.8)');

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderColor: '#fff',
        borderWidth: 2,
      }],
    };
  }, [actions]);

  // Sorted and filtered actions
  const sortedActions = useMemo(() => {
    let filtered = [...actions];
    
    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(action => action.status === statusFilter);
    }
    if (auditFilter !== 'all') {
      filtered = filtered.filter(action => action.auditName === auditFilter);
    }
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(action => action.riskLevel === riskLevelFilter);
    }
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [actions, sortField, sortDirection, statusFilter, auditFilter, riskLevelFilter]);

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
          <h1 className="text-3xl font-bold text-gray-900">C-Level Actions</h1>
          <p className="text-gray-600 mt-1">Executive-level audit finding actions overview</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View As Dropdown (Admin Only - Top Management only) */}
          {(role === 'admin' || (isImpersonating && originalUser?.role === 'admin')) && (
            <ViewAsDropdown 
              onSelectUser={handleViewAs}
              filterByRole="top_management"
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
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" fill={scorecardFilter === '2024+' ? 'white' : '#E5E7EB'} />
                <rect x="3" y="4" width="18" height="6" rx="2" fill={scorecardFilter === '2024+' ? '#DC2626' : '#991B1B'} />
                <text x="12" y="8" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">JUL</text>
                <text x="12" y="16" textAnchor="middle" fill={scorecardFilter === '2024+' ? '#6B7280' : '#1F2937'} fontSize="8" fontWeight="bold">17</text>
            </svg>
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
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="14" width="3" height="6" fill="#10B981" rx="0.5" />
                <rect x="10" y="8" width="3" height="12" fill="#EF4444" rx="0.5" />
                <rect x="16" y="11" width="3" height="9" fill="#3B82F6" rx="0.5" />
                <line x1="3" y1="7" x2="21" y2="7" stroke={scorecardFilter === 'all' ? 'white' : '#9CA3AF'} strokeWidth="1.5" />
            </svg>
              All Results
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards with Financial Impact */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          title="C-Level Actions Status Distribution"
          subtitle="Current status breakdown"
          data={statusChartData}
          height={350}
        loading={isLoading}
        options={{
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
                    return `${label}: ${value} (${percentage}%)`;
                  },
                },
            },
          },
        }}
      />

        <Card>
          <CardHeader title="Actions by Responsible and Status" subtitle="Distribution by action responsible" />
          <div className="p-6">
            {isLoading ? (
              <Loading size="lg" />
            ) : (
              <div className="space-y-2">
                {(() => {
                  // Group actions by responsible email and status
                  const grouped: Record<string, Record<string, number>> = {};
                  actions.forEach((action: any) => {
                    const responsible = action.responsibleEmail || 'Unassigned';
                    const status = action.status === 'COMPLETED' ? 'Completed' : 
                                   action.status === 'RISK ACCEPTED' ? 'Risk Accepted' : 
                                   action.status;
                    if (!grouped[responsible]) grouped[responsible] = {};
                    grouped[responsible][status] = (grouped[responsible][status] || 0) + 1;
                  });

                  // Sort by total count and take top 8
                  const sortedResponsibles = Object.entries(grouped)
                    .sort((a, b) => {
                      const totalA = Object.values(a[1]).reduce((sum, count) => sum + count, 0);
                      const totalB = Object.values(b[1]).reduce((sum, count) => sum + count, 0);
                      return totalB - totalA;
                    })
                    .slice(0, 8);

                  return sortedResponsibles.map(([responsible, statuses]) => {
                    const total = Object.values(statuses).reduce((sum, count) => sum + count, 0);
                    const completed = statuses['Completed'] || 0;
                    const open = statuses['Open'] || 0;
                    const overdue = statuses['Overdue'] || 0;
                    const riskAccepted = statuses['Risk Accepted'] || 0;

                    return (
                      <div key={responsible} className="space-y-1 relative">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium truncate max-w-[200px]" title={responsible}>
                            {responsible}
                          </span>
                          <span className="text-gray-500">{total} actions</span>
                        </div>
                        <div className="flex h-6 rounded-full overflow-visible bg-gray-100 relative">
                          {completed > 0 && (
                            <div 
                              className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity relative group"
                              style={{ width: `${(completed / total) * 100}%` }}
                              onMouseEnter={() => setHoveredSegment({ 
                                responsible, 
                                status: 'Completed', 
                                percentage: ((completed / total) * 100).toFixed(1) 
                              })}
                              onMouseLeave={() => setHoveredSegment(null)}
                            >
                              {completed > 0 && <span className="px-1">{completed}</span>}
                              {hoveredSegment?.responsible === responsible && hoveredSegment?.status === 'Completed' && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-lg">
                                  Completed: {completed} ({hoveredSegment.percentage}%)
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              )}
                            </div>
                          )}
                          {open > 0 && (
                            <div 
                              className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity relative group"
                              style={{ width: `${(open / total) * 100}%` }}
                              onMouseEnter={() => setHoveredSegment({ 
                                responsible, 
                                status: 'Open', 
                                percentage: ((open / total) * 100).toFixed(1) 
                              })}
                              onMouseLeave={() => setHoveredSegment(null)}
                            >
                              {open > 0 && <span className="px-1">{open}</span>}
                              {hoveredSegment?.responsible === responsible && hoveredSegment?.status === 'Open' && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-lg">
                                  Open: {open} ({hoveredSegment.percentage}%)
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              )}
                            </div>
                          )}
                          {overdue > 0 && (
                            <div 
                              className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity relative group"
                              style={{ width: `${(overdue / total) * 100}%` }}
                              onMouseEnter={() => setHoveredSegment({ 
                                responsible, 
                                status: 'Overdue', 
                                percentage: ((overdue / total) * 100).toFixed(1) 
                              })}
                              onMouseLeave={() => setHoveredSegment(null)}
                            >
                              {overdue > 0 && <span className="px-1">{overdue}</span>}
                              {hoveredSegment?.responsible === responsible && hoveredSegment?.status === 'Overdue' && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-lg">
                                  Overdue: {overdue} ({hoveredSegment.percentage}%)
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              )}
                            </div>
                          )}
                          {riskAccepted > 0 && (
                            <div 
                              className="bg-purple-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity relative group"
                              style={{ width: `${(riskAccepted / total) * 100}%` }}
                              onMouseEnter={() => setHoveredSegment({ 
                                responsible, 
                                status: 'Risk Accepted', 
                                percentage: ((riskAccepted / total) * 100).toFixed(1) 
                              })}
                              onMouseLeave={() => setHoveredSegment(null)}
                            >
                              {riskAccepted > 0 && <span className="px-1">{riskAccepted}</span>}
                              {hoveredSegment?.responsible === responsible && hoveredSegment?.status === 'Risk Accepted' && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-lg">
                                  Risk Accepted: {riskAccepted} ({hoveredSegment.percentage}%)
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs text-gray-600">Open</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-600">Overdue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-xs text-gray-600">Risk Accepted</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Actions Table - birebir Department Actions ile aynı tasarım */}
      <Card variant="elevated">
        <CardHeader 
          title="C-Level Finding Actions" 
          subtitle={`${actions?.length || 0} actions found`}
          action={
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => exportFindingActions({ auditYear: scorecardFilter, role: 'clevel' })}
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
            <Loading size="xl" text="Loading C-Level actions..." />
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
              No C-Level actions available for the selected filters.
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
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md hover:border-purple-400 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.4rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.2em 1.2em',
                      paddingRight: '2rem'
                    }}
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
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md hover:border-purple-400 appearance-none cursor-pointer max-w-xs"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.4rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.2em 1.2em',
                      paddingRight: '2rem'
                    }}
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
                    className="px-3 py-1.5 text-xs bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md hover:border-purple-400 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.4rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.2em 1.2em',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="all">All Levels</option>
                    {uniqueRiskLevels.map(risk => (
                      <option key={risk} value={risk}>{risk}</option>
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
                  <label className="text-xs font-semibold text-gray-500 uppercase">Financial Impact</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatFinancialImpact(selectedAction.monetaryImpact)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Action Responsible</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedAction.responsibleEmail || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">C-Level</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedAction.cLevel || '-'}</p>
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

export default CLevelActionsPage;
