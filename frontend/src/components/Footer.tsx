export default function Footer() {
  return (
    <footer
      id="hanke"
      className="border-t border-white/10 bg-[#0b1830] text-slate-300"
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-serif text-lg text-white">Majakka</p>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Innovaatioprojekti, joka opettaa veneiden ja majakoiden valoja
              sekä alusten siluetteja pimeän ajan navigointia varten.
            </p>
          </div>
          <div className="text-sm text-slate-400 sm:text-right">
            <p>Opiskelijaprojekti &middot; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
