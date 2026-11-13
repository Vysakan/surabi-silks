import { PROVIDER } from './_provider';
import * as dummy from './dummy/reelService';
import * as api from './api/reelService';

const impl = PROVIDER === 'api' ? api : dummy;

export const getActive = impl.getActive;
export const adminList = impl.adminList;
export const create = impl.create;
export const update = impl.update;
export const remove = impl.remove;
export const uploadVideo = impl.uploadVideo;
export const uploadCover = impl.uploadCover;
