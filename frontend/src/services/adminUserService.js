import { PROVIDER } from './_provider';
import * as dummy from './dummy/adminUserService';
import * as api from './api/adminUserService';

const impl = PROVIDER === 'api' ? api : dummy;

export const list = impl.list;
export const create = impl.create;
export const update = impl.update;
export const sendReset = impl.sendReset;
