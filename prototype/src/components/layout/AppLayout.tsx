import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { hasPermission, formatCurrency } from '../../utils/permissions';
import { Icon, Dropdown, DropdownItem, Button } from '../ui';
import { cn } from '../../utils/cn';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  module: string;
  group: 'MAIN' | 'ADMIN';
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid', module: 'dashboard', group: 'MAIN' },
  { path: '/pos', label: 'POS / Billing', icon: 'cart', module: 'pos', group: 'MAIN' },
  { path: '/products', label: 'Products', icon: 'box', module: 'products', group: 'MAIN' },
  { path: '/inventory', label: 'Inventory', icon: 'layers', module: 'inventory', group: 'MAIN' },
  { path: '/sales', label: 'Sales', icon: 'receipt', module: 'sales', group: 'MAIN' },
  { path: '/purchases', label: 'Purchases', icon: 'truck', module: 'purchases', group: 'MAIN' },
  { path: '/customers', label: 'Customers', icon: 'users', module: 'customers', group: 'MAIN' },
  { path: '/suppliers', label: 'Suppliers', icon: 'building', module: 'suppliers', group: 'MAIN' },
  { path: '/reports', label: 'Reports', icon: 'chart', module: 'reports', group: 'MAIN' },
  { path: '/users', label: 'Users', icon: 'user', module: 'users', group: 'ADMIN' },
  { path: '/roles', label: 'Roles & Permissions', icon: 'shield', module: 'roles', group: 'ADMIN' },
  { path: '/settings', label: 'Settings', icon: 'sliders', module: 'settings', group: 'ADMIN' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    products,
    customers,
    suppliers,
    sales,
    settings,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    toggleTheme,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [notiOpen, setNotiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  const notiRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Global hotkeys (Escape, Command/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setNotiOpen(false);
        setProfileOpen(false);
        setMoreSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus palette input when opened
  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 50);
    } else {
      setPaletteSearch('');
    }
  }, [paletteOpen]);

  if (!currentUser) return null;

  const accessibleNav = NAV_ITEMS.filter(item => hasPermission(currentUser, item.module, 'view'));
  const mainNav = accessibleNav.filter(item => item.group === 'MAIN');
  const adminNav = accessibleNav.filter(item => item.group === 'ADMIN');

  // Command palette search results
  const query = paletteSearch.trim().toLowerCase();
  const searchResults = query.length >= 1
    ? [
        ...accessibleNav
          .filter(n => n.label.toLowerCase().includes(query))
          .map(n => ({ type: 'Page', label: n.label, sub: 'Navigation', icon: n.icon, link: n.path })),
        ...products
          .filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query))
          .slice(0, 4)
          .map(p => ({ type: 'Product', label: p.name, sub: `${p.sku} • ${formatCurrency(p.sellingPrice, settings.currencySymbol)}`, icon: 'box', link: '/products' })),
        ...customers
          .filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query) || c.email.toLowerCase().includes(query))
          .slice(0, 3)
          .map(c => ({ type: 'Customer', label: c.name, sub: c.phone || c.email, icon: 'users', link: '/customers' })),
        ...suppliers
          .filter(s => s.name.toLowerCase().includes(query) || s.contactPerson.toLowerCase().includes(query))
          .slice(0, 3)
          .map(s => ({ type: 'Supplier', label: s.name, sub: s.contactPerson, icon: 'building', link: '/suppliers' })),
        ...sales
          .filter(s => s.invoiceNo.toLowerCase().includes(query) || s.customerName.toLowerCase().includes(query))
          .slice(0, 3)
          .map(s => ({ type: 'Sale', label: s.invoiceNo, sub: `${s.customerName} • ${formatCurrency(s.total, settings.currencySymbol)}`, icon: 'receipt', link: '/sales' })),
      ]
    : [];

  const handleSelectSearchResult = (link: string) => {
    navigate(link);
    setPaletteOpen(false);
    setPaletteSearch('');
  };

  const userInitials = (currentUser.name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isCurrentPath = (path: string) =>
    location.pathname === path || (path !== '/' && path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="shell">
      {/* Background Mist Ambient Orbs */}
      <div className="mist" aria-hidden="true">
        <i className="m1" />
        <i className="m2" />
        <i className="m3" />
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar',
          sidebarCollapsed && 'collapsed',
          sidebarOpen && 'open'
        )}
      >
        {/* Brand Header */}
        <div className="brand">
          <div className="brand-logo">
            <Icon name="zap" size={20} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="brand-name truncate">Pramukh ERP</div>
              <div className="brand-sub truncate">Hardware & Building</div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="nav-scroll">
          {!sidebarCollapsed && <div className="nav-section">Main</div>}
          {mainNav.map(item => {
            const active = isCurrentPath(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn('nav-item', active && 'active')}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={18} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {adminNav.length > 0 && (
            <>
              {!sidebarCollapsed && <div className="nav-section mt-3">Admin</div>}
              {adminNav.map(item => {
                const active = isCurrentPath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn('nav-item', active && 'active')}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon name={item.icon} size={18} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="side-foot">
          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="nav-item hide-sm"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={sidebarCollapsed ? 'chevR' : 'chevL'} size={16} />
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className={cn('main', sidebarCollapsed && 'collapsed')}>
        {/* Topbar */}
        <header className="topbar">
          {/* Mobile Drawer Trigger / Desktop Sidebar Collapse */}
          <button
            onClick={() => {
              if (window.innerWidth <= 900) {
                setSidebarOpen(!sidebarOpen);
              } else {
                setSidebarCollapsed(prev => !prev);
              }
            }}
            className="icon-btn"
            aria-label="Toggle navigation menu"
          >
            <Icon name="menu" size={20} />
          </button>

          {/* Current Page Context */}
          <div className="topbar-brand hidden sm:block">
            {accessibleNav.find(n => isCurrentPath(n.path))?.label || 'Pramukh ERP'}
          </div>

          {/* Global Search Trigger Bar */}
          <div
            className="search-trigger ml-auto"
            onClick={() => setPaletteOpen(true)}
            role="button"
            tabIndex={0}
          >
            <Icon name="search" size={15} />
            <span className="truncate text-xs sm:text-sm">Search anything...</span>
            <kbd className="kbd hidden sm:inline-block">⌘K</kbd>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          {/* Notification Menu */}
          <div ref={notiRef} className="relative">
            <button
              onClick={() => setNotiOpen(!notiOpen)}
              className="icon-btn"
              aria-label="Notifications"
            >
              <Icon name="bell" size={18} />
              {unreadCount > 0 && <span className="bell-dot" />}
            </button>

            {notiOpen && (
              <div className="drop notif-drop">
                <div className="notif-head">
                  <div>
                    <strong className="text-sm">Notifications</strong>
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs text-muted">({unreadCount} new)</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="link text-xs"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted text-xs">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 10).map(noti => (
                      <button
                        key={noti.id}
                        onClick={() => {
                          markNotificationRead(noti.id);
                          if (noti.link) navigate(noti.link);
                          setNotiOpen(false);
                        }}
                        className={cn('notif-item', !noti.read && 'unread')}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: noti.type === 'warning' ? 'var(--warning-bg)' : noti.type === 'error' ? 'var(--danger-bg)' : 'var(--accent-soft)',
                            color: noti.type === 'warning' ? 'var(--warning)' : noti.type === 'error' ? 'var(--danger)' : 'var(--accent-text)',
                          }}
                        >
                          <Icon name={noti.type === 'warning' || noti.type === 'error' ? 'alert' : 'info'} size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text truncate">{noti.title}</div>
                          <div className="text-xs text-muted mt-0.5 line-clamp-2">{noti.message}</div>
                          <div className="text-[11px] text-muted2 mt-1">
                            {new Date(noti.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div ref={profileRef} className="relative">
            <div
              className="avatar"
              onClick={() => setProfileOpen(!profileOpen)}
              role="button"
              tabIndex={0}
            >
              {userInitials}
            </div>

            {profileOpen && (
              <div className="drop user">
                <div className="drop-head">
                  <div className="avatar">{userInitials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate text-text">{currentUser.name}</div>
                    <div className="text-xs text-muted truncate">{currentUser.email}</div>
                    <div className="text-[11px] text-accent-text font-semibold capitalize mt-0.5">
                      {currentUser.role}
                    </div>
                  </div>
                </div>
                <DropdownItem
                  icon="sliders"
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                >
                  Settings
                </DropdownItem>
                <DropdownItem
                  icon="user"
                  onClick={() => {
                    navigate('/users');
                    setProfileOpen(false);
                  }}
                >
                  User Management
                </DropdownItem>
                <div className="divider my-1" />
                <DropdownItem
                  icon="logout"
                  danger
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Sign Out
                </DropdownItem>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="content page-anim">{children}</main>
      </div>

      {/* Global Command Palette Dialog */}
      {paletteOpen && (
        <div className="palette-overlay" onClick={() => setPaletteOpen(false)}>
          <div className="palette" onClick={e => e.stopPropagation()}>
            <div className="pal-input">
              <Icon name="search" size={18} className="text-muted" />
              <input
                ref={paletteInputRef}
                type="text"
                placeholder="Type to search pages, products, customers, invoices..."
                value={paletteSearch}
                onChange={e => setPaletteSearch(e.target.value)}
              />
              <kbd className="kbd">Esc</kbd>
            </div>

            <div className="pal-list">
              {query.length === 0 ? (
                <>
                  <div className="pal-group">Quick Navigation</div>
                  {accessibleNav.slice(0, 6).map(n => (
                    <button
                      key={n.path}
                      className="pal-item"
                      onClick={() => handleSelectSearchResult(n.path)}
                    >
                      <div className="p-ico">
                        <Icon name={n.icon} size={15} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{n.label}</div>
                        <div className="p-sub">Jump to {n.label} module</div>
                      </div>
                    </button>
                  ))}
                </>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-muted text-sm">
                  No results found for &ldquo;{paletteSearch}&rdquo;
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={i}
                    className="pal-item"
                    onClick={() => handleSelectSearchResult(res.link)}
                  >
                    <div className="p-ico">
                      <Icon name={res.icon} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{res.label}</div>
                      <div className="p-sub truncate">{res.sub}</div>
                    </div>
                    <span className="badge b-gray ml-auto text-[11px]">{res.type}</span>
                  </button>
                ))
              )}
            </div>

            <div className="pal-foot">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (< 900px) */}
      <nav className="bnav" aria-label="Mobile Navigation">
        <button
          className={cn('bnav-item', isCurrentPath('/dashboard') && 'active')}
          onClick={() => navigate('/dashboard')}
        >
          <Icon name="grid" size={20} />
          <span>Dashboard</span>
        </button>
        <button
          className={cn('bnav-item', isCurrentPath('/pos') && 'active')}
          onClick={() => navigate('/pos')}
        >
          <Icon name="cart" size={20} />
          <span>POS</span>
        </button>
        <button
          className={cn('bnav-item', isCurrentPath('/products') && 'active')}
          onClick={() => navigate('/products')}
        >
          <Icon name="box" size={20} />
          <span>Products</span>
        </button>
        <button
          className={cn('bnav-item', isCurrentPath('/sales') && 'active')}
          onClick={() => navigate('/sales')}
        >
          <Icon name="receipt" size={20} />
          <span>Sales</span>
        </button>
        <button
          className={cn('bnav-item', moreSheetOpen && 'active')}
          onClick={() => setMoreSheetOpen(true)}
        >
          <Icon name="dots" size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet */}
      {moreSheetOpen && (
        <div className="sheet-overlay" onClick={() => setMoreSheetOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="grab" />
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <div className="font-bold text-base">More Modules</div>
              <button onClick={() => setMoreSheetOpen(false)} className="icon-btn sm">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="more-section">Operations</div>
            <div className="more-grid">
              {accessibleNav
                .filter(n => ['inventory', 'purchases', 'customers', 'suppliers', 'reports'].includes(n.module))
                .map(n => (
                  <button
                    key={n.path}
                    className="more-item"
                    onClick={() => {
                      navigate(n.path);
                      setMoreSheetOpen(false);
                    }}
                  >
                    <Icon name={n.icon} size={18} className="text-accent" />
                    <span>{n.label}</span>
                  </button>
                ))}
            </div>

            <div className="more-section">Administration</div>
            <div className="more-grid">
              {accessibleNav
                .filter(n => ['users', 'roles', 'settings'].includes(n.module))
                .map(n => (
                  <button
                    key={n.path}
                    className="more-item"
                    onClick={() => {
                      navigate(n.path);
                      setMoreSheetOpen(false);
                    }}
                  >
                    <Icon name={n.icon} size={18} className="text-accent" />
                    <span>{n.label}</span>
                  </button>
                ))}
            </div>

            <div className="divider my-3" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="avatar">{userInitials}</div>
                <div>
                  <div className="font-semibold text-xs text-text">{currentUser.name}</div>
                  <div className="text-[11px] text-muted capitalize">{currentUser.role}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:text-danger"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
