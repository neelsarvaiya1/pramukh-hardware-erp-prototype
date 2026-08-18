import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, Tabs, Button } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency } from '../utils/permissions';

export default function Reports() {
  const { sales, purchases, products, suppliers, settings } = useApp();
  const [activeTab, setActiveTab] = useState('sales');

  const completedSales = sales.filter(s => s.status === 'completed');
  const totalRevenue = completedSales.reduce((s, sale) => s + sale.total, 0);

  // Product sales aggregation
  const productSales = completedSales.flatMap(s => s.items).reduce((acc, item) => {
    const existing = acc.find(a => a.productId === item.productId);
    if (existing) { existing.units += item.quantity; existing.revenue += item.total; }
    else acc.push({ productId: item.productId, name: item.productName, units: item.quantity, revenue: item.total });
    return acc;
  }, [] as { productId: string; name: string; units: number; revenue: number }[]).sort((a, b) => b.revenue - a.revenue);

  // Customer sales aggregation
  const customerSales = completedSales.reduce((acc, sale) => {
    const existing = acc.find(a => a.customerId === sale.customerId);
    if (existing) { existing.orders += 1; existing.revenue += sale.total; }
    else acc.push({ customerId: sale.customerId, name: sale.customerName, orders: 1, revenue: sale.total });
    return acc;
  }, [] as { customerId: string; name: string; orders: number; revenue: number }[]).sort((a, b) => b.revenue - a.revenue);

  // Payment method breakdown
  const paymentBreakdown = completedSales.reduce((acc, sale) => {
    const existing = acc.find(a => a.method === sale.paymentMethod);
    if (existing) { existing.count += 1; existing.total += sale.total; }
    else acc.push({ method: sale.paymentMethod, count: 1, total: sale.total });
    return acc;
  }, [] as { method: string; count: number; total: number }[]).sort((a, b) => b.total - a.total);

  // Supplier purchase aggregation
  const supplierPurchases = purchases.filter(p => p.status === 'completed').reduce((acc, p) => {
    const existing = acc.find(a => a.supplierId === p.supplierId);
    if (existing) { existing.orders += 1; existing.total += p.total; }
    else acc.push({ supplierId: p.supplierId, name: p.supplierName, orders: 1, total: p.total });
    return acc;
  }, [] as { supplierId: string; name: string; orders: number; total: number }[]).sort((a, b) => b.total - a.total);

  // Stock valuation by category
  const stockValuation = products.reduce((acc, p) => {
    const existing = acc.find(a => a.category === p.category);
    if (existing) { existing.products += 1; existing.value += p.stock * p.costPrice; existing.units += p.stock; }
    else acc.push({ category: p.category, products: 1, value: p.stock * p.costPrice, units: p.stock });
    return acc;
  }, [] as { category: string; products: number; value: number; units: number }[]).sort((a, b) => b.value - a.value);

  const tabs = [
    { id: 'sales', label: 'Sales Reports' },
    { id: 'purchases', label: 'Purchase Reports' },
    { id: 'inventory', label: 'Inventory Reports' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Button variant="secondary" onClick={() => showToast('info', 'Export simulated — would download as CSV/PDF')}>Export Report</Button>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue, settings.currencySymbol)}</p>
              <p className="text-xs text-gray-500 mt-1">{completedSales.length} completed sales</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(completedSales.length > 0 ? totalRevenue / completedSales.length : 0, settings.currencySymbol)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{new Set(completedSales.map(s => s.customerId)).size}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top Products by Revenue</CardTitle></CardHeader>
              <div className="space-y-3">
                {productSales.slice(0, 10).map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.units} units sold</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.revenue, settings.currencySymbol)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
              <div className="space-y-3">
                {customerSales.slice(0, 10).map((c, i) => (
                  <div key={c.customerId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.orders} orders</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.revenue, settings.currencySymbol)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paymentBreakdown.map(p => (
                <div key={p.method} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 capitalize">{p.method.replace('_', ' ')}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(p.total, settings.currencySymbol)}</p>
                  <p className="text-xs text-gray-500">{p.count} transactions</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(purchases.filter(p => p.status === 'completed').reduce((s, p) => s + p.total, 0), settings.currencySymbol)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{purchases.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{suppliers.filter(s => s.status === 'active').length}</p>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Purchases by Supplier</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Supplier</th><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Orders</th><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Total</th></tr></thead>
                <tbody>{supplierPurchases.map(s => (
                  <tr key={s.supplierId} className="border-b border-gray-50"><td className="py-2.5 px-4 font-medium text-gray-900">{s.name}</td><td className="py-2.5 px-4 text-gray-600">{s.orders}</td><td className="py-2.5 px-4 font-medium">{formatCurrency(s.total, settings.currencySymbol)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5"><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p></Card>
            <Card className="p-5"><p className="text-sm text-gray-500">Total Stock Value</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(products.reduce((s, p) => s + p.stock * p.costPrice, 0), settings.currencySymbol)}</p></Card>
            <Card className="p-5"><p className="text-sm text-gray-500">Low Stock Items</p><p className="text-2xl font-bold text-amber-600 mt-1">{products.filter(p => p.stock > 0 && p.stock <= p.minStock).length}</p></Card>
            <Card className="p-5"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-red-600 mt-1">{products.filter(p => p.stock === 0).length}</p></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Stock Valuation by Category</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Category</th><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Products</th><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Units</th><th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Value</th></tr></thead>
                <tbody>{stockValuation.map(sv => (
                  <tr key={sv.category} className="border-b border-gray-50"><td className="py-2.5 px-4 font-medium text-gray-900">{sv.category}</td><td className="py-2.5 px-4 text-gray-600">{sv.products}</td><td className="py-2.5 px-4 text-gray-600">{sv.units.toLocaleString()}</td><td className="py-2.5 px-4 font-medium">{formatCurrency(sv.value, settings.currencySymbol)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
