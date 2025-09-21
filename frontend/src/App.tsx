import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import ManufacturingOrders from './components/manufacturing/ManufacturingOrders';
import WorkOrders from './components/manufacturing/WorkOrders';
import BOMManager from './components/manufacturing/BOMManager';
import WorkCenters from './components/manufacturing/WorkCenters';
import StockLedger from './components/inventory/StockLedger';
import Products from './components/inventory/Products';
import QualityControl from './components/quality/QualityControl';
import Reports from './components/reports/Reports';
import Profile from './components/profile/Profile';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/manufacturing-orders" element={<ManufacturingOrders />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/bom" element={<BOMManager />} />
        <Route path="/work-centers" element={<WorkCenters />} />
        <Route path="/stock-ledger" element={<StockLedger />} />
        <Route path="/products" element={<Products />} />
        <Route path="/quality-control" element={<QualityControl />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}

export default App;