import { Link } from "@tanstack/react-router";

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

const cutCorner =
    "[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]";

const field =
    "w-full rounded-md border border-transparent bg-[#2A3548] px-3 py-3 text-sm text-[#E3E3E3] placeholder:text-[#718096] focus:border-[#E3E3E3] focus:outline-none";

function Lights({ colors, size }: { colors: string[]; size: string }) {
  return (
      <div className="flex items-center justify-center gap-5" aria-hidden="true">
        {colors.map((color, index) => (
            <span
                key={index}
                className={`${size} rounded-full`}
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 24px 4px ${color}`,
                }}
            />
        ))}
      </div>
  );
}

export default function HomePage() {
  return (
      <div className="bg-[#182130] font-['Inter',sans-serif] text-[#E3E3E3]">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Wave graphic: file lives in public/hero-waves.webp. Raise/lower the opacity to taste. */}
          <img
              src="/hero-waves.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-[0.07] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <h1 className="text-4xl font-light leading-tight text-white sm:text-5xl">
                Opi lukemaan pimeän meren valot
              </h1>
              <p className="mt-8 max-w-xl text-lg font-light leading-8">
                Sivusto opettaa tunnistamaan veneiden kulkuvalot, majakoiden ja
                väylämerkkien loistot sekä alusten siluetit — taidot, joita
                jokainen pimeällä vesillä liikkuva tarvitsee.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                    to="/"
                    hash="aiheet"
                    className={`${cutCorner} bg-[#1D90F4] px-7 py-3.5 text-lg font-semibold text-white transition hover:bg-[#3BA0F6]`}
                >
                  Tutustu aiheisiin
                </Link>
                <Link
                    to="/"
                    hash="miksi"
                    className="px-3 py-3.5 text-lg font-medium text-[#1D90F4] underline-offset-4 hover:underline"
                >
                  Miksi tämä on tärkeää?
                </Link>
              </div>
            </div>
            <div className="flex aspect-[4/3] items-center justify-center rounded-sm bg-[#0F1724] lg:aspect-square">
              <Lights
                  colors={["#ef4444", "#22c55e", "#f8fafc"]}
                  size="h-6 w-6 sm:h-8 sm:w-8"
              />
            </div>
          </div>
        </section>

        {/* Aiheet */}
        <section id="aiheet" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-light text-white sm:text-4xl">
              Neljä kokonaisuutta, yksi taito
            </h2>
            <p className="mt-4 font-light">
              Jokainen osio keskittyy yhteen pimeän ajan navigoinnin peruspilariin.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
                <article
                    key={topic.title}
                    className="flex flex-col overflow-hidden rounded-md bg-white text-black"
                >
                  <div className="flex h-36 items-center justify-center bg-[#0F1724]">
                    <Lights colors={topic.lights} size="h-4 w-4" />
                  </div>
                  <div className="flex-1 p-5">
                    <h3 className="text-xl font-light text-[#1D90F4]">
                      {topic.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </article>
            ))}
          </div>
        </section>

        {/* Miksi */}
        <section id="miksi" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-light text-white sm:text-4xl">
                Miksi valojen tunnistaminen on tärkeää
              </h2>
              <p className="mt-6 font-light leading-7">
                Pimeällä merellä valot ja siluetit ovat usein ainoa tieto siitä,
                mitä toinen alus tekee — mihin suuntaan se on menossa, onko se
                ankkurissa vai liikkeellä ja kumman aluksen tulee väistää. Väärä
                tulkinta voi johtaa vaaratilanteeseen.
              </p>
              <p className="mt-4 font-light leading-7">
                Tämä sivusto on osa opiskelijoiden innovaatioprojektia, jonka
                tavoitteena on tehdä näiden sääntöjen opettelusta havainnollista
                ja käytännönläheistä.
              </p>
            </div>
            <dl className="space-y-6 rounded-md border border-[#2A3548] bg-[#1E2839] p-8">
              {[
                ["Kulkuvalot", "Kertovat aluksen suunnan ja tyypin pimeällä."],
                ["Loistot", "Ohjaavat turvallisesti väylällä ja merkitsevät vaaroja."],
                ["Siluetit", "Auttavat tunnistamaan aluksen tyypin myös hämärässä."],
              ].map(([term, text]) => (
                  <div key={term}>
                    <dt className="text-lg font-medium text-[#1D90F4]">{term}</dt>
                    <dd className="mt-1 font-light">{text}</dd>
                  </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Yhteys */}
        <section id="yhteys" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20">
          <h2 className="mb-8 text-3xl font-light text-white">Ota yhteyttä</h2>
          <form
              className="rounded-lg border border-[#2A3548] bg-[#1E2839] p-6 sm:p-10"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: send the form to your backend
              }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm text-[#718096]">
                Etunimi
                <input className={`${field} mt-1`} name="firstName" autoComplete="given-name" />
              </label>
              <label className="block text-sm text-[#718096]">
                Sukunimi
                <input className={`${field} mt-1`} name="lastName" autoComplete="family-name" />
              </label>
              <label className="block text-sm text-[#718096]">
                Sähköposti
                <input
                    className={`${field} mt-1`}
                    type="email"
                    name="email"
                    placeholder="email@address.com"
                    autoComplete="email"
                />
              </label>
              <label className="block text-sm text-[#718096]">
                Aihe
                <input className={`${field} mt-1`} name="topic" />
              </label>
            </div>
            <label className="mt-5 block text-sm text-[#718096]">
              Viesti
              <textarea
                  className={`${field} mt-1 h-44 resize-y`}
                  name="message"
                  placeholder="Kirjoita viestisi tähän"
              />
            </label>
            <div className="mt-5 text-right">
              <button
                  type="submit"
                  className="rounded bg-[#1D90F4] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3BA0F6]"
              >
                Lähetä viesti
              </button>
            </div>
          </form>
        </section>
      </div>
  );
}