import { productService } from '../services/productService.js';
import { storage } from '../utils/storage.js';

export const productController = {
  async getAll(req, res, next) {
    try {
      const { page, limit, sort, categoryId, subcategoryId, priceMin, priceMax, colors, fabrics, occasions, search } = req.validated;
      const filters = {};
      if (categoryId) filters.categoryId = categoryId;
      if (subcategoryId) filters.subcategoryId = subcategoryId;
      if (priceMin != null) filters.priceMin = priceMin;
      if (priceMax != null) filters.priceMax = priceMax;
      if (colors) filters.colors = colors;
      if (fabrics) filters.fabrics = fabrics;
      if (occasions) filters.occasions = occasions;
      if (search) filters.search = search;

      const result = await productService.getAll({ page, limit, sort, filters });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.getById(parseInt(req.params.id, 10));
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const product = await productService.getBySlug(req.params.slug);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async search(req, res, next) {
    try {
      const result = await productService.search(req.query.q || '');
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getFeatured(_req, res, next) {
    try {
      const products = await productService.getFeatured();
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async getNewArrivals(_req, res, next) {
    try {
      const products = await productService.getNewArrivals();
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async getBestsellers(_req, res, next) {
    try {
      const products = await productService.getBestsellers();
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async getRelated(req, res, next) {
    try {
      const products = await productService.getRelated(parseInt(req.params.id, 10));
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const product = await productService.create(req.validated);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const product = await productService.update(parseInt(req.params.id, 10), req.validated);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await productService.archive(parseInt(req.params.id, 10));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: { code: 'NO_FILE', message: 'No image uploaded' } });
      }
      const productId = parseInt(req.params.id, 10);
      const variantId = req.body.variantId ? parseInt(req.body.variantId, 10) : null;
      const url = storage.getUrl(req.file.filename);
      const imageId = await productService.addImage(productId, variantId, url, parseInt(req.body.sortOrder || '0', 10));
      res.status(201).json({ id: imageId, url });
    } catch (err) {
      next(err);
    }
  },

  async removeImage(req, res, next) {
    try {
      const url = await productService.removeImage(parseInt(req.params.imageId, 10));
      if (url && url.startsWith('/uploads/')) {
        await storage.remove(url.replace('/uploads/', ''));
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
