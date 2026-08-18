import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, StatCard, SearchInput, Chips, Icon, showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';
import { cn } from '../utils/cn';

const ADJUST_REASONS = [
  'Recount / Cycle count',
  'Damaged goods',
  'Expired goods',
  'Customer return',
  'Supplier return',
  'Data entry error',
  'Other',
];

export default function Inventory() {
  const { products, settings, currentUser, stockMovements, adjustStock } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState(ADJUST_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const canEdit = hasPermission(currentUser!, 'inventory', 'edit');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const s = search.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
      if (!matchesSearch) return false;
      if (statusFilter === 'low') return p.stock > 0 && p.stock <= p.minStock;
      if (statusFilter === 'out') return p.stock === 0;
      if (statusFilter === 'in') return p.stock > p.minStock;
      return true;
    });
  }, [products, search, statusFilter]);

  const totalCostValue = useMemo(() => products.reduce((s, p) => s + p.stock * p.costPrice, 0), [products]);
  const totalRetailValue = useMemo(() => products.reduce((s, p) => s + p.stock * p.sellingPrice, 0), [products]);
  const lowStock = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock).length, [products]);
  const outOfStock = useMemo(() => products.filter(p => p.stock === 0).length, [products]);

  const handleAdjust = () => {
    if (!showAdjust || !adjustQty) {
      showToast('error', 'Please enter a valid quantity adjustment');
      return;
    }
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty === 0) {
      showToast('error', 'Quantity adjustment must be non-zero');
      return;
    }
    const finalReason = adjustReason === 'Other' ? customReason || 'Manual adjustment' : adjustReason;
    adjustStock(showAdjust, qty, finalReason);
    showToast('success', 'Stock level updated successfully');
    setShowAdjust(null);
    setAdjustQty('');
    setAdjustReason(ADJUST_REASONS[0]);
    setCustomReason('');
  };

  const selectedProduct = showAdjust ? products.find(p => p.id === showAdjust) : null;
  const historyProduct = showHistory ? products.find(p => p.id === showHistory) : null;
  const movements = showHistory ? stockMovements.filter(m => m.productId === showHistory).slice(0, 30) : [];

  return (
    <div className="page-anim">
      {/* Page Title */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Inventory Control</h1>
          <p className="page-sub">
            Real-time stock valuation, inventory adjustments, and warehouse tracking
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid kpis">
        <StatCard
          label="Stock Valuation (Cost)"
          value={formatCurrency(totalCostValue, settings.currencySymbol)}
          sub={`Retail: ${formatCurrency(totalRetailValue, settings.currencySymbol)}`}
          icon="dollar"
        />
        <StatCard
          label="Total SKUs"
          value={products.length.toLocaleString()}
          sub={`${products.filter(p => p.stock > p.minStock).length} in healthy stock`}
          icon="layers"
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStock)}
          change={lowStock > 0 ? 'Requires Restock' : 'Optimal'}
          changeType={lowStock > 0 ? 'down' : 'up'}
          icon="alert"
        />
        <StatCard
          label="Out of Stock"
          value={String(outOfStock)}
          change={outOfStock > 0 ? 'Critical Shortage' : 'None'}
          changeType={outOfStock > 0 ? 'down' : 'up'}
          icon="box"
        />
      </div>

      {/* Main Table Card */}
      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product name or SKU..."
            className="flex-1"
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Chips
              options={[
                { id: 'all', label: 'All Items' },
                { id: 'in', label: 'In Stock' },
                { id: 'low', label: 'Low Stock' },
                { id: 'out', label: 'Out of Stock' },
              ]}
              active={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="num">Available</th>
                <th className="num">Min Alert</th>
                <th className="num">Cost Value</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isOut = p.stock === 0;
                const isLow = p.stock <= p.minStock && p.stock > 0;
                return (
                  <tr key={p.id} className="hover:bg-hover">
                    <td>
                      <div className="cell-main">{p.name}</div>
                      <div className="cell-sub">{p.category || 'General'}</div>
                    </td>
                    <td className="font-mono text-xs text-muted">{p.sku}</td>
                    <td className="num font-bold text-base">
                      <span className={isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-text'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="num text-muted font-medium">{p.minStock}</td>
                    <td className="num font-semibold text-text">
                      {formatCurrency(p.stock * p.costPrice, settings.currencySymbol)}
                    </td>
                    <td>
                      <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAdjust(p.id)}
                          >
                            Adjust
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowHistory(p.id)}
                        >
                          History
                        </Button>
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
          {filtered.map(p => (
            <div key={p.id} className="m-card">
              <div className="mc-top">
                <div className="cell-main">{p.name}</div>
                <Badge variant={p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success'}>
                  {p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
                </Badge>
              </div>
              <div className="mc-sub">
                <span className="font-mono">{p.sku}</span>
                <span>Valuation: {formatCurrency(p.stock * p.costPrice, settings.currencySymbol)}</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAdjust(p.id)}
                  >
                    Adjust Stock
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowHistory(p.id)}
                >
                  Movement Log
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="layers" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No inventory records found</p>
            <p className="text-xs text-muted">Adjust search keywords or stock filter criteria.</p>
          </div>
        )}
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        open={!!showAdjust}
        onClose={() => setShowAdjust(null)}
        title="Inventory Stock Adjustment"
        subtitle={selectedProduct ? `${selectedProduct.name} (Current: ${selectedProduct.stock} units)` : ''}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdjust(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdjust} icon="check">
              Apply Adjustment
            </Button>
          </>
        }
      >
        {selectedProduct && (
          <div className="page-anim">
            <div className="p-3 bg-field rounded-xl border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted block">SKU Code</span>
                <span className="font-mono font-semibold">{selectedProduct.sku}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted block">Current Stock</span>
                <span className="font-bold text-base">{selectedProduct.stock} units</span>
              </div>
            </div>

            <Input
              label="Quantity Adjustment (Use '+' to add, '-' to reduce)"
              type="number"
              value={adjustQty}
              onChange={e => setAdjustQty(e.target.value)}
              placeholder="e.g. 10 or -5"
              autoFocus
            />

            <div>
              <label className="f-label">Adjustment Reason</label>
              <div className="chips mb-2">
                {ADJUST_REASONS.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAdjustReason(reason)}
                    className={cn('chip text-xs', adjustReason === reason && 'active')}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {adjustReason === 'Other' && (
                <Input
                  placeholder="Specify custom reason..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                />
              )}
            </div>

            {adjustQty && !isNaN(parseInt(adjustQty)) && (
              <div className="p-3 rounded-xl bg-accent-soft border border-accent-ring text-accent-text text-sm flex items-center justify-between">
                <span>Updated Stock Level:</span>
                <span className="font-extrabold text-base">
                  {Math.max(0, selectedProduct.stock + parseInt(adjustQty))} units
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Stock Movement History Modal */}
      <Modal
        open={!!showHistory}
        onClose={() => setShowHistory(null)}
        title="Stock Movement Log"
        subtitle={historyProduct ? historyProduct.name : ''}
        size="lg"
      >
        <div className="page-anim">
          {movements.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <Icon name="clock" size={28} className="mx-auto mb-2 text-muted2" />
              <p className="font-semibold text-sm">No recorded movements</p>
              <p className="text-xs text-muted">Stock movements will appear when sales, purchases, or adjustments occur.</p>
            </div>
          ) : (
            <div className="tbl-wrap max-h-80 overflow-y-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Auditor</th>
                    <th>Date</th>
                    <th className="num">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id}>
                        <td>
                          <Badge variant={m.type === 'sale' ? 'default' : m.type === 'purchase' ? 'success' : 'warning'}>
                            {m.type}
                          </Badge>
                        </td>
                        <td className="font-mono text-xs">{m.reference}</td>
                        <td className="text-muted text-xs">{m.performedBy}</td>
                        <td className="text-muted text-xs">{formatDate(m.date)}</td>
                        <td className={cn('num font-bold text-sm', isPositive ? 'text-success' : 'text-danger')}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
