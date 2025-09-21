import React from 'react';
import { TrendingUp, TrendingDown, Minus, DivideIcon as LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export default function KPICard({ title, value, change, trend, icon: Icon, color }: KPICardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-100 dark:border-blue-800'
        };
      case 'green':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          icon: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-100 dark:border-emerald-800'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          icon: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-100 dark:border-orange-800'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: 'text-red-600 dark:text-red-400',
          border: 'border-red-100 dark:border-red-800'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          icon: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-100 dark:border-purple-800'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          icon: 'text-slate-600 dark:text-slate-400',
          border: 'border-slate-100 dark:border-slate-700'
        };
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-emerald-500" size={16} />;
      case 'down':
        return <TrendingDown className="text-red-500" size={16} />;
      default:
        return <Minus className="text-slate-400" size={16} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`card hover:shadow-lg transition-all duration-300 ${colors.border} border-2`}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors.bg}`}>
            <Icon className={colors.icon} size={24} />
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
          </div>
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {value}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {title}
          </p>
          <div className="flex items-center space-x-1">
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {change}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              vs last month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}