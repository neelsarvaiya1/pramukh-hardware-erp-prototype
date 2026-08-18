import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, SearchInput, ConfirmDialog, Icon, showToast } from '../components/ui';
import { formatDate, hasPermission } from '../utils/permissions';
import { cn } from '../utils/cn';

export default function Users() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as string,
    status: 'active' as 'active' | 'inactive',
  });

  const canManageUsers = hasPermission(currentUser!, 'users', 'create');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const openForm = (id?: string) => {
    if (id) {
      const u = users.find(usr => usr.id === id)!;
      setEditId(id);
      setFormData({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
        status: u.status,
      });
    } else {
      setEditId(null);
      setFormData({ name: '', email: '', password: '', role: 'cashier', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('error', 'Please fill required fields');
      return;
    }
    if (editId) {
      const update: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };
      if (formData.password) update.password = formData.password;
      updateUser(editId, update);
      showToast('success', 'User profile updated');
    } else {
      if (!formData.password) {
        showToast('error', 'Temporary password is required for new accounts');
        return;
      }
      addUser({
        ...formData,
        password: formData.password,
        role: formData.role as 'admin' | 'manager' | 'cashier' | 'inventory',
      });
      showToast('success', 'User account created');
    }
    setShowForm(false);
  };

  return (
    <div className="page-anim">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">User Accounts & Access Control</h1>
          <p className="page-sub">
            Manage staff credentials, granular RBAC permissions, and system logins
          </p>
        </div>
        {canManageUsers && (
          <Button variant="primary" icon="plus" onClick={() => openForm()}>
            Add User
          </Button>
        )}
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search staff members by name or email..."
            className="flex-1 max-w-md"
          />
        </div>

        {/* Desktop Table */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Last Authentication</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const initials = (u.name || '?')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const roleBadgeClass =
                  u.role === 'admin'
                    ? 'b-purple'
                    : u.role === 'manager'
                    ? 'b-blue'
                    : u.role === 'inventory'
                    ? 'b-amber'
                    : 'b-gray';

                return (
                  <tr key={u.id} className="hover:bg-hover">
                    <td>
                      <div className="tile-row">
                        <div className="avatar">{initials}</div>
                        <div>
                          <div className="cell-main">{u.name}</div>
                          <div className="cell-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={cn('badge capitalize', roleBadgeClass)}>{u.role}</span>
                    </td>
                    <td>
                      <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="text-muted text-xs">
                      {u.lastLogin ? formatDate(u.lastLogin) : 'Never logged in'}
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        {canManageUsers && (
                          <button
                            onClick={() => openForm(u.id)}
                            className="icon-btn sm text-accent-text"
                            title="Edit User"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                        )}
                        {canManageUsers && u.id !== currentUser?.id && (
                          <button
                            onClick={() => setConfirmDelete(u.id)}
                            className="icon-btn sm text-danger"
                            title="Delete Account"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="cards-list">
          {filtered.map(u => (
            <div key={u.id} className="m-card">
              <div className="mc-top">
                <div className="cell-main">{u.name}</div>
                <Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
              </div>
              <div className="mc-sub">
                <span>{u.email}</span>
                <span className="capitalize font-semibold text-accent-text">{u.role}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="users" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No user accounts found</p>
            <p className="text-xs text-muted">Try a different search term or add a new staff member.</p>
          </div>
        )}
      </Card>

      {/* Add / Edit User Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Edit Staff Account' : 'Register New User'}
        subtitle="Manage credentials and system access tier"
        size="md"
      >
        <form onSubmit={handleSubmit} className="page-anim">
          <div className="form-row">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rachel Adams"
            />
            <Input
              label="Work Email"
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="rachel@pramukhardware.com"
            />
          </div>

          <div className="form-row">
            <Input
              label={editId ? 'New Password (leave blank to retain)' : 'Initial Password'}
              type="password"
              required={!editId}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <Select
              label="Assigned Role"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'cashier', label: 'Cashier (POS & Billing)' },
                { value: 'inventory', label: 'Inventory Manager (Stock)' },
                { value: 'manager', label: 'Store Manager (Reports & Orders)' },
                { value: 'admin', label: 'Administrator (Full Access)' },
              ]}
            />
          </div>

          <Select
            label="Account Status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            options={[
              { value: 'active', label: 'Active (Permit Logins)' },
              { value: 'inactive', label: 'Inactive (Revoke Access)' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editId ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteUser(confirmDelete);
            showToast('success', 'User account removed');
          }
        }}
        title="Delete Staff Account"
        message="Are you sure? This user will no longer be able to log into Pramukh Hardware ERP."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
