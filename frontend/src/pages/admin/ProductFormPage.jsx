import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { Link } from 'react-router';
import * as productService from '@/services/productService';
import * as categoryService from '@/services/categoryService';
import { slugify } from '@/lib/formatters';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SmartImage from '@/components/ui/SmartImage';
import { useUIStore } from '@/stores/useUIStore';

const EMPTY_VARIANT = {
  color: { name: '', hex: '#000000' },
  size: '',
  design: '',
  price: '',
  mrp: '',
  stock: '',
  sku: '',
  images: [''],
};

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', slug: '', categoryId: '', subcategoryId: '',
    description: '', shortDescription: '', fabric: '', weave: '',
    weight: '', careInstructions: '', sellingUnit: 'piece', basePrice: '',
    tags: '', occasion: '',
    isFeatured: false, isNewArrival: false, isBestseller: false,
    variants: [{ ...EMPTY_VARIANT }],
  });

  useEffect(() => {
    async function load() {
      const cats = await categoryService.getAll();
      setCategories(cats);
      if (isEdit) {
        const product = await productService.getById(id);
        if (product) {
          setForm({
            ...product,
            tags: product.tags?.join(', ') || '',
            occasion: product.occasion?.join(', ') || '',
            basePrice: product.basePrice || '',
          });
        }
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  const updateField = (field, value) => setForm({ ...form, [field]: value });

  const updateVariant = (index, field, value) => {
    const variants = [...form.variants];
    if (field === 'colorName') {
      variants[index] = { ...variants[index], color: { ...variants[index].color, name: value } };
    } else if (field === 'colorHex') {
      variants[index] = { ...variants[index], color: { ...variants[index].color, hex: value } };
    } else {
      variants[index] = { ...variants[index], [field]: value };
    }
    setForm({ ...form, variants });
  };

  const addVariant = () => {
    setForm({ ...form, variants: [...form.variants, { ...EMPTY_VARIANT, images: [''] }] });
  };

  const removeVariant = (index) => {
    if (form.variants.length <= 1) return;
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

  const handleImageUpload = (variantIndex, files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const updated = [...form.variants];
        updated[variantIndex] = {
          ...updated[variantIndex],
          images: [...updated[variantIndex].images.filter(Boolean), e.target.result],
        };
        setForm((prev) => ({ ...prev, variants: updated }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (variantIndex, imageIndex) => {
    const variants = [...form.variants];
    variants[variantIndex] = {
      ...variants[variantIndex],
      images: variants[variantIndex].images.filter((_, i) => i !== imageIndex),
    };
    setForm({ ...form, variants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      basePrice: Number(form.basePrice) || 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      occasion: form.occasion.split(',').map((t) => t.trim()).filter(Boolean),
      variants: form.variants.map((v, i) => ({
        ...v,
        id: v.id || `var-new-${Date.now()}-${i}`,
        price: Number(v.price) || 0,
        mrp: Number(v.mrp) || 0,
        stock: Number(v.stock) || 0,
        images: v.images?.filter(Boolean) || [],
      })),
    };

    if (isEdit) {
      await productService.update(id, payload);
      addToast({ type: 'success', message: 'Product updated' });
    } else {
      await productService.create(payload);
      addToast({ type: 'success', message: 'Product created' });
    }
    setSaving(false);
    navigate('/admin/products');
  };

  if (loading) return <LoadingSpinner />;

  const selectedCat = categories.find((c) => c.id === form.categoryId);
  const subcategories = selectedCat?.subcategories || [];

  return (
    <div>
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        {/* Basic info */}
        <section className="bg-white border border-neutral-100 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            <Input label="Slug" value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="auto-generated from name" />
            <Select
              label="Category"
              options={[{ value: '', label: 'Select category' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              value={form.categoryId}
              onChange={(e) => updateField('categoryId', e.target.value)}
            />
            <Select
              label="Subcategory"
              options={[{ value: '', label: 'Select subcategory' }, ...subcategories.map((s) => ({ value: s.id, label: s.name }))]}
              value={form.subcategoryId}
              onChange={(e) => updateField('subcategoryId', e.target.value)}
            />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} />
          <Input label="Short Description" value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} />
        </section>

        {/* Textile details */}
        <section className="bg-white border border-neutral-100 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Textile Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Fabric" value={form.fabric} onChange={(e) => updateField('fabric', e.target.value)} />
            <Input label="Weave" value={form.weave} onChange={(e) => updateField('weave', e.target.value)} />
            <Input label="Weight" value={form.weight} onChange={(e) => updateField('weight', e.target.value)} />
            <Select
              label="Selling Unit"
              options={[{ value: 'piece', label: 'Per Piece' }, { value: 'metre', label: 'Per Metre' }]}
              value={form.sellingUnit}
              onChange={(e) => updateField('sellingUnit', e.target.value)}
            />
            <Input label="Base Price (₹)" type="number" value={form.basePrice} onChange={(e) => updateField('basePrice', e.target.value)} />
          </div>
          <Input label="Occasions (comma-separated)" value={form.occasion} onChange={(e) => updateField('occasion', e.target.value)} />
          <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} />
          <Input label="Care Instructions" value={form.careInstructions} onChange={(e) => updateField('careInstructions', e.target.value)} />
          <div className="flex gap-6">
            {[['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestseller', 'Bestseller']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form[key]} onChange={(e) => updateField(key, e.target.checked)} className="accent-primary-500" />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* Variants */}
        <section className="bg-white border border-neutral-100 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Variants ({form.variants.length})</h2>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus size={14} className="mr-1" /> Add Variant
            </Button>
          </div>

          {form.variants.map((variant, i) => (
            <div key={i} className="border border-neutral-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-500">Variant {i + 1}</span>
                {form.variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(i)} className="text-neutral-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Color Name" value={variant.color.name} onChange={(e) => updateVariant(i, 'colorName', e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Color Hex</label>
                  <input
                    type="color"
                    value={variant.color.hex}
                    onChange={(e) => updateVariant(i, 'colorHex', e.target.value)}
                    className="w-full h-10 rounded-lg border border-neutral-200 cursor-pointer"
                  />
                </div>
                <Input label="Size" value={variant.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} />
                <Input label="Design" value={variant.design} onChange={(e) => updateVariant(i, 'design', e.target.value)} />
                <Input label="Price (₹)" type="number" value={variant.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                <Input label="MRP (₹)" type="number" value={variant.mrp} onChange={(e) => updateVariant(i, 'mrp', e.target.value)} />
                <Input label="Stock" type="number" value={variant.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} />
                <Input label="SKU" value={variant.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} />
              </div>
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Images</label>
                <div className="flex flex-wrap gap-3">
                  {variant.images.filter(Boolean).map((img, imgIdx) => (
                    <div key={imgIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 group">
                      <SmartImage src={img} alt="" containerClassName="w-full h-full" className="w-full h-full" />
                      <button
                        type="button"
                        onClick={() => removeImage(i, imgIdx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={16} className="text-neutral-400" />
                    <span className="text-xs text-neutral-400 mt-1">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(i, e.target.files)}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <Button type="submit" isLoading={saving} size="lg">{isEdit ? 'Update Product' : 'Create Product'}</Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/admin/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
