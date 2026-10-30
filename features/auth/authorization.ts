import type { Role } from '@/lib/types';

export function canManageAccounts(role: Role) {
  return role === 'fleet_admin' || role === 'it_superadmin';
}

export function canAssignRole(actor: Role, desired: Role) {
  return actor === 'it_superadmin' || (actor === 'fleet_admin' && desired === 'driver');
}

export function canResetPassword(actor: Role, target: Role, sameAccount: boolean) {
  return !sameAccount && canAssignRole(actor, target);
}

export function canExport(role: Role) {
  return role !== 'driver';
}
