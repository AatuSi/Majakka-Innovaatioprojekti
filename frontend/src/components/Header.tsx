import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import LighthouseMark from "./LighthouseMark";

const navItems = [
  { label: "Etusivu", hash: "" },
  { label: "Aiheet", hash: "aiheet" },
  { label: "Miksi tämä on tärkeää", hash: "miksi" },
  { label: "Yhteys", hash: "yhteys" },
  { label: "Hankkeesta", hash: "hanke" },
];

const cutCorner =
    "[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]";
const cutCornerInner =
    "[clip-path:polygon(0_0,calc(100%-8.5px)_0,100%_8.5px,100%_100%,0_100%)]";

export default function Header() {
  const [open, setOpen] = useState(false);

  const [active, setActive] = useState("");
  useEffect(() => {
    const syncFromUrl = () => setActive(window.location.hash.replace(/^#/, ""));
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  return (
      <header className="sticky top-0 z-50 border-b-[1px] border-[#676767] bg-[#182130]/95 font-['Inter',sans-serif] backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link
              to="/"
              hash=""
              className="flex items-center gap-2 text-2xl font-semibold text-white"
              onClick={() => {
                setActive("");
                setOpen(false);
              }}
          >
            <LighthouseMark />
            Majakka
          </Link>

          <nav aria-label="Päävalikko" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = active === item.hash;
                return (
                    <li key={item.label}>
                      <Link
                          to="/"
                          hash={item.hash}
                          onClick={() => setActive(item.hash)}
                          aria-current={isActive ? "location" : undefined}
                          className={`relative inline-block pb-1 text-base transition-colors duration-300 motion-reduce:transition-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-[#1D90F4] after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none hover:text-[#1D90F4] hover:after:scale-x-100 ${
                              isActive
                                  ? "text-[#1D90F4] after:scale-x-100"
                                  : "text-white after:scale-x-0"
                          }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {/* Swap for <Link to="/sign-in"> once that route exists */}
            <a
                href="/sign-in"
                className={`${cutCorner} hidden bg-[#1D90F4] p-0.5 transition hover:bg-[#3BA0F6] sm:inline-block`}
            >
            <span
                className={`${cutCornerInner} block bg-[#182130] px-6 py-2 text-lg font-medium text-white`}
            >
              Kirjaudu
            </span>
            </a>

            <button
                type="button"
                className="rounded p-2 text-white lg:hidden"
                aria-label={open ? "Sulje valikko" : "Avaa valikko"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
            <nav aria-label="Päävalikko" className="border-t border-[#2A3548] px-6 pb-5 lg:hidden">
              <ul className="space-y-1 pt-3">
                {navItems.map((item) => {
                  const isActive = active === item.hash;
                  return (
                      <li key={item.label}>
                        <Link
                            to="/"
                            hash={item.hash}
                            onClick={() => {
                              setActive(item.hash);
                              setOpen(false);
                            }}
                            aria-current={isActive ? "location" : undefined}
                            className={`block py-2 text-lg ${isActive ? "text-[#1D90F4]" : "text-white"}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                  );
                })}
                <li className="pt-2">
                  <a href="/sign-in" className="block py-2 text-lg font-medium text-[#1D90F4]">
                    Kirjaudu
                  </a>
                </li>
              </ul>
            </nav>
        )}
      </header>
  );
}