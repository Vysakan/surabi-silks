import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';
import * as categoryService from '@/services/categoryService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await categoryService.getAll();
      setCategories(data);
      setLoading(false);
    }
    load();
  }, []);

  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.isNew) {
      const created = await categoryService.create(editing);
      setCategories([...categories, created]);
    } else {
      const updated = await categoryService.update(editing.id, editing);
      setCategories(categories.map((c) => c.id === updated.id ? updated : c));
    }
    setEditing(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await categoryService.remove(deleteId);
      setCategories(categories.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Categories</h1>
        <Button onClick={() => setEditing({ isNew: true, name: '', slug: '', description: '', subcategories: [] })}>
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category list */}
        <div className="bg-white border border-neutral-100 rounded-xl p-5">
          <div className="space-y-1">
            {categories.map((cat) => (
              <div key={cat.id}>
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors',
                    editing?.id === cat.id && 'bg-primary-50'
                  )}
                >
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {cat.subcategories.length > 0 ? (
                      expandedIds.has(cat.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : <div className="w-4" />}
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-neutral-400 ml-2">{cat.subcategories.length} sub</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing({ ...cat })} className="p-1.5 hover:bg-neutral-100 rounded-lg">
                      <Edit size={14} className="text-neutral-400" />
                    </button>
                    <button onClick={() => setDeleteId(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} className="text-neutral-400" />
                    </button>
                  </div>
                </div>

                {expandedIds.has(cat.id) && cat.subcategories.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between pl-10 pr-3 py-2 text-sm text-neutral-600">
                    <span>{sub.name}</span>
                    <span className="text-xs text-neutral-400">{sub.slug}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white border border-neutral-100 rounded-xl p-5">
            <h2 className="font-semibold mb-4">{editing.isNew ? 'Add Category' : 'Edit Category'}</h2>
            <div className="space-y-4">
              <Input
                label="Name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <Input
                label="Slug"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
              <Textarea
                label="Description"
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
              />
              <div className="flex gap-3">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure? Products in this category won't be deleted but will become uncategorized."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
