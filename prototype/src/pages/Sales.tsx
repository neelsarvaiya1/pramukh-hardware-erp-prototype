import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge, Modal, Card, StatCard, SearchInput, Button, Icon, showToast } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/permissions';
import { cn } from '../utils/cn';

export default function Sales() {
  const { sales, settings } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [viewSale, setViewSale] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const completedSales = useMemo(() => sales.filter(s => s.status === 'completed'), [sales]);
  const todaySales = useMemo(() => completedSales.filter(s => s.date.startsWith(todayStr)), [completedSales, todayStr]);
  const todayRevenue = useMemo(() => todaySales.reduce((sum, s) => sum + s.total, 0), [todaySales]);

  const weekSales = useMemo(() => {
    const now = new Date().getTime();
    return completedSales.filter(s => (now - new Date(s.date).getTime()) < 7 * 86400000);
  }, [completedSales]);
  const weekRevenue = useMemo(() => weekSales.reduce((sum, s) => sum + s.total, 0), [weekSales]);

  const avgOrder = useMemo(
    () => (completedSales.length > 0 ? completedSales.reduce((sum, s) => sum + s.total, 0) / completedSales.length : 0),
    [completedSales]
  );

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const q = search.toLowerCase();
      if (search && !s.invoiceNo.toLowerCase().includes(q) && !s.customerName.toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [sales, search, statusFilter, paymentFilter]);

  const detail = viewSale ? sales.find(s => s.id === viewSale) : null;

  return (
    <div className="page-anim">
      {/* Page Title */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Sales & Billing Ledger</h1>
          <p className="page-sub">
            Transaction history, finalized POS receipts, and invoice records
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid kpis">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(todayRevenue, settings.currencySymbol)}
          change={`${todaySales.length} orders today`}
          changeType="up"
          icon="dollar"
        />
        <StatCard
          label="Weekly Revenue"
          value={formatCurrency(weekRevenue, settings.currencySymbol)}
          change={`${weekSales.length} orders this week`}
          changeType="up"
          icon="trending-up"
        />
        <StatCard
          label="Total Invoices"
          value={sales.length.toLocaleString()}
          sub="All-time transactions"
          icon="receipt"
        />
        <StatCard
          label="Completed"
          value={completedSales.length.toLocaleString()}
          changeType="up"
          icon="check"
        />
        <StatCard
          label="Average Ticket"
          value={formatCurrency(avgOrder, settings.currencySymbol)}
          sub="Per completed order"
          icon="chart"
        />
      </div>

      {/* Sales Table Card */}
      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search invoice number or customer..."
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="input text-xs font-semibold"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_payment">Mobile Payment</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th className="num">Items</th>
                <th className="num">Grand Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr
                  key={sale.id}
                  className="clickable"
                  onClick={() => setViewSale(sale.id)}
                >
                  <td className="font-semibold text-accent-text">{sale.invoiceNo}</td>
                  <td>
                    <div className="cell-main">{sale.customerName}</div>
                    <div className="cell-sub">Cashier: {sale.cashierName}</div>
                  </td>
                  <td className="text-muted text-xs">{formatDate(sale.date)}</td>
                  <td className="num text-muted font-semibold">{sale.items.length}</td>
                  <td className="num font-extrabold text-text">
                    {formatCurrency(sale.total, settings.currencySymbol)}
                  </td>
                  <td>
                    <span className="badge b-gray capitalize">
                      {sale.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'danger'}>
                      {sale.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setViewSale(sale.id);
                      }}
                      className="icon-btn sm"
                      title="View Invoice"
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
          {filtered.map(sale => (
            <div
              key={sale.id}
              className="m-card"
              onClick={() => setViewSale(sale.id)}
            >
              <div className="mc-top">
                <span className="font-bold text-accent-text">{sale.invoiceNo}</span>
                <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'danger'}>
                  {sale.status}
                </Badge>
              </div>
              <div className="mc-sub">
                <span>{sale.customerName}</span>
                <span className="font-extrabold text-text">
                  {formatCurrency(sale.total, settings.currencySymbol)}
                </span>
              </div>
              <div className="text-[11px] text-muted flex justify-between">
                <span>{formatDate(sale.date)}</span>
                <span className="capitalize">{sale.paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="receipt" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No sales records found</p>
            <p className="text-xs text-muted">Try adjusting search filters.</p>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setViewSale(null)}
        title={`Invoice ${detail?.invoiceNo || ''}`}
        subtitle={detail ? `Processed on ${formatDate(detail.date)}` : ''}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              icon="print"
              onClick={() => showToast('info', 'Printing invoice...')}
            >
              Print Invoice
            </Button>
            <Button
              variant="primary"
              onClick={() => setViewSale(null)}
            >
              Done
            </Button>
          </>
        }
      >
        {detail && (
          <div className="page-anim">
            <div className="grid kpis">
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Customer</span>
                <span className="font-semibold">{detail.customerName}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Cashier</span>
                <span className="font-semibold">{detail.cashierName}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Payment Method</span>
                <span className="font-semibold capitalize">{detail.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Status</span>
                <Badge variant={detail.status === 'completed' ? 'success' : detail.status === 'pending' ? 'warning' : 'danger'}>
                  {detail.status}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted uppercase mb-2">Itemized Products</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Quantity</th>
                      <th className="num">Unit Price</th>
                      <th className="num">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="font-medium text-text">{it.productName}</td>
                        <td className="num">{it.quantity}</td>
                        <td className="num">{formatCurrency(it.unitPrice, settings.currencySymbol)}</td>
                        <td className="num font-bold text-accent-text">
                          {formatCurrency(it.total, settings.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-xl bg-field border border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-text font-medium">{formatCurrency(detail.subtotal, settings.currencySymbol)}</span>
              </div>
              {detail.discount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Discount Applied</span>
                  <span>-{formatCurrency(detail.discount, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>{settings.taxLabel}</span>
                <span className="text-text font-medium">{formatCurrency(detail.tax, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-text pt-2 border-t border-border">
                <span>Grand Total</span>
                <span className="text-accent-text">{formatCurrency(detail.total, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
