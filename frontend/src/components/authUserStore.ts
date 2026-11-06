import { useSyncExternalStore } from "react";
import { getAccessToken, clearAccessToken } from "../api/config";

const USERNAME_KEY = "majakka.username";

type AuthUser = { username: string } | null;

// Hydrate from localStorage on load: if we have both a token and a stored
// username, consider the user logged in.
function loadUser(): AuthUser {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  const username = window.localStorage.getItem(USERNAME_KEY);
  return token && username ? { username } : null;
}

let user: AuthUser = loadUser();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Call after a successful login to persist the session. */
export function loginUser(username: string) {
  window.localStorage.setItem(USERNAME_KEY, username);
  user = { username };
  notify();
}

/** Clear the session (token + username) and notify subscribers. */
export function logoutUser() {
  clearAccessToken();
  window.localStorage.removeItem(USERNAME_KEY);
  user = null;
  notify();
}

/** React hook – returns `{ username }` or `null`. */
export function useAuthUser(): AuthUser {
  return useSyncExternalStore(
    subscribe,
    () => user,
    () => null,
  );
}
