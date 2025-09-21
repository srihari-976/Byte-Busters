import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Factory, 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  FileText, 
  Settings, 
  Package, 
  BarChart3, 
  Shield,
  Users,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'operator', 'inventory'] },
    { name: 'Manufacturing Orders', href: '/manufacturing-orders', icon: ClipboardList, roles: ['admin', 'manager', 'inventory'] },
    { name: 'Work Orders', href: '/work-orders', icon: Wrench, roles: ['admin', 'manager', 'operator'] },
    { name: 'Bill of Materials', href: '/bom', icon: FileText, roles: ['admin', 'manager'] },
    { name: 'Work Centers', href: '/work-centers', icon: Settings, roles: ['admin', 'manager'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'manager', 'inventory'] },
    { name: 'Stock Ledger', href: '/stock-ledger', icon: Package, roles: ['admin', 'manager', 'inventory'] },
    { name: 'Quality Control', href: '/quality-control', icon: Shield, roles: ['admin', 'manager'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role_name?.toLowerCase() || '')
  );

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-slate-900 bg-opacity-50" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-all duration-300 lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Factory className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">SmartMfg</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manufacturing Assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Users className="text-slate-600 dark:text-slate-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.role_name || 'Role'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-500'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 ${
                    isActive(item.href) ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  size={20}
                />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              © 2024 SmartMfg Systems
            </div>
          </div>
        </div>
      </div>
    </>
  );
}