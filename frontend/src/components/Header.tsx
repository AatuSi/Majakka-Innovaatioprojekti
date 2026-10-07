import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

const linkBase = "transition hover:text-amber-300";
const linkActive = "text-amber-300";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  // Both quizzes live under one menu item, so mark it active on either one.
  const onQuiz = pathname.endsWith("-quiz");

  const closeMenu = () => setMenuOpen(false);

  const links = (
    <>
      <Link
        to="/colregs"
        className={linkBase}
        activeProps={{ className: linkActive }}
        onClick={closeMenu}
      >
        Kulkuvalot
      </Link>
      <Link
        to="/IALA-lights"
        className={linkBase}
        activeProps={{ className: linkActive }}
        onClick={closeMenu}
      >
        IALA-loistot
      </Link>
      <Link
        to="/IALA-quiz"
        className={`${linkBase} ${onQuiz ? linkActive : ""}`}
        onClick={closeMenu}
      >
        Tietovisat
      </Link>
      <a href="#hanke" className={linkBase} onClick={closeMenu}>
        Hankkeesta
      </a>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-white"
          onClick={closeMenu}
        >
          <LighthouseMark />
          <span className="font-serif text-lg font-semibold tracking-wide">
            Majakka
          </span>
        </Link>
        <nav
          aria-label="Päävalikko"
          className="hidden items-center gap-8 text-sm font-medium text-slate-200 sm:flex"
        >
          {links}
        </nav>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-200 transition hover:text-amber-300 sm:hidden"
          aria-label={menuOpen ? "Sulje valikko" : "Avaa valikko"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Päävalikko"
          className="flex flex-col gap-4 border-t border-white/10 px-6 py-4 text-base font-medium text-slate-200 sm:hidden"
        >
          {links}
        </nav>
      )}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

function LighthouseMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-amber-300"
      fill="none"
    >
      <path
        d="M9 21h6M8 21l1-13h6l1 13M9.5 8h5M10 4.5h4L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 9l3 1.2M20 9l-3 1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
