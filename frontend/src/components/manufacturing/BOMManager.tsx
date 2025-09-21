import React, { useState, useEffect } from 'react';
import { Plus, FileText, Package, Calculator } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface BOMComponent {
  component_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
}

interface BOM {
  bom_id: string;
  product_name: string;
  version: string;
  components: BOMComponent[];
  total_cost: number;
  is_active: boolean;
}

export default function BOMManager() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useNotification();

  // Mock data
  useEffect(() => {
    const mockBOMs: BOM[] = [
      {
        bom_id: '1',
        product_name: 'Wooden Table',
        version: '1.0',
        is_active: true,
        components: [
          {
            component_id: '1',
            product_name: 'Wooden Leg',
            quantity: 4,
            unit: 'pcs',
            cost_per_unit: 15.00,
            total_cost: 60.00
          },
          {
            component_id: '2',
            product_name: 'Table Top',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 45.00,
            total_cost: 45.00
          },
          {
            component_id: '3',
            product_name: 'Wood Screws',
            quantity: 16,
            unit: 'pcs',
            cost_per_unit: 0.25,
            total_cost: 4.00
          },
          {
            component_id: '4',
            product_name: 'Wood Glue',
            quantity: 1,
            unit: 'bottle',
            cost_per_unit: 8.00,
            total_cost: 8.00
          }
        ],
        total_cost: 117.00
      },
      {
        bom_id: '2',
        product_name: 'Office Chair',
        version: '2.1',
        is_active: true,
        components: [
          {
            component_id: '5',
            product_name: 'Chair Base',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 25.00,
            total_cost: 25.00
          },
          {
            component_id: '6',
            product_name: 'Seat Cushion',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 35.00,
            total_cost: 35.00
          },
          {
            component_id: '7',
            product_name: 'Back Support',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 40.00,
            total_cost: 40.00
          },
          {
            component_id: '8',
            product_name: 'Wheels',
            quantity: 5,
            unit: 'pcs',
            cost_per_unit: 3.00,
            total_cost: 15.00
          },
          {
            component_id: '9',
            product_name: 'Assembly Hardware',
            quantity: 1,
            unit: 'set',
            cost_per_unit: 12.00,
            total_cost: 12.00
          }
        ],
        total_cost: 127.00
      },
      {
        bom_id: '3',
        product_name: 'Desk Lamp',
        version: '1.0',
        is_active: true,
        components: [
          {
            component_id: '10',
            product_name: 'Lamp Base',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 18.00,
            total_cost: 18.00
          },
          {
            component_id: '11',
            product_name: 'Adjustable Arm',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 22.00,
            total_cost: 22.00
          },
          {
            component_id: '12',
            product_name: 'LED Bulb',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 15.00,
            total_cost: 15.00
          },
          {
            component_id: '13',
            product_name: 'Power Cord',
            quantity: 1,
            unit: 'pcs',
            cost_per_unit: 8.00,
            total_cost: 8.00
          }
        ],
        total_cost: 63.00
      }
    ];

    setTimeout(() => {
      setBoms(mockBOMs);
      setSelectedBOM(mockBOMs[0]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleBOMSelect = (bom: BOM) => {
    setSelectedBOM(bom);
  };

  const calculateScaledBOM = (quantity: number) => {
    if (!selectedBOM) return null;
    
    return {
      ...selectedBOM,
      components: selectedBOM.components.map(comp => ({
        ...comp,
        quantity: comp.quantity * quantity,
        total_cost: comp.cost_per_unit * comp.quantity * quantity
      })),
      total_cost: selectedBOM.total_cost * quantity
    };
  };

  const [scaleQuantity, setScaleQuantity] = useState(1);
  const scaledBOM = calculateScaledBOM(scaleQuantity);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading BOMs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bill of Materials</h1>
          <p className="text-slate-600">Manage product components and calculate material requirements</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} />
          Create BOM
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* BOM List */}
        <div className="xl:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Products</h2>
            </div>
            <div className="card-body p-0">
              <div className="space-y-0">
                {boms.map((bom) => (
                  <div
                    key={bom.bom_id}
                    onClick={() => handleBOMSelect(bom)}
                    className={`p-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedBOM?.bom_id === bom.bom_id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText size={16} className="text-slate-500" />
                          <span className="font-medium text-slate-900">{bom.product_name}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Version {bom.version} • {bom.components.length} components
                        </div>
                        <div className="mt-1 text-sm font-medium text-emerald-600">
                          ${bom.total_cost.toFixed(2)}
                        </div>
                      </div>
                      {bom.is_active && (
                        <span className="badge badge-success">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOM Details */}
        <div className="xl:col-span-2">
          {selectedBOM ? (
            <div className="space-y-6">
              {/* BOM Header */}
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedBOM.product_name}</h2>
                      <p className="text-slate-600">Version {selectedBOM.version} • {selectedBOM.components.length} components</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">
                        ${selectedBOM.total_cost.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-600">Base Cost</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Calculator */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Calculator size={20} />
                    <h3 className="text-lg font-semibold">Quantity Calculator</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="form-label">Production Quantity</label>
                      <input
                        type="number"
                        value={scaleQuantity}
                        onChange={(e) => setScaleQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="form-control"
                        min="1"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        Total Cost: <span className="text-emerald-600">${(scaledBOM?.total_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Unit Cost: ${selectedBOM.total_cost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Components Table */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Package size={20} />
                    <h3 className="text-lg font-semibold">
                      Components {scaleQuantity > 1 && `(x${scaleQuantity})`}
                    </h3>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Quantity</th>
                          <th>Unit Cost</th>
                          <th>Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(scaledBOM?.components || selectedBOM.components).map((component) => (
                          <tr key={component.component_id}>
                            <td>
                              <div className="font-medium text-slate-900">
                                {component.product_name}
                              </div>
                            </td>
                            <td>
                              <div className="text-slate-900">
                                {component.quantity} {component.unit}
                              </div>
                            </td>
                            <td>
                              <div className="text-slate-600">
                                ${component.cost_per_unit.toFixed(2)}
                              </div>
                            </td>
                            <td>
                              <div className="font-medium text-slate-900">
                                ${component.total_cost.toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan={3} className="font-semibold">
                            Total Material Cost
                          </td>
                          <td className="font-bold text-emerald-600">
                            ${(scaledBOM?.total_cost || selectedBOM.total_cost).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-12">
                <FileText className="mx-auto text-slate-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a BOM</h3>
                <p className="text-slate-600">Choose a product from the list to view its bill of materials</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}