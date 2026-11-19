import { useSyncExternalStore } from "react";
import type { UserResponse } from '../client'
import { client } from "../client/client.gen";
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

/** The name the user has filled in; empty until they have. */
export function getFullName(account: UserResponse): string {
  return [account.first_name, account.last_name].filter(Boolean).join(" ");
}

/** Full name when the user has filled it in, otherwise the username. */
export function getDisplayName(account: UserResponse | null): string {
  if (!account) return "";
  return getFullName(account) || account.username;
}

/** Replace the stored details of the logged-in user, e.g. after a refresh. */
export function updateAuthUser(nextUser: UserResponse) {
  if (user?.id !== nextUser.id) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  user = nextUser;
  notify();
}

// A rejected token means the session is over, so log out instead of leaving
// the UI looking logged in while every call fails. Only the current token
// counts: a late answer to a request made with an old one must not end a new
// session, and requests sent without a token (like login) are not affected.
client.interceptors.response.use((response, request) => {
  const token = getAccessToken();
  if (
    response.status === 401 &&
    token &&
    request.headers.get("Authorization") === `Bearer ${token}`
  ) {
    logoutUser();
  }
  return response;
});

/** React hook – returns `{ username }` or `null`. */
export function useAuthUser(): AuthUser {
  return useSyncExternalStore(
    subscribe,
    () => user,
    () => null,
  );
}
