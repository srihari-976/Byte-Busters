import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';

interface StockTransaction {
  transaction_id: string;
  product_name: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUST' | 'RESERVED' | 'RELEASED';
  quantity: number;
  reference_type: string;
  reference_number: string;
  balance: number;
  created_at: string;
  created_by: string;
}

interface StockBalance {
  product_id: string;
  product_name: string;
  available_quantity: number;
  reserved_quantity: number;
  unit: string;
  reorder_level: number;
}

export default function StockLedger() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    const mockTransactions: StockTransaction[] = [
      {
        transaction_id: '1',
        product_name: 'Wooden Leg',
        transaction_type: 'IN',
        quantity: 100,
        reference_type: 'Purchase',
        reference_number: 'PO-001',
        balance: 100,
        created_at: '2024-01-20T08:00:00Z',
        created_by: 'John Doe'
      },
      {
        transaction_id: '2',
        product_name: 'Table Top',
        transaction_type: 'IN',
        quantity: 25,
        reference_type: 'Purchase',
        reference_number: 'PO-001',
        balance: 25,
        created_at: '2024-01-20T08:15:00Z',
        created_by: 'John Doe'
      },
      {
        transaction_id: '3',
        product_name: 'Wooden Leg',
        transaction_type: 'RESERVED',
        quantity: 20,
        reference_type: 'WO',
        reference_number: 'WO-001',
        balance: 80,
        created_at: '2024-01-20T09:30:00Z',
        created_by: 'System'
      },
      {
        transaction_id: '4',
        product_name: 'Table Top',
        transaction_type: 'RESERVED',
        quantity: 5,
        reference_type: 'WO',
        reference_number: 'WO-001',
        balance: 20,
        created_at: '2024-01-20T09:30:00Z',
        created_by: 'System'
      },
      {
        transaction_id: '5',
        product_name: 'Wooden Leg',
        transaction_type: 'OUT',
        quantity: 20,
        reference_type: 'MO',
        reference_number: 'MO-001',
        balance: 60,
        created_at: '2024-01-20T14:00:00Z',
        created_by: 'Jane Smith'
      },
      {
        transaction_id: '6',
        product_name: 'Wooden Table',
        transaction_type: 'IN',
        quantity: 5,
        reference_type: 'Production',
        reference_number: 'MO-001',
        balance: 5,
        created_at: '2024-01-20T16:00:00Z',
        created_by: 'System'
      }
    ];

    const mockBalances: StockBalance[] = [
      {
        product_id: '1',
        product_name: 'Wooden Leg',
        available_quantity: 60,
        reserved_quantity: 0,
        unit: 'pcs',
        reorder_level: 20
      },
      {
        product_id: '2',
        product_name: 'Table Top',
        available_quantity: 20,
        reserved_quantity: 0,
        unit: 'pcs',
        reorder_level: 10
      },
      {
        product_id: '3',
        product_name: 'Wood Screws',
        available_quantity: 500,
        reserved_quantity: 0,
        unit: 'pcs',
        reorder_level: 100
      },
      {
        product_id: '4',
        product_name: 'Wooden Table',
        available_quantity: 5,
        reserved_quantity: 0,
        unit: 'pcs',
        reorder_level: 2
      },
      {
        product_id: '5',
        product_name: 'Office Chair',
        available_quantity: 3,
        reserved_quantity: 0,
        unit: 'pcs',
        reorder_level: 5
      }
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      setStockBalances(mockBalances);
      setLoading(false);
    }, 1000);
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="text-emerald-500" size={16} />;
      case 'OUT':
        return <TrendingDown className="text-red-500" size={16} />;
      case 'RESERVED':
        return <Package className="text-orange-500" size={16} />;
      case 'RELEASED':
        return <Package className="text-blue-500" size={16} />;
      case 'ADJUST':
        return <Package className="text-purple-500" size={16} />;
      default:
        return <Package className="text-slate-500" size={16} />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return 'badge-success';
      case 'OUT':
        return 'badge-danger';
      case 'RESERVED':
        return 'badge-warning';
      case 'RELEASED':
        return 'badge-info';
      case 'ADJUST':
        return 'badge-primary';
      default:
        return 'badge-primary';
    }
  };

  const getStockStatus = (balance: StockBalance) => {
    if (balance.available_quantity <= balance.reorder_level) {
      return { status: 'Low Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    if (balance.available_quantity <= balance.reorder_level * 1.5) {
      return { status: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
    return { status: 'Normal', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
  };

  const filteredTransactions = selectedProduct === 'all' 
    ? transactions 
    : transactions.filter(t => t.product_name === selectedProduct);

  const lowStockItems = stockBalances.filter(b => b.available_quantity <= b.reorder_level);
  const totalValue = stockBalances.reduce((sum, b) => sum + (b.available_quantity * 25), 0); // Assuming avg cost of $25

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading stock data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Ledger</h1>
          <p className="text-slate-600">Track inventory movements and current stock levels</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn btn-secondary">
            <Filter size={20} />
            Filter
          </button>
          <button className="btn btn-secondary">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stockBalances.length}</div>
                <div className="text-sm text-slate-600">Total Products</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  ${totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">Total Value</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Package className="text-red-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
                <div className="text-sm text-slate-600">Low Stock Items</div>
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
                <div className="text-2xl font-bold text-slate-900">{transactions.length}</div>
                <div className="text-sm text-slate-600">Transactions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Current Stock Balances */}
        <div className="xl:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Current Stock</h2>
            </div>
            <div className="card-body p-0">
              <div className="space-y-0 max-h-96 overflow-y-auto">
                {stockBalances.map((balance) => {
                  const status = getStockStatus(balance);
                  return (
                    <div
                      key={balance.product_id}
                      className="p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{balance.product_name}</div>
                          <div className="text-sm text-slate-600">
                            Available: {balance.available_quantity} {balance.unit}
                          </div>
                          {balance.reserved_quantity > 0 && (
                            <div className="text-sm text-orange-600">
                              Reserved: {balance.reserved_quantity} {balance.unit}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="xl:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Transaction History</h2>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="form-control w-48"
                >
                  <option value="all">All Products</option>
                  {Array.from(new Set(transactions.map(t => t.product_name))).map(product => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Reference</th>
                      <th>Balance</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.transaction_id} className="hover:bg-slate-50">
                        <td>
                          <div className="text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(transaction.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-slate-900">
                            {transaction.product_name}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getTransactionBadge(transaction.transaction_type)} flex items-center space-x-1 w-fit`}>
                            {getTransactionIcon(transaction.transaction_type)}
                            <span>{transaction.transaction_type}</span>
                          </span>
                        </td>
                        <td>
                          <div className={`font-medium ${
                            transaction.transaction_type === 'IN' ? 'text-emerald-600' :
                            transaction.transaction_type === 'OUT' ? 'text-red-600' :
                            'text-slate-900'
                          }`}>
                            {transaction.transaction_type === 'OUT' ? '-' : '+'}{transaction.quantity}
                          </div>
                        </td>
                        <td>
                          <div className="text-slate-900">
                            {transaction.reference_number}
                          </div>
                          <div className="text-xs text-slate-500">
                            {transaction.reference_type}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-slate-900">
                            {transaction.balance}
                          </div>
                        </td>
                        <td>
                          <div className="text-slate-600 text-sm">
                            {transaction.created_by}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto text-slate-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
                  <p className="text-slate-600">
                    {selectedProduct === 'all' 
                      ? 'No stock transactions recorded yet.' 
                      : `No transactions found for ${selectedProduct}.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}