import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Badge, Modal, Card, StatCard, SearchInput } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency, hasPermission } from '../utils/permissions';

export default function Inventory() {
  const { products, settings, currentUser, stockMovements, adjustStock } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const canEdit = hasPermission(currentUser!, 'inventory', 'edit');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())).filter(p => {
    if (statusFilter === 'low') return p.stock > 0 && p.stock <= p.minStock;
    if (statusFilter === 'out') return p.stock === 0;
    if (statusFilter === 'in') return p.stock > p.minStock;
    return true;
  });

  const totalValue = products.reduce((s, p) => s + (p.stock * p.costPrice), 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const handleAdjust = () => {
    if (!showAdjust || !adjustQty) return;
    adjustStock(showAdjust, parseInt(adjustQty), adjustReason || 'Manual adjustment');
    showToast('success', 'Stock adjusted successfully');
    setShowAdjust(null);
    setAdjustQty('');
    setAdjustReason('');
  };

  const movements = showHistory ? stockMovements.filter(m => m.productId === showHistory).slice(0, 20) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stock Value" value={formatCurrency(totalValue, settings.currencySymbol)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total Products" value={String(products.length)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <StatCard label="Low Stock" value={String(lowStock)} changeType="down" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>} />
        <StatCard label="Out of Stock" value={String(outOfStock)} changeType="down" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="flex-1" />
          <div className="flex gap-2">
            {[{ id: 'all', label: 'All' }, { id: 'in', label: 'In Stock' }, { id: 'low', label: 'Low Stock' }, { id: 'out', label: 'Out of Stock' }].map(s => (
              <button key={s.id} onClick={() => setStatusFilter(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 px-4"><span className={`font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-amber-600' : 'text-gray-900'}`}>{p.stock}</span></td>
                  <td className="py-3 px-4 text-gray-600">{p.minStock}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(p.stock * p.costPrice, settings.currencySymbol)}</td>
                  <td className="py-3 px-4"><Badge variant={p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success'}>{p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'In Stock'}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && <button onClick={() => setShowAdjust(p.id)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Adjust</button>}
                      <button onClick={() => setShowHistory(p.id)} className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100">History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!showAdjust} onClose={() => setShowAdjust(null)} title="Stock Adjustment">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Product: <strong>{products.find(p => p.id === showAdjust)?.name}</strong></p>
          <p className="text-sm text-gray-500">Current Stock: <strong>{products.find(p => p.id === showAdjust)?.stock}</strong></p>
          <Input label="Quantity (positive to add, negative to remove)" type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="e.g., 10 or -5" />
          <Input label="Reason" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Enter reason for adjustment" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAdjust(null)}>Cancel</Button>
            <Button onClick={handleAdjust}>Apply Adjustment</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showHistory} onClose={() => setShowHistory(null)} title="Stock Movement History" size="lg">
        <div className="space-y-2">
          {movements.length === 0 ? <p className="text-gray-500 text-center py-8">No movements found</p> : movements.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{m.type}</p>
                <p className="text-xs text-gray-500">{m.reference} • {m.performedBy}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</p>
                <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
