import { PROVIDER } from './_provider';
import * as dummy from './dummy/wishlistService';
import * as api from './api/wishlistService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getAll = impl.getAll;
export const add = impl.add;
export const remove = impl.remove;
