import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Modal } from '../components/ui';
import { showToast } from '../components/ui';
import { formatCurrency } from '../utils/permissions';
import type { Sale } from '../types';

export default function POS() {
  const { products, customers, cart, heldCarts, selectedCustomerId, settings, addToCart, updateCartQuantity, removeFromCart, clearCart, holdCart, restoreHeldCart, deleteHeldCart, setCartCustomer, completeSale } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  const discountAmount = discount;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * (settings.taxRate / 100);
  const total = taxableAmount + tax;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); setShowCustomerSelect(true); }
      if (e.key === 'F8') { e.preventDefault(); if (cart.length > 0) holdCart(); showToast('info', 'Cart held successfully'); }
      if (e.key === 'F9') { e.preventDefault(); if (cart.length > 0) setShowCheckout(true); }
      if (e.key === 'Escape') { setShowCheckout(false); setShowHeld(false); setShowReceipt(null); setShowCustomerSelect(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length, holdCart]);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashAmount && parseFloat(cashAmount) < total) {
      showToast('error', 'Cash amount is less than total');
      return;
    }
    const sale = completeSale(paymentMethod);
    setShowCheckout(false);
    setShowReceipt(sale);
    setDiscount(0);
    setCashAmount('');
    setPaymentMethod('cash');
    showToast('success', `Sale ${sale.invoiceNo} completed successfully!`);
  }, [cart.length, paymentMethod, cashAmount, total, completeSale]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-4">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product, SKU, or scan barcode... (F2)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => { addToCart(product); showToast('info', `${product.name} added to cart`); }}
              disabled={product.stock === 0}
              className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">{formatCurrency(product.sellingPrice, settings.currencySymbol)}</span>
                <span className={`text-xs ${product.stock <= product.minStock ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {product.stock} left
                </span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 bg-white rounded-xl border border-gray-200 flex flex-col shrink-0">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Cart</h2>
            <div className="flex gap-1.5">
              <button onClick={() => setShowCustomerSelect(true)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors" title="F4">
                {selectedCustomer ? selectedCustomer.name.split(' ')[0] : 'Customer (F4)'}
              </button>
              <button onClick={() => setShowHeld(true)} className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 rounded-md text-amber-700 transition-colors relative" title="F8">
                Held {heldCarts.length > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">{heldCarts.length}</span>}
              </button>
            </div>
          </div>
          {selectedCustomer && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {selectedCustomer.name} • {selectedCustomer.phone}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.product.sellingPrice, settings.currencySymbol)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">−</button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => { if (item.quantity < item.product.stock) updateCartQuantity(item.product.id, item.quantity + 1); }} className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">+</button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">{formatCurrency(item.product.sellingPrice * item.quantity, settings.currencySymbol)}</span>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 items-center">
              <span>Discount</span>
              <input
                type="number"
                value={discount || ''}
                onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-24 text-right text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{settings.taxLabel} ({settings.taxRate}%)</span>
              <span>{formatCurrency(tax, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(total, settings.currencySymbol)}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={holdCart} className="flex-1" size="sm">Hold (F8)</Button>
              <Button variant="ghost" onClick={clearCart} size="sm">Clear</Button>
              <Button onClick={() => setShowCheckout(true)} className="flex-1" size="sm">Checkout (F9)</Button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full opacity-60 hover:opacity-100 transition-opacity z-10">
        <span className="mr-3">F2: Search</span>
        <span className="mr-3">F4: Customer</span>
        <span className="mr-3">F8: Hold</span>
        <span>F9: Checkout</span>
      </div>

      {/* Customer Select Modal */}
      <Modal open={showCustomerSelect} onClose={() => setShowCustomerSelect(false)} title="Select Customer" size="md">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            onChange={() => {}}
          />
          <button
            onClick={() => { setCartCustomer(''); setShowCustomerSelect(false); }}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Walk-in Customer</p>
            <p className="text-xs text-gray-500">No customer selected</p>
          </button>
          {customers.filter(c => c.status === 'active').map(customer => (
            <button
              key={customer.id}
              onClick={() => { setCartCustomer(customer.id); setShowCustomerSelect(false); showToast('info', `Customer: ${customer.name} selected`); }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.email} • {customer.phone}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Held Carts Modal */}
      <Modal open={showHeld} onClose={() => setShowHeld(false)} title="Held Carts" size="md">
        {heldCarts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No held carts</p>
        ) : (
          <div className="space-y-3">
            {heldCarts.map(hc => (
              <div key={hc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{hc.customerName}</p>
                  <p className="text-xs text-gray-500">{hc.items.length} items • {new Date(hc.heldAt).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { restoreHeldCart(hc.id); setShowHeld(false); showToast('success', 'Cart restored'); }}>Restore</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteHeldCart(hc.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title="Complete Sale" size="md">
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Items</span><span>{cart.reduce((s, i) => s + i.quantity, 0)}</span></div>
            <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Subtotal</span><span>{formatCurrency(subtotal, settings.currencySymbol)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Discount</span><span>-{formatCurrency(discount, settings.currencySymbol)}</span></div>}
            <div className="flex justify-between text-sm text-gray-600 mb-2"><span>{settings.taxLabel}</span><span>{formatCurrency(tax, settings.currencySymbol)}</span></div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200"><span>Total</span><span>{formatCurrency(total, settings.currencySymbol)}</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'bank_transfer', 'mobile_payment'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {method === 'cash' && '💵 '}{method === 'card' && '💳 '}{method === 'bank_transfer' && '🏦 '}{method === 'mobile_payment' && '📱 '}
                  {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <Input label="Cash Amount" type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder={`Total: ${formatCurrency(total, settings.currencySymbol)}`} />
              {cashAmount && parseFloat(cashAmount) >= total && (
                <p className="text-sm text-emerald-600 mt-1">Change: {formatCurrency(parseFloat(cashAmount) - total, settings.currencySymbol)}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCheckout(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCheckout} className="flex-1">Complete Sale</Button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal open={!!showReceipt} onClose={() => setShowReceipt(null)} title="Sale Complete" size="sm">
        {showReceipt && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Payment Successful</h3>
              <p className="text-sm text-gray-500">{showReceipt.invoiceNo}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{showReceipt.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Items</span><span>{showReceipt.items.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{showReceipt.paymentMethod.replace('_', ' ')}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200"><span>Total</span><span>{formatCurrency(showReceipt.total, settings.currencySymbol)}</span></div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => showToast('info', 'Print simulated')}>Print</Button>
              <Button variant="secondary" className="flex-1" onClick={() => showToast('info', 'Download simulated')}>Download</Button>
            </div>
            <Button onClick={() => setShowReceipt(null)} className="w-full">Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
