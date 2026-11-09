import { PROVIDER } from './_provider';
import * as dummy from './dummy/reviewService';
import * as api from './api/reviewService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getByProductId = impl.getByProductId;
export const create = impl.create;
