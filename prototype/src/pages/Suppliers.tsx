import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select, Badge, Modal, Card, SearchInput, Icon, showToast } from '../components/ui';
import { formatCurrency, formatDate, hasPermission } from '../utils/permissions';
import { cn } from '../utils/cn';
import StatementDocument from '../components/documents/StatementDocument';
import { generateDemoStatement } from '../utils/statementData';

export default function Suppliers() {
  const { suppliers, purchases, products, settings, currentUser, addSupplier, updateSupplier, deleteSupplier } = useApp();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showStatement, setShowStatement] = useState<{ entity: any, data: any } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
  });

  const canCreate = hasPermission(currentUser!, 'suppliers', 'create');
  const canEdit = hasPermission(currentUser!, 'suppliers', 'edit');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter(
      s => s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const openForm = (id?: string) => {
    if (id) {
      const s = suppliers.find(su => su.id === id)!;
      setEditId(id);
      setFormData({
        name: s.name,
        contactPerson: s.contactPerson,
        email: s.email,
        phone: s.phone,
        address: s.address || '',
        city: s.city || '',
        status: s.status,
      });
    } else {
      setEditId(null);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', status: 'active' });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('error', 'Please enter supplier organization name');
      return;
    }
    if (editId) {
      updateSupplier(editId, formData);
      showToast('success', 'Supplier record updated');
    } else {
      addSupplier(formData);
      showToast('success', 'Supplier registered');
    }
    setShowForm(false);
  };

  const detail = viewId ? suppliers.find(s => s.id === viewId) : null;
  const supplierPurchases = detail ? purchases.filter(p => p.supplierId === detail.id).slice(0, 10) : [];
  const supplierProducts = detail ? products.filter(p => p.supplierId === detail.id) : [];

  return (
    <div className="page-anim">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Supplier & Vendor Directory</h1>
          <p className="page-sub">
            {suppliers.length} registered hardware distributors • Procurement records & payables tracking
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" icon="plus" onClick={() => openForm()}>
            Add Supplier
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by company name, contact person, or email..."
            className="flex-1 max-w-md"
          />
        </div>

        {/* Desktop Table */}
        <div className="tbl-wrap desk">
          <table className="tbl">
            <thead>
              <tr>
                <th>Supplier Company</th>
                <th>Contact Representative</th>
                <th>Location</th>
                <th className="num">Supplied SKUs</th>
                <th className="num">Total Purchases</th>
                <th className="num">Outstanding Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const initials = (s.name || '?')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={s.id} className="hover:bg-hover">
                    <td>
                      <div className="tile-row">
                        <div className="tile" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                          {initials}
                        </div>
                        <div>
                          <div className="cell-main">{s.name}</div>
                          <div className="cell-sub">{s.city || 'Wholesale Partner'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-main">{s.contactPerson || '-'}</div>
                      <div className="cell-sub">{s.email || s.phone || '-'}</div>
                    </td>
                    <td className="text-muted text-xs">{s.address || s.city || '-'}</td>
                    <td className="num font-semibold text-muted">{s.totalProducts || 0}</td>
                    <td className="num font-extrabold text-text">
                      {formatCurrency(s.totalPurchases, settings.currencySymbol)}
                    </td>
                    <td className="num font-bold">
                      <span className={s.outstandingAmount > 0 ? 'text-danger' : 'text-success'}>
                        {formatCurrency(s.outstandingAmount, settings.currencySymbol)}
                      </span>
                    </td>
                    <td>
                      <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button
                          onClick={() => setViewId(s.id)}
                          className="icon-btn sm"
                          title="View Details"
                        >
                          <Icon name="eye" size={15} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openForm(s.id)}
                            className="icon-btn sm text-accent-text"
                            title="Edit"
                          >
                            <Icon name="edit" size={15} />
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
          {filtered.map(s => (
            <div
              key={s.id}
              className="m-card"
              onClick={() => setViewId(s.id)}
            >
              <div className="mc-top">
                <div className="cell-main">{s.name}</div>
                <Badge variant={s.status === 'active' ? 'success' : 'default'}>{s.status}</Badge>
              </div>
              <div className="mc-sub">
                <span>{s.contactPerson}</span>
                <span className="font-bold text-text">
                  Purchases: {formatCurrency(s.totalPurchases, settings.currencySymbol)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted">
            <Icon name="building" size={32} className="mx-auto mb-2 text-muted2" />
            <p className="font-semibold text-sm">No suppliers found</p>
            <p className="text-xs text-muted">Try a different search query or register a new vendor.</p>
          </div>
        )}
      </Card>

      {/* Add / Edit Supplier Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Edit Supplier Record' : 'Register Supplier Partner'}
        subtitle="Manage vendor contact info and wholesale credentials"
        size="md"
      >
        <form onSubmit={handleSubmit} className="page-anim">
          <div className="form-row">
            <Input
              label="Supplier / Company Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apex Hardware Supplies"
            />
            <Input
              label="Contact Representative"
              value={formData.contactPerson}
              onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Marcus Doyle"
            />
          </div>

          <div className="form-row">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="orders@supplier.com"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 010-8842"
            />
          </div>

          <div className="form-row">
            <Input
              label="City / Hub"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Chicago, IL"
            />
            <Select
              label="Account Status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              options={[
                { value: 'active', label: 'Active (Available for Purchasing)' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <Input
            label="Warehouse / Delivery Address"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            placeholder="480 Freight Avenue, Suite 2"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editId ? 'Save Changes' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Profile Modal */}
      <Modal
        open={!!detail}
        onClose={() => setViewId(null)}
        title="Supplier Profile"
        subtitle={detail?.name}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              if (detail) {
                const statementData = generateDemoStatement(detail.totalSpent || 80000, false);
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
                Edit Record
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="page-anim">
            <div className="grid kpis">
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Contact Person</span>
                <span className="font-semibold">{detail.contactPerson || '-'}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Email</span>
                <span className="font-semibold truncate block">{detail.email || '-'}</span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Total Purchases</span>
                <span className="font-extrabold text-text text-base">
                  {formatCurrency(detail.totalPurchases, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-field rounded-xl border border-border">
                <span className="text-xs text-muted block">Payables Due</span>
                <span className={cn('font-extrabold text-base', detail.outstandingAmount > 0 ? 'text-danger' : 'text-success')}>
                  {formatCurrency(detail.outstandingAmount, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {supplierProducts.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted uppercase mb-2">Catalog Products Supplied</div>
                <div className="flex flex-wrap gap-1.5">
                  {supplierProducts.map(p => (
                    <span key={p.id} className="badge b-gray text-xs">
                      {p.name} ({p.sku})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-muted uppercase mb-2">Recent Procurement POs</div>
              {supplierPurchases.length === 0 ? (
                <div className="p-6 text-center text-muted text-xs border border-border rounded-xl">
                  No purchase orders recorded yet from this vendor.
                </div>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Purchase #</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="num">PO Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPurchases.map(p => (
                        <tr key={p.id}>
                          <td className="font-semibold text-accent-text">{p.purchaseNo}</td>
                          <td className="text-muted text-xs">{formatDate(p.date)}</td>
                          <td>
                            <Badge variant={p.status === 'completed' ? 'success' : 'warning'}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="num font-bold text-text">
                            {formatCurrency(p.total, settings.currencySymbol)}
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
            deleteSupplier(confirmDelete);
            showToast('success', 'Supplier record deleted');
          }
        }}
        title="Delete Supplier"
        message="Are you sure? This vendor will be deleted from your directory."
        confirmText="Delete"
        variant="danger"
      />

      {showStatement && (
        <StatementDocument
          type="supplier"
          entityName={showStatement.entity.name}
          entityAddress={showStatement.entity.address || showStatement.entity.city || 'Eldoret, Kenya'}
          entityPin={showStatement.entity.taxPin || 'P051998822A'}
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
