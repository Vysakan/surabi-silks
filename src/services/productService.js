import { PROVIDER } from './_provider';
import * as dummy from './dummy/productService';
import * as api from './api/productService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getAll = impl.getAll;
export const getById = impl.getById;
export const getBySlug = impl.getBySlug;
export const getByCategory = impl.getByCategory;
export const search = impl.search;
export const getFeatured = impl.getFeatured;
export const getNewArrivals = impl.getNewArrivals;
export const getBestsellers = impl.getBestsellers;
export const getRelated = impl.getRelated;
export const create = impl.create;
export const update = impl.update;
export const remove = impl.remove;
