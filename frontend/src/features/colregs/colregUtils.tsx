import type { ReactElement } from "react";

export type Rule = 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;
export type Color = "white" | "red" | "green" | "yellow";
export type Vec3 = readonly [x: number, y: number, z: number];
export type Side = "port" | "starboard";
export type State = "making-way" | "stopped" | "anchored";
export type Shape =
  | "ball"
  | "diamond"
  | "cone-up"
  | "cone-down"
  | "cones-apexes-together"
  | "cylinder"
  | "alpha-flag";
export type Sector = Readonly<{ center: number; width: number }>;
export interface Light {
  readonly id: string;
  readonly color: Color;
  readonly position: Vec3;
  readonly sector: Sector;
  readonly flash?: { readonly periodMs: number; readonly onMs: number; readonly phaseMs: number };
  readonly highIntensity?: boolean;
}
export interface DayShape {
  readonly id: string;
  readonly shape: Shape;
  readonly position: Vec3;
}
export interface Display {
  readonly rule: Rule;
  readonly lights: readonly Light[];
  readonly shapes: readonly DayShape[];
  readonly notes: readonly string[];
  readonly deckLighting: boolean;
}

type Power = { readonly secondMasthead?: boolean };
type Anchor = { readonly twoAnchorLights?: boolean; readonly illuminateDeck?: boolean };
type Sail = { readonly rig?: "separate" | "tricolor" | "red-over-green" };
type Tow = Power & { readonly towLengthM: number };
type Ordinary =
  | ({ readonly propulsion: "power" } & Power)
  | ({ readonly propulsion: "sail" } & Sail);
type FishingMotion = { readonly state: State };

/** Optional choices select permitted alternatives; required lights cannot be disabled. */
export type Scenario = { readonly lengthM: number } & (
  | ({ readonly rule: 23; readonly kind: "power" | "air-cushion" | "wig" } & Power)
  | { readonly rule: 23; readonly kind: "under-12-all-round"; readonly offsetWhiteX?: number }
  | {
      readonly rule: 23;
      readonly kind: "under-7-slow";
      readonly maximumSpeedKnots: number;
      readonly sidelightsPracticable: boolean;
    }
  | ({ readonly rule: 24; readonly kind: "towing-astern" } & Tow)
  | ({ readonly rule: 24; readonly kind: "pushing" | "towing-alongside" | "composite" } & Power)
  | { readonly rule: 24; readonly kind: "towed"; readonly towLengthM: number }
  | { readonly rule: 24; readonly kind: "pushed" | "towed-alongside" }
  | {
      readonly rule: 24;
      readonly kind: "submerged-tow";
      readonly breadthM: number;
      readonly towLengthM: number;
      readonly dracone?: boolean;
    }
  | { readonly rule: 24; readonly kind: "tow-display-impracticable" }
  | ({ readonly rule: 24; readonly kind: "assistance-tow-impracticable" } & Power)
  | ({ readonly rule: 25; readonly kind: "sailing" } & Sail)
  | { readonly rule: 25; readonly kind: "small-sail-torch" | "oars-torch" }
  | ({ readonly rule: 25; readonly kind: "oars-sailing-lights" } & Sail)
  | ({ readonly rule: 25; readonly kind: "motor-sailing" } & Power)
  | ({
      readonly rule: 26;
      readonly kind: "trawling";
      readonly aftMasthead?: boolean;
      /** Set only for fishing in close proximity (26(d), Annex II). */
      readonly netSignal?: "shooting" | "hauling" | "fast";
      readonly pairTrawling?: boolean;
    } & FishingMotion)
  | ({
      readonly rule: 26;
      readonly kind: "fishing";
      readonly gear?: { readonly extentM: number; readonly bearingDeg: number };
      /** Optional Annex II display; only when hampered by purse-seine gear. */
      readonly purseSeineHampered?: boolean;
    } & FishingMotion)
  | ({ readonly rule: 26; readonly kind: "not-fishing" } & Ordinary)
  | { readonly rule: 27; readonly kind: "nuc"; readonly makingWay: boolean }
  | ({ readonly rule: 27; readonly kind: "ram"; readonly state: State } & Power & Anchor)
  | ({ readonly rule: 27; readonly kind: "restricted-towing" } & Tow)
  | ({
      readonly rule: 27;
      readonly kind: "dredging";
      readonly state: State;
      readonly obstructionSide?: Side;
    } & Power)
  | { readonly rule: 27; readonly kind: "diving-small" }
  | ({ readonly rule: 27; readonly kind: "mine-clearance"; readonly state: State } & Power & Anchor)
  | { readonly rule: 27; readonly kind: "under-12-exemption" }
  | ({
      readonly rule: 28;
      readonly kind: "constrained-draught";
      readonly showOptionalSignal?: boolean;
    } & Power)
  | ({
      readonly rule: 29;
      readonly kind: "pilot";
      readonly state: "underway" | "anchored";
    } & Anchor)
  | ({ readonly rule: 29; readonly kind: "off-duty" } & Ordinary)
  | ({ readonly rule: 30; readonly kind: "anchored" } & Anchor)
  | ({
      readonly rule: 30;
      readonly kind: "aground";
      readonly signalsPracticable?: boolean;
      readonly showOptionalUnder12Signals?: boolean;
    } & Anchor)
  | { readonly rule: 30; readonly kind: "under-7-anchor-exemption" }
);

const ALL: Sector = { center: 0, width: 360 };
const FORWARD: Sector = { center: 0, width: 225 };
const AFT: Sector = { center: 180, width: 135 };
const PORT: Sector = { center: 303.75, width: 112.5 };
const STARBOARD: Sector = { center: 56.25, width: 112.5 };
const P = {
  fore: [0, 20, 34],
  aft: [0, -20, 46],
  stern: [0, -40, 6],
  signal: [0, 0, 26],
  anchorFore: [0, 35, 30],
  anchorAft: [0, -35, 12],
} as const satisfies Record<string, Vec3>;
const GAP = 6;
const positive = (n: number) => Number.isFinite(n) && n > 0;
const requireThat: (ok: boolean, message: string) => asserts ok = (ok, message) => {
  if (!ok) throw new RangeError(message);
};
const light = (id: string, color: Color, position: Vec3, sector = ALL): Light => ({
  id,
  color,
  position,
  sector,
});
const shape = (id: string, kind: Shape, position: Vec3): DayShape => ({
  id,
  shape: kind,
  position,
});
const stack = (
  id: string,
  colors: readonly Color[],
  [x, y, z]: Vec3 = P.signal,
  sector = ALL,
): Light[] => colors.map((color, i) => light(`${id}-${i}`, color, [x, y, z - i * GAP], sector));
const shapes = (id: string, kinds: readonly Shape[], [x, y, z]: Vec3 = P.signal): DayShape[] =>
  kinds.map((kind, i) => shape(`${id}-${i}`, kind, [x, y, z - i * GAP]));
const sides = (forward = 10, combined = false): Light[] => [
  light("port", "red", [combined ? 0 : -10, forward, 6], PORT),
  light("starboard", "green", [combined ? 0 : 10, forward, 6], STARBOARD),
];
const stern = () => light("stern", "white", P.stern, AFT);
const running = () => [...sides(), stern()];
const power = (length: number, second = false): Light[] => [
  light("masthead-forward", "white", P.fore, FORWARD),
  ...(length >= 50 || second ? [light("masthead-aft", "white", P.aft, FORWARD)] : []),
  ...running(),
];
const anchorLights = (length: number, two = false): Light[] =>
  length >= 50 || two
    ? [light("anchor-forward", "white", P.anchorFore), light("anchor-aft", "white", P.anchorAft)]
    : [light("anchor", "white", P.anchorFore)];
const towing = (length: number, towLength: number, second = false): Light[] => {
  requireThat(positive(towLength), "towLengthM must be positive.");
  return [
    ...stack(
      "towing-masthead",
      towLength > 200 ? ["white", "white", "white"] : ["white", "white"],
      P.fore,
      FORWARD,
    ),
    ...(length >= 50 || second ? [light("masthead-aft", "white", P.aft, FORWARD)] : []),
    ...running(),
    light("towing", "yellow", [0, -40, 12], AFT),
  ];
};
function sailing(length: number, rig: Sail["rig"] = "separate"): Light[] {
  if (rig === "tricolor") {
    requireThat(length < 20, "The combined mast-top lantern requires length < 20 m.");
    const position: Vec3 = [0, 0, 34];
    return [
      light("port", "red", position, PORT),
      light("starboard", "green", position, STARBOARD),
      light("stern", "white", position, AFT),
    ];
  }
  return [
    ...running(),
    ...(rig === "red-over-green" ? stack("sailing", ["red", "green"], [0, 0, 34]) : []),
  ];
}

export function buildDisplay(s: Scenario): Display {
  requireThat(positive(s.lengthM), "lengthM must be a positive finite number.");
  const lights: Light[] = [],
    day: DayShape[] = [],
    notes: string[] = [];
  let deckLighting = false;
  const addAnchor = (options: Anchor = {}, includeBall = true) => {
    lights.push(...anchorLights(s.lengthM, options.twoAnchorLights));
    if (includeBall) day.push(shape("anchor-ball", "ball", P.anchorFore));
    deckLighting = s.lengthM >= 100 || !!options.illuminateDeck;
  };
  const addRam = () => {
    lights.push(...stack("ram", ["red", "white", "red"]));
    day.push(...shapes("ram", ["ball", "diamond", "ball"]));
  };
  const addTow = (options: Tow) => {
    lights.push(...towing(s.lengthM, options.towLengthM, options.secondMasthead));
    if (options.towLengthM > 200) day.push(shape("tow-diamond", "diamond", [0, 20, 26]));
  };
  switch (s.rule) {
    case 23:
      if (s.kind === "under-12-all-round") {
        requireThat(s.lengthM < 12, "23(d)(i) requires length < 12 m.");
        const x = s.offsetWhiteX ?? 0;
        requireThat(Number.isFinite(x), "offsetWhiteX must be finite.");
        lights.push(light("all-round-white", "white", [x, 20, 34]), ...sides(10, x !== 0));
        if (x !== 0)
          notes.push(
            "23(d)(iii): offset fitting only if centreline fitting is impracticable; use combined sidelights.",
          );
      } else if (s.kind === "under-7-slow") {
        requireThat(
          s.lengthM < 7 && s.maximumSpeedKnots >= 0 && s.maximumSpeedKnots <= 7,
          "23(d)(ii) requires length < 7 m and maximum speed <= 7 knots.",
        );
        lights.push(light("all-round-white", "white", P.fore));
        if (s.sidelightsPracticable) lights.push(...sides());
        notes.push("Sidelights must also be shown if practicable.");
      } else {
        lights.push(...power(s.lengthM, s.secondMasthead));
        if (s.kind !== "power") {
          lights.push({
            ...light("special-flash", s.kind === "wig" ? "red" : "yellow", [0, -12, 54]),
            flash: { periodMs: 500, onMs: 250, phaseMs: 0 },
            highIntensity: s.kind === "wig",
          });
          notes.push(
            s.kind === "wig"
              ? "23(c): take-off, landing or flight near the surface only."
              : "23(b): air-cushion vessel in non-displacement mode only.",
          );
        }
      }
      break;
    case 24:
      switch (s.kind) {
        case "towing-astern":
          addTow(s);
          break;
        case "pushing":
        case "towing-alongside":
          lights.push(...towing(s.lengthM, 200, s.secondMasthead).filter((l) => l.id !== "towing"));
          break;
        case "composite":
          lights.push(...power(s.lengthM, s.secondMasthead));
          notes.push("24(b): rigid composite unit; lengthM is the length of the unit.");
          break;
        case "towed":
          requireThat(positive(s.towLengthM), "towLengthM must be positive.");
          lights.push(...running());
          if (s.towLengthM > 200) day.push(shape("tow-diamond", "diamond", P.signal));
          break;
        case "pushed":
          lights.push(...sides(38));
          break;
        case "towed-alongside":
          lights.push(...sides(38), stern());
          break;
        case "submerged-tow": {
          requireThat(
            positive(s.breadthM) && positive(s.towLengthM),
            "Breadth and tow length must be positive.",
          );
          // Compress physical dimensions to a common drawing frame. Longitudinal
          // marker count is derived from metres; intermediate gaps are <= 100 m.
          const segments = Math.ceil(s.lengthM / 100);
          for (let i = 0; i <= segments; i++) {
            if (i === 0 && s.dracone) continue;
            lights.push(light(`tow-end-${i}`, "white", [0, 40 - (80 * i) / segments, 6]));
          }
          if (s.breadthM >= 25)
            lights.push(
              light("tow-port", "white", [-16, 0, 6]),
              light("tow-starboard", "white", [16, 0, 6]),
            );
          day.push(shape("tow-aft-diamond", "diamond", [0, -40, 14]));
          if (s.towLengthM > 200) day.push(shape("tow-forward-diamond", "diamond", [0, 40, 14]));
          notes.push(
            "24(g): represents the last object or the combined tow; dimensions refer to that object/group.",
          );
          break;
        }
        case "tow-display-impracticable":
          notes.push(
            "24(h): take all possible measures to light the tow or indicate its presence; no fixed substitute light pattern.",
          );
          break;
        case "assistance-tow-impracticable":
          lights.push(...power(s.lengthM, s.secondMasthead));
          notes.push(
            "24(i): only for a vessel not normally towing, assisting a vessel in distress/need, when towing lights are impracticable. Indicate the relationship, particularly by illuminating the towline.",
          );
          break;
      }
      notes.push(
        "24(f): vessels pushed/towed alongside in a group are lighted as one vessel. Tow length is measured from towing vessel stern to the far end of the tow.",
      );
      break;
    case 25:
      switch (s.kind) {
        case "sailing":
        case "oars-sailing-lights":
          lights.push(...sailing(s.lengthM, s.rig));
          break;
        case "small-sail-torch":
          requireThat(s.lengthM < 7, "25(d)(i) requires length < 7 m.");
          notes.push("Use the normal sailing lights if practicable.");
          notes.push(
            "Keep a white torch/lantern ready; exhibit in time to prevent collision. Not a permanent all-round light.",
          );
          break;
        case "oars-torch":
          notes.push(
            "25(d)(ii): keep a white torch/lantern ready; exhibit in time to prevent collision.",
          );
          break;
        case "motor-sailing":
          lights.push(...power(s.lengthM, s.secondMasthead));
          day.push(shape("motoring-cone", "cone-down", [0, 25, 26]));
          notes.push(
            "25(e): cone forward by day; propulsion by machinery means Rule 23 lights at night.",
          );
          break;
      }
      break;
    case 26:
      if (s.kind === "not-fishing") {
        lights.push(
          ...(s.propulsion === "power"
            ? power(s.lengthM, s.secondMasthead)
            : sailing(s.lengthM, s.rig)),
        );
        notes.push(
          "26(e): ordinary underway display, with no fishing signals. For anchor/grounded state use Rule 30.",
        );
        break;
      }
      lights.push(...stack("fishing", [s.kind === "trawling" ? "green" : "red", "white"]));
      day.push(shape("fishing-cones", "cones-apexes-together", P.signal));
      if (s.state === "making-way") lights.push(...running());
      if (s.kind === "trawling") {
        if (s.lengthM >= 50 || s.aftMasthead)
          lights.push(light("trawling-masthead", "white", P.aft, FORWARD));
        if (s.netSignal) {
          const colors = {
            shooting: ["white", "white"],
            hauling: ["white", "red"],
            fast: ["red", "red"],
          } as const;
          lights.push(...stack("net", colors[s.netSignal], [12, 0, 14]));
          notes.push(
            "26(d), Annex II: additional net signals in close proximity; compulsory at >= 20 m, permitted below 20 m. Range >= 1 mile and less than the main fishing lights.",
          );
        }
        if (s.pairTrawling)
          notes.push(
            "Annex II: night searchlight forward and toward the other trawler; compulsory at >= 20 m, permitted below 20 m. Not represented as an all-round light.",
          );
      } else {
        if (s.gear) {
          requireThat(
            Number.isFinite(s.gear.extentM) &&
              s.gear.extentM >= 0 &&
              Number.isFinite(s.gear.bearingDeg),
            "Invalid gear extent/bearing.",
          );
          if (s.gear.extentM > 150) {
            const a = (s.gear.bearingDeg * Math.PI) / 180;
            const position: Vec3 = [20 * Math.sin(a), 20 * Math.cos(a), 20];
            lights.push(light("gear", "white", position));
            day.push(shape("gear-cone", "cone-up", position));
          }
        }
        if (s.purseSeineHampered) {
          lights.push(
            ...stack("purse-seine", ["yellow", "yellow"], [12, 0, 14]).map((l, i) => ({
              ...l,
              flash: { periodMs: 2000, onMs: 1000, phaseMs: i * 1000 },
            })),
          );
          notes.push(
            "26(d), Annex II: optional alternating yellow signals, only while hampered by purse-seine gear; range >= 1 mile and less than main fishing lights.",
          );
        }
      }
      notes.push(
        "26(a): these fishing signals also apply at anchor; do not add ordinary anchor lights.",
      );
      break;
    case 27:
      switch (s.kind) {
        case "nuc":
          lights.push(...stack("nuc", ["red", "red"]));
          day.push(...shapes("nuc", ["ball", "ball"]));
          if (s.makingWay) lights.push(...running());
          break;
        case "ram":
          addRam();
          if (s.state === "making-way") lights.push(...power(s.lengthM, s.secondMasthead));
          if (s.state === "anchored") addAnchor(s);
          break;
        case "restricted-towing":
          addRam();
          addTow(s);
          break;
        case "dredging": {
          addRam();
          if (s.state === "making-way") lights.push(...power(s.lengthM, s.secondMasthead));
          if (s.obstructionSide) {
            const x = s.obstructionSide === "starboard" ? 16 : -16;
            lights.push(
              ...stack("obstruction", ["red", "red"], [x, 0, 18]),
              ...stack("passage", ["green", "green"], [-x, 0, 18]),
            );
            day.push(
              ...shapes("obstruction", ["ball", "ball"], [x, 0, 18]),
              ...shapes("passage", ["diamond", "diamond"], [-x, 0, 18]),
            );
          }
          notes.push("27(d): at anchor this display replaces the Rule 30 anchor signals.");
          break;
        }
        case "diving-small":
          lights.push(...stack("diving", ["red", "white", "red"]));
          day.push(shape("diving-flag", "alpha-flag", P.signal));
          notes.push(
            "27(e): only when vessel size makes the full 27(d) display impracticable. Rigid Alpha flag >= 1 m high, visible all round.",
          );
          break;
        case "mine-clearance":
          if (s.state === "anchored") addAnchor(s);
          else lights.push(...power(s.lengthM, s.secondMasthead));
          for (const [i, position] of (
            [
              [0, 20, 54],
              [-16, 20, 46],
              [16, 20, 46],
            ] as const
          ).entries()) {
            lights.push(light(`mine-${i}`, "green", position));
            day.push(shape(`mine-${i}`, "ball", position));
          }
          notes.push("27(f): danger within 1000 m.");
          break;
        case "under-12-exemption":
          requireThat(s.lengthM < 12, "27(g) requires length < 12 m.");
          notes.push(
            "27(g): Rule 27 lights/shapes are not required below 12 m, except when diving. This empty display encodes only that exemption, not duties under other rules.",
          );
          break;
      }
      if (s.lengthM < 12 && s.kind !== "diving-small")
        notes.push("27(g): below 12 m these signals are optional unless engaged in diving.");
      notes.push("27(h): these are not distress signals.");
      break;
    case 28:
      lights.push(...power(s.lengthM, s.secondMasthead));
      if (s.showOptionalSignal !== false) {
        lights.push(...stack("draught", ["red", "red", "red"]));
        day.push(shape("draught-cylinder", "cylinder", P.signal));
      }
      notes.push(
        "28: additional draught signals are optional; applies to a vessel constrained by her draught.",
      );
      break;
    case 29:
      if (s.kind === "off-duty") {
        lights.push(
          ...(s.propulsion === "power"
            ? power(s.lengthM, s.secondMasthead)
            : sailing(s.lengthM, s.rig)),
        );
        notes.push("29(b): ordinary underway display; for anchor/grounded state use Rule 30.");
      } else {
        lights.push(...stack("pilot", ["white", "red"], [0, 0, 34]));
        if (s.state === "underway") lights.push(...running());
        else addAnchor(s);
      }
      break;
    case 30:
      if (s.kind === "under-7-anchor-exemption") {
        requireThat(s.lengthM < 7, "30(e) requires length < 7 m.");
        notes.push(
          "30(e): only away from narrow channels, fairways and places where vessels normally navigate.",
        );
      } else if (s.kind === "anchored") addAnchor(s);
      else {
        addAnchor(s, false); // Three balls replace the anchor ball by day.
        // 30(d) incorporates (a)/(b), not the deck-illumination duty in (c).
        deckLighting = !!s.illuminateDeck;
        if ((s.lengthM >= 12 || s.showOptionalUnder12Signals) && s.signalsPracticable !== false) {
          lights.push(...stack("aground", ["red", "red"]));
          day.push(...shapes("aground", ["ball", "ball", "ball"]));
        }
        notes.push(
          "30(d),(f): additional aground signals if practicable; not required below 12 m. Anchor lights remain.",
        );
      }
      break;
    default:
      return assertNever(s);
  }
  return { rule: s.rule, lights, shapes: day, notes, deckLighting };
}
function assertNever(value: never): never {
  throw new Error(`Unknown scenario: ${JSON.stringify(value)}`);
}

/** Ideal nominal sectors, including shared endpoints; no real-world cutoff falloff. */
export function isVisible(sector: Sector, bearingDeg: number): boolean {
  requireThat(Number.isFinite(bearingDeg), "bearingDeg must be finite.");
  const difference = ((((bearingDeg - sector.center) % 360) + 540) % 360) - 180;
  return Math.abs(difference) <= sector.width / 2 + 1e-9;
}
export function isLit(l: Light, timeMs: number): boolean {
  requireThat(Number.isFinite(timeMs), "timeMs must be finite.");
  if (!l.flash) return true;
  const { periodMs, phaseMs, onMs } = l.flash;
  return (((timeMs + phaseMs) % periodMs) + periodMs) % periodMs < onMs;
}
export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}
/** Sea-level orthographic view; SVG y increases downward. */
export function project([x, y, z]: Vec3, bearingDeg: number): ProjectedPoint {
  requireThat(Number.isFinite(bearingDeg), "bearingDeg must be finite.");
  const a = (bearingDeg * Math.PI) / 180;
  return { x: -x * Math.cos(a) + y * Math.sin(a), y: -z, depth: x * Math.sin(a) + y * Math.cos(a) };
}
export function projectDisplay(display: Display, bearingDeg: number, timeMs = 0) {
  requireThat(
    Number.isFinite(bearingDeg) && Number.isFinite(timeMs),
    "Bearing/time must be finite.",
  );
  return {
    ...display,
    lights: display.lights
      .filter((l) => isVisible(l.sector, bearingDeg))
      .map((l) => ({ ...l, ...project(l.position, bearingDeg), on: isLit(l, timeMs) }))
      .sort((a, b) => a.depth - b.depth),
    shapes: display.shapes
      .map((s) => ({ ...s, ...project(s.position, bearingDeg) }))
      .sort((a, b) => a.depth - b.depth),
  };
}
const COLORS: Record<Color, string> = {
  white: "#fff9e8",
  red: "#ff4545",
  green: "#36ef86",
  yellow: "#ffd84d",
};
/** Dependency-free SVG string. Use projectDisplay for a React SVG component. */
export function renderSvg(
  scenario: Scenario,
  bearingDeg: number,
  timeMs = 0,
): ReactElement<any, any> {
  const view = projectDisplay(buildDisplay(scenario), bearingDeg, timeMs);
  const lit = view.lights.filter((l) => l.on);
  const circles = lit.map((l) => {
    // Combined sidelights share one position. At the exact bow boundary show
    // both halves: green to the observer's left, red to the right.
    const opposite = l.id === "port" ? "starboard" : l.id === "starboard" ? "port" : undefined;
    const combined =
      opposite &&
      lit.some(
        (other) => other.id === opposite && other.position.every((v, i) => v === l.position[i]),
      );
    if (combined) {
      const sweep = l.id === "port" ? 1 : 0;
      return (
        <path
          transform={`translate(${l.x} ${l.y})`}
          d={`M 0 -1.6 A 1.6 1.6 0 0 ${sweep} 0 1.6 Z`}
          fill={COLORS[l.color]}
        >
          <title>${l.id}</title>
        </path>
      );
    }
    return (
      <circle cx={l.x} cy={l.y} r="1.6" fill={COLORS[l.color]}>
        <title>${l.id}</title>
      </circle>
    );
  });
  return (
    <>
      <rect x="-60" y="-65" width="120" height="80" fill="#080f1d" />${circles}
    </>
  );
}

/** Starter catalogue. Change length/state/options to generate further variants. */
export const EXAMPLES = [
  { rule: 23, kind: "power", lengthM: 30 },
  { rule: 23, kind: "power", lengthM: 60 },
  { rule: 23, kind: "air-cushion", lengthM: 30 },
  { rule: 23, kind: "wig", lengthM: 30 },
  { rule: 23, kind: "under-12-all-round", lengthM: 10 },
  {
    rule: 23,
    kind: "under-7-slow",
    lengthM: 6,
    maximumSpeedKnots: 7,
    sidelightsPracticable: false,
  },
  { rule: 24, kind: "towing-astern", lengthM: 30, towLengthM: 200 },
  { rule: 24, kind: "towing-astern", lengthM: 60, towLengthM: 201 },
  { rule: 24, kind: "pushing", lengthM: 30 },
  { rule: 24, kind: "towing-alongside", lengthM: 30 },
  { rule: 24, kind: "composite", lengthM: 80 },
  { rule: 24, kind: "towed", lengthM: 30, towLengthM: 201 },
  { rule: 24, kind: "pushed", lengthM: 30 },
  { rule: 24, kind: "towed-alongside", lengthM: 30 },
  { rule: 24, kind: "submerged-tow", lengthM: 250, breadthM: 30, towLengthM: 300 },
  { rule: 24, kind: "submerged-tow", lengthM: 50, breadthM: 10, towLengthM: 150, dracone: true },
  { rule: 24, kind: "tow-display-impracticable", lengthM: 10 },
  { rule: 24, kind: "assistance-tow-impracticable", lengthM: 10 },
  { rule: 25, kind: "sailing", lengthM: 15 },
  { rule: 25, kind: "sailing", lengthM: 15, rig: "tricolor" },
  { rule: 25, kind: "sailing", lengthM: 15, rig: "red-over-green" },
  { rule: 25, kind: "small-sail-torch", lengthM: 6 },
  { rule: 25, kind: "oars-torch", lengthM: 6 },
  { rule: 25, kind: "oars-sailing-lights", lengthM: 6 },
  { rule: 25, kind: "motor-sailing", lengthM: 15 },
  { rule: 26, kind: "trawling", lengthM: 30, state: "stopped" },
  {
    rule: 26,
    kind: "trawling",
    lengthM: 60,
    state: "making-way",
    netSignal: "shooting",
    pairTrawling: true,
  },
  { rule: 26, kind: "fishing", lengthM: 30, state: "anchored" },
  {
    rule: 26,
    kind: "fishing",
    lengthM: 30,
    state: "making-way",
    gear: { extentM: 151, bearingDeg: 90 },
  },
  { rule: 26, kind: "fishing", lengthM: 30, state: "stopped", purseSeineHampered: true },
  { rule: 26, kind: "not-fishing", lengthM: 30, propulsion: "power" },
  { rule: 27, kind: "nuc", lengthM: 30, makingWay: true },
  { rule: 27, kind: "ram", lengthM: 60, state: "making-way" },
  { rule: 27, kind: "ram", lengthM: 60, state: "anchored" },
  { rule: 27, kind: "restricted-towing", lengthM: 60, towLengthM: 201 },
  { rule: 27, kind: "dredging", lengthM: 60, state: "anchored", obstructionSide: "port" },
  { rule: 27, kind: "diving-small", lengthM: 8 },
  { rule: 27, kind: "mine-clearance", lengthM: 60, state: "making-way" },
  { rule: 27, kind: "under-12-exemption", lengthM: 10 },
  { rule: 28, kind: "constrained-draught", lengthM: 150 },
  { rule: 29, kind: "pilot", lengthM: 20, state: "underway" },
  { rule: 29, kind: "pilot", lengthM: 20, state: "anchored" },
  { rule: 29, kind: "off-duty", lengthM: 20, propulsion: "power" },
  { rule: 30, kind: "anchored", lengthM: 30 },
  { rule: 30, kind: "anchored", lengthM: 100 },
  { rule: 30, kind: "aground", lengthM: 60 },
  { rule: 30, kind: "aground", lengthM: 10 },
  { rule: 30, kind: "under-7-anchor-exemption", lengthM: 6 },
] as const satisfies readonly Scenario[];
