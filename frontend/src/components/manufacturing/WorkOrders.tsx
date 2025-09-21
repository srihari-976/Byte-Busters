import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Pause, CheckCircle, Clock, User, AlertCircle } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface WorkOrder {
  wo_id: string;
  wo_number: string;
  mo_number: string;
  operation_name: string;
  work_center_name: string;
  assigned_to: string;
  wo_status: 'pending' | 'in_progress' | 'paused' | 'completed';
  actual_start_time: string | null;
  actual_end_time: string | null;
  setup_time_minutes: number;
  run_time_minutes: number;
  sequence_number: number;
}

export default function WorkOrders() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockWorkOrders: WorkOrder[] = [
      {
        wo_id: '1',
        wo_number: 'WO-2024-001',
        mo_number: 'MO-2024-001',
        operation_name: 'Assembly',
        work_center_name: 'Assembly Line 1',
        assigned_to: 'John Doe',
        wo_status: 'in_progress',
        actual_start_time: '2024-01-20T09:00:00Z',
        actual_end_time: null,
        setup_time_minutes: 30,
        run_time_minutes: 240,
        sequence_number: 1
      },
      {
        wo_id: '2',
        wo_number: 'WO-2024-002',
        mo_number: 'MO-2024-001',
        operation_name: 'Painting',
        work_center_name: 'Paint Booth 1',
        assigned_to: 'Jane Smith',
        wo_status: 'pending',
        actual_start_time: null,
        actual_end_time: null,
        setup_time_minutes: 15,
        run_time_minutes: 120,
        sequence_number: 2
      },
      {
        wo_id: '3',
        wo_number: 'WO-2024-003',
        mo_number: 'MO-2024-001',
        operation_name: 'Packing',
        work_center_name: 'Packaging Area',
        assigned_to: 'Mike Johnson',
        wo_status: 'pending',
        actual_start_time: null,
        actual_end_time: null,
        setup_time_minutes: 10,
        run_time_minutes: 60,
        sequence_number: 3
      },
      {
        wo_id: '4',
        wo_number: 'WO-2024-004',
        mo_number: 'MO-2024-002',
        operation_name: 'Assembly',
        work_center_name: 'Assembly Line 2',
        assigned_to: 'Sarah Wilson',
        wo_status: 'completed',
        actual_start_time: '2024-01-18T08:00:00Z',
        actual_end_time: '2024-01-18T16:30:00Z',
        setup_time_minutes: 20,
        run_time_minutes: 480,
        sequence_number: 1
      },
      {
        wo_id: '5',
        wo_number: 'WO-2024-005',
        mo_number: 'MO-2024-003',
        operation_name: 'Quality Check',
        work_center_name: 'QC Station 1',
        assigned_to: 'David Brown',
        wo_status: 'paused',
        actual_start_time: '2024-01-20T14:00:00Z',
        actual_end_time: null,
        setup_time_minutes: 5,
        run_time_minutes: 90,
        sequence_number: 1
      }
    ];

    setTimeout(() => {
      setWorkOrders(mockWorkOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'in_progress':
        return <Play className="text-blue-500" size={20} />;
      case 'paused':
        return <Pause className="text-yellow-500" size={20} />;
      case 'pending':
        return <Clock className="text-slate-500" size={20} />;
      default:
        return <AlertCircle className="text-red-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
        return 'badge-info';
      case 'paused':
        return 'badge-warning';
      case 'pending':
        return 'badge-primary';
      default:
        return 'badge-danger';
    }
  };

  const handleStartWork = (woId: string) => {
    setWorkOrders(prev => prev.map(wo =>
      wo.wo_id === woId
        ? { ...wo, wo_status: 'in_progress', actual_start_time: new Date().toISOString() }
        : wo
    ));
    showSuccess('Work order started successfully');
  };

  const handlePauseWork = (woId: string) => {
    setWorkOrders(prev => prev.map(wo =>
      wo.wo_id === woId
        ? { ...wo, wo_status: 'paused' }
        : wo
    ));
    showSuccess('Work order paused');
  };

  const handleCompleteWork = (woId: string) => {
    setWorkOrders(prev => prev.map(wo =>
      wo.wo_id === woId
        ? { ...wo, wo_status: 'completed', actual_end_time: new Date().toISOString() }
        : wo
    ));
    showSuccess('Work order completed successfully');
  };

  const canPerformAction = (workOrder: WorkOrder) => {
    // Operators can only act on orders assigned to them
    if (user?.role_name?.toLowerCase() === 'operator') {
      return workOrder.assigned_to === user.username;
    }
    // Managers and admins can act on any order
    return ['manager', 'admin'].includes(user?.role_name?.toLowerCase() || '');
  };

  const getElapsedTime = (startTime: string | null) => {
    if (!startTime) return '—';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60)); // minutes
    
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  // Filter work orders based on user role
  const filteredWorkOrders = user?.role_name?.toLowerCase() === 'operator'
    ? workOrders.filter(wo => wo.assigned_to === user.username)
    : workOrders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading work orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Work Orders</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {user?.role_name?.toLowerCase() === 'operator' 
              ? 'Your assigned work orders' 
              : 'Manage and track work order operations'
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-slate-500 dark:border-l-slate-400">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {filteredWorkOrders.filter(wo => wo.wo_status === 'pending').length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Pending</div>
          </div>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {filteredWorkOrders.filter(wo => wo.wo_status === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
          </div>
        </div>
        <div className="card border-l-4 border-l-yellow-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {filteredWorkOrders.filter(wo => wo.wo_status === 'paused').length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Paused</div>
          </div>
        </div>
        <div className="card border-l-4 border-l-green-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {filteredWorkOrders.filter(wo => wo.wo_status === 'completed').length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
          </div>
        </div>
      </div>

      {/* Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWorkOrders.map((workOrder) => (
          <div key={workOrder.wo_id} className="card hover:shadow-lg transition-all duration-300">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {workOrder.wo_number}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {workOrder.mo_number}
                  </p>
                </div>
                <span className={`badge ${getStatusBadge(workOrder.wo_status)} flex items-center space-x-1`}>
                  {getStatusIcon(workOrder.wo_status)}
                  <span className="capitalize">{workOrder.wo_status.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Operation:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{workOrder.operation_name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Work Center:</span>
                  <span className="text-slate-900 dark:text-slate-100">{workOrder.work_center_name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Assigned to:</span>
                  <div className="flex items-center space-x-2">
                    <User size={14} className="text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-slate-100">{workOrder.assigned_to}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Sequence:</span>
                  <span className="text-slate-900 dark:text-slate-100">#{workOrder.sequence_number}</span>
                </div>

                {workOrder.wo_status === 'in_progress' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Elapsed:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {getElapsedTime(workOrder.actual_start_time)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Estimated Time:</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {Math.floor((workOrder.setup_time_minutes + workOrder.run_time_minutes) / 60)}h{' '}
                    {(workOrder.setup_time_minutes + workOrder.run_time_minutes) % 60}m
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {canPerformAction(workOrder) && (
                <div className="space-y-2">
                  {workOrder.wo_status === 'pending' && (
                    <button
                      onClick={() => handleStartWork(workOrder.wo_id)}
                      className="btn btn-success w-full"
                    >
                      <Play size={16} />
                      Start Work
                    </button>
                  )}
                  
                  {workOrder.wo_status === 'in_progress' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handlePauseWork(workOrder.wo_id)}
                        className="btn btn-warning"
                      >
                        <Pause size={16} />
                        Pause
                      </button>
                      <button
                        onClick={() => handleCompleteWork(workOrder.wo_id)}
                        className="btn btn-success"
                      >
                        <CheckCircle size={16} />
                        Complete
                      </button>
                    </div>
                  )}
                  
                  {workOrder.wo_status === 'paused' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStartWork(workOrder.wo_id)}
                        className="btn btn-primary"
                      >
                        <Play size={16} />
                        Resume
                      </button>
                      <button
                        onClick={() => handleCompleteWork(workOrder.wo_id)}
                        className="btn btn-success"
                      >
                        <CheckCircle size={16} />
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredWorkOrders.length === 0 && (
        <div className="text-center py-12">
          <Clock className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No work orders found</h3>
          <p className="text-slate-600">
            {user?.role_name?.toLowerCase() === 'operator' 
              ? 'No work orders are currently assigned to you.' 
              : 'No work orders are available at the moment.'
            }
          </p>
        </div>
      )}
    </div>
  );
}