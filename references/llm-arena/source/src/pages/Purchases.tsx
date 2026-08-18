import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Badge, Modal, Card, StatCard, SearchInput, Select } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';

export default function Purchases() {
  const { purchases, suppliers, products, settings, currentUser, addPurchase } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewPurchase, setViewPurchase] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [newItems, setNewItems] = useState<{ productId: string; quantity: string; unitCost: string }[]>([]);
  const [newNotes, setNewNotes] = useState('');
  const canCreate = hasPermission(currentUser!, 'purchases', 'create');

  const totalValue = purchases.filter(p => p.status === 'completed').reduce((s, p) => s + p.total, 0);
  const pendingCount = purchases.filter(p => p.status === 'pending').length;

  const filtered = purchases.filter(p => {
    if (search && !p.purchaseNo.toLowerCase().includes(search.toLowerCase()) && !p.supplierName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const addItem = () => setNewItems([...newItems, { productId: '', quantity: '', unitCost: '' }]);
  const removeItem = (i: number) => setNewItems(newItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => setNewItems(newItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const newSubtotal = newItems.reduce((s, item) => s + (parseFloat(item.unitCost) || 0) * (parseInt(item.quantity) || 0), 0);
  const newTax = newSubtotal * (settings.taxRate / 100);
  const newTotal = newSubtotal + newTax;

  const handleCreatePurchase = () => {
    if (!newSupplier || newItems.length === 0 || newItems.some(i => !i.productId || !i.quantity)) {
      showToast('error', 'Please fill all required fields');
      return;
    }
    const supplier = suppliers.find(s => s.id === newSupplier);
    addPurchase({
      supplierId: newSupplier,
      supplierName: supplier?.name || '',
      items: newItems.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const qty = parseInt(item.quantity);
        const cost = parseFloat(item.unitCost) || product.costPrice;
        return { productId: item.productId, productName: product.name, sku: product.sku, quantity: qty, unitCost: cost, tax: cost * qty * (settings.taxRate / 100), total: cost * qty * (1 + settings.taxRate / 100) };
      }),
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
      status: 'completed',
      receivedBy: currentUser?.name || '',
      notes: newNotes,
    });
    showToast('success', 'Purchase created successfully');
    setShowCreate(false);
    setNewSupplier('');
    setNewItems([]);
    setNewNotes('');
  };

  const detail = viewPurchase ? purchases.find(p => p.id === viewPurchase) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
        {canCreate && <Button onClick={() => setShowCreate(true)}>+ Create Purchase</Button>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Purchases" value={formatCurrency(totalValue, settings.currencySymbol)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total Orders" value={String(purchases.length)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard label="Completed" value={String(purchases.filter(p => p.status === 'completed').length)} changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
        <StatCard label="Pending" value={String(pendingCount)} changeType={pendingCount > 0 ? 'down' : 'neutral'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search purchase or supplier..." className="flex-1" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">All Status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Purchase #</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(purchase => (
                <tr key={purchase.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setViewPurchase(purchase.id)}>
                  <td className="py-3 px-4 font-medium text-blue-600">{purchase.purchaseNo}</td>
                  <td className="py-3 px-4 text-gray-900">{purchase.supplierName}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(purchase.date)}</td>
                  <td className="py-3 px-4 text-gray-600">{purchase.items.length}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(purchase.total, settings.currencySymbol)}</td>
                  <td className="py-3 px-4"><Badge variant={purchase.status === 'completed' ? 'success' : purchase.status === 'pending' ? 'warning' : 'danger'}>{purchase.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={e => { e.stopPropagation(); setViewPurchase(purchase.id); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setViewPurchase(null)} title={`Purchase ${detail?.purchaseNo || ''}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Supplier</p><p className="font-medium">{detail.supplierName}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p>{formatDate(detail.date)}</p></div>
              <div><p className="text-xs text-gray-500">Received By</p><p>{detail.receivedBy}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><Badge variant={detail.status === 'completed' ? 'success' : detail.status === 'pending' ? 'warning' : 'danger'}>{detail.status}</Badge></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-xs text-gray-500">Product</th><th className="text-right py-2 text-xs text-gray-500">Qty</th><th className="text-right py-2 text-xs text-gray-500">Cost</th><th className="text-right py-2 text-xs text-gray-500">Total</th></tr></thead>
              <tbody>
                {detail.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50"><td className="py-2">{item.productName}</td><td className="py-2 text-right">{item.quantity}</td><td className="py-2 text-right">{formatCurrency(item.unitCost, settings.currencySymbol)}</td><td className="py-2 text-right font-medium">{formatCurrency(item.total, settings.currencySymbol)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(detail.subtotal, settings.currencySymbol)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(detail.tax, settings.currencySymbol)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"><span>Total</span><span>{formatCurrency(detail.total, settings.currencySymbol)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Purchase" size="lg">
        <div className="space-y-4">
          <Select label="Supplier *" value={newSupplier} onChange={e => setNewSupplier(e.target.value)} options={[{ value: '', label: 'Select supplier' }, ...suppliers.filter(s => s.status === 'active').map(s => ({ value: s.id, label: s.name }))]} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
            {newItems.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <select value={item.productId} onChange={e => { updateItem(i, 'productId', e.target.value); const p = products.find(pr => pr.id === e.target.value); if (p) updateItem(i, 'unitCost', String(p.costPrice)); }} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm">
                  <option value="">Select product</option>
                  {products.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                <input type="number" value={item.unitCost} onChange={e => updateItem(i, 'unitCost', e.target.value)} placeholder="Cost" className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={addItem}>+ Add Item</Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-1"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(newSubtotal, settings.currencySymbol)}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-500">Tax ({settings.taxRate}%)</span><span>{formatCurrency(newTax, settings.currencySymbol)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200"><span>Total</span><span>{formatCurrency(newTotal, settings.currencySymbol)}</span></div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreatePurchase}>Create Purchase</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
