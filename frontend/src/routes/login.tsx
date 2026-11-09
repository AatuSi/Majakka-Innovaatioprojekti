import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "../features/login";

type LoginSearch = {
  mode?: "sign-in" | "sign-up";
};

// DISCONNECTED: logging in now happens in the login modal (AuthModal), opened
// from the header and footer. Every visit to /login is sent to the home page
// before anything renders, so the page below is never shown. Its code in
// features/login is kept for reference; to bring the page back, remove the
// beforeLoad redirect.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  // Kept so LoginPage, which reads ?mode= from this route, still compiles.
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    mode:
      search.mode === "sign-up" || search.mode === "sign-in"
        ? search.mode
        : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Kirjaudu – Majakka" }] }),
});
