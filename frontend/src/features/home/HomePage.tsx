const topics = [
  {
    title: "Veneiden kulkuvalot",
    description:
      "Opi tunnistamaan punaisen, vihreän ja valkoisen kulkuvalon yhdistelmistä, mihin suuntaan alus on menossa ja kumman aluksen tulee väistää.",
    lights: ["#ef4444", "#22c55e", "#f8fafc"],
  },
  {
    title: "IALA-valorytmit ja -poijumerkit",
    description:
      "Tutustu IALA-järjestelmän mukaisiin loistoihin ja niiden vilkkumissekvensseihin ja väreihin.",
    lights: ["#f59e0b", "#f8fafc"],
  },
  {
    title: "Alusten siluetit",
    description:
      "Harjoittele tunnistamaan aluksen tyyppi ääriviivoista silloinkin, kun valot eivät vielä erotu selvästi.",
    lights: ["#38bdf8"],
  },
  {
    title: "Tietovisa",
    description:
      "Testaa oppimasi tiedot käytännön tilanteissa ja seuraa omaa edistymistäsi.",
    lights: ["#f8fafc", "#f59e0b"],
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.12),transparent_40%)]"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Yönavigoinnin oppimateriaali
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Opi lukemaan pimeän meren valot
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            Sivusto opettaa tunnistamaan veneiden kulkuvalot, majakoiden ja
            väylämerkkien loistot sekä alusten siluetit — taidot, joita
            jokainen pimeällä vesillä liikkuva tarvitsee.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#aiheet"
              className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-[#0b1830] transition hover:bg-amber-200"
            >
              Tutustu aiheisiin
            </a>
            <a
              href="#miksi"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Miksi tämä on tärkeää?
            </a>
          </div>
        </div>
      </section>

      <section id="aiheet" className="bg-[#0f2140] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Neljä kokonaisuutta, yksi taito
            </h2>
            <p className="mt-4 text-slate-300">
              Jokainen osio keskittyy yhteen pimeän ajan navigoinnin
              peruspilariin.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
              <div
                key={topic.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/40 hover:bg-white/10"
              >
                <div className="flex gap-1.5">
                  {topic.lights.map((color, index) => (
                    <span
                      key={`${topic.title}-${index}`}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}`,
                      }}
                    />
                  ))}
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold">
                  {topic.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {topic.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="miksi" className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Miksi valojen tunnistaminen on tärkeää
            </h2>
            <p className="mt-4 text-slate-300">
              Pimeällä merellä valot ja siluetit ovat usein ainoa tieto siitä,
              mitä toinen alus tekee — mihin suuntaan se on menossa, onko se
              ankkurissa vai liikkeellä ja kumman aluksen tulee väistää.
              Väärä tulkinta voi johtaa vaaratilanteeseen.
            </p>
            <p className="mt-4 text-slate-300">
              Tämä sivusto on osa opiskelijoiden innovaatioprojektia, jonka
              tavoitteena on tehdä näiden sääntöjen opettelusta
              havainnollista ja käytännönläheistä.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                  Kulkuvalot
                </dt>
                <dd className="mt-1 text-slate-300">
                  Kertovat aluksen suunnan ja tyypin pimeällä.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                  Loistot
                </dt>
                <dd className="mt-1 text-slate-300">
                  Ohjaavat turvallisesti väylällä ja merkitsevät vaaroja.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                  Siluetit
                </dt>
                <dd className="mt-1 text-slate-300">
                  Auttavat tunnistamaan aluksen tyypin myös hämärässä.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}