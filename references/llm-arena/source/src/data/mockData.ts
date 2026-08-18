import type { Product, Customer, Supplier, Sale, Purchase, User, Notification, StockMovement, Role, BusinessSettings, SaleItem, PurchaseItem } from '../types';

export const businessSettings: BusinessSettings = {
  businessName: 'BusinessHub',
  businessEmail: 'info@businesshub.com',
  businessPhone: '+1 (555) 123-4567',
  businessAddress: '123 Commerce Street, Suite 400',
  city: 'New York',
  country: 'United States',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 10,
  taxLabel: 'Tax',
  invoicePrefix: 'INV',
  receiptPrefix: 'RCP',
  lowStockThreshold: 10,
  dateFormat: 'MM/DD/YYYY',
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
  { id: 'p1', name: 'Wireless Bluetooth Headphones', sku: 'WBH-001', barcode: '8901234560001', category: 'Electronics', brand: 'SoundMax', description: 'Premium wireless headphones with noise cancellation', costPrice: 35, sellingPrice: 79.99, tax: 10, stock: 145, minStock: 20, supplierId: 's1', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p2', name: 'USB-C Charging Cable 6ft', sku: 'UCC-002', barcode: '8901234560002', category: 'Electronics', brand: 'TechPro', description: 'Fast charging USB-C cable', costPrice: 3, sellingPrice: 12.99, tax: 10, stock: 320, minStock: 50, supplierId: 's1', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-08' },
  { id: 'p3', name: 'Laptop Stand Adjustable', sku: 'LSA-003', barcode: '8901234560003', category: 'Electronics', brand: 'ErgoWork', description: 'Aluminum adjustable laptop stand', costPrice: 18, sellingPrice: 45.99, tax: 10, stock: 78, minStock: 15, supplierId: 's1', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-12' },
  { id: 'p4', name: 'Wireless Mouse', sku: 'WMS-004', barcode: '8901234560004', category: 'Electronics', brand: 'ClickTech', description: 'Ergonomic wireless mouse with adjustable DPI', costPrice: 8, sellingPrice: 24.99, tax: 10, stock: 200, minStock: 30, supplierId: 's1', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-05' },
  { id: 'p5', name: 'Mechanical Keyboard', sku: 'MKB-005', barcode: '8901234560005', category: 'Electronics', brand: 'KeyForce', description: 'RGB mechanical keyboard with blue switches', costPrice: 28, sellingPrice: 69.99, tax: 10, stock: 92, minStock: 15, supplierId: 's1', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-11' },
  { id: 'p6', name: 'Webcam HD 1080p', sku: 'WCM-006', barcode: '8901234560006', category: 'Electronics', brand: 'ViewSharp', description: 'Full HD webcam with built-in microphone', costPrice: 22, sellingPrice: 49.99, tax: 10, stock: 65, minStock: 10, supplierId: 's1', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p7', name: 'Portable Power Bank 20000mAh', sku: 'PPB-007', barcode: '8901234560007', category: 'Electronics', brand: 'ChargeMax', description: 'High capacity portable charger', costPrice: 15, sellingPrice: 39.99, tax: 10, stock: 8, minStock: 20, supplierId: 's1', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-13' },
  { id: 'p8', name: 'Smart Watch Fitness Tracker', sku: 'SWF-008', barcode: '8901234560008', category: 'Electronics', brand: 'FitBand', description: 'Waterproof fitness tracker with heart rate monitor', costPrice: 25, sellingPrice: 59.99, tax: 10, stock: 55, minStock: 15, supplierId: 's1', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-14' },
  { id: 'p9', name: 'Organic Green Tea 100 Bags', sku: 'OGT-009', barcode: '8901234560009', category: 'Grocery', brand: 'PureLeaf', description: 'Premium organic green tea', costPrice: 4, sellingPrice: 9.99, tax: 5, stock: 180, minStock: 30, supplierId: 's2', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p10', name: 'Extra Virgin Olive Oil 1L', sku: 'EVO-010', barcode: '8901234560010', category: 'Grocery', brand: 'OlivFresh', description: 'Cold-pressed extra virgin olive oil', costPrice: 7, sellingPrice: 14.99, tax: 5, stock: 120, minStock: 25, supplierId: 's2', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p11', name: 'Whole Grain Pasta 500g', sku: 'WGP-011', barcode: '8901234560011', category: 'Grocery', brand: 'GrainGood', description: 'Organic whole grain penne pasta', costPrice: 1.5, sellingPrice: 3.99, tax: 5, stock: 250, minStock: 40, supplierId: 's2', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-12' },
  { id: 'p12', name: 'Raw Honey 500g', sku: 'RH-012', barcode: '8901234560012', category: 'Grocery', brand: 'BeeNature', description: 'Pure raw unfiltered honey', costPrice: 6, sellingPrice: 12.99, tax: 5, stock: 95, minStock: 20, supplierId: 's2', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p13', name: 'Almond Butter 350g', sku: 'AB-013', barcode: '8901234560013', category: 'Grocery', brand: 'NutriSpread', description: 'Creamy roasted almond butter', costPrice: 5, sellingPrice: 11.49, tax: 5, stock: 75, minStock: 15, supplierId: 's2', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-11' },
  { id: 'p14', name: 'Dark Chocolate 85% Cocoa', sku: 'DC-014', barcode: '8901234560014', category: 'Grocery', brand: 'CocoaDelight', description: 'Premium dark chocolate bar', costPrice: 2.5, sellingPrice: 5.99, tax: 5, stock: 160, minStock: 30, supplierId: 's2', status: 'active', createdAt: '2023-08-15', updatedAt: '2024-01-07' },
  { id: 'p15', name: 'Men\'s Cotton T-Shirt', sku: 'MCT-015', barcode: '8901234560015', category: 'Clothing', brand: 'BasicWear', description: '100% cotton crew neck t-shirt', costPrice: 5, sellingPrice: 15.99, tax: 8, stock: 200, minStock: 25, supplierId: 's3', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p16', name: 'Women\'s Running Shoes', sku: 'WRS-016', barcode: '8901234560016', category: 'Clothing', brand: 'StrideMax', description: 'Lightweight breathable running shoes', costPrice: 30, sellingPrice: 74.99, tax: 8, stock: 5, minStock: 15, supplierId: 's3', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-13' },
  { id: 'p17', name: 'Denim Jeans Slim Fit', sku: 'DJS-017', barcode: '8901234560017', category: 'Clothing', brand: 'DenimCraft', description: 'Classic slim fit denim jeans', costPrice: 18, sellingPrice: 49.99, tax: 8, stock: 85, minStock: 15, supplierId: 's3', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-08' },
  { id: 'p18', name: 'Winter Jacket Waterproof', sku: 'WJW-018', barcode: '8901234560018', category: 'Clothing', brand: 'StormShield', description: 'Insulated waterproof winter jacket', costPrice: 45, sellingPrice: 119.99, tax: 8, stock: 35, minStock: 10, supplierId: 's3', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-12' },
  { id: 'p19', name: 'Leather Belt Classic', sku: 'LBC-019', barcode: '8901234560019', category: 'Accessories', brand: 'LeatherCraft', description: 'Genuine leather belt with brass buckle', costPrice: 8, sellingPrice: 24.99, tax: 8, stock: 110, minStock: 20, supplierId: 's3', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p20', name: 'Sunglasses UV Protection', sku: 'SUP-020', barcode: '8901234560020', category: 'Accessories', brand: 'VisionPro', description: 'Polarized sunglasses with UV400 protection', costPrice: 10, sellingPrice: 29.99, tax: 8, stock: 70, minStock: 15, supplierId: 's3', status: 'active', createdAt: '2023-08-15', updatedAt: '2024-01-11' },
  { id: 'p21', name: 'Canvas Backpack', sku: 'CBP-021', barcode: '8901234560021', category: 'Accessories', brand: 'PackRight', description: 'Durable canvas backpack with laptop compartment', costPrice: 15, sellingPrice: 39.99, tax: 8, stock: 3, minStock: 10, supplierId: 's3', status: 'active', createdAt: '2023-09-01', updatedAt: '2024-01-14' },
  { id: 'p22', name: 'Ceramic Coffee Mug Set', sku: 'CCM-022', barcode: '8901234560022', category: 'Home & Kitchen', brand: 'HomeEssence', description: 'Set of 4 ceramic coffee mugs', costPrice: 8, sellingPrice: 22.99, tax: 10, stock: 60, minStock: 10, supplierId: 's4', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p23', name: 'Stainless Steel Water Bottle', sku: 'SSW-023', barcode: '8901234560023', category: 'Home & Kitchen', brand: 'HydroLife', description: '750ml insulated stainless steel bottle', costPrice: 6, sellingPrice: 18.99, tax: 10, stock: 90, minStock: 15, supplierId: 's4', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p24', name: 'Bamboo Cutting Board', sku: 'BCB-024', barcode: '8901234560024', category: 'Home & Kitchen', brand: 'EcoKitchen', description: 'Large bamboo cutting board with juice groove', costPrice: 7, sellingPrice: 19.99, tax: 10, stock: 45, minStock: 10, supplierId: 's4', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-12' },
  { id: 'p25', name: 'LED Desk Lamp', sku: 'LDL-025', barcode: '8901234560025', category: 'Home & Kitchen', brand: 'BrightSpace', description: 'Adjustable LED desk lamp with USB port', costPrice: 14, sellingPrice: 34.99, tax: 10, stock: 40, minStock: 8, supplierId: 's4', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p26', name: 'Aromatherapy Candle Set', sku: 'ACS-026', barcode: '8901234560026', category: 'Home & Kitchen', brand: 'ZenGlow', description: 'Set of 3 soy wax aromatherapy candles', costPrice: 9, sellingPrice: 24.99, tax: 10, stock: 65, minStock: 12, supplierId: 's4', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-11' },
  { id: 'p27', name: 'Yoga Mat Premium', sku: 'YMP-027', barcode: '8901234560027', category: 'Sports', brand: 'FlexFit', description: 'Non-slip premium yoga mat 6mm thick', costPrice: 10, sellingPrice: 29.99, tax: 10, stock: 50, minStock: 10, supplierId: 's5', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p28', name: 'Resistance Bands Set', sku: 'RBS-028', barcode: '8901234560028', category: 'Sports', brand: 'FlexFit', description: 'Set of 5 resistance bands with carry bag', costPrice: 6, sellingPrice: 19.99, tax: 10, stock: 85, minStock: 15, supplierId: 's5', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p29', name: 'Insulated Lunch Box', sku: 'ILB-029', barcode: '8901234560029', category: 'Home & Kitchen', brand: 'FreshPack', description: 'Stainless steel insulated lunch container', costPrice: 8, sellingPrice: 22.99, tax: 10, stock: 70, minStock: 12, supplierId: 's4', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-12' },
  { id: 'p30', name: 'Phone Case Shockproof', sku: 'PCS-030', barcode: '8901234560030', category: 'Accessories', brand: 'ShieldTech', description: 'Military-grade shockproof phone case', costPrice: 3, sellingPrice: 14.99, tax: 10, stock: 200, minStock: 30, supplierId: 's1', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p31', name: 'Bluetooth Speaker Portable', sku: 'BSP-031', barcode: '8901234560031', category: 'Electronics', brand: 'BassWave', description: 'Waterproof portable Bluetooth speaker', costPrice: 20, sellingPrice: 49.99, tax: 10, stock: 55, minStock: 10, supplierId: 's1', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-11' },
  { id: 'p32', name: 'Screen Protector Tempered Glass', sku: 'SPT-032', barcode: '8901234560032', category: 'Accessories', brand: 'ShieldTech', description: 'Tempered glass screen protector 2-pack', costPrice: 1.5, sellingPrice: 9.99, tax: 10, stock: 300, minStock: 50, supplierId: 's1', status: 'active', createdAt: '2023-08-15', updatedAt: '2024-01-07' },
  { id: 'p33', name: 'Multivitamin Gummies 60 Count', sku: 'MVG-033', barcode: '8901234560033', category: 'Health', brand: 'VitaBoost', description: 'Daily multivitamin gummies for adults', costPrice: 5, sellingPrice: 14.99, tax: 5, stock: 100, minStock: 20, supplierId: 's2', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p34', name: 'Protein Powder Vanilla 2lb', sku: 'PPV-034', barcode: '8901234560034', category: 'Health', brand: 'NutriPower', description: 'Whey protein isolate vanilla flavor', costPrice: 18, sellingPrice: 44.99, tax: 5, stock: 40, minStock: 10, supplierId: 's2', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p35', name: 'Hand Sanitizer 500ml', sku: 'HS-035', barcode: '8901234560035', category: 'Health', brand: 'CleanGuard', description: 'Antibacterial hand sanitizer with aloe', costPrice: 2, sellingPrice: 6.99, tax: 5, stock: 200, minStock: 40, supplierId: 's2', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-12' },
  { id: 'p36', name: 'Ballpoint Pen Set 12 Pack', sku: 'BPS-036', barcode: '8901234560036', category: 'Office', brand: 'WriteWell', description: 'Smooth writing ballpoint pens assorted colors', costPrice: 2, sellingPrice: 7.99, tax: 10, stock: 150, minStock: 25, supplierId: 's5', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p37', name: 'Spiral Notebook A4', sku: 'SNA-037', barcode: '8901234560037', category: 'Office', brand: 'WriteWell', description: '200-page spiral notebook ruled', costPrice: 2.5, sellingPrice: 6.99, tax: 10, stock: 180, minStock: 30, supplierId: 's5', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p38', name: 'Desk Organizer Wood', sku: 'DOW-038', barcode: '8901234560038', category: 'Office', brand: 'OrganizeIt', description: 'Multi-compartment wooden desk organizer', costPrice: 12, sellingPrice: 29.99, tax: 10, stock: 35, minStock: 8, supplierId: 's5', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-12' },
  { id: 'p39', name: 'Whiteboard Magnetic 24x36', sku: 'WBM-039', barcode: '8901234560039', category: 'Office', brand: 'BoardPro', description: 'Magnetic dry erase whiteboard with markers', costPrice: 15, sellingPrice: 39.99, tax: 10, stock: 25, minStock: 5, supplierId: 's5', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p40', name: 'Printer Paper A4 500 Sheets', sku: 'PPA-040', barcode: '8901234560040', category: 'Office', brand: 'PaperPlus', description: 'Premium copy paper 80gsm', costPrice: 3, sellingPrice: 8.99, tax: 10, stock: 120, minStock: 20, supplierId: 's5', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-11' },
  { id: 'p41', name: 'Shampoo Organic 400ml', sku: 'SHO-041', barcode: '8901234560041', category: 'Personal Care', brand: 'NatureGlow', description: 'Organic argan oil shampoo', costPrice: 4, sellingPrice: 11.99, tax: 5, stock: 90, minStock: 15, supplierId: 's4', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p42', name: 'Body Lotion Moisturizing 500ml', sku: 'BLM-042', barcode: '8901234560042', category: 'Personal Care', brand: 'NatureGlow', description: 'Deep moisturizing body lotion', costPrice: 3.5, sellingPrice: 9.99, tax: 5, stock: 110, minStock: 20, supplierId: 's4', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p43', name: 'Electric Toothbrush Rechargeable', sku: 'ETR-043', barcode: '8901234560043', category: 'Personal Care', brand: 'SmileBright', description: 'Sonic electric toothbrush with 3 modes', costPrice: 15, sellingPrice: 39.99, tax: 10, stock: 45, minStock: 10, supplierId: 's4', status: 'active', createdAt: '2023-07-01', updatedAt: '2024-01-12' },
  { id: 'p44', name: 'Sunscreen SPF 50 200ml', sku: 'SS50-044', barcode: '8901234560044', category: 'Personal Care', brand: 'SunShield', description: 'Broad spectrum SPF 50 sunscreen', costPrice: 5, sellingPrice: 14.99, tax: 5, stock: 75, minStock: 15, supplierId: 's4', status: 'active', createdAt: '2023-07-15', updatedAt: '2024-01-09' },
  { id: 'p45', name: 'Children\'s Building Blocks 100pc', sku: 'CBB-045', barcode: '8901234560045', category: 'Toys', brand: 'BuildFun', description: 'Colorful interlocking building blocks', costPrice: 8, sellingPrice: 24.99, tax: 10, stock: 55, minStock: 10, supplierId: 's5', status: 'active', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: 'p46', name: 'Jigsaw Puzzle 1000 Pieces', sku: 'JGP-046', barcode: '8901234560046', category: 'Toys', brand: 'PuzzleWorld', description: 'Scenic landscape 1000 piece jigsaw puzzle', costPrice: 6, sellingPrice: 18.99, tax: 10, stock: 40, minStock: 8, supplierId: 's5', status: 'active', createdAt: '2023-06-15', updatedAt: '2024-01-08' },
  { id: 'p47', name: 'Stainless Steel Cookware Set', sku: 'SSC-047', barcode: '8901234560047', category: 'Home & Kitchen', brand: 'CookMaster', description: '10-piece stainless steel cookware set', costPrice: 45, sellingPrice: 129.99, tax: 10, stock: 15, minStock: 5, supplierId: 's4', status: 'active', createdAt: '2023-08-01', updatedAt: '2024-01-11' },
  { id: 'p48', name: 'Travel Adapter Universal', sku: 'TAU-048', barcode: '8901234560048', category: 'Electronics', brand: 'PowerGo', description: 'Universal travel adapter with USB ports', costPrice: 8, sellingPrice: 22.99, tax: 10, stock: 60, minStock: 12, supplierId: 's1', status: 'active', createdAt: '2023-08-15', updatedAt: '2024-01-07' },
  { id: 'p49', name: 'Organic Coffee Beans 1kg', sku: 'OCB-049', barcode: '8901234560049', category: 'Grocery', brand: 'RoastHouse', description: 'Single origin organic coffee beans', costPrice: 10, sellingPrice: 24.99, tax: 5, stock: 70, minStock: 15, supplierId: 's2', status: 'active', createdAt: '2023-09-01', updatedAt: '2024-01-14' },
  { id: 'p50', name: 'Wireless Earbuds', sku: 'WEB-050', barcode: '8901234560050', category: 'Electronics', brand: 'SoundMax', description: 'True wireless earbuds with charging case', costPrice: 18, sellingPrice: 44.99, tax: 10, stock: 95, minStock: 15, supplierId: 's1', status: 'active', createdAt: '2023-09-01', updatedAt: '2024-01-14' },
  { id: 'p51', name: 'Notebook Stand Ventilated', sku: 'NSV-051', barcode: '8901234560051', category: 'Electronics', brand: 'ErgoWork', description: 'Ventilated notebook cooling stand', costPrice: 12, sellingPrice: 32.99, tax: 10, stock: 42, minStock: 8, supplierId: 's1', status: 'active', createdAt: '2023-09-15', updatedAt: '2024-01-13' },
  { id: 'p52', name: 'Dried Fruit Mix 500g', sku: 'DFM-052', barcode: '8901234560052', category: 'Grocery', brand: 'NutriSnack', description: 'Premium mixed dried fruits', costPrice: 5, sellingPrice: 12.99, tax: 5, stock: 88, minStock: 15, supplierId: 's2', status: 'active', createdAt: '2023-10-01', updatedAt: '2024-01-12' },
  { id: 'p53', name: 'Sports Water Bottle 1L', sku: 'SWB-053', barcode: '8901234560053', category: 'Sports', brand: 'FlexFit', description: 'BPA-free sports water bottle', costPrice: 4, sellingPrice: 12.99, tax: 10, stock: 95, minStock: 15, supplierId: 's5', status: 'active', createdAt: '2023-10-01', updatedAt: '2024-01-12' },
  { id: 'p54', name: 'Cotton Bed Sheet Queen', sku: 'CBS-054', barcode: '8901234560054', category: 'Home & Kitchen', brand: 'SleepWell', description: '100% cotton queen bed sheet set', costPrice: 20, sellingPrice: 54.99, tax: 10, stock: 30, minStock: 8, supplierId: 's4', status: 'active', createdAt: '2023-10-15', updatedAt: '2024-01-11' },
  { id: 'p55', name: 'Desk Fan USB Rechargeable', sku: 'DFU-055', barcode: '8901234560055', category: 'Home & Kitchen', brand: 'CoolBreeze', description: 'Portable USB desk fan 3 speed', costPrice: 10, sellingPrice: 27.99, tax: 10, stock: 0, minStock: 10, supplierId: 's4', status: 'active', createdAt: '2023-11-01', updatedAt: '2024-01-15' },
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
  const paymentMethods: Sale['paymentMethod'][] = ['cash', 'card', 'bank_transfer', 'mobile_payment'];
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
