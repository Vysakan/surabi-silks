import { PROVIDER } from './_provider';
import * as dummy from './dummy/contactService';
import * as api from './api/contactService';

const impl = PROVIDER === 'api' ? api : dummy;

export const submitEnquiry = impl.submitEnquiry;
