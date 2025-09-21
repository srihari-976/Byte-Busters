import React from 'react';
import { AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';

interface Alert {
  id: number;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-slate-500" size={20} />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Bell size={20} />
            <span>Recent Alerts</span>
          </h2>
          <span className="badge badge-danger">
            {alerts.length}
          </span>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="space-y-0">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${getAlertStyle(alert.type)} ${
                  index < alerts.length - 1 ? 'border-b border-slate-200' : ''
                } transition-all duration-300 hover:bg-opacity-80`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {alert.timestamp}
                      </span>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No alerts</h3>
              <p className="text-slate-600">All systems are running smoothly.</p>
            </div>
          )}
        </div>
      </div>
      
      {alerts.length > 0 && (
        <div className="card-footer">
          <button className="btn btn-ghost btn-sm w-full">
            View All Alerts
          </button>
        </div>
      )}
    </div>
  );
}