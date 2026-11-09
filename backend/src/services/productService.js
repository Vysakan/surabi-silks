import { productRepository } from '../repositories/productRepository.js';
import { NotFoundError, ConflictError } from '../utils/AppError.js';

export const productService = {
  async getAll(params) {
    return productRepository.findAll(params);
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('Product');
    return product;
  },

  async getBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw new NotFoundError('Product');
    return product;
  },

  async search(query) {
    return productRepository.findAll({ page: 1, limit: 50, filters: { search: query } });
  },

  async getFeatured() {
    return productRepository.findFeatured();
  },

  async getNewArrivals() {
    return productRepository.findNewArrivals();
  },

  async getBestsellers() {
    return productRepository.findBestsellers();
  },

  async getRelated(productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product');
    return productRepository.findRelated(productId, product.categoryId);
  },

  async create(data) {
    const existing = await productRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError('Product slug already exists');
    return productRepository.create(data);
  },

  async update(id, data) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new NotFoundError('Product');
    return productRepository.update(id, data);
  },

  async archive(id) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new NotFoundError('Product');
    await productRepository.archive(id);
  },

  async addImage(productId, variantId, url, sortOrder) {
    return productRepository.addImage(productId, variantId, url, sortOrder);
  },

  async removeImage(imageId) {
    return productRepository.removeImage(imageId);
  },
};
