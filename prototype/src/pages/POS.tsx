import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Modal, Icon, Badge, showToast, EmptyState } from '../components/ui';
import { hasPermission, formatCurrency, formatDate } from '../utils/permissions';
import ReceiptDocument from '../components/documents/ReceiptDocument';
import type { Sale } from '../types';
import { cn } from '../utils/cn';

export default function POS() {
  const {
    products,
    customers,
    cart,
    heldCarts,
    selectedCustomerId,
    settings,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    holdCart,
    restoreHeldCart,
    deleteHeldCart,
    setCartCustomer,
    completeSale,
  } = useApp();

  const sym = settings.currencySymbol || '$';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Other')))];

  const filteredProducts = products.filter(p => {
    const s = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      (p.barcode && p.barcode.includes(s));
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  const cartQuantityMap = cart.reduce((acc, item) => {
    acc[item.product.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountAmount = Math.min(discount, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * (settings.taxRate / 100);
  const total = taxableAmount + tax;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerSelect(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          holdCart();
          showToast('success', 'Cart held successfully');
        }
      }
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setShowCheckout(true);
      }
      if (e.key === 'Escape') {
        setShowCheckout(false);
        setShowHeld(false);
        setShowReceipt(null);
        setShowCustomerSelect(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length, holdCart]);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashAmount && parseFloat(cashAmount) < total) {
      showToast('error', 'Tendered cash is less than the total amount');
      return;
    }
    const sale = completeSale(paymentMethod);
    setShowCheckout(false);
    setShowReceipt(sale);
    setDiscount(0);
    setCashAmount('');
    setPaymentMethod('cash');
    showToast('success', `Sale ${sale.invoiceNumber} completed!`);
  }, [cart.length, paymentMethod, cashAmount, total, completeSale]);

  const add = (p: typeof products[0]) => {
    if (p.stock <= 0) {
      showToast('error', `${p.name} is out of stock.`);
      return;
    }
    const inCart = cartQuantityMap[p.id] || 0;
    if (inCart + 1 > p.stock) {
      showToast('warning', `Only ${p.stock} units of ${p.name} in stock.`);
      return;
    }
    addToCart(p);
  };

  const setQty = (p: typeof products[0], qty: number) => {
    if (qty <= 0) {
      removeFromCart(p.id);
      return;
    }
    if (qty > p.stock) {
      showToast('warning', `Only ${p.stock} units available.`);
      return;
    }
    updateCartQuantity(p.id, qty);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exact = products.find((p) => p.barcode === search.trim() || p.sku.toLowerCase() === search.trim().toLowerCase());
      if (exact) {
        add(exact);
        setSearch('');
      }
    }
  };

  return (
    <>
      <div className="page-anim">
        <div className="pos-grid">
          {/* Main POS Products Area */}
          <div className="flex flex-col gap-4">
            <div className="toolbar">
              <div className="field relative flex-1 min-w-[200px]" style={{ marginBottom: 0 }}>
                <input 
                  ref={searchRef} 
                  className="input pl-10 h-10 w-full" 
                  placeholder="Search products or scan barcode (F2)..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  onKeyDown={onSearchKey} 
                  autoFocus 
                />
                <Icon name="search" size={16} className="text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text">
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
              <div className="chips">
                {categories.map((c) => (
                  <button key={c} className={cn('chip', categoryFilter === c && 'active')} onClick={() => setCategoryFilter(c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="prod-grid">
              {filteredProducts.map((p) => (
                <button key={p.id} className="prod-card" disabled={p.stock <= 0} onClick={() => add(p)}>
                  {cartQuantityMap[p.id] && <span className="pc-in-cart">{cartQuantityMap[p.id]} in cart</span>}
                  <div className="w-11 h-11 rounded-[10px] bg-[var(--hover)] text-muted flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover rounded-[10px]" />
                    ) : (
                      <Icon name="package" size={20} />
                    )}
                  </div>
                  <div className="pc-name">{p.name}</div>
                  <div className="pc-price">{formatCurrency(p.sellingPrice, sym)}</div>
                  <div className="pc-stock">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[var(--hover)] text-muted rounded-xl flex items-center justify-center mb-3">
                    <Icon name="search" size={24} />
                  </div>
                  <h4 className="font-bold mb-1">No products found</h4>
                  <p className="text-sm text-muted">Try adjusting your search or category filter</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar Cart Panel */}
          <div className="card cart-panel">
            <div className="card-head !py-3 !px-4">
              <div className="card-title flex items-center gap-2">
                <Icon name="cart" /> Current Sale {totalItemsCount > 0 && <Badge variant="info">{totalItemsCount} items</Badge>}
              </div>
              <button className="icon-btn text-muted hover:text-text hover:bg-[var(--hover)] p-1.5 rounded-lg" onClick={() => setShowCustomerSelect(true)} title="Assign Customer (F4)">
                <Icon name="user" size={16} />
              </button>
            </div>
            
            {selectedCustomer && (
              <div className="bg-[var(--info-bg)] text-info text-[12.5px] px-4 py-2 border-b border-[var(--border)] font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Icon name="user" size={14} /> {selectedCustomer.name}</span>
                <button className="hover:underline" onClick={() => setCartCustomer(undefined)}>Remove</button>
              </div>
            )}

            <div className="cart-items">
              {cart.length === 0 ? (
                <EmptyState icon="shopping-cart" title="Cart is empty" description="Scan items or select from the grid" />
              ) : (
                cart.map((c) => {
                  return (
                    <div key={c.product.id} className="cart-line">
                      <div className="cl-name">
                        {c.product.name}
                        <span className="cl-price">{formatCurrency(c.product.sellingPrice, sym)} &times; {c.quantity}</span>
                      </div>
                      <div className="qty-ctl shrink-0">
                        <button onClick={() => setQty(c.product, c.quantity - 1)}><Icon name="minus" size={12} /></button>
                        <span>{c.quantity}</span>
                        <button onClick={() => setQty(c.product, c.quantity + 1)}><Icon name="plus" size={12} /></button>
                      </div>
                      <div className="w-[66px] text-right font-bold text-[13px] tabular-nums shrink-0">
                        {formatCurrency(c.product.sellingPrice * c.quantity, sym)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] mt-auto rounded-b-[14px]">
              <div className="sum-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, sym)}</span>
              </div>
              <div className="sum-row text-success">
                <span>Discount</span>
                <span className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => {
                  const d = prompt('Enter discount amount:', String(discount));
                  if (d !== null && !isNaN(Number(d))) setDiscount(Number(d));
                }}>
                  -{formatCurrency(discountAmount, sym)}
                </span>
              </div>
              <div className="sum-row">
                <span>Tax ({settings.taxRate}%)</span>
                <span>{formatCurrency(tax, sym)}</span>
              </div>
              <div className="sum-row total border-t border-[var(--border)] mt-2">
                <span>Total</span>
                <span>{formatCurrency(total, sym)}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => clearCart()} disabled={cart.length === 0}>
                  Clear
                </Button>
                <Button variant="primary" className="flex-[2] font-bold h-12 text-[15px]" onClick={() => setShowCheckout(true)} disabled={cart.length === 0}>
                  Checkout <Icon name="chevR" size={18} />
                </Button>
              </div>
            </div>
            
            <div className="shortcut-bar">
              <span className="flex gap-1 items-center"><kbd className="kbd">F2</kbd> Search</span>
              <span className="flex gap-1 items-center"><kbd className="kbd">F4</kbd> Customer</span>
              <span className="flex gap-1 items-center"><kbd className="kbd">F8</kbd> Hold</span>
              <span className="flex gap-1 items-center"><kbd className="kbd">F9</kbd> Pay</span>
              <button 
                className="flex gap-1 items-center hover:text-text cursor-pointer ml-auto bg-transparent border-none p-0 text-inherit font-inherit"
                onClick={() => setShowHeld(true)}
              >
                Held ({heldCarts.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title="Checkout" size="md">
        <div className="p-2">
          <div className="bg-[var(--field)] border border-[var(--border-strong)] rounded-[14px] p-6 text-center mb-6">
            <div className="text-muted text-[13px] font-semibold uppercase tracking-wider mb-1">Amount Due</div>
            <div className="text-[32px] font-extrabold tracking-tight text-text">
              {formatCurrency(total, sym)}
            </div>
          </div>
          
          <div className="mb-4 text-[13px] font-bold text-text">Payment Method</div>
          <div className="pay-grid mb-6">
            {['cash', 'card', 'upi', 'bank'].map(m => (
              <div key={m} className={cn('pay-opt', paymentMethod === m && 'active')} onClick={() => setPaymentMethod(m as any)}>
                <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center shrink-0">
                  {paymentMethod === m && <div className="w-2 h-2 bg-current rounded-full" />}
                </div>
                <span className="capitalize">{m}</span>
              </div>
            ))}
          </div>

          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <Input
                label="Cash Tendered"
                type="number"
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                placeholder={total.toFixed(2)}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                {[10, 50, 100, 500].map(amt => (
                  <button key={amt} className="chip flex-1 text-center justify-center" onClick={() => handleQuickCash(total + amt)}>
                    +{amt}
                  </button>
                ))}
                <button className="chip flex-1 text-center justify-center" onClick={() => handleQuickCash(total)}>
                  Exact
                </button>
              </div>
              
              {parseFloat(cashAmount) >= total && (
                <div className="mt-4 p-4 rounded-xl bg-success-bg border border-success/30 flex justify-between items-center text-success">
                  <span className="font-semibold text-sm">Change Due</span>
                  <span className="text-xl font-bold tabular-nums">
                    {formatCurrency(parseFloat(cashAmount) - total, sym)}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button variant="primary" size="lg" className="w-full text-[15px]" onClick={handleCheckout}>
            Complete Payment
          </Button>
        </div>
      </Modal>

      {/* Held Carts Modal */}
      <Modal open={showHeld} onClose={() => setShowHeld(false)} title="Held Orders" size="md">
        {heldCarts.length === 0 ? (
          <EmptyState icon="pause" title="No held orders" description="Use F8 to hold an order for later." />
        ) : (
          <div className="flex flex-col gap-2">
            {heldCarts.map((h) => {
              const cust = customers.find(c => c.id === h.customerId);
              const items = h.items.reduce((sum, i) => sum + i.quantity, 0);
              const val = h.items.reduce((sum, i) => sum + i.quantity * i.product.sellingPrice, 0);
              return (
                <div key={h.id} className="m-card flex-row !items-center !justify-between">
                  <div>
                    <div className="font-bold text-[13.5px] text-text">
                      {cust ? cust.name : 'Walk-in Customer'}
                    </div>
                    <div className="text-muted text-[12px] mt-0.5">
                      Held at {new Date(h.heldAt).toLocaleTimeString()} • {items} items • {formatCurrency(val, sym)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => deleteHeldCart(h.id)} icon="trash" />
                    <Button variant="primary" size="sm" onClick={() => { restoreHeldCart(h.id); setShowHeld(false); }}>
                      Resume
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Customer Select Modal */}
      <Modal open={showCustomerSelect} onClose={() => setShowCustomerSelect(false)} title="Select Customer" size="md">
        <Input
          placeholder="Search customers..."
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
          icon="search"
          className="mb-4"
          autoFocus
        />
        <div className="max-h-[60vh] overflow-y-auto">
          <div
            className="m-card hover:bg-[var(--hover)]"
            onClick={() => { setCartCustomer(undefined); setShowCustomerSelect(false); }}
          >
            <div className="font-bold text-[14px]">Walk-in Customer</div>
            <div className="text-muted text-xs mt-1">No account linked</div>
          </div>
          {customers
            .filter(c => c.status === 'active' && (c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)))
            .map(c => (
              <div
                key={c.id}
                className="m-card hover:bg-[var(--hover)]"
                onClick={() => { setCartCustomer(c.id); setShowCustomerSelect(false); }}
              >
                <div className="font-bold text-[14px]">{c.name}</div>
                <div className="text-muted text-xs mt-1">{c.phone}</div>
              </div>
          ))}
        </div>
      </Modal>

      {showReceipt && (
        <ReceiptDocument sale={showReceipt} onClose={() => setShowReceipt(null)} />
      )}
    </>
  );
}
