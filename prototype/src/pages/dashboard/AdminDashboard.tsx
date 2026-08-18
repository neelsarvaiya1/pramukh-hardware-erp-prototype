import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button, Badge, EmptyState } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/permissions';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/ui/StatCard';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } }
};

const CHART_COLORS = ['#4560e6', '#18a867', '#e08a1e', '#8b5cf6', '#64748b'];

const tooltipStyle = {
  backgroundColor: 'var(--glass)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  boxShadow: 'var(--shadow-lg)',
  fontSize: '13px',
  color: 'var(--text)',
};

export default function AdminDashboard() {
  const { products, customers, suppliers, sales, settings } = useApp();
  const navigate = useNavigate();
  const sym = settings.currencySymbol || '$';
  
  const [range, setRange] = useState('7');
  
  const completedSales = useMemo(() => sales.filter(s => s.status === 'completed'), [sales]);
  const todayStr = new Date().toISOString().split('T')[0];
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toISOString().split('T')[0];

  const todaySales = useMemo(() => completedSales.filter(s => s.date.startsWith(todayStr)), [completedSales, todayStr]);
  const yestSales = useMemo(() => completedSales.filter(s => s.date.startsWith(yestStr)), [completedSales, yestStr]);
  
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);
  const yestTotal = yestSales.reduce((a, s) => a + s.total, 0);
  const trend = yestTotal > 0 ? Math.round(((todayTotal - yestTotal) / yestTotal) * 100) : 0;
  
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStock = products.filter(p => p.stock <= 0);
  
  // Trend area chart data
  const trendData = useMemo(() => {
    const days = range === '7' ? 7 : 30;
    const base = new Date(); 
    base.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(base.getTime() - i * 864e5);
      const k = d.toISOString().split('T')[0];
      out.push({
        label: days === 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: completedSales.filter(s => s.date.startsWith(k)).reduce((a, s) => a + s.total, 0)
      });
    }
    return out;
  }, [completedSales, range]);

  const monthData = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const real = completedSales.filter(s => s.date.startsWith(key)).reduce((a, s) => a + s.total, 0);
      out.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        value: real
      });
    }
    return out;
  }, [completedSales]);

  // Category chart
  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    completedSales.forEach(s => s.items.forEach(it => {
      const p = products.find(x => x.id === it.productId);
      const c = p?.category || 'Other';
      map[c] = (map[c] || 0) + it.unitPrice * it.quantity;
    }));
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [completedSales, products]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; units: number; revenue: number }> = {};
    completedSales.forEach(s => s.items.forEach(it => {
      if (!map[it.productId]) {
        map[it.productId] = { name: it.productName, units: 0, revenue: 0 };
      }
      map[it.productId].units += it.quantity;
      map[it.productId].revenue += it.quantity * it.unitPrice;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completedSales]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="page-anim"
    >
      <motion.div variants={fadeUp} className="page-head">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-sub">Pramukh Hardware ERP • Live store operations, financials & inventory alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" icon="cart" onClick={() => navigate('/pos')}>Open POS Terminal</Button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid kpis" style={{ marginBottom: 16 }}>
        <StatCard 
          icon="DollarSign" 
          label="Today's Sales" 
          value={formatCurrency(todayTotal, sym)} 
          sub="vs yesterday" 
          trend={trend} 
          tone="blue" 
          spark={trendData.map(d => d.value)} 
        />
        <StatCard 
          icon="Receipt" 
          label="Today's Orders" 
          value={todaySales.length} 
          sub="transactions" 
          tone="green" 
          spark={trendData.map(d => d.value)} 
        />
        <StatCard 
          icon="Package" 
          label="Total Products" 
          value={products.length} 
          sub={`${products.reduce((a, p) => a + p.stock, 0).toLocaleString()} units on hand`} 
          tone="purple" 
          spark={[20,25,23,28,30,28,33]} 
        />
        <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="AlertTriangle" 
            label="Low Stock" 
            value={lowStock.length + outOfStock.length} 
            sub={`${outOfStock.length} out of stock`} 
            tone={lowStock.length + outOfStock.length > 0 ? 'amber' : 'green'} 
            spark={[10,12,15,10,8,12,14]} 
          />
        </div>
        <div onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="Users" 
            label="Customers" 
            value={customers.length} 
            sub={`${customers.filter(c => c.status === 'active').length} active`} 
            tone="gray" 
            spark={[50,55,52,58,60,65,62]} 
          />
        </div>
        <div onClick={() => navigate('/suppliers')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="Building2" 
            label="Suppliers" 
            value={suppliers.length} 
            sub={`${suppliers.filter(s => s.status === 'active').length} active`} 
            tone="gray" 
            spark={[12,12,13,13,15,15,14]} 
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid xl:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
        <div className="card xl:col-span-2">
          <div className="card-head">
            <div>
              <div className="card-title">Sales Trend</div>
              <div className="card-sub">Completed sales revenue</div>
            </div>
            <div className="chips">
              {['7', '30', '12'].map(r => (
                <button key={r} className={`chip ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                  {r === '12' ? '12 months' : `${r} days`}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 280, padding: '12px 8px 4px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={range === '12' ? monthData : trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} interval={range === '30' ? 4 : 0} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} width={75} tickFormatter={(v) => formatCurrency(v, sym)} />
                <Tooltip formatter={(v: number) => [formatCurrency(v, sym), 'Revenue']} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Sales by Category</div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={3}>
                  {catData.map((c, i) => (
                    <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, sym)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="card-head">
            <div className="card-title">Recent Transactions</div>
            <button className="link" onClick={() => navigate('/sales')}>View all</button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="num">Amount</th>
                  <th className="hidden sm:table-cell">Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 8).map(s => {
                  const c = customers.find(x => x.id === s.customerId);
                  return (
                    <tr key={s.id} className="clickable" onClick={() => navigate(`/sales/${s.id}`)}>
                      <td className="cell-main">{s.invoiceNumber}</td>
                      <td>{c ? c.name : 'Walk-in Customer'}</td>
                      <td className="hidden sm:table-cell mut">{formatDate(s.date)}</td>
                      <td className="num font-bold">{formatCurrency(s.total, sym)}</td>
                      <td className="mut hidden sm:table-cell">{s.paymentMethod}</td>
                      <td>
                        <Badge variant={s.status === 'completed' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-head">
              <div className="card-title">Low Stock</div>
              <button className="link" onClick={() => navigate('/inventory')}>Manage</button>
            </div>
            {lowStock.length + outOfStock.length === 0 ? (
              <EmptyState icon="checkCircle" title="Stock levels healthy" description="" />
            ) : (
              <div className="py-1.5">
                {[...outOfStock, ...lowStock].slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--hover)] transition-colors cursor-pointer" onClick={() => navigate('/inventory')}>
                    <div className="tile bg-[var(--field)] text-muted">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="cell-main block truncate text-[13px]">{p.name}</span>
                      <span className="cell-sub block truncate">{p.stock} units • min {p.minStock}</span>
                    </div>
                    <Badge variant={p.stock <= 0 ? 'danger' : 'warning'}>
                      {p.stock <= 0 ? 'Out' : 'Low'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card">
            <div className="card-head">
              <div className="card-title">Top Products</div>
            </div>
            <div className="py-1.5">
              {topProducts.map((t, i) => (
                <div key={t.name} className="flex items-center gap-3 px-4 py-2">
                  <span className="w-[22px] h-[22px] rounded-md bg-[var(--accent-soft)] text-[var(--accent-text)] text-[11.5px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="cell-main block text-[13px] truncate">{t.name}</span>
                    <span className="cell-sub">{t.units} units sold</span>
                  </div>
                  <strong className="text-[13px] tabular-nums font-extrabold">{formatCurrency(t.revenue, sym)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
