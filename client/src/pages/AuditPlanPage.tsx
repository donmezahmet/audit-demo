import { useState, useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Card, Loading } from '@/components/ui';
import { useAuditPlan } from '@/hooks';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function AuditPlanPage() {
  const { data: auditPlanData, isLoading, error } = useAuditPlan();
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Extract unique leads and years for filters
  const { leads, years } = useMemo(() => {
    if (!auditPlanData) return { leads: [], years: [] };

    const leadsSet = new Set<string>();
    const yearsSet = new Set<string>();

    auditPlanData.forEach(item => {
      if (item.auditLead) leadsSet.add(item.auditLead);
      if (item.auditYear) yearsSet.add(item.auditYear);
    });

    return {
      leads: Array.from(leadsSet).sort(),
      years: Array.from(yearsSet).sort().reverse(),
    };
  }, [auditPlanData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!auditPlanData) return [];

    return auditPlanData
      .filter(item => {
        const matchesLead = !selectedLead || item.auditLead === selectedLead;
        const matchesYear = !selectedYear || item.auditYear === selectedYear;
        return matchesLead && matchesYear;
      })
      .sort((a, b) => b.progressLevel - a.progressLevel);
  }, [auditPlanData, selectedLead, selectedYear]);

  // Chart configuration
  const chartData = useMemo(() => {
    if (!filteredData.length) return null;

    const allStages = ['Planned', 'Fieldwork', 'Pre Closing', 'Closing', 'Completed'];
    const segmentValue = 1 / allStages.length;

    // Color palette - gradient from light to dark green
    const stageColors = {
      completed: [
        '#10b981', // Planned - emerald-500
        '#059669', // Fieldwork - emerald-600
        '#047857', // Pre Closing - emerald-700
        '#065f46', // Closing - emerald-800
        '#064e3b', // Completed - emerald-900
      ],
      pending: '#f3f4f6', // Gray-100
    };

    const datasets = allStages.map((stage, idx) => ({
      label: stage,
      data: filteredData.map(() => segmentValue),
      backgroundColor: filteredData.map(item =>
        item.progressLevel > idx ? stageColors.completed[idx] : stageColors.pending
      ),
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 20,
      datalabels: {
        display: true,
        formatter: () => stage,
        color: (context: any) => {
          const item = filteredData[context.dataIndex];
          return item && item.progressLevel > idx ? '#ffffff' : '#9ca3af';
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
      labels: filteredData.map(item => item.summary),
      datasets,
    };
  }, [filteredData]);

  const chartOptions = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: false,
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
            size: 13,
            weight: 'normal' as const,
          },
          color: '#374151',
        },
        grid: {
          display: false,
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
  }), [filteredData]);

  // Dynamic height calculation
  const chartHeight = useMemo(() => {
    return Math.max(400, filteredData.length * 50);
  }, [filteredData.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Audit Plan</h3>
          <p className="text-gray-600">Unable to fetch audit plan data. Please try again later.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Plan - Progress Tracker</h1>
          <p className="text-gray-600 mt-1">Track audit progress across all stages</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-900"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-3 h-3 rounded-full bg-gray-100"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label htmlFor="auditLead" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Audit Lead:
            </label>
            <select
              id="auditLead"
              value={selectedLead}
              onChange={(e) => setSelectedLead(e.target.value)}
              className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Leads</option>
              {leads.map(lead => (
                <option key={lead} value={lead}>{lead}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="auditYear" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Audit Year:
            </label>
            <select
              id="auditYear"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {filteredData.length > 0 && (
            <div className="ml-auto text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredData.length}</span> audit{filteredData.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Card>

      {/* Progress Chart */}
      <Card className="p-6">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Audits Found</h3>
            <p className="text-gray-600">No audit plan data matches the selected filters.</p>
          </div>
        ) : chartData ? (
          <div style={{ height: `${chartHeight}px` }}>
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        ) : null}
      </Card>

      {/* Stage Legend */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress Stages</h3>
        <div className="grid grid-cols-5 gap-4">
          {['Planned', 'Fieldwork', 'Pre Closing', 'Closing', 'Completed'].map((stage, idx) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{
                background: `linear-gradient(135deg, ${['#10b981', '#059669', '#047857', '#065f46', '#064e3b'][idx]}, ${['#059669', '#047857', '#065f46', '#064e3b', '#065f46'][idx]})`
              }}>
                {idx + 1}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">{stage}</div>
                <div className="text-xs text-gray-500">Stage {idx + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

