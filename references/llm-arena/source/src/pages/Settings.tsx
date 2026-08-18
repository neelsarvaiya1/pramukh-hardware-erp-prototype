import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Card, CardHeader, CardTitle, Tabs } from '../components/ui';
import { showToast } from '../components/ui';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState('business');
  const [formData, setFormData] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(formData);
    showToast('success', 'Settings saved successfully');
  };

  const tabs = [
    { id: 'business', label: 'Business Profile' },
    { id: 'invoice', label: 'Invoice & Receipt' },
    { id: 'pos', label: 'POS Settings' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'business' && (
        <Card>
          <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Business Name" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
            <Input label="Email" type="email" value={formData.businessEmail} onChange={e => setFormData({ ...formData, businessEmail: e.target.value })} />
            <Input label="Phone" value={formData.businessPhone} onChange={e => setFormData({ ...formData, businessPhone: e.target.value })} />
            <Input label="Address" value={formData.businessAddress} onChange={e => setFormData({ ...formData, businessAddress: e.target.value })} />
            <Input label="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            <Input label="Country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
          </div>
        </Card>
      )}

      {activeTab === 'invoice' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Currency & Tax</CardTitle></CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Currency Code" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} placeholder="USD" />
              <Input label="Currency Symbol" value={formData.currencySymbol} onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })} placeholder="$" />
              <Input label="Tax Label" value={formData.taxLabel} onChange={e => setFormData({ ...formData, taxLabel: e.target.value })} placeholder="Tax" />
              <Input label="Tax Rate (%)" type="number" step="0.01" value={String(formData.taxRate)} onChange={e => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })} />
              <Input label="Date Format" value={formData.dateFormat} onChange={e => setFormData({ ...formData, dateFormat: e.target.value })} placeholder="MM/DD/YYYY" />
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Invoice & Receipt Prefix</CardTitle></CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Invoice Prefix" value={formData.invoicePrefix} onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })} placeholder="INV" />
              <Input label="Receipt Prefix" value={formData.receiptPrefix} onChange={e => setFormData({ ...formData, receiptPrefix: e.target.value })} placeholder="RCP" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Invoice numbers will be generated as: {formData.invoicePrefix}-YYYY-0001</p>
          </Card>
        </div>
      )}

      {activeTab === 'pos' && (
        <Card>
          <CardHeader><CardTitle>POS Configuration</CardTitle></CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Low Stock Threshold" type="number" value={String(formData.lowStockThreshold)} onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Search Products</span><kbd className="px-2 py-0.5 bg-white border rounded text-xs font-mono">F2</kbd></div>
              <div className="flex justify-between"><span>Select Customer</span><kbd className="px-2 py-0.5 bg-white border rounded text-xs font-mono">F4</kbd></div>
              <div className="flex justify-between"><span>Hold Cart</span><kbd className="px-2 py-0.5 bg-white border rounded text-xs font-mono">F8</kbd></div>
              <div className="flex justify-between"><span>Checkout</span><kbd className="px-2 py-0.5 bg-white border rounded text-xs font-mono">F9</kbd></div>
              <div className="flex justify-between"><span>Close/Cancel</span><kbd className="px-2 py-0.5 bg-white border rounded text-xs font-mono">Esc</kbd></div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <div className="space-y-4">
            {[
              { label: 'Low Stock Alerts', desc: 'Get notified when products fall below minimum stock level', enabled: true },
              { label: 'New Sale Notifications', desc: 'Receive notifications for each completed sale', enabled: true },
              { label: 'Purchase Notifications', desc: 'Get notified when purchases are created or received', enabled: true },
              { label: 'New Customer Alerts', desc: 'Receive notifications when new customers are added', enabled: false },
              { label: 'System Notifications', desc: 'Important system updates and maintenance notices', enabled: true },
              { label: 'Backup Status', desc: 'Get notified about backup completion status', enabled: true },
            ].map((notif, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{notif.label}</p>
                  <p className="text-xs text-gray-500">{notif.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Change Password</h4>
              <p className="text-xs text-gray-500 mb-3">Update your account password</p>
              <div className="space-y-3 max-w-md">
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <Input label="New Password" type="password" placeholder="Enter new password" />
                <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
                <Button size="sm" onClick={() => showToast('info', 'Password change simulated')}>Update Password</Button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Two-Factor Authentication</h4>
              <p className="text-xs text-gray-500 mb-3">Add an extra layer of security to your account</p>
              <Button variant="secondary" size="sm" onClick={() => showToast('info', '2FA setup simulated')}>Enable 2FA</Button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Data Backup</h4>
              <p className="text-xs text-gray-500 mb-3">Create a backup of all your business data</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => showToast('success', 'Backup created successfully (simulated)')}>Create Backup</Button>
                <Button variant="ghost" size="sm" onClick={() => showToast('info', 'Restore simulated')}>Restore Backup</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
