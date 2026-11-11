import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Edit, Plus, Trash2, Upload, X } from 'lucide-react';
import * as categoryService from '@/services/categoryService';
import { refreshCategoryTree } from '@/hooks/useCategoryTree';
import { useUIStore } from '@/stores/useUIStore';
import { getErrorMessage, getFieldErrors } from '@/lib/apiError';
import { toSlug, isValidSlug } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SmartImage from '@/components/ui/SmartImage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_IMAGE_MB = 5;

// Numeric ids from the API, text ids in demo mode.
const toId = (value) => (value === '' || value == null ? null : Number.isNaN(Number(value)) ? value : Number(value));

function emptyForm(parent) {
  return {
    id: null,
    name: '',
    slug: '',
    description: '',
    parentId: parent ? String(parent.id) : '',
    sortOrder: 0,
    image: '',
    hasChildren: false,
  };
}

function Thumb({ src, size = 'md' }) {
  const box = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  if (!src) {
    return (
      <div className={cn(box, 'rounded-lg bg-red-50 text-red-400 flex items-center justify-center shrink-0')} title="No image yet">
        <AlertCircle size={size === 'sm' ? 14 : 16} />
      </div>
    );
  }
  return <SmartImage src={src} alt="" containerClassName={cn(box, 'rounded-lg overflow-hidden shrink-0')} className="w-full h-full" />;
}

export default function CategoryManagementPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    try {
      setCategories(await refreshCategoryTree());
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not load the categories.') });
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { reload(); }, [reload]);

  // Free the local preview URL when it is replaced or the page closes.
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const openForm = (form, isNew) => {
    setEditing(form);
    setSlugTouched(!isNew);
    setImageFile(null);
    setImagePreview('');
    setErrors({});
  };

  const startNew = (parent = null) => {
    if (parent) setExpandedIds(new Set(expandedIds).add(parent.id));
    openForm(emptyForm(parent), true);
  };

  const startEdit = (cat) => {
    openForm({
      id: cat.id,
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      sortOrder: cat.sortOrder ?? 0,
      image: cat.image || '',
      hasChildren: (cat.subcategories || []).length > 0,
    }, false);
  };

  const setField = (field, value) => {
    setEditing((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && prev.id == null && !slugTouched) next.slug = toSlug(value);
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const pickImage = (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'Use a JPG, PNG, WebP or AVIF image' }));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: `The image must be ${MAX_IMAGE_MB} MB or smaller` }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setEditing((prev) => ({ ...prev, image: '' }));
  };

  const validate = () => {
    const e = {};
    if (!editing.name.trim()) e.name = 'Enter a name';
    if (editing.id == null && !isValidSlug(editing.slug)) {
      e.slug = 'Use lowercase letters, numbers and hyphens only (for example "silk-sarees")';
    }
    if (!imageFile && !editing.image) e.image = 'Please upload an image for this category';
    const order = Number(editing.sortOrder);
    if (!Number.isInteger(order) || order < 0) e.sortOrder = 'Use a whole number, 0 or more';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      let image = editing.image;
      if (imageFile) {
        image = await categoryService.uploadImage(imageFile);
        // Keep the uploaded URL so trying again after an error does not upload the file twice.
        setEditing((prev) => ({ ...prev, image }));
        setImageFile(null);
        setImagePreview('');
      }
      const payload = {
        name: editing.name.trim(),
        description: editing.description.trim() || null,
        parentId: toId(editing.parentId),
        sortOrder: Number(editing.sortOrder) || 0,
        image,
      };
      if (editing.id == null) {
        await categoryService.create({ ...payload, slug: editing.slug });
        addToast({ type: 'success', message: `${payload.parentId ? 'Subcategory' : 'Category'} "${payload.name}" created` });
      } else {
        await categoryService.update(editing.id, payload);
        addToast({ type: 'success', message: `"${payload.name}" updated` });
      }
      setEditing(null);
      await reload();
    } catch (error) {
      const fields = getFieldErrors(error);
      setErrors(fields);
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not save the category.') });
    }
    setSaving(false);
  };

  const askDelete = (cat) => {
    const subs = (cat.subcategories || []).length;
    if (subs > 0) {
      addToast({ type: 'error', message: `"${cat.name}" has ${subs} subcategor${subs === 1 ? 'y' : 'ies'}. Delete or move them first.` });
      return;
    }
    setDeleteTarget(cat);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoryService.remove(deleteTarget.id);
      addToast({ type: 'success', message: `"${deleteTarget.name}" deleted` });
      if (editing?.id === deleteTarget.id) setEditing(null);
      await reload();
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not delete the category.') });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (loading) return <LoadingSpinner />;

  const missingImages = categories.reduce(
    (n, c) => n + (c.image ? 0 : 1) + c.subcategories.filter((s) => !s.image).length,
    0
  );
  const parentOptions = categories
    .filter((c) => c.id !== editing?.id)
    .map((c) => ({ value: String(c.id), label: c.name }));
  const shownImage = imagePreview || editing?.image || '';
  const isSub = Boolean(editing?.parentId);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Categories</h1>
          <p className="text-sm text-neutral-500 mt-1">Main categories and their subcategories. Every category needs an image.</p>
        </div>
        <Button onClick={() => startNew()}>
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      {missingImages > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
          {missingImages} {missingImages === 1 ? 'category has' : 'categories have'} no image yet (marked in red). Edit them to add one.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Category tree */}
        <div className="bg-white border border-neutral-100 rounded-xl p-3 sm:p-5">
          {categories.length === 0 && (
            <p className="text-sm text-neutral-500 p-3">No categories yet. Use "Add Category" to create the first one.</p>
          )}
          <div className="space-y-1">
            {categories.map((cat) => {
              const expanded = expandedIds.has(cat.id);
              const subs = cat.subcategories;
              return (
                <div key={cat.id}>
                  <div
                    className={cn(
                      'flex items-center justify-between gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors',
                      editing?.id === cat.id && 'bg-primary-50'
                    )}
                  >
                    <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left">
                      {subs.length > 0 ? (
                        expanded ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />
                      ) : <span className="w-4 shrink-0" />}
                      <Thumb src={cat.image} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">{cat.name}</span>
                        <span className="block text-xs text-neutral-400">
                          {subs.length} {subs.length === 1 ? 'subcategory' : 'subcategories'}
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => startNew(cat)} className="p-1.5 hover:bg-neutral-100 rounded-lg" title={`Add a subcategory to ${cat.name}`}>
                        <Plus size={15} className="text-neutral-500" />
                      </button>
                      <button onClick={() => startEdit(cat)} className="p-1.5 hover:bg-neutral-100 rounded-lg" title="Edit">
                        <Edit size={14} className="text-neutral-500" />
                      </button>
                      <button onClick={() => askDelete(cat)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 size={14} className="text-neutral-500" />
                      </button>
                    </div>
                  </div>

                  {expanded && subs.map((sub) => (
                    <div
                      key={sub.id}
                      className={cn(
                        'flex items-center justify-between gap-2 ml-8 sm:ml-10 pl-2 pr-2 sm:pr-3 py-1.5 rounded-lg hover:bg-neutral-50',
                        editing?.id === sub.id && 'bg-primary-50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Thumb src={sub.image} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-sm text-neutral-700 truncate">{sub.name}</span>
                          <span className="block text-xs text-neutral-400 truncate">{sub.slug}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => startEdit(sub)} className="p-1.5 hover:bg-neutral-100 rounded-lg" title="Edit">
                          <Edit size={14} className="text-neutral-500" />
                        </button>
                        <button onClick={() => askDelete(sub)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 size={14} className="text-neutral-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {expanded && (
                    <button
                      onClick={() => startNew(cat)}
                      className="ml-8 sm:ml-10 mt-0.5 mb-1 px-2 py-1.5 text-xs font-medium text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add subcategory
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add / edit form */}
        {editing && (
          <div className="bg-white border border-neutral-100 rounded-xl p-5 lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">
                {editing.id == null ? (isSub ? 'Add Subcategory' : 'Add Category') : (isSub ? 'Edit Subcategory' : 'Edit Category')}
              </h2>
              <button onClick={() => setEditing(null)} className="p-1 text-neutral-400 hover:text-neutral-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <Select
                label="Parent category"
                placeholder="None - this is a main category"
                options={parentOptions}
                value={editing.parentId}
                onChange={(e) => setField('parentId', e.target.value)}
                disabled={editing.hasChildren}
                error={errors.parentId}
              />
              {editing.hasChildren && (
                <p className="text-xs text-neutral-500 -mt-2">This category has subcategories, so it stays a main category.</p>
              )}
              <Input
                label="Name"
                value={editing.name}
                onChange={(e) => setField('name', e.target.value)}
                error={errors.name}
              />
              <div>
                <Input
                  label="Slug (web address)"
                  value={editing.slug}
                  onChange={(e) => { setSlugTouched(true); setField('slug', e.target.value.toLowerCase()); }}
                  disabled={editing.id != null}
                  error={errors.slug}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {editing.id != null
                    ? 'The slug is part of the page address, so it cannot be changed after creating.'
                    : 'Filled in from the name. Lowercase letters, numbers and hyphens.'}
                </p>
              </div>

              {/* Image (required) */}
              <div>
                <span className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Image <span className="text-red-500">*</span>
                </span>
                <div className="flex items-start gap-4">
                  {shownImage ? (
                    <div className="relative w-32 aspect-[4/3] rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                      <SmartImage src={shownImage} alt="" containerClassName="w-full h-full" className="w-full h-full" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className={cn(
                      'w-32 aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center shrink-0',
                      errors.image ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                    )}>
                      <Upload size={22} className="text-neutral-300" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                      <Upload size={14} /> {shownImage ? 'Replace image' : 'Upload image'}
                      <input
                        type="file"
                        accept={IMAGE_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ''; }}
                      />
                    </label>
                    <p className="text-xs text-neutral-500">JPG, PNG, WebP or AVIF, up to {MAX_IMAGE_MB} MB. A 4:3 landscape photo looks best.</p>
                  </div>
                </div>
                {errors.image && <p className="text-sm text-error mt-1.5">{errors.image}</p>}
              </div>

              <Textarea
                label="Description (optional)"
                value={editing.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={3}
                error={errors.description}
              />
              <Input
                label="Display order"
                type="number"
                min="0"
                value={editing.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
                error={errors.sortOrder}
              />
              <p className="text-xs text-neutral-500 -mt-2">Lower numbers are shown first. Categories with the same number are sorted by name.</p>
              <div className="flex gap-3 pt-1">
                <Button onClick={handleSave} isLoading={saving}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title={deleteTarget?.parentId ? 'Delete Subcategory' : 'Delete Category'}
        message={`Delete "${deleteTarget?.name || ''}"? Its products are not deleted, but they will no longer be in this ${deleteTarget?.parentId ? 'subcategory' : 'category'}.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
