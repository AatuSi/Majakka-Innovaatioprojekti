import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { createUser, login } from "../client";
import { setAccessToken } from "../api/config";
import { closeAuthModal, useAuthModal } from "./authModalStore.ts";
import type { AuthMode } from "./authModalStore.ts";

const SUCCESS_CLOSE_MS = 3000;

const inputClass =
  "h-12 w-full rounded-md border border-transparent bg-[#2A3548] px-3 text-base text-white outline-none placeholder:text-[#718096] focus:border-[#1D90F4] focus:ring-2 focus:ring-[#1D90F4]/25";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="m3 3 18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.8 17.8 0 0 1-3.1 3.9M6.2 6.8C3.7 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1 0 1.9-.2 2.7-.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function AuthModal() {
  const { open, mode } = useAuthModal();
  if (!open || typeof document === "undefined") return null;
  // Portal to <body>: the sticky header uses backdrop-blur, which would
  // otherwise trap a "fixed" overlay inside the header's own box.
  return createPortal(<AuthDialog initialMode={mode} />, document.body);
}

function AuthDialog({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ mode: AuthMode; username: string } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const isSignIn = mode === "sign-in";

  // Lock page scroll, focus the first field, and give focus back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAuthModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // After a successful login, close on its own.
  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(closeAuthModal, SUCCESS_CLOSE_MS);
    return () => clearTimeout(timeout);
  }, [success]);

  // Keep Tab inside the dialog.
  function trapFocus(event: ReactKeyboardEvent) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setPasswordMismatch(false);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSignIn && password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    setPasswordMismatch(false);
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (!isSignIn) {
        await createUser({ body: { username, password }, throwOnError: true });
      }

      const response = await login({
        body: { username, password },
        throwOnError: true,
      });

      setAccessToken(response.data.access_token);
      setSuccess({ mode, username });
    } catch (error) {
      const detail =
        error &&
        typeof error === "object" &&
        "detail" in error &&
        typeof error.detail === "string"
          ? error.detail
          : undefined;

      setErrorMessage(
        detail === "Invalid credentials"
          ? "Käyttäjätunnus tai salasana on väärä."
          : detail === "Username already exists"
            ? "Käyttäjätunnus on jo käytössä."
            : "Kirjautuminen ei onnistunut. Yritä hetken kuluttua uudelleen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        // Click on the dark backdrop (not the card) closes the modal.
        if (event.target === event.currentTarget) closeAuthModal();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onKeyDown={trapFocus}
        className="relative my-auto w-full max-w-md rounded-lg border border-[#2A3548] bg-[#1E2839] p-6 font-['Inter',sans-serif] text-white shadow-2xl shadow-black/60 sm:p-8"
      >
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Sulje"
          className="absolute right-3 top-3 rounded p-2 text-[#A0AEC0] transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1D90F4]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {success ? (
          <div role="status" className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-400">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 id="auth-title" className="mt-5 text-2xl font-semibold">
              {success.mode === "sign-in" ? "Kirjautuminen onnistui!" : "Käyttäjätili luotu!"}
            </h2>
            <p className="mt-3 font-light text-[#A0AEC0]">
              {success.mode === "sign-in" ? "Tervetuloa takaisin, " : "Tervetuloa Majakkaan, "}
              <span className="font-medium text-white">{success.username}</span>!
            </p>
            <button
              type="button"
              onClick={closeAuthModal}
              className="mt-6 h-11 rounded-md bg-[#1D90F4] px-6 font-semibold text-white transition hover:bg-[#3BA0F6] focus:outline-none focus:ring-2 focus:ring-[#8bc9ff]"
            >
              Jatka
            </button>
          </div>
        ) : (
          <>
            <h2 id="auth-title" className="pr-8 text-2xl font-semibold">
              {isSignIn ? "Tervetuloa takaisin" : "Luo käyttäjätili"}
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-[#182130] p-1" role="tablist">
              {(
                [
                  ["sign-in", "Kirjautuminen"],
                  ["sign-up", "Rekisteröityminen"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => switchMode(value)}
                  className={`h-10 rounded-md px-2 text-sm font-semibold transition sm:text-base ${
                    mode === value
                      ? "bg-[#2A3548] text-white"
                      : "text-[#A0AEC0] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="auth-username" className="mb-2 block text-sm font-medium">
                  Käyttäjätunnus
                </label>
                <input
                  ref={firstFieldRef}
                  id="auth-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Kirjoita käyttäjätunnus"
                  required
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setErrorMessage("");
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="mb-2 block text-sm font-medium">
                  Salasana
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    placeholder="Kirjoita salasana"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordMismatch(false);
                    }}
                    className={`${inputClass} pr-14`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Piilota salasana" : "Näytä salasana"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#A0AEC0] transition hover:text-[#1D90F4]"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {!isSignIn && (
                <div>
                  <label htmlFor="auth-confirm" className="mb-2 block text-sm font-medium">
                    Vahvista salasana
                  </label>
                  <input
                    id="auth-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Kirjoita salasana uudelleen"
                    required
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordMismatch(false);
                    }}
                    aria-invalid={passwordMismatch}
                    aria-describedby={passwordMismatch ? "auth-mismatch" : undefined}
                    className={`${inputClass} ${passwordMismatch ? "!border-red-400" : ""}`}
                  />
                  {passwordMismatch && (
                    <p id="auth-mismatch" className="mt-2 text-sm text-red-300">
                      Salasanat eivät täsmää.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-md bg-[#1D90F4] px-6 text-base font-semibold text-white transition hover:bg-[#3BA0F6] focus:outline-none focus:ring-2 focus:ring-[#8bc9ff] focus:ring-offset-2 focus:ring-offset-[#1E2839] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Käsitellään..." : isSignIn ? "Kirjaudu sisään" : "Luo tili"}
              </button>

              {errorMessage && (
                <p role="alert" className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
