import { PROVIDER } from './_provider';
import * as dummy from './dummy/authService';
import * as api from './api/authService';

const impl = PROVIDER === 'api' ? api : dummy;

export const login = impl.login;
export const register = impl.register;
export const forgotPassword = impl.forgotPassword;
export const resetPassword = impl.resetPassword;
export const changePassword = impl.changePassword;
export const logout = impl.logout;
export const getCurrentUser = impl.getCurrentUser;
