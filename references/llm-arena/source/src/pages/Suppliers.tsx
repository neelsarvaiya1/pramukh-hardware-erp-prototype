import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Badge, Modal, Card, SearchInput } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';

export default function Suppliers() {
  const { suppliers, purchases, products, settings, currentUser, addSupplier, updateSupplier } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', status: 'active' as 'active' | 'inactive' });
  const canCreate = hasPermission(currentUser!, 'suppliers', 'create');
  const canEdit = hasPermission(currentUser!, 'suppliers', 'edit');

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.contactPerson.toLowerCase().includes(search.toLowerCase()));

  const openForm = (id?: string) => {
    if (id) {
      const s = suppliers.find(su => su.id === id)!;
      setEditId(id);
      setFormData({ name: s.name, contactPerson: s.contactPerson, email: s.email, phone: s.phone, address: s.address, city: s.city, status: s.status });
    } else {
      setEditId(null);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { showToast('error', 'Please fill required fields'); return; }
    if (editId) { updateSupplier(editId, formData); showToast('success', 'Supplier updated'); }
    else { addSupplier(formData); showToast('success', 'Supplier added'); }
    setShowForm(false);
  };

  const detail = viewId ? suppliers.find(s => s.id === viewId) : null;
  const supplierPurchases = detail ? purchases.filter(p => p.supplierId === detail.id).slice(0, 10) : [];
  const supplierProducts = detail ? products.filter(p => p.supplierId === detail.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500">{suppliers.length} total suppliers</p>
        </div>
        {canCreate && <Button onClick={() => openForm()}>+ Add Supplier</Button>}
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." className="max-w-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Products</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Outstanding</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4"><p className="font-medium text-gray-900">{s.name}</p><p className="text-xs text-gray-500">{s.city}</p></td>
                  <td className="py-3 px-4"><p className="text-gray-900">{s.contactPerson}</p><p className="text-xs text-gray-500">{s.email}</p></td>
                  <td className="py-3 px-4 text-gray-600">{s.totalProducts}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(s.totalPurchases, settings.currencySymbol)}</td>
                  <td className="py-3 px-4"><span className={s.outstandingAmount > 0 ? 'text-red-600 font-medium' : 'text-emerald-600'}>{formatCurrency(s.outstandingAmount, settings.currencySymbol)}</span></td>
                  <td className="py-3 px-4"><Badge variant={s.status === 'active' ? 'success' : 'default'}>{s.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewId(s.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                      {canEdit && <button onClick={() => openForm(s.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-gray-400"><p>No suppliers found</p></div>}
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Supplier Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          <Input label="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">{editId ? 'Update' : 'Add'} Supplier</Button></div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setViewId(null)} title="Supplier Details" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{detail.name}</p></div>
              <div><p className="text-xs text-gray-500">Contact Person</p><p>{detail.contactPerson}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p>{detail.email}</p></div>
              <div><p className="text-xs text-gray-500">Phone</p><p>{detail.phone}</p></div>
              <div><p className="text-xs text-gray-500">Total Purchases</p><p className="font-bold">{formatCurrency(detail.totalPurchases, settings.currencySymbol)}</p></div>
              <div><p className="text-xs text-gray-500">Outstanding</p><p className={`font-bold ${detail.outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(detail.outstandingAmount, settings.currencySymbol)}</p></div>
            </div>
            {supplierProducts.length > 0 && (
              <div><h4 className="text-sm font-medium text-gray-900 mb-2">Products Supplied</h4>
                <div className="flex flex-wrap gap-2">{supplierProducts.map(p => <span key={p.id} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">{p.name}</span>)}</div>
              </div>
            )}
            {supplierPurchases.length > 0 && (
              <div><h4 className="text-sm font-medium text-gray-900 mb-2">Recent Purchases</h4>
                <div className="space-y-2">{supplierPurchases.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div><p className="text-sm font-medium">{p.purchaseNo}</p><p className="text-xs text-gray-500">{formatDate(p.date)}</p></div>
                    <div className="text-right"><span className="font-medium">{formatCurrency(p.total, settings.currencySymbol)}</span><Badge variant={p.status === 'completed' ? 'success' : 'warning'} className="ml-2">{p.status}</Badge></div>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
