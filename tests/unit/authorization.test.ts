import { describe, expect, it } from 'vitest';
import {
  canAssignRole,
  canExport,
  canManageAccounts,
  canResetPassword,
} from '@/features/auth/authorization';
import type { Role } from '@/lib/types';

const roles: Role[] = ['driver', 'fleet_admin', 'management', 'it_superadmin'];

describe('Autorización de cuentas', () => {
  it('limita la administración de cuentas a Flota e IT', () => {
    expect(roles.filter(canManageAccounts)).toEqual(['fleet_admin', 'it_superadmin']);
  });

  it('permite a Flota crear y restablecer únicamente conductores', () => {
    expect(canAssignRole('fleet_admin', 'driver')).toBe(true);
    expect(canResetPassword('fleet_admin', 'driver', false)).toBe(true);
    for (const role of ['fleet_admin', 'management', 'it_superadmin'] satisfies Role[]) {
      expect(canAssignRole('fleet_admin', role)).toBe(false);
      expect(canResetPassword('fleet_admin', role, false)).toBe(false);
    }
  });

  it('permite a IT administrar roles, excepto restablecer su propia cuenta', () => {
    for (const role of roles) expect(canAssignRole('it_superadmin', role)).toBe(true);
    expect(canResetPassword('it_superadmin', 'it_superadmin', true)).toBe(false);
    expect(canResetPassword('it_superadmin', 'it_superadmin', false)).toBe(true);
  });

  it('mantiene a Conductor y Gerencia fuera de la administración', () => {
    for (const actor of ['driver', 'management'] satisfies Role[])
      for (const role of roles) {
        expect(canAssignRole(actor, role)).toBe(false);
        expect(canResetPassword(actor, role, false)).toBe(false);
      }
  });
});

describe('Autorización de exportación', () => {
  it('permite exportar a los tres roles observadores y no al conductor', () => {
    expect(roles.filter(canExport)).toEqual(['fleet_admin', 'management', 'it_superadmin']);
  });
});
