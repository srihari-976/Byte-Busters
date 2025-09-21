import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ProductionChart() {
  // Mock data for the chart
  const productionData = [
    { day: 'Mon', planned: 45, actual: 42, efficiency: 93 },
    { day: 'Tue', planned: 52, actual: 48, efficiency: 92 },
    { day: 'Wed', planned: 38, actual: 41, efficiency: 108 },
    { day: 'Thu', planned: 61, actual: 55, efficiency: 90 },
    { day: 'Fri', planned: 49, actual: 52, efficiency: 106 },
    { day: 'Sat', planned: 33, actual: 31, efficiency: 94 },
    { day: 'Sun', planned: 28, actual: 25, efficiency: 89 }
  ];

  const maxValue = Math.max(...productionData.map(d => Math.max(d.planned, d.actual)));

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
              <BarChart3 size={20} />
              <span>Production Overview</span>
            </h2>
            <p className="text-sm text-slate-600">Weekly production vs planned targets</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600">Actual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
              <span className="text-slate-600">Planned</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="space-y-4">
          {productionData.map((item, index) => (
            <div key={item.day} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-slate-600">
                {item.day}
              </div>
              
              <div className="flex-1 relative">
                <div className="flex items-center space-x-2 h-8">
                  {/* Planned bar (background) */}
                  <div 
                    className="bg-slate-200 h-6 rounded-md relative overflow-hidden"
                    style={{ width: `${(item.planned / maxValue) * 100}%` }}
                  >
                    {/* Actual bar (overlay) */}
                    <div 
                      className={`h-full rounded-md transition-all duration-700 delay-${index * 100} ${
                        item.actual > item.planned 
                          ? 'bg-emerald-500' 
                          : item.efficiency >= 95 
                          ? 'bg-emerald-500' 
                          : item.efficiency >= 85 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(item.actual / item.planned * 100, 100)}%`,
                        animation: `slideIn 0.7s ease-out ${index * 0.1}s both`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="w-16 text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {item.actual}
                </div>
                <div className="text-xs text-slate-500">
                  /{item.planned}
                </div>
              </div>
              
              <div className={`w-16 text-right text-sm font-medium ${
                item.efficiency >= 100 
                  ? 'text-emerald-600' 
                  : item.efficiency >= 95 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}>
                {item.efficiency}%
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">92%</div>
              <div className="text-xs text-slate-600">Avg Efficiency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">294</div>
              <div className="text-xs text-slate-600">Total Produced</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">306</div>
              <div className="text-xs text-slate-600">Total Planned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}