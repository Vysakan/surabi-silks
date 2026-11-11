import { apiClient } from './client.js';

/** Accepts { page, limit, sort, filters: { categoryId, subcategoryId, priceMin, priceMax, colors[], fabrics[], occasions[], search } }. */
export async function getAll({ filters, ...params } = {}) {
  const query = { ...params };
  for (const [key, value] of Object.entries(filters || {})) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    query[key] = Array.isArray(value) ? value.join(',') : value;
  }
  const { data } = await apiClient.get('/products', { params: query });
  return data;
}

export async function getById(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
}

export async function getBySlug(slug) {
  const { data } = await apiClient.get(`/products/slug/${slug}`);
  return data;
}

export async function getByCategory(categoryId, subcategoryId) {
  const { data } = await apiClient.get('/products', { params: { categoryId, subcategoryId } });
  return data;
}

export async function search(query) {
  const { data } = await apiClient.get('/products/search', { params: { q: query } });
  return data;
}

export async function getFeatured() {
  const { data } = await apiClient.get('/products/featured');
  return data;
}

export async function getNewArrivals() {
  const { data } = await apiClient.get('/products/new-arrivals');
  return data;
}

export async function getBestsellers() {
  const { data } = await apiClient.get('/products/bestsellers');
  return data;
}

export async function getRelated(productId) {
  const { data } = await apiClient.get(`/products/${productId}/related`);
  return data;
}

export async function create(productData) {
  const { data } = await apiClient.post('/products', toApiProduct(productData));
  await uploadVariantImages(data, productData.variants);
  return data;
}

export async function update(id, productData) {
  const { data } = await apiClient.put(`/products/${id}`, toApiProduct(productData));
  await uploadVariantImages(data, productData.variants);
  return data;
}

const isServerImage = (image) => typeof image === 'string' && /^(https?:\/\/|\/)/i.test(image);
const isNewImage = (image) => typeof image === 'string' && image.startsWith('data:image/');

/** Uploads the images picked in the form (data: URLs). Images already on the server are kept via the payload. */
async function uploadVariantImages(product, sourceVariants = []) {
  for (const [index, variant] of (product.variants || []).entries()) {
    const images = (sourceVariants[index]?.images || []).filter(Boolean);
    for (const [sortOrder, image] of images.entries()) {
      if (!isNewImage(image)) continue;
      const blob = await fetch(image).then((response) => response.blob());
      const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const formData = new FormData();
      formData.append('image', blob, `product-${product.id}-image-${sortOrder}.${extension}`);
      formData.append('variantId', String(variant.id));
      formData.append('sortOrder', String(sortOrder));
      await apiClient.post(`/products/${product.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
  }
}

export async function remove(id) {
  await apiClient.delete(`/products/${id}`);
  return true;
}

function toApiProduct(product) {
  const payload = {
    ...product,
    categoryId: Number(product.categoryId),
    subcategoryId: product.subcategoryId ? Number(product.subcategoryId) : null,
    occasions: product.occasions || product.occasion || [],
    variants: (product.variants || []).map((variant) => ({
      colorName: variant.color?.name ?? variant.colorName ?? '',
      colorHex: variant.color?.hex ?? variant.colorHex ?? '#000000',
      size: variant.size || '',
      design: variant.design || undefined,
      price: Number(variant.price),
      mrp: Number(variant.mrp) > 0 ? Number(variant.mrp) : undefined,
      stock: Number(variant.stock) || 0,
      sku: variant.sku || '',
      images: (variant.images || []).filter(isServerImage),
    })),
  };
  delete payload.occasion;
  // Empty optional text fields come back from the API as null; the API only accepts text or "not sent".
  for (const key of ['description', 'shortDescription', 'fabric', 'weave', 'weight', 'careInstructions']) {
    if (payload[key] == null) delete payload[key];
  }
  return payload;
}
