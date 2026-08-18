import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, SearchInput, ConfirmDialog } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency, hasPermission } from '../utils/permissions';

export default function Products() {
  const { products, suppliers, settings, currentUser, addProduct, updateProduct, deleteProduct } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'sellingPrice' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', category: '', brand: '', description: '',
    costPrice: '', sellingPrice: '', tax: '10', stock: '', minStock: '', supplierId: '', status: 'active' as 'active' | 'inactive',
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))].sort();
  const canCreate = hasPermission(currentUser!, 'products', 'create');
  const canEdit = hasPermission(currentUser!, 'products', 'edit');
  const canDelete = hasPermission(currentUser!, 'products', 'delete');

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    .filter(p => categoryFilter === 'All' || p.category === categoryFilter)
    .sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mult * a.name.localeCompare(b.name);
      return mult * (a[sortField] - b[sortField]);
    });

  const openForm = (id?: string) => {
    if (id) {
      const p = products.find(pr => pr.id === id)!;
      setEditProduct(id);
      setFormData({
        name: p.name, sku: p.sku, barcode: p.barcode, category: p.category, brand: p.brand,
        description: p.description, costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice),
        tax: String(p.tax), stock: String(p.stock), minStock: String(p.minStock), supplierId: p.supplierId, status: p.status,
      });
    } else {
      setEditProduct(null);
      setFormData({ name: '', sku: '', barcode: '', category: '', brand: '', description: '', costPrice: '', sellingPrice: '', tax: '10', stock: '', minStock: '', supplierId: '', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.sellingPrice) { showToast('error', 'Please fill required fields'); return; }
    const data = {
      name: formData.name, sku: formData.sku, barcode: formData.barcode, category: formData.category, brand: formData.brand,
      description: formData.description, costPrice: parseFloat(formData.costPrice) || 0, sellingPrice: parseFloat(formData.sellingPrice) || 0,
      tax: parseFloat(formData.tax) || 0, stock: parseInt(formData.stock) || 0, minStock: parseInt(formData.minStock) || 0,
      supplierId: formData.supplierId, status: formData.status,
    };
    if (editProduct) { updateProduct(editProduct, data); showToast('success', 'Product updated successfully'); }
    else { addProduct(data); showToast('success', 'Product added successfully'); }
    setShowForm(false);
  };

  const detail = viewProduct ? products.find(p => p.id === viewProduct) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} total products</p>
        </div>
        {canCreate && <Button onClick={() => openForm()}>+ Add Product</Button>}
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="flex-1" />
          <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={categories.map(c => ({ value: c, label: c }))} className="w-40" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Product</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => { setSortField('sellingPrice'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Price</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => { setSortField('stock'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Stock</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.brand}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{product.sku}</td>
                  <td className="py-3 px-4 text-gray-600">{product.category}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(product.sellingPrice, settings.currencySymbol)}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= product.minStock ? 'text-amber-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={product.stock === 0 ? 'danger' : product.stock <= product.minStock ? 'warning' : 'success'}>
                      {product.stock === 0 ? 'Out of Stock' : product.stock <= product.minStock ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewProduct(product.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="View">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {canEdit && <button onClick={() => openForm(product.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>}
                      {canDelete && <button onClick={() => setConfirmDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-gray-400"><p>No products found</p></div>}
        </div>
      </Card>

      {/* Add/Edit Form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Product Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="SKU *" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required />
            <Input label="Barcode" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
            <Input label="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            <Input label="Brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
            <Select label="Supplier" value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })} options={[{ value: '', label: 'Select supplier' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} />
            <Input label="Cost Price" type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
            <Input label="Selling Price *" type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} required />
            <Input label={`Tax (${settings.taxLabel} %)`} type="number" step="0.01" value={formData.tax} onChange={e => setFormData({ ...formData, tax: e.target.value })} />
            <Input label="Opening Stock" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
            <Input label="Minimum Stock" type="number" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
            <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">{editProduct ? 'Update Product' : 'Add Product'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Detail */}
      <Modal open={!!detail} onClose={() => setViewProduct(null)} title="Product Details" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{detail.name}</p></div>
              <div><p className="text-xs text-gray-500">SKU</p><p className="font-mono">{detail.sku}</p></div>
              <div><p className="text-xs text-gray-500">Barcode</p><p className="font-mono">{detail.barcode}</p></div>
              <div><p className="text-xs text-gray-500">Category</p><p>{detail.category}</p></div>
              <div><p className="text-xs text-gray-500">Brand</p><p>{detail.brand}</p></div>
              <div><p className="text-xs text-gray-500">Supplier</p><p>{suppliers.find(s => s.id === detail.supplierId)?.name || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Cost Price</p><p>{formatCurrency(detail.costPrice, settings.currencySymbol)}</p></div>
              <div><p className="text-xs text-gray-500">Selling Price</p><p className="font-bold">{formatCurrency(detail.sellingPrice, settings.currencySymbol)}</p></div>
              <div><p className="text-xs text-gray-500">Current Stock</p><p className={`font-bold ${detail.stock <= detail.minStock ? 'text-red-600' : ''}`}>{detail.stock}</p></div>
              <div><p className="text-xs text-gray-500">Minimum Stock</p><p>{detail.minStock}</p></div>
              <div><p className="text-xs text-gray-500">Profit Margin</p><p className="text-emerald-600 font-medium">{formatCurrency(detail.sellingPrice - detail.costPrice, settings.currencySymbol)} ({detail.costPrice > 0 ? (((detail.sellingPrice - detail.costPrice) / detail.costPrice) * 100).toFixed(1) : 0}%)</p></div>
              <div><p className="text-xs text-gray-500">Status</p><Badge variant={detail.status === 'active' ? 'success' : 'default'}>{detail.status}</Badge></div>
            </div>
            {detail.description && <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-gray-700">{detail.description}</p></div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteProduct(confirmDelete); showToast('success', 'Product deleted'); } }} title="Delete Product" message="Are you sure? This action cannot be undone." />
    </div>
  );
}
