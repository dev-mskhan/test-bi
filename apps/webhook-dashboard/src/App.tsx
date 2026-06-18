import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar   from './components/Sidebar';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Overview  from './pages/Overview';
import Logs      from './pages/Logs';
import LogDetail from './pages/LogDetail';
import Deliveries from './pages/Deliveries';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span className="spinner" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout><Overview /></DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/logs" element={
              <PrivateRoute>
                <DashboardLayout><Logs /></DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/logs/:id" element={
              <PrivateRoute>
                <DashboardLayout><LogDetail /></DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/deliveries" element={
              <PrivateRoute>
                <DashboardLayout><Deliveries /></DashboardLayout>
              </PrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
