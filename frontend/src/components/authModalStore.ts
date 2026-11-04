import { useSyncExternalStore } from "react";

export type AuthMode = "sign-in" | "sign-up";

type AuthModalState = { open: boolean; mode: AuthMode };

// A tiny shared store, so the header, the footer (or any other component) can
// open the login modal without a provider or any router changes.
let state: AuthModalState = { open: false, mode: "sign-in" };
const listeners = new Set<() => void>();

function setState(next: AuthModalState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openAuthModal(mode: AuthMode = "sign-in") {
  setState({ open: true, mode });
}

export function closeAuthModal() {
  setState({ ...state, open: false });
}

export function useAuthModal() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}
