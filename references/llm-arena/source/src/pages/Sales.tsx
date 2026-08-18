import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Badge, Modal, Card, StatCard, SearchInput } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/permissions';

export default function Sales() {
  const { sales, settings } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [viewSale, setViewSale] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(todayStr) && s.status === 'completed');
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const weekSales = sales.filter(s => { const d = new Date(s.date); const now = new Date(); return (now.getTime() - d.getTime()) < 7 * 86400000 && s.status === 'completed'; });
  const weekRevenue = weekSales.reduce((sum, s) => sum + s.total, 0);
  const avgOrder = sales.filter(s => s.status === 'completed').length > 0 ? sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0) / sales.filter(s => s.status === 'completed').length : 0;

  const filtered = sales.filter(s => {
    if (search && !s.invoiceNo.toLowerCase().includes(search.toLowerCase()) && !s.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const detail = viewSale ? sales.find(s => s.id === viewSale) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Today's Sales" value={formatCurrency(todayRevenue, settings.currencySymbol)} change={`${todaySales.length} orders`} changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Weekly Sales" value={formatCurrency(weekRevenue, settings.currencySymbol)} change={`${weekSales.length} orders`} changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" /></svg>} />
        <StatCard label="Total Transactions" value={String(sales.length)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard label="Completed" value={String(sales.filter(s => s.status === 'completed').length)} changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
        <StatCard label="Avg Order Value" value={formatCurrency(avgOrder, settings.currencySymbol)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or customer..." className="flex-1" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_payment">Mobile Payment</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setViewSale(sale.id)}>
                  <td className="py-3 px-4 font-medium text-blue-600">{sale.invoiceNo}</td>
                  <td className="py-3 px-4 text-gray-900">{sale.customerName}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(sale.date)}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.items.length}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(sale.total, settings.currencySymbol)}</td>
                  <td className="py-3 px-4 text-gray-600 capitalize">{sale.paymentMethod.replace('_', ' ')}</td>
                  <td className="py-3 px-4"><Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'danger'}>{sale.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={e => { e.stopPropagation(); setViewSale(sale.id); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-gray-400"><p>No sales found</p></div>}
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setViewSale(null)} title={`Sale ${detail?.invoiceNo || ''}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium">{detail.customerName}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p>{formatDate(detail.date)}</p></div>
              <div><p className="text-xs text-gray-500">Payment</p><p className="capitalize">{detail.paymentMethod.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><Badge variant={detail.status === 'completed' ? 'success' : detail.status === 'pending' ? 'warning' : 'danger'}>{detail.status}</Badge></div>
              <div><p className="text-xs text-gray-500">Cashier</p><p>{detail.cashierName}</p></div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-xs text-gray-500">Product</th><th className="text-right py-2 text-xs text-gray-500">Qty</th><th className="text-right py-2 text-xs text-gray-500">Price</th><th className="text-right py-2 text-xs text-gray-500">Total</th></tr></thead>
                <tbody>
                  {detail.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50"><td className="py-2">{item.productName}</td><td className="py-2 text-right">{item.quantity}</td><td className="py-2 text-right">{formatCurrency(item.unitPrice, settings.currencySymbol)}</td><td className="py-2 text-right font-medium">{formatCurrency(item.total, settings.currencySymbol)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(detail.subtotal, settings.currencySymbol)}</span></div>
              {detail.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-{formatCurrency(detail.discount, settings.currencySymbol)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(detail.tax, settings.currencySymbol)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"><span>Total</span><span>{formatCurrency(detail.total, settings.currencySymbol)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
