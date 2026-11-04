import type { MouseEvent } from "react";

/**
 * A link to the page you are already on does nothing visible: the router
 * reloads the same location and restores its scroll position, so a second
 * click on e.g. "Aiheet" would not scroll back to that section. When the link
 * points to the current location, skip the router and do the scroll a real
 * navigation would do: to the hash target, or to the top.
 *
 * Use in the link's onClick, with the same path and hash the link points to.
 */
export function scrollIfAlreadyHere(
  event: MouseEvent,
  pathname: string,
  hash = "",
) {
  // Leave clicks that open a new tab or window to the browser.
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return;
  }

  const current = window.location;
  const samePath =
    trimTrailingSlash(current.pathname) === trimTrailingSlash(pathname);

  if (!samePath || current.search || current.hash.slice(1) !== hash) {
    return;
  }

  event.preventDefault();

  if (hash) {
    document.getElementById(hash)?.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}

function trimTrailingSlash(path: string) {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}
