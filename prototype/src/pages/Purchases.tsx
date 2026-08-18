import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, StatCard, SearchInput, Icon, showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';
import { cn } from '../utils/cn';

export default function Purchases() {
  const { purchases, suppliers, products, settings, currentUser, addPurchase } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewPurchase, setViewPurchase] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [newSupplier, setNewSupplier] = useState('');
  const [newItems, setNewItems] = useState<{ productId: string; quantity: string; unitCost: string }[]>([
    { productId: '', quantity: '1', unitCost: '' },
  ]);
  const [newNotes, setNewNotes] = useState('');

  const canCreate = hasPermission(currentUser!, 'purchases', 'create');

  const totalValue = useMemo(
    () => purchases.filter(p => p.status === 'completed').reduce((s, p) => s + p.total, 0),
    [purchases]
  );
  const pendingCount = useMemo(
    () => purchases.filter(p => p.status === 'pending').length,
    [purchases]
  );

  const filtered = useMemo(() => {
    return purchases.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = p.purchaseNo.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [purchases, search, statusFilter]);

  const addItem = () => setNewItems(prev => [...prev, { productId: '', quantity: '1', unitCost: '' }]);
  const removeItem = (i: number) => setNewItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    setNewItems(prev =>
      prev.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const pr = products.find(p => p.id === value);
          if (pr) updated.unitCost = String(pr.costPrice);
        }
        return updated;
      })
    );
  };

  const newSubtotal = useMemo(() => {
    return newItems.reduce((s, item) => s + (parseFloat(item.unitCost) || 0) * (parseInt(item.quantity) || 0), 0);
  }, [newItems]);
  const newTax = newSubtotal * (settings.taxRate / 100);
  const newTotal = newSubtotal + newTax;

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier || newItems.length === 0 || newItems.some(i => !i.productId || !i.quantity)) {
      showToast('error', 'Please select a supplier and fill product quantities');
      return;
    }
    const supplier = suppliers.find(s => s.id === newSupplier);
    addPurchase({
      supplierId: newSupplier,
      supplierName: supplier?.name || '',
      items: newItems.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const qty = parseInt(item.quantity) || 1;
        const cost = parseFloat(item.unitCost) || product.costPrice;
        return {
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: qty,
          unitCost: cost,
          tax: cost * qty * (settings.taxRate / 100),
          total: cost * qty * (1 + settings.taxRate / 100),
        };
      }),
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
      status: 'completed',
      receivedBy: currentUser?.name || 'Staff',
      notes: newNotes,
    });

    showToast('success', 'Purchase order created and stock replenished');
    setShowCreate(false);
    setNewSupplier('');
    setNewItems([{ productId: '', quantity: '1', unitCost: '' }]);
    setNewNotes('');
  };

  const detail = viewPurchase ? purchases.find(p => p.id === viewPurchase) : null;

  return (
    <div className="page-anim">
      {/* Page Title */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Purchasing & Vendor Orders</h1>
          <p className="page-sub">
            Inbound stock orders, supplier procurement, and delivery receipts
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" icon="plus" onClick={() => setShowCreate(true)}>
            Create Purchase Order
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid kpis">
        <StatCard
          label="Total Procurement"
          value={formatCurrency(totalValue, settings.currencySymbol)}
          sub="Delivered stock valuation"
          icon="dollar"
        />
        <StatCard
          label="Purchase Orders"
          value={purchases.length.toLocaleString()}
          sub={`${purchases.filter(p => p.status === 'completed').length} received`}
          icon="truck"
        />
        <StatCard
          label="Completed Orders"
          value={String(purchases.filter(p => p.status === 'completed').length)}
          changeType="up"
          icon="check"
        />
        <StatCard
          label="Pending Deliveries"
          value={String(pendingCount)}
          change={pendingCount > 0 ? 'Awaiting arrival' : 'All clear'}
          changeType={pendingCount > 0 ? 'down' : 'up'}
          icon="clock"
        />
      </div>

      {/* Purchases Table Card */}
      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search PO number or supplier name..."
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed / Received</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date Ordered</th>
                <th className="num">SKUs</th>
                <th className="num">Total Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(purchase => (
                <tr
                  key={purchase.id}
                  className="clickable"
                  onClick={() => setViewPurchase(purchase.id)}
                >
                  <td className="font-semibold text-accent-text">{purchase.purchaseNo}</td>
                  <td>
                    <div className="cell-main">{purchase.supplierName}</div>
                    <div className="cell-sub">Received by: {purchase.receivedBy || 'Staff'}</div>
                  </td>
                  <td className="text-muted text-xs">{formatDate(purchase.date)}</td>
                  <td className="num font-semibold text-muted">{purchase.items.length}</td>
                  <td className="num font-extrabold text-text">
                    {formatCurrency(purchase.total, settings.currencySymbol)}
                  </td>
                  <td>
                    <Badge variant={purchase.status === 'completed' ? 'success' : purchase.status === 'pending' ? 'warning' : 'danger'}>
                      {purchase.status === 'completed' ? 'Received' : purchase.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setViewPurchase(purchase.id);
                      }}
                      className="icon-btn sm"
                      title="View Details"
                    >
                      <Icon name="eye" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="cards-list">
          {filtered.map(purchase => (
            <div
              key={purchase.id}
              className="m-card"
              onClick={() => setViewPurchase(purchase.id)}
            >
              <div className="mc-top">
                <span className="font-bold text-accent-text">{purchase.purchaseNo}</span>
                <Badge variant={purchase.status === 'completed' ? 'success' : purchase.status === 'pending' ? 'warning' : 'danger'}>
                  {purchase.status === 'completed' ? 'Received' : purchase.status}
                </Badge>
              </div>
              <div className="mc-sub">
                <span>{purchase.supplierName}</span>
                <span className="font-extrabold text-text">
                  {formatCurrency(purchase.total, settings.currencySymbol)}
                </span>
              </div>
              <div className="text-[11px] text-muted flex justify-between">
                <span>{formatDate(purchase.date)}</span>
                <span>{purchase.items.length} product(s)</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="truck" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No purchase records found</p>
            <p className="text-xs text-muted">Try changing your search keywords.</p>
          </div>
        )}
      </Card>

      {/* Create Purchase Order Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Inbound Purchase Order"
        subtitle="Select vendor and items to replenish hardware stock"
        size="lg"
      >
        <form onSubmit={handleCreatePurchase} className="page-anim">
          <Select
            label="Vendor / Supplier"
            required
            value={newSupplier}
            onChange={e => setNewSupplier(e.target.value)}
            options={[
              { value: '', label: 'Select Preferred Supplier' },
              ...suppliers.filter(s => s.status === 'active').map(s => ({ value: s.id, label: s.name })),
            ]}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="f-label mb-0">Order Line Items</label>
              <Button type="button" size="sm" variant="outline" icon="plus" onClick={addItem}>
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {newItems.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center p-2.5 bg-field rounded-xl border border-border">
                  <div className="flex-1">
                    <select
                      value={it.productId}
                      onChange={e => updateItem(idx, 'productId', e.target.value)}
                      className="input text-xs"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      className="input text-xs text-center"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={it.unitCost}
                      onChange={e => updateItem(idx, 'unitCost', e.target.value)}
                      className="input text-xs text-right"
                    />
                  </div>

                  {newItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="icon-btn sm text-danger"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Internal Notes / Shipping Reference"
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            placeholder="e.g. Delivery via Northline Express truck #4"
          />

          {/* Calculations Summary */}
          <div className="p-3.5 rounded-xl bg-field border border-border space-y-1 text-xs">
            <div className="flex justify-between text-muted">
              <span>Subtotal:</span>
              <span className="text-text font-medium">{formatCurrency(newSubtotal, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{settings.taxLabel} ({settings.taxRate}%):</span>
              <span className="text-text font-medium">{formatCurrency(newTax, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-text pt-1.5 border-t border-border">
              <span>Total Cost:</span>
              <span className="text-accent-text">{formatCurrency(newTotal, settings.currencySymbol)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon="check">
              Create & Receive PO
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Details Modal */}
      <Modal
        open={!!detail}
        onClose={() => setViewPurchase(null)}
        title={`Purchase Order ${detail?.purchaseNo || ''}`}
        subtitle={detail ? `Received from ${detail.supplierName}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewPurchase(null)}>
              Close
            </Button>
            <Button
              variant="outline"
              icon="print"
              onClick={() => showToast('info', 'Printing Purchase Order...')}
            >
              Print PO
            </Button>
          </>
        }
      >
        {detail && (
          <div className="page-anim">
            <div className="grid kpis">
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Supplier</span>
                <span className="font-semibold">{detail.supplierName}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Received Date</span>
                <span className="font-semibold">{formatDate(detail.date)}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Received By</span>
                <span className="font-semibold">{detail.receivedBy || 'Staff'}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Status</span>
                <Badge variant={detail.status === 'completed' ? 'success' : 'warning'}>
                  {detail.status === 'completed' ? 'Received' : detail.status}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted uppercase mb-2">Purchased Items</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Quantity</th>
                      <th className="num">Unit Cost</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="font-medium text-text">{it.productName}</td>
                        <td className="num">{it.quantity}</td>
                        <td className="num">{formatCurrency(it.unitCost, settings.currencySymbol)}</td>
                        <td className="num font-bold text-accent-text">
                          {formatCurrency(it.total, settings.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-field border border-border space-y-1 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal:</span>
                <span>{formatCurrency(detail.subtotal, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{settings.taxLabel}:</span>
                <span>{formatCurrency(detail.tax, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-text pt-1.5 border-t border-border">
                <span>Total PO Amount:</span>
                <span className="text-accent-text">{formatCurrency(detail.total, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
