export const STAFF_ROLES = ['admin', 'superadmin'];

export const ROLE_LABELS = {
  customer: 'Customer',
  admin: 'Admin',
  superadmin: 'Root admin',
};

/** Admins and the root admin can open the dashboard. */
export function isStaff(user) {
  return STAFF_ROLES.includes(user?.role);
}

/** Only the root admin manages other admin accounts. */
export function isRootAdmin(user) {
  return user?.role === 'superadmin';
}

export function homeFor(user) {
  return isStaff(user) ? '/admin' : '/account';
}
