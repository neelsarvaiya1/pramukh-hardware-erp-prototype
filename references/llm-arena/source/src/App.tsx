import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import { ToastContainer } from './components/ui';
import { hasPermission } from './utils/permissions';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

function ProtectedRoute({ children, module }: { children: React.ReactNode; module: string }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasPermission(currentUser, module, 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500">You don't have permission to access this module.</p>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute module="pos"><POS /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute module="products"><Products /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute module="products"><Products /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute module="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute module="sales"><Sales /></ProtectedRoute>} />
        <Route path="/sales/:id" element={<ProtectedRoute module="sales"><Sales /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute module="purchases"><Purchases /></ProtectedRoute>} />
        <Route path="/purchases/:id" element={<ProtectedRoute module="purchases"><Purchases /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute module="customers"><Customers /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute module="customers"><Customers /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute module="suppliers"><Suppliers /></ProtectedRoute>} />
        <Route path="/suppliers/:id" element={<ProtectedRoute module="suppliers"><Suppliers /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute module="users"><Users /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute module="roles"><Users /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <ToastContainer />
      </AppProvider>
    </BrowserRouter>
  );
}
