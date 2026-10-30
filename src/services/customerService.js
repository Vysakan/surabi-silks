import { PROVIDER } from './_provider';
import * as dummy from './dummy/customerService';
import * as api from './api/customerService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getById = impl.getById;
export const update = impl.update;
export const getAddresses = impl.getAddresses;
export const addAddress = impl.addAddress;
export const updateAddress = impl.updateAddress;
export const removeAddress = impl.removeAddress;
