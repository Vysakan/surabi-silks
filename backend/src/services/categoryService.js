import { categoryRepository } from '../repositories/categoryRepository.js';
import { NotFoundError, ConflictError } from '../utils/AppError.js';

export const categoryService = {
  async getAll() {
    return categoryRepository.findAll();
  },

  async getBySlug(slug) {
    const cat = await categoryRepository.findBySlug(slug);
    if (!cat) throw new NotFoundError('Category');
    return cat;
  },

  async getTree() {
    return categoryRepository.findTree();
  },

  async create(data) {
    return categoryRepository.create(data);
  },

  async update(id, data) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category');
    return categoryRepository.update(id, data);
  },

  async remove(id) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category');
    await categoryRepository.remove(id);
  },
};
