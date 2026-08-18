import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, Tabs, Button, StatCard, Badge, Icon } from '../components/ui';
import { formatCurrency, formatDateTime } from '../utils/permissions';
import { cn } from '../utils/cn';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#4560e6', '#18a867', '#e08a1e', '#8b5cf6', '#64748b'];

// Minimal Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-field border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-text mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted">{entry.name}:</span>
            <span className="font-bold text-text">
              {entry.name.toLowerCase().includes('sales') || entry.name.toLowerCase().includes('value')
                ? `$${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Reports() {
  const { sales, purchases, products, suppliers, settings, stockMovements } = useApp();
  const [activeTab, setActiveTab] = useState('sales');

  const completedSales = useMemo(() => sales.filter(s => s.status === 'completed'), [sales]);

  // SALES DATA
  const dailySales = useMemo(() => {
    const days: Record<string, number> = {};
    completedSales.forEach(s => {
      const d = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[d] = (days[d] || 0) + s.total;
    });
    return Object.entries(days).map(([date, sales]) => ({ date, sales }));
  }, [completedSales]);

  const productSales = useMemo(() => {
    return completedSales
      .flatMap(s => s.items)
      .reduce((acc, item) => {
        const existing = acc.find(a => a.productId === item.productId);
        if (existing) {
          existing.units += item.quantity;
          existing.revenue += item.total;
        } else {
          acc.push({
            productId: item.productId,
            name: item.productName,
            units: item.quantity,
            revenue: item.total,
          });
        }
        return acc;
      }, [] as { productId: string; name: string; units: number; revenue: number }[])
      .sort((a, b) => b.revenue - a.revenue);
  }, [completedSales]);

  const customerSales = useMemo(() => {
    return completedSales
      .reduce((acc, sale) => {
        const existing = acc.find(a => a.customerId === sale.customerId);
        if (existing) {
          existing.orders += 1;
          existing.revenue += sale.total;
        } else {
          acc.push({
            customerId: sale.customerId,
            name: sale.customerName,
            orders: 1,
            revenue: sale.total,
          });
        }
        return acc;
      }, [] as { customerId: string; name: string; orders: number; revenue: number }[])
      .sort((a, b) => b.revenue - a.revenue);
  }, [completedSales]);

  const paymentBreakdown = useMemo(() => {
    return completedSales
      .reduce((acc, sale) => {
        const existing = acc.find(a => a.method === sale.paymentMethod);
        if (existing) {
          existing.count += 1;
          existing.total += sale.total;
        } else {
          acc.push({ method: sale.paymentMethod, count: 1, total: sale.total });
        }
        return acc;
      }, [] as { method: string; count: number; total: number }[])
      .sort((a, b) => b.total - a.total);
  }, [completedSales]);

  // PURCHASES DATA
  const completedPurchases = useMemo(() => purchases.filter(p => p.status === 'completed'), [purchases]);
  const pendingPurchases = useMemo(() => purchases.filter(p => p.status === 'pending'), [purchases]);
  
  const supplierPurchases = useMemo(() => {
    return completedPurchases
      .reduce((acc, p) => {
        const existing = acc.find(a => a.supplierId === p.supplierId);
        if (existing) {
          existing.orders += 1;
          existing.total += p.total;
        } else {
          acc.push({ supplierId: p.supplierId, name: p.supplierName, orders: 1, total: p.total });
        }
        return acc;
      }, [] as { supplierId: string; name: string; orders: number; total: number }[])
      .sort((a, b) => b.total - a.total);
  }, [completedPurchases]);

  const productPurchases = useMemo(() => {
    return completedPurchases
      .flatMap(p => p.items)
      .reduce((acc, item) => {
        const existing = acc.find(a => a.productId === item.productId);
        if (existing) {
          existing.units += item.quantity;
          existing.cost += item.total;
        } else {
          acc.push({
            productId: item.productId,
            name: item.productName,
            units: item.quantity,
            cost: item.total,
          });
        }
        return acc;
      }, [] as { productId: string; name: string; units: number; cost: number }[])
      .sort((a, b) => b.cost - a.cost);
  }, [completedPurchases]);

  // INVENTORY DATA
  const stockValuation = useMemo(() => {
    return products
      .reduce((acc, p) => {
        const cat = p.category || 'General';
        const existing = acc.find(a => a.category === cat);
        if (existing) {
          existing.products += 1;
          existing.value += p.stock * p.costPrice;
          existing.units += p.stock;
        } else {
          acc.push({ category: cat, products: 1, value: p.stock * p.costPrice, units: p.stock });
        }
        return acc;
      }, [] as { category: string; products: number; value: number; units: number }[])
      .sort((a, b) => b.value - a.value);
  }, [products]);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock), [products]);
  const outOfStockProducts = useMemo(() => products.filter(p => p.stock <= 0), [products]);
  const totalValuation = useMemo(() => products.reduce((s, p) => s + p.stock * p.costPrice, 0), [products]);

  return (
    <div className="page-anim">
      {/* HEADER */}
      <div className="page-head flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Business analytics across sales, purchases and inventory</p>
        </div>
        <select className="input max-w-[200px] w-full sm:w-auto">
          <option>Last 30 days</option>
          <option>This Quarter</option>
          <option>This Year</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'sales', label: 'Sales' },
            { id: 'purchases', label: 'Purchases' },
            { id: 'inventory', label: 'Inventory' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ===================== SALES TAB ===================== */}
      {activeTab === 'sales' && (
        <div className="space-y-6 page-anim">
          {/* Daily Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily sales</CardTitle>
            </CardHeader>
            <div className="w-full h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover)' }} />
                  <Bar dataKey="sales" name="Sales" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products Table */}
            <Card className="flex flex-col">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Product sales (top 10)</CardTitle>
                <Button variant="ghost" size="sm" icon="download">Export</Button>
              </CardHeader>
              <div className="tbl-wrap flex-1 mt-2">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Units</th>
                      <th className="num">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSales.slice(0, 10).map((p) => (
                      <tr key={p.productId}>
                        <td className="font-medium text-text">{p.name}</td>
                        <td className="num text-muted">{p.units}</td>
                        <td className="num font-semibold text-text">{formatCurrency(p.revenue, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                    {productSales.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted py-8">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-6 flex flex-col">
              {/* Top Customers Table */}
              <Card className="flex-1">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Customer sales</CardTitle>
                  <Button variant="ghost" size="sm" icon="download">Export</Button>
                </CardHeader>
                <div className="tbl-wrap mt-2">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th className="num">Orders</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSales.slice(0, 5).map((c) => (
                        <tr key={c.customerId}>
                          <td className="font-medium text-text">{c.name}</td>
                          <td className="num text-muted">{c.orders}</td>
                          <td className="num font-semibold text-text">{formatCurrency(c.revenue, settings.currencySymbol)}</td>
                        </tr>
                      ))}
                      {customerSales.length === 0 && (
                        <tr><td colSpan={3} className="text-center text-muted py-8">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Payment Methods Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>By payment method</CardTitle>
                </CardHeader>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown.map((p, i) => ({ name: p.method, value: p.total, color: CHART_COLORS[i % CHART_COLORS.length] }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" formatter={(value) => <span className="text-sm text-text capitalize ml-1">{value.replace('_', ' ')}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PURCHASES TAB ===================== */}
      {activeTab === 'purchases' && (
        <div className="space-y-6 page-anim">
          <div className="grid kpis">
            <StatCard
              label="Orders"
              value={completedPurchases.length.toLocaleString()}
              icon="truck"
            />
            <StatCard
              label="Purchase Total"
              value={formatCurrency(completedPurchases.reduce((s, p) => s + p.total, 0), settings.currencySymbol)}
              icon="dollar"
            />
            <StatCard
              label="Pending"
              value={pendingPurchases.length.toLocaleString()}
              icon="clock"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Purchases by supplier</CardTitle>
                <Button variant="ghost" size="sm" icon="download">Export</Button>
              </CardHeader>
              <div className="tbl-wrap mt-2">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th className="num">Orders</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierPurchases.map((s) => (
                      <tr key={s.supplierId}>
                        <td className="font-medium text-text">{s.name}</td>
                        <td className="num text-muted">{s.orders}</td>
                        <td className="num font-semibold text-text">{formatCurrency(s.total, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                    {supplierPurchases.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted py-8">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Purchased products (top 10)</CardTitle>
                <Button variant="ghost" size="sm" icon="download">Export</Button>
              </CardHeader>
              <div className="tbl-wrap mt-2">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Units</th>
                      <th className="num">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPurchases.slice(0, 10).map((p) => (
                      <tr key={p.productId}>
                        <td className="font-medium text-text">{p.name}</td>
                        <td className="num text-muted">{p.units}</td>
                        <td className="num font-semibold text-text">{formatCurrency(p.cost, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                    {productPurchases.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted py-8">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ===================== INVENTORY TAB ===================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 page-anim">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock valuation by category</CardTitle>
              </CardHeader>
              <div className="w-full h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockValuation} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(val) => `$${val}`} />
                    <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--text)', fontWeight: 500 }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover)' }} />
                    <Bar dataKey="value" name="Value" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={30}>
                      {stockValuation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock summary</CardTitle>
              </CardHeader>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between p-4 bg-field rounded-xl border border-border">
                  <div>
                    <div className="text-muted text-sm font-medium">Total units on hand</div>
                    <div className="text-2xl font-bold text-text mt-1">{products.reduce((s, p) => s + p.stock, 0).toLocaleString()}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent-soft text-accent-text flex items-center justify-center">
                    <Icon name="box" size={24} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 p-4 bg-field rounded-xl border border-border">
                    <div className="text-muted text-sm font-medium">Low stock items</div>
                    <div className="text-2xl font-bold text-warning mt-1">{lowStockProducts.length}</div>
                  </div>
                  <div className="flex-1 p-4 bg-field rounded-xl border border-border">
                    <div className="text-muted text-sm font-medium">Out of stock items</div>
                    <div className="text-2xl font-bold text-danger mt-1">{outOfStockProducts.length}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-field rounded-xl border border-border mt-auto">
                  <div className="text-muted text-sm font-medium">Total valuation (cost)</div>
                  <div className="text-2xl font-extrabold text-text">{formatCurrency(totalValuation, settings.currencySymbol)}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Low / out of stock</CardTitle>
                <Button variant="ghost" size="sm" icon="download">Export</Button>
              </CardHeader>
              <div className="tbl-wrap mt-2">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Stock</th>
                      <th className="num">Min</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...outOfStockProducts, ...lowStockProducts].slice(0, 8).map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium text-text">{p.name}</td>
                        <td className="num font-semibold">{p.stock}</td>
                        <td className="num text-muted">{p.minStock}</td>
                        <td className="text-right">
                          <Badge variant={p.stock <= 0 ? 'danger' : 'warning'}>
                            {p.stock <= 0 ? 'Out of stock' : 'Low stock'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted py-8">All products well stocked</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Recent movements</CardTitle>
                <Button variant="ghost" size="sm" icon="download">Export</Button>
              </CardHeader>
              <div className="space-y-4 mt-4">
                {stockMovements.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      m.type === 'sale' ? "bg-danger-bg text-danger" :
                      m.type === 'purchase' ? "bg-success-bg text-success" :
                      "bg-info-bg text-info"
                    )}>
                      <Icon 
                        name={m.type === 'sale' ? 'trendDown' : m.type === 'purchase' ? 'trendUp' : 'refresh'} 
                        size={18} 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text flex items-center justify-between">
                        <span>{m.productName}</span>
                        <span className={cn(
                          "font-bold",
                          m.type === 'sale' ? "text-danger" : m.type === 'purchase' ? "text-success" : "text-info"
                        )}>
                          {m.type === 'sale' ? '-' : '+'}{Math.abs(m.quantity)}
                        </span>
                      </div>
                      <div className="text-xs text-muted flex items-center justify-between mt-1">
                        <span className="capitalize">{m.type} • {m.reference || (m.type === 'sale' ? 'Sale completion' : m.type === 'purchase' ? 'PO receive' : 'Manual adjustment')}</span>
                        <span>{timeAgo(m.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {stockMovements.length === 0 && (
                  <div className="text-center text-muted py-8">No recent stock movements</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
