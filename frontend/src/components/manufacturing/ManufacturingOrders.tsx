import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface ManufacturingOrder {
  mo_id: string;
  mo_number: string;
  product_name: string;
  planned_quantity: number;
  produced_quantity: number;
  planned_start_date: string;
  planned_completion_date: string;
  mo_status: string;
  priority_level: number;
  created_by: string;
}

export default function ManufacturingOrders() {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ManufacturingOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { showSuccess, showError } = useNotification();

  // Mock data - replace with API calls
  useEffect(() => {
    const mockOrders: ManufacturingOrder[] = [
      {
        mo_id: '1',
        mo_number: 'MO-2024-001',
        product_name: 'Wooden Table',
        planned_quantity: 50,
        produced_quantity: 45,
        planned_start_date: '2024-01-15',
        planned_completion_date: '2024-01-25',
        mo_status: 'in_progress',
        priority_level: 5,
        created_by: 'John Doe'
      },
      {
        mo_id: '2',
        mo_number: 'MO-2024-002',
        product_name: 'Office Chair',
        planned_quantity: 25,
        produced_quantity: 25,
        planned_start_date: '2024-01-10',
        planned_completion_date: '2024-01-20',
        mo_status: 'completed',
        priority_level: 3,
        created_by: 'Jane Smith'
      },
      {
        mo_id: '3',
        mo_number: 'MO-2024-003',
        product_name: 'Desk Lamp',
        planned_quantity: 100,
        produced_quantity: 30,
        planned_start_date: '2024-01-20',
        planned_completion_date: '2024-01-28',
        mo_status: 'in_progress',
        priority_level: 4,
        created_by: 'Mike Johnson'
      },
      {
        mo_id: '4',
        mo_number: 'MO-2024-004',
        product_name: 'Bookshelf',
        planned_quantity: 15,
        produced_quantity: 2,
        planned_start_date: '2024-01-12',
        planned_completion_date: '2024-01-22',
        mo_status: 'delayed',
        priority_level: 5,
        created_by: 'Sarah Wilson'
      },
      {
        mo_id: '5',
        mo_number: 'MO-2024-005',
        product_name: 'Computer Desk',
        planned_quantity: 30,
        produced_quantity: 0,
        planned_start_date: '2024-01-25',
        planned_completion_date: '2024-02-05',
        mo_status: 'draft',
        priority_level: 2,
        created_by: 'David Brown'
      }
    ];
    
    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.mo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.mo_status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
        return 'badge-info';
      case 'delayed':
        return 'badge-danger';
      case 'draft':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 font-semibold';
    if (priority >= 3) return 'text-yellow-600 font-medium';
    return 'text-green-600';
  };

  const getProgress = (planned: number, produced: number) => {
    return planned > 0 ? Math.round((produced / planned) * 100) : 0;
  };

  const handleCreateOrder = () => {
    setShowCreateModal(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this manufacturing order?')) {
      setOrders(prev => prev.filter(order => order.mo_id !== orderId));
      showSuccess('Order deleted successfully');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manufacturing Orders</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and track your production orders</p>
        </div>
        <button
          onClick={handleCreateOrder}
          className="btn btn-primary"
        >
          <Plus size={20} />
          Create Order
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by order number or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control w-40"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
              
              <button className="btn btn-secondary">
                <Filter size={20} />
                More Filters
              </button>
              
              <button className="btn btn-secondary">
                <Download size={20} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-blue-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
            <div className="text-sm text-slate-600">Total Orders</div>
          </div>
        </div>
        <div className="card border-l-4 border-l-orange-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900">
              {orders.filter(o => o.mo_status === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-600">In Progress</div>
          </div>
        </div>
        <div className="card border-l-4 border-l-green-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900">
              {orders.filter(o => o.mo_status === 'completed').length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
        </div>
        <div className="card border-l-4 border-l-red-500">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900">
              {orders.filter(o => o.mo_status === 'delayed').length}
            </div>
            <div className="text-sm text-slate-600">Delayed</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Progress</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Completion Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.mo_id} className="hover:bg-slate-50">
                    <td>
                      <div className="font-semibold text-slate-900">
                        {order.mo_number}
                      </div>
                      <div className="text-xs text-slate-500">
                        by {order.created_by}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">
                        {order.product_name}
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-900">
                        {order.produced_quantity} / {order.planned_quantity}
                      </div>
                    </td>
                    <td>
                      <div className="w-full max-w-xs">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                order.mo_status === 'completed'
                                  ? 'bg-emerald-500'
                                  : order.mo_status === 'delayed'
                                  ? 'bg-red-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${getProgress(order.planned_quantity, order.produced_quantity)}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-slate-600 min-w-[3rem]">
                            {getProgress(order.planned_quantity, order.produced_quantity)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`text-sm ${getPriorityColor(order.priority_level)}`}>
                        {order.priority_level}/5
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.mo_status)}`}>
                        {order.mo_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="text-slate-600">
                        {new Date(order.planned_completion_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-1">
                        <button
                          className="btn btn-ghost btn-sm p-1"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm p-1"
                          title="Edit Order"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.mo_id)}
                          className="btn btn-ghost btn-sm p-1 text-red-600 hover:text-red-800"
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 20l8-8m0 8l-8-8m-4 16v8a2 2 0 002 2h16a2 2 0 002-2v-8M6 10h36" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No orders match your current filters.' 
                  : 'Get started by creating your first manufacturing order.'
                }
              </p>
              {(!searchQuery && statusFilter === 'all') && (
                <button
                  onClick={handleCreateOrder}
                  className="btn btn-primary"
                >
                  <Plus size={20} />
                  Create Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}