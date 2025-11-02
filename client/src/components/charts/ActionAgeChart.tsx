import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import Card from '../ui/Card';
import Loading from '../ui/Loading';

interface ActionAgeChartProps {
  data: ChartData<'bar'>;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  height?: number;
  actions?: React.ReactNode;
}

const ActionAgeChart: React.FC<ActionAgeChartProps> = ({
  data,
  loading = false,
  title = 'Finding Actions Age Distribution',
  subtitle,
  height = 350,
  actions,
}) => {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Legend removed - colors are self-explanatory
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
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} actions`;
          },
          title: function(context) {
            const label = context[0]?.label || '';
            // Add explanation for negative/positive ranges
            if (label.startsWith('-')) {
              return `${label} days (Overdue)`;
            } else if (label === '720+') {
              return `${label} days`;
            } else {
              return `${label} days (Upcoming)`;
            }
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#374151',
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: 'Days Until/Past Due Date',
          font: {
            size: 12,
            weight: 'bold',
          },
          color: '#374151',
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
          color: '#6B7280',
          padding: 8,
        },
        title: {
          display: true,
          text: 'Number of Actions',
          font: {
            size: 12,
            weight: 'bold',
          },
          color: '#374151',
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
  };

  return (
    <Card variant="elevated">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>

        <div style={{ height: `${height}px` }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loading size="lg" />
            </div>
          ) : (
            <Bar data={data} options={options} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default ActionAgeChart;

