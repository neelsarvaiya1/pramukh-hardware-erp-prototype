import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Product, Customer, Supplier, Sale, Purchase, CartItem, Notification, HeldCart, BusinessSettings, StockMovement } from '../types';
import { products as initialProducts, customers as initialCustomers, suppliers as initialSuppliers, initialSales, initialPurchases, users as initialUsers, initialNotifications, businessSettings as defaultSettings, stockMovements as initialMovements } from '../data/mockData';

interface AppState {
  currentUser: User | null;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  users: User[];
  notifications: Notification[];
  cart: CartItem[];
  heldCarts: HeldCart[];
  selectedCustomerId: string;
  settings: BusinessSettings;
  stockMovements: StockMovement[];
  searchQuery: string;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => boolean;
  logout: () => void;
  toggleTheme: () => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastPurchase' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalProducts' | 'totalPurchases' | 'outstandingAmount' | 'createdAt'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  holdCart: () => void;
  restoreHeldCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;
  setCartCustomer: (customerId: string) => void;
  setCartDiscount: (discount: number) => void;
  completeSale: (paymentMethod: Sale['paymentMethod']) => Sale;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNo' | 'date'>) => void;
  updatePurchaseStatus: (id: string, status: Purchase['status']) => void;
  adjustStock: (productId: string, quantity: number, reason: string) => void;
  addUser: (user: Omit<User, 'id' | 'lastLogin' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (settings: Partial<BusinessSettings>) => void;
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    let savedTheme: 'light' | 'dark' = 'light';
    try {
      const t = localStorage.getItem('bms_theme');
      if (t === 'dark' || t === 'light') savedTheme = t;
    } catch {}

    try {
      const saved = localStorage.getItem('bms_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          searchQuery: '',
          sidebarOpen: false,
          sidebarCollapsed: false,
          theme: parsed.theme || savedTheme,
        };
      }
    } catch {}
    return {
      currentUser: null,
      products: initialProducts,
      customers: initialCustomers,
      suppliers: initialSuppliers,
      sales: initialSales,
      purchases: initialPurchases,
      users: initialUsers,
      notifications: initialNotifications,
      cart: [],
      heldCarts: [],
      selectedCustomerId: '',
      settings: defaultSettings,
      stockMovements: initialMovements,
      searchQuery: '',
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: savedTheme,
    };
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('bms_theme', state.theme);
    } catch {}
  }, [state.theme]);

  useEffect(() => {
    if (state.currentUser) {
      const toSave = { ...state, searchQuery: '', sidebarOpen: false };
      localStorage.setItem('bms_state_v2', JSON.stringify(toSave));
    }
  }, [state]);

  const toggleTheme = useCallback(() => {
    setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean | ((prev: boolean) => boolean)) => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: typeof collapsed === 'function' ? collapsed(prev.sidebarCollapsed) : collapsed,
    }));
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const user = state.users.find(u => u.email === email && u.password === password && u.status === 'active');
    if (user) {
      setState(prev => ({ ...prev, currentUser: { ...user, lastLogin: new Date().toISOString() } }));
      return true;
    }
    return false;
  }, [state.users]);

  const logout = useCallback(() => {
    localStorage.removeItem('bms_state_v2');
    setState(prev => ({ ...prev, currentUser: null, cart: [], heldCarts: [], searchQuery: '' }));
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
      notifications: [{
        id: `n${Date.now()}`,
        type: 'system',
        title: 'Product Added',
        message: `${newProduct.name} has been added to inventory`,
        read: false,
        date: new Date().toISOString(),
        link: '/products',
      }, ...prev.notifications],
    }));
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
    }));
  }, []);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastPurchase' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `c${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      lastPurchase: '',
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
      notifications: [{
        id: `n${Date.now()}`,
        type: 'new_customer' as const,
        title: 'New Customer',
        message: `${newCustomer.name} has been added as a new customer`,
        read: false,
        date: new Date().toISOString(),
        link: '/customers',
      }, ...prev.notifications],
    }));
  }, []);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
    }));
  }, []);

  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'totalProducts' | 'totalPurchases' | 'outstandingAmount' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `s${Date.now()}`,
      totalProducts: 0,
      totalPurchases: 0,
      outstandingAmount: 0,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
  }, []);

  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => {
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...data } : s),
    }));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id),
    }));
  }, []);

  const addToCart = useCallback((product: Product) => {
    setState(prev => {
      const existing = prev.cart.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return {
          ...prev,
          cart: prev.cart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...prev,
        cart: [...prev.cart, { product, quantity: 1, discount: 0 }],
      };
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      cart: quantity <= 0
        ? prev.cart.filter(item => item.product.id !== productId)
        : prev.cart.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
    }));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.product.id !== productId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState(prev => ({ ...prev, cart: [], selectedCustomerId: '' }));
  }, []);

  const holdCart = useCallback(() => {
    setState(prev => {
      if (prev.cart.length === 0) return prev;
      const heldCart: HeldCart = {
        id: `hc${Date.now()}`,
        items: [...prev.cart],
        customerId: prev.selectedCustomerId,
        customerName: prev.customers.find(c => c.id === prev.selectedCustomerId)?.name || 'Walk-in Customer',
        discount: 0,
        heldAt: new Date().toISOString(),
      };
      return { ...prev, heldCarts: [...prev.heldCarts, heldCart], cart: [], selectedCustomerId: '' };
    });
  }, []);

  const restoreHeldCart = useCallback((id: string) => {
    setState(prev => {
      const held = prev.heldCarts.find(h => h.id === id);
      if (!held) return prev;
      return {
        ...prev,
        cart: held.items,
        selectedCustomerId: held.customerId,
        heldCarts: prev.heldCarts.filter(h => h.id !== id),
      };
    });
  }, []);

  const deleteHeldCart = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      heldCarts: prev.heldCarts.filter(h => h.id !== id),
    }));
  }, []);

  const setCartCustomer = useCallback((customerId: string) => {
    setState(prev => ({ ...prev, selectedCustomerId: customerId }));
  }, []);

  const setCartDiscount = useCallback((_discount: number) => {
    // This is handled in the POS component for per-cart discount
  }, []);

  const completeSale = useCallback((paymentMethod: Sale['paymentMethod']): Sale => {
    let completedSale: Sale = {} as Sale;
    setState(prev => {
      const customer = prev.customers.find(c => c.id === prev.selectedCustomerId);
      const subtotal = prev.cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
      const tax = subtotal * (prev.settings.taxRate / 100);
      const total = subtotal + tax;

      const saleItems = prev.cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        discount: item.discount,
        tax: item.product.sellingPrice * item.quantity * (prev.settings.taxRate / 100),
        total: item.product.sellingPrice * item.quantity * (1 + prev.settings.taxRate / 100),
      }));

      completedSale = {
        id: `sale-${Date.now()}`,
        invoiceNo: `${prev.settings.invoicePrefix}-${new Date().getFullYear()}-${String(prev.sales.length + 1).padStart(4, '0')}`,
        customerId: prev.selectedCustomerId || 'walk-in',
        customerName: customer?.name || 'Walk-in Customer',
        items: saleItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: 0,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        paymentMethod,
        status: 'completed',
        date: new Date().toISOString(),
        cashierId: prev.currentUser?.id || '',
        cashierName: prev.currentUser?.name || '',
      };

      const updatedProducts = prev.products.map(p => {
        const cartItem = prev.cart.find(item => item.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.quantity, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      const updatedCustomers = prev.customers.map(c => {
        if (c.id === prev.selectedCustomerId) {
          return {
            ...c,
            totalOrders: c.totalOrders + 1,
            totalSpent: Math.round((c.totalSpent + total) * 100) / 100,
            lastPurchase: new Date().toISOString().split('T')[0],
          };
        }
        return c;
      });

      return {
        ...prev,
        products: updatedProducts,
        sales: [completedSale, ...prev.sales],
        customers: updatedCustomers,
        cart: [],
        selectedCustomerId: '',
        notifications: [{
          id: `n${Date.now()}`,
          type: 'new_sale' as const,
          title: 'New Sale Completed',
          message: `${completedSale.invoiceNo} completed for $${completedSale.total.toFixed(2)}`,
          read: false,
          date: new Date().toISOString(),
          link: '/sales',
        }, ...prev.notifications],
      };
    });
    return completedSale;
  }, []);

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id' | 'purchaseNo' | 'date'>) => {
    setState(prev => {
      const newPurchase: Purchase = {
        ...purchase,
        id: `purchase-${Date.now()}`,
        purchaseNo: `${prev.settings.receiptPrefix.replace('RCP', 'PO')}-${new Date().getFullYear()}-${String(prev.purchases.length + 1).padStart(4, '0')}`,
        date: new Date().toISOString(),
      };

      const updatedProducts = prev.products.map(p => {
        const purchaseItem = purchase.items.find(item => item.productId === p.id);
        if (purchaseItem) {
          return { ...p, stock: p.stock + purchaseItem.quantity, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      return {
        ...prev,
        products: updatedProducts,
        purchases: [newPurchase, ...prev.purchases],
        notifications: [{
          id: `n${Date.now()}`,
          type: 'new_purchase' as const,
          title: 'Purchase Created',
          message: `${newPurchase.purchaseNo} from ${newPurchase.supplierName} - $${newPurchase.total.toFixed(2)}`,
          read: false,
          date: new Date().toISOString(),
          link: '/purchases',
        }, ...prev.notifications],
      };
    });
  }, []);

  const updatePurchaseStatus = useCallback((id: string, status: Purchase['status']) => {
    setState(prev => ({
      ...prev,
      purchases: prev.purchases.map(p => p.id === id ? { ...p, status } : p),
    }));
  }, []);

  const adjustStock = useCallback((productId: string, quantity: number, reason: string) => {
    setState(prev => {
      const product = prev.products.find(p => p.id === productId);
      if (!product) return prev;
      const newStock = product.stock + quantity;
      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        productId,
        productName: product.name,
        type: 'adjustment',
        quantity,
        previousStock: product.stock,
        newStock,
        reference: reason,
        date: new Date().toISOString(),
        performedBy: prev.currentUser?.name || '',
      };
      return {
        ...prev,
        products: prev.products.map(p => p.id === productId ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p),
        stockMovements: [movement, ...prev.stockMovements],
      };
    });
  }, []);

  const addUser = useCallback((user: Omit<User, 'id' | 'lastLogin' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: `u${Date.now()}`,
      lastLogin: '',
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  }, []);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...data } : u),
    }));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<BusinessSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      login, logout, toggleTheme,
      addProduct, updateProduct, deleteProduct,
      addCustomer, updateCustomer, deleteCustomer,
      addSupplier, updateSupplier, deleteSupplier,
      addToCart, updateCartQuantity, removeFromCart, clearCart,
      holdCart, restoreHeldCart, deleteHeldCart,
      setCartCustomer, setCartDiscount,
      completeSale,
      addPurchase, updatePurchaseStatus,
      adjustStock,
      addUser, updateUser, deleteUser,
      markNotificationRead, markAllNotificationsRead,
      updateSettings, setSearchQuery, setSidebarOpen, setSidebarCollapsed,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
