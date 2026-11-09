import { PROVIDER } from './_provider';
import * as dummy from './dummy/orderService';
import * as api from './api/orderService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getAll = impl.getAll;
export const getById = impl.getById;
export const getByCustomerId = impl.getByCustomerId;
export const create = impl.create;
export const updateStatus = impl.updateStatus;
