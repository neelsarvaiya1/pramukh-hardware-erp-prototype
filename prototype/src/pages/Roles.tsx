import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Chips, Icon, showToast } from '../components/ui';
import { roles as initialRoles } from '../data/mockData';
import { cn } from '../utils/cn';

export default function Roles() {
  const { users } = useApp();
  const [rolePermissions, setRolePermissions] = useState(initialRoles);
  const [activeRole, setActiveRole] = useState('r2'); // Default to Manager like the screenshot

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    users.forEach(u => {
      // Find role ID for the user's role string
      const roleId = initialRoles.find(r => r.name.toLowerCase() === u.role)?.id;
      if (roleId) {
        stats[roleId] = (stats[roleId] || 0) + 1;
      }
    });
    return stats;
  }, [users]);

  const currentRole = rolePermissions.find(r => r.id === activeRole);

  const togglePermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    setRolePermissions(prev =>
      prev.map(r =>
        r.id === activeRole
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [module]: {
                  ...r.permissions[module],
                  [action]: !r.permissions[module]?.[action],
                },
              },
            }
          : r
      )
    );
    showToast('success', 'Security permissions updated');
  };

  const accessibleModulesCount = currentRole ? Object.values(currentRole.permissions).filter(p => p.view).length : 0;

  return (
    <div className="page-anim">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-sub">Control what each role can see and do — changes apply instantly</p>
        </div>
      </div>

      {/* Role Pills */}
      <div className="mb-6">
        <Chips
          options={rolePermissions.map(r => ({
            id: r.id,
            label: `${r.name} (${roleStats[r.id] || 0})`,
          }))}
          active={activeRole}
          onChange={setActiveRole}
        />
      </div>

      {currentRole && (
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
          {/* Left Column: Role Details */}
          <div className="space-y-6">
            <Card padding={false} className="h-fit">
              <div className="p-5">
                <h3 className="text-lg font-bold text-text mb-1">{currentRole.name}</h3>
                <p className="text-sm text-muted">{currentRole.description}.</p>
                <div className="divider my-4" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted font-medium">
                    <Icon name="users" size={16} />
                    <span>{roleStats[currentRole.id] || 0} team members</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted font-medium">
                    <Icon name="grid" size={16} />
                    <span>{accessibleModulesCount} modules accessible</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Permission Matrix */}
          <Card padding={false} className="flex flex-col min-w-0">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-text">Permission matrix — {currentRole.name}</h3>
              <span className="text-xs text-muted">Click to toggle</span>
            </div>
            <div className="tbl-wrap flex-1">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th className="text-center">View</th>
                    <th className="text-center">Create</th>
                    <th className="text-center">Edit</th>
                    <th className="text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(currentRole.permissions).map(([module, perms]) => {
                    const iconMap: Record<string, string> = {
                      dashboard: 'grid',
                      pos: 'cart',
                      products: 'box',
                      inventory: 'layers',
                      sales: 'receipt',
                      purchases: 'truck',
                      customers: 'users',
                      suppliers: 'building',
                      reports: 'chart',
                      users: 'user',
                      roles: 'shield',
                      settings: 'sliders',
                    };
                    const mIcon = iconMap[module] || 'box';

                    return (
                      <tr key={module} className="hover:bg-hover group">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Icon name={mIcon} size={16} className="text-muted group-hover:text-text transition-colors" />
                            <span className="font-semibold text-text capitalize">
                              {module === 'pos' ? 'POS / Billing' : module}
                            </span>
                          </div>
                        </td>
                        {(['view', 'create', 'edit', 'delete'] as const).map(action => {
                          const isAllowed = perms[action];
                          return (
                            <td key={action} className="text-center">
                              <button
                                onClick={() => togglePermission(module, action)}
                                className={cn(
                                  'w-5 h-5 rounded flex items-center justify-center mx-auto transition-all',
                                  isAllowed
                                    ? 'bg-accent text-white shadow-sm'
                                    : 'bg-transparent border-[1.5px] border-border hover:border-text-secondary'
                                )}
                                title={`Toggle ${action} permission on ${module}`}
                              >
                                {isAllowed && <Icon name="check" size={14} sw={3} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-xs text-muted border-t border-border">
              Tip: change a user's role in <strong>Users</strong>, then sign in as that user to see the navigation adapt.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
