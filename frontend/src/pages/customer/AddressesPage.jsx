import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import * as customerService from '@/services/customerService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';

const EMPTY_ADDRESS = { label: '', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

export default function AddressesPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await customerService.getAddresses(user.id);
      setAddresses(data);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    if (editing.id) {
      const updated = await customerService.updateAddress(user.id, editing.id, editing);
      setAddresses(addresses.map((a) => a.id === updated.id ? updated : a));
      addToast({ type: 'success', message: 'Address updated' });
    } else {
      const created = await customerService.addAddress(user.id, editing);
      setAddresses([...addresses, created]);
      addToast({ type: 'success', message: 'Address added' });
    }
    setEditing(null);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await customerService.removeAddress(user.id, deleteId);
      setAddresses(addresses.filter((a) => a.id !== deleteId));
      setDeleteId(null);
      addToast({ type: 'success', message: 'Address removed' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <ScrollReveal as="h1" className="text-2xl font-semibold text-neutral-900">My Addresses</ScrollReveal>
        <Button onClick={() => setEditing({ ...EMPTY_ADDRESS })}>
          <Plus size={16} className="mr-2" /> Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add an address for faster checkout"
          actionLabel="Add Address"
          onAction={() => setEditing({ ...EMPTY_ADDRESS })}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-neutral-100 rounded-xl p-5 relative">
              {addr.isDefault && (
                <span className="absolute top-3 right-3 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">Default</span>
              )}
              <p className="font-medium mb-1">{addr.label || 'Address'}</p>
              <div className="text-sm text-neutral-600 space-y-0.5">
                <p>{addr.fullName}</p>
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{addr.city}, {addr.state} {addr.pincode}</p>
                <p>{addr.phone}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing({ ...addr })} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => setDeleteId(addr.id)} className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Address' : 'Add Address'}>
        {editing && (
          <div className="space-y-4">
            <Input label="Label (e.g. Home, Office)" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            <Input label="Full Name" value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
            <Input label="Phone" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <Input label="Address Line 1" value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} />
            <Input label="Address Line 2" value={editing.line2} onChange={(e) => setEditing({ ...editing, line2: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="City" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              <Input label="State" value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} />
              <Input label="Pincode" value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} className="accent-primary-500" />
              Set as default address
            </label>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} isLoading={saving}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Address"
        message="Are you sure you want to remove this address?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
