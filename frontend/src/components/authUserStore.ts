import { useSyncExternalStore } from "react";
import type { UserResponse } from '../client'
import { getAccessToken, clearAccessToken, setAccessToken } from "../api/config";

const USER_KEY = "majakka.username";

type AuthUser = UserResponse | null

// Hydrate from localStorage on load: if we have both a token and a stored
// username, consider the user logged in.
function loadUser(): AuthUser {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  
  const storedUser = window.localStorage.getItem(USER_KEY)

  if (!token || !storedUser) return null

  try {
    return JSON.parse(storedUser) as UserResponse
  } catch {
    clearAccessToken()
    window.localStorage.removeItem(USER_KEY)
    return null
  }
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
export function loginUser(token:string, nextUser: UserResponse) {
  setAccessToken(token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  user = nextUser;
  notify();
}

/** Clear the session (token + username) and notify subscribers. */
export function logoutUser() {
  clearAccessToken();
  window.localStorage.removeItem(USER_KEY);
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
