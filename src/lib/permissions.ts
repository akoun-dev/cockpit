import type { ModuleKey } from '@/lib/store';

export const ALL_MODULES: ModuleKey[] = [
  'accueil',
  'governance',
  'finance',
  'operational',
  'rh',
  'risque',
  'pta',
];

const ADMIN_MODULE = 'admin';

export type AccessLevel = 'none' | 'read' | 'write' | 'admin';

/**
 * Get the list of modules a user has access to based on their permissions.
 */
export function getAccessibleModules(
  permissions: Record<string, string> | undefined
): ModuleKey[] {
  if (!permissions) return [];

  return ALL_MODULES.filter(
    (mod) => permissions[mod] && permissions[mod] !== 'none'
  );
}

/**
 * Check if a user has access to a specific module.
 */
export function hasModuleAccess(
  permissions: Record<string, string> | undefined,
  module: ModuleKey | string
): boolean {
  if (!permissions) return false;
  const access = permissions[module];
  return !!access && access !== 'none';
}

/**
 * Check if a user has admin-level access (can access the admin panel).
 */
export function hasAdminAccess(
  permissions: Record<string, string> | undefined,
  roleLevel: number | undefined
): boolean {
  if (!permissions) return false;
  return permissions[ADMIN_MODULE] === 'admin' || (roleLevel ?? 0) >= 100;
}

/**
 * Check if a user has write access to a specific module.
 */
export function hasWriteAccess(
  permissions: Record<string, string> | undefined,
  module: ModuleKey | string
): boolean {
  if (!permissions) return false;
  const access = permissions[module];
  return access === 'write' || access === 'admin';
}

/**
 * Get the access level for a specific module.
 */
export function getModuleAccess(
  permissions: Record<string, string> | undefined,
  module: ModuleKey | string
): AccessLevel {
  if (!permissions) return 'none';
  const access = permissions[module];
  if (access === 'none' || !access) return 'none';
  if (access === 'read' || access === 'write' || access === 'admin') return access;
  return 'none';
}