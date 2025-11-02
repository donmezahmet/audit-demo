import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { useAuditPlan } from '@/hooks';
import { Loading } from '@/components/ui';

interface AuditProgressChartProps {
  selectedLead?: string;
  selectedYear?: string;
}

export default function AuditProgressChart({ selectedLead = '', selectedYear = '2025' }: AuditProgressChartProps) {
  const { data: auditPlanData, isLoading } = useAuditPlan();

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!auditPlanData) return [];

    return auditPlanData
      .filter(item => {
        const matchesLead = !selectedLead || item.auditLead === selectedLead;
        const matchesYear = !selectedYear || item.auditYear === selectedYear;
        return matchesLead && matchesYear;
      })
      .sort((a, b) => b.progressLevel - a.progressLevel)
      .slice(0, 10); // Show top 10 for dashboard
  }, [auditPlanData, selectedLead, selectedYear]);

  // Chart configuration
  const chartData = useMemo(() => {
    if (!filteredData.length) return null;

    const allStages = ['Planned', 'Fieldwork', 'Pre Closing', 'Closing', 'Completed'];
    const segmentValue = 1 / allStages.length;

    // Modern gradient color palette with distinct colors per stage
    const stageColors = {
      completed: [
        '#8B5CF6', // Planned - violet-500
        '#7C3AED', // Fieldwork - violet-600
        '#6D28D9', // Pre Closing - violet-700
        '#5B21B6', // Closing - violet-800
        '#4C1D95', // Completed - violet-900
      ],
      pending: '#E5E7EB', // Gray-200
    };

    const datasets = allStages.map((stage, idx) => ({
      label: stage,
      data: filteredData.map(() => segmentValue),
      backgroundColor: filteredData.map(item =>
        item.progressLevel > idx ? stageColors.completed[idx] : stageColors.pending
      ),
      borderRadius: 8,
      borderSkipped: false,
      barThickness: 24,
      datalabels: {
        display: true,
        formatter: () => stage,
        color: (context: any) => {
          const item = filteredData[context.dataIndex];
          return item && item.progressLevel > idx ? '#ffffff' : '#6B7280';
        },
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        anchor: 'center' as const,
        align: 'center' as const,
      },
    }));

    return {
      labels: filteredData.map(item => item.summary.length > 40 ? item.summary.substring(0, 40) + '...' : item.summary),
      datasets,
    };
  }, [filteredData]);

  const chartOptions: ChartOptions<'bar'> = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        titleColor: '#fff',
        bodyColor: '#E5E7EB',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 2,
        displayColors: false,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        bodySpacing: 6,
        callbacks: {
          title: (context: any) => {
            const item = filteredData[context[0]?.dataIndex];
            return item ? item.summary : '';
          },
          label: (context: any) => {
            const item = filteredData[context.dataIndex];
            if (!item) return '';
            const progress = Math.round((item.progressLevel / 5) * 100);
            return [
              `Current Stage: ${item.statusLabel}`,
              `Progress: ${progress}%`,
              `Audit Lead: ${item.auditLead}`,
              `Year: ${item.auditYear}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 1,
        display: false,
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          font: {
            size: 12,
            weight: '500' as any,
          },
          color: '#1F2937',
          padding: 10,
        },
        grid: {
          display: false,
        },
      },
    },
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
      },
    },
  }), [filteredData]);

  // Dynamic height calculation
  const chartHeight = useMemo(() => {
    return Math.max(400, filteredData.length * 55);
  }, [filteredData.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  if (!chartData || filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No audit data available</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${chartHeight}px` }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

