import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, SearchInput, ConfirmDialog, Icon, showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';
import { cn } from '../utils/cn';
import StatementDocument from '../components/documents/StatementDocument';
import { generateDemoStatement } from '../utils/statementData';

export default function Customers() {
  const { customers, sales, settings, currentUser, addCustomer, updateCustomer, deleteCustomer } = useApp();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showStatement, setShowStatement] = useState<{ entity: any, data: any } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
  });

  const canCreate = hasPermission(currentUser!, 'customers', 'create');
  const canEdit = hasPermission(currentUser!, 'customers', 'edit');
  const canDelete = hasPermission(currentUser!, 'customers', 'delete');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(search)
    );
  }, [customers, search]);

  const openForm = (id?: string) => {
    if (id) {
      const c = customers.find(cu => cu.id === id)!;
      setEditId(id);
      setFormData({
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address || '',
        city: c.city || '',
        status: c.status,
      });
    } else {
      setEditId(null);
      setFormData({ name: '', email: '', phone: '', address: '', city: '', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('error', 'Please provide a customer name and phone number');
      return;
    }
    if (editId) {
      updateCustomer(editId, formData);
      showToast('success', 'Customer record updated');
    } else {
      addCustomer(formData);
      showToast('success', 'New customer registered');
    }
    setShowForm(false);
  };

  const detail = viewId ? customers.find(c => c.id === viewId) : null;
  const customerSales = detail
    ? sales.filter(s => s.customerId === detail.id && s.status === 'completed').slice(0, 10)
    : [];

  return (
    <div className="page-anim">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-sub">
            {customers.length} client accounts • Track client orders, store credit & contact details
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" icon="plus" onClick={() => openForm()}>
            Add Customer
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by customer name, phone, or email..."
            className="flex-1 max-w-md"
          />
        </div>

        {/* Desktop Table */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Location</th>
                <th className="num">Orders</th>
                <th className="num">Total Spent</th>
                <th>Last Active</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const initials = (c.name || '?')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={c.id} className="hover:bg-hover">
                    <td>
                      <div className="tile-row">
                        <div className="avatar">{initials}</div>
                        <div>
                          <div className="cell-main">{c.name}</div>
                          <div className="cell-sub">{c.email || 'No email provided'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-muted">{c.phone || '-'}</td>
                    <td className="text-muted text-xs">{c.city || c.address || '-'}</td>
                    <td className="num font-semibold text-muted">{c.totalOrders || 0}</td>
                    <td className="num font-extrabold text-accent-text">
                      {formatCurrency(c.totalSpent, settings.currencySymbol)}
                    </td>
                    <td className="text-muted text-xs">
                      {c.lastPurchase ? formatDate(c.lastPurchase) : 'No orders'}
                    </td>
                    <td>
                      <Badge variant={c.status === 'active' ? 'success' : 'default'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button
                          onClick={() => setViewId(c.id)}
                          className="icon-btn sm"
                          title="View Profile"
                        >
                          <Icon name="eye" size={15} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openForm(c.id)}
                            className="icon-btn sm text-accent-text"
                            title="Edit"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(c.id)}
                            className="icon-btn sm text-danger"
                            title="Delete"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="cards-list">
          {filtered.map(c => (
            <div
              key={c.id}
              className="m-card"
              onClick={() => setViewId(c.id)}
            >
              <div className="mc-top">
                <div className="cell-main">{c.name}</div>
                <Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status}</Badge>
              </div>
              <div className="mc-sub">
                <span>{c.phone}</span>
                <span className="font-bold text-accent-text">
                  Spent: {formatCurrency(c.totalSpent, settings.currencySymbol)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="users" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No customers found</p>
            <p className="text-xs text-muted">Try a different search query or add a new customer.</p>
          </div>
        )}
      </Card>

      {/* Add / Edit Customer Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Edit Customer Record' : 'Register New Customer'}
        subtitle="Manage customer contact and billing information"
        size="md"
      >
        <form onSubmit={handleSubmit} className="page-anim">
          <div className="form-row">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe / Apex Builders"
            />
            <Input
              label="Phone Number"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 019-2831"
            />
          </div>

          <div className="form-row">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@company.com"
            />
            <Input
              label="City / Region"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. New York, NY"
            />
          </div>

          <Input
            label="Street Address / Delivery Note"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot 44, Construction Site 2"
          />

          <Select
            label="Account Status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            options={[
              { value: 'active', label: 'Active (Allowed in POS)' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editId ? 'Save Changes' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile Modal */}
      <Modal
        open={!!detail}
        onClose={() => setViewId(null)}
        title="Customer Profile"
        subtitle={detail?.name}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              if (detail) {
                const statementData = generateDemoStatement(detail.totalSpent || 50000, true);
                setShowStatement({ entity: detail, data: statementData });
              }
            }}>
              <Icon name="printer" size={16} className="mr-1" />
              Print Statement
            </Button>
            <Button variant="ghost" onClick={() => setViewId(null)}>
              Close
            </Button>
            {canEdit && detail && (
              <Button
                variant="primary"
                icon="edit"
                onClick={() => {
                  const id = detail.id;
                  setViewId(null);
                  openForm(id);
                }}
              >
                Edit Profile
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="page-anim">
            <div className="grid kpis">
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Phone</span>
                <span className="font-semibold font-mono">{detail.phone}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Email</span>
                <span className="font-semibold truncate block">{detail.email || '-'}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Completed Orders</span>
                <span className="font-bold text-base">{detail.totalOrders || 0}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Total Spent</span>
                <span className="font-extrabold text-accent-text text-base">
                  {formatCurrency(detail.totalSpent, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted uppercase mb-2">Purchase History</div>
              {customerSales.length === 0 ? (
                <div className="p-6 text-center text-muted text-xs border border-border rounded-xl">
                  No purchases recorded yet for this client.
                </div>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th className="num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSales.map(s => (
                        <tr key={s.id}>
                          <td className="font-semibold text-accent-text">{s.invoiceNo}</td>
                          <td className="text-muted text-xs">{formatDate(s.date)}</td>
                          <td className="text-muted text-xs">{s.items.length} items</td>
                          <td className="num font-bold text-text">
                            {formatCurrency(s.total, settings.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteCustomer(confirmDelete);
            showToast('success', 'Customer deleted');
          }
        }}
        title="Delete Customer"
        message="Are you sure? This customer record will be deleted from your directory."
        confirmText="Delete"
        variant="danger"
      />

      {showStatement && (
        <StatementDocument
          type="customer"
          entityName={showStatement.entity.name}
          entityAddress={showStatement.entity.address || showStatement.entity.city || 'Eldoret, Kenya'}
          transactions={showStatement.data.transactions}
          startDate={showStatement.data.startDate}
          endDate={showStatement.data.endDate}
          currentBalance={showStatement.data.currentBalance}
          onClose={() => setShowStatement(null)}
        />
      )}
    </div>
  );
}
