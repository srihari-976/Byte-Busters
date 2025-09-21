import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, Package, Clock } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

export default function Reports() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('production');
  const { showSuccess } = useNotification();

  const handleExportReport = (format: 'pdf' | 'excel') => {
    showSuccess(`${format.toUpperCase()} report generated successfully!`);
  };

  const reportTypes = [
    {
      id: 'production',
      name: 'Production Report',
      description: 'Manufacturing orders, work orders, and production efficiency',
      icon: BarChart3,
      color: 'bg-blue-500'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Stock levels, movements, and valuation',
      icon: Package,
      color: 'bg-emerald-500'
    },
    {
      id: 'quality',
      name: 'Quality Report',
      description: 'Inspection results, defects, and quality metrics',
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      id: 'efficiency',
      name: 'Efficiency Report',
      description: 'Work center utilization and performance metrics',
      icon: Clock,
      color: 'bg-orange-500'
    }
  ];

  // Mock data for demonstration
  const mockData = {
    production: {
      totalOrders: 156,
      completed: 142,
      inProgress: 14,
      avgCycleTime: '4.2 days',
      efficiency: '87.3%',
      throughput: '12.5 units/day'
    },
    inventory: {
      totalValue: '$125,430',
      lowStockItems: 3,
      turnoverRate: '2.4x',
      avgCost: '$45.20'
    },
    quality: {
      passRate: '94.2%',
      inspections: 89,
      defectRate: '5.8%',
      avgInspectionTime: '2.5h'
    }
  };

  const getReportData = () => {
    switch (reportType) {
      case 'production':
        return [
          { label: 'Total Orders', value: mockData.production.totalOrders, change: '+12%' },
          { label: 'Completed', value: mockData.production.completed, change: '+8%' },
          { label: 'In Progress', value: mockData.production.inProgress, change: '+3%' },
          { label: 'Avg Cycle Time', value: mockData.production.avgCycleTime, change: '-5%' },
          { label: 'Efficiency', value: mockData.production.efficiency, change: '+2%' },
          { label: 'Throughput', value: mockData.production.throughput, change: '+15%' }
        ];
      case 'inventory':
        return [
          { label: 'Total Value', value: mockData.inventory.totalValue, change: '+7%' },
          { label: 'Low Stock Items', value: mockData.inventory.lowStockItems, change: '-2' },
          { label: 'Turnover Rate', value: mockData.inventory.turnoverRate, change: '+0.3' },
          { label: 'Avg Cost', value: mockData.inventory.avgCost, change: '+$2.10' }
        ];
      case 'quality':
        return [
          { label: 'Pass Rate', value: mockData.quality.passRate, change: '+1.2%' },
          { label: 'Total Inspections', value: mockData.quality.inspections, change: '+15' },
          { label: 'Defect Rate', value: mockData.quality.defectRate, change: '-0.5%' },
          { label: 'Avg Inspection Time', value: mockData.quality.avgInspectionTime, change: '-0.3h' }
        ];
      default:
        return [];
    }
  };

  const selectedReportType = reportTypes.find(rt => rt.id === reportType);
  const reportData = getReportData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600">Generate comprehensive business reports and insights</p>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Filter size={20} />
            <span>Report Configuration</span>
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-control"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-control"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="current_year">Current Year</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="flex space-x-2 w-full">
                <button
                  onClick={() => handleExportReport('pdf')}
                  className="btn btn-primary flex-1"
                >
                  <Download size={16} />
                  Export PDF
                </button>
                <button
                  onClick={() => handleExportReport('excel')}
                  className="btn btn-secondary flex-1"
                >
                  <Download size={16} />
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`card cursor-pointer transition-all duration-300 hover:shadow-lg ${
              reportType === type.id ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <div className="card-body">
              <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center mb-4`}>
                <type.icon className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{type.name}</h3>
              <p className="text-sm text-slate-600">{type.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview */}
      {selectedReportType && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <selectedReportType.icon size={20} />
                <span>{selectedReportType.name} Preview</span>
              </h2>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Calendar size={16} />
                <span>
                  {dateRange.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reportData.map((item, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {item.value}
                      </div>
                      <div className="text-sm text-slate-600">{item.label}</div>
                    </div>
                    <div className={`text-sm font-medium ${
                      item.change.startsWith('+') ? 'text-emerald-600' : 
                      item.change.startsWith('-') && reportType === 'quality' && item.label.includes('Defect') ? 'text-emerald-600' :
                      item.change.startsWith('-') && item.label.includes('Time') ? 'text-emerald-600' :
                      item.change.startsWith('-') ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      {item.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample Chart Placeholder */}
            <div className="bg-slate-50 p-8 rounded-lg text-center">
              <BarChart3 className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Chart Visualization</h3>
              <p className="text-slate-600">
                Interactive charts and graphs would be displayed here for the selected report type and date range.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Reports */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Scheduled Reports</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">Weekly Production Summary</div>
                <div className="text-sm text-slate-600">Every Monday at 9:00 AM</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="badge badge-success">Active</span>
                <button className="btn btn-ghost btn-sm">Configure</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">Monthly Inventory Report</div>
                <div className="text-sm text-slate-600">First day of each month at 8:00 AM</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="badge badge-success">Active</span>
                <button className="btn btn-ghost btn-sm">Configure</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">Quality Metrics Dashboard</div>
                <div className="text-sm text-slate-600">Daily at 6:00 PM</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="badge badge-warning">Paused</span>
                <button className="btn btn-ghost btn-sm">Configure</button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <button className="btn btn-secondary">
              <Calendar size={16} />
              Schedule New Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}