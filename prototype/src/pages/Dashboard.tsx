import React from 'react';
import { useApp } from '../context/AppContext';
import AdminDashboard from './dashboard/AdminDashboard';
import ManagerDashboard from './dashboard/ManagerDashboard';
import CashierDashboard from './dashboard/CashierDashboard';
import InventoryDashboard from './dashboard/InventoryDashboard';
import { EmptyState } from '../components/ui';

export default function Dashboard() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return null;
  }

  switch (currentUser.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'cashier':
      return <CashierDashboard />;
    case 'inventory':
      return <InventoryDashboard />;
    default:
      return (
        <div className="page-anim flex items-center justify-center h-[80vh]">
          <EmptyState 
            icon="shield-off" 
            title="Access Denied" 
            description="Your role does not have a designated dashboard view." 
          />
        </div>
      );
  }
}
