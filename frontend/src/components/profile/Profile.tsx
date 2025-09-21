import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User, Mail, Shield, Clock, Settings, Save } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user context
      if (user) {
        setUser({
          ...user,
          username: formData.username,
          email: formData.email
        });
      }
      
      showSuccess('Profile updated successfully');
    } catch (error) {
      showError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Mock activity data
  const recentActivity = [
    {
      id: 1,
      action: 'Completed Work Order WO-2024-001',
      timestamp: '2024-01-20T14:30:00Z',
      type: 'work_order'
    },
    {
      id: 2,
      action: 'Created Manufacturing Order MO-2024-005',
      timestamp: '2024-01-20T10:15:00Z',
      type: 'manufacturing_order'
    },
    {
      id: 3,
      action: 'Updated product inventory for Wooden Leg',
      timestamp: '2024-01-19T16:45:00Z',
      type: 'inventory'
    },
    {
      id: 4,
      action: 'Generated production report',
      timestamp: '2024-01-19T09:20:00Z',
      type: 'report'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return <Settings className="text-blue-500" size={16} />;
      case 'manufacturing_order':
        return <Clock className="text-emerald-500" size={16} />;
      case 'inventory':
        return <User className="text-orange-500" size={16} />;
      case 'report':
        return <Shield className="text-purple-500" size={16} />;
      default:
        return <User className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="xl:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <User size={20} />
                <span>Personal Information</span>
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="username" className="form-label">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Shield className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 capitalize">
                        {user?.role_name}
                      </div>
                      <div className="text-sm text-slate-600">
                        System assigned role
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <span className={`badge badge-success`}>
                      Active
                    </span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Member Since</label>
                    <div className="text-slate-900">
                      January 15, 2024
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="card mt-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <Shield size={20} />
                <span>Change Password</span>
              </h2>
            </div>
            
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
            
            <div className="card-footer">
              <button className="btn btn-secondary">
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity & Stats */}
        <div className="space-y-6">
          {/* User Stats */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Your Stats</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">23</div>
                <div className="text-sm text-blue-700">Work Orders Completed</div>
              </div>
              
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">8</div>
                <div className="text-sm text-emerald-700">Manufacturing Orders Created</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">15</div>
                <div className="text-sm text-orange-700">Reports Generated</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
            </div>
            <div className="card-body p-0">
              <div className="space-y-0">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`p-4 ${index < recentActivity.length - 1 ? 'border-b border-slate-200' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-900 mb-1">
                          {activity.action}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-ghost btn-sm w-full">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}