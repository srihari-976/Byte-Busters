import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Factory, Shield } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showError('Validation Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      showSuccess('Login Successful', 'Welcome to Smart Manufacturing Assistant');
      // Redirect to dashboard after successful login
      setTimeout(() => {
        console.log('Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      }, 1500); // Small delay to show the success message
    } catch (error: any) {
      showError('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { role: 'Admin', email: 'admin@company.com', password: 'admin123' },
    { role: 'Manager', email: 'manager@company.com', password: 'manager123' },
    { role: 'Operator', email: 'operator@company.com', password: 'operator123' },
    { role: 'Inventory', email: 'inventory@company.com', password: 'inventory123' },
  ];

  const loginAsDemo = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Factory size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">SmartMfg</h1>
                <p className="text-slate-300">Manufacturing Assistant</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Intelligent Manufacturing
              <span className="text-emerald-400"> Simplified</span>
            </h2>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Streamline your production workflow with AI-powered insights, real-time monitoring, and predictive analytics.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Shield className="text-emerald-400" size={20} />
                <span className="text-slate-300">Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-slate-300">Real-time production monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-slate-300">AI-powered predictive alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-12 bg-white dark:bg-slate-800 transition-colors duration-200">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Factory className="text-emerald-500" size={32} />
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">SmartMfg</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Manufacturing Assistant</p>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Welcome back</h1>
            <p className="text-slate-600 dark:text-slate-400">Sign in to your manufacturing dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Demo Accounts</h3>
            <div className="grid grid-cols-2 gap-3">
              {demoUsers.map((user) => (
                <button
                  key={user.role}
                  onClick={() => loginAsDemo(user.email, user.password)}
                  className="btn btn-ghost btn-sm text-left flex flex-col items-start p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{user.role}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">{user.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            © 2024 SmartMfg. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}