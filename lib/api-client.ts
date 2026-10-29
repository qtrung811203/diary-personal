// Client-side helpers for the per-tab PIN unlock token. sessionStorage is
// per-tab, so a new tab starts locked while the login cookie is still shared.
const TOKEN_KEY = "diary.unlockToken";
export const LOCK_EVENT = "diary:lock";

export function getUnlockToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setUnlockToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the gate falls back to asking for the PIN every load.
  }
}

// Ask the PinGate to show the PIN screen. It drops the token itself once the
// diary has unmounted, so an editor's last autosave can still go out.
export function lockNow() {
  window.dispatchEvent(new Event(LOCK_EVENT));
}

// fetch() that sends the unlock token; a 423 means the server no longer
// accepts it (expired / another account), so lock the screen again.
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getUnlockToken();
  if (token) headers.set("x-unlock-token", token);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 423) lockNow();
  return res;
}
