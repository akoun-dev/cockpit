const STORAGE_KEY = 'ansut-cockpit-uid';

let _cachedId: string | null = null;

/**
 * Returns a stable user ID.
 * - If the user is authenticated (session available), uses the server-side user ID.
 * - Otherwise, falls back to a random client-side UUID stored in localStorage.
 */
export function getUserId(): string {
  if (_cachedId) return _cachedId;
  if (typeof window === 'undefined') return '_ssr';

  // Try to get authenticated user ID from the page data
  try {
    const script = document.getElementById('__NEXT_DATA__');
    if (script?.textContent) {
      const data = JSON.parse(script.textContent);
      const session = data?.props?.pageProps?.session;
      if (session?.user?.id) {
        const uid: string = session.user.id;
        _cachedId = uid;
        return uid;
      }
    }
  } catch { /* ignore */ }

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = 'u_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    localStorage.setItem(STORAGE_KEY, id);
  }
  _cachedId = id;
  return id;
}

/**
 * Override the cached user ID with the authenticated session ID.
 * Call this after login/session hydration.
 */
export function setUserId(id: string): void {
  _cachedId = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, id);
  }
}
