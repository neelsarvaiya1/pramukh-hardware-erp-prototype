import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, CardHeader, SearchInput, ConfirmDialog, Tabs } from '../components/ui';
import { showToast } from '../components/ui';
import { formatDate, hasPermission } from '../utils/permissions';
import { roles as initialRoles } from '../data/mockData';

export default function Users() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier' as string, status: 'active' as 'active' | 'inactive' });
  const [rolePermissions, setRolePermissions] = useState(initialRoles);
  const canManageUsers = hasPermission(currentUser!, 'users', 'create');

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const openForm = (id?: string) => {
    if (id) {
      const u = users.find(usr => usr.id === id)!;
      setEditId(id);
      setFormData({ name: u.name, email: u.email, password: '', role: u.role, status: u.status });
    } else {
      setEditId(null);
      setFormData({ name: '', email: '', password: '', role: 'cashier', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { showToast('error', 'Please fill required fields'); return; }
    if (editId) {
      const update: Record<string, string> = { name: formData.name, email: formData.email, role: formData.role, status: formData.status };
      if (formData.password) update.password = formData.password;
      updateUser(editId, update);
      showToast('success', 'User updated');
    } else {
      if (!formData.password) { showToast('error', 'Password is required'); return; }
      addUser({ ...formData, password: formData.password, role: formData.role as 'admin' | 'manager' | 'cashier' | 'inventory' });
      showToast('success', 'User created');
    }
    setShowForm(false);
  };

  const togglePermission = (roleId: string, module: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    setRolePermissions(prev => prev.map(r => r.id === roleId ? {
      ...r, permissions: { ...r.permissions, [module]: { ...r.permissions[module], [action]: !r.permissions[module]?.[action] } }
    } : r));
    showToast('success', 'Permission updated');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      <Tabs tabs={[{ id: 'users', label: 'Users' }, { id: 'roles', label: 'Roles & Permissions' }]} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="flex-1 max-w-md" />
            {canManageUsers && <Button onClick={() => openForm()}>+ Add User</Button>}
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">{u.name.split(' ').map(n => n[0]).join('')}</div>
                          <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge variant={u.role === 'admin' ? 'info' : u.role === 'manager' ? 'warning' : 'default'} className="capitalize">{u.role}</Badge></td>
                      <td className="py-3 px-4"><Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge></td>
                      <td className="py-3 px-4 text-gray-600">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManageUsers && <button onClick={() => openForm(u.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                          {canManageUsers && u.id !== currentUser?.id && <button onClick={() => setConfirmDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          {rolePermissions.map(role => (
            <Card key={role.id}>
              <CardHeader>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">View</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Create</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Edit</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Delete</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(role.permissions).map(([module, perms]) => (
                      <tr key={module} className="border-b border-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-900 capitalize">{module}</td>
                        {(['view', 'create', 'edit', 'delete'] as const).map(action => (
                          <td key={action} className="py-2 px-3 text-center">
                            <button
                              onClick={() => togglePermission(role.id, module, action)}
                              className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${perms[action] ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            >
                              {perms[action] ? '✓' : '–'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Email *" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <Input label={editId ? 'New Password (leave blank to keep)' : 'Password *'} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editId} />
          <Select label="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} options={[{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }, { value: 'cashier', label: 'Cashier' }, { value: 'inventory', label: 'Inventory Staff' }]} />
          <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">{editId ? 'Update' : 'Create'} User</Button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteUser(confirmDelete); showToast('success', 'User deleted'); } }} title="Delete User" message="Are you sure? This action cannot be undone." />
    </div>
  );
}
