import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Factory, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Package, 
  Users,
  Activity,
  Settings
} from 'lucide-react';
import KPICard from './KPICard';
import ProductionChart from './ProductionChart';
import OrdersList from './OrdersList';
import AlertsPanel from './AlertsPanel';

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({
    totalOrders: 156,
    inProgress: 23,
    completed: 133,
    delayed: 5,
    throughput: 12.5,
    efficiency: 87.3,
    lowStock: 3,
    workCenters: 8
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      mo_id: 'MO-001',
      product_name: 'Wooden Table',
      planned_quantity: 50,
      progress: 75,
      status: 'in_progress',
      planned_completion_date: '2024-01-25',
      assignee: 'John Smith'
    },
    {
      mo_id: 'MO-002',
      product_name: 'Office Chair',
      planned_quantity: 25,
      progress: 100,
      status: 'completed',
      planned_completion_date: '2024-01-24',
      assignee: 'Sarah Johnson'
    },
    {
      mo_id: 'MO-003',
      product_name: 'Desk Lamp',
      planned_quantity: 100,
      progress: 30,
      status: 'in_progress',
      planned_completion_date: '2024-01-26',
      assignee: 'Mike Wilson'
    },
    {
      mo_id: 'MO-004',
      product_name: 'Bookshelf',
      planned_quantity: 15,
      progress: 10,
      status: 'delayed',
      planned_completion_date: '2024-01-23',
      assignee: 'Emma Davis'
    }
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Raw material RM-001 is below reorder level',
      timestamp: '10 minutes ago'
    },
    {
      id: 2,
      type: 'error',
      title: 'Production Delay',
      message: 'MO-004 is behind schedule by 2 days',
      timestamp: '25 minutes ago'
    },
    {
      id: 3,
      type: 'info',
      title: 'Quality Check Required',
      message: 'Batch B-2024-001 ready for inspection',
      timestamp: '1 hour ago'
    }
  ]);

  // Role-specific KPIs
  const getKPIsForRole = () => {
    const baseKPIs = [
      {
        title: 'Total Orders',
        value: kpis.totalOrders.toString(),
        change: '+12%',
        trend: 'up',
        icon: Factory,
        color: 'blue'
      }
    ];

    switch (user?.role_name?.toLowerCase()) {
      case 'admin':
        return [
          ...baseKPIs,
          {
            title: 'In Progress',
            value: kpis.inProgress.toString(),
            change: '+5%',
            trend: 'up',
            icon: Clock,
            color: 'orange'
          },
          {
            title: 'Efficiency Rate',
            value: `${kpis.efficiency}%`,
            change: '+2.1%',
            trend: 'up',
            icon: TrendingUp,
            color: 'green'
          },
          {
            title: 'Work Centers',
            value: kpis.workCenters.toString(),
            change: 'Active',
            trend: 'neutral',
            icon: Settings,
            color: 'purple'
          }
        ];
      
      case 'manager':
        return [
          ...baseKPIs,
          {
            title: 'In Progress',
            value: kpis.inProgress.toString(),
            change: '+5%',
            trend: 'up',
            icon: Clock,
            color: 'orange'
          },
          {
            title: 'Throughput',
            value: `${kpis.throughput}/hr`,
            change: '+8%',
            trend: 'up',
            icon: Activity,
            color: 'green'
          },
          {
            title: 'Delayed Orders',
            value: kpis.delayed.toString(),
            change: '-2',
            trend: 'down',
            icon: AlertTriangle,
            color: 'red'
          }
        ];
      
      case 'operator':
        return [
          {
            title: 'My Tasks',
            value: '8',
            change: '+3 today',
            trend: 'up',
            icon: Users,
            color: 'blue'
          },
          {
            title: 'Completed',
            value: '15',
            change: 'This week',
            trend: 'neutral',
            icon: Factory,
            color: 'green'
          },
          {
            title: 'Active Orders',
            value: '3',
            change: 'In progress',
            trend: 'neutral',
            icon: Clock,
            color: 'orange'
          }
        ];
      
      case 'inventory':
        return [
          {
            title: 'Stock Items',
            value: '1,234',
            change: '+45 today',
            trend: 'up',
            icon: Package,
            color: 'blue'
          },
          {
            title: 'Low Stock',
            value: kpis.lowStock.toString(),
            change: 'Alerts',
            trend: 'neutral',
            icon: AlertTriangle,
            color: 'red'
          },
          {
            title: 'Total Orders',
            value: kpis.totalOrders.toString(),
            change: '+12%',
            trend: 'up',
            icon: Factory,
            color: 'green'
          }
        ];
      
      default:
        return baseKPIs;
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-slate-300 dark:text-slate-200">
              Here's what's happening in your {user?.role_name?.toLowerCase()} dashboard today.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-16 h-16 bg-emerald-500 bg-opacity-20 rounded-xl flex items-center justify-center">
              <Factory className="text-emerald-400" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getKPIsForRole().map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend as 'up' | 'down' | 'neutral'}
            icon={kpi.icon}
            color={kpi.color as 'blue' | 'green' | 'orange' | 'red' | 'purple'}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Production Chart */}
        <div className="xl:col-span-2">
          <ProductionChart />
        </div>

        {/* Alerts Panel */}
        <div>
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <p className="text-sm text-slate-600">Latest manufacturing orders activity</p>
        </div>
        <div className="card-body p-0">
          <OrdersList orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}