import type { Product, Customer, Supplier, Sale, Purchase, User, Notification, StockMovement, Role, BusinessSettings, SaleItem, PurchaseItem } from '../types';

export const businessSettings: BusinessSettings = {
  businessName: 'Pramukh Hardware ERP',
  businessEmail: 'info@pramukhhardware.co.ke',
  businessPhone: '+254 (0) 712 345 678',
  businessAddress: 'Moi Street, CBD',
  city: 'Eldoret',
  country: 'Kenya',
  currency: 'KES',
  currencySymbol: 'KES',
  taxRate: 16,
  taxLabel: 'VAT',
  invoicePrefix: 'INV',
  receiptPrefix: 'RCP',
  lowStockThreshold: 10,
  dateFormat: 'DD/MM/YYYY',
};

export const users: User[] = [
  { id: 'u1', name: 'John Anderson', email: 'admin@demo.com', password: 'admin123', role: 'admin', status: 'active', lastLogin: '2024-01-15T09:30:00', createdAt: '2023-01-01' },
  { id: 'u2', name: 'Sarah Mitchell', email: 'manager@demo.com', password: 'manager123', role: 'manager', status: 'active', lastLogin: '2024-01-15T10:15:00', createdAt: '2023-02-15' },
  { id: 'u3', name: 'Emily Chen', email: 'cashier@demo.com', password: 'cashier123', role: 'cashier', status: 'active', lastLogin: '2024-01-15T08:00:00', createdAt: '2023-03-10' },
  { id: 'u4', name: 'Marcus Johnson', email: 'inventory@demo.com', password: 'inventory123', role: 'inventory', status: 'active', lastLogin: '2024-01-14T14:00:00', createdAt: '2023-04-05' },
  { id: 'u5', name: 'Rachel Kim', email: 'rachel@demo.com', password: 'pass123', role: 'cashier', status: 'active', lastLogin: '2024-01-13T16:45:00', createdAt: '2023-05-20' },
  { id: 'u6', name: 'David Torres', email: 'david@demo.com', password: 'pass123', role: 'manager', status: 'active', lastLogin: '2024-01-12T11:30:00', createdAt: '2023-06-15' },
  { id: 'u7', name: 'Lisa Patel', email: 'lisa@demo.com', password: 'pass123', role: 'inventory', status: 'active', lastLogin: '2024-01-11T09:00:00', createdAt: '2023-07-20' },
  { id: 'u8', name: 'James Wilson', email: 'james@demo.com', password: 'pass123', role: 'cashier', status: 'inactive', lastLogin: '2024-01-05T13:00:00', createdAt: '2023-08-10' },
  { id: 'u9', name: 'Nina Rodriguez', email: 'nina@demo.com', password: 'pass123', role: 'manager', status: 'active', lastLogin: '2024-01-14T10:00:00', createdAt: '2023-09-01' },
  { id: 'u10', name: 'Tom Baker', email: 'tom@demo.com', password: 'pass123', role: 'cashier', status: 'active', lastLogin: '2024-01-15T07:45:00', createdAt: '2023-10-15' },
];

export const products: Product[] = [
  { id: 'p1', name: 'Cement - Simba 50kg', sku: 'CEM-001', barcode: '8901234560001', category: 'Construction', brand: 'Simba', description: 'Portland cement 50kg bag', costPrice: 650, sellingPrice: 750, tax: 16, stock: 145, minStock: 20, supplierId: 's1', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p2', name: 'Iron Sheets - Gauge 30', sku: 'ISH-002', barcode: '8901234560002', category: 'Construction', brand: 'Royal', description: 'Corrugated iron sheets 2m', costPrice: 800, sellingPrice: 950, tax: 16, stock: 320, minStock: 50, supplierId: 's1', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-08' },
  { id: 'p3', name: 'PVC Pipe 1 inch (per piece)', sku: 'PVC-003', barcode: '8901234560003', category: 'Plumbing', brand: 'TopTank', description: 'Heavy duty PVC pipe', costPrice: 350, sellingPrice: 450, tax: 16, stock: 78, minStock: 15, supplierId: 's1', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-12' },
  { id: 'p4', name: 'Water Tank 5000L', sku: 'TNK-004', barcode: '8901234560004', category: 'Plumbing', brand: 'Kiboko', description: 'Plastic water tank 5000L', costPrice: 28000, sellingPrice: 32000, tax: 16, stock: 20, minStock: 5, supplierId: 's1', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-05' },
  { id: 'p5', name: 'Electrical Cable 1.5mm Twin', sku: 'CBL-005', barcode: '8901234560005', category: 'Electrical', brand: 'EastAfrican', description: '1.5mm twin with earth cable 90m', costPrice: 4500, sellingPrice: 5500, tax: 16, stock: 92, minStock: 15, supplierId: 's1', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-11' },
  { id: 'p6', name: 'LED Bulb 9W', sku: 'LED-006', barcode: '8901234560006', category: 'Electrical', brand: 'Philips', description: 'Energy saving LED bulb B22', costPrice: 150, sellingPrice: 250, tax: 16, stock: 65, minStock: 10, supplierId: 's1', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p7', name: 'Gloss Paint - White 4L', sku: 'PNT-007', barcode: '8901234560007', category: 'Paint', brand: 'Crown', description: 'Premium gloss white paint 4L', costPrice: 2200, sellingPrice: 2800, tax: 16, stock: 8, minStock: 20, supplierId: 's2', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-13' },
  { id: 'p8', name: 'Undercoat Paint 4L', sku: 'PNT-008', barcode: '8901234560008', category: 'Paint', brand: 'Crown', description: 'Universal undercoat 4L', costPrice: 1800, sellingPrice: 2300, tax: 16, stock: 55, minStock: 15, supplierId: 's2', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-14' },
  { id: 'p9', name: 'Claw Hammer', sku: 'HMR-009', barcode: '8901234560009', category: 'Tools', brand: 'Stanley', description: 'Steel claw hammer', costPrice: 450, sellingPrice: 650, tax: 16, stock: 180, minStock: 30, supplierId: 's2', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p10', name: 'Measuring Tape 5m', sku: 'MTP-010', barcode: '8901234560010', category: 'Tools', brand: 'Stanley', description: 'Retractable measuring tape 5m', costPrice: 300, sellingPrice: 450, tax: 16, stock: 120, minStock: 25, supplierId: 's2', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
];

export const customers: Customer[] = [
  { id: 'c1', name: 'Michael Brown', email: 'michael.b@email.com', phone: '+1 (555) 201-1001', address: '45 Oak Avenue', city: 'New York', totalOrders: 23, totalSpent: 1845.50, lastPurchase: '2024-01-15', status: 'active', createdAt: '2023-03-10' },
  { id: 'c2', name: 'Jennifer Davis', email: 'jennifer.d@email.com', phone: '+1 (555) 201-1002', address: '78 Pine Street', city: 'Brooklyn', totalOrders: 18, totalSpent: 1230.75, lastPurchase: '2024-01-14', status: 'active', createdAt: '2023-04-05' },
  { id: 'c3', name: 'Robert Garcia', email: 'robert.g@email.com', phone: '+1 (555) 201-1003', address: '12 Maple Drive', city: 'Manhattan', totalOrders: 31, totalSpent: 2890.25, lastPurchase: '2024-01-15', status: 'active', createdAt: '2023-02-20' },
  { id: 'c4', name: 'Amanda Martinez', email: 'amanda.m@email.com', phone: '+1 (555) 201-1004', address: '90 Elm Court', city: 'Queens', totalOrders: 12, totalSpent: 875.00, lastPurchase: '2024-01-12', status: 'active', createdAt: '2023-05-15' },
  { id: 'c5', name: 'Christopher Lee', email: 'chris.l@email.com', phone: '+1 (555) 201-1005', address: '33 Cedar Lane', city: 'New York', totalOrders: 45, totalSpent: 4250.80, lastPurchase: '2024-01-15', status: 'active', createdAt: '2023-01-08' },
  { id: 'c6', name: 'Stephanie White', email: 'steph.w@email.com', phone: '+1 (555) 201-1006', address: '56 Birch Road', city: 'Bronx', totalOrders: 8, totalSpent: 520.30, lastPurchase: '2024-01-10', status: 'active', createdAt: '2023-06-22' },
  { id: 'c7', name: 'Daniel Harris', email: 'daniel.h@email.com', phone: '+1 (555) 201-1007', address: '21 Walnut Street', city: 'Brooklyn', totalOrders: 15, totalSpent: 1100.45, lastPurchase: '2024-01-13', status: 'active', createdAt: '2023-04-18' },
  { id: 'c8', name: 'Laura Thompson', email: 'laura.t@email.com', phone: '+1 (555) 201-1008', address: '67 Spruce Avenue', city: 'Manhattan', totalOrders: 27, totalSpent: 2150.60, lastPurchase: '2024-01-14', status: 'active', createdAt: '2023-03-25' },
  { id: 'c9', name: 'Kevin Robinson', email: 'kevin.r@email.com', phone: '+1 (555) 201-1009', address: '84 Ash Court', city: 'Queens', totalOrders: 6, totalSpent: 380.90, lastPurchase: '2024-01-08', status: 'active', createdAt: '2023-07-10' },
  { id: 'c10', name: 'Michelle Clark', email: 'michelle.c@email.com', phone: '+1 (555) 201-1010', address: '15 Willow Lane', city: 'Staten Island', totalOrders: 19, totalSpent: 1620.35, lastPurchase: '2024-01-11', status: 'active', createdAt: '2023-05-02' },
  { id: 'c11', name: 'Andrew Lewis', email: 'andrew.l@email.com', phone: '+1 (555) 201-1011', address: '42 Poplar Drive', city: 'New York', totalOrders: 10, totalSpent: 695.20, lastPurchase: '2024-01-09', status: 'active', createdAt: '2023-08-14' },
  { id: 'c12', name: 'Nicole Walker', email: 'nicole.w@email.com', phone: '+1 (555) 201-1012', address: '98 Chestnut Road', city: 'Brooklyn', totalOrders: 33, totalSpent: 3100.45, lastPurchase: '2024-01-15', status: 'active', createdAt: '2023-02-05' },
  { id: 'c13', name: 'Ryan Hall', email: 'ryan.h@email.com', phone: '+1 (555) 201-1013', address: '27 Sycamore Street', city: 'Manhattan', totalOrders: 14, totalSpent: 980.75, lastPurchase: '2024-01-07', status: 'active', createdAt: '2023-06-30' },
  { id: 'c14', name: 'Samantha Young', email: 'sam.y@email.com', phone: '+1 (555) 201-1014', address: '53 Hickory Avenue', city: 'Queens', totalOrders: 21, totalSpent: 1750.30, lastPurchase: '2024-01-13', status: 'active', createdAt: '2023-04-22' },
  { id: 'c15', name: 'Brandon King', email: 'brandon.k@email.com', phone: '+1 (555) 201-1015', address: '76 Magnolia Court', city: 'Bronx', totalOrders: 9, totalSpent: 540.80, lastPurchase: '2024-01-06', status: 'active', createdAt: '2023-09-08' },
  { id: 'c16', name: 'Olivia Wright', email: 'olivia.w@email.com', phone: '+1 (555) 201-1016', address: '31 Dogwood Lane', city: 'New York', totalOrders: 16, totalSpent: 1280.90, lastPurchase: '2024-01-12', status: 'active', createdAt: '2023-05-28' },
  { id: 'c17', name: 'Justin Lopez', email: 'justin.l@email.com', phone: '+1 (555) 201-1017', address: '88 Juniper Road', city: 'Staten Island', totalOrders: 7, totalSpent: 425.60, lastPurchase: '2024-01-05', status: 'active', createdAt: '2023-10-12' },
  { id: 'c18', name: 'Hannah Scott', email: 'hannah.s@email.com', phone: '+1 (555) 201-1018', address: '19 Redwood Drive', city: 'Brooklyn', totalOrders: 25, totalSpent: 2340.15, lastPurchase: '2024-01-14', status: 'active', createdAt: '2023-03-18' },
  { id: 'c19', name: 'Tyler Green', email: 'tyler.g@email.com', phone: '+1 (555) 201-1019', address: '64 Cypress Street', city: 'Manhattan', totalOrders: 11, totalSpent: 790.45, lastPurchase: '2024-01-10', status: 'active', createdAt: '2023-07-25' },
  { id: 'c20', name: 'Megan Adams', email: 'megan.a@email.com', phone: '+1 (555) 201-1020', address: '47 Fir Avenue', city: 'Queens', totalOrders: 29, totalSpent: 2680.90, lastPurchase: '2024-01-15', status: 'active', createdAt: '2023-02-14' },
  { id: 'c21', name: 'Jason Nelson', email: 'jason.n@email.com', phone: '+1 (555) 201-1021', address: '82 Hemlock Court', city: 'Bronx', totalOrders: 5, totalSpent: 310.25, lastPurchase: '2024-01-04', status: 'inactive', createdAt: '2023-11-05' },
  { id: 'c22', name: 'Kayla Baker', email: 'kayla.b@email.com', phone: '+1 (555) 201-1022', address: '36 Linden Lane', city: 'New York', totalOrders: 17, totalSpent: 1395.80, lastPurchase: '2024-01-11', status: 'active', createdAt: '2023-05-10' },
];

export const suppliers: Supplier[] = [
  { id: 's1', name: 'TechSource International', contactPerson: 'Alan Chen', email: 'orders@techsource.com', phone: '+1 (555) 301-2001', address: '500 Technology Parkway', city: 'San Jose', totalProducts: 15, totalPurchases: 48500, outstandingAmount: 3200, status: 'active', createdAt: '2023-01-15' },
  { id: 's2', name: 'Global Foods Distribution', contactPerson: 'Maria Santos', email: 'supply@globalfoods.com', phone: '+1 (555) 301-2002', address: '200 Market Street', city: 'Chicago', totalProducts: 12, totalPurchases: 32400, outstandingAmount: 1500, status: 'active', createdAt: '2023-01-20' },
  { id: 's3', name: 'Fashion Forward Wholesale', contactPerson: 'James Park', email: 'wholesale@fashionfw.com', phone: '+1 (555) 301-2003', address: '75 Fashion Avenue', city: 'New York', totalProducts: 8, totalPurchases: 28900, outstandingAmount: 4800, status: 'active', createdAt: '2023-02-01' },
  { id: 's4', name: 'HomeStyle Imports', contactPerson: 'Susan Miller', email: 'orders@homestyle.com', phone: '+1 (555) 301-2004', address: '320 Commerce Blvd', city: 'Los Angeles', totalProducts: 10, totalPurchases: 22100, outstandingAmount: 2100, status: 'active', createdAt: '2023-02-15' },
  { id: 's5', name: 'ProSupply Commercial', contactPerson: 'David Lee', email: 'sales@prosupply.com', phone: '+1 (555) 301-2005', address: '180 Industrial Way', city: 'Houston', totalProducts: 12, totalPurchases: 19800, outstandingAmount: 800, status: 'active', createdAt: '2023-03-01' },
  { id: 's6', name: 'Metro Office Solutions', contactPerson: 'Karen White', email: 'supply@metrooffice.com', phone: '+1 (555) 301-2006', address: '95 Business Park Road', city: 'Dallas', totalProducts: 6, totalPurchases: 12500, outstandingAmount: 0, status: 'active', createdAt: '2023-03-15' },
  { id: 's7', name: 'Pacific Health Supplies', contactPerson: 'Tom Nguyen', email: 'orders@pacifichealth.com', phone: '+1 (555) 301-2007', address: '410 Wellness Drive', city: 'Seattle', totalProducts: 4, totalPurchases: 8900, outstandingAmount: 650, status: 'active', createdAt: '2023-04-01' },
  { id: 's8', name: 'EastWest Trading Co', contactPerson: 'Lisa Chang', email: 'trade@eastwest.com', phone: '+1 (555) 301-2008', address: '600 Harbor Street', city: 'San Francisco', totalProducts: 5, totalPurchases: 15200, outstandingAmount: 2400, status: 'active', createdAt: '2023-04-15' },
  { id: 's9', name: 'Summit Sports Wholesale', contactPerson: 'Mark Johnson', email: 'wholesale@summitsports.com', phone: '+1 (555) 301-2009', address: '150 Athletic Circle', city: 'Denver', totalProducts: 3, totalPurchases: 6800, outstandingAmount: 0, status: 'active', createdAt: '2023-05-01' },
  { id: 's10', name: 'Pinnacle Paper Products', contactPerson: 'Rachel Green', email: 'orders@pinnaclepaper.com', phone: '+1 (555) 301-2010', address: '275 Print Lane', city: 'Atlanta', totalProducts: 4, totalPurchases: 5400, outstandingAmount: 350, status: 'inactive', createdAt: '2023-05-15' },
];

const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const paymentMethods: Sale['paymentMethod'][] = ['cash', 'mobile_payment', 'bank_transfer'];
  const statuses: Sale['status'][] = ['completed', 'completed', 'completed', 'completed', 'pending'];
  
  for (let i = 1; i <= 55; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items: SaleItem[] = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const discount = Math.random() > 0.7 ? Math.round(product.sellingPrice * 0.1 * 100) / 100 : 0;
      const itemTotal = (product.sellingPrice * qty) - (discount * qty);
      subtotal += itemTotal;
      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice: product.sellingPrice,
        discount: discount * qty,
        tax: Math.round(itemTotal * 0.1 * 100) / 100,
        total: Math.round(itemTotal * 1.1 * 100) / 100,
      });
    }
    
    const discount = Math.random() > 0.8 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const tax = Math.round((subtotal - discount) * 0.1 * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;
    
    const day = String(Math.floor(Math.random() * 15) + 1).padStart(2, '0');
    const user = users.filter(u => u.role === 'cashier')[Math.floor(Math.random() * 3)];
    
    sales.push({
      id: `sale-${i}`,
      invoiceNo: `INV-2024-${String(i).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      tax,
      total,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date: `2024-01-${day}T${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      cashierId: user.id,
      cashierName: user.name,
    });
  }
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const generatePurchases = (): Purchase[] => {
  const purchases: Purchase[] = [];
  const statuses: Purchase['status'][] = ['completed', 'completed', 'completed', 'pending'];
  
  for (let i = 1; i <= 35; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items: PurchaseItem[] = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = (Math.floor(Math.random() * 10) + 1) * 5;
      const itemTotal = product.costPrice * qty;
      subtotal += itemTotal;
      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitCost: product.costPrice,
        tax: Math.round(itemTotal * 0.1 * 100) / 100,
        total: Math.round(itemTotal * 1.1 * 100) / 100,
      });
    }
    
    const tax = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const day = String(Math.floor(Math.random() * 15) + 1).padStart(2, '0');
    
    purchases.push({
      id: `purchase-${i}`,
      purchaseNo: `PO-2024-${String(i).padStart(4, '0')}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date: `2024-01-${day}T${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      receivedBy: users[Math.floor(Math.random() * users.length)].name,
    });
  }
  return purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const initialSales = generateSales();
export const initialPurchases = generatePurchases();

export const stockMovements: StockMovement[] = [
  ...initialSales.slice(0, 10).flatMap((sale, idx) => 
    sale.items.map((item, j) => ({
      id: `sm-sale-${idx}-${j}`,
      productId: item.productId,
      productName: item.productName,
      type: 'sale' as const,
      quantity: -item.quantity,
      previousStock: 100,
      newStock: 100 - item.quantity,
      reference: sale.invoiceNo,
      date: sale.date,
      performedBy: sale.cashierName,
    }))
  ),
  ...initialPurchases.slice(0, 5).flatMap((purchase, idx) =>
    purchase.items.map((item, j) => ({
      id: `sm-purchase-${idx}-${j}`,
      productId: item.productId,
      productName: item.productName,
      type: 'purchase' as const,
      quantity: item.quantity,
      previousStock: 50,
      newStock: 50 + item.quantity,
      reference: purchase.purchaseNo,
      date: purchase.date,
      performedBy: purchase.receivedBy,
    }))
  ),
];

export const initialNotifications: Notification[] = [
  { id: 'n1', type: 'low_stock', title: 'Low Stock Alert', message: 'Portable Power Bank 20000mAh has only 8 units remaining', read: false, date: '2024-01-15T09:30:00', link: '/inventory' },
  { id: 'n2', type: 'low_stock', title: 'Low Stock Alert', message: 'Women\'s Running Shoes has only 5 units remaining', read: false, date: '2024-01-15T09:15:00', link: '/inventory' },
  { id: 'n3', type: 'new_sale', title: 'New Sale Completed', message: 'INV-2024-0001 completed for $485.50', read: false, date: '2024-01-15T08:45:00', link: '/sales' },
  { id: 'n4', type: 'new_purchase', title: 'Purchase Received', message: 'PO-2024-0003 from TechSource International received', read: true, date: '2024-01-14T16:30:00', link: '/purchases' },
  { id: 'n5', type: 'new_customer', title: 'New Customer', message: 'Megan Adams has been added as a new customer', read: true, date: '2024-01-14T14:20:00', link: '/customers' },
  { id: 'n6', type: 'system', title: 'System Update', message: 'System maintenance completed successfully', read: true, date: '2024-01-14T06:00:00' },
  { id: 'n7', type: 'backup', title: 'Backup Completed', message: 'Daily backup completed successfully at 02:00 AM', read: true, date: '2024-01-14T02:00:00' },
  { id: 'n8', type: 'low_stock', title: 'Out of Stock', message: 'Desk Fan USB Rechargeable is out of stock', read: false, date: '2024-01-15T10:00:00', link: '/inventory' },
  { id: 'n9', type: 'low_stock', title: 'Low Stock Alert', message: 'Canvas Backpack has only 3 units remaining', read: false, date: '2024-01-15T08:00:00', link: '/inventory' },
  { id: 'n10', type: 'new_sale', title: 'New Sale Completed', message: 'INV-2024-0015 completed for $1,245.00', read: true, date: '2024-01-14T17:30:00', link: '/sales' },
];

export const roles: Role[] = [
  {
    id: 'r1', name: 'Admin', description: 'Full system access',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      pos: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: true },
      inventory: { view: true, create: true, edit: true, delete: true },
      sales: { view: true, create: true, edit: true, delete: true },
      purchases: { view: true, create: true, edit: true, delete: true },
      customers: { view: true, create: true, edit: true, delete: true },
      suppliers: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
    }
  },
  {
    id: 'r2', name: 'Manager', description: 'Operational modules and reports',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: false },
      pos: { view: true, create: true, edit: true, delete: false },
      products: { view: true, create: true, edit: true, delete: false },
      inventory: { view: true, create: true, edit: true, delete: false },
      sales: { view: true, create: true, edit: true, delete: false },
      purchases: { view: true, create: true, edit: true, delete: false },
      customers: { view: true, create: true, edit: true, delete: false },
      suppliers: { view: true, create: true, edit: true, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    }
  },
  {
    id: 'r3', name: 'Cashier', description: 'POS, Sales, and Customers',
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      pos: { view: true, create: true, edit: true, delete: false },
      products: { view: true, create: false, edit: false, delete: false },
      inventory: { view: false, create: false, edit: false, delete: false },
      sales: { view: true, create: false, edit: false, delete: false },
      purchases: { view: false, create: false, edit: false, delete: false },
      customers: { view: true, create: true, edit: true, delete: false },
      suppliers: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    }
  },
  {
    id: 'r4', name: 'Inventory Staff', description: 'Products, Inventory, and Purchases',
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      pos: { view: false, create: false, edit: false, delete: false },
      products: { view: true, create: true, edit: true, delete: false },
      inventory: { view: true, create: true, edit: true, delete: false },
      sales: { view: false, create: false, edit: false, delete: false },
      purchases: { view: true, create: true, edit: true, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      suppliers: { view: true, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    }
  },
];
