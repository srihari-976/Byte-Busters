import React from 'react';
import { Clock, CheckCircle, AlertTriangle, User } from 'lucide-react';

interface Order {
  mo_id: string;
  product_name: string;
  planned_quantity: number;
  progress: number;
  status: string;
  planned_completion_date: string;
  assignee: string;
}

interface OrdersListProps {
  orders: Order[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-500" size={16} />;
      case 'in_progress':
        return <Clock className="text-blue-500" size={16} />;
      case 'delayed':
        return <AlertTriangle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-slate-400" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
        return 'badge-info';
      case 'delayed':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'delayed') return 'bg-red-500';
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Assignee</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={order.mo_id} className="hover:bg-slate-50 transition-colors">
              <td>
                <div className="font-medium text-slate-900">
                  {order.mo_id}
                </div>
              </td>
              <td>
                <div className="text-slate-900">
                  {order.product_name}
                </div>
              </td>
              <td>
                <div className="text-slate-600">
                  {order.planned_quantity} units
                </div>
              </td>
              <td>
                <div className="w-full max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(order.progress, order.status)}`}
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-600 min-w-[3rem]">
                      {order.progress}%
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge ${getStatusBadge(order.status)} flex items-center space-x-1 w-fit`}>
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status.replace('_', ' ')}</span>
                </span>
              </td>
              <td>
                <div className="text-slate-600">
                  {new Date(order.planned_completion_date).toLocaleDateString()}
                </div>
              </td>
              <td>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                    <User size={12} className="text-slate-600" />
                  </div>
                  <span className="text-slate-700 text-sm">
                    {order.assignee}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {orders.length === 0 && (
        <div className="text-center py-12">
          <Clock className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-600">No manufacturing orders to display at the moment.</p>
        </div>
      )}
    </div>
  );
}