const STORAGE_KEY = 'ansut-cockpit-uid';

let _cachedId: string | null = null;

/**
 * Returns a stable, random user ID stored in localStorage.
 * Each browser/device gets its own unique ID, so DnD card orders
 * are independent per user.
 */
export function getUserId(): string {
  if (_cachedId) return _cachedId;
  if (typeof window === 'undefined') return '_ssr';

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = 'u_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    localStorage.setItem(STORAGE_KEY, id);
  }
  _cachedId = id;
  return id;
}