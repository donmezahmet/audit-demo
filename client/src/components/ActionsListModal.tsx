import React, { useState, useEffect, useMemo } from 'react';
import { Button, Badge, Loading } from '@/components/ui';
import { formatDate, formatFinancialImpact } from '@/utils/format';
import { useResizableColumns } from '@/hooks';
import ResizableTableHeader from './ResizableTableHeader';

interface Action {
  key: string;
  summary: string;
  description: string;
  findingDescription?: string;
  status: string;
  dueDate: string;
  daysUntilDue?: number;
  responsibleEmail: string;
  cLevel: string;
  auditName: string;
  auditLead: string;
  riskLevel: string;
  financialImpact: number;
  auditYear: string;
}

interface ActionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  actions: Action[] | undefined;
  loading: boolean;
  headerBgColor?: string; // e.g., 'bg-red-50' or 'bg-blue-50'
  showDaysUntilDue?: boolean; // Show "Days Until Due" column for upcoming actions
}

const ActionsListModal: React.FC<ActionsListModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  actions,
  loading,
  headerBgColor = 'bg-gray-50',
  showDaysUntilDue = false,
}) => {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Column order based on whether we show days until due
  const initialColumnOrder = showDaysUntilDue
    ? ['status', 'audit', 'auditYear', 'auditLead', 'dueDate', 'daysUntilDue', 'riskLevel', 'responsible', 'cLevel', 'description', 'actions']
    : ['status', 'audit', 'auditYear', 'auditLead', 'dueDate', 'riskLevel', 'responsible', 'cLevel', 'description', 'actions'];
    
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const { columnWidths, handleMouseDown } = useResizableColumns(
    {
      status: 120,
      audit: 200,
      auditYear: 100,
      auditLead: 180,
      dueDate: 130,
      daysUntilDue: 100,
      riskLevel: 120,
      responsible: 200,
      cLevel: 180,
      description: 300,
      actions: 120,
    },
    undefined,
    'actions-modal-column-widths'
  );

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort actions
  const sortedActions = useMemo(() => {
    if (!actions || !sortConfig) return actions || [];

    const sorted = [...actions].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [actions, sortConfig]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') return 'success';
    if (statusLower === 'risk accepted') return 'default';
    if (statusLower === 'overdue') return 'danger';
    if (statusLower === 'closed') return 'info';
    return 'warning';
  };

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isDetailModalOpen) {
          setIsDetailModalOpen(false);
          setSelectedAction(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, isDetailModalOpen, onClose]);


  const columns: Record<string, any> = {
    status: {
      label: 'Status',
      render: (action: Action) => (
        <Badge variant={getStatusBadge(action.status)}>
          {action.status}
        </Badge>
      ),
    },
    audit: {
      label: 'Audit',
      sortable: true,
      sortKey: 'auditName',
      render: (action: Action) => (
        <span className="text-gray-600 text-sm">{action.auditName || '-'}</span>
      ),
    },
    auditYear: {
      label: 'Audit Year',
      sortable: true,
      sortKey: 'auditYear',
      render: (action: Action) => (
        <span className="text-gray-600 text-sm">{action.auditYear || '-'}</span>
      ),
    },
    auditLead: {
      label: 'Audit Lead',
      sortable: true,
      sortKey: 'auditLead',
      render: (action: Action) => (
        <span className="text-gray-600 text-sm">{action.auditLead || '-'}</span>
      ),
    },
    daysUntilDue: {
      label: 'Days Until Due',
      sortable: true,
      sortKey: 'daysUntilDue',
      render: (action: Action) => (
        action.daysUntilDue !== null && action.daysUntilDue !== undefined ? (
          <span className={`text-sm font-medium ${action.daysUntilDue < 7 ? 'text-red-600' : action.daysUntilDue < 14 ? 'text-orange-600' : 'text-gray-600'}`}>
            {action.daysUntilDue} days
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    dueDate: {
      label: 'Due Date',
      render: (action: Action) => (
        <span className="text-gray-600 text-sm">
          {action.dueDate ? formatDate(action.dueDate, 'PP') : '-'}
        </span>
      ),
    },
    riskLevel: {
      label: 'Risk Level',
      render: (action: Action) => (
        <Badge
          variant={
            action.riskLevel === 'Critical'
              ? 'danger'
              : action.riskLevel === 'High'
              ? 'warning'
              : action.riskLevel === 'Medium'
              ? 'info'
              : 'default'
          }
        >
          {action.riskLevel || 'Unassigned'}
        </Badge>
      ),
    },
    responsible: {
      label: 'Responsible',
      render: (action: Action) => (
        <span className="text-gray-600 text-sm">{action.responsibleEmail || '-'}</span>
      ),
    },
    cLevel: {
      label: 'C-Level',
      render: (action: Action) => (
        <span className="text-gray-600 text-sm">{action.cLevel || '-'}</span>
      ),
    },
    description: {
      label: 'Description',
      render: (action: Action) => (
        <span className="text-gray-700 text-sm line-clamp-2" title={action.description}>
          {action.description || '-'}
        </span>
      ),
    },
    actions: {
      label: 'Action Detail',
      render: (action: Action) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedAction(action);
            setIsDetailModalOpen(true);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </Button>
      ),
    },
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <div className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${headerBgColor}`}>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Loading...' : subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loading size="lg" />
              </div>
            ) : actions && actions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {columnOrder.map((columnId) => {
                        const column = columns[columnId];
                        if (!column) return null;

                        return (
                          <ResizableTableHeader
                            key={columnId}
                            columnKey={columnId}
                            width={columnWidths[columnId]}
                            onResizeStart={handleMouseDown}
                            isResizing={false}
                            onClick={column.sortable ? () => handleSort(column.sortKey) : undefined}
                            onDragStart={() => handleDragStart(columnId)}
                            onDragOver={(e) => handleDragOver(e)}
                            onDrop={() => handleDrop(columnId)}
                            isDragging={draggedColumn === columnId}
                            className={`px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 bg-gray-50 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {column.label}
                              {column.sortable && (
                                <span className={sortConfig && sortConfig.key === column.sortKey ? 'text-purple-600' : 'text-gray-400'}>
                                  {sortConfig && sortConfig.key === column.sortKey 
                                    ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                                    : '⇅'
                                  }
                                </span>
                              )}
                            </div>
                          </ResizableTableHeader>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedActions.map((action) => (
                      <tr key={action.key} className="hover:bg-gray-50 transition-colors">
                        {columnOrder.map((columnId) => {
                          const column = columns[columnId];
                          if (!column) return null;

                          return (
                            <td
                              key={columnId}
                              className="px-4 py-3 border-r border-gray-100"
                              style={{ width: `${columnWidths[columnId]}px` }}
                            >
                              {column.render(action)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No actions found</div>
            )}
          </div>
        </div>
      </div>

      {/* Action Detail Modal */}
      {isDetailModalOpen && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Action Details</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedAction.key}</p>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAction(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Action Summary */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ACTION SUMMARY</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAction.summary}</p>
                </div>

                {/* Action Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ACTION DESCRIPTION</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedAction.description || 'No description available'}
                  </p>
                </div>

                {/* Finding Description (from parent) */}
                {selectedAction.findingDescription && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">FINDING DESCRIPTION</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap border-l-4 border-blue-500">
                      {selectedAction.findingDescription}
                    </p>
                  </div>
                )}

                {/* Action Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">STATUS</label>
                    <Badge variant={getStatusBadge(selectedAction.status)}>{selectedAction.status}</Badge>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">DUE DATE</label>
                    <p className="text-gray-900">
                      {selectedAction.dueDate ? formatDate(selectedAction.dueDate, 'PPP') : '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ACTION RESPONSIBLE</label>
                    <p className="text-gray-900">{selectedAction.responsibleEmail || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">C-LEVEL</label>
                    <p className="text-gray-900">{selectedAction.cLevel || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">AUDIT NAME</label>
                    <p className="text-gray-900">{selectedAction.auditName || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">AUDIT YEAR</label>
                    <p className="text-gray-900">{selectedAction.auditYear || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">AUDIT LEAD</label>
                    <p className="text-gray-900">{selectedAction.auditLead || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">RISK LEVEL</label>
                    <Badge
                      variant={
                        selectedAction.riskLevel === 'Critical'
                          ? 'danger'
                          : selectedAction.riskLevel === 'High'
                          ? 'warning'
                          : selectedAction.riskLevel === 'Medium'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {selectedAction.riskLevel || 'Unassigned'}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">FINANCIAL IMPACT</label>
                    <p className="text-gray-900 font-semibold text-indigo-600">
                      {selectedAction.financialImpact > 0
                        ? formatFinancialImpact(selectedAction.financialImpact)
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAction(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionsListModal;

