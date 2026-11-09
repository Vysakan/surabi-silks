import { PROVIDER } from './_provider';
import * as dummy from './dummy/cartService';
import * as api from './api/cartService';

const impl = PROVIDER === 'api' ? api : dummy;

export const get = impl.get;
export const addItem = impl.addItem;
export const updateQuantity = impl.updateQuantity;
export const removeItem = impl.removeItem;
export const clear = impl.clear;
