import { useState } from "react";
import './IALA-lights.css'



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
  kind: BuoyKind;
}

interface LateralRow {
  side: string;
  color: string;
  label: string;
  description: string;
}

type BuoyKind =
  | "port"
  | "starboard"
  | "north"
  | "south"
  | "east"
  | "west"
  | "safe-water"
  | "special"
  | "isolated-danger";

const characteristics: Characteristic[] = [
  {
    abbr: "Ki",
    name: "Kiinteä",
    animClass: "light-flash-fixed",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "Jatkuva",
    description:
      "Tasainen, katkeamaton valo. Yksinkertaisin loistotyyppi — palaa jatkuvasti ilman katkoja. Käytetään johtoloistoissa ja joissain pienissä merkkiloistoissa, joissa pysyvä säde riittää.",
  },
  {
    abbr: "V",
    name: "Vilkkuvalo",
    animClass: "light-flash-single",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "3 s",
    description:
      "Yksittäinen välähdys toistuu säännöllisin väliajoin, pimeys aina valoa pidempää. Yleisin loistotyyppi poijuissa ja merimerkkiloistoissa ympäri maailman.",
  },
  {
    abbr: "V(2)",
    name: "Ryhmävilkkuvalo (2)",
    animClass: "light-flash-group2",
    color: "#22c55e",
    colorLabel: "Vihreä",
    period: "5 s",
    description:
      "Kaksi nopeaa välähdystä peräkkäin, sitten pidempi pimeys. Ryhmävälkkyloistoja käytetään erottamaan vierekkäiset merkit toisistaan — ryhmän välähdysten lukumäärä on tunnistuksen avain.",
  },
  {
    abbr: "V(2+1)",
    name: "Yhdistetty ryhmävilkkuvalo",
    animClass: "light-flash-composite-group",
    color: "#ef4444",
    colorLabel: "Punainen",
    period: "7 s",
    description:
      "Kaksi nopeaa välähdystä, selvästi pidempi välitauko ja vielä yksi välähdys ennen pimeää jaksoa. Ryhmien välinen tauko erottaa yhdistetyn ryhmävilkkuvalon tavallisesta kolmen välähdyksen ryhmästä.",
  },
  {
    abbr: "T",
    name: "Tasarytmivalo",
    animClass: "light-flash-iso",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "2 s",
    description:
      "Yhtä pitkät valo- ja pimeäjaksot — valo palaa täsmälleen puolet ajasta ja sammuu puolet. Täydellisen tasapainoinen rytmi tekee tasarytmivaloista välittömästi tunnistettavan merellä.",
  },
  {
    abbr: "Ka",
    name: "Katkovalo",
    animClass: "light-flash-occulting",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "3 s",
    description:
      "Vilkkuvalon vastakohta — valo palaa kauemmin kuin on pimeänä. Lyhyt pimennys katkaisee muuten tasaisen säteen. Käytetään yleisesti johtoloistoissa ja sektorivaroitusloistoissa.",
  },
  {
    abbr: "Pv",
    name: "Jatkuva pikavilkku",
    animClass: "light-flash-quick",
    color: "#f59e0b",
    colorLabel: "Keltainen",
    period: "0,8 s",
    description:
      "Pikavilkku, 50–60 välähdystä minuutissa. Korkea tahti luo tunnusomaisen kiireellisen luonteen, jota käytetään kardinaalimerkkiloistoissa osoittamaan, että nimetyllä puolella on turvallista navigointivettä.",
  },
  {
    abbr: "KV",
    name: "Kestovilkku",
    animClass: "light-flash-longflash",
    color: "#f8fafc",
    colorLabel: "Valkoinen",
    period: "10 s",
    description:
      "Yksittäinen vähintään kahden sekunnin mittainen välähdys. Pitkä hehku erottuu selvästi tavallisesta vilkkuvalosta. Kestovilkkuja käytetään tyypillisesti turvavesimerkeissä, jotka osoittavat väylän keskikohdan tai maatumispaikan.",
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
    char: "V P",
    shape: "Tynnyri",
    kind: "port",
    description:
      "Merkitsee väylän paapuuripuolen (vasen) kulkusuunnassa IALA-A-alueella. Punainen tynnyripoiju punaisella välkkyvalolla.",
  },
  {
    name: "Lateraali — Styyrpuuri (IALA-A)",
    lights: ["#22c55e"],
    animClass: "light-flash-single",
    char: "V V",
    shape: "Kartio",
    kind: "starboard",
    description:
      "Merkitsee väylän styyrpuuripuolen (oikea) IALA-A-alueilla. Vihreä kartiopoiju vihreällä välkkyvalolla. Muistiohje 'punainen paapuuriin, vihreä styyrpuuriin' pätee Euroopassa ja useimmilla kansainvälisillä vesillä.",
  },
  {
    name: "Kardinaali — Pohjoinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-quick",
    char: "Pv",
    shape: "Pilari / Sauva",
    kind: "north",
    description:
      "Kulje merkin POHJOISPUOLELTA. Musta-keltainen pilaripoiju kahdella ylöspäin osoittavalla kartiolla. Valkoinen pikavilkku (Pv) tai nopea pikavilkku (NPv). Kaksoiskartiohuippumerkki muistuttaa kirjainta P.",
  },
  {
    name: "Kardinaali — Eteläinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-cardinal-south",
    char: "Pv(6)+KV",
    shape: "Pilari / Sauva",
    kind: "south",
    description:
      "Kulje merkin ETELÄPUOLELTA. Keltainen-musta poiju kahdella alaspäin osoittavalla kartiolla. Kuusi nopeaa välähdystä ja yksi pitkä välkky joka 15 sekunti — kello kuusi on kellotaulun alhaalla.",
  },
  {
    name: "Kardinaali — Itäinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-cardinal-east",
    char: "Pv(3)",
    shape: "Pilari / Sauva",
    kind: "east",
    description:
      "Kulje merkin ITÄPUOLELTA. Musta-keltainen-musta poiju kahdella ulospäin osoittavalla kartiolla. Kolme nopeaa välähdystä joka 10 sekunti — kolme on kellotaulun oikealla (idässä).",
  },
  {
    name: "Kardinaali — Läntinen",
    lights: ["#f8fafc"],
    animClass: "light-flash-cardinal-west",
    char: "Pv(9)",
    shape: "Pilari / Sauva",
    kind: "west",
    description:
      "Kulje merkin LÄNSIPUOLELTA. Keltainen-musta-keltainen poiju kahdella sisäänpäin osoittavalla kartiolla. Yhdeksän nopeaa välähdystä joka 15 sekunti — yhdeksän on kellotaulun vasemmalla (lännessä).",
  },
  {
    name: "Turvavesimerkki",
    lights: ["#ef4444", "#f8fafc"],
    animClass: "light-flash-morse-a",
    char: "Mo(A) / KV / T",
    shape: "Pallonmuotoinen",
    kind: "safe-water",
    description:
      "Osoittaa turvallisen kulkuveden joka suuntaan — väylän keskilinja tai maatumismerkki. Punainen-valkoinen pystyraita pallonmuotoinen poiju, usein kestovilkku, tasarytmivalo tai Morse A -valo.",
  },
  {
    name: "Erikoismerkki",
    lights: ["#f59e0b"],
    animClass: "light-flash-single",
    char: "V K",
    shape: "Vaihteleva (X-huippumerkki)",
    kind: "special",
    description:
      "Merkitsee merikortissa mainittua erityisaluetta tai -kohdetta — liikenteen erottelujärjestelmät, sotilasharjoitusalueet, kaapeli- ja putkistot tai vesiviljely. Keltainen runko keltaisella valolla (mikä tahansa tyyppi).",
  },
  {
    name: "Eristetty vaaramerkki",
    lights: ["#ef4444", "#f8fafc"],
    animClass: "light-flash-group2",
    char: "V(2)",
    shape: "Pilari / Sauva",
    kind: "isolated-danger",
    description:
      "Merkitsee eristyneen vaaran, jonka ympärillä on turvallista kulkuvettä. Musta-punainen vaakasuoraitattu poiju kahdella mustalla pallolla huippumerkkinä. Ryhmävälkky valkoinen valo (2) joka viisi sekuntia on standardi.",
  },
];

function LightDot({
  color,
  animClass,
  size = "md",
  animateOnCardHover = false,
}: {
  color: string;
  animClass: string;
  size?: "sm" | "md" | "lg";
  animateOnCardHover?: boolean;
}) {
  const s = size === "lg" ? 20 : size === "md" ? 13 : 9;
  return (
    <span
      className={`inline-block rounded-full ${animClass}${animateOnCardHover ? " light-on-card-hover" : ""}`}
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
        <LightDot
          color={c.color}
          animClass={c.animClass}
          size="lg"
          animateOnCardHover
        />
        <div>
          <span className="block font-mono text-xs text-amber-300">{c.abbr}</span>
          <span className="block font-serif text-lg font-semibold leading-tight">
            {c.name}
          </span>
        </div>
        <span className="ml-auto shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-slate-400">
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

function BuoyIllustration({ kind, name }: { kind: BuoyKind; name: string }) {
  const bodyClipId = `marker-body-${kind}`;
  const darkMarkProps = {
    fill: "#050505",
    stroke: "#94a3b8",
    strokeWidth: 1.25,
    strokeLinejoin: "round" as const,
  };

  const body = (() => {
    switch (kind) {
      case "port":
      case "starboard":
        return (
          <path
            d="M81 68h18v112q0 9-9 9t-9-9Z"
            fill={kind === "port" ? "#ef2929" : "#55b950"}
          />
        );
      case "north":
        return (
          <g clipPath={`url(#${bodyClipId})`}>
            <rect x="80" y="66" width="20" height="54" fill="#050505" />
            <rect x="80" y="120" width="20" height="70" fill="#ffe500" />
          </g>
        );
      case "south":
        return (
          <g clipPath={`url(#${bodyClipId})`}>
            <rect x="80" y="66" width="20" height="54" fill="#ffe500" />
            <rect x="80" y="120" width="20" height="70" fill="#050505" />
          </g>
        );
      case "west":
        return (
          <g clipPath={`url(#${bodyClipId})`}>
            <rect x="80" y="66" width="20" height="40" fill="#ffe500" />
            <rect x="80" y="106" width="20" height="41" fill="#050505" />
            <rect x="80" y="147" width="20" height="43" fill="#ffe500" />
          </g>
        );
      case "east":
        return (
          <g clipPath={`url(#${bodyClipId})`}>
            <rect x="80" y="66" width="20" height="40" fill="#050505" />
            <rect x="80" y="106" width="20" height="41" fill="#ffe500" />
            <rect x="80" y="147" width="20" height="43" fill="#050505" />
          </g>
        );
      case "isolated-danger":
        return (
          <g clipPath={`url(#${bodyClipId})`}>
            <rect x="80" y="66" width="20" height="40" fill="#050505" />
            <rect x="80" y="106" width="20" height="42" fill="#ef2929" />
            <rect x="80" y="148" width="20" height="42" fill="#050505" />
          </g>
        );
      case "safe-water":
        return (
          <path d="M81 58h18v122q0 9-9 9t-9-9Z" fill="#ed1738" />
        );
      case "special":
        return (
          <path d="M81 57h18v123q0 9-9 9t-9-9Z" fill="#f5d90a" />
        );
    }
  })();

  const topMark = (() => {
    switch (kind) {
      case "port":
        return (
          <g>
            <rect x="70" y="38" width="40" height="35" rx="1.5" fill="#ef2929" />
            <path d="M75 43h30" stroke="#fca5a5" strokeOpacity=".45" strokeWidth="2" />
          </g>
        );
      case "starboard":
        return (
          <path
            d="M90 34 59 75h62Z"
            fill="#55b950"
            stroke="#86efac"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        );
      case "north":
        return (
          <g {...darkMarkProps}>
            <path d="M90 42 67 72h46Z" />
            <path d="M90 14 67 44h46Z" />
          </g>
        );
      case "south":
        return (
          <g {...darkMarkProps}>
            <path d="M67 14h46L90 44Z" />
            <path d="M67 42h46L90 72Z" />
          </g>
        );
      case "west":
        return (
          <g {...darkMarkProps}>
            <path d="M65 15h50L90 48Z" />
            <path d="M90 48 65 81h50Z" />
          </g>
        );
      case "east":
        return (
          <g {...darkMarkProps}>
            <path d="M90 14 65 48h50Z" />
            <path d="M65 48h50L90 82Z" />
          </g>
        );
      case "isolated-danger":
        return (
          <circle cx="90" cy="39" r="22" {...darkMarkProps} />
        );
      case "safe-water":
        return (
          <circle cx="90" cy="39" r="21" fill="#ed1738" stroke="#fda4af" strokeWidth="1" />
        );
      case "special":
        return (
          <path
            d="m66 17 15 23-15 23 24-14 24 14-15-23 15-23-24 14Z"
            fill="#f5d90a"
            stroke="#fef08a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        );
    }
  })();

  return (
    <svg
      viewBox="0 0 180 210"
      role="img"
      aria-label={`${name}, päivämerkki`}
      className="h-52 w-full"
    >
      <defs>
        <clipPath id={bodyClipId}>
          <path d="M80 65h20v115q0 10-10 10t-10-10Z" />
        </clipPath>
        <filter id={`top-shadow-${kind}`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#020617" floodOpacity=".45" />
        </filter>
      </defs>
      <ellipse cx="90" cy="190" rx="30" ry="4" fill="#020617" opacity=".24" />
      <path d="M43 193q16-6 32 0t32 0 32 0" fill="none" stroke="#38bdf8" strokeOpacity=".2" />
      {body}
      {["north", "south", "east", "west", "isolated-danger"].includes(kind) && (
        <path
          d="M80 65h20v115q0 10-10 10t-10-10V65Z"
          fill="none"
          stroke="#cbd5e1"
          strokeOpacity=".5"
          strokeWidth="1"
        />
      )}
      <path
        d="M85 71v105"
        stroke="#fff"
        strokeOpacity=".12"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g filter={`url(#top-shadow-${kind})`}>{topMark}</g>
    </svg>
  );
}

function BuoyCard({ b }: { b: BuoyType }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-amber-300/40 hover:bg-white/8">
      <div className="relative border-b border-white/10 bg-[#091428] px-4 pt-3">
        <BuoyIllustration kind={b.kind} name={b.name} />
        <span className="absolute left-4 top-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Päivämerkki
        </span>
      </div>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {b.lights.map((col, i) => (
            <LightDot
              key={i}
              color={col}
              animClass={b.animClass}
              size="md"
              animateOnCardHover
            />
          ))}
          <span className="ml-1 text-xs text-slate-500">Yövalo</span>
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
    </div>
  );
}

interface BuilderPattern {
  notation: string;
  name: string;
  color: string;
  colorLabel: string;
  period: number;
  pulses: Array<{ start: number; end: number }>;
  steady?: boolean;
}

const builderColors: Record<
  string,
  Pick<BuilderPattern, "color" | "colorLabel">
> = {
  P: { color: "#ef4444", colorLabel: "punainen" },
  V: { color: "#22c55e", colorLabel: "vihreä" },
  K: { color: "#f59e0b", colorLabel: "keltainen" },
};

function quickPulses(count: number, includeLongFlash = false) {
  const pulses = Array.from({ length: count }, (_, index) => ({
    start: index,
    end: index + 0.3,
  }));

  if (includeLongFlash) {
    pulses.push({ start: count, end: count + 2 });
  }

  return pulses;
}

function groupedPulses(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    start: index * 0.8,
    end: index * 0.8 + 0.4,
  }));
}

function combinedGroupedPulses(firstGroup: number, secondGroup: number) {
  const secondGroupStart = firstGroup * 0.8 + 1.2;

  return [
    ...groupedPulses(firstGroup),
    ...groupedPulses(secondGroup).map((pulse) => ({
      start: pulse.start + secondGroupStart,
      end: pulse.end + secondGroupStart,
    })),
  ];
}

function parseLightPattern(value: string): BuilderPattern | null {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, " ");
  const colorMatch = normalized.match(/\s+(P|V|K)$/);
  const notation = (colorMatch
    ? normalized.slice(0, colorMatch.index).trim()
    : normalized
  ).replace(/\s/g, "");
  const color = colorMatch
    ? builderColors[colorMatch[1]]
    : { color: "#f8fafc", colorLabel: "valkoinen" };
  const base = { ...color, pulses: [] as Array<{ start: number; end: number }> };

  if (notation === "KI") {
    return {
      ...base,
      notation: "Ki",
      name: "Kiinteä",
      period: 1,
      steady: true,
    };
  }

  if (notation === "T") {
    return {
      ...base,
      notation: "T",
      name: "Tasarytmivalo",
      period: 2,
      pulses: [{ start: 0, end: 1 }],
    };
  }

  if (notation === "KA") {
    return {
      ...base,
      notation: "Ka",
      name: "Katkovalo",
      period: 3,
      pulses: [{ start: 0, end: 2.25 }],
    };
  }

  if (notation === "KV") {
    return {
      ...base,
      notation: "KV",
      name: "Kestovilkku",
      period: 10,
      pulses: [{ start: 0, end: 2 }],
    };
  }

  if (notation === "MO(A)") {
    return {
      ...base,
      notation: "Mo(A)",
      name: "Morsekoodi A",
      period: 6,
      pulses: [
        { start: 0, end: 0.5 },
        { start: 1, end: 2.5 },
      ],
    };
  }

  const combinedQuickMatch = notation.match(/^PV\((\d{1,2})\)\+KV$/);
  if (combinedQuickMatch) {
    const count = Number(combinedQuickMatch[1]);

    if (count < 1 || count > 12) {
      return null;
    }

    return {
      ...base,
      notation: `Pv(${count})+KV`,
      name: `${count} pikavilkkua ja kestovilkku`,
      period: count <= 3 ? 10 : 15,
      pulses: quickPulses(count, true),
    };
  }

  const quickMatch = notation.match(/^PV(?:\((\d{1,2})\))?$/);
  if (quickMatch) {
    const count = quickMatch[1] ? Number(quickMatch[1]) : 1;

    if (count < 1 || count > 12) {
      return null;
    }

    const period =
      count === 1 ? 1 : count === 3 ? 10 : count >= 6 ? 15 : count * 2;
    return {
      ...base,
      notation: count === 1 ? "Pv" : `Pv(${count})`,
      name: count === 1 ? "Jatkuva pikavilkku" : `Ryhmäpikavilkku (${count})`,
      period,
      pulses: quickPulses(count),
    };
  }

  const combinedFlashMatch = notation.match(/^V\((\d{1,2})\+(\d{1,2})\)$/);
  if (combinedFlashMatch) {
    const firstGroup = Number(combinedFlashMatch[1]);
    const secondGroup = Number(combinedFlashMatch[2]);

    if (
      firstGroup < 1 ||
      firstGroup > 12 ||
      secondGroup < 1 ||
      secondGroup > 12
    ) {
      return null;
    }

    return {
      ...base,
      notation: `V(${firstGroup}+${secondGroup})`,
      name: `Yhdistetty ryhmävilkkuvalo (${firstGroup}+${secondGroup})`,
      period: Math.max(7, (firstGroup + secondGroup) * 2 + 1),
      pulses: combinedGroupedPulses(firstGroup, secondGroup),
    };
  }

  const flashMatch = notation.match(/^V(?:\((\d{1,2})\))?$/);
  if (flashMatch) {
    const count = flashMatch[1] ? Number(flashMatch[1]) : 1;

    if (count < 1 || count > 12) {
      return null;
    }

    return {
      ...base,
      notation: count === 1 ? "V" : `V(${count})`,
      name: count === 1 ? "Vilkkuvalo" : `Ryhmävilkkuvalo (${count})`,
      period: count === 1 ? 3 : count === 2 ? 5 : Math.max(7, count * 2),
      pulses: groupedPulses(count),
    };
  }

  return null;
}

function LightBuilder() {
  const [description, setDescription] = useState("Pv(6)+KV");
  const pattern = parseLightPattern(description);

  const keyframes =
    pattern && !pattern.steady
      ? pattern.pulses
          .map((pulse) => {
            const start = (pulse.start / pattern.period) * 100;
            const end = (pulse.end / pattern.period) * 100;
            const off = Math.min(end + 0.01, 99.99);
            const beforeStart =
              pulse.start === 0
                ? ""
                : `${Math.max(start - 0.01, 0).toFixed(3)}% { opacity: 0.04; transform: scale(0.92); }`;

            return `${beforeStart}
          ${start.toFixed(3)}% { opacity: 1; transform: scale(1); }
          ${end.toFixed(3)}% { opacity: 1; transform: scale(1); }
          ${off.toFixed(3)}% { opacity: 0.04; transform: scale(0.92); }`;
          })
          .join("\n")
      : "";

  return (
    <section id="light-builder" className="bg-[#0f2140] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Harjoittele
          </p>
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            Valojen rakentaja
          </h2>
          <p className="mt-4 text-slate-300">
            Kirjoita IALA-loiston lyhenne ja halutessasi värikoodi. Valo
            vaihtaa rytmiä ja väriä välittömästi merkinnän mukaan.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Esimerkki: voit määrittää pikavilkkujen määrän merkinnällä{" "}
            <span className="font-mono text-amber-300">Pv(n)</span> ja liittää
            siihen erillisen kestovilkun plusmerkillä:{" "}
            <span className="font-mono text-amber-300">Pv(n)+KV</span>.
            Esimerkiksi{" "}
            <span className="font-mono text-white">Pv(6)+KV</span> tarkoittaa
            kuutta pikavilkkua ja yhtä kestovilkkua.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="relative flex min-h-80 items-center justify-center overflow-hidden bg-black px-6 py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(30,41,59,0.45) 0%, rgba(0,0,0,0) 48%)",
              }}
            />
            {pattern && !pattern.steady ? (
              <>
                <style>{`
                  @keyframes builder-light-pattern {
                    ${keyframes}
                    100% { opacity: 0.04; transform: scale(0.92); }
                  }
                `}</style>
                <span
                  key={`${pattern.notation}-${pattern.color}`}
                  role="img"
                  aria-label={`${pattern.colorLabel} valo, ${pattern.name}, ${pattern.period} sekunnin jakso`}
                  className="relative block h-16 w-16 rounded-full"
                  style={{
                    animation: `builder-light-pattern ${pattern.period}s linear infinite`,
                    backgroundColor: pattern.color,
                    boxShadow:
                      `0 0 24px 10px ${pattern.color}cc, 0 0 80px 30px ${pattern.color}55`,
                  }}
                />
              </>
            ) : pattern ? (
              <span
                role="img"
                aria-label={`${pattern.colorLabel} kiinteä valo`}
                className="relative block h-16 w-16 rounded-full"
                style={{
                  backgroundColor: pattern.color,
                  boxShadow: `0 0 24px 10px ${pattern.color}cc, 0 0 80px 30px ${pattern.color}55`,
                }}
              />
            ) : (
              <span
                aria-label="Valo ei vilku, koska rytmiä ei voitu tulkita"
                className="relative block h-16 w-16 rounded-full bg-white opacity-[0.04]"
              />
            )}
            <span className="absolute bottom-5 left-0 right-0 text-center font-mono text-xs uppercase tracking-[0.18em] text-slate-600">
              Valon esikatselu
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <label
              htmlFor="light-pattern"
              className="block text-sm font-semibold text-white"
            >
              IALA-lyhenne
            </label>
            <input
              id="light-pattern"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Esim. Pv(6)+KV"
              aria-describedby="light-pattern-help"
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#091428] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/10"
            />
            <div
              id="light-pattern-help"
              className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              {pattern ? (
                <p className="text-slate-400">
                  Tulkittu valo:{" "}
                  <span className="font-mono text-amber-300">
                    {pattern.notation} · {pattern.colorLabel} ·{" "}
                    {pattern.steady ? "jatkuva" : `${pattern.period} s`}
                  </span>
                </p>
              ) : (
                <p className="text-red-300">
                  Merkintää ei tunnistettu. Kokeile esimerkiksi Pv(6)+KV.
                </p>
              )}
              <p className="text-xs text-slate-500">
                Värit: P punainen · V vihreä · K keltainen · ilman koodia
                valkoinen
              </p>
            </div>
            <p className="mt-4 border-t border-white/10 pt-4 font-mono text-xs leading-relaxed text-slate-500">
              Tuetut rytmit: Ki · Ka · T · V · V(n) · V(n+n) · Pv · Pv(n) ·
              Pv(n)+KV · KV · Mo(A)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
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
              { label: "IALA-alue", value: "1", sub: "Alue A" },
              { label: "Loistotyypit", value: "12+", sub: "Ki · V · Ka · T · Pv · Mo …" },
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

      {/* IALA-A */}
      <section id="rules" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 mb-2">
              Osio 3
            </p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              IALA-A-alue
            </h2>
            <p className="mt-4 text-slate-300">
              IALA-A-alueella punainen lateraalimerkki osoittaa väylän
              paapuuripuolen ja vihreä lateraalimerkki styyrpuuripuolen
              kulkusuunnassa.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {([
              {
                side: "Paapuuri (vasen)",
                color: "#ef4444",
                label: "Punainen",
                description:
                  "Eurooppa, Afrikka, Aasia (pl. Japani/Korea/Filippiinit), Australia, Uusi-Seelanti, Persianlahden maat.",
              },
              {
                side: "Styyrpuuri (oikea)",
                color: "#22c55e",
                label: "Vihreä",
                description: "Vihreä kartiopoiju. Vihreä valo (mikä tahansa tyyppi).",
              },
            ] as LateralRow[]).map((row) => (
              <div
                key={row.side}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/40 hover:bg-white/8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <LightDot
                    color={row.color}
                    animClass="light-flash-single"
                    size="lg"
                    animateOnCardHover
                  />
                  <div>
                    <p className="text-xs text-slate-400">Lateraalimerkki</p>
                    <p className="font-serif text-xl font-semibold">{row.side}</p>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Väri alueella IALA-A
                    </dt>
                    <dd className="mt-0.5 text-slate-300">{row.label}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Kattavuus
                    </dt>
                    <dd className="mt-0.5 text-slate-300">{row.description}</dd>
                  </div>
                </dl>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300 mb-3">
                Muistisääntö
              </p>
              <p className="font-serif text-xl font-semibold mb-3">
                "Punainen paapuuriin, vihreä styyrpuuriin"
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                IALA-A-vesillä (Eurooppa, Afrikka, suurin osa Aasiasta)
                punainen poiju merkitsee aina väylän paapuuripuolen
                kulkusuunnassa — yleensä kohti satamaa tai ylävirtaan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LightBuilder />
    </div>
  );
}

