import { client } from "../client/client.gen";
import { warnIfApiUnreachable } from "./connection";

const ACCESS_TOKEN_KEY = "majakka.access-token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

client.setConfig({
  baseUrl,
  auth: () => getAccessToken() ?? undefined,
});

// In development, say in the browser console right away when the backend is
// not running, instead of letting the first API call fail later.
if (import.meta.env.DEV && typeof window !== "undefined") {
  void warnIfApiUnreachable(baseUrl);
}
