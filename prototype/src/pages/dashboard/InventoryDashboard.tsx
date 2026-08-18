import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Badge, EmptyState } from '../../components/ui';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { StatCard } from '../../components/ui/StatCard';

const CHART_COLORS = ['#4560e6', '#18a867', '#e08a1e', '#8b5cf6', '#64748b', '#0ea5e9'];

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

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

export default function InventoryDashboard() {
  const { products, suppliers, currentUser } = useApp();
  const navigate = useNavigate();
  
  const lowStock = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock), [products]);
  const outOfStock = useMemo(() => products.filter(p => p.stock <= 0), [products]);

  // Chart Data: Stock by Category
  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      const c = p.category || 'Other';
      map[c] = (map[c] || 0) + p.stock;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [products]);

  // Chart Data: Top 5 Highest Stock Products
  const topStockProducts = useMemo(() => {
    return [...products].sort((a, b) => b.stock - a.stock).slice(0, 6).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      stock: p.stock
    }));
  }, [products]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="page-anim"
    >
      <motion.div variants={fadeUp} className="page-head">
        <div>
          <h1 className="page-title">Inventory Operations</h1>
          <p className="page-sub">Welcome back, {currentUser?.name?.split(' ')[0]} • Track stock levels, categories, and suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon="layers" onClick={() => navigate('/suppliers')}>Suppliers</Button>
          <Button variant="primary" icon="plus" onClick={() => navigate('/products')}>Add Product</Button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid kpis" style={{ marginBottom: 16 }}>
        <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="Package" 
            label="Total Products" 
            value={products.length} 
            sub={`${products.reduce((a, p) => a + p.stock, 0).toLocaleString()} units on hand`} 
            tone="purple" 
            spark={[20,25,23,28,30,28,33]} 
          />
        </div>
        <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="AlertTriangle" 
            label="Low Stock" 
            value={lowStock.length} 
            sub="needs reorder" 
            tone="amber" 
            spark={[10,12,15,10,8,12,14]} 
          />
        </div>
        <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="XCircle" 
            label="Out of Stock" 
            value={outOfStock.length} 
            sub="zero inventory" 
            tone="red" 
            spark={[2,3,1,0,0,1,2]} 
          />
        </div>
        <div onClick={() => navigate('/suppliers')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="Building2" 
            label="Active Suppliers" 
            value={suppliers.length} 
            sub={`${suppliers.filter(s => s.status === 'active').length} active`} 
            tone="green" 
            spark={[5,5,5,5,5,5,5]} 
          />
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={fadeUp} className="grid xl:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Stock Distribution by Category</div>
            <div className="card-sub">Total units per hardware category</div>
          </div>
          <div style={{ height: 280, padding: '20px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {catData.map((c, i) => (
                    <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} units`, 'Stock']} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card">
          <div className="card-head">
            <div className="card-title">Highest Volume Products</div>
            <div className="card-sub">Items with most stock on hand</div>
          </div>
          <div style={{ height: 280, padding: '20px 10px 10px -10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStockProducts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} width={45} />
                <Tooltip cursor={{ fill: 'var(--hover)' }} formatter={(v: number) => [`${v} units`, 'Stock']} contentStyle={tooltipStyle} />
                <Bar dataKey="stock" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid xl:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Low Stock Alerts</div>
            <button className="link font-semibold" onClick={() => navigate('/inventory')}>Action Required</button>
          </div>
          {lowStock.length + outOfStock.length === 0 ? (
            <EmptyState icon="checkCircle" title="Stock levels healthy" description="" />
          ) : (
            <div className="py-1.5 overflow-y-auto max-h-[300px]">
              {[...outOfStock, ...lowStock].map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--hover)] transition-colors cursor-pointer border-b border-border/50 last:border-0" onClick={() => navigate('/inventory')}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--field)] text-muted shrink-0 overflow-hidden border border-border">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-xs">{p.name.substring(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-text block truncate text-[13.5px]">{p.name}</span>
                    <span className="text-[12px] text-muted block truncate">{p.stock} units left • Min required: {p.minStock}</span>
                  </div>
                  <Badge variant={p.stock <= 0 ? 'danger' : 'warning'}>
                    {p.stock <= 0 ? 'Out of Stock' : 'Low Stock'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Recently Added Items</div>
            <button className="link font-semibold" onClick={() => navigate('/products')}>View Directory</button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th className="num">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.slice().reverse().slice(0, 6).map(p => (
                  <tr key={p.id} className="clickable" onClick={() => navigate('/products')}>
                    <td className="cell-main">
                      <div className="font-semibold text-text">{p.name}</div>
                      <div className="font-mono text-[10px] text-muted mt-0.5">{p.sku}</div>
                    </td>
                    <td className="text-[12px] font-medium text-muted">{p.category}</td>
                    <td className="num font-bold text-[13px]">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
