import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Trash2, Eye } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface Product {
  product_id: string;
  product_code: string;
  product_name: string;
  category_name: string;
  product_type: string;
  uom: string;
  standard_cost: number;
  reorder_level: number;
  max_stock_level: number;
  current_stock: number;
  is_active: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    // Mock data
    const mockProducts: Product[] = [
      {
        product_id: '1',
        product_code: 'FG001',
        product_name: 'Wooden Table',
        category_name: 'Furniture',
        product_type: 'finished_good',
        uom: 'pcs',
        standard_cost: 150.00,
        reorder_level: 5,
        max_stock_level: 50,
        current_stock: 25,
        is_active: true
      },
      {
        product_id: '2',
        product_code: 'FG002',
        product_name: 'Office Chair',
        category_name: 'Furniture',
        product_type: 'finished_good',
        uom: 'pcs',
        standard_cost: 200.00,
        reorder_level: 3,
        max_stock_level: 30,
        current_stock: 12,
        is_active: true
      },
      {
        product_id: '3',
        product_code: 'RM001',
        product_name: 'Wooden Leg',
        category_name: 'Raw Materials',
        product_type: 'raw_material',
        uom: 'pcs',
        standard_cost: 15.00,
        reorder_level: 20,
        max_stock_level: 200,
        current_stock: 85,
        is_active: true
      },
      {
        product_id: '4',
        product_code: 'RM002',
        product_name: 'Table Top',
        category_name: 'Raw Materials',
        product_type: 'raw_material',
        uom: 'pcs',
        standard_cost: 45.00,
        reorder_level: 10,
        max_stock_level: 100,
        current_stock: 32,
        is_active: true
      },
      {
        product_id: '5',
        product_code: 'RM003',
        product_name: 'Wood Screws',
        category_name: 'Hardware',
        product_type: 'raw_material',
        uom: 'pcs',
        standard_cost: 0.25,
        reorder_level: 100,
        max_stock_level: 1000,
        current_stock: 500,
        is_active: true
      },
      {
        product_id: '6',
        product_code: 'FG003',
        product_name: 'Desk Lamp',
        category_name: 'Electronics',
        product_type: 'finished_good',
        uom: 'pcs',
        standard_cost: 75.00,
        reorder_level: 8,
        max_stock_level: 60,
        current_stock: 15,
        is_active: true
      }
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category_name === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(product => product.product_type === typeFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, typeFilter]);

  const getStockStatus = (product: Product) => {
    if (product.current_stock <= product.reorder_level) {
      return { status: 'Low Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    if (product.current_stock <= product.reorder_level * 1.5) {
      return { status: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
    if (product.current_stock >= product.max_stock_level * 0.9) {
      return { status: 'Overstock', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    }
    return { status: 'Normal', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'finished_good':
        return 'badge-success';
      case 'raw_material':
        return 'badge-info';
      case 'semi_finished':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(product => product.product_id !== productId));
      showSuccess('Product deleted successfully');
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category_name)));
  const types = Array.from(new Set(products.map(p => p.product_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600">Manage your product catalog and inventory items</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-control w-40"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-control w-40"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-slate-900">{products.length}</div>
            <div className="text-sm text-slate-600">Total Products</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-emerald-600">
              {products.filter(p => p.product_type === 'finished_good').length}
            </div>
            <div className="text-sm text-slate-600">Finished Goods</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-blue-600">
              {products.filter(p => p.product_type === 'raw_material').length}
            </div>
            <div className="text-sm text-slate-600">Raw Materials</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => p.current_stock <= p.reorder_level).length}
            </div>
            <div className="text-sm text-slate-600">Low Stock</div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                  <th>Unit Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.product_id} className="hover:bg-slate-50">
                      <td>
                        <div className="font-semibold text-slate-900">
                          {product.product_code}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-900">
                          {product.product_name}
                        </div>
                      </td>
                      <td>
                        <div className="text-slate-600">
                          {product.category_name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeColor(product.product_type)}`}>
                          {product.product_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td>
                        <div className="text-slate-900">
                          {product.current_stock} {product.uom}
                        </div>
                        <div className="text-xs text-slate-500">
                          Min: {product.reorder_level} | Max: {product.max_stock_level}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-slate-900">
                          ${product.standard_cost.toFixed(2)}
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
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.product_id)}
                            className="btn btn-ghost btn-sm p-1 text-red-600 hover:text-red-800"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'No products match your current filters.' 
                  : 'Get started by adding your first product.'
                }
              </p>
              {(!searchQuery && categoryFilter === 'all' && typeFilter === 'all') && (
                <button className="btn btn-primary">
                  <Plus size={20} />
                  Add Product
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}