// Shared class names for the profile pages, taken from the home page so the
// profile section uses the same cards, buttons, inputs and headings.

export const cutCorner =
  '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]'

// Same background as the home page: soft blue glows over a faint 40px grid.
export const gridStyle = {
  backgroundImage: `
    radial-gradient(circle at 50% 0%, rgba(29, 144, 244, 0.14) 0%, transparent 55%),
    radial-gradient(circle at 90% 30%, rgba(56, 189, 248, 0.08) 0%, transparent 45%),
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
  `,
  backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
}

export const card =
  'rounded-xl border border-[#2A3548] bg-[#1E2839]/80 shadow-2xl backdrop-blur-md'

export const insetPanel = 'rounded-lg border border-[#2A3548]/60 bg-[#182130]/60'

export const eyebrow = 'text-xs uppercase tracking-widest text-[#1D90F4]'

export const sectionTitle = 'text-2xl font-light text-white'

export const sectionIntro = 'mt-1 text-sm font-light text-[#9fb0c7]'

export const label = 'block text-xs font-semibold uppercase tracking-wider text-[#9fb0c7]'

export const input =
  'w-full rounded-lg border border-[#2A3548] bg-[#0F1724] px-4 py-3 text-sm text-white placeholder:text-[#718096] outline-none transition focus:border-[#1D90F4] focus:ring-1 focus:ring-[#1D90F4]/40'

export const primaryButton = `${cutCorner} inline-flex items-center justify-center gap-2 bg-[#1D90F4] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D90F4]/20 transition hover:-translate-y-0.25 hover:bg-[#3BA0F6] active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A3548] bg-[#0F1724] px-5 py-2.5 text-sm font-medium text-[#c3cddb] transition hover:border-[#1D90F4]/60 hover:text-white cursor-pointer'

export const dangerButton = `${cutCorner} inline-flex items-center justify-center gap-2 bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-rose-600`

export const iconBadge =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1D90F4]/15 text-[#38bdf8]'

export const modalBackdrop =
  'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'

export const modalPanel =
  'w-full max-w-md rounded-2xl border border-[#2A3548] bg-[#0F1724]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8'
