export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory';
  status: 'active' | 'inactive';
  avatar?: string;
  lastLogin: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  tax: number;
  stock: number;
  minStock: number;
  supplierId: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchase: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalProducts: number;
  totalPurchases: number;
  outstandingAmount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment';
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  date: string;
  cashierId: string;
  cashierName: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
  receivedBy: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference: string;
  date: string;
  performedBy: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'new_sale' | 'new_purchase' | 'new_customer' | 'system' | 'backup';
  title: string;
  message: string;
  read: boolean;
  date: string;
  link?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
}

export interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxLabel: string;
  invoicePrefix: string;
  receiptPrefix: string;
  lowStockThreshold: number;
  dateFormat: string;
}

export interface HeldCart {
  id: string;
  items: CartItem[];
  customerId: string;
  customerName: string;
  discount: number;
  heldAt: string;
}
