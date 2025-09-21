import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface QualityInspection {
  inspection_id: string;
  reference_number: string;
  reference_type: string;
  product_name: string;
  inspector_name: string;
  inspection_result: 'passed' | 'failed' | 'pending';
  remarks: string;
  created_at: string;
}

export default function QualityControl() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockInspections: QualityInspection[] = [
      {
        inspection_id: '1',
        reference_number: 'MO-2024-001',
        reference_type: 'Manufacturing Order',
        product_name: 'Wooden Table',
        inspector_name: 'Sarah Johnson',
        inspection_result: 'passed',
        remarks: 'All dimensions within tolerance. Surface finish excellent.',
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        inspection_id: '2',
        reference_number: 'MO-2024-002',
        reference_type: 'Manufacturing Order',
        product_name: 'Office Chair',
        inspector_name: 'Mike Wilson',
        inspection_result: 'failed',
        remarks: 'Chair height adjustment mechanism not working properly.',
        created_at: '2024-01-20T11:15:00Z'
      },
      {
        inspection_id: '3',
        reference_number: 'MO-2024-003',
        reference_type: 'Manufacturing Order',
        product_name: 'Desk Lamp',
        inspector_name: 'Sarah Johnson',
        inspection_result: 'pending',
        remarks: 'Awaiting electrical safety certification.',
        created_at: '2024-01-20T16:45:00Z'
      },
      {
        inspection_id: '4',
        reference_number: 'PO-2024-001',
        reference_type: 'Purchase Order',
        product_name: 'Wooden Leg',
        inspector_name: 'David Brown',
        inspection_result: 'passed',
        remarks: 'Incoming material inspection completed successfully.',
        created_at: '2024-01-19T09:20:00Z'
      }
    ];

    setTimeout(() => {
      setInspections(mockInspections);
      setLoading(false);
    }, 1000);
  }, []);

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'passed':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <AlertTriangle className="text-slate-500" size={20} />;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'passed':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  };

  const passedCount = inspections.filter(i => i.inspection_result === 'passed').length;
  const failedCount = inspections.filter(i => i.inspection_result === 'failed').length;
  const pendingCount = inspections.filter(i => i.inspection_result === 'pending').length;
  const passRate = inspections.length > 0 ? Math.round((passedCount / (passedCount + failedCount)) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading quality data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quality Control</h1>
          <p className="text-slate-600">Monitor product quality and inspection results</p>
        </div>
        <button className="btn btn-primary">
          <Shield size={20} />
          New Inspection
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{passedCount}</div>
                <div className="text-sm text-slate-600">Passed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="text-red-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-slate-600">Failed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-slate-600">Pending</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{passRate}%</div>
                <div className="text-sm text-slate-600">Pass Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Overview Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Quality Metrics</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pass Rate Chart */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeWidth="3"
                    strokeDasharray={`${passRate}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-900">{passRate}%</span>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">Pass Rate</h3>
            </div>

            {/* Inspection Volume */}
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">{inspections.length}</div>
              <h3 className="font-semibold text-slate-900 mb-2">Total Inspections</h3>
              <div className="text-sm text-slate-600">This month</div>
            </div>

            {/* Average Time */}
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">2.5h</div>
              <h3 className="font-semibold text-slate-900 mb-2">Avg Inspection Time</h3>
              <div className="text-sm text-slate-600">Per product</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Recent Inspections</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Product</th>
                  <th>Inspector</th>
                  <th>Result</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((inspection) => (
                  <tr key={inspection.inspection_id} className="hover:bg-slate-50">
                    <td>
                      <div className="text-sm">
                        {new Date(inspection.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(inspection.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">
                        {inspection.reference_number}
                      </div>
                      <div className="text-xs text-slate-500">
                        {inspection.reference_type}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">
                        {inspection.product_name}
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-900">
                        {inspection.inspector_name}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getResultBadge(inspection.inspection_result)} flex items-center space-x-1 w-fit`}>
                        {getResultIcon(inspection.inspection_result)}
                        <span className="capitalize">{inspection.inspection_result}</span>
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-slate-600 max-w-xs truncate" title={inspection.remarks}>
                        {inspection.remarks}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inspections.length === 0 && (
            <div className="text-center py-12">
              <Shield className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No inspections found</h3>
              <p className="text-slate-600 mb-4">Start by conducting your first quality inspection.</p>
              <button className="btn btn-primary">
                <Shield size={20} />
                New Inspection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}