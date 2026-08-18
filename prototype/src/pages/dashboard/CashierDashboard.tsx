import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/permissions';
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

export default function CashierDashboard() {
  const { customers, sales, settings, currentUser } = useApp();
  const navigate = useNavigate();
  const sym = settings.currencySymbol || '$';
  
  const completedSales = useMemo(() => sales.filter(s => s.status === 'completed'), [sales]);
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = useMemo(() => completedSales.filter(s => s.date.startsWith(todayStr)), [completedSales, todayStr]);
  const mySales = useMemo(() => todaySales.filter(s => s.cashierId === currentUser?.id), [todaySales, currentUser]);
  
  const myTotal = mySales.reduce((a, s) => a + s.total, 0);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="page-anim"
    >
      <motion.div variants={fadeUp} className="page-head">
        <div>
          <h1 className="page-title">Welcome back, {currentUser?.name?.split(' ')[0]}</h1>
          <p className="page-sub">Cashier Terminal • Your shift overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" icon="cart" onClick={() => navigate('/pos')} className="h-10 text-[15px] px-6">
            Open POS
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid kpis" style={{ marginBottom: 16 }}>
        <div onClick={() => navigate('/pos')} style={{ cursor: 'pointer' }}>
          <StatCard 
            icon="DollarSign" 
            label="Your Sales Today" 
            value={formatCurrency(myTotal, sym)} 
            sub={`across ${mySales.length} transactions`} 
            tone="green" 
            spark={[10,20,15,30,45,60,50]} 
          />
        </div>
        <StatCard 
          icon="Receipt" 
          label="Store Orders Today" 
          value={todaySales.length} 
          sub="all cashiers" 
          tone="blue" 
          spark={[20,40,30,60,90,120,100]} 
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Your Recent Transactions</div>
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
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.filter(s => s.cashierId === currentUser?.id).slice(0, 10).map(s => {
                  const c = customers.find(x => x.id === s.customerId);
                  return (
                    <tr key={s.id} className="clickable" onClick={() => navigate(`/sales/${s.id}`)}>
                      <td className="cell-main">{s.invoiceNumber}</td>
                      <td>{c ? c.name : 'Walk-in Customer'}</td>
                      <td className="hidden sm:table-cell mut">{formatDate(s.date)}</td>
                      <td className="num font-bold">{formatCurrency(s.total, sym)}</td>
                      <td className="mut">{s.paymentMethod}</td>
                      <td>
                        <Badge variant={s.status === 'completed' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {sales.filter(s => s.cashierId === currentUser?.id).length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      You haven't processed any transactions yet today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
