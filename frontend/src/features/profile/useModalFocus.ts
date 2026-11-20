import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard behaviour for a modal dialog while it is open: focus moves into the
 * dialog, Tab and Shift+Tab stay inside it, Escape closes it, and focus goes
 * back to where it was (usually the button that opened it) once it closes.
 *
 * Pass a ref to the dialog panel and whether the dialog is open.
 */
export function useModalFocus(
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  // The latest onClose, so a new function on every render doesn't rerun the effect.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const panel = panelRef.current
    if (!open || !panel) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    // Only what is on screen: a hidden file input, for one, cannot take focus.
    const focusables = () =>
      [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter(
        (element) => element.getClientRects().length > 0,
      )

    focusables()[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (active === last || !panel.contains(active))
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, panelRef])
}
