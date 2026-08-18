import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Button, Input, Icon, showToast } from '../components/ui';

export default function Login() {
  const { login, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const doLogin = async (em: string, pw: string, rem: boolean) => {
    setError('');
    const cleanEmail = String(em || '').trim();
    if (!cleanEmail || !pw) {
      setError('Email and password are required.');
      shakeError();
      return;
    }
    setLoading(true);

    // Simulate snappy network handshake
    await new Promise(r => setTimeout(r, 600));

    const success = login(cleanEmail, pw);
    if (success) {
      showToast('success', 'Authenticated successfully! Welcome back.');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Select a demo account below or check your password.');
      shakeError();
    }
    setLoading(false);
  };

  const shakeError = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email, password, remember);
  };

  const handleSelectDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    doLogin(demoEmail, demoPass, true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 font-sans">
      
      {/* Left Pane - Brand / Marketing */}
      <div className="lg:w-1/2 w-full bg-[#111827] text-white flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <Icon name="box" size={22} className="text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200 tracking-wide">Pramukh Retail Group</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Management System</span>
          </div>
        </div>

        {/* Main Copy */}
        <div className="z-10 mt-16 lg:mt-0">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight mb-10 max-w-lg text-white">
            One system for sales, inventory, purchasing and people.
          </h1>
          
          <div className="space-y-6 text-slate-300 font-medium text-[15px]">
            <div className="flex items-start gap-4">
              <Icon name="cart" size={20} className="text-slate-400 mt-0.5 shrink-0" />
              <span>Fast POS billing with live inventory updates</span>
            </div>
            <div className="flex items-start gap-4">
              <Icon name="layers" size={20} className="text-slate-400 mt-0.5 shrink-0" />
              <span>Stock control, purchasing and supplier management</span>
            </div>
            <div className="flex items-start gap-4">
              <Icon name="chart" size={20} className="text-slate-400 mt-0.5 shrink-0" />
              <span>Dashboards, reports and role-based access</span>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="z-10 mt-16 lg:mt-0 text-xs text-slate-500 font-medium">
          V1 interactive prototype — demo data only. No real transactions are processed.
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="lg:w-1/2 w-full flex flex-col relative bg-gradient-to-br from-[#f8fafc] via-white to-[#eff6ff]">
        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[440px] bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-10"
          >
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h2>
            <p className="text-sm text-slate-500 mt-2 mb-8">Welcome back. Use a demo account to explore the system.</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ 
                      opacity: 1, 
                      height: 'auto',
                      x: isShaking ? [-5, 5, -5, 5, 0] : 0
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-3"
                  >
                    <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="admin@demo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium tracking-wide placeholder:tracking-normal placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                  >
                    <Icon name={showPassword ? 'x' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={remember} 
                      onChange={e => setRemember(e.target.checked)} 
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-[6px] border-[1.5px] border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center shadow-sm">
                      <Icon name="check" size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                </label>
                
                <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-[13px] font-semibold text-slate-500 mb-4">Demo accounts — tap to sign in instantly:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'Admin', email: 'admin@demo.com', pass: 'admin123' },
                  { role: 'Manager', email: 'manager@demo.com', pass: 'manager123' },
                  { role: 'Cashier', email: 'cashier@demo.com', pass: 'cashier123' },
                  { role: 'Inventory Staff', email: 'inventory@demo.com', pass: 'inventory123' },
                ].map((demo, idx) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleSelectDemo(demo.email, demo.pass)}
                    className="flex flex-col items-start p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left active:scale-[0.98]"
                  >
                    <span className="text-[13px] font-bold text-slate-900 mb-0.5">{demo.role}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{demo.email}</span>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
      
    </div>
  );
}
