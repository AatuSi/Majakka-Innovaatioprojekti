import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import LighthouseMark from "./LighthouseMark";
import { scrollIfAlreadyHere } from "./navigation";

const cutCorner =
  "[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]";
const cutCornerInner =
  "[clip-path:polygon(0_0,calc(100%-8.5px)_0,100%_8.5px,100%_100%,0_100%)]";

const navLinkBase =
  "relative inline-block pb-1 text-base transition-colors duration-300 motion-reduce:transition-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-[#1D90F4] after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none hover:text-[#1D90F4] hover:after:scale-x-100";
const navLinkActive = "text-[#1D90F4] after:scale-x-100";
const navLinkInactive = "text-white after:scale-x-0";

export default function Header() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const href = useLocation({ select: (location) => location.href });
  const isQuiz = pathname.endsWith("-quiz");

  // The menu remembers the location it was opened at, so any navigation,
  // including the browser's back and forward buttons, closes it.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const open = menuOpenAt === href;
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenuOpenAt(null);

  const navigateTo = (to: string, hash?: string) => (event: MouseEvent) => {
    closeMenu();
    scrollIfAlreadyHere(event, to, hash);
  };

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpenAt(null);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b-[1px] border-[#676767] bg-[#182130]/95 font-['Inter',sans-serif] backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-semibold text-white"
          onClick={navigateTo("/")}
        >
          <LighthouseMark />
          Majakka
        </Link>

        <nav aria-label="Päävalikko" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className={navLinkBase}
                activeProps={{ className: navLinkActive }}
                inactiveProps={{ className: navLinkInactive }}
                onClick={navigateTo("/")}
              >
                Etusivu
              </Link>
            </li>
            <li>
              <Link
                to="/colregs"
                className={navLinkBase}
                activeProps={{ className: navLinkActive }}
                inactiveProps={{ className: navLinkInactive }}
                onClick={navigateTo("/colregs")}
              >
                Kulkuvalot
              </Link>
            </li>
            <li>
              <Link
                to="/IALA"
                className={navLinkBase}
                activeProps={{ className: navLinkActive }}
                inactiveProps={{ className: navLinkInactive }}
                onClick={navigateTo("/IALA")}
              >
                IALA-loistot
              </Link>
            </li>
            <li>
              <Link
                to="/IALA-quiz"
                className={`${navLinkBase} ${isQuiz ? navLinkActive : navLinkInactive}`}
                onClick={navigateTo("/IALA-quiz")}
              >
                Tietovisat
              </Link>
            </li>
            <li>
              <Link
                to="/"
                hash="hanke"
                className={`${navLinkBase} ${navLinkInactive}`}
                onClick={navigateTo("/", "hanke")}
              >
                Hankkeesta
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className={`${cutCorner} hidden bg-[#1D90F4] p-0.5 transition hover:bg-[#3BA0F6] sm:inline-block`}
          >
            <span
              className={`${cutCornerInner} block bg-[#182130] px-6 py-2 text-lg font-medium text-white`}
            >
              Kirjaudu
            </span>
          </Link>

          <button
            type="button"
            className="rounded p-2 text-white lg:hidden"
            aria-label={open ? "Sulje valikko" : "Avaa valikko"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            ref={menuButtonRef}
            onClick={() => setMenuOpenAt(open ? null : href)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Päävalikko"
          className="border-t border-[#2A3548] px-6 pb-5 lg:hidden"
        >
          <ul className="space-y-1 pt-3">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                onClick={navigateTo("/")}
                className="block py-2 text-lg text-white hover:text-[#1D90F4]"
                activeProps={{ className: "text-[#1D90F4] font-medium" }}
              >
                Etusivu
              </Link>
            </li>
            <li>
              <Link
                to="/colregs"
                onClick={navigateTo("/colregs")}
                className="block py-2 text-lg text-white hover:text-[#1D90F4]"
                activeProps={{ className: "text-[#1D90F4] font-medium" }}
              >
                Kulkuvalot
              </Link>
            </li>
            <li>
              <Link
                to="/IALA"
                onClick={navigateTo("/IALA")}
                className="block py-2 text-lg text-white hover:text-[#1D90F4]"
                activeProps={{ className: "text-[#1D90F4] font-medium" }}
              >
                IALA-loistot
              </Link>
            </li>
            <li>
              <Link
                to="/IALA-quiz"
                onClick={navigateTo("/IALA-quiz")}
                className={`block py-2 text-lg hover:text-[#1D90F4] ${
                  isQuiz ? "text-[#1D90F4] font-medium" : "text-white"
                }`}
              >
                Tietovisat
              </Link>
            </li>
            <li>
              <Link
                to="/"
                hash="hanke"
                onClick={navigateTo("/", "hanke")}
                className="block py-2 text-lg text-white hover:text-[#1D90F4]"
              >
                Hankkeesta
              </Link>
            </li>
            <li className="pt-2">
              <Link
                to="/login"
                onClick={navigateTo("/login")}
                className="block py-2 text-lg font-medium text-[#1D90F4]"
              >
                Kirjaudu
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}