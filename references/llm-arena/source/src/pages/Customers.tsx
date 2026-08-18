import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Badge, Modal, Card, SearchInput, ConfirmDialog } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';

export default function Customers() {
  const { customers, sales, settings, currentUser, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', city: '', status: 'active' as 'active' | 'inactive' });
  const canCreate = hasPermission(currentUser!, 'customers', 'create');
  const canEdit = hasPermission(currentUser!, 'customers', 'edit');
  const canDelete = hasPermission(currentUser!, 'customers', 'delete');

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const openForm = (id?: string) => {
    if (id) {
      const c = customers.find(cu => cu.id === id)!;
      setEditId(id);
      setFormData({ name: c.name, email: c.email, phone: c.phone, address: c.address, city: c.city, status: c.status });
    } else {
      setEditId(null);
      setFormData({ name: '', email: '', phone: '', address: '', city: '', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { showToast('error', 'Please fill required fields'); return; }
    if (editId) { updateCustomer(editId, formData); showToast('success', 'Customer updated'); }
    else { addCustomer(formData); showToast('success', 'Customer added'); }
    setShowForm(false);
  };

  const detail = viewId ? customers.find(c => c.id === viewId) : null;
  const customerSales = detail ? sales.filter(s => s.customerId === detail.id && s.status === 'completed').slice(0, 10) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} total customers</p>
        </div>
        {canCreate && <Button onClick={() => openForm()}>+ Add Customer</Button>}
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="max-w-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Orders</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Spent</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Last Purchase</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4"><p className="font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-500">{c.email}</p></td>
                  <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                  <td className="py-3 px-4 font-medium">{c.totalOrders}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(c.totalSpent, settings.currencySymbol)}</td>
                  <td className="py-3 px-4 text-gray-600">{c.lastPurchase ? formatDate(c.lastPurchase) : '-'}</td>
                  <td className="py-3 px-4"><Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewId(c.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                      {canEdit && <button onClick={() => openForm(c.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                      {canDelete && <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-gray-400"><p>No customers found</p></div>}
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Email *" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          <Input label="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">{editId ? 'Update' : 'Add'} Customer</Button></div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setViewId(null)} title="Customer Details" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{detail.name}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p>{detail.email}</p></div>
              <div><p className="text-xs text-gray-500">Phone</p><p>{detail.phone}</p></div>
              <div><p className="text-xs text-gray-500">City</p><p>{detail.city}</p></div>
              <div><p className="text-xs text-gray-500">Total Orders</p><p className="font-bold">{detail.totalOrders}</p></div>
              <div><p className="text-xs text-gray-500">Total Spent</p><p className="font-bold text-blue-600">{formatCurrency(detail.totalSpent, settings.currencySymbol)}</p></div>
            </div>
            <h4 className="text-sm font-medium text-gray-900 pt-2">Recent Purchases</h4>
            {customerSales.length === 0 ? <p className="text-sm text-gray-500">No purchases yet</p> : (
              <div className="space-y-2">{customerSales.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div><p className="text-sm font-medium">{s.invoiceNo}</p><p className="text-xs text-gray-500">{formatDate(s.date)}</p></div>
                  <span className="font-medium">{formatCurrency(s.total, settings.currencySymbol)}</span>
                </div>
              ))}</div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteCustomer(confirmDelete); showToast('success', 'Customer deleted'); } }} title="Delete Customer" message="Are you sure? This action cannot be undone." />
    </div>
  );
}
