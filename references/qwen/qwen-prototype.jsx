import React, { useState, useEffect, useMemo, useRef, useContext, createContext, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

/* ============================= CONSTANTS ============================= */
const LOGO_URL = 'https://image.qwenlm.ai/public_source/281f4156-f18b-483b-bb3f-4f442861d0b8/12a1b8c2e-3502-43d3-8287-6479494fd984.png';
const DB_KEY = 'bms_demo_db_v1';
const SES_KEY = 'bms_demo_session';
const THEME_KEY = 'bms_demo_theme';

const CATS = { Electronics: '#2563eb', Grocery: '#16a34a', Clothing: '#9333ea', Accessories: '#d97706', Other: '#64748b' };
const CHART_COLORS = ['#4560e6', '#18a867', '#e08a1e', '#8b5cf6', '#64748b'];

const NAV = [
  { k: 'dashboard', label: 'Dashboard', icon: 'grid', path: '/dashboard', group: 'MAIN' },
  { k: 'pos', label: 'POS / Billing', icon: 'cart', path: '/pos', group: 'MAIN' },
  { k: 'products', label: 'Products', icon: 'box', path: '/products', group: 'MAIN' },
  { k: 'inventory', label: 'Inventory', icon: 'layers', path: '/inventory', group: 'MAIN' },
  { k: 'sales', label: 'Sales', icon: 'receipt', path: '/sales', group: 'MAIN' },
  { k: 'purchases', label: 'Purchases', icon: 'truck', path: '/purchases', group: 'MAIN' },
  { k: 'customers', label: 'Customers', icon: 'users', path: '/customers', group: 'MAIN' },
  { k: 'suppliers', label: 'Suppliers', icon: 'building', path: '/suppliers', group: 'MAIN' },
  { k: 'reports', label: 'Reports', icon: 'chart', path: '/reports', group: 'MAIN' },
  { k: 'users', label: 'Users', icon: 'user', path: '/users', group: 'ADMIN' },
  { k: 'roles', label: 'Roles & Permissions', icon: 'shield', path: '/roles', group: 'ADMIN' },
  { k: 'settings', label: 'Settings', icon: 'sliders', path: '/settings', group: 'ADMIN' },
];

const PERM_ACTIONS = ['view', 'create', 'edit', 'delete'];
const permFrom = (spec) => Object.fromEntries(Object.entries(spec).map(([m, s]) => [m, { view: s.includes('v'), create: s.includes('c'), edit: s.includes('e'), delete: s.includes('d') }]));
const DEFAULT_PERMS = {
  admin: permFrom({ dashboard: 'v', pos: 'vced', products: 'vced', inventory: 'vced', sales: 'vced', purchases: 'vced', customers: 'vced', suppliers: 'vced', reports: 'v', users: 'vced', roles: 'vced', settings: 'vced' }),
  manager: permFrom({ dashboard: 'v', pos: 'vce', products: 'vce', inventory: 'vce', sales: 'vce', purchases: 'vce', customers: 'vce', suppliers: 'vce', reports: 'v' }),
  cashier: permFrom({ pos: 'vc', sales: 'v', customers: 'vce' }),
  inventory: permFrom({ products: 'vce', inventory: 'vce', purchases: 'vce' }),
};
const ROLES_META = {
  admin: { label: 'Admin', desc: 'Full access to every module, settings and administration.' },
  manager: { label: 'Manager', desc: 'Dashboard, all operational modules and reports.' },
  cashier: { label: 'Cashier', desc: 'POS billing, sales history and customer management.' },
  inventory: { label: 'Inventory Staff', desc: 'Products, inventory control and purchasing.' },
};

const PAY_METHODS = [{ k: 'Cash', icon: 'dollar' }, { k: 'Card', icon: 'card' }, { k: 'Bank Transfer', icon: 'building' }, { k: 'Mobile Payment', icon: 'mobile' }];
const ADJUST_REASONS = ['Recount / Cycle count', 'Damaged goods', 'Expired goods', 'Customer return', 'Supplier return', 'Data entry error', 'Other'];

/* ============================= UTILS ============================= */
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const uid = () => Math.random().toString(36).slice(2, 9);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const money = (n, sym = '$') => (sym || '$') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = (n) => Number(n || 0).toLocaleString('en-US');
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateTime = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const timeAgo = (iso) => { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; };
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const stockStatus = (p) => (p.stock <= 0 ? 'Out of Stock' : p.stock <= p.min ? 'Low Stock' : 'In Stock');
const statusTone = (s) => (s === 'In Stock' || s === 'Completed' || s === 'Active' || s === 'Received' || s === 'Paid' ? 'green' : s === 'Refunded' || s === 'Out of Stock' || s === 'Inactive' ? 'red' : 'amber');

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

/* ============================= ICONS ============================= */
const ICONS = {
  menu: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
  box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /></>,
  truck: <><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="22" x2="9" y2="18" /><line x1="15" y1="22" x2="15" y2="18" /><line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  edit: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  print: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  chevD: <polyline points="6 9 12 15 18 9" />,
  chevL: <polyline points="15 18 9 12 15 6" />,
  chevR: <polyline points="9 18 15 12 9 6" />,
  dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  card: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  mobile: <><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>,
  scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 6 12 13 2 6" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  trendUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
  trendDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
  arrowL: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.07" y2="4.93" /></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  dots: <><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
};
const Icon = ({ name, size = 18, className = '', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{ICONS[name] || ICONS.info}</svg>
);

/* ============================= CSS / DESIGN SYSTEM ============================= */
const CSS = `
@import url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.css');
@import url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.css');
@import url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.css');
@import url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.css');
@import url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.css');
*,*::before,*::after{box-sizing:border-box}
:root{
 --font:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
 --bg:#eef1f8;
 --mist-1:rgba(96,126,255,.16);--mist-2:rgba(76,201,240,.12);--mist-3:rgba(167,139,250,.10);
 --glass:rgba(255,255,255,.58);--glass-strong:rgba(255,255,255,.87);--glass-border:rgba(255,255,255,.62);
 --surface:rgba(255,255,255,.88);--surface-solid:#ffffff;--field:rgba(255,255,255,.72);--thead:#f4f6fc;--hover:rgba(15,23,42,.028);
 --border:rgba(17,24,39,.08);--border-strong:rgba(17,24,39,.15);
 --text:#101828;--muted:#5d6b82;--muted2:#8b96ab;
 --accent:#4560e6;--accent-2:#3550cf;--accent-text:#3d58d6;--accent-soft:rgba(69,96,230,.10);--accent-ring:rgba(69,96,230,.26);
 --success:#159953;--success-bg:rgba(21,153,83,.10);--warning:#c77414;--warning-bg:rgba(217,119,6,.12);
 --danger:#d92d20;--danger-bg:rgba(217,45,32,.09);--info:#0284c7;--info-bg:rgba(2,132,199,.10);
 --purple:#7c3aed;--purple-bg:rgba(124,58,237,.10);
 --shadow:0 1px 2px rgba(16,24,40,.04),0 6px 20px rgba(16,24,40,.06);
 --shadow-lg:0 18px 48px rgba(16,24,40,.16);
 --backdrop:rgba(15,20,32,.42);
 --skel:rgba(16,24,40,.065);--skel-shine:rgba(255,255,255,.55);
 --btn-grad:linear-gradient(180deg,#4f6cf0,#3a55da);
 --scroll:#c3cbda;
 color-scheme:light;
}
:root[data-theme="dark"]{
 --bg:#090d16;
 --mist-1:rgba(79,109,255,.13);--mist-2:rgba(56,189,248,.08);--mist-3:rgba(139,92,246,.08);
 --glass:rgba(16,21,35,.55);--glass-strong:rgba(20,26,42,.90);--glass-border:rgba(255,255,255,.09);
 --surface:rgba(18,23,37,.85);--surface-solid:#131826;--field:rgba(255,255,255,.055);--thead:rgba(255,255,255,.035);--hover:rgba(255,255,255,.035);
 --border:rgba(255,255,255,.085);--border-strong:rgba(255,255,255,.15);
 --text:#e9ecf4;--muted:#9aa4ba;--muted2:#667089;
 --accent:#6c87f0;--accent-2:#5873e6;--accent-text:#8ba0f7;--accent-soft:rgba(108,135,240,.14);--accent-ring:rgba(108,135,240,.32);
 --success:#34c479;--success-bg:rgba(52,196,121,.12);--warning:#f0a13c;--warning-bg:rgba(240,161,60,.13);
 --danger:#f16a5d;--danger-bg:rgba(241,106,93,.12);--info:#4cc3ff;--info-bg:rgba(76,195,255,.12);
 --purple:#a78bfa;--purple-bg:rgba(167,139,250,.13);
 --shadow:0 1px 2px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.35);
 --shadow-lg:0 22px 54px rgba(0,0,0,.55);
 --backdrop:rgba(3,6,12,.55);
 --skel:rgba(255,255,255,.06);--skel-shine:rgba(255,255,255,.06);
 --btn-grad:linear-gradient(180deg,#5f7af0,#4359d8);
 --scroll:#2c3550;
 color-scheme:dark;
}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px;-webkit-font-smoothing:antialiased;transition:background .25s ease}
h1,h2,h3,h4,p{margin:0}
button{font-family:inherit}
a{color:var(--accent-text);text-decoration:none}
::-webkit-scrollbar{width:9px;height:9px}::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:8px;border:2px solid transparent;background-clip:content-box}::-webkit-scrollbar-track{background:transparent}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}

/* mist background */
.mist{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.mist i{position:absolute;border-radius:50%;filter:blur(80px)}
.mist .m1{width:52vw;height:52vw;top:-18vw;left:-12vw;background:var(--mist-1)}
.mist .m2{width:46vw;height:46vw;bottom:-16vw;right:-10vw;background:var(--mist-2)}
.mist .m3{width:30vw;height:30vw;top:36vh;left:52vw;background:var(--mist-3)}
.shell,.login,.splash{position:relative;z-index:1}

/* layout */
.shell{min-height:100vh}
.sidebar{width:244px;background:var(--glass);backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5);border-right:1px solid var(--border);position:fixed;top:0;bottom:0;left:0;z-index:50;display:flex;flex-direction:column;transition:width .18s ease,transform .22s cubic-bezier(.2,.8,.2,1)}
.sidebar.collapsed{width:72px}
.main{margin-left:244px;transition:margin .18s ease;min-width:0;display:flex;flex-direction:column;min-height:100vh}
.main.collapsed{margin-left:72px}
.topbar{height:62px;background:var(--glass);backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;padding:0 20px;position:sticky;top:0;z-index:40}
.topbar-brand{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.content{padding:24px;width:100%;max-width:1460px;margin:0 auto;flex:1}
.brand{display:flex;align-items:center;gap:11px;padding:16px 18px;border-bottom:1px solid var(--border)}
.brand-logo{width:38px;height:38px;border-radius:11px;background:var(--surface-solid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.brand-logo img{width:26px;height:26px;object-fit:contain}
.brand-name{font-weight:700;font-size:14.5px;letter-spacing:-.01em;white-space:nowrap;color:var(--text)}
.brand-sub{color:var(--muted2);font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap}
.nav-scroll{flex:1;overflow-y:auto;overflow-x:visible;padding:8px 0 12px}
.nav-section{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);padding:16px 22px 6px;font-weight:700;white-space:nowrap}
.nav-item{display:flex;align-items:center;gap:11px;padding:9px 12px;margin:2px 10px;border-radius:10px;color:var(--muted);cursor:pointer;font-size:13.5px;font-weight:500;border:none;background:none;width:calc(100% - 20px);text-align:left;transition:background .14s,color .14s;white-space:nowrap;position:relative}
.nav-item:hover{background:var(--hover);color:var(--text)}
.nav-item.active{background:var(--accent-soft);color:var(--accent-text);font-weight:600;box-shadow:inset 0 0 0 1px var(--accent-ring)}
.nav-item.active::before{content:'';position:absolute;left:-10px;top:50%;transform:translateY(-50%);width:3px;height:16px;border-radius:3px;background:var(--accent)}
.side-foot{padding:12px;border-top:1px solid var(--border)}
.side-foot .nav-item{margin:0;width:100%}
.demo-pill{margin:0 10px 10px;padding:7px 10px;border-radius:9px;background:var(--accent-soft);color:var(--accent-text);font-size:11px;font-weight:600;text-align:center;white-space:nowrap}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--muted);cursor:pointer;position:relative;flex-shrink:0;transition:background .13s,color .13s}
.icon-btn:hover{background:var(--hover);color:var(--text)}
.icon-btn.sm{width:30px;height:30px;border-radius:8px}
.bell-dot{position:absolute;top:8px;right:9px;width:8px;height:8px;border-radius:50%;background:var(--danger);border:2px solid var(--surface-solid)}
.avatar{width:36px;height:36px;border-radius:50%;background:var(--accent-soft);color:var(--accent-text);font-weight:700;font-size:12.5px;display:flex;align-items:center;justify-content:center;border:1px solid var(--accent-ring);cursor:pointer;flex-shrink:0}
.avatar.lg{width:42px;height:42px;font-size:14px}

/* search trigger */
.search-trigger{flex:1;max-width:430px;display:flex;align-items:center;gap:9px;height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--border);background:var(--field);color:var(--muted2);cursor:pointer;font-size:13px;transition:border-color .13s,box-shadow .13s}
.search-trigger:hover{border-color:var(--border-strong)}
.search-trigger .kbd{margin-left:auto}

/* dropdowns */
.drop{position:absolute;top:calc(100% + 8px);right:0;background:var(--glass-strong);backdrop-filter:blur(24px) saturate(1.5);-webkit-backdrop-filter:blur(24px) saturate(1.5);border:1px solid var(--glass-border);border-radius:14px;box-shadow:var(--shadow-lg);z-index:80;overflow:hidden;animation:dropIn .16s cubic-bezier(.2,.8,.2,1)}
@keyframes dropIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
.drop.user{width:256px}
.drop-head{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;gap:11px;align-items:center}
.drop-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 16px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--text);text-align:left;min-height:40px}
.drop-item:hover{background:var(--hover)}
.drop-item.danger{color:var(--danger)}
.notif-drop{width:378px;max-width:92vw}
.notif-head{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--border)}
.notif-item{display:flex;gap:11px;padding:12px 16px;border:none;background:none;width:100%;cursor:pointer;text-align:left;border-bottom:1px solid var(--border)}
.notif-item:hover{background:var(--hover)}
.notif-item.unread{background:var(--accent-soft)}
.notif-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sd-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:none;background:none;cursor:pointer;text-align:left;font-size:13px;color:var(--text);min-height:40px}
.sd-item:hover{background:var(--hover)}
.sd-item .mut{color:var(--muted);font-size:12px;margin-left:auto;white-space:nowrap}

/* cards / kpi */
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}
.card-pad{padding:20px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 18px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.card-title{font-size:14px;font-weight:700;letter-spacing:-.01em}
.card-sub{font-size:12px;color:var(--muted);margin-top:2px}
.grid{display:grid;gap:16px}
.kpis{grid-template-columns:repeat(6,1fr)}
.kpi{padding:16px;background:var(--glass);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s}
.kpi:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg)}
.kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.kpi-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.kpi-label{font-size:12px;font-weight:600;color:var(--muted)}
.kpi-value{font-size:21px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.kpi-sub{font-size:11.5px;color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:5px}
.kpi-spark{margin-top:10px}
.trend-up{color:var(--success);font-weight:600}.trend-down{color:var(--danger);font-weight:600}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;font-weight:600;font-size:13.5px;padding:9px 16px;border:1px solid transparent;cursor:pointer;transition:background .13s,border-color .13s,color .13s,transform .12s,box-shadow .13s;line-height:1.4;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:var(--btn-grad);color:#fff;box-shadow:0 1px 2px rgba(16,24,40,.12)}
.btn-primary:hover:not(:disabled){box-shadow:0 6px 18px var(--accent-ring)}
.btn-outline{background:var(--field);border-color:var(--border-strong);color:var(--text)}
.btn-outline:hover:not(:disabled){background:var(--hover)}
.btn-ghost{background:transparent;color:var(--muted)}
.btn-ghost:hover:not(:disabled){background:var(--hover);color:var(--text)}
.btn-danger{background:var(--danger);color:#fff}
.btn-danger:hover:not(:disabled){filter:brightness(.94)}
.btn-success{background:var(--success);color:#fff}
.btn-success:hover:not(:disabled){filter:brightness(.94)}
.btn-sm{padding:6px 11px;font-size:12.5px;border-radius:8px}
.btn-lg{padding:12px 22px;font-size:14.5px;border-radius:12px}
.btn-block{width:100%}
.link{background:none;border:none;color:var(--accent-text);cursor:pointer;font-size:13px;font-weight:600;padding:0}
.link:hover{text-decoration:underline}

/* inputs */
.input{width:100%;border:1px solid var(--border-strong);border-radius:10px;padding:9px 12px;font-size:13.5px;font-family:inherit;color:var(--text);background:var(--field);transition:border-color .13s,box-shadow .13s}
.input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.input::placeholder{color:var(--muted2)}
textarea.input{resize:vertical;min-height:76px}
select.input{appearance:auto}
.field{display:block;margin-bottom:14px}
.f-label{display:block;font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:6px}
.f-label em{color:var(--danger);font-style:normal}
.f-err{display:block;color:var(--danger);font-size:12px;margin-top:5px}
.f-hint{display:block;color:var(--muted2);font-size:11.5px;margin-top:5px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
.check{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:var(--text)}
.check input{width:15px;height:15px;accent-color:var(--accent)}
.switch{width:38px;height:21px;border-radius:20px;background:var(--border-strong);border:none;cursor:pointer;position:relative;transition:background .16s;flex-shrink:0}
.switch::after{content:'';position:absolute;top:2.5px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .16s cubic-bezier(.2,.8,.2,1);box-shadow:0 1px 2px rgba(0,0,0,.25)}
.switch.on{background:var(--accent)}
.switch.on::after{left:19px}

/* badges */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap}
.b-green{background:var(--success-bg);color:var(--success)}
.b-red{background:var(--danger-bg);color:var(--danger)}
.b-amber{background:var(--warning-bg);color:var(--warning)}
.b-blue{background:var(--info-bg);color:var(--info)}
.b-gray{background:var(--hover);color:var(--muted)}
.b-purple{background:var(--purple-bg);color:var(--purple)}

/* tables */
.tbl-wrap{overflow-x:auto}
.tbl{width:100%;border-collapse:collapse;font-size:13.5px}
.tbl th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted2);font-weight:700;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--thead);white-space:nowrap}
.tbl th.sortable{cursor:pointer;user-select:none}
.tbl th.sortable:hover{color:var(--text)}
.tbl td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
.tbl tbody tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .1s}
.tbl tbody tr:hover{background:var(--hover)}
.tbl tr.clickable{cursor:pointer}
.tbl .num{text-align:right;font-variant-numeric:tabular-nums}
.cell-main{font-weight:600}
.cell-sub{font-size:12px;color:var(--muted);margin-top:1px}
.tile{width:34px;height:34px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden}
.tile img{width:100%;height:100%;object-fit:cover}
.tile-row{display:flex;align-items:center;gap:11px}
.row-actions{display:flex;gap:4px;justify-content:flex-end}
.cards-list{display:none}
.m-card{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:7px;cursor:pointer}
.m-card:last-child{border-bottom:none}
.m-card .mc-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.m-card .mc-sub{display:flex;justify-content:space-between;color:var(--muted);font-size:12.5px;gap:10px;flex-wrap:wrap}

/* chips & tabs */
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{padding:6px 13px;border-radius:20px;border:1px solid var(--border-strong);background:var(--field);font-size:12.5px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .13s;white-space:nowrap}
.chip:hover{color:var(--text);border-color:var(--muted2)}
.chip.active{background:var(--accent-soft);border-color:var(--accent-ring);color:var(--accent-text)}
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--border);overflow-x:auto}
.tab{padding:10px 16px;border:none;background:none;font-size:13.5px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;transition:color .13s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent-text);border-bottom-color:var(--accent)}

/* modal */
.overlay{position:fixed;inset:0;background:var(--backdrop);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:90;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .16s ease}
.modal{background:var(--glass-strong);backdrop-filter:blur(26px) saturate(1.5);-webkit-backdrop-filter:blur(26px) saturate(1.5);border:1px solid var(--glass-border);border-radius:20px;box-shadow:var(--shadow-lg);width:100%;max-height:92vh;display:flex;flex-direction:column;animation:pop .2s cubic-bezier(.2,.8,.2,1)}
.m-sm{max-width:432px}.m-md{max-width:584px}.m-lg{max-width:784px}.m-xl{max-width:1000px}
.modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid var(--border)}
.modal-head h3{font-size:15.5px;font-weight:700;letter-spacing:-.01em}
.modal-head p{font-size:12.5px;color:var(--muted);margin-top:3px}
.modal-body{padding:20px;overflow-y:auto}
.modal-foot{padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;background:var(--hover);border-radius:0 0 20px 20px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}

/* bottom sheet */
.sheet-overlay{position:fixed;inset:0;background:var(--backdrop);backdrop-filter:blur(4px);z-index:95;animation:fadeIn .16s ease}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:96;background:var(--glass-strong);backdrop-filter:blur(26px) saturate(1.5);-webkit-backdrop-filter:blur(26px) saturate(1.5);border:1px solid var(--glass-border);border-bottom:none;border-radius:22px 22px 0 0;box-shadow:var(--shadow-lg);padding:10px 18px calc(20px + env(safe-area-inset-bottom));animation:sheetUp .28s cubic-bezier(.2,.8,.2,1);max-height:86vh;overflow-y:auto}
.sheet .grab{width:40px;height:4px;border-radius:4px;background:var(--border-strong);margin:4px auto 14px}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:none}}

/* command palette */
.palette-overlay{position:fixed;inset:0;z-index:120;background:var(--backdrop);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;justify-content:center;align-items:flex-start;padding:11vh 16px 16px;animation:fadeIn .14s ease}
.palette{width:100%;max-width:624px;background:var(--glass-strong);backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6);border:1px solid var(--glass-border);border-radius:18px;box-shadow:var(--shadow-lg);overflow:hidden;animation:pop .18s cubic-bezier(.2,.8,.2,1)}
.pal-input{display:flex;align-items:center;gap:11px;padding:15px 18px;border-bottom:1px solid var(--border)}
.pal-input input{flex:1;border:none;background:transparent;font-size:15px;font-family:inherit;color:var(--text);outline:none}
.pal-input input::placeholder{color:var(--muted2)}
.pal-list{max-height:52vh;overflow-y:auto;padding:6px}
.pal-item{display:flex;gap:11px;align-items:center;width:100%;padding:10px 12px;background:none;border:none;border-radius:10px;cursor:pointer;font-size:13.5px;color:var(--text);text-align:left}
.pal-item.active{background:var(--accent-soft)}
.pal-item .p-ico{width:30px;height:30px;border-radius:8px;background:var(--hover);display:flex;align-items:center;justify-content:center;color:var(--muted);flex-shrink:0}
.pal-item.active .p-ico{background:var(--accent-ring);color:var(--accent-text)}
.pal-item .p-sub{font-size:11.5px;color:var(--muted2);margin-top:1px}
.pal-item .p-kbd{margin-left:auto}
.pal-group{padding:10px 12px 4px;font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted2)}
.pal-foot{display:flex;gap:16px;padding:10px 18px;border-top:1px solid var(--border);font-size:11px;color:var(--muted2)}

/* toasts */
.toasts{position:fixed;top:16px;right:16px;z-index:200;display:flex;flex-direction:column;gap:9px;max-width:372px}
.toast{display:flex;align-items:flex-start;gap:10px;background:var(--glass-strong);backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5);border:1px solid var(--glass-border);border-radius:13px;box-shadow:var(--shadow-lg);padding:12px 14px;animation:toastIn .22s cubic-bezier(.2,.8,.2,1);font-size:13px}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}
.toast .t-ico{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.toast .t-msg{font-weight:500;line-height:1.45}

/* misc */
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:20px;flex-wrap:wrap}
.page-title{font-size:22px;font-weight:800;letter-spacing:-.02em}
.page-sub{font-size:13px;color:var(--muted);margin-top:5px}
.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.toolbar .input,.toolbar select{width:auto;min-width:150px;max-width:100%}
.empty{padding:44px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.empty .e-ico{width:48px;height:48px;border-radius:14px;background:var(--hover);color:var(--muted);display:flex;align-items:center;justify-content:center;margin-bottom:4px}
.empty h4{font-size:14.5px;font-weight:700}
.empty p{font-size:13px;color:var(--muted);max-width:340px}
.kbd{display:inline-block;padding:1px 6px;border:1px solid var(--border-strong);border-bottom-width:2px;border-radius:5px;background:var(--field);font-size:10.5px;font-weight:700;color:var(--muted);font-family:inherit}
.divider{height:1px;background:var(--border);margin:14px 0}
.mut{color:var(--muted)}
.small{font-size:12px}
.splash{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:300}
.spin{width:34px;height:34px;border-radius:50%;border:3px solid var(--border);border-top-color:var(--accent);animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.shake{animation:shake .4s ease}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.page-anim{animation:pageIn .22s cubic-bezier(.2,.8,.2,1)}
@keyframes pageIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.skel{background:var(--skel);border-radius:10px;position:relative;overflow:hidden}
.skel::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--skel-shine),transparent);animation:shim 1.3s infinite}
@keyframes shim{to{transform:translateX(100%)}}
.success-pop{animation:successPop .4s cubic-bezier(.2,.8,.2,1)}
@keyframes successPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}

/* login */
.login{min-height:100vh;display:grid;grid-template-columns:1.05fr 1fr}
.login-brand{background:linear-gradient(160deg,#0b1220 0%,#101f44 60%,#0e1a38 100%);color:#e2e8f0;display:flex;flex-direction:column;justify-content:space-between;padding:44px}
.login-form-side{display:flex;align-items:center;justify-content:center;padding:32px;position:relative}
.login-card{width:100%;max-width:430px;background:var(--glass-strong);backdrop-filter:blur(26px) saturate(1.5);-webkit-backdrop-filter:blur(26px) saturate(1.5);border:1px solid var(--glass-border);border-radius:22px;box-shadow:var(--shadow-lg);padding:30px}
.demo-accts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.demo-acct{border:1px solid var(--border-strong);background:var(--field);border-radius:11px;padding:10px 12px;cursor:pointer;text-align:left;transition:border-color .13s,background .13s,transform .12s}
.demo-acct:hover{border-color:var(--accent-ring);background:var(--accent-soft)}
.demo-acct:active{transform:scale(.98)}
.demo-acct .da-role{font-size:12.5px;font-weight:700;color:var(--text)}
.demo-acct .da-mail{font-size:11px;color:var(--muted);margin-top:1px}
.pw-wrap{position:relative}
.pw-wrap .input{padding-right:44px}
.pw-toggle{position:absolute;right:6px;top:50%;transform:translateY(-50%)}
.theme-corner{position:absolute;top:20px;right:20px;z-index:5}

/* POS */
.pos-grid{display:grid;grid-template-columns:1fr 384px;gap:16px;align-items:start}
.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:12px}
.prod-card{border:1px solid var(--border);background:var(--surface);border-radius:13px;padding:12px;cursor:pointer;text-align:left;transition:all .14s cubic-bezier(.2,.8,.2,1);position:relative;display:flex;flex-direction:column;gap:8px;color:var(--text)}
.prod-card:hover:not(:disabled){border-color:var(--accent-ring);box-shadow:var(--shadow);transform:translateY(-2px)}
.prod-card:disabled{opacity:.55;cursor:not-allowed}
.prod-card .pc-name{font-size:13px;font-weight:600;line-height:1.35;min-height:35px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prod-card .pc-price{font-size:14.5px;font-weight:800;font-variant-numeric:tabular-nums}
.prod-card .pc-stock{font-size:11px;color:var(--muted)}
.pc-in-cart{position:absolute;top:8px;right:8px;background:var(--btn-grad);color:#fff;font-size:10.5px;font-weight:700;border-radius:12px;padding:2px 8px}
.cart-panel{position:sticky;top:78px;display:flex;flex-direction:column;max-height:calc(100vh - 100px)}
.cart-items{flex:1;overflow-y:auto;min-height:120px;max-height:380px}
.cart-line{display:flex;gap:10px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border)}
.cart-line .cl-name{font-size:13px;font-weight:600;flex:1;min-width:0}
.cart-line .cl-name .cl-price{display:block;font-size:11.5px;color:var(--muted);font-weight:500}
.qty-ctl{display:flex;align-items:center;gap:2px;border:1px solid var(--border-strong);border-radius:8px;padding:2px;background:var(--field)}
.qty-ctl button{width:26px;height:26px;border:none;background:none;cursor:pointer;border-radius:6px;color:var(--muted);display:flex;align-items:center;justify-content:center}
.qty-ctl button:hover{background:var(--hover);color:var(--text)}
.qty-ctl span{min-width:26px;text-align:center;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums}
.sum-row{display:flex;justify-content:space-between;font-size:13px;padding:3.5px 0;color:var(--muted);font-variant-numeric:tabular-nums}
.sum-row.total{font-size:17px;font-weight:800;color:var(--text);padding-top:9px}
.pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.pay-opt{border:1.5px solid var(--border-strong);border-radius:11px;padding:12px;display:flex;align-items:center;gap:9px;cursor:pointer;background:var(--field);font-size:13px;font-weight:600;transition:all .13s;color:var(--text)}
.pay-opt.active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-text)}
.shortcut-bar{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:10px 16px;border-top:1px solid var(--border);font-size:11px;color:var(--muted2)}
.mobile-cart-bar{display:none;position:fixed;left:14px;right:14px;z-index:60;box-shadow:var(--shadow-lg)}

/* receipt / invoice (always light, document style) */
.receipt{font-size:12.5px;color:#1e293b;background:#fff;--muted:#64748b;--muted2:#94a3b8;--text:#1e293b;--border:#e2e8f0}
.rc-head{text-align:center;padding-bottom:12px;border-bottom:1.5px dashed #cbd5e1}
.rc-head h3{font-size:16px;font-weight:800}
.rc-line{display:flex;justify-content:space-between;gap:12px;padding:2.5px 0}
.rc-items{border-bottom:1.5px dashed #cbd5e1;padding:10px 0}
.rc-item{padding:4px 0}
.rc-totals{padding-top:10px}
.rc-foot{text-align:center;padding-top:12px;border-top:1.5px dashed #cbd5e1;margin-top:12px;color:#64748b}
.inv-doc{background:#fff;border-radius:16px;max-width:820px;margin:0 auto;padding:40px 44px;color:#111827;--muted:#6b7280;--muted2:#9ca3af;--text:#111827;--border:#e5e7eb;--thead:#f9fafb;--hover:#f9fafb;box-shadow:var(--shadow)}
.inv-grid{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}

/* matrix */
.matrix{width:100%;border-collapse:collapse;font-size:13px}
.matrix th{padding:9px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted2);background:var(--thead);border-bottom:1px solid var(--border);text-align:center}
.matrix th:first-child{text-align:left}
.matrix td{padding:9px 12px;border-bottom:1px solid var(--border);text-align:center}
.matrix td:first-child{text-align:left;font-weight:600}
.matrix input{width:16px;height:16px;accent-color:var(--accent);cursor:pointer}
.matrix input:disabled{cursor:not-allowed;opacity:.4}

/* settings */
.set-grid{display:grid;grid-template-columns:214px 1fr;gap:18px;align-items:start}
.set-nav{display:flex;flex-direction:column;gap:2px;position:sticky;top:78px}
.set-nav button{display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;background:none;border-radius:10px;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;text-align:left;transition:background .13s,color .13s}
.set-nav button:hover{background:var(--hover);color:var(--text)}
.set-nav button.active{background:var(--accent-soft);color:var(--accent-text)}

/* bottom nav (mobile) */
.bnav{position:fixed;left:0;right:0;bottom:0;z-index:70;display:none;background:var(--glass-strong);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);border-top:1px solid var(--border);padding:6px 8px calc(6px + env(safe-area-inset-bottom))}
.bnav-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 4px;border:none;background:none;color:var(--muted);font-size:10.5px;font-weight:600;cursor:pointer;border-radius:11px;min-height:48px;justify-content:center;transition:background .13s,color .13s}
.bnav-item.active{color:var(--accent-text);background:var(--accent-soft)}
.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.more-item{display:flex;align-items:center;gap:11px;padding:13px 14px;border-radius:12px;border:1px solid var(--border);background:var(--field);cursor:pointer;font-size:13px;font-weight:600;color:var(--text);min-height:48px}
.more-item:active{transform:scale(.98)}
.more-section{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted2);margin:14px 2px 8px}

/* responsive */
@media(max-width:1200px){.kpis{grid-template-columns:repeat(3,1fr)}}
@media(max-width:1024px){
 .pos-grid{grid-template-columns:1fr}
 .cart-panel{position:fixed;left:0;right:0;bottom:0;top:auto;z-index:96;max-height:84vh;border-radius:22px 22px 0 0;border:1px solid var(--glass-border);border-bottom:none;transform:translateY(105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);box-shadow:var(--shadow-lg);background:var(--glass-strong);backdrop-filter:blur(26px) saturate(1.5)}
 .cart-panel::before{content:'';display:block;width:40px;height:4px;border-radius:4px;background:var(--border-strong);margin:10px auto 0}
 .cart-panel.open{transform:none}
 .mobile-cart-bar{display:flex;bottom:calc(78px + env(safe-area-inset-bottom))}
 .set-grid{grid-template-columns:1fr}
 .set-nav{position:static;flex-direction:row;overflow-x:auto}
}
@media(max-width:900px){
 .sidebar{transform:translateX(-100%);width:264px !important}
 .sidebar.open{transform:none;box-shadow:var(--shadow-lg)}
 .main{margin-left:0 !important}
 .login{grid-template-columns:1fr}
 .login-brand{display:none}
 .hide-sm{display:none !important}
 .hide-sm-col{display:none !important}
 .cards-list{display:block}
 .tbl-wrap.desk{display:none}
 .bnav{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr))}
 .content{padding:16px;padding-bottom:96px}
}
@media(min-width:901px){.cards-list{display:none !important}.only-sm{display:none !important}}
@media(max-width:640px){
 .kpis{grid-template-columns:repeat(2,1fr)}
 .topbar{padding:0 12px}
 .form-row{grid-template-columns:1fr}
 .inv-doc{padding:24px 18px}
 .demo-accts{grid-template-columns:1fr}
 .toasts{left:12px;right:12px;max-width:none}
 .toolbar .input,.toolbar select{width:100%;min-width:0}
 .toolbar{gap:8px}
 .page-title{font-size:19px}
}
@media print{
 body *{visibility:hidden !important}
 .mist{display:none !important}
 .print-area,.print-area *{visibility:visible !important}
 .print-area{position:fixed !important;inset:0 !important;overflow:visible !important;box-shadow:none !important;border:none !important;max-height:none !important;background:#fff !important}
 .no-print{display:none !important}
}
@media (prefers-reduced-motion: reduce){
 *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
`;

/* ============================= SEED DATA ============================= */
const PRODUCT_DEFS = [
  ['Wireless Earbuds Pro X2', 'Electronics', 24.5, 49.99, 64, 15], ['USB-C Fast Charge Cable 2m', 'Electronics', 3.2, 9.99, 180, 40],
  ['20000mAh Power Bank', 'Electronics', 14.8, 29.99, 42, 12], ['Bluetooth Speaker Mini', 'Electronics', 12.4, 24.99, 38, 10],
  ['Smart LED Bulb 9W', 'Electronics', 4.1, 11.99, 96, 25], ['Wireless Mouse Silent Click', 'Electronics', 5.6, 14.99, 71, 20],
  ['Mechanical Keyboard TKL', 'Electronics', 22.3, 44.99, 26, 8], ['1080p HD Webcam', 'Electronics', 16.7, 34.99, 19, 8],
  ['HDMI Cable 4K 1.5m', 'Electronics', 2.9, 8.99, 132, 30], ['Clear Shield Phone Case', 'Electronics', 1.8, 7.99, 210, 50],
  ['Tempered Glass Screen Protector', 'Electronics', 1.2, 5.99, 240, 60], ['Silicone Smart Watch Band', 'Electronics', 2.6, 9.49, 88, 20],
  ['Portable SSD 1TB', 'Electronics', 58.0, 99.99, 14, 5], ['Noise Cancelling Headphones', 'Electronics', 42.0, 89.99, 12, 6],
  ['Basmati Rice Premium 5kg', 'Grocery', 8.4, 13.99, 55, 20], ['Extra Virgin Olive Oil 1L', 'Grocery', 6.8, 12.49, 40, 15],
  ['Organic Wildflower Honey 500g', 'Grocery', 4.9, 9.99, 33, 12], ['Whole Wheat Flour 2kg', 'Grocery', 1.9, 3.79, 72, 25],
  ['Arabica Ground Coffee 500g', 'Grocery', 6.2, 11.49, 48, 15], ['Green Tea Bags 100ct', 'Grocery', 3.1, 6.99, 60, 18],
  ['Rolled Oats 1kg', 'Grocery', 2.2, 4.49, 66, 20], ['Crunchy Peanut Butter 400g', 'Grocery', 2.8, 5.49, 58, 18],
  ['Dark Chocolate 70% 100g', 'Grocery', 1.7, 3.99, 90, 30], ['Tomato Pasta Sauce 680g', 'Grocery', 2.1, 4.29, 84, 25],
  ['Canned Chickpeas 400g', 'Grocery', 0.9, 1.99, 120, 35], ['Sparkling Mineral Water 12pk', 'Grocery', 4.6, 8.99, 26, 10],
  ['Mixed Nuts Deluxe 500g', 'Grocery', 7.3, 13.99, 31, 12], ['Pure Maple Syrup 250ml', 'Grocery', 5.4, 10.49, 0, 10],
  ['Cotton Crew T-Shirt M', 'Clothing', 4.2, 12.99, 85, 25], ['Slim Fit Chino Pants 32', 'Clothing', 11.5, 29.99, 44, 15],
  ['Hooded Zip Sweatshirt L', 'Clothing', 13.8, 34.99, 37, 12], ['Lightweight Rain Jacket', 'Clothing', 16.4, 39.99, 21, 8],
  ['Merino Wool Socks 3-Pack', 'Clothing', 4.8, 13.99, 69, 20], ['Classic Baseball Cap', 'Clothing', 3.6, 11.99, 52, 15],
  ['Denim Jacket Vintage Wash', 'Clothing', 21.0, 54.99, 16, 6], ['2-in-1 Running Shorts', 'Clothing', 7.9, 19.99, 41, 12],
  ['Genuine Leather Belt', 'Clothing', 6.3, 17.99, 47, 14], ['Knit Winter Beanie', 'Clothing', 2.9, 9.99, 8, 12],
  ['Canvas Backpack 25L', 'Accessories', 12.6, 29.99, 34, 10], ['Stainless Steel Bottle 750ml', 'Accessories', 5.2, 14.99, 77, 22],
  ['Bifold Leather Wallet', 'Accessories', 7.4, 21.99, 45, 14], ['Polarized Sunglasses', 'Accessories', 6.8, 19.99, 39, 12],
  ['Compact Travel Umbrella', 'Accessories', 4.4, 12.99, 56, 16], ['Laptop Sleeve 14"', 'Accessories', 5.9, 16.99, 28, 10],
  ['Keychain Multi-tool', 'Accessories', 2.3, 8.49, 93, 25], ['Organic Cotton Tote Bag', 'Accessories', 3.1, 9.99, 61, 18],
  ['Slim RFID Card Holder', 'Accessories', 3.9, 12.49, 7, 10], ['Packing Cubes Set of 4', 'Accessories', 6.7, 17.99, 24, 8],
  ['Non-Slip Yoga Mat 6mm', 'Other', 8.9, 22.99, 30, 10], ['Resistance Bands Set', 'Other', 4.6, 13.99, 49, 15],
  ['Bamboo Cutlery Travel Set', 'Other', 2.4, 7.99, 66, 20], ['Vanilla Scented Candle', 'Other', 3.8, 10.99, 54, 15],
  ['A5 Dotted Notebook', 'Other', 1.9, 5.99, 110, 30], ['Gel Pen Set 12 Colors', 'Other', 2.7, 7.49, 95, 25],
  ['Bamboo Desk Organizer', 'Other', 6.2, 16.99, 18, 8], ['Reusable Shopping Bag XL', 'Other', 1.4, 4.99, 140, 40],
];
const BRANDS = ['Voltix', 'Harvest Day', 'UrbanThread', 'TrailForge', 'Auralis', 'PureLeaf', 'Northloom', 'Brightware', 'Casa Vera', 'NordTech'];
const CUSTOMER_NAMES = ['Olivia Bennett', 'Liam Chen', 'Sofia Ramirez', 'Noah Patel', 'Emma Fischer', 'Lucas Moreau', 'Ava Thompson', 'Ethan Kim', 'Maya Robinson', 'Daniel Costa', 'Isabella Rossi', "James O'Connor", 'Zoe Anderson', 'Mateo Alvarez', 'Chloe Dubois', 'Ryan Murphy', 'Hannah Weber', 'David Osei', 'Priya Sharma', 'Tom Novak', 'Grace Lee', 'Samuel Wright', 'Nina Petrova', 'Omar Haddad'];
const SUPPLIER_DEFS = [
  ['Northline Distribution', 'Karen Doyle', 'orders@northline.com', '+1 (555) 010-2201', '480 Freight Ave, Columbus, OH'],
  ['Peak Wholesale Group', 'Marcus Bell', 'sales@peakwholesale.com', '+1 (555) 010-8842', '77 Commerce Rd, Denver, CO'],
  ['Blue Harbor Trading', 'Alice Wong', 'hello@blueharbor.co', '+1 (555) 010-3317', '12 Quay St, Seattle, WA'],
  ['Vertex Supply Co.', 'Ivan Reyes', 'supply@vertexco.com', '+1 (555) 010-9054', '901 Industry Pkwy, Austin, TX'],
  ['Sunfield Imports', 'Fatima Noor', 'contact@sunfield.io', '+1 (555) 010-6620', '230 Harbor Blvd, Long Beach, CA'],
  ['Meridian Goods', 'Peter Lang', 'orders@meridiangoods.com', '+1 (555) 010-4478', '55 Mill Lane, Portland, OR'],
  ['Atlas Distribution Partners', 'Sandra Kim', 'atlas@atlasdp.com', '+1 (555) 010-7731', '3400 Logistics Way, Dallas, TX'],
  ['Everline Logistics', 'George Mbeki', 'sales@everline.co', '+1 (555) 010-1189', '18 Canal St, Chicago, IL'],
  ['Golden Coast Supplies', 'Laura Fields', 'hello@goldencoast.us', '+1 (555) 010-5542', '640 Shoreline Dr, San Diego, CA'],
  ['Cascade Wholesale', 'Ben Carter', 'ben@cascadew.com', '+1 (555) 010-2873', '210 River Rd, Spokane, WA'],
];
const USER_DEFS = [
  ['Alex Morgan', 'admin@demo.com', 'admin123', 'admin', 'Owner / Administrator'],
  ['Rachel Adams', 'manager@demo.com', 'manager123', 'manager', 'Operations Manager'],
  ['Jamie Fox', 'cashier@demo.com', 'cashier123', 'cashier', 'Front Desk Cashier'],
  ['Tom Becker', 'inventory@demo.com', 'inventory123', 'inventory', 'Inventory Controller'],
  ['Nina Kowalski', 'nina.k@meridianretail.com', 'demo123', 'manager', 'Assistant Manager'],
  ['Leo Martins', 'leo.m@meridianretail.com', 'demo123', 'cashier', 'Cashier (Weekend)'],
  ['Sara Haddad', 'sara.h@meridianretail.com', 'demo123', 'cashier', 'Cashier (Part-time)'],
  ['Ivan Petrov', 'ivan.p@meridianretail.com', 'demo123', 'inventory', 'Warehouse Assistant'],
  ['Grace Liu', 'grace.l@meridianretail.com', 'demo123', 'manager', 'Floor Manager'],
  ['Omar Farouk', 'omar.f@meridianretail.com', 'demo123', 'cashier', 'Cashier (Trainee)'],
];

function seedDB() {
  const rnd = mulberry32(42);
  const suppliers = SUPPLIER_DEFS.map((s, i) => ({ id: 'sup' + (i + 1), name: s[0], contact: s[1], email: s[2], phone: s[3], address: s[4], status: i === 7 ? 'Inactive' : 'Active' }));
  const SKU_PRE = { Electronics: 'EL', Grocery: 'GR', Clothing: 'CL', Accessories: 'AC', Other: 'OT' };
  const products = PRODUCT_DEFS.map((d, i) => ({
    id: 'p' + (i + 1), name: d[0], category: d[1], cost: d[2], price: d[3], stock: d[4], min: d[5],
    sku: SKU_PRE[d[1]] + '-' + (1001 + i), barcode: String(8901000000000 + i * 7 + Math.floor(rnd() * 5)),
    brand: BRANDS[i % BRANDS.length], taxable: true, supplierId: suppliers[i % suppliers.length].id,
    description: d[0] + ' — quality ' + d[1].toLowerCase() + ' item from ' + BRANDS[i % BRANDS.length] + '.', image: '', updated: new Date(Date.now() - Math.floor(rnd() * 20) * 864e5).toISOString(),
  }));
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
  const customers = CUSTOMER_NAMES.map((n, i) => ({
    id: 'c' + (i + 1), name: n, phone: '+1 (555) 01' + String(10 + i) + '-' + String(1000 + Math.floor(rnd() * 9000)),
    email: n.toLowerCase().replace(/[^a-z]+/g, '.') + '@' + domains[i % 4], status: i === 18 ? 'Inactive' : 'Active',
    joined: new Date(Date.now() - (30 + Math.floor(rnd() * 400)) * 864e5).toISOString(), notes: '',
  }));
  const users = USER_DEFS.map((u, i) => ({ id: 'u' + (i + 1), name: u[0], email: u[1], password: u[2], role: u[3], title: u[4], status: i === 6 ? 'Inactive' : 'Active', lastLogin: new Date(Date.now() - Math.floor(rnd() * 96 + 1) * 36e5).toISOString() }));
  const payPool = ['Cash', 'Cash', 'Cash', 'Card', 'Card', 'Card', 'Card', 'Bank Transfer', 'Mobile Payment', 'Mobile Payment'];
  const sales = []; let inv = 1000;
  const base = new Date(); base.setHours(0, 0, 0, 0);
  for (let d = 29; d >= 0; d--) {
    const n = d === 0 ? 4 + Math.floor(rnd() * 4) : 2 + Math.floor(rnd() * 6);
    for (let k = 0; k < n; k++) {
      const dt = new Date(base.getTime() - d * 864e5); dt.setHours(9 + Math.floor(rnd() * 12), Math.floor(rnd() * 60), 0, 0);
      if (dt.getTime() > Date.now()) dt.setTime(Date.now() - Math.floor(rnd() * 6 + 1) * 36e5);
      const nItems = 1 + Math.floor(rnd() * 4); const chosen = new Set();
      while (chosen.size < nItems) chosen.add(Math.floor(rnd() * products.length));
      const items = [...chosen].map((idx) => { const p = products[idx]; return { productId: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(rnd() * 3) }; });
      const subtotal = round2(items.reduce((a, it) => a + it.price * it.qty, 0));
      const discount = rnd() < 0.15 ? { type: 'percent', value: rnd() < 0.5 ? 5 : 10 } : { type: 'percent', value: 0 };
      const discountAmt = round2(subtotal * discount.value / 100);
      const taxAmt = round2((subtotal - discountAmt) * 0.08);
      const total = round2(subtotal - discountAmt + taxAmt);
      sales.push({
        id: 's' + (++inv), invoice: 'INV-' + inv, date: dt.toISOString(), customerId: customers[Math.floor(rnd() * customers.length)].id,
        items, subtotal, discount, discountAmt, taxAmt, total, payMethod: payPool[Math.floor(rnd() * payPool.length)],
        status: rnd() < 0.04 ? 'Refunded' : 'Completed', cashier: users[2 + Math.floor(rnd() * 2)].name, amountPaid: total,
      });
    }
  }
  sales.sort((a, b) => a.date < b.date ? 1 : -1);
  const purchases = [];
  for (let i = 0; i < 32; i++) {
    const dt = new Date(Date.now() - Math.floor(rnd() * 60) * 864e5 - Math.floor(rnd() * 8) * 36e5);
    const sup = suppliers[Math.floor(rnd() * suppliers.length)];
    const nItems = 1 + Math.floor(rnd() * 4); const chosen = new Set();
    while (chosen.size < nItems) chosen.add(Math.floor(rnd() * products.length));
    const items = [...chosen].map((idx) => { const p = products[idx]; return { productId: p.id, name: p.name, cost: round2(p.cost * (0.94 + rnd() * 0.1)), qty: 10 + Math.floor(rnd() * 41) }; });
    const total = round2(items.reduce((a, it) => a + it.cost * it.qty, 0) * 1.08);
    purchases.push({ id: 'po' + (i + 1), ref: 'PO-' + (5000 + i), supplierId: sup.id, date: dt.toISOString(), items, total, status: rnd() < 0.2 ? 'Pending' : 'Received', paid: rnd() < 0.7, createdBy: users[1].name });
  }
  purchases.sort((a, b) => a.date < b.date ? 1 : -1);
  const movements = [];
  for (let i = 0; i < 12; i++) {
    const p = products[Math.floor(rnd() * products.length)];
    const q = (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 6));
    movements.push({ id: 'mv' + i, date: new Date(Date.now() - Math.floor(rnd() * 7 + 1) * 864e5).toISOString(), productId: p.id, productName: p.name, type: 'Adjustment', qty: q, reason: ADJUST_REASONS[Math.floor(rnd() * 6)], ref: 'Manual', user: users[3].name });
  }
  const notif = (type, title, body, link, mins) => ({ id: 'n' + uid(), type, title, body, link, read: false, date: new Date(Date.now() - mins * 6e4).toISOString() });
  const notifications = [
    notif('stock', 'Low stock alert', 'Pure Maple Syrup 250ml is out of stock (min 10).', '/inventory', 42),
    notif('stock', 'Low stock alert', 'Slim RFID Card Holder fell below minimum stock (7 left).', '/inventory', 95),
    notif('sale', 'New sale ' + sales[0].invoice, money(sales[0].total) + ' — Cash payment completed.', '/sales', 130),
    notif('purchase', 'Purchase received', purchases[0].ref + ' from ' + suppliers.find((s) => s.id === purchases[0].supplierId).name + ' checked into stock.', '/purchases', 300),
    notif('user', 'New customer registered', 'Priya Sharma joined as a customer.', '/customers', 1500),
    notif('system', 'Backup completed', 'Nightly demo backup finished successfully.', '/settings', 2900),
  ];
  return {
    products, customers, suppliers, sales, purchases, users, movements, notifications, heldCarts: [],
    permissions: JSON.parse(JSON.stringify(DEFAULT_PERMS)),
    settings: {
      business: { name: 'Meridian Retail Group', address: '128 Commerce Street, Suite 400', city: 'Portland, OR 97204', phone: '+1 (555) 012-3456', email: 'hello@meridianretail.com', website: 'www.meridianretail.com' },
      currency: { symbol: '$', code: 'USD' },
      tax: { name: 'Sales Tax', rate: 8, number: 'TAX-REG-88421' },
      invoice: { prefix: 'INV', next: inv + 1, footer: 'Thank you for your business!', notes: 'Goods are returnable within 7 days with receipt.' },
      pos: { requireCustomer: false, autoPrint: false, quickCash: [20, 50, 100] },
      notifications: { lowStock: true, newSale: false, newPurchase: true, backup: true },
      security: { sessionTimeout: 30, twoFactor: false, passwordPolicy: 'Medium' },
    },
  };
}

/* ============================= STORE ============================= */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function StoreProvider({ children }) {
  const [db, setDb] = useState(() => { try { const raw = localStorage.getItem(DB_KEY); if (raw) { const p = JSON.parse(raw); if (p && p.products && p.users) return p; } } catch (e) { } return seedDB(); });
  const [user, setUser] = useState(() => { try { return sessionStorage.getItem(SES_KEY) || localStorage.getItem(SES_KEY) || null; } catch (e) { return null; } });
  const [toasts, setToasts] = useState([]);
  const [pos, setPos] = useState({ items: [], customerId: 'walkin', discount: { type: 'percent', value: 0 } });
  const [booting, setBooting] = useState(true);
  const [pending, setPending] = useState(null);
  const [theme, setTheme] = useState(() => { try { const t = localStorage.getItem(THEME_KEY); if (t === 'dark' || t === 'light') return t; return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; } catch (e) { return 'light'; } });
  useEffect(() => { const t = setTimeout(() => setBooting(false), 620); return () => clearTimeout(t); }, []);
  useEffect(() => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { } }, [db]);
  useEffect(() => { try { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem(THEME_KEY, theme); } catch (e) { } }, [theme]);
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const activeUser = useMemo(() => db.users.find((u) => u.id === user && u.status === 'Active') || null, [user, db.users]);

  const toast = useCallback((msg, type = 'success') => { const id = uid(); setToasts((t) => [...t, { id, msg, type }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800); }, []);

  const can = useCallback((mod, action = 'view') => {
    if (!activeUser) return false;
    if (activeUser.role === 'admin') return true;
    const r = db.permissions[activeUser.role];
    return !!(r && r[mod] && r[mod][action]);
  }, [activeUser, db.permissions]);

  const notify = (d, type, title, body, link) => ({ ...d, notifications: [{ id: 'n' + uid(), type, title, body, link, read: false, date: new Date().toISOString() }, ...d.notifications] });

  const act = {
    login(email, pass, remember) {
      try {
        const u = db.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase() && x.password === pass);
        if (!u) return 'Invalid email or password.';
        if (u.status !== 'Active') return 'This account is deactivated. Contact an administrator.';
        setUser(u.id);
        try { if (remember) localStorage.setItem(SES_KEY, u.id); else sessionStorage.setItem(SES_KEY, u.id); } catch (e) { }
        setDb((d) => ({ ...d, users: d.users.map((x) => x.id === u.id ? { ...x, lastLogin: new Date().toISOString() } : x) }));
        return null;
      } catch (e) {
        return 'Unexpected error during sign in. Please try again.';
      }
    },
    logout() { setUser(null); try { localStorage.removeItem(SES_KEY); sessionStorage.removeItem(SES_KEY); } catch (e) { } window.location.hash = '/'; },
    completeSale({ items, customerId, discount, payMethod, amountPaid }) {
      const st = db.settings; const rate = st.tax.rate;
      let subtotal = 0;
      const detailed = items.map((it) => { const p = db.products.find((x) => x.id === it.productId); subtotal += p.price * it.qty; return { productId: p.id, name: p.name, price: p.price, qty: it.qty }; });
      subtotal = round2(subtotal);
      const discountAmt = discount.type === 'percent' ? round2(subtotal * discount.value / 100) : round2(Math.min(discount.value, subtotal));
      const taxAmt = round2((subtotal - discountAmt) * rate / 100);
      const total = round2(subtotal - discountAmt + taxAmt);
      const sale = { id: 's' + uid(), invoice: st.invoice.prefix + '-' + st.invoice.next, date: new Date().toISOString(), customerId, items: detailed, subtotal, discount, discountAmt, taxAmt, total, payMethod, amountPaid: round2(amountPaid || total), status: 'Completed', cashier: activeUser ? activeUser.name : '—' };
      setDb((d) => {
        let next = { ...d };
        const movs = detailed.map((it) => ({ id: uid(), date: sale.date, productId: it.productId, productName: it.name, type: 'Sale', qty: -it.qty, reason: 'POS sale', ref: sale.invoice, user: activeUser ? activeUser.name : '—' }));
        const lowAlerts = [];
        next.products = d.products.map((p) => { const it = detailed.find((i) => i.productId === p.id); if (!it) return p; const ns = Math.max(0, p.stock - it.qty); if (ns <= p.min && p.stock > p.min) lowAlerts.push(p); return { ...p, stock: ns, updated: sale.date }; });
        next.sales = [sale, ...d.sales];
        next.movements = [...movs, ...d.movements];
        next.settings = { ...d.settings, invoice: { ...d.settings.invoice, next: d.settings.invoice.next + 1 } };
        next = notify(next, 'sale', 'New sale ' + sale.invoice, money(total, d.settings.currency.symbol) + ' — ' + payMethod + ' payment completed.', '/sales');
        lowAlerts.forEach((p) => { next = notify(next, 'stock', 'Low stock alert', p.name + ' is now at ' + p.stock + ' units (min ' + p.min + ').', '/inventory'); });
        return next;
      });
      setPos({ items: [], customerId: 'walkin', discount: { type: 'percent', value: 0 } });
      return sale;
    },
    refundSale(id) {
      setDb((d) => {
        const sale = d.sales.find((s) => s.id === id); if (!sale || sale.status === 'Refunded') return d;
        let next = { ...d, sales: d.sales.map((s) => s.id === id ? { ...s, status: 'Refunded' } : s) };
        const movs = sale.items.map((it) => ({ id: uid(), date: new Date().toISOString(), productId: it.productId, productName: it.name, type: 'Return', qty: it.qty, reason: 'Refund ' + sale.invoice, ref: sale.invoice, user: activeUser ? activeUser.name : '—' }));
        next.products = d.products.map((p) => { const it = sale.items.find((i) => i.productId === p.id); return it ? { ...p, stock: p.stock + it.qty } : p; });
        next.movements = [...movs, ...next.movements];
        return notify(next, 'sale', 'Sale refunded', sale.invoice + ' was refunded and items restocked.', '/sales');
      });
    },
    completePurchase({ supplierId, items, status, paid }) {
      const total = round2(items.reduce((a, it) => a + it.cost * it.qty, 0) * (1 + db.settings.tax.rate / 100));
      const po = { id: 'po' + uid(), ref: 'PO-' + (5000 + db.purchases.length), supplierId, date: new Date().toISOString(), items, total, status, paid: !!paid, createdBy: activeUser ? activeUser.name : '—' };
      setDb((d) => {
        let next = { ...d, purchases: [po, ...d.purchases] };
        if (status === 'Received') {
          const movs = items.map((it) => ({ id: uid(), date: po.date, productId: it.productId, productName: it.name, type: 'Purchase', qty: it.qty, reason: 'Received ' + po.ref, ref: po.ref, user: activeUser ? activeUser.name : '—' }));
          next.products = d.products.map((p) => { const it = items.find((i) => i.productId === p.id); return it ? { ...p, stock: p.stock + it.qty, cost: it.cost, updated: po.date } : p; });
          next.movements = [...movs, ...next.movements];
        }
        const sup = d.suppliers.find((s) => s.id === supplierId);
        return notify(next, 'purchase', 'Purchase ' + po.ref, (status === 'Received' ? 'Received from ' : 'Ordered from ') + (sup ? sup.name : 'supplier') + ' — ' + money(total, d.settings.currency.symbol), '/purchases');
      });
      return po;
    },
    receivePurchase(id) {
      setDb((d) => {
        const po = d.purchases.find((p) => p.id === id); if (!po || po.status === 'Received') return d;
        let next = { ...d, purchases: d.purchases.map((p) => p.id === id ? { ...p, status: 'Received' } : p) };
        const movs = po.items.map((it) => ({ id: uid(), date: new Date().toISOString(), productId: it.productId, productName: it.name, type: 'Purchase', qty: it.qty, reason: 'Received ' + po.ref, ref: po.ref, user: activeUser ? activeUser.name : '—' }));
        next.products = d.products.map((p) => { const it = po.items.find((i) => i.productId === p.id); return it ? { ...p, stock: p.stock + it.qty } : p; });
        next.movements = [...movs, ...next.movements];
        return notify(next, 'purchase', 'Purchase received', po.ref + ' checked into stock.', '/purchases');
      });
    },
    adjustStock(pid, mode, qty, reason) {
      setDb((d) => {
        const p = d.products.find((x) => x.id === pid); if (!p) return d;
        const ns = mode === 'set' ? Math.max(0, qty) : mode === 'add' ? p.stock + qty : Math.max(0, p.stock - qty);
        const delta = ns - p.stock;
        const mv = { id: uid(), date: new Date().toISOString(), productId: pid, productName: p.name, type: 'Adjustment', qty: delta, reason, ref: 'Manual', user: activeUser ? activeUser.name : '—' };
        let next = { ...d, products: d.products.map((x) => x.id === pid ? { ...x, stock: ns, updated: mv.date } : x), movements: [mv, ...d.movements] };
        if (ns <= p.min) next = notify(next, 'stock', 'Low stock alert', p.name + ' is now at ' + ns + ' units (min ' + p.min + ').', '/inventory');
        return next;
      });
    },
    saveProduct(p) {
      setDb((d) => { const exists = p.id && d.products.some((x) => x.id === p.id); return { ...d, products: exists ? d.products.map((x) => x.id === p.id ? { ...x, ...p, updated: new Date().toISOString() } : x) : [{ ...p, id: 'p' + uid(), updated: new Date().toISOString() }, ...d.products] }; });
    },
    deleteProduct(id) { setDb((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) })); },
    saveCustomer(c) { setDb((d) => { const exists = c.id && d.customers.some((x) => x.id === c.id); return exists ? { ...d, customers: d.customers.map((x) => x.id === c.id ? { ...x, ...c } : x) } : { ...notify({ ...d, customers: [{ ...c, id: 'c' + uid(), joined: new Date().toISOString() }, ...d.customers] }, 'user', 'New customer registered', c.name + ' was added to customers.', '/customers') }; }); },
    deleteCustomer(id) { setDb((d) => ({ ...d, customers: d.customers.filter((c) => c.id !== id) })); },
    saveSupplier(s) { setDb((d) => { const exists = s.id && d.suppliers.some((x) => x.id === s.id); return { ...d, suppliers: exists ? d.suppliers.map((x) => x.id === s.id ? { ...x, ...s } : x) : [{ ...s, id: 'sup' + uid() }, ...d.suppliers] }; }); },
    deleteSupplier(id) { setDb((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.id !== id) })); },
    saveUser(u) { setDb((d) => { const exists = u.id && d.users.some((x) => x.id === u.id); return exists ? { ...d, users: d.users.map((x) => x.id === u.id ? { ...x, ...u } : x) } : { ...notify({ ...d, users: [{ ...u, id: 'u' + uid(), lastLogin: null }, ...d.users] }, 'user', 'User account created', u.name + ' (' + ROLES_META[u.role].label + ') can now sign in.', '/users') }; }); },
    deleteUser(id) { setDb((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) })); },
    holdCart(cart, customerId, discount) { setDb((d) => ({ ...d, heldCarts: [{ id: uid(), date: new Date().toISOString(), items: cart, customerId, discount, by: activeUser ? activeUser.name : '—' }, ...d.heldCarts] })); },
    removeHeld(id) { setDb((d) => ({ ...d, heldCarts: d.heldCarts.filter((h) => h.id !== id) })); },
    setPermission(role, mod, action, val) { setDb((d) => ({ ...d, permissions: { ...d.permissions, [role]: { ...d.permissions[role], [mod]: { ...d.permissions[role][mod], [action]: val } } } })); },
    saveSettings(section, values) { setDb((d) => ({ ...d, settings: { ...d.settings, [section]: { ...d.settings[section], ...values } } })); },
    markRead(id) { setDb((d) => ({ ...d, notifications: d.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })); },
    markAllRead() { setDb((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) })); },
    backup() { setDb((d) => notify(d, 'system', 'Backup completed', 'Manual demo backup finished successfully.', '/settings')); },
    resetDemo() { try { localStorage.removeItem(DB_KEY); } catch (e) { } setDb(seedDB()); },
  };

  const value = { db, setDb, user: activeUser, can, act, toast, toasts, pos, setPos, booting, pending, setPending, theme, toggleTheme };
  return (
    <Ctx.Provider value={value}>
      <style>{CSS}</style>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <span className="t-ico" style={{ background: t.type === 'error' ? 'var(--danger-bg)' : t.type === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)', color: t.type === 'error' ? 'var(--danger)' : t.type === 'warning' ? 'var(--warning)' : 'var(--success)' }}>
              <Icon name={t.type === 'error' ? 'alert' : t.type === 'warning' ? 'alert' : 'checkCircle'} size={15} />
            </span>
            <span className="t-msg">{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/* ============================= ROUTER ============================= */
const nav = (p) => { try { if (window.location.hash !== '#' + p) window.location.hash = p; } catch (e) { } };
function useRoute() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => { const f = () => setH(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return h.replace(/^#/, '') || '/';
}
function landingFor(can) { const m = NAV.find((n) => can(n.k)); return m ? m.path : '/'; }
function useChartTheme() {
  const { theme } = useApp();
  return theme === 'dark' ? { grid: 'rgba(255,255,255,.07)', tick: '#7d879e', line: '#6c87f0' } : { grid: 'rgba(16,24,40,.07)', tick: '#8b96ab', line: '#4560e6' };
}
const tooltipStyle = { background: 'var(--glass-strong)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)', boxShadow: 'var(--shadow)' };

/* ============================= UI PRIMITIVES ============================= */
function Btn({ kind = 'primary', size, icon, children, className = '', ...rest }) {
  return <button className={`btn btn-${kind}${size ? ' btn-' + size : ''} ${className}`} {...rest}>{icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}{children}</button>;
}
function Badge({ tone = 'gray', children }) { return <span className={`badge b-${tone}`}>{children}</span>; }
function Field({ label, error, req, hint, children, className }) {
  return <label className={`field ${className || ''}`}><span className="f-label">{label}{req && <em> *</em>}</span>{children}{error ? <span className="f-err">{error}</span> : hint ? <span className="f-hint">{hint}</span> : null}</label>;
}
function Modal({ title, sub, onClose, size = 'md', children, footer, locked }) {
  useEffect(() => { const f = (e) => { if (e.key === 'Escape' && !locked && onClose) onClose(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose, locked]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !locked && onClose) onClose(); }}>
      <div className={`modal m-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
          {!locked && <button className="icon-btn" onClick={onClose} aria-label="Close dialog"><Icon name="x" /></button>}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
function Confirm({ title, message, confirmText = 'Delete', tone = 'danger', onConfirm, onClose }) {
  return (
    <Modal title={title} size="sm" onClose={onClose} footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn kind={tone} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Btn></>}>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)' }}>{message}</p>
    </Modal>
  );
}
function Empty({ icon = 'box', title, message, action }) {
  return <div className="empty"><span className="e-ico"><Icon name={icon} size={21} /></span><h4>{title}</h4>{message && <p>{message}</p>}{action}</div>;
}
function ErrorState({ title = 'Something went wrong', message = "We couldn't load this information.", onRetry }) {
  return <div className="empty"><span className="e-ico" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><Icon name="alert" size={21} /></span><h4>{title}</h4><p>{message}</p>{onRetry && <Btn kind="outline" size="sm" icon="refresh" onClick={onRetry}>Try again</Btn>}</div>;
}
function Spark({ data, color, w = 88, h = 30 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 6) + 3, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: 'block' }}>
      <path d={d} fill="none" style={{ stroke: color }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.3} style={{ fill: color }} />
    </svg>
  );
}
function StatCard({ icon, label, value, sub, tone = 'blue', trend, spark }) {
  const { theme } = useApp();
  const tones = { blue: ['var(--accent-soft)', 'var(--accent-text)'], green: ['var(--success-bg)', 'var(--success)'], amber: ['var(--warning-bg)', 'var(--warning)'], red: ['var(--danger-bg)', 'var(--danger)'], purple: ['var(--purple-bg)', 'var(--purple)'], gray: ['var(--hover)', 'var(--muted)'] };
  const sparkColors = { blue: useChartTheme().line, green: '#18a867', amber: '#e08a1e', red: '#e0554a', purple: '#8b5cf6', gray: theme === 'dark' ? '#7d879e' : '#8b96ab' };
  return (
    <div className="card kpi">
      <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-ico" style={{ background: tones[tone][0], color: tones[tone][1] }}><Icon name={icon} size={16} /></span></div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{trend ? <span className={trend > 0 ? 'trend-up' : 'trend-down'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name={trend > 0 ? 'trendUp' : 'trendDown'} size={12} />{Math.abs(trend)}%</span> : null}{sub}</div>}
      {spark && <div className="kpi-spark"><Spark data={spark} color={sparkColors[tone]} /></div>}
    </div>
  );
}
function PageHead({ title, sub, actions }) {
  return <div className="page-head"><div><h1 className="page-title">{title}</h1>{sub && <p className="page-sub">{sub}</p>}</div>{actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}</div>;
}
function ProductTile({ p, size = 34 }) {
  if (p.image) return <span className="tile" style={{ width: size, height: size, background: '#eef2f7' }}><img src={p.image} alt="" onError={(e) => { e.target.style.display = 'none'; }} /></span>;
  return <span className="tile" style={{ width: size, height: size, background: CATS[p.category] || '#64748b' }}>{initials(p.name)}</span>;
}
function DataTable({ cols, rows, rowKey = 'id', onRow, empty, card }) {
  const [sort, setSort] = useState(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = cols.find((x) => x.key === sort.key); if (!c || !c.sort) return rows;
    return [...rows].sort((a, b) => { const av = c.sort(a), bv = c.sort(b); if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir; return String(av).localeCompare(String(bv)) * sort.dir; });
  }, [rows, sort, cols]);
  const toggle = (c) => { if (!c.sort) return; setSort((s) => s && s.key === c.key ? { key: c.key, dir: -s.dir } : { key: c.key, dir: 1 }); };
  return (
    <div className="card">
      <div className="tbl-wrap desk">
        <table className="tbl">
          <thead><tr>{cols.map((c) => <th key={c.key} className={`${c.sort ? 'sortable' : ''} ${c.num ? 'num' : ''}`} onClick={() => toggle(c)}>{c.label}{sort && sort.key === c.key ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>)}</tr></thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r[rowKey]} className={onRow ? 'clickable' : ''} onClick={() => onRow && onRow(r)}>
                {cols.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (empty || <Empty icon="search" title="No records found" message="Try adjusting your search or filters." />)}
      </div>
      <div className="cards-list">
        {sorted.length === 0 ? (empty || <Empty icon="search" title="No records found" />) : sorted.map((r) => <div className="m-card" key={r[rowKey]} onClick={() => onRow && onRow(r)}>{card ? card(r) : <div className="cell-main">{r.name || r.invoice || r.ref}</div>}</div>)}
      </div>
    </div>
  );
}
function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skel" style={{ width: 220, height: 26, marginBottom: 20 }} />
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <div className="skel" key={i} style={{ height: 118, borderRadius: 14 }} />)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 16 }}>
        <div className="skel" style={{ height: 280, borderRadius: 14 }} />
        <div className="skel" style={{ height: 280, borderRadius: 14 }} />
      </div>
      <div className="skel" style={{ height: 240, borderRadius: 14 }} />
    </div>
  );
}

/* ============================= RECEIPT / INVOICE ============================= */
function ReceiptDoc({ sale }) {
  const { db } = useApp(); const st = db.settings; const sym = st.currency.symbol;
  const cust = db.customers.find((c) => c.id === sale.customerId);
  return (
    <div className="receipt print-area">
      <div className="rc-head">
        <h3>{st.business.name}</h3>
        <div className="mut small">{st.business.address}<br />{st.business.city}<br />{st.business.phone}</div>
        <div style={{ marginTop: 8, fontWeight: 700 }}>{sale.invoice}</div>
        <div className="mut small">{fmtDateTime(sale.date)}</div>
      </div>
      <div style={{ padding: '10px 0', borderBottom: '1.5px dashed #cbd5e1' }}>
        <div className="rc-line"><span className="mut">Customer</span><span style={{ fontWeight: 600 }}>{cust ? cust.name : 'Walk-in Customer'}</span></div>
        <div className="rc-line"><span className="mut">Served by</span><span>{sale.cashier}</span></div>
        <div className="rc-line"><span className="mut">Payment</span><span>{sale.payMethod}</span></div>
      </div>
      <div className="rc-items">
        {sale.items.map((it, i) => (
          <div className="rc-item" key={i}>
            <div className="rc-line"><span style={{ fontWeight: 600 }}>{it.name}</span><span>{money(it.price * it.qty, sym)}</span></div>
            <div className="rc-line small mut"><span>{it.qty} × {money(it.price, sym)}</span><span /></div>
          </div>
        ))}
      </div>
      <div className="rc-totals">
        <div className="rc-line"><span className="mut">Subtotal</span><span>{money(sale.subtotal, sym)}</span></div>
        {sale.discountAmt > 0 && <div className="rc-line"><span className="mut">Discount{sale.discount.type === 'percent' ? ` (${sale.discount.value}%)` : ''}</span><span>-{money(sale.discountAmt, sym)}</span></div>}
        <div className="rc-line"><span className="mut">{st.tax.name} ({st.tax.rate}%)</span><span>{money(sale.taxAmt, sym)}</span></div>
        <div className="rc-line" style={{ fontSize: 15, fontWeight: 800, paddingTop: 6 }}><span>TOTAL</span><span>{money(sale.total, sym)}</span></div>
        <div className="rc-line"><span className="mut">Paid ({sale.payMethod})</span><span>{money(sale.amountPaid, sym)}</span></div>
        {sale.payMethod === 'Cash' && sale.amountPaid > sale.total && <div className="rc-line"><span className="mut">Change</span><span>{money(sale.amountPaid - sale.total, sym)}</span></div>}
      </div>
      <div className="rc-foot">{st.invoice.footer}<br /><span className="small">{st.invoice.notes}</span></div>
    </div>
  );
}
function receiptText(sale, st) {
  const sym = st.currency.symbol; const lines = [];
  lines.push(st.business.name, st.business.address + ' ' + st.business.city, st.business.phone, '--------------------------------', sale.invoice + '  ' + fmtDateTime(sale.date), 'Payment: ' + sale.payMethod, '--------------------------------');
  sale.items.forEach((it) => lines.push(it.qty + ' x ' + it.name + '  ' + money(it.price * it.qty, sym)));
  lines.push('--------------------------------', 'Subtotal: ' + money(sale.subtotal, sym), 'Discount: -' + money(sale.discountAmt, sym), st.tax.name + ': ' + money(sale.taxAmt, sym), 'TOTAL: ' + money(sale.total, sym), '--------------------------------', st.invoice.footer);
  return lines.join('\n');
}
function useInvoiceActions() {
  const { db, toast } = useApp();
  return {
    print: () => setTimeout(() => window.print(), 60),
    download: (sale) => { downloadText(sale.invoice + '.txt', receiptText(sale, db.settings)); toast('Receipt downloaded (simulated PDF in production).'); },
    share: (sale) => { const link = window.location.origin + window.location.pathname + '#/invoices/' + sale.id; if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => toast('Invoice link copied to clipboard.')).catch(() => toast('Share link: ' + link, 'warning')); else toast('Share link: ' + link, 'warning'); },
  };
}
function ReceiptModal({ sale, onClose }) {
  const inv = useInvoiceActions();
  return (
    <Modal title="Sale completed" sub={sale.invoice + ' • ' + fmtDateTime(sale.date)} onClose={onClose} size="md"
      footer={<><Btn kind="ghost" icon="print" onClick={inv.print}>Print</Btn><Btn kind="ghost" icon="download" onClick={() => inv.download(sale)}>Download</Btn><Btn kind="ghost" icon="share" onClick={() => inv.share(sale)}>Share</Btn><Btn icon="check" onClick={() => nav('/invoices/' + sale.id)}>Open Invoice</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span className="success-pop" style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="checkCircle" size={28} /></span>
        <strong style={{ fontSize: 15 }}>Payment successful</strong>
        <span className="mut small">{sale.invoice} • {money(sale.total)}</span>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, maxHeight: 360, overflowY: 'auto', background: '#fff' }}>
        <ReceiptDoc sale={sale} />
      </div>
    </Modal>
  );
}

/* ============================= COMMAND PALETTE & GLOBAL PARTS ============================= */
function useClickOutside(ref, cb) {
  useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); }; document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f); }, [ref, cb]);
}
function useQuickActions() {
  const { can, setPending } = useApp();
  return useMemo(() => {
    const list = [];
    if (can('pos', 'create')) list.push({ icon: 'cart', label: 'New Sale', sub: 'Open POS billing', run: () => nav('/pos') });
    if (can('products', 'create')) list.push({ icon: 'box', label: 'Add Product', sub: 'Create a catalog item', run: () => { nav('/products'); setPending('addProduct'); } });
    if (can('customers', 'create')) list.push({ icon: 'users', label: 'Add Customer', sub: 'Create a customer profile', run: () => { nav('/customers'); setPending('addCustomer'); } });
    if (can('purchases', 'create')) list.push({ icon: 'truck', label: 'Create Purchase', sub: 'Order stock from a supplier', run: () => { nav('/purchases'); setPending('createPurchase'); } });
    if (can('inventory')) list.push({ icon: 'layers', label: 'Open Inventory', sub: 'Stock levels & adjustments', run: () => nav('/inventory') });
    if (can('reports')) list.push({ icon: 'chart', label: 'Open Reports', sub: 'Sales, purchases & inventory', run: () => nav('/reports') });
    if (can('users')) list.push({ icon: 'user', label: 'Manage Users', sub: 'Team accounts', run: () => nav('/users') });
    if (can('settings')) list.push({ icon: 'sliders', label: 'Settings', sub: 'Business configuration', run: () => nav('/settings') });
    return list;
  }, [can, setPending]);
}
function CommandPalette({ onClose }) {
  const { db, can } = useApp();
  const actions = useQuickActions();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
  const items = useMemo(() => {
    const ql = q.trim().toLowerCase(); const arr = [];
    const allNav = NAV.filter((n) => can(n.k)).map((n) => ({ g: 'Navigate', icon: n.icon, label: n.label, sub: n.path, run: () => nav(n.path) }));
    if (!ql) {
      actions.forEach((a) => arr.push({ ...a, g: 'Quick actions' }));
      allNav.forEach((n) => arr.push(n));
      return arr;
    }
    actions.filter((a) => a.label.toLowerCase().includes(ql)).forEach((a) => arr.push({ ...a, g: 'Quick actions' }));
    allNav.filter((n) => n.label.toLowerCase().includes(ql)).forEach((n) => arr.push(n));
    db.products.filter((p) => (p.name + p.sku + p.barcode).toLowerCase().includes(ql)).slice(0, 4)
      .forEach((p) => arr.push({ g: 'Products', icon: 'box', label: p.name, sub: p.sku + ' • ' + p.stock + ' in stock', run: () => nav('/products/' + p.id) }));
    db.customers.filter((c) => (c.name + c.phone + c.email).toLowerCase().includes(ql)).slice(0, 3)
      .forEach((c) => arr.push({ g: 'Customers', icon: 'users', label: c.name, sub: c.phone, run: () => nav('/customers/' + c.id) }));
    db.suppliers.filter((s) => s.name.toLowerCase().includes(ql)).slice(0, 3)
      .forEach((s) => arr.push({ g: 'Suppliers', icon: 'building', label: s.name, sub: s.contact, run: () => nav('/suppliers/' + s.id) }));
    db.sales.filter((s) => s.invoice.toLowerCase().includes(ql)).slice(0, 3)
      .forEach((s) => arr.push({ g: 'Sales', icon: 'receipt', label: s.invoice, sub: fmtDate(s.date), run: () => nav('/sales/' + s.id) }));
    db.purchases.filter((p) => p.ref.toLowerCase().includes(ql)).slice(0, 3)
      .forEach((p) => arr.push({ g: 'Purchases', icon: 'truck', label: p.ref, sub: fmtDate(p.date), run: () => nav('/purchases/' + p.id) }));
    return arr;
  }, [q, db, can, actions]);
  useEffect(() => { setIdx(0); }, [q]);
  const run = (it) => { if (!it) return; it.run(); onClose(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(items[idx]); }
    else if (e.key === 'Escape') { onClose(); }
  };
  let lastG = null;
  return (
    <div className="palette-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="pal-input">
          <Icon name="search" size={17} className="mut" />
          <input placeholder="Search products, customers, invoices… or run an action" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} aria-label="Command palette search" />
          <span className="kbd">esc</span>
        </div>
        <div className="pal-list">
          {items.length === 0 && <Empty icon="search" title="No results" message={`Nothing matched “${q}”.`} />}
          {items.map((it, i) => {
            const showG = it.g !== lastG; lastG = it.g;
            return (
              <React.Fragment key={i}>
                {showG && <div className="pal-group">{it.g}</div>}
                <button className={`pal-item ${i === idx ? 'active' : ''}`} onMouseEnter={() => setIdx(i)} onClick={() => run(it)}>
                  <span className="p-ico"><Icon name={it.icon} size={15} /></span>
                  <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600 }}>{it.label}</span>{it.sub && <span className="p-sub">{it.sub}</span>}</span>
                  {i === idx && <span className="p-kbd"><span className="kbd">↵</span></span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="pal-foot"><span><span className="kbd">↑↓</span> navigate</span><span><span className="kbd">↵</span> select</span><span><span className="kbd">esc</span> close</span></div>
      </div>
    </div>
  );
}
function Mist() {
  return <div className="mist" aria-hidden="true"><i className="m1" /><i className="m2" /><i className="m3" /></div>;
}

/* ============================= SHELL ============================= */
function NotifPanel({ onClose }) {
  const { db, act } = useApp();
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  const icons = { sale: ['receipt', 'var(--success-bg)', 'var(--success)'], purchase: ['truck', 'var(--info-bg)', 'var(--info)'], stock: ['layers', 'var(--warning-bg)', 'var(--warning)'], user: ['user', 'var(--purple-bg)', 'var(--purple)'], system: ['info', 'var(--hover)', 'var(--muted)'] };
  const todayK = dayKey(new Date());
  const today = db.notifications.filter((n) => dayKey(n.date) === todayK).slice(0, 20);
  const earlier = db.notifications.filter((n) => dayKey(n.date) !== todayK).slice(0, 20);
  const Row = ({ n }) => { const ic = icons[n.type] || icons.system; return (
    <button className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => { act.markRead(n.id); if (n.link) nav(n.link); onClose(); }}>
      <span className="notif-ico" style={{ background: ic[1], color: ic[2] }}><Icon name={ic[0]} size={16} /></span>
      <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{n.title}</span><span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{n.body}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginTop: 4 }}>{timeAgo(n.date)}</span></span>
    </button>
  ); };
  return (
    <div className="drop notif-drop" ref={ref} role="dialog" aria-label="Notifications">
      <div className="notif-head"><strong style={{ fontSize: 14 }}>Notifications</strong><button className="link" onClick={act.markAllRead}>Mark all read</button></div>
      <div style={{ maxHeight: 430, overflowY: 'auto' }}>
        {db.notifications.length === 0 && <Empty icon="bell" title="All caught up" message="No notifications yet." />}
        {today.length > 0 && <div className="pal-group">Today</div>}
        {today.map((n) => <Row key={n.id} n={n} />)}
        {earlier.length > 0 && <div className="pal-group">Earlier</div>}
        {earlier.map((n) => <Row key={n.id} n={n} />)}
      </div>
    </div>
  );
}
function UserMenu({ onClose }) {
  const { user, act, can, theme, toggleTheme } = useApp();
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  return (
    <div className="drop user" ref={ref}>
      <div className="drop-head"><span className="avatar lg">{initials(user.name)}</span><span style={{ minWidth: 0 }}><strong style={{ fontSize: 13.5, display: 'block' }}>{user.name}</strong><span className="mut small" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span><div style={{ marginTop: 5 }}><Badge tone="blue">{ROLES_META[user.role].label}</Badge></div></span></div>
      {can('settings') && <button className="drop-item" onClick={() => { nav('/settings'); onClose(); }}><Icon name="sliders" size={15} />Preferences & settings</button>}
      <button className="drop-item" onClick={() => { toggleTheme(); }}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</button>
      <button className="drop-item danger" onClick={act.logout}><Icon name="logout" size={15} />Sign out</button>
    </div>
  );
}
function BizSelector() {
  const { db, toast } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="search-trigger" style={{ flex: 'none', maxWidth: 230, gap: 9 }} onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open}>
        <span className="brand-logo" style={{ width: 24, height: 24, borderRadius: 7 }}><img src={LOGO_URL} alt="" style={{ width: 16, height: 16 }} onError={(e) => { e.target.style.display = 'none'; }} /></span>
        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{db.settings.business.name}</span>
        <Icon name="chevD" size={14} />
      </button>
      {open && (
        <div className="drop" style={{ width: 280, left: 0, right: 'auto' }}>
          <div className="drop-head" style={{ gap: 12 }}>
            <span className="brand-logo" style={{ width: 38, height: 38 }}><img src={LOGO_URL} alt="" style={{ width: 26, height: 26 }} onError={(e) => { e.target.style.display = 'none'; }} /></span>
            <span><strong style={{ fontSize: 13.5, display: 'block' }}>{db.settings.business.name}</strong><span className="mut small">{db.settings.business.city}</span></span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <Badge tone="blue">Demo workspace</Badge>
            <p className="small mut" style={{ marginTop: 10, lineHeight: 1.6 }}>Multi-branch and multiple businesses are available in the production build.</p>
          </div>
          <button className="drop-item" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }} onClick={() => { setOpen(false); toast('Multi-branch is planned for the production release.', 'warning'); }}><Icon name="plus" size={15} />Add branch (production)</button>
        </div>
      )}
    </div>
  );
}
function QuickMenu() {
  const actions = useQuickActions();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  if (!actions.length) return null;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Quick actions" aria-haspopup="true" aria-expanded={open} style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name="zap" size={17} /></button>
      {open && (
        <div className="drop" style={{ width: 264 }}>
          <div className="pal-group" style={{ paddingTop: 12 }}>Quick actions</div>
          {actions.slice(0, 6).map((a) => <button key={a.label} className="drop-item" onClick={() => { a.run(); setOpen(false); }}><Icon name={a.icon} size={15} />{a.label}</button>)}
        </div>
      )}
    </div>
  );
}
function BottomNav() {
  const { can } = useApp();
  const route = useRoute();
  const [more, setMore] = useState(false);
  const root = '/' + (route.split('/').filter(Boolean)[0] || '');
  const land = landingFor(can);
  const tabs = [
    { label: 'Home', path: land, icon: 'home', home: true },
    { label: 'POS', path: '/pos', icon: 'cart', k: 'pos' },
    { label: 'Inventory', path: '/inventory', icon: 'layers', k: 'inventory' },
    { label: 'Sales', path: '/sales', icon: 'receipt', k: 'sales' },
  ].filter((t) => t.home || can(t.k));
  const tabPaths = tabs.slice(1).map((t) => t.path);
  const moreItems = NAV.filter((n) => can(n.k) && !tabPaths.includes(n.path));
  return (
    <>
      <nav className="bnav" aria-label="Mobile navigation">
        {tabs.map((t) => {
          const active = t.home ? !tabPaths.includes(root) : root === t.path;
          return <button key={t.label} className={`bnav-item ${active ? 'active' : ''}`} onClick={() => nav(t.path)}><Icon name={t.icon} size={19} />{t.label}</button>;
        })}
        <button className={`bnav-item ${more ? 'active' : ''}`} onClick={() => setMore(true)}><Icon name="dots" size={19} />More</button>
      </nav>
      {more && (
        <>
          <div className="sheet-overlay" onClick={() => setMore(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="More navigation">
            <div className="grab" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: 15 }}>All modules</strong>
              <button className="icon-btn" onClick={() => setMore(false)} aria-label="Close"><Icon name="x" /></button>
            </div>
            {['MAIN', 'ADMIN'].map((g) => {
              const items = moreItems.filter((n) => n.group === g);
              if (!items.length) return null;
              return (
                <div key={g}>
                  <div className="more-section">{g === 'ADMIN' ? 'Administration' : 'Operations'}</div>
                  <div className="more-grid">
                    {items.map((n) => <button key={n.k} className="more-item" onClick={() => { nav(n.path); setMore(false); }}><Icon name={n.icon} size={17} className="mut" />{n.label}</button>)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
function Sidebar({ collapsed, mobileOpen, onToggle, onNavigate }) {
  const { db, can } = useApp();
  const route = useRoute();
  const root = '/' + (route.split('/').filter(Boolean)[0] || '');
  const groups = ['MAIN', 'ADMIN'];
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`} aria-label="Main navigation">
      <div className="brand">
        <span className="brand-logo"><img src={LOGO_URL} alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} /></span>
        {!collapsed && <span><span className="brand-name" style={{ display: 'block' }}>{db.settings.business.name}</span><span className="brand-sub">Business Suite</span></span>}
      </div>
      <nav className="nav-scroll">
        {groups.map((g) => {
          const items = NAV.filter((n) => n.group === g && can(n.k));
          if (!items.length) return null;
          return (
            <div key={g}>
              {!collapsed && <div className="nav-section">{g === 'ADMIN' ? 'Administration' : 'Operations'}</div>}
              {items.map((n) => (
                <button key={n.k} className={`nav-item ${root === n.path ? 'active' : ''}`} title={n.label} onClick={() => { nav(n.path); onNavigate(); }}>
                  <Icon name={n.icon} size={17} />{!collapsed && <span>{n.label}</span>}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="side-foot">
        {!collapsed && <div className="demo-pill">V1 Interactive Prototype</div>}
        <button className="nav-item" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Icon name={collapsed ? 'chevR' : 'chevL'} size={16} />{!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
function Shell({ children }) {
  const { db, user, theme, toggleTheme } = useApp();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('bms_side') === '1'; } catch (e) { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const unread = db.notifications.filter((n) => !n.read).length;
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem('bms_side', c ? '0' : '1'); } catch (e) { } return !c; });
  useEffect(() => {
    const f = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  const closeAll = () => { setNotifOpen(false); setUserOpen(false); };
  return (
    <div className="shell">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggle} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <div style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', zIndex: 45 }} onClick={() => setMobileOpen(false)} />}
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="topbar">
          <button className="icon-btn only-sm" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="hide-sm"><BizSelector /></div>
          <span className="topbar-brand only-sm">{db.settings.business.name}</span>
          <button className="search-trigger" onClick={() => setPalette(true)} aria-label="Open search and commands" style={{ marginLeft: 6 }}>
            <Icon name="search" size={15} />
            <span className="hide-sm">Search or run a command…</span>
            <span className="kbd hide-sm">⌘K</span>
          </button>
          <div style={{ flex: 1 }} />
          <div className="hide-sm"><QuickMenu /></div>
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button>
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }} aria-label={`Notifications (${unread} unread)`}>
              <Icon name="bell" />{unread > 0 && <span className="bell-dot" />}
            </button>
            {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="avatar" onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }} aria-label="Account menu">{initials(user.name)}</button>
            {userOpen && <UserMenu onClose={() => setUserOpen(false)} />}
          </div>
        </header>
        <main className="content" onClick={closeAll}>{children}</main>
      </div>
      <BottomNav />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}

/* ============================= LOGIN ============================= */
const DEMO_ACCOUNTS = [
  ['Admin', 'admin@demo.com', 'admin123'],
  ['Manager', 'manager@demo.com', 'manager123'],
  ['Cashier', 'cashier@demo.com', 'cashier123'],
  ['Inventory Staff', 'inventory@demo.com', 'inventory123'],
];
function LoginPage() {
  const { act, db, toast, theme, toggleTheme } = useApp();
  const [email, setEmail] = useState('admin@demo.com');
  const [pass, setPass] = useState('admin123');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const doLogin = useCallback((em, pw, rem) => {
    setErr('');
    const cleanEmail = String(em || '').trim();
    if (!cleanEmail || !pw) {
      setErr('Email and password are required.');
      setShakeKey((k) => k + 1);
      return;
    }
    const result = act.login(cleanEmail, pw, rem);
    if (result) {
      setErr(result);
      setShakeKey((k) => k + 1);
      toast(result, 'error');
    } else {
      nav('/');
    }
  }, [act, toast]);

  const submit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    doLogin(email, pass, remember);
  };

  return (
    <div className="login">
      <div className="login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="brand-logo"><img src={LOGO_URL} alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} /></span>
          <span><span className="brand-name" style={{ display: 'block', fontSize: 16 }}>{db.settings.business.name}</span><span className="brand-sub">Business Management System</span></span>
        </div>
        <div>
          <h2 style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 800, color: '#f8fafc', maxWidth: 430, letterSpacing: '-.02em' }}>One system for sales, inventory, purchasing and people.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26, fontSize: 14, color: '#94a3b8' }}>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="cart" size={16} />Fast POS billing with live inventory updates</span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="layers" size={16} />Stock control, purchasing and supplier management</span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="chart" size={16} />Dashboards, reports and role-based access</span>
          </div>
        </div>
        <div className="small" style={{ color: '#64748b' }}>V1 interactive prototype — demo data only. No real transactions are processed.</div>
      </div>
      <div className="login-form-side">
        <button className="icon-btn theme-corner" onClick={toggleTheme} aria-label="Toggle theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button>
        <div className="login-card">
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>Sign in</h1>
          <p className="mut" style={{ margin: '6px 0 22px', fontSize: 13.5 }}>Welcome back. Use a demo account to explore the system.</p>
          <form onSubmit={submit} noValidate>
            <Field label="Email address" req>
              <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            <Field label="Password" req>
              <span className="pw-wrap">
                <input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                <button type="button" className="icon-btn pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name={show ? 'x' : 'eye'} size={16} /></button>
              </span>
            </Field>
            {err && <div key={shakeKey} className="shake" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }} role="alert"><Icon name="alert" size={15} />{err}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me</label>
              <button type="button" className="link" onClick={() => toast('Password reset link sent to your email (simulated).', 'warning')}>Forgot password?</button>
            </div>
            <Btn kind="primary" size="lg" className="btn-block" type="submit">Sign in</Btn>
          </form>
          <div className="divider" />
          <p className="small mut" style={{ marginBottom: 9, fontWeight: 600 }}>Demo accounts — tap to sign in instantly:</p>
          <div className="demo-accts">
            {DEMO_ACCOUNTS.map((d) => (
              <button type="button" className="demo-acct" key={d[1]} onClick={() => { setEmail(d[1]); setPass(d[2]); doLogin(d[1], d[2], true); }}>
                <span className="da-role">{d[0]}</span><span className="da-mail" style={{ display: 'block' }}>{d[1]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= DASHBOARD ============================= */
function DashboardPage() {
  const { db, can } = useApp();
  const ct = useChartTheme();
  const sym = db.settings.currency.symbol;
  const [range, setRange] = useState('7');
  const completed = useMemo(() => db.sales.filter((s) => s.status !== 'Refunded'), [db.sales]);
  const todayK = dayKey(new Date()); const yestK = dayKey(new Date(Date.now() - 864e5));
  const todaySales = completed.filter((s) => s.date.slice(0, 10) === todayK);
  const yestSales = completed.filter((s) => s.date.slice(0, 10) === yestK);
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);
  const yestTotal = yestSales.reduce((a, s) => a + s.total, 0);
  const trend = yestTotal > 0 ? Math.round(((todayTotal - yestTotal) / yestTotal) * 100) : 0;
  const low = db.products.filter((p) => p.stock > 0 && p.stock <= p.min);
  const out = db.products.filter((p) => p.stock <= 0);
  const last7 = useMemo(() => {
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const totals = []; const counts = [];
    for (let i = 6; i >= 0; i--) {
      const k = dayKey(new Date(base.getTime() - i * 864e5));
      const day = completed.filter((s) => s.date.slice(0, 10) === k);
      totals.push(round2(day.reduce((a, s) => a + s.total, 0))); counts.push(day.length);
    }
    return { totals, counts };
  }, [completed]);
  const staticSpark = (seed, baseV) => { const r = mulberry32(seed); return Array.from({ length: 9 }, (_, i) => baseV + i * (baseV * 0.02) + r() * baseV * 0.06); };
  const trendData = useMemo(() => {
    const days = range === '7' ? 7 : 30;
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const out2 = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(base.getTime() - i * 864e5); const k = dayKey(d);
      out2.push({ label: days === 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: round2(completed.filter((s) => s.date.slice(0, 10) === k).reduce((a, s) => a + s.total, 0)) });
    }
    return out2;
  }, [completed, range]);
  const monthData = useMemo(() => {
    const rnd = mulberry32(7); const out2 = []; const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const real = completed.filter((s) => s.date.slice(0, 7) === key).reduce((a, s) => a + s.total, 0);
      out2.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value: round2(real > 0 ? real : 12000 + (11 - i) * 850 + rnd() * 5000) });
    }
    return out2;
  }, [completed]);
  const catData = useMemo(() => {
    const map = {};
    completed.forEach((s) => s.items.forEach((it) => { const p = db.products.find((x) => x.id === it.productId); const c = p ? p.category : 'Other'; map[c] = (map[c] || 0) + it.price * it.qty; }));
    return Object.entries(map).map(([name, value]) => ({ name, value: round2(value) })).sort((a, b) => b.value - a.value);
  }, [completed, db.products]);
  const topProducts = useMemo(() => {
    const map = {};
    completed.forEach((s) => s.items.forEach((it) => { if (!map[it.productId]) map[it.productId] = { name: it.name, units: 0, revenue: 0 }; map[it.productId].units += it.qty; map[it.productId].revenue += it.qty * it.price; }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completed]);
  return (
    <>
      <PageHead title="Dashboard" sub="Business overview" actions={can('pos') ? <Btn icon="cart" onClick={() => nav('/pos')}>Open POS</Btn> : null} />
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <StatCard icon="dollar" label="Today's Sales" value={money(todayTotal, sym)} sub=" vs yesterday" trend={trend} tone="blue" spark={last7.totals} />
        <StatCard icon="receipt" label="Today's Orders" value={int(todaySales.length)} sub=" transactions" tone="green" spark={last7.counts} />
        <StatCard icon="box" label="Total Products" value={int(db.products.length)} sub={int(db.products.reduce((a, p) => a + p.stock, 0)) + ' units on hand'} tone="purple" spark={staticSpark(11, 40)} />
        <StatCard icon="alert" label="Low Stock" value={int(low.length + out.length)} sub={out.length + ' out of stock'} tone={low.length + out.length > 0 ? 'amber' : 'green'} spark={staticSpark(22, 24)} />
        <StatCard icon="users" label="Customers" value={int(db.customers.length)} sub={db.customers.filter((c) => c.status === 'Active').length + ' active'} tone="gray" spark={staticSpark(33, 22)} />
        <StatCard icon="building" label="Suppliers" value={int(db.suppliers.length)} sub={db.suppliers.filter((s) => s.status === 'Active').length + ' active'} tone="gray" spark={staticSpark(44, 10)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Sales Trend</div><div className="card-sub">Completed sales revenue</div></div>
            <div className="chips">{['7', '30', '12'].map((r) => <button key={r} className={`chip ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r === '12' ? '12 months' : r + ' days'}</button>)}</div>
          </div>
          <div style={{ height: 280, padding: '12px 8px 4px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={range === '12' ? monthData : trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ct.line} stopOpacity={0.25} /><stop offset="100%" stopColor={ct.line} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: ct.tick }} tickLine={false} axisLine={false} interval={range === '30' ? 4 : 0} />
                <YAxis tick={{ fontSize: 11, fill: ct.tick }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => sym + v} />
                <Tooltip formatter={(v) => [money(v, sym), 'Revenue']} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke={ct.line} strokeWidth={2.2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Sales by Category</div></div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>{catData.map((c, i) => <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie>
                <Tooltip formatter={(v) => money(v, sym)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Recent Transactions</div>{can('sales') && <button className="link" onClick={() => nav('/sales')}>View all</button>}</div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Invoice</th><th>Customer</th><th className="hide-sm-col">Date</th><th className="num">Amount</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>{db.sales.slice(0, 8).map((s) => { const c = db.customers.find((x) => x.id === s.customerId); return (
              <tr key={s.id} className={can('sales') ? 'clickable' : ''} onClick={() => can('sales') && nav('/sales/' + s.id)}>
                <td className="cell-main">{s.invoice}</td><td>{c ? c.name : 'Walk-in'}</td><td className="hide-sm-col mut">{fmtDateTime(s.date)}</td><td className="num" style={{ fontWeight: 700 }}>{money(s.total, sym)}</td><td className="mut">{s.payMethod}</td><td><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
              </tr>); })}</tbody>
          </table></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head"><div className="card-title">Low Stock</div>{can('inventory') && <button className="link" onClick={() => nav('/inventory')}>Manage</button>}</div>
            {low.length + out.length === 0 ? <Empty icon="checkCircle" title="Stock levels healthy" /> : (
              <div style={{ padding: '6px 0' }}>{[...out, ...low].slice(0, 6).map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 16px' }}>
                  <ProductTile p={p} size={30} />
                  <span style={{ flex: 1, minWidth: 0 }}><span className="cell-main" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span><span className="cell-sub">{p.stock} units • min {p.min}</span></span>
                  <Badge tone={p.stock <= 0 ? 'red' : 'amber'}>{p.stock <= 0 ? 'Out' : 'Low'}</Badge>
                </div>))}</div>
            )}
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Top Products</div></div>
            <div style={{ padding: '6px 0' }}>{topProducts.map((t, i) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 16px' }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent-text)', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}><span className="cell-main" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span><span className="cell-sub">{int(t.units)} units sold</span></span>
                <strong style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{money(t.revenue, sym)}</strong>
              </div>))}</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================= POS ============================= */
function POSPage() {
  const { db, act, toast, pos, setPos } = useApp();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [modal, setModal] = useState(null);
  const [receiptSale, setReceiptSale] = useState(null);
  const [mobileCart, setMobileCart] = useState(false);
  const [pay, setPay] = useState({ method: 'Cash', received: '' });
  const searchRef = useRef(null);
  const cart = pos.items; const setCart = (items) => setPos((p) => ({ ...p, items }));
  const setCust = (customerId) => setPos((p) => ({ ...p, customerId }));
  const setDisc = (discount) => setPos((p) => ({ ...p, discount }));

  const products = useMemo(() => {
    const ql = q.toLowerCase();
    return db.products.filter((p) => (cat === 'All' || p.category === cat) && (!ql || (p.name + p.sku + p.barcode).toLowerCase().includes(ql)));
  }, [db.products, q, cat]);

  const add = (p, silent) => {
    if (p.stock <= 0) { toast(p.name + ' is out of stock.', 'error'); return; }
    const line = cart.find((c) => c.productId === p.id);
    const inCart = line ? line.qty : 0;
    if (inCart + 1 > p.stock) { toast('Only ' + p.stock + ' unit(s) of ' + p.name + ' in stock.', 'warning'); return; }
    setCart(line ? cart.map((c) => c.productId === p.id ? { ...c, qty: c.qty + 1 } : c) : [...cart, { productId: p.id, qty: 1 }]);
    if (!silent) toast(p.name + ' added to cart.', 'success');
  };
  const setQty = (pid, qty) => {
    const p = db.products.find((x) => x.id === pid);
    if (qty <= 0) { setCart(cart.filter((c) => c.productId !== pid)); return; }
    if (qty > p.stock) { toast('Only ' + p.stock + ' unit(s) available.', 'warning'); return; }
    setCart(cart.map((c) => c.productId === pid ? { ...c, qty } : c));
  };
  const totals = useMemo(() => {
    let subtotal = 0;
    cart.forEach((c) => { const p = db.products.find((x) => x.id === c.productId); subtotal += p.price * c.qty; });
    subtotal = round2(subtotal);
    const discountAmt = pos.discount.type === 'percent' ? round2(subtotal * pos.discount.value / 100) : round2(Math.min(pos.discount.value, subtotal));
    const taxAmt = round2((subtotal - discountAmt) * db.settings.tax.rate / 100);
    return { subtotal, discountAmt, taxAmt, total: round2(subtotal - discountAmt + taxAmt) };
  }, [cart, pos.discount, db.products, db.settings.tax.rate]);

  const holdCart = useCallback(() => {
    if (!cart.length) { toast('Cart is empty — nothing to hold.', 'warning'); return; }
    act.holdCart(cart, pos.customerId, pos.discount);
    setCart([]); setDisc({ type: 'percent', value: 0 });
    toast('Cart held. Resume it anytime from “Held”.', 'success');
  }, [cart, pos.customerId, pos.discount, act, toast]);

  const clearCart = () => { setCart([]); setDisc({ type: 'percent', value: 0 }); setCust('walkin'); };
  const openCheckout = useCallback(() => {
    if (!cart.length) { toast('Add products to the cart first.', 'warning'); return; }
    if (db.settings.pos.requireCustomer && pos.customerId === 'walkin') { toast('Select a customer before checkout (POS setting).', 'warning'); setModal('customer'); return; }
    setPay({ method: 'Cash', received: '' }); setModal('checkout');
  }, [cart.length, db.settings.pos.requireCustomer, pos.customerId, toast]);

  useEffect(() => {
    const f = (e) => {
      if (e.key === 'F2') { e.preventDefault(); if (searchRef.current) searchRef.current.focus(); }
      else if (e.key === 'F4') { e.preventDefault(); setModal('customer'); }
      else if (e.key === 'F8') { e.preventDefault(); holdCart(); }
      else if (e.key === 'F9') { e.preventDefault(); openCheckout(); }
      else if (e.key === 'Escape' && !modal) { if (cart.length) setModal('confirmClear'); }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [holdCart, openCheckout, modal, cart.length]);

  const onSearchKey = (e) => {
    if (e.key === 'Enter') {
      const exact = db.products.find((p) => p.barcode === q.trim() || p.sku.toLowerCase() === q.trim().toLowerCase());
      if (exact) { add(exact); setQ(''); }
    }
  };
  const simulateScan = () => {
    const avail = db.products.filter((p) => p.stock > 0);
    const p = avail[Math.floor(Math.random() * avail.length)];
    add(p, true); setQ('');
    toast('Barcode scanned: ' + p.barcode + ' — ' + p.name, 'success');
  };
  const complete = () => {
    const received = pay.method === 'Cash' ? (parseFloat(pay.received) || 0) : totals.total;
    if (pay.method === 'Cash' && received < totals.total) { toast('Cash received is less than the total due.', 'error'); return; }
    const sale = act.completeSale({ items: cart, customerId: pos.customerId, discount: pos.discount, payMethod: pay.method, amountPaid: received });
    setModal(null); setMobileCart(false); setReceiptSale(sale);
  };
  const custName = pos.customerId === 'walkin' ? 'Walk-in Customer' : (db.customers.find((c) => c.id === pos.customerId) || {}).name;
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);

  return (
    <>
      <PageHead title="POS / Billing" sub="Fast billing — search, scan and checkout" actions={<Btn kind="outline" icon="pause" onClick={() => setModal('held')}>Held carts ({db.heldCarts.length})</Btn>} />
      <div className="pos-grid">
        <div>
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <div className="search-wrap" style={{ maxWidth: 'none', flex: 1, position: 'relative' }}>
              <input ref={searchRef} className="input" style={{ paddingLeft: 38, height: 42 }} placeholder="Search product / scan barcode + Enter  (F2)" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchKey} aria-label="Search products" />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)', pointerEvents: 'none' }}><Icon name="search" size={16} /></span>
            </div>
            <Btn kind="outline" icon="scan" onClick={simulateScan}>Scan</Btn>
          </div>
          <div className="chips" style={{ marginBottom: 14 }}>
            <button className={`chip ${cat === 'All' ? 'active' : ''}`} onClick={() => setCat('All')}>All</button>
            {Object.keys(CATS).map((c) => <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="prod-grid" style={{ maxHeight: 'calc(100vh - 310px)', overflowY: 'auto', paddingRight: 4 }}>
            {products.length === 0 && <div className="card" style={{ gridColumn: '1/-1' }}><Empty icon="search" title="No products match" message="Try a different search term or category." action={<Btn kind="ghost" size="sm" onClick={() => { setQ(''); setCat('All'); }}>Clear filters</Btn>} /></div>}
            {products.map((p) => {
              const line = cart.find((c) => c.productId === p.id);
              return (
                <button key={p.id} className="prod-card" disabled={p.stock <= 0} onClick={() => add(p)} style={{ borderTop: '3px solid ' + (CATS[p.category] || '#64748b') }}>
                  {line && <span className="pc-in-cart">×{line.qty}</span>}
                  <span className="pc-name">{p.name}</span>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="pc-price">{money(p.price, sym)}</span>
                  </span>
                  <span className="pc-stock">{p.stock <= 0 ? <Badge tone="red">Out of stock</Badge> : p.stock <= p.min ? <Badge tone="amber">{p.stock} left</Badge> : p.stock + ' in stock'}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={`cart-panel card ${mobileCart ? 'open' : ''}`}>
          <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Cart {cartCount > 0 && <Badge tone="blue">{cartCount} items</Badge>}</div>
            <button className="icon-btn only-sm" onClick={() => setMobileCart(false)} aria-label="Close cart"><Icon name="x" /></button>
          </div>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <button className="btn btn-outline btn-sm btn-block" onClick={() => setModal('customer')} style={{ justifyContent: 'space-between', minHeight: 40 }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="user" size={14} />{custName}</span><span className="kbd">F4</span>
            </button>
          </div>
          <div className="cart-items">
            {cart.length === 0 ? <Empty icon="cart" title="Cart is empty" message="Search or tap products to start billing." /> : cart.map((c) => {
              const p = db.products.find((x) => x.id === c.productId);
              return (
                <div className="cart-line" key={c.productId}>
                  <span className="cl-name">{p.name}<span className="cl-price">{money(p.price, sym)} each</span></span>
                  <span className="qty-ctl">
                    <button onClick={() => setQty(c.productId, c.qty - 1)} aria-label="Decrease quantity"><Icon name="minus" size={13} /></button>
                    <span>{c.qty}</span>
                    <button onClick={() => setQty(c.productId, c.qty + 1)} aria-label="Increase quantity"><Icon name="plus" size={13} /></button>
                  </span>
                  <strong style={{ minWidth: 62, textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{money(p.price * c.qty, sym)}</strong>
                  <button className="icon-btn sm" onClick={() => setQty(c.productId, 0)} aria-label="Remove line"><Icon name="trash" size={14} /></button>
                </div>
              );
            })}
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div className="sum-row"><span>Subtotal</span><span>{money(totals.subtotal, sym)}</span></div>
            <div className="sum-row"><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Discount <button className="link" style={{ fontSize: 11.5 }} onClick={() => setModal('discount')}>{pos.discount.value > 0 ? (pos.discount.type === 'percent' ? pos.discount.value + '%' : money(pos.discount.value, sym)) : 'Add'}</button></span><span>-{money(totals.discountAmt, sym)}</span></div>
            <div className="sum-row"><span>{db.settings.tax.name} ({db.settings.tax.rate}%)</span><span>{money(totals.taxAmt, sym)}</span></div>
            <div className="sum-row total"><span>Total</span><span>{money(totals.total, sym)}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8, marginTop: 12 }}>
              <Btn kind="outline" icon="pause" onClick={holdCart} title="Hold cart (F8)">Hold</Btn>
              <Btn kind="ghost" icon="trash" onClick={() => cart.length && setModal('confirmClear')} title="Clear cart">Clear</Btn>
              <Btn kind="primary" icon="check" onClick={openCheckout} disabled={!cart.length} title="Checkout (F9)">Charge</Btn>
            </div>
          </div>
          <div className="shortcut-bar"><span><span className="kbd">F2</span> Search</span><span><span className="kbd">F4</span> Customer</span><span><span className="kbd">F8</span> Hold</span><span><span className="kbd">F9</span> Checkout</span><span><span className="kbd">Esc</span> Close / Clear</span></div>
        </div>
      </div>
      <button className="btn btn-primary btn-lg mobile-cart-bar" onClick={() => setMobileCart(true)}>
        <Icon name="cart" size={17} /> View cart • {cartCount} item{cartCount === 1 ? '' : 's'} — {money(totals.total, sym)}
      </button>

      {modal === 'customer' && <CustomerPickModal onClose={() => setModal(null)} current={pos.customerId} onPick={(id) => { setCust(id); setModal(null); }} />}
      {modal === 'discount' && (
        <Modal title="Apply discount" size="sm" onClose={() => setModal(null)} footer={<><Btn kind="ghost" onClick={() => { setDisc({ type: 'percent', value: 0 }); setModal(null); }}>Remove</Btn><Btn onClick={() => setModal(null)}>Apply</Btn></>}>
          <Field label="Discount type"><select className="input" value={pos.discount.type} onChange={(e) => setDisc({ ...pos.discount, type: e.target.value })}><option value="percent">Percentage (%)</option><option value="fixed">Fixed amount ({sym})</option></select></Field>
          <Field label="Value"><input className="input" type="number" min="0" value={pos.discount.value || ''} onChange={(e) => setDisc({ ...pos.discount, value: Math.max(0, parseFloat(e.target.value) || 0) })} placeholder="0" /></Field>
        </Modal>
      )}
      {modal === 'confirmClear' && <Confirm title="Clear cart?" message="This removes all items, discount and customer selection from the current cart." confirmText="Clear cart" onConfirm={clearCart} onClose={() => setModal(null)} />}
      {modal === 'held' && (
        <Modal title="Held carts" sub="Parked carts can be resumed by any cashier" size="md" onClose={() => setModal(null)}>
          {db.heldCarts.length === 0 ? <Empty icon="pause" title="No held carts" message="Use Hold (F8) to park a cart and serve the next customer." /> : db.heldCarts.map((h) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ flex: 1 }}><strong style={{ fontSize: 13.5 }}>{h.items.reduce((a, i) => a + i.qty, 0)} items</strong><span className="cell-sub">{fmtDateTime(h.date)} • by {h.by}</span></span>
              <Btn size="sm" kind="outline" onClick={() => { setCart(h.items); setCust(h.customerId); setDisc(h.discount); act.removeHeld(h.id); setModal(null); toast('Held cart resumed.', 'success'); }}>Resume</Btn>
              <Btn size="sm" kind="ghost" icon="trash" onClick={() => act.removeHeld(h.id)}>Delete</Btn>
            </div>
          ))}
        </Modal>
      )}
      {modal === 'checkout' && (
        <Modal title="Checkout" sub={cartCount + ' items • ' + custName} size="md" onClose={() => setModal(null)} footer={<><Btn kind="ghost" onClick={() => setModal(null)}>Back</Btn><Btn kind="success" icon="check" onClick={complete} disabled={pay.method === 'Cash' && (parseFloat(pay.received) || 0) < totals.total}>Complete sale — {money(totals.total, sym)}</Btn></>}>
          <Field label="Payment method">
            <div className="pay-grid">
              {PAY_METHODS.map((m) => <button key={m.k} className={`pay-opt ${pay.method === m.k ? 'active' : ''}`} onClick={() => setPay({ ...pay, method: m.k })}><Icon name={m.icon} size={16} />{m.k}</button>)}
            </div>
          </Field>
          {pay.method === 'Cash' && (
            <>
              <Field label={'Cash received (' + sym + ')'} error={(parseFloat(pay.received) || 0) < totals.total && pay.received !== '' ? 'Less than total due' : undefined}>
                <input className="input" type="number" min="0" value={pay.received} onChange={(e) => setPay({ ...pay, received: e.target.value })} placeholder={String(totals.total)} autoFocus />
              </Field>
              <div className="chips" style={{ marginBottom: 12 }}>
                <button className="chip" onClick={() => setPay({ ...pay, received: String(totals.total) })}>Exact</button>
                {db.settings.pos.quickCash.map((v) => <button key={v} className="chip" onClick={() => setPay({ ...pay, received: String(v) })}>{sym}{v}</button>)}
              </div>
              <div className="sum-row total" style={{ borderTop: '1px dashed var(--border-strong)' }}><span>Change due</span><span>{money(Math.max(0, (parseFloat(pay.received) || 0) - totals.total), sym)}</span></div>
            </>
          )}
          {pay.method !== 'Cash' && <p className="small mut">Reference / approval code is optional — the terminal flow is simulated in this prototype.</p>}
        </Modal>
      )}
      {receiptSale && <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />}
    </>
  );
}
function CustomerPickModal({ onClose, onPick, current }) {
  const { db } = useApp();
  const [q, setQ] = useState('');
  const list = db.customers.filter((c) => c.status === 'Active' && (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title="Select customer" size="md" onClose={onClose}>
      <input className="input" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus style={{ marginBottom: 12 }} />
      <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
        <button className="sd-item" style={{ width: '100%' }} onClick={() => onPick('walkin')}><span className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>WI</span><span style={{ fontWeight: 600 }}>Walk-in Customer</span>{current === 'walkin' && <span className="mut">• selected</span>}</button>
        {list.map((c) => (
          <button className="sd-item" style={{ width: '100%' }} key={c.id} onClick={() => onPick(c.id)}><span className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(c.name)}</span><span>{c.name}</span><span className="mut">{c.phone}</span></button>
        ))}
        {list.length === 0 && <Empty icon="users" title="No customers found" />}
      </div>
    </Modal>
  );
}

/* ============================= PRODUCTS ============================= */
function productFormInit(p) {
  return p ? { ...p } : { name: '', sku: '', barcode: '', category: 'Electronics', brand: '', description: '', cost: '', price: '', taxable: true, stock: 0, min: 5, supplierId: '', image: '' };
}
function ProductModal({ existing, onClose }) {
  const { db, act, toast } = useApp();
  const [f, setF] = useState(productFormInit(existing));
  const [errs, setErrs] = useState({});
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setDirty(true); };
  const tryClose = () => { if (dirty) setConfirmClose(true); else onClose(); };
  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Product name is required.';
    if (!f.sku.trim()) e.sku = 'SKU is required.';
    else if (db.products.some((p) => p.sku.toLowerCase() === f.sku.trim().toLowerCase() && p.id !== f.id)) e.sku = 'This SKU already exists.';
    if (!(parseFloat(f.price) > 0)) e.price = 'Selling price must be greater than 0.';
    if (f.cost !== '' && parseFloat(f.cost) < 0) e.cost = 'Cost cannot be negative.';
    if (parseFloat(f.price) > 0 && f.cost !== '' && parseFloat(f.cost) > parseFloat(f.price)) e.cost = 'Cost price is higher than selling price.';
    if (!(parseInt(f.stock, 10) >= 0)) e.stock = 'Stock must be 0 or more.';
    if (!(parseInt(f.min, 10) >= 0)) e.min = 'Minimum stock must be 0 or more.';
    setErrs(e);
    if (Object.keys(e).length) { toast('Please fix the highlighted fields.', 'error'); return; }
    act.saveProduct({ ...f, name: f.name.trim(), cost: parseFloat(f.cost) || 0, price: parseFloat(f.price), stock: parseInt(f.stock, 10) || 0, min: parseInt(f.min, 10) || 0 });
    toast(existing ? 'Product updated.' : 'Product “' + f.name.trim() + '” created.', 'success');
    onClose();
  };
  return (
    <Modal title={existing ? 'Edit product' : 'Add product'} sub={existing ? existing.sku : 'Create a new catalog item'} size="lg" onClose={tryClose}
      footer={<><Btn kind="ghost" onClick={tryClose}>Cancel</Btn><Btn icon="check" onClick={submit}>{existing ? 'Save changes' : 'Create product'}</Btn></>}>
      <div className="form-row">
        <Field label="Product name" req error={errs.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Wireless Earbuds Pro" /></Field>
        <Field label="Category" req><select className="input" value={f.category} onChange={set('category')}>{Object.keys(CATS).map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="SKU" req error={errs.sku}><input className="input" value={f.sku} onChange={set('sku')} placeholder="EL-1099" /></Field>
        <Field label="Barcode" hint="Used for POS scanning"><input className="input" value={f.barcode} onChange={set('barcode')} placeholder="8901000000123" /></Field>
        <Field label="Brand"><input className="input" value={f.brand} onChange={set('brand')} placeholder="Brand" /></Field>
        <Field label="Supplier"><select className="input" value={f.supplierId} onChange={set('supplierId')}><option value="">— None —</option>{db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label={'Cost price (' + db.settings.currency.symbol + ')'} error={errs.cost}><input className="input" type="number" min="0" step="0.01" value={f.cost} onChange={set('cost')} /></Field>
        <Field label={'Selling price (' + db.settings.currency.symbol + ')'} req error={errs.price}><input className="input" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} /></Field>
        <Field label="Opening / current stock" error={errs.stock}><input className="input" type="number" min="0" value={f.stock} onChange={set('stock')} /></Field>
        <Field label="Minimum stock" error={errs.min}><input className="input" type="number" min="0" value={f.min} onChange={set('min')} /></Field>
      </div>
      <Field label="Image URL (optional)" hint="Leave empty to use the automatic color tile."><input className="input" value={f.image} onChange={set('image')} placeholder="https://…" /></Field>
      <Field label="Description"><textarea className="input" value={f.description} onChange={set('description')} /></Field>
      <label className="check"><input type="checkbox" checked={f.taxable} onChange={(e) => { setF({ ...f, taxable: e.target.checked }); setDirty(true); }} />Taxable product ({db.settings.tax.name} {db.settings.tax.rate}%)</label>
      {confirmClose && <Confirm title="Discard changes?" message="You have unsaved changes in this product form. Discard them?" confirmText="Discard" onConfirm={onClose} onClose={() => setConfirmClose(false)} />}
    </Modal>
  );
}
function ProductsPage({ id }) {
  const { db, act, toast, can, pending, setPending } = useApp();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [st, setSt] = useState('All');
  const [modal, setModal] = useState(null);
  useEffect(() => { if (pending === 'addProduct' && !id) { setModal('add'); setPending(null); } }, [pending, id, setPending]);
  if (id) { const p = db.products.find((x) => x.id === id); if (!p) return <ErrorState title="Product not found" message="It may have been deleted." onRetry={() => nav('/products')} />; return <ProductDetail p={p} modal={modal} setModal={setModal} />; }
  const rows = db.products.filter((p) => (cat === 'All' || p.category === cat) && (st === 'All' || stockStatus(p) === st) && (!q || (p.name + p.sku + p.barcode + p.brand).toLowerCase().includes(q.toLowerCase())));
  const cols = [
    { key: 'name', label: 'Product', sort: (r) => r.name, render: (r) => <span className="tile-row"><ProductTile p={r} /><span><span className="cell-main">{r.name}</span><span className="cell-sub">{r.brand}</span></span></span> },
    { key: 'sku', label: 'SKU', sort: (r) => r.sku, render: (r) => <span className="mut">{r.sku}</span> },
    { key: 'barcode', label: 'Barcode', render: (r) => <span className="mut small">{r.barcode}</span> },
    { key: 'category', label: 'Category', sort: (r) => r.category, render: (r) => <Badge tone={r.category === 'Electronics' ? 'blue' : r.category === 'Grocery' ? 'green' : r.category === 'Clothing' ? 'purple' : r.category === 'Accessories' ? 'amber' : 'gray'}>{r.category}</Badge> },
    { key: 'price', label: 'Selling', num: true, sort: (r) => r.price, render: (r) => <strong>{money(r.price, sym)}</strong> },
    { key: 'cost', label: 'Cost', num: true, sort: (r) => r.cost, render: (r) => <span className="mut">{money(r.cost, sym)}</span> },
    { key: 'stock', label: 'Stock', num: true, sort: (r) => r.stock, render: (r) => <span style={{ fontWeight: 600 }}>{r.stock}</span> },
    { key: 'status', label: 'Status', sort: (r) => stockStatus(r), render: (r) => <Badge tone={statusTone(stockStatus(r))}>{stockStatus(r)}</Badge> },
    { key: 'act', label: '', render: (r) => <span className="row-actions" onClick={(e) => e.stopPropagation()}>{can('products', 'edit') && <button className="icon-btn sm" title="Edit" onClick={() => setModal({ edit: r })}><Icon name="edit" size={14} /></button>}{can('products', 'delete') && <button className="icon-btn sm" title="Delete" onClick={() => setModal({ del: r })}><Icon name="trash" size={14} /></button>}</span> },
  ];
  return (
    <>
      <PageHead title="Products" sub={db.products.length + ' items in catalog'} actions={can('products', 'create') && <Btn icon="plus" onClick={() => setModal('add')}>Add product</Btn>} />
      <div className="toolbar">
        <div style={{ maxWidth: 280, flex: 1, position: 'relative' }}><span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }}><Icon name="search" size={15} /></span><input className="input" style={{ paddingLeft: 34 }} placeholder="Search name, SKU, barcode…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter category"><option value="All">All categories</option>{Object.keys(CATS).map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter status"><option value="All">All statuses</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option></select>
      </div>
      <DataTable cols={cols} rows={rows} onRow={(r) => nav('/products/' + r.id)} empty={<Empty icon="box" title="No products found" message="Adjust filters or add a new product." action={can('products', 'create') && <Btn size="sm" icon="plus" onClick={() => setModal('add')}>Add product</Btn>} />}
        card={(r) => <><div className="mc-top"><span className="tile-row"><ProductTile p={r} /><span className="cell-main">{r.name}</span></span><Badge tone={statusTone(stockStatus(r))}>{stockStatus(r)}</Badge></div><div className="mc-sub"><span>{r.sku} • {r.category}</span><strong>{money(r.price, sym)}</strong></div></>} />
      {modal === 'add' && <ProductModal onClose={() => setModal(null)} />}
      {modal && modal.edit && <ProductModal existing={modal.edit} onClose={() => setModal(null)} />}
      {modal && modal.del && <Confirm title="Delete product?" message={`“${modal.del.name}” will be removed from the catalog. Existing sales history is kept.`} onConfirm={() => { act.deleteProduct(modal.del.id); toast('Product deleted.', 'success'); }} onClose={() => setModal(null)} />}
    </>
  );
}
function ProductDetail({ p, modal, setModal }) {
  const { db, can } = useApp();
  const sym = db.settings.currency.symbol;
  const sup = db.suppliers.find((s) => s.id === p.supplierId);
  const movs = db.movements.filter((m) => m.productId === p.id).slice(0, 10);
  return (
    <>
      <PageHead title={p.name} sub={p.sku + ' • ' + p.category + (p.brand ? ' • ' + p.brand : '')}
        actions={<><Btn kind="outline" icon="arrowL" onClick={() => nav('/products')}>Back</Btn>{can('inventory') && <Btn kind="outline" icon="layers" onClick={() => nav('/inventory')}>Inventory</Btn>}{can('products', 'edit') && <Btn icon="edit" onClick={() => setModal('edit')}>Edit</Btn>}{can('products', 'delete') && <Btn kind="danger" icon="trash" onClick={() => setModal('del')}>Delete</Btn>}</>} />
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
        <div className="card card-pad">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}><ProductTile p={p} size={64} /><div><Badge tone={statusTone(stockStatus(p))}>{stockStatus(p)}</Badge><div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{money(p.price, sym)}</div><div className="mut small">Cost {money(p.cost, sym)} • margin {p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0}%</div></div></div>
          <div className="divider" />
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span className="mut small">Barcode</span><div style={{ fontWeight: 600 }}>{p.barcode || '—'}</div></div>
            <div><span className="mut small">Tax</span><div style={{ fontWeight: 600 }}>{p.taxable ? 'Taxable' : 'Exempt'}</div></div>
            <div><span className="mut small">Supplier</span><div style={{ fontWeight: 600 }}>{sup ? sup.name : '—'}</div></div>
            <div><span className="mut small">Last updated</span><div style={{ fontWeight: 600 }}>{fmtDate(p.updated)}</div></div>
          </div>
          <p className="mut" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6 }}>{p.description}</p>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Stock</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', padding: 18, gap: 10 }}>
            <div><div className="kpi-value">{p.stock}</div><div className="kpi-label">Current</div></div>
            <div><div className="kpi-value">{p.min}</div><div className="kpi-label">Minimum</div></div>
            <div><div className="kpi-value">{money(p.stock * p.cost, sym)}</div><div className="kpi-label">Stock value</div></div>
          </div>
          <div className="card-head"><div className="card-title">Recent movements</div></div>
          {movs.length === 0 ? <Empty icon="clock" title="No movements yet" message="Sales, purchases and adjustments will appear here." /> : movs.map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, padding: '9px 16px', fontSize: 13, alignItems: 'center' }}>
              <Badge tone={m.qty > 0 ? 'green' : 'red'}>{m.qty > 0 ? '+' + m.qty : m.qty}</Badge>
              <span style={{ flex: 1 }}>{m.type} — {m.reason}</span><span className="mut small">{timeAgo(m.date)}</span>
            </div>))}
        </div>
      </div>
      {modal === 'edit' && <ProductModal existing={p} onClose={() => setModal(null)} />}
      {modal === 'del' && <Confirm title="Delete product?" message={`“${p.name}” will be removed from the catalog.`} onConfirm={() => { act.deleteProduct(p.id); nav('/products'); }} onClose={() => setModal(null)} />}
    </>
  );
}

/* ============================= INVENTORY ============================= */
function AdjustModal({ p, onClose }) {
  const { act, toast } = useApp();
  const [mode, setMode] = useState('add'); const [qty, setQty] = useState(''); const [reason, setReason] = useState(ADJUST_REASONS[0]);
  const n = parseInt(qty, 10);
  const valid = mode === 'set' ? n >= 0 : n > 0;
  const submit = () => { if (!valid) { toast('Enter a valid quantity.', 'error'); return; } act.adjustStock(p.id, mode, n, reason); toast('Stock updated: ' + p.name, 'success'); onClose(); };
  return (
    <Modal title="Stock adjustment" sub={p.name + ' — current stock ' + p.stock} size="sm" onClose={onClose} footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit}>Apply adjustment</Btn></>}>
      <Field label="Adjustment type">
        <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}><option value="add">Add stock (+)</option><option value="remove">Remove stock (−)</option><option value="set">Set exact count (=)</option></select>
      </Field>
      <Field label="Quantity" req><input className="input" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></Field>
      <Field label="Reason" req><select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{ADJUST_REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
      <div className="badge b-blue" style={{ marginTop: 4 }}>New stock will be: {mode === 'set' ? Math.max(0, n || 0) : mode === 'add' ? p.stock + (n || 0) : Math.max(0, p.stock - (n || 0))}</div>
    </Modal>
  );
}
function InventoryPage() {
  const { db, can } = useApp();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState(''); const [st, setSt] = useState('All');
  const [modal, setModal] = useState(null);
  const low = db.products.filter((p) => p.stock > 0 && p.stock <= p.min);
  const out = db.products.filter((p) => p.stock <= 0);
  const value = db.products.reduce((a, p) => a + p.cost * p.stock, 0);
  const rows = db.products.filter((p) => (st === 'All' || stockStatus(p) === st) && (!q || (p.name + p.sku).toLowerCase().includes(q.toLowerCase())));
  const cols = [
    { key: 'name', label: 'Product', sort: (r) => r.name, render: (r) => <span className="tile-row"><ProductTile p={r} /><span><span className="cell-main">{r.name}</span><span className="cell-sub">{r.sku}</span></span></span> },
    { key: 'stock', label: 'Current', num: true, sort: (r) => r.stock, render: (r) => <strong>{r.stock}</strong> },
    { key: 'min', label: 'Min', num: true, sort: (r) => r.min },
    { key: 'value', label: 'Stock value', num: true, sort: (r) => r.cost * r.stock, render: (r) => money(r.cost * r.stock, sym) },
    { key: 'status', label: 'Status', sort: (r) => stockStatus(r), render: (r) => <Badge tone={statusTone(stockStatus(r))}>{stockStatus(r)}</Badge> },
    { key: 'updated', label: 'Updated', sort: (r) => r.updated, render: (r) => <span className="mut small">{fmtDate(r.updated)}</span> },
    { key: 'act', label: '', render: (r) => can('inventory', 'edit') ? <span className="row-actions" onClick={(e) => e.stopPropagation()}><Btn size="sm" kind="outline" onClick={() => setModal({ adj: r })}>Adjust</Btn><button className="icon-btn sm" title="History" onClick={() => setModal({ hist: r })}><Icon name="clock" size={14} /></button></span> : null },
  ];
  return (
    <>
      <PageHead title="Inventory" sub="Stock levels, valuation and movements" />
      <div className="grid kpis" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard icon="dollar" label="Total Stock Value" value={money(value, sym)} sub="at cost price" tone="blue" />
        <StatCard icon="box" label="Total Products" value={int(db.products.length)} sub={int(db.products.reduce((a, p) => a + p.stock, 0)) + ' units'} tone="purple" />
        <StatCard icon="alert" label="Low Stock" value={int(low.length)} sub="below minimum" tone="amber" />
        <StatCard icon="x" label="Out of Stock" value={int(out.length)} sub="need reordering" tone="red" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 16, alignItems: 'start' }}>
        <div>
          <div className="toolbar">
            <div style={{ maxWidth: 260, flex: 1, position: 'relative' }}><span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }}><Icon name="search" size={15} /></span><input className="input" style={{ paddingLeft: 34 }} placeholder="Search product…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select className="input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status filter"><option value="All">All statuses</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option></select>
          </div>
          <DataTable cols={cols} rows={rows} onRow={(r) => can('inventory', 'edit') && setModal({ adj: r })} empty={<Empty icon="layers" title="No inventory matches" />}
            card={(r) => <><div className="mc-top"><span className="tile-row"><ProductTile p={r} /><span className="cell-main">{r.name}</span></span><Badge tone={statusTone(stockStatus(r))}>{r.stock}</Badge></div><div className="mc-sub"><span>min {r.min}</span><span>{money(r.cost * r.stock, sym)}</span></div></>} />
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Recent Stock Movements</div></div>
          {db.movements.length === 0 ? <Empty icon="clock" title="No movements yet" /> : db.movements.slice(0, 9).map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, padding: '9px 16px', fontSize: 13, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <Badge tone={m.qty > 0 ? 'green' : 'red'}>{m.qty > 0 ? '+' + m.qty : m.qty}</Badge>
              <span style={{ flex: 1, minWidth: 0 }}><span className="cell-main" style={{ display: 'block', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.productName}</span><span className="cell-sub">{m.type} • {m.ref}</span></span>
              <span className="mut small" style={{ whiteSpace: 'nowrap' }}>{timeAgo(m.date)}</span>
            </div>))}
        </div>
      </div>
      {modal && modal.adj && <AdjustModal p={modal.adj} onClose={() => setModal(null)} />}
      {modal && modal.hist && (
        <Modal title="Stock history" sub={modal.hist.name} size="md" onClose={() => setModal(null)}>
          {db.movements.filter((m) => m.productId === modal.hist.id).length === 0 ? <Empty icon="clock" title="No history yet" /> : db.movements.filter((m) => m.productId === modal.hist.id).map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <Badge tone={m.qty > 0 ? 'green' : 'red'}>{m.qty > 0 ? '+' + m.qty : m.qty}</Badge>
              <span style={{ flex: 1 }}>{m.type} — {m.reason}</span><span className="mut small">{fmtDateTime(m.date)}</span>
            </div>))}
        </Modal>
      )}
    </>
  );
}

/* ============================= SALES ============================= */
function SalesPage({ id }) {
  const { db, act, toast, can } = useApp();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState(''); const [pay, setPay] = useState('All'); const [st, setSt] = useState('All'); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [cust, setCust] = useState('All');
  const [detail, setDetail] = useState(id || null);
  const [receipt, setReceipt] = useState(null);
  const [confirmRefund, setConfirmRefund] = useState(null);
  useEffect(() => { setDetail(id || null); }, [id]);
  const completed = db.sales.filter((s) => s.status !== 'Refunded');
  const sumRange = (days) => { const k = dayKey(new Date(Date.now() - (days - 1) * 864e5)); return completed.filter((s) => s.date.slice(0, 10) >= k).reduce((a, s) => a + s.total, 0); };
  const monthCount = completed.filter((s) => s.date.slice(0, 10) >= dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1))).length;
  const rows = db.sales.filter((s) => {
    const c = db.customers.find((x) => x.id === s.customerId);
    const d = s.date.slice(0, 10);
    return (st === 'All' || s.status === st) && (pay === 'All' || s.payMethod === pay) && (cust === 'All' || s.customerId === cust) && (!from || d >= from) && (!to || d <= to) && (!q || (s.invoice + (c ? c.name : '')).toLowerCase().includes(q.toLowerCase()));
  });
  const cols = [
    { key: 'invoice', label: 'Invoice', sort: (r) => r.invoice, render: (r) => <span className="cell-main">{r.invoice}</span> },
    { key: 'customer', label: 'Customer', sort: (r) => (db.customers.find((c) => c.id === r.customerId) || {}).name || '', render: (r) => (db.customers.find((c) => c.id === r.customerId) || {}).name || 'Walk-in' },
    { key: 'date', label: 'Date', sort: (r) => r.date, render: (r) => <span className="mut">{fmtDateTime(r.date)}</span> },
    { key: 'items', label: 'Items', num: true, render: (r) => r.items.reduce((a, i) => a + i.qty, 0) },
    { key: 'total', label: 'Amount', num: true, sort: (r) => r.total, render: (r) => <strong>{money(r.total, sym)}</strong> },
    { key: 'payMethod', label: 'Payment', render: (r) => <span className="mut">{r.payMethod}</span> },
    { key: 'status', label: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];
  const sale = detail ? db.sales.find((s) => s.id === detail) : null;
  return (
    <>
      <PageHead title="Sales" sub="Transactions and revenue" />
      <div className="grid kpis" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard icon="dollar" label="Today" value={money(completed.filter((s) => s.date.slice(0, 10) === dayKey(new Date())).reduce((a, s) => a + s.total, 0), sym)} tone="blue" sub="completed sales" />
        <StatCard icon="trendUp" label="This Week" value={money(sumRange(7), sym)} tone="green" sub="last 7 days" />
        <StatCard icon="calendar" label="This Month" value={money(sumRange(30), sym)} tone="purple" sub="last 30 days" />
        <StatCard icon="receipt" label="Transactions" value={int(db.sales.length)} tone="gray" sub={monthCount + ' this month'} />
        <StatCard icon="chart" label="Avg Order Value" value={money(completed.length ? completed.reduce((a, s) => a + s.total, 0) / completed.length : 0, sym)} tone="amber" sub="per transaction" />
      </div>
      <div className="toolbar">
        <div style={{ maxWidth: 240, flex: 1, position: 'relative' }}><span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }}><Icon name="search" size={15} /></span><input className="input" style={{ paddingLeft: 34 }} placeholder="Invoice or customer…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <select className="input" value={cust} onChange={(e) => setCust(e.target.value)} aria-label="Customer filter"><option value="All">All customers</option>{db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="input" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment filter"><option value="All">All payments</option>{PAY_METHODS.map((m) => <option key={m.k}>{m.k}</option>)}</select>
        <select className="input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status filter"><option value="All">All statuses</option><option>Completed</option><option>Refunded</option></select>
      </div>
      <DataTable cols={cols} rows={rows} onRow={(r) => setDetail(r.id)} empty={<Empty icon="receipt" title="No sales found" message="Try changing filters, or create a sale from the POS." action={can('pos') && <Btn size="sm" icon="cart" onClick={() => nav('/pos')}>Open POS</Btn>} />}
        card={(r) => <><div className="mc-top"><span className="cell-main">{r.invoice}</span><Badge tone={statusTone(r.status)}>{r.status}</Badge></div><div className="mc-sub"><span>{(db.customers.find((c) => c.id === r.customerId) || {}).name || 'Walk-in'}</span><strong>{money(r.total, sym)}</strong></div></>} />
      {sale && (
        <Modal title={sale.invoice} sub={fmtDateTime(sale.date) + ' • ' + sale.cashier} size="lg" onClose={() => { setDetail(null); if (id) nav('/sales'); }}
          footer={<>{sale.status === 'Completed' && can('sales', 'edit') && <Btn kind="danger" icon="refresh" onClick={() => setConfirmRefund(sale)}>Refund sale</Btn>}<Btn kind="outline" icon="print" onClick={() => setReceipt(sale)}>Receipt</Btn><Btn icon="eye" onClick={() => nav('/invoices/' + sale.id)}>Open invoice</Btn></>}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div><span className="mut small">Customer</span><div style={{ fontWeight: 600 }}>{(db.customers.find((c) => c.id === sale.customerId) || {}).name || 'Walk-in Customer'}</div></div>
            <div><span className="mut small">Payment</span><div style={{ fontWeight: 600 }}>{sale.payMethod}</div> <Badge tone={statusTone(sale.status)}>{sale.status}</Badge></div>
          </div>
          <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
            <table className="tbl"><thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Total</th></tr></thead>
              <tbody>{sale.items.map((it, i) => <tr key={i}><td className="cell-main">{it.name}</td><td className="num">{it.qty}</td><td className="num">{money(it.price, sym)}</td><td className="num" style={{ fontWeight: 600 }}>{money(it.qty * it.price, sym)}</td></tr>)}</tbody></table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <div style={{ width: 240 }}>
              <div className="sum-row"><span>Subtotal</span><span>{money(sale.subtotal, sym)}</span></div>
              <div className="sum-row"><span>Discount</span><span>-{money(sale.discountAmt, sym)}</span></div>
              <div className="sum-row"><span>{db.settings.tax.name}</span><span>{money(sale.taxAmt, sym)}</span></div>
              <div className="sum-row total"><span>Total</span><span>{money(sale.total, sym)}</span></div>
            </div>
          </div>
        </Modal>
      )}
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
      {confirmRefund && <Confirm title="Refund this sale?" message={`${confirmRefund.invoice} will be marked Refunded and its items returned to stock.`} confirmText="Refund" onConfirm={() => { act.refundSale(confirmRefund.id); toast(confirmRefund.invoice + ' refunded and restocked.', 'success'); }} onClose={() => setConfirmRefund(null)} />}
    </>
  );
}

/* ============================= PURCHASES ============================= */
function PurchaseModal({ onClose }) {
  const { db, act, toast } = useApp();
  const sym = db.settings.currency.symbol;
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('Received');
  const [paid, setPaid] = useState(true);
  const [pq, setPq] = useState('');
  const [errs, setErrs] = useState({});
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const tryClose = () => { if (dirty) setConfirmClose(true); else onClose(); };
  const matches = db.products.filter((p) => p.name.toLowerCase().includes(pq.toLowerCase()) && !items.some((i) => i.productId === p.id)).slice(0, 6);
  const addItem = (p) => { setItems([...items, { productId: p.id, name: p.name, qty: 10, cost: p.cost }]); setPq(''); setDirty(true); };
  const setLine = (pid, k, v) => setItems(items.map((i) => i.productId === pid ? { ...i, [k]: k === 'name' ? v : Math.max(0, parseFloat(v) || 0) } : i));
  const total = round2(items.reduce((a, i) => a + i.cost * i.qty, 0) * (1 + db.settings.tax.rate / 100));
  const submit = () => {
    const e = {};
    if (!supplierId) e.supplier = 'Select a supplier.';
    if (!items.length) e.items = 'Add at least one product.';
    if (items.some((i) => i.qty <= 0)) e.items = 'All quantities must be greater than 0.';
    setErrs(e);
    if (Object.keys(e).length) { toast('Please fix the highlighted fields.', 'error'); return; }
    act.completePurchase({ supplierId, items, status, paid });
    toast(status === 'Received' ? 'Purchase completed — inventory increased.' : 'Purchase order created.', 'success');
    onClose();
  };
  return (
    <Modal title="Create purchase" sub="Order stock from a supplier" size="lg" onClose={tryClose}
      footer={<><Btn kind="ghost" onClick={tryClose}>Cancel</Btn><Btn icon="check" onClick={submit}>Complete purchase — {money(total, sym)}</Btn></>}>
      <div className="form-row">
        <Field label="Supplier" req error={errs.supplier}><select className="input" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setDirty(true); }}><option value="">— Select supplier —</option>{db.suppliers.filter((s) => s.status === 'Active').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Status"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="Received">Received (update stock now)</option><option value="Pending">Pending (receive later)</option></select></Field>
      </div>
      <Field label="Add products" req error={errs.items}>
        <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 11, top: 20, color: 'var(--muted2)' }}><Icon name="search" size={15} /></span>
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Type to search catalog…" value={pq} onChange={(e) => setPq(e.target.value)} />
          {pq && <div className="drop" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', maxHeight: 200, overflowY: 'auto' }}>{matches.map((p) => <button key={p.id} className="sd-item" style={{ width: '100%' }} onClick={() => addItem(p)}><ProductTile p={p} size={26} /><span>{p.name}</span><span className="mut">{p.stock} in stock</span></button>)}{matches.length === 0 && <div style={{ padding: 12 }} className="mut small">No matching products.</div>}</div>}
        </div>
      </Field>
      {items.length > 0 && (
        <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
          <table className="tbl"><thead><tr><th>Product</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 120 }}>Unit cost</th><th className="num">Line total</th><th style={{ width: 40 }} /></tr></thead>
            <tbody>{items.map((i) => <tr key={i.productId}><td className="cell-main">{i.name}</td><td><input className="input" type="number" min="1" value={i.qty} onChange={(e) => { setLine(i.productId, 'qty', e.target.value); setDirty(true); }} /></td><td><input className="input" type="number" min="0" step="0.01" value={i.cost} onChange={(e) => { setLine(i.productId, 'cost', e.target.value); setDirty(true); }} /></td><td className="num" style={{ fontWeight: 600 }}>{money(i.qty * i.cost, sym)}</td><td><button className="icon-btn sm" onClick={() => setItems(items.filter((x) => x.productId !== i.productId))} aria-label="Remove line"><Icon name="trash" size={14} /></button></td></tr>)}</tbody></table>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <label className="check"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />Mark as paid</label>
        <div className="sum-row total" style={{ width: 240 }}><span>Total incl. tax</span><span>{money(total, sym)}</span></div>
      </div>
      {confirmClose && <Confirm title="Discard purchase?" message="This purchase draft will be discarded." confirmText="Discard" onConfirm={onClose} onClose={() => setConfirmClose(false)} />}
    </Modal>
  );
}
function PurchasesPage({ id }) {
  const { db, act, toast, can, pending, setPending } = useApp();
  const sym = db.settings.currency.symbol;
  const [detail, setDetail] = useState(id || null);
  const [create, setCreate] = useState(false);
  const [confirmRecv, setConfirmRecv] = useState(null);
  useEffect(() => { setDetail(id || null); }, [id]);
  useEffect(() => { if (pending === 'createPurchase') { setCreate(true); setPending(null); } }, [pending, setPending]);
  const totalMonth = db.purchases.filter((p) => p.date.slice(0, 10) >= dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1))).reduce((a, p) => a + p.total, 0);
  const pendingCount = db.purchases.filter((p) => p.status === 'Pending');
  const outstanding = db.purchases.filter((p) => !p.paid).reduce((a, p) => a + p.total, 0);
  const cols = [
    { key: 'ref', label: 'Reference', sort: (r) => r.ref, render: (r) => <span className="cell-main">{r.ref}</span> },
    { key: 'supplier', label: 'Supplier', sort: (r) => (db.suppliers.find((s) => s.id === r.supplierId) || {}).name || '', render: (r) => (db.suppliers.find((s) => s.id === r.supplierId) || {}).name },
    { key: 'date', label: 'Date', sort: (r) => r.date, render: (r) => <span className="mut">{fmtDate(r.date)}</span> },
    { key: 'items', label: 'Items', num: true, render: (r) => r.items.length },
    { key: 'total', label: 'Total', num: true, sort: (r) => r.total, render: (r) => <strong>{money(r.total, sym)}</strong> },
    { key: 'paid', label: 'Payment', render: (r) => <Badge tone={r.paid ? 'green' : 'amber'}>{r.paid ? 'Paid' : 'Unpaid'}</Badge> },
    { key: 'status', label: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: 'act', label: '', render: (r) => r.status === 'Pending' && can('purchases', 'edit') ? <span onClick={(e) => e.stopPropagation()}><Btn size="sm" kind="success" onClick={() => setConfirmRecv(r)}>Receive</Btn></span> : null },
  ];
  const po = detail ? db.purchases.find((p) => p.id === detail) : null;
  return (
    <>
      <PageHead title="Purchases" sub="Supplier orders and receiving" actions={can('purchases', 'create') && <Btn icon="plus" onClick={() => setCreate(true)}>Create purchase</Btn>} />
      <div className="grid kpis" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard icon="truck" label="This Month" value={money(totalMonth, sym)} tone="blue" sub={int(db.purchases.filter((p) => p.date.slice(0, 10) >= dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1))).length) + ' orders'} />
        <StatCard icon="clock" label="Pending Receipt" value={int(pendingCount.length)} tone="amber" sub="awaiting delivery" />
        <StatCard icon="dollar" label="Outstanding" value={money(outstanding, sym)} tone="red" sub="unpaid supplier bills" />
        <StatCard icon="building" label="Suppliers" value={int(db.suppliers.length)} tone="gray" sub="in network" />
      </div>
      <DataTable cols={cols} rows={db.purchases} onRow={(r) => setDetail(r.id)} empty={<Empty icon="truck" title="No purchases yet" message="Purchases created by your team will appear here." action={can('purchases', 'create') && <Btn size="sm" icon="plus" onClick={() => setCreate(true)}>Create purchase</Btn>} />}
        card={(r) => <><div className="mc-top"><span className="cell-main">{r.ref}</span><Badge tone={statusTone(r.status)}>{r.status}</Badge></div><div className="mc-sub"><span>{(db.suppliers.find((s) => s.id === r.supplierId) || {}).name}</span><strong>{money(r.total, sym)}</strong></div></>} />
      {po && (
        <Modal title={po.ref} sub={(db.suppliers.find((s) => s.id === po.supplierId) || {}).name + ' • ' + fmtDate(po.date)} size="lg" onClose={() => { setDetail(null); if (id) nav('/purchases'); }}
          footer={<>{po.status === 'Pending' && can('purchases', 'edit') && <Btn kind="success" icon="check" onClick={() => { act.receivePurchase(po.id); toast(po.ref + ' received — inventory increased.', 'success'); }}>Mark received</Btn>}<Btn kind="ghost" onClick={() => { setDetail(null); if (id) nav('/purchases'); }}>Close</Btn></>}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><Badge tone={statusTone(po.status)}>{po.status}</Badge><Badge tone={po.paid ? 'green' : 'amber'}>{po.paid ? 'Paid' : 'Unpaid'}</Badge><span className="mut small">Created by {po.createdBy}</span></div>
          <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
            <table className="tbl"><thead><tr><th>Product</th><th className="num">Qty</th><th className="num">Unit cost</th><th className="num">Total</th></tr></thead>
              <tbody>{po.items.map((it, i) => <tr key={i}><td className="cell-main">{it.name}</td><td className="num">{it.qty}</td><td className="num">{money(it.cost, sym)}</td><td className="num" style={{ fontWeight: 600 }}>{money(it.qty * it.cost, sym)}</td></tr>)}</tbody></table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}><div className="sum-row total" style={{ width: 260 }}><span>Total (incl. {db.settings.tax.rate}% tax)</span><span>{money(po.total, sym)}</span></div></div>
        </Modal>
      )}
      {create && <PurchaseModal onClose={() => setCreate(false)} />}
      {confirmRecv && <Confirm title="Receive purchase?" message={`${confirmRecv.ref} items will be added to inventory.`} confirmText="Receive" tone="success" onConfirm={() => { act.receivePurchase(confirmRecv.id); toast(confirmRecv.ref + ' received — inventory increased.', 'success'); }} onClose={() => setConfirmRecv(null)} />}
    </>
  );
}

/* ============================= CUSTOMERS ============================= */
function custStats(db, id) {
  const sales = db.sales.filter((s) => s.customerId === id && s.status === 'Completed');
  return { orders: sales.length, spent: round2(sales.reduce((a, s) => a + s.total, 0)), last: sales.length ? sales.reduce((a, s) => (s.date > a ? s.date : a), sales[0].date) : null };
}
function CustomerModal({ existing, onClose }) {
  const { act, toast } = useApp();
  const [f, setF] = useState(existing ? { ...existing } : { name: '', phone: '', email: '', status: 'Active', notes: '' });
  const [errs, setErrs] = useState({});
  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Name is required.';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (!f.phone.trim()) e.phone = 'Phone is required.';
    setErrs(e);
    if (Object.keys(e).length) return;
    act.saveCustomer({ ...f, name: f.name.trim() });
    toast(existing ? 'Customer updated.' : 'Customer added.', 'success');
    onClose();
  };
  return (
    <Modal title={existing ? 'Edit customer' : 'Add customer'} size="md" onClose={onClose} footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit}>{existing ? 'Save changes' : 'Add customer'}</Btn></>}>
      <Field label="Full name" req error={errs.name}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
      <div className="form-row">
        <Field label="Phone" req error={errs.phone}><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+1 (555) …" /></Field>
        <Field label="Email" error={errs.email}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      </div>
      <Field label="Status"><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
      <Field label="Notes"><textarea className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
    </Modal>
  );
}
function CustomersPage({ id }) {
  const { db, can, pending, setPending } = useApp();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState(''); const [st, setSt] = useState('All');
  const [modal, setModal] = useState(null);
  useEffect(() => { if (pending === 'addCustomer' && !id) { setModal('add'); setPending(null); } }, [pending, id, setPending]);
  if (id) {
    const c = db.customers.find((x) => x.id === id);
    if (!c) return <ErrorState title="Customer not found" message="This record may have been deleted." onRetry={() => nav('/customers')} />;
    const stats = custStats(db, c.id); const hist = db.sales.filter((s) => s.customerId === c.id).slice(0, 8);
    return (
      <>
        <PageHead title={c.name} sub={'Customer since ' + fmtDate(c.joined)} actions={<><Btn kind="outline" icon="arrowL" onClick={() => nav('/customers')}>Back</Btn>{can('customers', 'edit') && <Btn icon="edit" onClick={() => setModal('edit')}>Edit</Btn>}</>} />
        <div className="grid kpis" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4,1fr)' }}>
          <StatCard icon="receipt" label="Orders" value={int(stats.orders)} tone="blue" sub="completed" />
          <StatCard icon="dollar" label="Total Spent" value={money(stats.spent, sym)} tone="green" sub="lifetime" />
          <StatCard icon="chart" label="Avg Order" value={money(stats.orders ? stats.spent / stats.orders : 0, sym)} tone="purple" sub="per order" />
          <StatCard icon="clock" label="Last Purchase" value={stats.last ? fmtDate(stats.last) : '—'} tone="gray" sub={stats.last ? timeAgo(stats.last) : 'no purchases'} />
        </div>
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="card">
            <div className="card-head"><div className="card-title">Purchase history</div></div>
            {hist.length === 0 ? <Empty icon="receipt" title="No purchases yet" /> : hist.map((s) => (
              <div key={s.id} style={{ display: 'flex', gap: 10, padding: '10px 16px', alignItems: 'center', borderBottom: '1px solid var(--border)', cursor: can('sales') ? 'pointer' : 'default' }} onClick={() => can('sales') && nav('/sales/' + s.id)}>
                <span className="cell-main">{s.invoice}</span><span className="mut small" style={{ flex: 1 }}>{fmtDateTime(s.date)}</span><Badge tone={statusTone(s.status)}>{s.status}</Badge><strong>{money(s.total, sym)}</strong>
              </div>))}
          </div>
          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 12 }}>Contact information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="phone" size={15} className="mut" />{c.phone}</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="mail" size={15} className="mut" />{c.email || '—'}</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="user" size={15} className="mut" /><Badge tone={statusTone(c.status)}>{c.status}</Badge></span>
            </div>
            {c.notes && <><div className="divider" /><p className="mut small" style={{ lineHeight: 1.6 }}>{c.notes}</p></>}
          </div>
        </div>
        {modal === 'edit' && <CustomerModal existing={c} onClose={() => setModal(null)} />}
      </>
    );
  }
  const rows = db.customers.filter((c) => (st === 'All' || c.status === st) && (!q || (c.name + c.email + c.phone).toLowerCase().includes(q.toLowerCase())));
  const cols = [
    { key: 'name', label: 'Name', sort: (r) => r.name, render: (r) => <span className="tile-row"><span className="avatar">{initials(r.name)}</span><span><span className="cell-main">{r.name}</span><span className="cell-sub">{r.email}</span></span></span> },
    { key: 'phone', label: 'Phone', render: (r) => <span className="mut">{r.phone}</span> },
    { key: 'orders', label: 'Orders', num: true, sort: (r) => custStats(db, r.id).orders, render: (r) => custStats(db, r.id).orders },
    { key: 'spent', label: 'Total Spent', num: true, sort: (r) => custStats(db, r.id).spent, render: (r) => <strong>{money(custStats(db, r.id).spent, sym)}</strong> },
    { key: 'last', label: 'Last Purchase', sort: (r) => custStats(db, r.id).last || '', render: (r) => { const s = custStats(db, r.id).last; return <span className="mut">{s ? fmtDate(s) : '—'}</span>; } },
    { key: 'status', label: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: 'act', label: '', render: (r) => can('customers', 'edit') ? <span className="row-actions" onClick={(e) => e.stopPropagation()}><button className="icon-btn sm" title="Edit" onClick={() => setModal({ edit: r })}><Icon name="edit" size={14} /></button></span> : null },
  ];
  return (
    <>
      <PageHead title="Customers" sub={db.customers.length + ' customer records'} actions={can('customers', 'create') && <Btn icon="plus" onClick={() => setModal('add')}>Add customer</Btn>} />
      <div className="toolbar">
        <div style={{ maxWidth: 260, flex: 1, position: 'relative' }}><span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }}><Icon name="search" size={15} /></span><input className="input" style={{ paddingLeft: 34 }} placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="All">All statuses</option><option>Active</option><option>Inactive</option></select>
      </div>
      <DataTable cols={cols} rows={rows} onRow={(r) => nav('/customers/' + r.id)} empty={<Empty icon="users" title="No customers found" />}
        card={(r) => <><div className="mc-top"><span className="tile-row"><span className="avatar">{initials(r.name)}</span><span className="cell-main">{r.name}</span></span><Badge tone={statusTone(r.status)}>{r.status}</Badge></div><div className="mc-sub"><span>{custStats(db, r.id).orders} orders</span><strong>{money(custStats(db, r.id).spent, sym)}</strong></div></>} />
      {modal === 'add' && <CustomerModal onClose={() => setModal(null)} />}
      {modal && modal.edit && <CustomerModal existing={modal.edit} onClose={() => setModal(null)} />}
    </>
  );
}

/* ============================= SUPPLIERS ============================= */
function supStats(db, id) {
  const pos = db.purchases.filter((p) => p.supplierId === id);
  return { count: pos.length, total: round2(pos.reduce((a, p) => a + p.total, 0)), outstanding: round2(pos.filter((p) => !p.paid).reduce((a, p) => a + p.total, 0)), products: db.products.filter((p) => p.supplierId === id).length };
}
function SupplierModal({ existing, onClose }) {
  const { act, toast } = useApp();
  const [f, setF] = useState(existing ? { ...existing } : { name: '', contact: '', email: '', phone: '', address: '', status: 'Active' });
  const [errs, setErrs] = useState({});
  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Supplier name is required.';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email.';
    setErrs(e);
    if (Object.keys(e).length) return;
    act.saveSupplier({ ...f, name: f.name.trim() });
    toast(existing ? 'Supplier updated.' : 'Supplier added.', 'success');
    onClose();
  };
  return (
    <Modal title={existing ? 'Edit supplier' : 'Add supplier'} size="md" onClose={onClose} footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit}>{existing ? 'Save changes' : 'Add supplier'}</Btn></>}>
      <Field label="Company name" req error={errs.name}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
      <div className="form-row">
        <Field label="Contact person"><input className="input" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
        <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      </div>
      <Field label="Email" error={errs.email}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Address"><input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <Field label="Status"><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
    </Modal>
  );
}
function SuppliersPage({ id }) {
  const { db, can } = useApp();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);
  if (id) {
    const s = db.suppliers.find((x) => x.id === id);
    if (!s) return <ErrorState title="Supplier not found" message="This record may have been deleted." onRetry={() => nav('/suppliers')} />;
    const stats = supStats(db, s.id); const hist = db.purchases.filter((p) => p.supplierId === s.id).slice(0, 8); const prods = db.products.filter((p) => p.supplierId === s.id).slice(0, 8);
    return (
      <>
        <PageHead title={s.name} sub={s.address} actions={<><Btn kind="outline" icon="arrowL" onClick={() => nav('/suppliers')}>Back</Btn>{can('suppliers', 'edit') && <Btn icon="edit" onClick={() => setModal('edit')}>Edit</Btn>}</>} />
        <div className="grid kpis" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4,1fr)' }}>
          <StatCard icon="truck" label="Purchases" value={int(stats.count)} tone="blue" sub="total orders" />
          <StatCard icon="dollar" label="Total Purchases" value={money(stats.total, sym)} tone="green" sub="lifetime" />
          <StatCard icon="alert" label="Outstanding" value={money(stats.outstanding, sym)} tone={stats.outstanding > 0 ? 'red' : 'green'} sub="unpaid balance" />
          <StatCard icon="box" label="Products Supplied" value={int(stats.products)} tone="purple" sub="in catalog" />
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="card-head"><div className="card-title">Purchase history</div></div>
            {hist.length === 0 ? <Empty icon="truck" title="No purchases yet" /> : hist.map((p) => (
              <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 16px', alignItems: 'center', borderBottom: '1px solid var(--border)', cursor: can('purchases') ? 'pointer' : 'default' }} onClick={() => can('purchases') && nav('/purchases/' + p.id)}>
                <span className="cell-main">{p.ref}</span><span className="mut small" style={{ flex: 1 }}>{fmtDate(p.date)}</span><Badge tone={statusTone(p.status)}>{p.status}</Badge><strong>{money(p.total, sym)}</strong>
              </div>))}
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Products supplied</div></div>
            {prods.length === 0 ? <Empty icon="box" title="No linked products" /> : prods.map((p) => (
              <div key={p.id} style={{ display: 'flex', gap: 10, padding: '9px 16px', alignItems: 'center', borderBottom: '1px solid var(--border)', cursor: can('products') ? 'pointer' : 'default' }} onClick={() => can('products') && nav('/products/' + p.id)}>
                <ProductTile p={p} size={28} /><span style={{ flex: 1 }} className="cell-main">{p.name}</span><span className="mut small">{p.stock} in stock</span>
              </div>))}
          </div>
        </div>
        {modal === 'edit' && <SupplierModal existing={s} onClose={() => setModal(null)} />}
      </>
    );
  }
  const rows = db.suppliers.filter((s) => !q || (s.name + s.contact).toLowerCase().includes(q.toLowerCase()));
  const cols = [
    { key: 'name', label: 'Supplier', sort: (r) => r.name, render: (r) => <span><span className="cell-main">{r.name}</span><span className="cell-sub">{r.contact}</span></span> },
    { key: 'contact', label: 'Contact', render: (r) => <span className="mut small">{r.email}<br />{r.phone}</span> },
    { key: 'products', label: 'Products', num: true, sort: (r) => supStats(db, r.id).products, render: (r) => supStats(db, r.id).products },
    { key: 'total', label: 'Total Purchases', num: true, sort: (r) => supStats(db, r.id).total, render: (r) => <strong>{money(supStats(db, r.id).total, sym)}</strong> },
    { key: 'outstanding', label: 'Outstanding', num: true, sort: (r) => supStats(db, r.id).outstanding, render: (r) => <span style={{ color: supStats(db, r.id).outstanding > 0 ? 'var(--danger)' : 'var(--muted)' }}>{money(supStats(db, r.id).outstanding, sym)}</span> },
    { key: 'status', label: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];
  return (
    <>
      <PageHead title="Suppliers" sub={db.suppliers.length + ' supplier accounts'} actions={can('suppliers', 'create') && <Btn icon="plus" onClick={() => setModal('add')}>Add supplier</Btn>} />
      <div className="toolbar"><div style={{ maxWidth: 260, flex: 1, position: 'relative' }}><span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }}><Icon name="search" size={15} /></span><input className="input" style={{ paddingLeft: 34 }} placeholder="Search suppliers…" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      <DataTable cols={cols} rows={rows} onRow={(r) => nav('/suppliers/' + r.id)} empty={<Empty icon="building" title="No suppliers found" />}
        card={(r) => <><div className="mc-top"><span className="cell-main">{r.name}</span><Badge tone={statusTone(r.status)}>{r.status}</Badge></div><div className="mc-sub"><span>{supStats(db, r.id).count} orders</span><strong>{money(supStats(db, r.id).total, sym)}</strong></div></>} />
      {modal === 'add' && <SupplierModal onClose={() => setModal(null)} />}
      {modal && modal.edit && <SupplierModal existing={modal.edit} onClose={() => setModal(null)} />}
    </>
  );
}

/* ============================= INVOICE PAGE ============================= */
function InvoicePage({ id }) {
  const { db } = useApp();
  const inv = useInvoiceActions();
  const sale = db.sales.find((s) => s.id === id);
  if (!sale) return <ErrorState title="Invoice not found" message="The link may be outdated." onRetry={() => nav('/sales')} />;
  const st = db.settings; const sym = st.currency.symbol;
  const cust = db.customers.find((c) => c.id === sale.customerId);
  return (
    <>
      <PageHead title="Invoice" sub={sale.invoice}
        actions={<><Btn kind="outline" icon="arrowL" onClick={() => nav('/sales')}>Back</Btn><Btn kind="outline" icon="print" onClick={inv.print}>Print</Btn><Btn kind="outline" icon="download" onClick={() => inv.download(sale)}>Download</Btn><Btn kind="outline" icon="share" onClick={() => inv.share(sale)}>Share</Btn></>} />
      <div className="inv-doc print-area">
        <div className="inv-grid" style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
            <span className="brand-logo" style={{ width: 46, height: 46 }}><img src={LOGO_URL} alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} /></span>
            <div><div style={{ fontSize: 17, fontWeight: 800 }}>{st.business.name}</div><div className="mut small">{st.business.address} • {st.business.city}<br />{st.business.phone} • {st.business.email}</div></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '.02em', color: '#3d58d6' }}>INVOICE</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{sale.invoice}</div>
            <div className="mut small">{fmtDateTime(sale.date)}</div>
            <div style={{ marginTop: 6 }}><Badge tone={statusTone(sale.status)}>{sale.status}</Badge></div>
          </div>
        </div>
        <div className="inv-grid" style={{ marginBottom: 22 }}>
          <div><div className="mut small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Billed to</div><div style={{ fontWeight: 700 }}>{cust ? cust.name : 'Walk-in Customer'}</div>{cust && <div className="mut small">{cust.phone}<br />{cust.email}</div>}</div>
          <div style={{ textAlign: 'right' }}><div className="mut small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Payment</div><div style={{ fontWeight: 600 }}>{sale.payMethod}</div><div className="mut small">Served by {sale.cashier}</div></div>
        </div>
        <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
          <table className="tbl"><thead><tr><th>#</th><th>Item</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Total</th></tr></thead>
            <tbody>{sale.items.map((it, i) => <tr key={i}><td className="mut">{i + 1}</td><td className="cell-main">{it.name}</td><td className="num">{it.qty}</td><td className="num">{money(it.price, sym)}</td><td className="num" style={{ fontWeight: 600 }}>{money(it.qty * it.price, sym)}</td></tr>)}</tbody></table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <div style={{ width: 270 }}>
            <div className="sum-row"><span>Subtotal</span><span>{money(sale.subtotal, sym)}</span></div>
            <div className="sum-row"><span>Discount</span><span>-{money(sale.discountAmt, sym)}</span></div>
            <div className="sum-row"><span>{st.tax.name} ({st.tax.rate}%)</span><span>{money(sale.taxAmt, sym)}</span></div>
            <div className="sum-row total"><span>Total</span><span>{money(sale.total, sym)}</span></div>
            <div className="sum-row"><span>Paid</span><span>{money(sale.amountPaid, sym)}</span></div>
          </div>
        </div>
        <div className="divider" />
        <p className="mut small" style={{ lineHeight: 1.7 }}>{st.invoice.notes}<br />{st.invoice.footer}</p>
      </div>
    </>
  );
}

/* ============================= REPORTS ============================= */
function ReportsPage() {
  const { db, toast } = useApp();
  const ct = useChartTheme();
  const sym = db.settings.currency.symbol;
  const [tab, setTab] = useState('sales');
  const [preset, setPreset] = useState('30');
  const from = dayKey(new Date(Date.now() - (parseInt(preset, 10) - 1) * 864e5));
  const inR = (d) => d.slice(0, 10) >= from;
  const sales = db.sales.filter((s) => inR(s.date) && s.status !== 'Refunded');
  const purchases = db.purchases.filter((p) => inR(p.date));
  const daily = useMemo(() => {
    const out2 = []; const base = new Date(); base.setHours(0, 0, 0, 0);
    const days = Math.min(parseInt(preset, 10), 30);
    for (let i = days - 1; i >= 0; i--) { const d = new Date(base.getTime() - i * 864e5); const k = dayKey(d); out2.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: round2(sales.filter((s) => s.date.slice(0, 10) === k).reduce((a, s) => a + s.total, 0)) }); }
    return out2;
  }, [sales, preset]);
  const byProduct = useMemo(() => { const m = {}; sales.forEach((s) => s.items.forEach((it) => { if (!m[it.name]) m[it.name] = { name: it.name, units: 0, revenue: 0 }; m[it.name].units += it.qty; m[it.name].revenue = round2(m[it.name].revenue + it.qty * it.price); })); return Object.values(m).sort((a, b) => b.revenue - a.revenue).slice(0, 10); }, [sales]);
  const byCustomer = useMemo(() => { const m = {}; sales.forEach((s) => { const c = db.customers.find((x) => x.id === s.customerId); const n = c ? c.name : 'Walk-in Customer'; if (!m[n]) m[n] = { name: n, orders: 0, revenue: 0 }; m[n].orders++; m[n].revenue = round2(m[n].revenue + s.total); }); return Object.values(m).sort((a, b) => b.revenue - a.revenue).slice(0, 8); }, [sales, db.customers]);
  const byPay = useMemo(() => { const m = {}; sales.forEach((s) => { m[s.payMethod] = round2((m[s.payMethod] || 0) + s.total); }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [sales]);
  const bySupplier = useMemo(() => { const m = {}; purchases.forEach((p) => { const s = db.suppliers.find((x) => x.id === p.supplierId); const n = s ? s.name : '—'; if (!m[n]) m[n] = { name: n, orders: 0, total: 0 }; m[n].orders++; m[n].total = round2(m[n].total + p.total); }); return Object.values(m).sort((a, b) => b.total - a.total); }, [purchases, db.suppliers]);
  const byPProduct = useMemo(() => { const m = {}; purchases.forEach((p) => p.items.forEach((it) => { if (!m[it.name]) m[it.name] = { name: it.name, units: 0, cost: 0 }; m[it.name].units += it.qty; m[it.name].cost = round2(m[it.name].cost + it.qty * it.cost); })); return Object.values(m).sort((a, b) => b.cost - a.cost).slice(0, 10); }, [purchases]);
  const valuation = useMemo(() => { const m = {}; db.products.forEach((p) => { m[p.category] = round2((m[p.category] || 0) + p.cost * p.stock); }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [db.products]);
  const lowRows = db.products.filter((p) => p.stock <= p.min);
  const exportBtn = (name, rows2) => <Btn kind="outline" size="sm" icon="download" onClick={() => { downloadCSV(name + '.csv', rows2); toast('Report exported as CSV.', 'success'); }}>Export</Btn>;
  return (
    <>
      <PageHead title="Reports" sub="Business analytics across sales, purchases and inventory"
        actions={<select className="input" value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Date range"><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>} />
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className={`tab ${tab === 'sales' ? 'active' : ''}`} onClick={() => setTab('sales')}>Sales</button>
        <button className={`tab ${tab === 'purchases' ? 'active' : ''}`} onClick={() => setTab('purchases')}>Purchases</button>
        <button className={`tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>Inventory</button>
      </div>
      {tab === 'sales' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-head"><div className="card-title">Daily sales</div>{exportBtn('daily-sales', [['Date', 'Revenue'], ...daily.map((d) => [d.label, d.value])])}</div>
            <div style={{ height: 250, padding: '10px 8px 2px 0' }}>
              <ResponsiveContainer width="100%" height="100%"><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10.5, fill: ct.tick }} tickLine={false} axisLine={false} interval={Math.ceil(daily.length / 10)} /><YAxis tick={{ fontSize: 10.5, fill: ct.tick }} tickLine={false} axisLine={false} width={50} /><Tooltip formatter={(v) => [money(v, sym), 'Revenue']} contentStyle={tooltipStyle} /><Bar dataKey="value" fill={ct.line} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Product sales (top 10)</div>{exportBtn('product-sales', [['Product', 'Units', 'Revenue'], ...byProduct.map((r) => [r.name, r.units, r.revenue])])}</div>
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Product</th><th className="num">Units</th><th className="num">Revenue</th></tr></thead><tbody>{byProduct.map((r) => <tr key={r.name}><td className="cell-main">{r.name}</td><td className="num">{r.units}</td><td className="num" style={{ fontWeight: 600 }}>{money(r.revenue, sym)}</td></tr>)}</tbody></table></div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Customer sales</div>{exportBtn('customer-sales', [['Customer', 'Orders', 'Revenue'], ...byCustomer.map((r) => [r.name, r.orders, r.revenue])])}</div>
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Customer</th><th className="num">Orders</th><th className="num">Revenue</th></tr></thead><tbody>{byCustomer.map((r) => <tr key={r.name}><td className="cell-main">{r.name}</td><td className="num">{r.orders}</td><td className="num" style={{ fontWeight: 600 }}>{money(r.revenue, sym)}</td></tr>)}</tbody></table></div>
            <div className="card-head" style={{ borderTop: '1px solid var(--border)' }}><div className="card-title">By payment method</div></div>
            <div style={{ height: 190 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byPay} dataKey="value" nameKey="name" outerRadius={70}>{byPay.map((c, i) => <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={(v) => money(v, sym)} contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11.5, color: 'var(--muted)' }} /></PieChart></ResponsiveContainer></div>
          </div>
        </div>
      )}
      {tab === 'purchases' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="grid kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', padding: 16 }}>
              <StatCard icon="truck" label="Orders" value={int(purchases.length)} tone="blue" sub="in range" />
              <StatCard icon="dollar" label="Purchase Total" value={money(round2(purchases.reduce((a, p) => a + p.total, 0)), sym)} tone="green" sub="incl. tax" />
              <StatCard icon="clock" label="Pending" value={int(purchases.filter((p) => p.status === 'Pending').length)} tone="amber" sub="to receive" />
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Purchases by supplier</div>{exportBtn('supplier-purchases', [['Supplier', 'Orders', 'Total'], ...bySupplier.map((r) => [r.name, r.orders, r.total])])}</div>
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Supplier</th><th className="num">Orders</th><th className="num">Total</th></tr></thead><tbody>{bySupplier.map((r) => <tr key={r.name}><td className="cell-main">{r.name}</td><td className="num">{r.orders}</td><td className="num" style={{ fontWeight: 600 }}>{money(r.total, sym)}</td></tr>)}</tbody></table></div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Purchased products (top 10)</div>{exportBtn('product-purchases', [['Product', 'Units', 'Cost'], ...byPProduct.map((r) => [r.name, r.units, r.cost])])}</div>
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Product</th><th className="num">Units</th><th className="num">Cost</th></tr></thead><tbody>{byPProduct.map((r) => <tr key={r.name}><td className="cell-main">{r.name}</td><td className="num">{r.units}</td><td className="num" style={{ fontWeight: 600 }}>{money(r.cost, sym)}</td></tr>)}</tbody></table></div>
          </div>
        </div>
      )}
      {tab === 'inventory' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><div className="card-title">Stock valuation by category</div>{exportBtn('stock-valuation', [['Category', 'Value'], ...valuation.map((v) => [v.name, v.value])])}</div>
            <div style={{ height: 240, padding: '10px 8px 2px 0' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={valuation} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} /><XAxis type="number" tick={{ fontSize: 10.5, fill: ct.tick }} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: ct.tick }} width={86} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => [money(v, sym), 'Value']} contentStyle={tooltipStyle} /><Bar dataKey="value" fill="#8b5cf6" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div>
            <div className="card-head" style={{ borderTop: '1px solid var(--border)' }}><div className="card-title">Stock summary</div></div>
            <div style={{ padding: '4px 16px 14px', fontSize: 13 }}>
              <div className="sum-row"><span>Total units on hand</span><strong>{int(db.products.reduce((a, p) => a + p.stock, 0))}</strong></div>
              <div className="sum-row"><span>Low stock items</span><strong>{int(db.products.filter((p) => p.stock > 0 && p.stock <= p.min).length)}</strong></div>
              <div className="sum-row"><span>Out of stock items</span><strong>{int(db.products.filter((p) => p.stock <= 0).length)}</strong></div>
              <div className="sum-row"><span>Total valuation (cost)</span><strong>{money(round2(db.products.reduce((a, p) => a + p.cost * p.stock, 0)), sym)}</strong></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Low / out of stock</div>{exportBtn('low-stock', [['Product', 'SKU', 'Stock', 'Min'], ...lowRows.map((p) => [p.name, p.sku, p.stock, p.min])])}</div>
            {lowRows.length === 0 ? <Empty icon="checkCircle" title="All stock healthy" /> : <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Product</th><th className="num">Stock</th><th className="num">Min</th><th>Status</th></tr></thead><tbody>{lowRows.map((p) => <tr key={p.id}><td className="cell-main">{p.name}</td><td className="num">{p.stock}</td><td className="num">{p.min}</td><td><Badge tone={p.stock <= 0 ? 'red' : 'amber'}>{p.stock <= 0 ? 'Out of Stock' : 'Low Stock'}</Badge></td></tr>)}</tbody></table></div>}
            <div className="card-head" style={{ borderTop: '1px solid var(--border)' }}><div className="card-title">Recent movements</div>{exportBtn('stock-movements', [['Date', 'Product', 'Type', 'Qty', 'Reason'], ...db.movements.slice(0, 20).map((m) => [fmtDateTime(m.date), m.productName, m.type, m.qty, m.reason])])}</div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>{db.movements.slice(0, 12).map((m) => (
              <div key={m.id} style={{ display: 'flex', gap: 10, padding: '8px 16px', fontSize: 12.5, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <Badge tone={m.qty > 0 ? 'green' : 'red'}>{m.qty > 0 ? '+' + m.qty : m.qty}</Badge>
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.productName}</span><span className="mut small">{m.type} • {m.reason}</span></span>
                <span className="mut small">{timeAgo(m.date)}</span>
              </div>))}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================= USERS / ROLES / SETTINGS ============================= */
function UserModal({ existing, onClose }) {
  const { db, act, toast, user } = useApp();
  const [f, setF] = useState(existing ? { ...existing } : { name: '', email: '', role: 'cashier', title: '', status: 'Active', password: 'demo123' });
  const [errs, setErrs] = useState({});
  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email.';
    else if (db.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.id !== f.id)) e.email = 'Email already in use.';
    if (!f.password || f.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrs(e);
    if (Object.keys(e).length) return;
    if (existing && existing.id === user.id && f.role !== 'admin' && user.role === 'admin') { toast('You cannot demote your own account.', 'error'); return; }
    act.saveUser({ ...f, name: f.name.trim() });
    toast(existing ? 'User updated.' : 'User created — they can sign in with this role.', 'success');
    onClose();
  };
  return (
    <Modal title={existing ? 'Edit user' : 'Add user'} size="md" onClose={onClose} footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit}>{existing ? 'Save changes' : 'Create user'}</Btn></>}>
      <div className="form-row">
        <Field label="Full name" req error={errs.name}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Job title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      </div>
      <Field label="Email" req error={errs.email}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <div className="form-row">
        <Field label="Role" req hint="Controls module access"><select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{Object.keys(ROLES_META).map((r) => <option key={r} value={r}>{ROLES_META[r].label}</option>)}</select></Field>
        <Field label="Status"><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
      </div>
      <Field label="Password" req error={errs.password} hint="Demo only — stored locally"><input className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
    </Modal>
  );
}
function UsersPage() {
  const { db, act, toast, user, can } = useApp();
  const [modal, setModal] = useState(null);
  const cols = [
    { key: 'name', label: 'Name', sort: (r) => r.name, render: (r) => <span className="tile-row"><span className="avatar">{initials(r.name)}</span><span><span className="cell-main">{r.name}{r.id === user.id && <span className="mut small"> (you)</span>}</span><span className="cell-sub">{r.title}</span></span></span> },
    { key: 'email', label: 'Email', sort: (r) => r.email, render: (r) => <span className="mut">{r.email}</span> },
    { key: 'role', label: 'Role', sort: (r) => r.role, render: (r) => <Badge tone={r.role === 'admin' ? 'purple' : r.role === 'manager' ? 'blue' : r.role === 'cashier' ? 'green' : 'amber'}>{ROLES_META[r.role].label}</Badge> },
    { key: 'status', label: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: 'lastLogin', label: 'Last login', sort: (r) => r.lastLogin || '', render: (r) => <span className="mut small">{r.lastLogin ? fmtDateTime(r.lastLogin) : 'Never'}</span> },
    { key: 'act', label: '', render: (r) => <span className="row-actions" onClick={(e) => e.stopPropagation()}>
      {can('users', 'edit') && <button className="icon-btn sm" title="Edit" onClick={() => setModal({ edit: r })}><Icon name="edit" size={14} /></button>}
      {can('users', 'edit') && <button className="icon-btn sm" title="Reset password" onClick={() => toast('Password reset link sent to ' + r.email + ' (simulated).', 'warning')}><Icon name="lock" size={14} /></button>}
      {can('users', 'delete') && r.id !== user.id && <button className="icon-btn sm" title="Delete" onClick={() => setModal({ del: r })}><Icon name="trash" size={14} /></button>}
    </span> },
  ];
  return (
    <>
      <PageHead title="Users" sub="Team accounts and access" actions={can('users', 'create') && <Btn icon="plus" onClick={() => setModal('add')}>Add user</Btn>} />
      <DataTable cols={cols} rows={db.users} empty={<Empty icon="user" title="No users" />}
        card={(r) => <><div className="mc-top"><span className="tile-row"><span className="avatar">{initials(r.name)}</span><span className="cell-main">{r.name}</span></span><Badge tone={statusTone(r.status)}>{r.status}</Badge></div><div className="mc-sub"><span>{ROLES_META[r.role].label}</span><span className="mut">{r.email}</span></div></>} />
      {modal === 'add' && <UserModal onClose={() => setModal(null)} />}
      {modal && modal.edit && <UserModal existing={modal.edit} onClose={() => setModal(null)} />}
      {modal && modal.del && <Confirm title="Delete user?" message={`${modal.del.name} will no longer be able to sign in.`} onConfirm={() => { act.deleteUser(modal.del.id); toast('User deleted.', 'success'); }} onClose={() => setModal(null)} />}
    </>
  );
}
function RolesPage() {
  const { db, act, toast } = useApp();
  const [role, setRole] = useState('manager');
  const MODULE_LIST = NAV.filter((n) => n.k !== 'roles');
  return (
    <>
      <PageHead title="Roles & Permissions" sub="Control what each role can see and do — changes apply instantly" />
      <div className="chips" style={{ marginBottom: 16 }}>
        {Object.keys(ROLES_META).map((r) => <button key={r} className={`chip ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>{ROLES_META[r].label} ({db.users.filter((u) => u.role === r).length})</button>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        <div className="card card-pad">
          <div className="card-title">{ROLES_META[role].label}</div>
          <p className="mut" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>{ROLES_META[role].desc}</p>
          <div className="divider" />
          <div className="small mut" style={{ lineHeight: 1.8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="users" size={14} />{db.users.filter((u) => u.role === role).length} team members</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="grid" size={14} />{role === 'admin' ? 'All' : Object.values(db.permissions[role] || {}).filter((m) => m.view).length} modules accessible</div>
          </div>
          {role === 'admin' && <div className="badge b-purple" style={{ marginTop: 12 }}><Icon name="lock" size={11} /> Full access — locked</div>}
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Permission matrix — {ROLES_META[role].label}</div>{role !== 'admin' && <span className="mut small">Click to toggle</span>}</div>
          <div className="tbl-wrap">
            <table className="matrix">
              <thead><tr><th>Module</th>{PERM_ACTIONS.map((a) => <th key={a}>{a[0].toUpperCase() + a.slice(1)}</th>)}</tr></thead>
              <tbody>
                {MODULE_LIST.map((m) => (
                  <tr key={m.k}>
                    <td><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name={m.icon} size={14} className="mut" />{m.label}</span></td>
                    {PERM_ACTIONS.map((a) => {
                      const val = role === 'admin' ? true : !!(db.permissions[role] && db.permissions[role][m.k] && db.permissions[role][m.k][a]);
                      return <td key={a}><input type="checkbox" disabled={role === 'admin'} checked={val} aria-label={`${m.label} ${a}`} onChange={(e) => { act.setPermission(role, m.k, a, e.target.checked); toast(ROLES_META[role].label + ' — ' + m.label + ' ' + a + ' ' + (e.target.checked ? 'enabled' : 'disabled') + '.', 'success'); }} /></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small mut" style={{ padding: 12 }}>Tip: change a user's role in <strong>Users</strong>, then sign in as that user to see the navigation adapt.</p>
        </div>
      </div>
    </>
  );
}
function SettingsPage() {
  const { db, act, toast } = useApp();
  const [tab, setTab] = useState('business');
  const [f, setF] = useState(JSON.parse(JSON.stringify(db.settings)));
  const [backing, setBacking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const save = (section) => { act.saveSettings(section, f[section]); toast('Settings saved.', 'success'); };
  const TABS = [['business', 'Business Profile', 'building'], ['invoice', 'Invoice & Receipt', 'receipt'], ['tax', 'Tax & Currency', 'dollar'], ['pos', 'POS', 'cart'], ['notifications', 'Notifications', 'bell'], ['security', 'Security & Backup', 'lock']];
  return (
    <>
      <PageHead title="Settings" sub="Configure the business, documents and behaviour" />
      <div className="set-grid">
        <div className="card card-pad set-nav">
          {TABS.map((t) => <button key={t[0]} className={tab === t[0] ? 'active' : ''} onClick={() => setTab(t[0])}><Icon name={t[2]} size={15} />{t[1]}</button>)}
        </div>
        <div className="card card-pad">
          {tab === 'business' && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Business profile</h3>
              <div className="form-row">
                <Field label="Business name" req><input className="input" value={f.business.name} onChange={(e) => setF({ ...f, business: { ...f.business, name: e.target.value } })} /></Field>
                <Field label="Website"><input className="input" value={f.business.website} onChange={(e) => setF({ ...f, business: { ...f.business, website: e.target.value } })} /></Field>
              </div>
              <Field label="Address"><input className="input" value={f.business.address} onChange={(e) => setF({ ...f, business: { ...f.business, address: e.target.value } })} /></Field>
              <div className="form-row">
                <Field label="City / Region"><input className="input" value={f.business.city} onChange={(e) => setF({ ...f, business: { ...f.business, city: e.target.value } })} /></Field>
                <Field label="Phone"><input className="input" value={f.business.phone} onChange={(e) => setF({ ...f, business: { ...f.business, phone: e.target.value } })} /></Field>
              </div>
              <Field label="Email"><input className="input" value={f.business.email} onChange={(e) => setF({ ...f, business: { ...f.business, email: e.target.value } })} /></Field>
              <Btn icon="check" onClick={() => save('business')}>Save business profile</Btn>
            </>
          )}
          {tab === 'invoice' && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Invoice & receipt settings</h3>
              <div className="form-row">
                <Field label="Invoice number prefix"><input className="input" value={f.invoice.prefix} onChange={(e) => setF({ ...f, invoice: { ...f.invoice, prefix: e.target.value } })} /></Field>
                <Field label="Next invoice number"><input className="input" type="number" value={f.invoice.next} onChange={(e) => setF({ ...f, invoice: { ...f.invoice, next: parseInt(e.target.value, 10) || 1 } })} /></Field>
              </div>
              <Field label="Receipt footer message"><textarea className="input" value={f.invoice.footer} onChange={(e) => setF({ ...f, invoice: { ...f.invoice, footer: e.target.value } })} /></Field>
              <Field label="Return policy / notes"><textarea className="input" value={f.invoice.notes} onChange={(e) => setF({ ...f, invoice: { ...f.invoice, notes: e.target.value } })} /></Field>
              <Btn icon="check" onClick={() => save('invoice')}>Save document settings</Btn>
            </>
          )}
          {tab === 'tax' && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Tax & currency</h3>
              <p className="small mut" style={{ marginBottom: 14, lineHeight: 1.6 }}>Configurable for any country — your local tax rules will be confirmed during production rollout.</p>
              <div className="form-row">
                <Field label="Tax name (e.g. VAT / GST / Sales Tax)"><input className="input" value={f.tax.name} onChange={(e) => setF({ ...f, tax: { ...f.tax, name: e.target.value } })} /></Field>
                <Field label="Tax rate (%)"><input className="input" type="number" min="0" max="100" step="0.1" value={f.tax.rate} onChange={(e) => setF({ ...f, tax: { ...f.tax, rate: Math.max(0, parseFloat(e.target.value) || 0) } })} /></Field>
              </div>
              <div className="form-row">
                <Field label="Tax registration number"><input className="input" value={f.tax.number} onChange={(e) => setF({ ...f, tax: { ...f.tax, number: e.target.value } })} /></Field>
                <Field label="Currency symbol"><input className="input" value={f.currency.symbol} onChange={(e) => setF({ ...f, currency: { ...f.currency, symbol: e.target.value } })} /></Field>
              </div>
              <Field label="Currency code"><input className="input" value={f.currency.code} onChange={(e) => setF({ ...f, currency: { ...f.currency, code: e.target.value } })} /></Field>
              <Btn icon="check" onClick={() => save('tax')}>Save tax & currency</Btn>
            </>
          )}
          {tab === 'pos' && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>POS behaviour</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="check" style={{ justifyContent: 'space-between' }}><span>Require customer selection before checkout</span><button className={`switch ${f.pos.requireCustomer ? 'on' : ''}`} aria-label="Require customer" onClick={() => setF({ ...f, pos: { ...f.pos, requireCustomer: !f.pos.requireCustomer } })} /></label>
                <label className="check" style={{ justifyContent: 'space-between' }}><span>Auto-open receipt print after sale (simulated)</span><button className={`switch ${f.pos.autoPrint ? 'on' : ''}`} aria-label="Auto print" onClick={() => setF({ ...f, pos: { ...f.pos, autoPrint: !f.pos.autoPrint } })} /></label>
              </div>
              <div className="divider" />
              <Btn icon="check" onClick={() => save('pos')}>Save POS settings</Btn>
            </>
          )}
          {tab === 'notifications' && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Notification rules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries({ lowStock: 'Low stock alerts', newSale: 'New sale alerts', newPurchase: 'Purchase alerts', backup: 'Backup alerts' }).map(([k, label]) => (
                  <label className="check" key={k} style={{ justifyContent: 'space-between' }}><span>{label}</span><button className={`switch ${f.notifications[k] ? 'on' : ''}`} aria-label={label} onClick={() => setF({ ...f, notifications: { ...f.notifications, [k]: !f.notifications[k] } })} /></label>
                ))}
              </div>
              <div className="divider" />
              <Btn icon="check" onClick={() => save('notifications')}>Save notification rules</Btn>
            </>
          )}
          {tab === 'security' && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Security & backup</h3>
              <div className="form-row">
                <Field label="Session timeout (minutes)"><input className="input" type="number" min="5" value={f.security.sessionTimeout} onChange={(e) => setF({ ...f, security: { ...f.security, sessionTimeout: parseInt(e.target.value, 10) || 30 } })} /></Field>
                <Field label="Password policy"><select className="input" value={f.security.passwordPolicy} onChange={(e) => setF({ ...f, security: { ...f.security, passwordPolicy: e.target.value } })}><option>Basic</option><option>Medium</option><option>Strong</option></select></Field>
              </div>
              <label className="check" style={{ justifyContent: 'space-between', marginBottom: 16 }}><span>Require two-factor authentication (production feature)</span><button className={`switch ${f.security.twoFactor ? 'on' : ''}`} aria-label="Two factor" onClick={() => setF({ ...f, security: { ...f.security, twoFactor: !f.security.twoFactor } })} /></label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn icon="check" onClick={() => save('security')}>Save security</Btn>
                <Btn kind="outline" icon="download" disabled={backing} onClick={() => { setBacking(true); setTimeout(() => { setBacking(false); act.backup(); toast('Backup completed successfully (simulated).', 'success'); }, 1400); }}>{backing ? 'Creating backup…' : 'Backup now'}</Btn>
                <Btn kind="danger" icon="refresh" onClick={() => setConfirmReset(true)}>Reset demo data</Btn>
              </div>
              <p className="small mut" style={{ marginTop: 12 }}>Reset restores the original seeded dataset — useful between client demos.</p>
            </>
          )}
        </div>
      </div>
      {confirmReset && <Confirm title="Reset demo data?" message="All changes made during this demo (sales, products, users…) will be discarded and the original dataset restored." confirmText="Reset data" onConfirm={() => { act.resetDemo(); toast('Demo data has been reset.', 'success'); }} onClose={() => setConfirmReset(false)} />}
    </>
  );
}

/* ============================= MISC PAGES ============================= */
function Denied() {
  return <div className="card" style={{ maxWidth: 480, margin: '60px auto' }}><Empty icon="lock" title="Access restricted" message="Your role does not have permission to view this module. Contact an administrator if you believe this is a mistake." action={<Btn kind="outline" onClick={() => nav('/')}>Go to my home</Btn>} /></div>;
}
function NotFound() {
  return <div className="card" style={{ maxWidth: 480, margin: '60px auto' }}><Empty icon="info" title="Page not found" message="The page you requested does not exist in this prototype." action={<Btn kind="outline" onClick={() => nav('/')}>Back to home</Btn>} /></div>;
}
function RedirectHome() {
  const { can } = useApp();
  useEffect(() => { nav(landingFor(can)); }, [can]);
  return null;
}

/* ============================= ROOT ============================= */
function Root() {
  const { user, booting, can } = useApp();
  const route = useRoute();
  const seg = route.split('/').filter(Boolean);
  const pageKey = seg.join('/') || 'home';
  const [navLoading, setNavLoading] = useState(false);
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 340);
    return () => clearTimeout(t);
  }, [pageKey]);
  if (booting) return <div className="splash"><span className="brand-logo" style={{ width: 60, height: 60, borderRadius: 16 }}><img src={LOGO_URL} alt="" style={{ width: 40, height: 40 }} onError={(e) => { e.target.style.display = 'none'; }} /></span><div className="spin" /><div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>Loading Business Suite…</div></div>;
  if (!user) return <LoginPage />;
  const rootKey = seg[0] || '';
  const id = seg[1] || null;
  const PAGES = { dashboard: DashboardPage, pos: POSPage, products: ProductsPage, inventory: InventoryPage, sales: SalesPage, purchases: PurchasesPage, customers: CustomersPage, suppliers: SuppliersPage, reports: ReportsPage, users: UsersPage, roles: RolesPage, settings: SettingsPage };
  let page;
  if (!rootKey || rootKey === 'login') page = <RedirectHome />;
  else if (rootKey === 'invoices') page = can('sales') ? <InvoicePage id={id} /> : <Denied />;
  else if (PAGES[rootKey]) page = can(rootKey) ? React.createElement(PAGES[rootKey], { id }) : <Denied />;
  else page = <NotFound />;
  return (
    <Shell>
      {navLoading ? <PageSkeleton /> : <div key={pageKey} className="page-anim">{page}</div>}
    </Shell>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <Mist />
      <Root />
    </StoreProvider>
  );
}
