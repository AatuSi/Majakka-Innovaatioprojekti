import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import '../../IALA-lights.css'

export const Route = createFileRoute('/IALA-lights')({
  component: App,
})





interface Characteristic {
  abbr: string;
  name: string;
  animClass: string;
  color: string;
  colorLabel: string;
  period: string;
  description: string;
}

interface BuoyType {
  name: string;
  lights: string[];
  animClass: string;
  char: string;
  shape: string;
  description: string;
}

interface LateralRow {
  side: string;
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
  regionA: string;
  regionB: string;
}

type IalaRegion = "A" | "B";

const characteristics: Characteristic[] = [
  {
    abbr: "F",
    name: "Kiinteä",
    animClass: "light-flash-fixed",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "Jatkuva",
    description:
      "Tasainen, katkeamaton valo. Yksinkertaisin loistotyyppi — palaa jatkuvasti ilman katkoja. Käytetään johtoloistoissa ja joissain pienissä merkkiloistoissa, joissa pysyvä säde riittää.",
  },
  {
    abbr: "Vl",
    name: "Välkkyvä",
    animClass: "light-flash-single",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "3 s",
    description:
      "Yksittäinen välähdys toistuu säännöllisin väliajoin, pimeys aina valoa pidempää. Yleisin loistotyyppi poijuissa ja merimerkkiloistoissa ympäri maailman.",
  },
  {
    abbr: "Vl(2)",
    name: "Ryhmävälkky (2)",
    animClass: "light-flash-group2",
    color: "#22c55e",
    colorLabel: "Vihreä",
    period: "5 s",
    description:
      "Kaksi nopeaa välähdystä peräkkäin, sitten pidempi pimeys. Ryhmävälkkyloistoja käytetään erottamaan vierekkäiset merkit toisistaan — ryhmän välähdysten lukumäärä on tunnistuksen avain.",
  },
  {
    abbr: "Vl(3)",
    name: "Ryhmävälkky (3)",
    animClass: "light-flash-group3",
    color: "#ef4444",
    colorLabel: "Punainen",
    period: "7 s",
    description:
      "Kolme nopeaa välähdystä ennen pimeää jaksoa. Välähdysten laskeminen on tärkeää merkin tunnistamiseksi heikossa näkyvyydessä.",
  },
  {
    abbr: "Iso",
    name: "Isofaasi",
    animClass: "light-flash-iso",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "2 s",
    description:
      "Yhtä pitkät valo- ja pimeäjaksot — valo palaa täsmälleen puolet ajasta ja sammuu puolet. Täydellisen tasapainoinen rytmi tekee isofaasiloistoista välittömästi tunnistettavan merellä.",
  },
  {
    abbr: "Pim",
    name: "Pimennetty",
    animClass: "light-flash-occulting",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "3 s",
    description:
      "Välkkyvän vastakohta — valo palaa kauemmin kuin on pimeänä. Lyhyt pimennys katkaisee muuten tasaisen säteen. Käytetään yleisesti johtoloistoissa ja sektorivaroitusloistoissa.",
  },
  {
    abbr: "Np",
    name: "Nopea",
    animClass: "light-flash-quick",
    color: "#f59e0b",
    colorLabel: "Keltainen",
    period: "0,8 s",
    description:
      "Erittäin nopea välkyntä, 50–60 välähdystä minuutissa. Korkea tahti luo tunnusomaisen kiireellisen luonteen, jota käytetään kardinaalimerkkiloistoissa osoittamaan, että nimetyllä puolella on turvallista navigointivettä.",
  },
  {
    abbr: "PVl",
    name: "Pitkä välkky",
    animClass: "light-flash-longflash",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "10 s",
    description:
      "Yksittäinen vähintään kahden sekunnin mittainen välähdys. Pitkä hehku erottuu selvästi tavallisista välkkyloistosta. Tyypillisesti turvavesimerkeissä, jotka osoittavat väylän keskikohdan tai maatumispaikan.",
  },
  {
    abbr: "Mo(A)",
    name: "Morsekoodi — A",
    animClass: "light-flash-morse-a",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "6 s",
    description:
      "Loisto, joka lähettää morseaakkoset A (• —) välähdyssekvensseinä. Morsekoodimerkkejä käytetään turvavesimerkeissä ja joissain johtoloistoissa yksiselitteisen tunnisteen antamiseksi.",
  },
];

const buoyTypes: BuoyType[] = [
  {
    name: "Lateraali — Paapuuri (IALA-A)",
    lights: ["#ef4444"],
    animClass: "light-flash-single",
    char: "Vl P",
    shape: "Tynnyri",
    description:
      "Merkitsee väylän paapuuripuolen (vasen) kulkusuunnassa. Punainen tynnyripoiju punaisella välkkyvalolla. IALA-B-alueilla (Ameriikat, Japani) paapuuri- ja styyrpuuripuolen värit ovat päinvastoin.",
  },
  {
    name: "Lateraali — Styyrpuuri (IALA-A)",
    lights: ["#22c55e"],
    animClass: "light-flash-single",
    char: "Vl V",
    shape: "Kartio",
    description:
      "Merkitsee väylän styyrpuuripuolen (oikea) IALA-A-alueilla. Vihreä kartiopoiju vihreällä välkkyvalolla. Muistiohje 'punainen paapuuriin, vihreä styyrpuuriin' pätee Euroopassa ja useimmilla kansainvälisillä vesillä.",
  },
  {
    name: "Kardinaali — Pohjoinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-quick",
    char: "Np",
    shape: "Pilari / Sauva",
    description:
      "Kulje merkin POHJOISPUOLELTA. Musta-keltainen pilaripoiju kahdella ylöspäin osoittavalla kartiolla. Nopea valkoinen valo (Np) tai erittäin nopea valkoinen valo (ENp). Kaksoiskartiohuippumerkki muistuttaa kirjainta P.",
  },
  {
    name: "Kardinaali — Eteläinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-group2",
    char: "Np(6)+PVl",
    shape: "Pilari / Sauva",
    description:
      "Kulje merkin ETELÄPUOLELTA. Keltainen-musta poiju kahdella alaspäin osoittavalla kartiolla. Kuusi nopeaa välähdystä ja yksi pitkä välkky joka 15 sekunti — kello kuusi on kellotaulun alhaalla.",
  },
  {
    name: "Kardinaali — Itäinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-group3",
    char: "Np(3)",
    shape: "Pilari / Sauva",
    description:
      "Kulje merkin ITÄPUOLELTA. Musta-keltainen-musta poiju kahdella ulospäin osoittavalla kartiolla. Kolme nopeaa välähdystä joka 10 sekunti — kolme on kellotaulun oikealla (idässä).",
  },
  {
    name: "Kardinaali — Läntinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-group2",
    char: "Np(9)",
    shape: "Pilari / Sauva",
    description:
      "Kulje merkin LÄNSIPUOLELTA. Keltainen-musta-keltainen poiju kahdella sisäänpäin osoittavalla kartiolla. Yhdeksän nopeaa välähdystä joka 15 sekunti — yhdeksän on kellotaulun vasemmalla (lännessä).",
  },
  {
    name: "Turvavesimerkki",
    lights: ["#ef4444", "#f8fafc"],
    animClass: "light-flash-morse-a",
    char: "Mo(A) / PVl / Iso",
    shape: "Pallonmuotoinen",
    description:
      "Osoittaa turvallisen kulkuveden joka suuntaan — väylän keskilinja tai maatumismerkki. Punainen-valkoinen pystyraita pallonmuotoinen poiju, usein pitkä välkky, isofaasi tai Morse A valkoinen valo.",
  },
  {
    name: "Erikoismerkki",
    lights: ["#f59e0b"],
    animClass: "light-flash-single",
    char: "Vl K",
    shape: "Vaihteleva (X-huippumerkki)",
    description:
      "Merkitsee merikortissa mainittua erityisaluetta tai -kohdetta — liikenteen erottelujärjestelmät, sotilasharjoitusalueet, kaapeli- ja putkistot tai vesiviljely. Keltainen runko keltaisella valolla (mikä tahansa tyyppi).",
  },
  {
    name: "Eristetty vaaramerkki",
    lights: ["#ef4444", "#f8fafc"],
    animClass: "light-flash-group2",
    char: "Vl(2)",
    shape: "Pilari / Sauva",
    description:
      "Merkitsee eristyneen vaaran, jonka ympärillä on turvallista kulkuvettä. Musta-punainen vaakasuoraitattu poiju kahdella mustalla pallolla huippumerkkinä. Ryhmävälkky valkoinen valo (2) joka viisi sekuntia on standardi.",
  },
];

function LightDot({
  color,
  animClass,
  size = "md",
}: {
  color: string;
  animClass: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = size === "lg" ? 20 : size === "md" ? 13 : 9;
  return (
    <span
      className={`inline-block rounded-full ${animClass}`}
      style={{
        width: s,
        height: s,
        backgroundColor: color,
        boxShadow: `0 0 ${s * 1.2}px ${s * 0.6}px ${color}88`,
        flexShrink: 0,
      }}
    />
  );
}


function CharCard({ c }: { c: Characteristic }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/40 hover:bg-white/8">
      <div className="flex items-center gap-3">
        <LightDot color={c.color} animClass={c.animClass} size="lg" />
        <div>
          <span className="block font-mono text-xs text-amber-300">{c.abbr}</span>
          <span className="block font-serif text-lg font-semibold leading-tight">
            {c.name}
          </span>
        </div>
        <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-slate-400">
          {c.period}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        {c.description}
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Väri:&nbsp;
        <span className="text-slate-400">{c.colorLabel}</span>
      </p>
    </div>
  );
}

function BuoyCard({ b }: { b: BuoyType }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/40 hover:bg-white/8">
      <div className="flex items-center gap-2 mb-4">
        {b.lights.map((col, i) => (
          <LightDot key={i} color={col} animClass={b.animClass} size="md" />
        ))}
      </div>
      <h3 className="font-serif text-xl font-semibold">{b.name}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-0.5 font-mono text-xs text-amber-300">
          {b.char}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
          {b.shape}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {b.description}
      </p>
    </div>
  );
}

export default function App() {
  const [activeSystem, setActiveSystem] = useState<IalaRegion>("A");

  return (
    <div className="bg-[#0b1830] text-white min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 10%, rgba(34,197,94,0.10) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(245,158,11,0.08) 0%, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center gap-4">
            <LightDot color="#ef4444" animClass="light-flash-single" size="lg" />
            <LightDot color="#22c55e" animClass="light-flash-group2" size="lg" />
            <LightDot color="#f8fafc" animClass="light-flash-quick" size="lg" />
            <LightDot color="#f59e0b" animClass="light-flash-occulting" size="lg" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            IALA-merenkulun merkintäjärjestelmä
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            IALA-valorytmit ja -poijutyypit
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            Jokaisella veden päällä näkyvällä valolla on tarkoituksensa — sen väri, rytmi ja sijainti sisältävät tärkeää navigointitietoa.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#0f2140] border-y border-white/10 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Värivaihtoehdot", value: "4", sub: "Punainen · Vihreä · Valkoinen · Keltainen" },
              { label: "Kardinaalipisteet", value: "4", sub: "P · E · I · L" },
              { label: "IALA-alueet", value: "2", sub: "Alue A & Alue B" },
              { label: "Loistotyypit", value: "12+", sub: "K · Vl · Pim · Iso · Np · Mo …" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <span className="block font-serif text-3xl font-semibold text-amber-300">
                  {stat.value}
                </span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-white mt-0.5">
                  {stat.label}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Light Characteristics */}
      <section id="characteristics" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 mb-2">
              Osio 1
            </p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Loistojen tyypit
            </h2>
            <p className="mt-4 text-slate-300">
              Loiston "tyyppi" määräytyy sen välähdysrytmin mukaan.
              Merenkulkijat tunnistavat loistot ajastamalla välähdykset kellolla
              ja vertaamalla merikarttaan. Jokainen alla oleva animoitu piste
              näyttää kyseisen tyypin todellisen rytmin.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {characteristics.map((c) => (
              <CharCard key={c.abbr} c={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Buoy Types */}
      <section id="buoys" className="bg-[#0f2140] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 mb-2">
              Osio 2
            </p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              IALA-poijutyypit
            </h2>
            <p className="mt-4 text-slate-300">
              IALA-järjestelmä määrittelee viisi merkkikategoriaa. Väri, muoto,
              huippumerkki ja loistotyyppi muodostavat yhdessä yksiselitteisen
              kuvauksen kunkin merkin merkityksestä.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {buoyTypes.map((b) => (
              <BuoyCard key={b.name} b={b} />
            ))}
          </div>
        </div>
      </section>

      {/* IALA-A vs IALA-B */}
      <section id="rules" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 mb-2">
              Osio 3
            </p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Alue A vai Alue B
            </h2>
            <p className="mt-4 text-slate-300">
              Maailma on jaettu kahteen IALA-alueeseen. Ainoa ero niiden välillä
              on punaisen ja vihreän värin sijoittelu paapuuri- ja
              styyrpuurilateraalimerkkeihin. Valitse alueesi alta.
            </p>
          </div>

          <div className="mb-10 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            {(["A", "B"] as IalaRegion[]).map((r) => (
              <button
                key={r}
                onClick={() => setActiveSystem(r)}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  activeSystem === r
                    ? "bg-amber-300 text-[#0b1830]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                IALA-{r}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {([
              {
                side: "Paapuuri (vasen)",
                colorA: "#ef4444",
                colorB: "#22c55e",
                labelA: "Punainen",
                labelB: "Vihreä",
                regionA:
                  "Eurooppa, Afrikka, Aasia (pl. Japani/Korea/Filippiinit), Australia, Uusi-Seelanti, Persianlahden maat.",
                regionB:
                  "Ameriikat, Japani, Etelä-Korea, Filippiinit.",
              },
              {
                side: "Styyrpuuri (oikea)",
                colorA: "#22c55e",
                colorB: "#ef4444",
                labelA: "Vihreä",
                labelB: "Punainen",
                regionA: "Vihreä kartiopoiju. Vihreä valo (mikä tahansa tyyppi).",
                regionB: "Punainen kartiopoiju. Punainen valo (mikä tahansa tyyppi).",
              },
            ] as LateralRow[]).map((row) => (
              <div
                key={row.side}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <LightDot
                    color={activeSystem === "A" ? row.colorA : row.colorB}
                    animClass="light-flash-single"
                    size="lg"
                  />
                  <div>
                    <p className="text-xs text-slate-400">Lateraalimerkki</p>
                    <p className="font-serif text-xl font-semibold">{row.side}</p>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Väri alueella IALA-{activeSystem}
                    </dt>
                    <dd className="mt-0.5 text-slate-300">
                      {activeSystem === "A" ? row.labelA : row.labelB}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Kattavuus
                    </dt>
                    <dd className="mt-0.5 text-slate-300">
                      {activeSystem === "A" ? row.regionA : row.regionB}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300 mb-3">
                Muistisääntö
              </p>
              {activeSystem === "A" ? (
                <>
                  <p className="font-serif text-xl font-semibold mb-3">
                    "Punainen paapuuriin, vihreä styyrpuuriin"
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    IALA-A-vesillä (Eurooppa, Afrikka, suurin osa Aasiasta)
                    punainen poiju merkitsee aina väylän paapuuripuolen
                    kulkusuunnassa — yleensä kohti satamaa tai ylävirtaan.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-serif text-xl font-semibold mb-3">
                    "Red Right Returning"
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Klassinen amerikkalainen muistisääntö: pidä punaiset poijut
                    oikealla puolellasi palatessasi mereltä (sisämaahan tai
                    ylävirtaan). IALA-B-vesillä styyrpuurin lateraalimerkit
                    ovat punaisia.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}


