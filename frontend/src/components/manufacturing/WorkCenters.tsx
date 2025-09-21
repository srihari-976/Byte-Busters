import React, { useState, useEffect } from 'react';
import { Settings, Activity, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface WorkCenter {
  work_center_id: string;
  work_center_code: string;
  work_center_name: string;
  capacity_per_day: number;
  cost_per_hour: number;
  efficiency_factor: number;
  is_active: boolean;
  current_utilization: number;
  active_orders: number;
}

export default function WorkCenters() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockWorkCenters: WorkCenter[] = [
      {
        work_center_id: '1',
        work_center_code: 'ASM001',
        work_center_name: 'Assembly Line 1',
        capacity_per_day: 8,
        cost_per_hour: 45.00,
        efficiency_factor: 0.92,
        is_active: true,
        current_utilization: 78,
        active_orders: 3
      },
      {
        work_center_id: '2',
        work_center_code: 'ASM002',
        work_center_name: 'Assembly Line 2',
        capacity_per_day: 8,
        cost_per_hour: 45.00,
        efficiency_factor: 0.88,
        is_active: true,
        current_utilization: 65,
        active_orders: 2
      },
      {
        work_center_id: '3',
        work_center_code: 'PAINT001',
        work_center_name: 'Paint Booth 1',
        capacity_per_day: 6,
        cost_per_hour: 35.00,
        efficiency_factor: 0.95,
        is_active: true,
        current_utilization: 82,
        active_orders: 4
      },
      {
        work_center_id: '4',
        work_center_code: 'PAINT002',
        work_center_name: 'Paint Booth 2',
        capacity_per_day: 6,
        cost_per_hour: 35.00,
        efficiency_factor: 0.90,
        is_active: false,
        current_utilization: 0,
        active_orders: 0
      },
      {
        work_center_id: '5',
        work_center_code: 'PKG001',
        work_center_name: 'Packaging Area',
        capacity_per_day: 10,
        cost_per_hour: 25.00,
        efficiency_factor: 0.98,
        is_active: true,
        current_utilization: 45,
        active_orders: 2
      },
      {
        work_center_id: '6',
        work_center_code: 'QC001',
        work_center_name: 'Quality Control Station',
        capacity_per_day: 12,
        cost_per_hour: 55.00,
        efficiency_factor: 0.96,
        is_active: true,
        current_utilization: 68,
        active_orders: 5
      }
    ];

    setTimeout(() => {
      setWorkCenters(mockWorkCenters);
      setLoading(false);
    }, 1000);
  }, []);

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization >= 80) return 'bg-red-500';
    if (utilization >= 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.95) return 'text-emerald-600';
    if (efficiency >= 0.90) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading work centers...</span>
      </div>
    );
  }

  const activeWorkCenters = workCenters.filter(wc => wc.is_active);
  const avgUtilization = activeWorkCenters.length > 0 
    ? Math.round(activeWorkCenters.reduce((sum, wc) => sum + wc.current_utilization, 0) / activeWorkCenters.length)
    : 0;
  const avgEfficiency = activeWorkCenters.length > 0
    ? activeWorkCenters.reduce((sum, wc) => sum + wc.efficiency_factor, 0) / activeWorkCenters.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Work Centers</h1>
          <p className="text-slate-600">Monitor and manage production work centers</p>
        </div>
        <button className="btn btn-primary">
          <Settings size={20} />
          Configure
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{workCenters.length}</div>
                <div className="text-sm text-slate-600">Total Centers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Activity className="text-emerald-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{activeWorkCenters.length}</div>
                <div className="text-sm text-slate-600">Active Centers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${getUtilizationColor(avgUtilization)}`}>
                  {avgUtilization}%
                </div>
                <div className="text-sm text-slate-600">Avg Utilization</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${getEfficiencyColor(avgEfficiency)}`}>
                  {Math.round(avgEfficiency * 100)}%
                </div>
                <div className="text-sm text-slate-600">Avg Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Centers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {workCenters.map((workCenter) => (
          <div key={workCenter.work_center_id} className="card hover:shadow-lg transition-all duration-300">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {workCenter.work_center_name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {workCenter.work_center_code}
                  </p>
                </div>
                <span className={`badge ${workCenter.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {workCenter.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Utilization Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Utilization</span>
                  <span className={`font-semibold ${getUtilizationColor(workCenter.current_utilization)}`}>
                    {workCenter.current_utilization}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getUtilizationBgColor(workCenter.current_utilization)}`}
                    style={{ width: `${workCenter.current_utilization}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-600">Capacity/Day</div>
                  <div className="font-semibold text-slate-900">
                    {workCenter.capacity_per_day}h
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Cost/Hour</div>
                  <div className="font-semibold text-slate-900">
                    ${workCenter.cost_per_hour}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Efficiency</div>
                  <div className={`font-semibold ${getEfficiencyColor(workCenter.efficiency_factor)}`}>
                    {Math.round(workCenter.efficiency_factor * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Active Orders</div>
                  <div className="font-semibold text-slate-900">
                    {workCenter.active_orders}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-2">
                <button className="btn btn-secondary btn-sm flex-1">
                  View Details
                </button>
                <button className="btn btn-ghost btn-sm">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workCenters.length === 0 && (
        <div className="text-center py-12">
          <Settings className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No work centers configured</h3>
          <p className="text-slate-600 mb-4">Set up your first work center to start tracking production capacity.</p>
          <button className="btn btn-primary">
            <Settings size={20} />
            Add Work Center
          </button>
        </div>
      )}
    </div>
  );
}