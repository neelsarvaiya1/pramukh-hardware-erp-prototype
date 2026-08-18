import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, Badge, StatCard, Tabs } from '../components/ui';
import { formatCurrency } from '../utils/permissions';

export default function Dashboard() {
  const { products, customers, suppliers, sales, settings } = useApp();
  const [salesPeriod, setSalesPeriod] = useState('7d');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(todayStr) && s.status === 'completed');
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  const outOfStock = products.filter(p => p.stock === 0);

  const recentSales = sales.slice(0, 8);
  const lowStockItems = products.filter(p => p.stock <= p.minStock).slice(0, 8);

  // Sales trend data for chart
  const salesTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date.startsWith(dateStr) && s.status === 'completed');
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: daySales.reduce((sum, s) => sum + s.total, 0),
    };
  });
  const maxTrendValue = Math.max(...salesTrendData.map(d => d.value), 1);

  // Category breakdown
  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(c => c.name === p.category);
    if (existing) existing.value += p.stock * p.sellingPrice;
    else acc.push({ name: p.category, value: p.stock * p.sellingPrice });
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  const totalCategoryValue = categoryData.reduce((sum, c) => sum + c.value, 0);
  const categoryColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'];

  // Top products
  const productSales = sales.filter(s => s.status === 'completed').flatMap(s => s.items).reduce((acc, item) => {
    const existing = acc.find(a => a.productId === item.productId);
    if (existing) { existing.units += item.quantity; existing.revenue += item.total; }
    else acc.push({ productId: item.productId, name: item.productName, units: item.quantity, revenue: item.total });
    return acc;
  }, [] as { productId: string; name: string; units: number; revenue: number }[]).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <Link to="/pos" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
          Open POS
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Today's Sales" value={formatCurrency(todayRevenue, settings.currencySymbol)} change={`${todaySales.length} orders today`} changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Today's Orders" value={String(todaySales.length)} change="Active" changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard label="Total Products" value={products.length.toLocaleString()} change={`${products.filter(p => p.status === 'active').length} active`} changeType="neutral" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <StatCard label="Low Stock" value={String(lowStockProducts.length + outOfStock.length)} change={outOfStock.length > 0 ? `${outOfStock.length} out of stock` : 'All in stock'} changeType={outOfStock.length > 0 ? 'down' : 'up'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>} />
        <StatCard label="Customers" value={customers.length.toLocaleString()} change={`${customers.filter(c => c.status === 'active').length} active`} changeType="up" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>} />
        <StatCard label="Suppliers" value={suppliers.length.toLocaleString()} change={`${suppliers.filter(s => s.status === 'active').length} active`} changeType="neutral" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <Tabs
              tabs={[{ id: '7d', label: '7 Days' }, { id: '30d', label: '30 Days' }, { id: '12m', label: '12 Months' }]}
              active={salesPeriod}
              onChange={setSalesPeriod}
            />
          </CardHeader>
          <div className="h-64 flex items-end gap-2 px-2">
            {salesTrendData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{formatCurrency(d.value, settings.currencySymbol)}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600 min-h-[4px]"
                    style={{ height: `${Math.max((d.value / maxTrendValue) * 200, 4)}px` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {categoryData.slice(0, 6).map((cat, i) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-700 font-medium">{cat.name}</span>
                  <span className="text-gray-500">{((cat.value / totalCategoryValue) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${categoryColors[i % categoryColors.length]}`}
                    style={{ width: `${(cat.value / totalCategoryValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
          </CardHeader>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-6 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-6 font-medium text-gray-900">{sale.invoiceNo}</td>
                    <td className="py-2.5 px-3 text-gray-600">{sale.customerName}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{formatCurrency(sale.total, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-3 text-gray-600 capitalize">{sale.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'danger'}>
                        {sale.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
          </CardHeader>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-6 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Min</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(product => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-6">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{product.stock}</td>
                    <td className="py-2.5 px-3 text-gray-600">{product.minStock}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={product.stock === 0 ? 'danger' : 'warning'}>
                        {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {productSales.map((product, i) => (
            <div key={product.productId} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(product.revenue, settings.currencySymbol)}</p>
              <p className="text-xs text-gray-500">{product.units} units sold</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
