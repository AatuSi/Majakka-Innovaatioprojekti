import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "../features/login";

type LoginSearch = {
  mode?: "sign-in" | "sign-up";
};

export const Route = createFileRoute("/login")({
  // ?mode=sign-up opens the registration tab, e.g. from the footer's
  // "Rekisteröidy" link. Anything else falls back to the sign-in tab.
  // The key is always returned: the router lays this result over the raw
  // query, so leaving it out would let an invalid value through.
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    mode:
      search.mode === "sign-up" || search.mode === "sign-in"
        ? search.mode
        : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Kirjaudu – Majakka" }] }),
});
