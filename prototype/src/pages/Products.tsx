import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Textarea, Badge, Modal, Card, SearchInput, ConfirmDialog, Icon, showToast } from '../components/ui';
import { formatCurrency, hasPermission } from '../utils/permissions';
import { cn } from '../utils/cn';

const CAT_COLORS: Record<string, string> = {
  Plumbing: '#2563eb',
  Electrical: '#16a34a',
  Tools: '#9333ea',
  Construction: '#d97706',
  Paint: '#0284c7',
  Hardware: '#4560e6',
  Safety: '#e11d48',
  Fasteners: '#64748b',
};

export default function Products() {
  const { products, suppliers, settings, currentUser, addProduct, updateProduct, deleteProduct } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'sellingPrice' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Hardware',
    brand: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    tax: '10',
    stock: '',
    minStock: '',
    supplierId: '',
    status: 'active' as 'active' | 'inactive',
  });

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))].sort(), [products]);
  const canCreate = hasPermission(currentUser!, 'products', 'create');
  const canEdit = hasPermission(currentUser!, 'products', 'edit');
  const canDelete = hasPermission(currentUser!, 'products', 'delete');

  const filtered = useMemo(() => {
    return products
      .filter(p => {
        const s = search.toLowerCase();
        return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.barcode && p.barcode.toLowerCase().includes(s)) || (p.brand && p.brand.toLowerCase().includes(s));
      })
      .filter(p => categoryFilter === 'All' || p.category === categoryFilter)
      .filter(p => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'In Stock') return p.stock > p.minStock;
        if (statusFilter === 'Low Stock') return p.stock > 0 && p.stock <= p.minStock;
        if (statusFilter === 'Out of Stock') return p.stock === 0;
        return true;
      })
      .sort((a, b) => {
        const mult = sortDir === 'asc' ? 1 : -1;
        if (sortField === 'name') return mult * a.name.localeCompare(b.name);
        return mult * (a[sortField] - b[sortField]);
      });
  }, [products, search, categoryFilter, statusFilter, sortField, sortDir]);

  const openForm = (id?: string) => {
    if (id) {
      const p = products.find(pr => pr.id === id)!;
      setEditProduct(id);
      setFormData({
        name: p.name,
        sku: p.sku,
        barcode: p.barcode || '',
        category: p.category || 'Hardware',
        brand: p.brand || '',
        description: p.description || '',
        costPrice: String(p.costPrice || ''),
        sellingPrice: String(p.sellingPrice || ''),
        tax: String(p.tax || '10'),
        stock: String(p.stock || '0'),
        minStock: String(p.minStock || '5'),
        supplierId: p.supplierId || '',
        status: p.status,
      });
    } else {
      setEditProduct(null);
      setFormData({
        name: '',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: '',
        category: 'Hardware',
        brand: '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        tax: String(settings.taxRate || '10'),
        stock: '10',
        minStock: '5',
        supplierId: '',
        status: 'active',
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.sellingPrice) {
      showToast('error', 'Please fill in all required fields');
      return;
    }
    const data = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode,
      category: formData.category,
      brand: formData.brand,
      description: formData.description,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      tax: parseFloat(formData.tax) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      supplierId: formData.supplierId,
      status: formData.status,
    };

    if (editProduct) {
      updateProduct(editProduct, data);
      showToast('success', 'Product updated successfully');
    } else {
      addProduct(data);
      showToast('success', 'Product added to catalog');
    }
    setShowForm(false);
  };

  const detail = viewProduct ? products.find(p => p.id === viewProduct) : null;

  return (
    <div className="page-anim">
      {/* Page Header */}
      <div className="page-head mb-6">
        <div>
          <h1 className="page-title text-[22px] font-bold tracking-tight">Products</h1>
          <p className="page-sub text-muted font-medium mt-1">
            {products.length} items in catalog
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" icon="plus" onClick={() => openForm()} className="h-9 px-4 rounded-lg font-medium shadow-sm">
            Add product
          </Button>
        )}
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-transparent mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-[320px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, SKU, barcode..."
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input text-[13px] font-medium bg-field border-border h-[38px] px-3 py-0 rounded-lg min-w-[140px]"
            >
              <option value="All">All categories</option>
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input text-[13px] font-medium bg-field border-border h-[38px] px-3 py-0 rounded-lg min-w-[140px]"
            >
              <option value="All">All statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden border-border/60 shadow-sm">
        {/* Desktop Table View */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr className="border-b border-border/50">
                <th
                  className="sortable text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4"
                  onClick={() => {
                    setSortField('name');
                    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                  }}
                >
                  Product {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4">SKU</th>
                <th className="text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4">Barcode</th>
                <th className="text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4">Category</th>
                <th
                  className="num sortable text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4"
                  onClick={() => {
                    setSortField('sellingPrice');
                    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                  }}
                >
                  Selling {sortField === 'sellingPrice' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="num text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4">Cost</th>
                <th
                  className="num sortable text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4"
                  onClick={() => {
                    setSortField('stock');
                    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                  }}
                >
                  Stock {sortField === 'stock' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-[10.5px] uppercase tracking-widest text-muted font-bold py-3 px-4">Status</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const catColor = CAT_COLORS[p.category || 'Other'] || '#2563eb';
                const isOut = p.stock === 0;
                const isLow = p.stock <= p.minStock && p.stock > 0;
                
                const words = p.name.split(' ').filter(Boolean);
                const initials = (words[0]?.[0] || '') + (words[1]?.[0] || '');

                return (
                  <tr key={p.id} className="hover:bg-hover group transition-colors border-b border-border/40 last:border-0">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-[32px] h-[32px] rounded text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm"
                          style={{ backgroundColor: catColor }}
                        >
                          {initials.toUpperCase() || '?'}
                        </div>
                        <div className="flex items-baseline gap-1.5 truncate max-w-[280px]">
                          <span className="font-semibold text-[13.5px] text-text">{p.name}</span>
                          {p.brand && <span className="text-[12.5px] text-muted font-medium">{p.brand}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[12.5px] text-muted px-4 py-2.5">{p.sku}</td>
                    <td className="font-mono text-[12.5px] text-muted px-4 py-2.5">{p.barcode || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td className="num font-bold text-[13.5px] text-text px-4 py-2.5">
                      {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                    </td>
                    <td className="num font-medium text-[13px] text-muted px-4 py-2.5">
                      {formatCurrency(p.costPrice, settings.currencySymbol)}
                    </td>
                    <td className="num font-bold text-[13.5px] text-text px-4 py-2.5">
                      {p.stock}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide", isOut ? 'bg-[var(--danger-bg)] text-[var(--danger)]' : isLow ? 'bg-[var(--warning-bg)] text-[var(--warning)]' : 'bg-[var(--success-bg)] text-[var(--success)]')}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="text-right px-4 py-2.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="row-actions justify-end gap-1">
                        {canEdit && (
                          <button
                            onClick={() => openForm(p.id)}
                            className="p-1.5 rounded hover:bg-hover text-muted hover:text-text transition-colors"
                            title="Edit"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(p.id)}
                            className="p-1.5 rounded hover:bg-hover text-muted hover:text-danger transition-colors"
                            title="Delete"
                          >
                            <Icon name="trash" size={14} />
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

        {/* Mobile Responsive Cards List */}
        <div className="cards-list">
          {filtered.map(p => (
            <div
              key={p.id}
              className="m-card"
              onClick={() => setViewProduct(p.id)}
            >
              <div className="mc-top">
                <div className="cell-main">{p.name}</div>
                <Badge variant={p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success'}>
                  {p.stock === 0 ? 'Out' : `${p.stock} in stock`}
                </Badge>
              </div>
              <div className="mc-sub">
                <span className="font-mono">{p.sku}</span>
                <span className="font-bold text-accent-text">
                  {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="box" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No products found</p>
            <p className="text-xs text-muted">Try changing your search terms or filter selection.</p>
          </div>
        )}
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Specify product attributes, pricing tiers, and stock limits"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="page-anim">
          <div className="form-row">
            <Input
              label="Product Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Copper Pipe 15mm 3m"
            />
            <Input
              label="SKU / Item Code"
              required
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. PLUMB-1001"
            />
          </div>

          <div className="form-row">
            <Input
              label="Barcode / EAN"
              value={formData.barcode}
              onChange={e => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Scan or enter barcode"
            />
            <Input
              label="Category"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="Plumbing, Electrical, Tools..."
            />
          </div>

          <div className="form-row">
            <Input
              label="Brand / Manufacturer"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. Stanley, Bosch, Generic"
            />
            <Select
              label="Supplier"
              value={formData.supplierId}
              onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
              options={[
                { value: '', label: 'Select Preferred Supplier' },
                ...suppliers.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="form-row">
            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Selling Price"
              required
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="form-row">
            <Input
              label="Opening Stock"
              type="number"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Minimum Stock Threshold"
              type="number"
              value={formData.minStock}
              onChange={e => setFormData({ ...formData, minStock: e.target.value })}
              placeholder="5"
            />
          </div>

          <div className="form-row">
            <Input
              label={`Tax Rate (${settings.taxLabel} %)`}
              type="number"
              value={formData.tax}
              onChange={e => setFormData({ ...formData, tax: e.target.value })}
            />
            <Select
              label="Catalog Status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              options={[
                { value: 'active', label: 'Active (Available in POS)' },
                { value: 'inactive', label: 'Inactive (Hidden)' },
              ]}
            />
          </div>

          <Textarea
            label="Product Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Specifications, size dimensions, warranty notes..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setViewProduct(null)}
        title="Product Profile"
        subtitle={detail?.name}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewProduct(null)}>
              Close
            </Button>
            {canEdit && detail && (
              <Button
                variant="primary"
                icon="edit"
                onClick={() => {
                  const id = detail.id;
                  setViewProduct(null);
                  openForm(id);
                }}
              >
                Edit Product
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="page-anim">
            <div className="grid kpis">
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">SKU Code</span>
                <span className="font-mono font-semibold">{detail.sku}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Category</span>
                <span className="font-semibold">{detail.category || 'General'}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Selling Price</span>
                <span className="font-extrabold text-accent-text text-base">
                  {formatCurrency(detail.sellingPrice, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Cost Price</span>
                <span className="font-semibold">
                  {formatCurrency(detail.costPrice, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Current Stock</span>
                <span className={cn('font-bold', detail.stock <= detail.minStock ? 'text-warning' : 'text-success')}>
                  {detail.stock} units
                </span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Min Alert Level</span>
                <span className="font-semibold">{detail.minStock} units</span>
              </div>
            </div>

            {detail.description && (
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block mb-1">Description</span>
                <p className="text-sm text-text leading-relaxed">{detail.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteProduct(confirmDelete);
            showToast('success', 'Product removed from catalog');
          }
        }}
        title="Delete Product"
        message="Are you sure you want to delete this product? It will be removed from your catalog and POS terminal."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
