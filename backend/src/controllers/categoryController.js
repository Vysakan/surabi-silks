import { categoryService } from '../services/categoryService.js';

export const categoryController = {
  async getAll(_req, res, next) {
    try {
      const categories = await categoryService.getAll();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const category = await categoryService.getBySlug(req.params.slug);
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async getTree(_req, res, next) {
    try {
      const tree = await categoryService.getTree();
      res.json(tree);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.validated);
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const category = await categoryService.update(parseInt(req.params.id, 10), req.validated);
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await categoryService.remove(parseInt(req.params.id, 10));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
