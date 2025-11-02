import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, Button, Badge, Loading, Pagination } from '@/components/ui';
import { useAllFindingActions, useResizableColumns, useExport } from '@/hooks';
import { formatDate, formatFinancialImpact } from '@/utils/format';
import { cn } from '@/utils/cn';
import ResizableTableHeader from '@/components/ResizableTableHeader';

interface ActiveFilter {
  id: string;
  field: string;
  value: string;
  label: string;
}

const AllFindingsActionsPage: React.FC = () => {
  const [scorecardFilter, setScorecardFilter] = useState<'2024+' | 'all'>('2024+');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Dynamic filters system
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  
  const { isExporting, exportFindingActions } = useExport();
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Column ordering state
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem('all-actions-column-order');
    return stored ? JSON.parse(stored) : ['key', 'summary', 'description', 'status', 'audit', 'dueDate', 'riskLevel', 'responsible', 'clevel', 'actions'];
  });
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Available filter options
  const availableFilterFields = [
    { value: 'status', label: 'Status' },
    { value: 'auditName', label: 'Audit Name' },
    { value: 'auditLead', label: 'Audit Lead' },
    { value: 'riskLevel', label: 'Risk Level' },
    { value: 'responsibleEmail', label: 'Action Responsible' },
    { value: 'cLevel', label: 'C-Level' },
  ];

  // Data fetching
  const { data: allActions = [], isLoading } = useAllFindingActions({
    auditYear: scorecardFilter,
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

  // Apply active filters to data
  const actions = useMemo(() => {
    if (!hasAppliedFilters) return [];
    
    let filtered = [...allActions];
    
    activeFilters.forEach(filter => {
      filtered = filtered.filter(action => {
        const fieldValue = action[filter.field];
        if (filter.value === 'all') return true;
        
        // Special handling for status normalization
        if (filter.field === 'status') {
          const normalizedActionStatus = action.status === 'COMPLETED' ? 'Completed' : action.status === 'RISK ACCEPTED' ? 'Risk Accepted' : action.status;
          return normalizedActionStatus === filter.value;
        }
        
        return fieldValue === filter.value;
      });
    });
    
    return filtered;
  }, [allActions, activeFilters, hasAppliedFilters]);

  // Add new filter
  const handleAddFilter = (field: string) => {
    const filterField = availableFilterFields.find(f => f.value === field);
    if (!filterField) return;
    
    const newFilter: ActiveFilter = {
      id: `${field}-${Date.now()}`,
      field: field,
      value: 'all',
      label: filterField.label,
    };
    
    setActiveFilters([...activeFilters, newFilter]);
    setShowFilterMenu(false);
    setHasAppliedFilters(true); // Auto-apply when adding filter
  };

  // Remove filter
  const handleRemoveFilter = (filterId: string) => {
    const newFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(newFilters);
    // If no filters left, reset to initial state
    if (newFilters.length === 0) {
      setHasAppliedFilters(false);
    }
  };

  // Update filter value
  const handleUpdateFilter = (filterId: string, value: string) => {
    setActiveFilters(activeFilters.map(f => 
      f.id === filterId ? { ...f, value } : f
    ));
    // Auto-apply when filter value changes
    setHasAppliedFilters(true);
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setActiveFilters([]);
    setHasAppliedFilters(false);
    setSortField(null);
    setSortDirection('asc');
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
    localStorage.setItem('all-actions-column-order', JSON.stringify(newOrder));
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
    clevel: 180,
    actions: 120,
  };
  
  const { columnWidths, resizing, handleMouseDown } = useResizableColumns(
    tableRef,
    initialColumnWidths,
    'all-actions-columns'
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
    
    // Her parent'ın impact'ini sadece 1 kez say
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

  // Get unique values for filter dropdowns (from all data)
  const getUniqueValues = (field: string) => {
    if (!allActions || allActions.length === 0) return [];
    
    const values = [...new Set(allActions.map((a: any) => a[field]))].filter(Boolean) as string[];
    
    // Normalize status values
    if (field === 'status') {
      return values.map((s: string) => {
        if (s === 'COMPLETED') return 'Completed';
        if (s === 'RISK ACCEPTED') return 'Risk Accepted';
        return s;
      }).sort();
    }
    
    return values.sort();
  };

  // Sorted actions
  const sortedActions = useMemo(() => {
    let filtered = [...actions];
    
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
  }, [actions, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold text-gray-900">All Findings & Actions</h1>
          <p className="text-gray-600 mt-1">Complete overview of all audit finding actions</p>
        </div>
        <div className="flex items-center gap-4">
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

      {/* Initial State - Minimal Design */}
      {!hasAppliedFilters && (
        <Card>
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Filters</h3>
              <p className="text-sm text-gray-600">Choose fields to filter and analyze finding actions</p>
            </div>
            
            {/* Compact Filter Selection */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {availableFilterFields.map(field => {
                const isActive = activeFilters.some(f => f.field === field.value);
                return (
                  <button
                    key={field.value}
                    onClick={() => {
                      if (isActive) {
                        handleRemoveFilter(activeFilters.find(f => f.field === field.value)!.id);
                      } else {
                        handleAddFilter(field.value);
                      }
                    }}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    )}
                  >
                    {isActive ? '✓' : '+'} {field.label}
                  </button>
                );
              })}
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <>
                <div className="space-y-2 mb-6">
                  {activeFilters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                      <span className="text-sm font-medium text-gray-700 w-32">{filter.label}:</span>
                      <select
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(filter.id, e.target.value)}
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="all">All</option>
                        {getUniqueValues(filter.field).map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveFilter(filter.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={handleResetAllFilters}>
                    Clear All
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Stats Cards - Only show when filters are applied */}
      {hasAppliedFilters && (
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{stats.open}</p>
            <p className="text-sm text-gray-600 mt-1">Open</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.overdue}</p>
            <p className="text-sm text-gray-600 mt-1">Overdue</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.completionRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.overdueRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Overdue Rate</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatFinancialImpact(stats.moneyOpen)}</p>
            <p className="text-xs text-gray-700 font-semibold mt-1">Financial Impact</p>
            <p className="text-xs text-gray-500">(Open Status)</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{formatFinancialImpact(stats.moneyOverdue)}</p>
            <p className="text-xs text-gray-700 font-semibold mt-1">Financial Impact</p>
            <p className="text-xs text-gray-500">(Overdue Status)</p>
          </div>
        </Card>
      </div>
      )}

      {/* Actions Table - Only show when filters are applied */}
      {hasAppliedFilters && (
      <Card variant="elevated">
        <CardHeader 
          title="All Finding Actions" 
          subtitle={`${sortedActions?.length || 0} actions found (filtered from ${actions?.length || 0} total)`}
          action={
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => exportFindingActions({ auditYear: scorecardFilter, role: 'all' })}
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
            <Loading size="xl" text="Loading all finding actions..." />
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
              No finding actions available for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            {/* Dynamic Filter System */}
            <div className="mb-6 space-y-4">
              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter) => (
                    <div key={filter.id} className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-purple-700">{filter.label}:</span>
                      <select
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(filter.id, e.target.value)}
                        className="text-xs bg-white border border-purple-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="all">All</option>
                        {getUniqueValues(filter.field).map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveFilter(filter.id)}
                        className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded p-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Filter Actions */}
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  {/* Add Filter Button with Dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Filter
                    </Button>
                    
                    {showFilterMenu && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                        <div className="p-2 space-y-1">
                          {availableFilterFields
                            .filter(field => !activeFilters.some(f => f.field === field.value))
                            .map(field => (
                              <button
                                key={field.value}
                                onClick={() => handleAddFilter(field.value)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded transition-colors"
                              >
                                {field.label}
                              </button>
                            ))}
                          {availableFilterFields.filter(field => !activeFilters.some(f => f.field === field.value)).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">All filters added</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {activeFilters.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetAllFilters}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reset All
                    </Button>
                  )}
                </div>
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
                      clevel: { label: 'C-Level', sortable: false },
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
                          <div className="flex items-center gap-1">
                            {col?.label}
                            <svg className={`w-4 h-4 transition-opacity ${sortField === col.sortKey ? 'opacity-100 text-purple-600' : 'opacity-40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d={sortField === col.sortKey && sortDirection === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
                            </svg>
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
                        {colKey === 'clevel' && <span className="text-gray-600 text-sm">{action.cLevel || '-'}</span>}
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
      )}

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

export default AllFindingsActionsPage;

