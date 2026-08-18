import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Card, CardHeader, CardTitle, Tabs, Switch, Icon, showToast } from '../components/ui';

export default function Settings() {
  const { settings, updateSettings, theme, toggleTheme } = useApp();
  const [activeTab, setActiveTab] = useState('business');
  const [formData, setFormData] = useState({ ...settings });

  const [notificationToggles, setNotificationToggles] = useState({
    lowStock: true,
    sales: true,
    purchases: true,
    customers: false,
    security: true,
    backup: true,
  });

  const handleSave = () => {
    updateSettings(formData);
    showToast('success', 'System preferences saved successfully');
  };

  const tabs = [
    { id: 'business', label: 'Business Profile' },
    { id: 'invoice', label: 'Invoices & Taxes' },
    { id: 'pos', label: 'POS Terminal' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security & Backup' },
  ];

  return (
    <div className="page-anim">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">System Settings & Configuration</h1>
          <p className="page-sub">
            Customize business branding, tax regulations, billing formats, and POS options
          </p>
        </div>
        <Button variant="primary" icon="check" onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Business Profile */}
      {activeTab === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle>Business Organization Details</CardTitle>
          </CardHeader>
          <div className="space-y-4 mt-2">
            <div className="form-row">
              <Input
                label="Company / Store Name"
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Pramukh Hardware ERP"
              />
              <Input
                label="Official Email Address"
                type="email"
                value={formData.businessEmail}
                onChange={e => setFormData({ ...formData, businessEmail: e.target.value })}
                placeholder="sales@pramukhardware.com"
              />
            </div>

            <div className="form-row">
              <Input
                label="Store Hotline / Phone"
                value={formData.businessPhone}
                onChange={e => setFormData({ ...formData, businessPhone: e.target.value })}
                placeholder="+1 (555) 019-2831"
              />
              <Input
                label="City / Hub"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Commercial District"
              />
            </div>

            <div className="form-row">
              <Input
                label="Physical Street Address"
                value={formData.businessAddress}
                onChange={e => setFormData({ ...formData, businessAddress: e.target.value })}
                placeholder="Main Commercial Road, Store 12"
              />
              <Input
                label="Country / Region"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Invoices & Taxes */}
      {activeTab === 'invoice' && (
        <div className="page-anim">
          <Card>
            <CardHeader>
              <CardTitle>Currency & Tax Rules</CardTitle>
            </CardHeader>
            <div className="space-y-4 mt-2">
              <div className="form-row">
                <Input
                  label="Currency ISO Code"
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="USD"
                />
                <Input
                  label="Currency Display Symbol"
                  value={formData.currencySymbol}
                  onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                  placeholder="$"
                />
              </div>

              <div className="form-row">
                <Input
                  label="Tax Display Label"
                  value={formData.taxLabel}
                  onChange={e => setFormData({ ...formData, taxLabel: e.target.value })}
                  placeholder="Tax / VAT / GST"
                />
                <Input
                  label="Tax Rate Percentage (%)"
                  type="number"
                  step="0.01"
                  value={String(formData.taxRate)}
                  onChange={e => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  placeholder="10"
                />
              </div>

              <Input
                label="System Date Format"
                value={formData.dateFormat}
                onChange={e => setFormData({ ...formData, dateFormat: e.target.value })}
                placeholder="MM/DD/YYYY"
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice & Receipt Numbering Scheme</CardTitle>
            </CardHeader>
            <div className="space-y-4 mt-2">
              <div className="form-row">
                <Input
                  label="Sales Invoice Prefix"
                  value={formData.invoicePrefix}
                  onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV"
                />
                <Input
                  label="Payment Receipt Prefix"
                  value={formData.receiptPrefix}
                  onChange={e => setFormData({ ...formData, receiptPrefix: e.target.value })}
                  placeholder="RCP"
                />
              </div>
              <p className="text-xs text-muted">
                Invoices format preview: <code>{formData.invoicePrefix}-2026-0042</code>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* POS Terminal */}
      {activeTab === 'pos' && (
        <div className="page-anim">
          <Card>
            <CardHeader>
              <CardTitle>Point of Sale Configuration</CardTitle>
            </CardHeader>
            <div className="space-y-4 mt-2">
              <div className="form-row">
                <Input
                  label="Global Low Stock Alert Level"
                  type="number"
                  value={String(formData.lowStockThreshold)}
                  onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  placeholder="5"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POS Fast Action Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <div className="grid kpis">
              {[
                { label: 'Search Item / Barcode Scan', key: 'F2' },
                { label: 'Select or Switch Customer', key: 'F4' },
                { label: 'Park / Hold Current Order', key: 'F8' },
                { label: 'Trigger Checkout & Payment', key: 'F9' },
                { label: 'Dismiss / Close Any Dialog', key: 'Esc' },
              ].map(k => (
                <div key={k.key} className="flex items-center justify-between p-3 bg-field rounded-xl border border-border">
                  <span className="text-xs font-semibold text-text">{k.label}</span>
                  <kbd className="px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono font-bold text-accent-text shadow-sm">
                    {k.key}
                  </kbd>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Automated Alerts & Notifications</CardTitle>
          </CardHeader>
          <div className="space-y-3 mt-2">
            {[
              { id: 'lowStock', title: 'Low Stock Inventory Warnings', sub: 'Instant alerts when warehouse SKUs drop below safety limit' },
              { id: 'sales', title: 'Sale Finalization Receipts', sub: 'Broadcast notifications on each completed POS checkout' },
              { id: 'purchases', title: 'Procurement PO Confirmations', sub: 'Alert managers upon stock arrival and supplier check-in' },
              { id: 'customers', title: 'New Customer Registrations', sub: 'Notifications when walk-in clients sign up for accounts' },
              { id: 'security', title: 'Security & Access Audits', sub: 'Track new staff logins and privilege alterations' },
              { id: 'backup', title: 'Automated Snapshot Backups', sub: 'Nightly cloud backup completion confirmations' },
            ].map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-field rounded-xl border border-border"
              >
                <div>
                  <div className="font-semibold text-sm text-text">{item.title}</div>
                  <div className="text-xs text-muted mt-0.5">{item.sub}</div>
                </div>
                <Switch
                  checked={(notificationToggles as any)[item.id]}
                  onChange={v => setNotificationToggles({ ...notificationToggles, [item.id]: v })}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Security & Backup */}
      {activeTab === 'security' && (
        <div className="page-anim">
          <Card>
            <CardHeader>
              <CardTitle>Interface Appearance</CardTitle>
            </CardHeader>
            <div className="flex items-center justify-between p-3.5 bg-field rounded-xl border border-border mt-2">
              <div>
                <div className="font-semibold text-sm text-text">Liquid Glass Theme Mode</div>
                <div className="text-xs text-muted mt-0.5">Toggle between Clean Light Surface and Deep Glass Dark</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={theme === 'dark' ? 'sun' : 'moon'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Snapshots & Data Security</CardTitle>
            </CardHeader>
            <div className="space-y-3 mt-2">
              <div className="p-3.5 bg-field rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-text">Manual Database Backup</div>
                  <div className="text-xs text-muted mt-0.5">
                    Export full JSON snapshot containing products, customers, transactions & stock logs.
                  </div>
                </div>
                <Button
                  variant="outline"
                  icon="download"
                  size="sm"
                  onClick={() => showToast('success', 'Database snapshot downloaded successfully')}
                >
                  Create Backup
                </Button>
              </div>

              <div className="p-3.5 bg-field rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-text">Restore from Snapshot</div>
                  <div className="text-xs text-muted mt-0.5">
                    Restore database records from a verified emergency snapshot file.
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showToast('info', 'Restore simulated — select backup archive')}
                >
                  Restore Backup
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
