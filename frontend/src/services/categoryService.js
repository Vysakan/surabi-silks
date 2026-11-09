import { PROVIDER } from './_provider';
import * as dummy from './dummy/categoryService';
import * as api from './api/categoryService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getAll = impl.getAll;
export const getBySlug = impl.getBySlug;
export const getTree = impl.getTree;
export const create = impl.create;
export const update = impl.update;
export const remove = impl.remove;
