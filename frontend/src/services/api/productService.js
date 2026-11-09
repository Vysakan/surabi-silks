import { apiClient } from './client.js';

export async function getAll(params) {
  const { data } = await apiClient.get('/products', { params });
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

async function uploadVariantImages(product, sourceVariants = []) {
  for (const [index, variant] of (product.variants || []).entries()) {
    const images = sourceVariants[index]?.images || [];
    for (const [sortOrder, image] of images.entries()) {
      if (!image || (!image.startsWith('data:image/') && !image.startsWith('/'))) continue;
      const blob = await fetch(image).then((response) => response.blob());
      const formData = new FormData();
      formData.append('image', blob, `product-${product.id}-image-${sortOrder}.jpg`);
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
    subcategoryId: product.subcategoryId ? Number(product.subcategoryId) : undefined,
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
    })),
  };
  delete payload.occasion;
  return payload;
}
