import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1830]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <LighthouseMark />
          <span className="font-serif text-lg font-semibold tracking-wide">
            Majakka
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 sm:flex">
          <Link to="/" hash="aiheet" className="transition hover:text-amber-300">
            Aiheet
          </Link>
          <Link to="/" hash="miksi" className="transition hover:text-amber-300">
            Miksi tämä on tärkeää
          </Link>
          <Link to="/" hash="hanke" className="transition hover:text-amber-300">
            Hankkeesta
          </Link>
        </nav>
      </div>
    </header>
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
