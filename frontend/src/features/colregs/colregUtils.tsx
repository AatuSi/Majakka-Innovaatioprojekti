import type { ReactElement } from "react";

/* ===========================================================================
 * Domain model
 * ========================================================================== */

export type Rule = 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;
export type Color = "white" | "red" | "green" | "yellow";
/** Illustrative fixture position: x to starboard, y forward, z upward. */
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

/** Bearing sector in degrees clockwise from the bow, centred on `center`. */
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

/* ---------------------------------------------------------------------------
 * Scenarios
 *
 * Optional fields pick a permitted alternative from the Rules; mandatory
 * lights can never be switched off.
 * ------------------------------------------------------------------------- */

type PowerDrivenOptions = { readonly secondMasthead?: boolean };
type AnchorOptions = { readonly twoAnchorLights?: boolean; readonly illuminateDeck?: boolean };
type SailingRigOptions = { readonly rig?: "separate" | "tricolor" | "red-over-green" };
type TowingOptions = PowerDrivenOptions & { readonly towLengthM: number };
type OrdinaryVessel =
  | ({ readonly propulsion: "power" } & PowerDrivenOptions)
  | ({ readonly propulsion: "sail" } & SailingRigOptions);
type FishingState = { readonly state: State };

export type Scenario = { readonly lengthM: number } & (
  | ({ readonly rule: 23; readonly kind: "power" | "air-cushion" | "wig" } & PowerDrivenOptions)
  | { readonly rule: 23; readonly kind: "under-12-all-round"; readonly offsetWhiteX?: number }
  | {
      readonly rule: 23;
      readonly kind: "under-7-slow";
      readonly maximumSpeedKnots: number;
      readonly sidelightsPracticable: boolean;
    }
  | ({ readonly rule: 24; readonly kind: "towing-astern" } & TowingOptions)
  | ({ readonly rule: 24; readonly kind: "pushing" | "towing-alongside" | "composite" } & PowerDrivenOptions)
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
  | ({ readonly rule: 24; readonly kind: "assistance-tow-impracticable" } & PowerDrivenOptions)
  | ({ readonly rule: 25; readonly kind: "sailing" } & SailingRigOptions)
  | { readonly rule: 25; readonly kind: "small-sail-torch" | "oars-torch" }
  | ({ readonly rule: 25; readonly kind: "oars-sailing-lights" } & SailingRigOptions)
  | ({ readonly rule: 25; readonly kind: "motor-sailing" } & PowerDrivenOptions)
  | ({
      readonly rule: 26;
      readonly kind: "trawling";
      readonly aftMasthead?: boolean;
      /** Set only for fishing in close proximity (26(d), Annex II). */
      readonly netSignal?: "shooting" | "hauling" | "fast";
      readonly pairTrawling?: boolean;
    } & FishingState)
  | ({
      readonly rule: 26;
      readonly kind: "fishing";
      readonly gear?: { readonly extentM: number; readonly bearingDeg: number };
      /** Optional Annex II display; only when hampered by purse-seine gear. */
      readonly purseSeineHampered?: boolean;
    } & FishingState)
  | ({ readonly rule: 26; readonly kind: "not-fishing" } & OrdinaryVessel)
  | { readonly rule: 27; readonly kind: "nuc"; readonly makingWay: boolean }
  | ({ readonly rule: 27; readonly kind: "ram"; readonly state: State } & PowerDrivenOptions & AnchorOptions)
  | ({ readonly rule: 27; readonly kind: "restricted-towing" } & TowingOptions)
  | ({
      readonly rule: 27;
      readonly kind: "dredging";
      readonly state: State;
      readonly obstructionSide?: Side;
    } & PowerDrivenOptions)
  | { readonly rule: 27; readonly kind: "diving-small" }
  | ({ readonly rule: 27; readonly kind: "mine-clearance"; readonly state: State } & PowerDrivenOptions & AnchorOptions)
  | { readonly rule: 27; readonly kind: "under-12-exemption" }
  | ({
      readonly rule: 28;
      readonly kind: "constrained-draught";
      readonly showOptionalSignal?: boolean;
    } & PowerDrivenOptions)
  | ({
      readonly rule: 29;
      readonly kind: "pilot";
      readonly state: "underway" | "anchored";
    } & AnchorOptions)
  | ({ readonly rule: 29; readonly kind: "off-duty" } & OrdinaryVessel)
  | ({ readonly rule: 30; readonly kind: "anchored" } & AnchorOptions)
  | ({
      readonly rule: 30;
      readonly kind: "aground";
      readonly signalsPracticable?: boolean;
      readonly showOptionalUnder12Signals?: boolean;
    } & AnchorOptions)
  | { readonly rule: 30; readonly kind: "under-7-anchor-exemption" }
);

type Rule23Scenario = Extract<Scenario, { rule: 23 }>;
type Rule24Scenario = Extract<Scenario, { rule: 24 }>;
type Rule25Scenario = Extract<Scenario, { rule: 25 }>;
type Rule26Scenario = Extract<Scenario, { rule: 26 }>;
type Rule27Scenario = Extract<Scenario, { rule: 27 }>;
type Rule28Scenario = Extract<Scenario, { rule: 28 }>;
type Rule29Scenario = Extract<Scenario, { rule: 29 }>;
type Rule30Scenario = Extract<Scenario, { rule: 30 }>;

/* ===========================================================================
 * Light arcs and fixture positions
 *
 * Bearings are measured clockwise from the bow. Coordinates are illustrative.
 * ========================================================================== */

const ALL_AROUND: Sector = { center: 0, width: 360 };
const AHEAD: Sector = { center: 0, width: 225 }; // masthead-light arc
const ASTERN: Sector = { center: 180, width: 135 }; // stern-light arc
const PORT: Sector = { center: 303.75, width: 112.5 };
const STARBOARD: Sector = { center: 56.25, width: 112.5 };

const POS = {
  foreMasthead: [0, 20, 34],
  aftMasthead: [0, -20, 46],
  stern: [0, -40, 6],
  signalStack: [0, 0, 26],
  anchorFore: [0, 35, 30],
  anchorAft: [0, -35, 12],
} as const satisfies Record<string, Vec3>;

const STACK_GAP = 6;

/* Length thresholds from the Rules (all in metres). */
const SECOND_MASTHEAD_MIN_LENGTH = 50;
const SINGLE_ANCHOR_LIGHT_MAX_LENGTH = 50; // below this, one anchor light suffices
const DECK_LIGHTING_MIN_LENGTH = 100;
const THREE_MASTHEAD_LIGHTS_MIN_TOW_LENGTH = 200; // strictly greater than
const GEAR_SIGNAL_MIN_EXTENT = 150; // strictly greater than
const SIDE_TOW_LIGHTS_MIN_BREADTH = 25;

/* ===========================================================================
 * Fixture factories and small validation helpers
 * ========================================================================== */

function assertCondition(ok: boolean, message: string): asserts ok {
  if (!ok) throw new RangeError(message);
}
function assertPositiveFinite(value: number, name: string): void {
  assertCondition(Number.isFinite(value) && value > 0, `${name} must be a positive finite number.`);
}
function assertFinite(value: number, name: string): void {
  assertCondition(Number.isFinite(value), `${name} must be finite.`);
}
function assertLengthBelow(lengthM: number, maxExclusive: number, ruleText: string): void {
  assertCondition(lengthM < maxExclusive, `${ruleText} requires length < ${maxExclusive} m.`);
}

const makeLight = (id: string, color: Color, position: Vec3, sector: Sector = ALL_AROUND): Light => ({
  id,
  color,
  position,
  sector,
});
const makeShape = (id: string, kind: Shape, position: Vec3): DayShape => ({ id, shape: kind, position });

/** One light per color, stacked vertically downward from `position`. */
function stackedLights(
  id: string,
  colors: readonly Color[],
  position: Vec3 = POS.signalStack,
  sector: Sector = ALL_AROUND,
): Light[] {
  return colors.map((color, index) =>
    makeLight(`${id}-${index}`, color, [position[0], position[1], position[2] - index * STACK_GAP], sector),
  );
}

function stackedShapes(id: string, kinds: readonly Shape[], position: Vec3 = POS.signalStack): DayShape[] {
  return kinds.map((kind, index) =>
    makeShape(`${id}-${index}`, kind, [position[0], position[1], position[2] - index * STACK_GAP]),
  );
}

/** Sidelights, either as separate fixtures or combined in one lantern. */
function sidelights(forwardY = 10, combinedLantern = false): Light[] {
  const x = combinedLantern ? 0 : 10;
  return [
    makeLight("port", "red", [-x, forwardY, 6], PORT),
    makeLight("starboard", "green", [x, forwardY, 6], STARBOARD),
  ];
}
const sternLight = (): Light => makeLight("stern", "white", POS.stern, ASTERN);
const underwayLights = (): Light[] => [...sidelights(), sternLight()];

/* ===========================================================================
 * Reusable light sets (Rules 23/25 and vessels in ordinary service)
 * ========================================================================== */

function powerDrivenLights(lengthM: number, secondMasthead = false): Light[] {
  const lights = [makeLight("masthead-forward", "white", POS.foreMasthead, AHEAD)];
  if (lengthM >= SECOND_MASTHEAD_MIN_LENGTH || secondMasthead) {
    lights.push(makeLight("masthead-aft", "white", POS.aftMasthead, AHEAD));
  }
  return [...lights, ...underwayLights()];
}

function anchorLights(lengthM: number, twoAnchorLights = false): Light[] {
  if (lengthM < SINGLE_ANCHOR_LIGHT_MAX_LENGTH && !twoAnchorLights) {
    return [makeLight("anchor", "white", POS.anchorFore)];
  }
  return [
    makeLight("anchor-forward", "white", POS.anchorFore),
    makeLight("anchor-aft", "white", POS.anchorAft),
  ];
}

function towingVesselLights(
  lengthM: number,
  towLengthM: number,
  secondMasthead = false,
  showTowLight = true,
): Light[] {
  assertCondition(Number.isFinite(towLengthM) && towLengthM > 0, "towLengthM must be positive.");
  // Long tows (> 200 m) add a third white masthead light.
  const mastheadStack: readonly Color[] =
    towLengthM > THREE_MASTHEAD_LIGHTS_MIN_TOW_LENGTH
      ? ["white", "white", "white"]
      : ["white", "white"];
  const lights = stackedLights("towing-masthead", mastheadStack, POS.foreMasthead, AHEAD);

  if (lengthM >= SECOND_MASTHEAD_MIN_LENGTH || secondMasthead) {
    lights.push(makeLight("masthead-aft", "white", POS.aftMasthead, AHEAD));
  }
  lights.push(...underwayLights());
  if (showTowLight) lights.push(makeLight("towing", "yellow", [0, -40, 12], ASTERN));
  return lights;
}

function sailingLights(lengthM: number, rig: SailingRigOptions["rig"] = "separate"): Light[] {
  if (rig === "tricolor") {
    assertCondition(lengthM < 20, "The combined mast-top lantern requires length < 20 m.");
    const position: Vec3 = [0, 0, 34];
    return [
      makeLight("port", "red", position, PORT),
      makeLight("starboard", "green", position, STARBOARD),
      makeLight("stern", "white", position, ASTERN),
    ];
  }
  return [
    ...underwayLights(),
    ...(rig === "red-over-green" ? stackedLights("sailing", ["red", "green"], [0, 0, 34]) : []),
  ];
}

function ordinaryVesselLights(lengthM: number, vessel: OrdinaryVessel): Light[] {
  return vessel.propulsion === "power"
    ? powerDrivenLights(lengthM, vessel.secondMasthead)
    : sailingLights(lengthM, vessel.rig);
}

/* ===========================================================================
 * Display accumulator shared by all rule builders
 * ========================================================================== */

class DisplayBuilder {
  private readonly lights: Light[] = [];
  private readonly dayShapes: DayShape[] = [];
  private readonly notes: string[] = [];
  private deckLighting = false;

  addLight(...args: Parameters<typeof makeLight>): this {
    this.lights.push(makeLight(...args));
    return this;
  }
  addLights(...items: readonly Light[]): this {
    this.lights.push(...items);
    return this;
  }
  addShape(...args: Parameters<typeof makeShape>): this {
    this.dayShapes.push(makeShape(...args));
    return this;
  }
  addShapes(...items: readonly DayShape[]): this {
    this.dayShapes.push(...items);
    return this;
  }
  note(text: string): this {
    this.notes.push(text);
    return this;
  }
  setDeckLighting(value: boolean): this {
    this.deckLighting = value;
    return this;
  }

  toDisplay(rule: Rule): Display {
    return {
      rule,
      lights: this.lights,
      shapes: this.dayShapes,
      notes: this.notes,
      deckLighting: this.deckLighting,
    };
  }
}

/* ---------------------------------------------------------------------------
 * Composite signal groups reused across rules
 * ------------------------------------------------------------------------- */

/** Rule 30 anchor signals; the day ball may be suppressed (vessel aground). */
function addAnchorSignals(
  builder: DisplayBuilder,
  lengthM: number,
  options: AnchorOptions,
  { withBall = true } = {},
): void {
  builder.addLights(...anchorLights(lengthM, options.twoAnchorLights));
  if (withBall) builder.addShape("anchor-ball", "ball", POS.anchorFore);
  builder.setDeckLighting(lengthM >= DECK_LIGHTING_MIN_LENGTH || !!options.illuminateDeck);
}

/** Rule 27(c) rigid-restricted-ability lights and shapes. */
function addRamSignals(builder: DisplayBuilder): void {
  builder
    .addLights(...stackedLights("ram", ["red", "white", "red"]))
    .addShapes(...stackedShapes("ram", ["ball", "diamond", "ball"]));
}

/** Rule 24(a)/(e) towing lights plus the > 200 m day diamond. */
function addTowingSignals(builder: DisplayBuilder, lengthM: number, tow: TowingOptions): void {
  builder.addLights(...towingVesselLights(lengthM, tow.towLengthM, tow.secondMasthead));
  if (tow.towLengthM > THREE_MASTHEAD_LIGHTS_MIN_TOW_LENGTH) {
    builder.addShape("tow-diamond", "diamond", [0, 20, 26]);
  }
}

/* ---------------------------------------------------------------------------
 * Per-kind handler maps. One handler per scenario kind, so each rule reads as
 * a flat list of labelled cases instead of a nested switch.
 * ------------------------------------------------------------------------- */

type HandlerMap<T extends { kind: string }> = {
  // Intersection also narrows union-valued kinds, e.g. "power" | "wig".
  [K in T["kind"]]: (scenario: T & { kind: K }, builder: DisplayBuilder) => void;
};
type Handler<T extends { kind: string }> = (scenario: T, builder: DisplayBuilder) => void;

function dispatch<T extends { kind: string }>(
  handlers: HandlerMap<T>,
  scenario: T,
  builder: DisplayBuilder,
): void {
  const lookup = handlers as unknown as Partial<Record<string, Handler<T>>>;
  const handler = lookup[scenario.kind];

  if (handler === undefined) {
    throw new RangeError(`Unknown scenario kind: ${scenario.kind}`);
  }

  handler(scenario, builder);
}

/* ===========================================================================
 * Rule 23 — power-driven vessels
 * ========================================================================== */

const WIG_FLASH = { periodMs: 500, onMs: 250, phaseMs: 0 } as const;

/** Rule 23(b)/(c) high-intensity flashing light for air-cushion vessels and WIG craft. */
function specialCraftLight(color: "yellow" | "red"): Light {
  return {
    ...makeLight("special-flash", color, [0, -12, 54]),
    flash: { ...WIG_FLASH },
    highIntensity: color === "red", // WIG craft
  };
}

const RULE_23_HANDLERS: HandlerMap<Rule23Scenario> = {
  power: (s, b) => b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead)),

  "air-cushion": (s, b) => {
    b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead), specialCraftLight("yellow"));
    b.note("23(b): air-cushion vessel in non-displacement mode only.");
  },

  wig: (s, b) => {
    b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead), specialCraftLight("red"));
    b.note("23(c): take-off, landing or flight near the surface only.");
  },

  "under-12-all-round": (s, b) => {
    assertLengthBelow(s.lengthM, 12, "23(d)(i)");
    const offsetWhiteX = s.offsetWhiteX ?? 0;
    assertFinite(offsetWhiteX, "offsetWhiteX");
    b.addLights(
      makeLight("all-round-white", "white", [offsetWhiteX, 20, 34]),
      ...sidelights(10, offsetWhiteX !== 0),
    );
    if (offsetWhiteX !== 0) {
      b.note(
        "23(d)(iii): offset fitting only if centreline fitting is impracticable; use combined sidelights.",
      );
    }
  },

  "under-7-slow": (s, b) => {
    assertCondition(
      s.lengthM < 7 && s.maximumSpeedKnots >= 0 && s.maximumSpeedKnots <= 7,
      "23(d)(ii) requires length < 7 m and maximum speed <= 7 knots.",
    );
    b.addLights(makeLight("all-round-white", "white", POS.foreMasthead));
    if (s.sidelightsPracticable) b.addLights(...sidelights());
    b.note("Sidelights must also be shown if practicable.");
  },
};

function buildRule23(scenario: Rule23Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_23_HANDLERS, scenario, builder);
}

/* ===========================================================================
 * Rule 24 — towing and pushing
 * ========================================================================== */

const RULE_24_HANDLERS: HandlerMap<Rule24Scenario> = {
  "towing-astern": (s, b) => addTowingSignals(b, s.lengthM, s),

  // Pushing and towing alongside: same masthead stack as towing astern, but no yellow tow light.
  pushing: (s, b) => b.addLights(...towingVesselLights(s.lengthM, 200, s.secondMasthead, false)),
  "towing-alongside": (s, b) => b.addLights(...towingVesselLights(s.lengthM, 200, s.secondMasthead, false)),

  composite: (s, b) => {
    b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead));
    b.note("24(b): rigid composite unit; lengthM is the length of the unit.");
  },

  towed: (s, b) => {
    assertCondition(Number.isFinite(s.towLengthM) && s.towLengthM > 0, "towLengthM must be positive.");
    b.addLights(...underwayLights());
    if (s.towLengthM > THREE_MASTHEAD_LIGHTS_MIN_TOW_LENGTH) {
      b.addShape("tow-diamond", "diamond", POS.signalStack);
    }
  },

  pushed: (_, b) => b.addLights(...sidelights(38)),
  "towed-alongside": (_, b) => b.addLights(...sidelights(38), sternLight()),

  "submerged-tow": (s, b) => {
    assertCondition(
      Number.isFinite(s.breadthM) && s.breadthM > 0 && Number.isFinite(s.towLengthM) && s.towLengthM > 0,
      "Breadth and tow length must be positive.",
    );
    // Compress physical dimensions to a common drawing frame. Longitudinal
    // marker count is derived from metres; intermediate gaps are <= 100 m.
    const segmentCount = Math.ceil(s.lengthM / 100);
    for (let index = 0; index <= segmentCount; index++) {
      if (index === 0 && s.dracone) continue;
      b.addLight(`tow-end-${index}`, "white", [0, 40 - (80 * index) / segmentCount, 6]);
    }
    if (s.breadthM >= SIDE_TOW_LIGHTS_MIN_BREADTH) {
      b.addLights(
        makeLight("tow-port", "white", [-16, 0, 6]),
        makeLight("tow-starboard", "white", [16, 0, 6]),
      );
    }
    b.addShape("tow-aft-diamond", "diamond", [0, -40, 14]);
    if (s.towLengthM > THREE_MASTHEAD_LIGHTS_MIN_TOW_LENGTH) {
      b.addShape("tow-forward-diamond", "diamond", [0, 40, 14]);
    }
    b.note(
      "24(g): represents the last object or the combined tow; dimensions refer to that object/group.",
    );
  },

  "tow-display-impracticable": (_, b) => {
    b.note(
      "24(h): take all possible measures to light the tow or indicate its presence; no fixed substitute light pattern.",
    );
  },

  "assistance-tow-impracticable": (s, b) => {
    b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead));
    b.note(
      "24(i): only for a vessel not normally towing, assisting a vessel in distress/need, when towing lights are impracticable. Indicate the relationship, particularly by illuminating the towline.",
    );
  },
};

function buildRule24(scenario: Rule24Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_24_HANDLERS, scenario, builder);
  builder.note(
    "24(f): vessels pushed/towed alongside in a group are lighted as one vessel. Tow length is measured from towing vessel stern to the far end of the tow.",
  );
}

/* ===========================================================================
 * Rule 25 — sailing vessels and vessels under oars
 * ========================================================================== */

const RULE_25_HANDLERS: HandlerMap<Rule25Scenario> = {
  sailing: (s, b) => b.addLights(...sailingLights(s.lengthM, s.rig)),
  "oars-sailing-lights": (s, b) => b.addLights(...sailingLights(s.lengthM, s.rig)),

  "small-sail-torch": (s, b) => {
    assertLengthBelow(s.lengthM, 7, "25(d)(i)");
    b.note("Use the normal sailing lights if practicable.");
    b.note(
      "Keep a white torch/lantern ready; exhibit in time to prevent collision. Not a permanent all-round light.",
    );
  },

  "oars-torch": (_, b) => {
    b.note(
      "25(d)(ii): keep a white torch/lantern ready; exhibit in time to prevent collision.",
    );
  },

  "motor-sailing": (s, b) => {
    b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead));
    b.addShape("motoring-cone", "cone-down", [0, 25, 26]);
    b.note(
      "25(e): cone forward by day; propulsion by machinery means Rule 23 lights at night.",
    );
  },
};

function buildRule25(scenario: Rule25Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_25_HANDLERS, scenario, builder);
}

/* ===========================================================================
 * Rule 26 — fishing vessels
 * ========================================================================== */

const NET_SIGNAL_STACKS = {
  shooting: ["white", "white"],
  hauling: ["white", "red"],
  fast: ["red", "red"],
} as const satisfies Record<"shooting" | "hauling" | "fast", readonly Color[]>;

const PURSE_SEINE_FLASH_PERIOD_MS = 2000;

const RULE_26_HANDLERS: HandlerMap<Rule26Scenario> = {
  trawling: (s, b) => {
    b.addLights(...stackedLights("fishing", ["green", "white"]));
    b.addShape("fishing-cones", "cones-apexes-together", POS.signalStack);
    if (s.state === "making-way") b.addLights(...underwayLights());
    if (s.lengthM >= SECOND_MASTHEAD_MIN_LENGTH || s.aftMasthead) {
      b.addLight("trawling-masthead", "white", POS.aftMasthead, AHEAD);
    }
    if (s.netSignal) {
      b.addLights(...stackedLights("net", NET_SIGNAL_STACKS[s.netSignal], [12, 0, 14]));
      b.note(
        "26(d), Annex II: additional net signals in close proximity; compulsory at >= 20 m, permitted below 20 m. Range >= 1 mile and less than the main fishing lights.",
      );
    }
    if (s.pairTrawling) {
      b.note(
        "Annex II: night searchlight forward and toward the other trawler; compulsory at >= 20 m, permitted below 20 m. Not represented as an all-round light.",
      );
    }
  },

  fishing: (s, b) => {
    b.addLights(...stackedLights("fishing", ["red", "white"]));
    b.addShape("fishing-cones", "cones-apexes-together", POS.signalStack);
    if (s.state === "making-way") b.addLights(...underwayLights());
    if (s.gear) {
      assertCondition(
        Number.isFinite(s.gear.extentM) &&
          s.gear.extentM >= 0 &&
          Number.isFinite(s.gear.bearingDeg),
        "Invalid gear extent/bearing.",
      );
      if (s.gear.extentM > GEAR_SIGNAL_MIN_EXTENT) {
        const bearingRad = (s.gear.bearingDeg * Math.PI) / 180;
        const position: Vec3 = [20 * Math.sin(bearingRad), 20 * Math.cos(bearingRad), 14];
        b.addLight("gear", "white", position);
        b.addShape("gear-cone", "cone-up", position);
      }
    }
    if (s.purseSeineHampered) {
      const signals = stackedLights("purse-seine", ["yellow", "yellow"], [12, 0, 14]).map(
        (light, index) => ({
          ...light,
          flash: { periodMs: PURSE_SEINE_FLASH_PERIOD_MS, onMs: 1000, phaseMs: index * 1000 },
        }),
      );
      b.addLights(...signals);
      b.note(
        "26(d), Annex II: optional alternating yellow signals, only while hampered by purse-seine gear; range >= 1 mile and less than main fishing lights.",
      );
    }
  },

  "not-fishing": (s, b) => {
    b.addLights(...ordinaryVesselLights(s.lengthM, s));
    b.note(
      "26(e): ordinary underway display, with no fishing signals. For anchor/grounded state use Rule 30.",
    );
  },
};

function buildRule26(scenario: Rule26Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_26_HANDLERS, scenario, builder);
  if (scenario.kind !== "not-fishing") {
    builder.note(
      "26(a): these fishing signals also apply at anchor; do not add ordinary anchor lights.",
    );
  }
}

/* ===========================================================================
 * Rule 27 — vessels restricted in their ability to manoeuvre
 * ========================================================================== */

const MINE_SIGNAL_POSITIONS = [
  [0, 20, 54],
  [-16, 20, 46],
  [16, 20, 46],
] as const satisfies readonly Vec3[];

const RULE_27_HANDLERS: HandlerMap<Rule27Scenario> = {
  nuc: (s, b) => {
    b.addLights(...stackedLights("nuc", ["red", "red"]));
    b.addShapes(...stackedShapes("nuc", ["ball", "ball"]));
    if (s.makingWay) b.addLights(...underwayLights());
  },

  ram: (s, b) => {
    addRamSignals(b);
    if (s.state === "making-way") {
      b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead));
    }
    if (s.state === "anchored") addAnchorSignals(b, s.lengthM, s);
  },

  "restricted-towing": (s, b) => {
    addRamSignals(b);
    addTowingSignals(b, s.lengthM, s);
  },

  dredging: (s, b) => {
    addRamSignals(b);
    if (s.state === "making-way") {
      b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead));
    }
    if (s.obstructionSide) {
      // Red balls mark the side with the obstruction; green diamonds mark the clear side.
      const obstructionX = s.obstructionSide === "starboard" ? 16 : -16;
      const passageX = -obstructionX;
      b.addLights(
        ...stackedLights("obstruction", ["red", "red"], [obstructionX, 0, 14]),
        ...stackedLights("passage", ["green", "green"], [passageX, 0, 14]),
      );
      b.addShapes(
        ...stackedShapes("obstruction", ["ball", "ball"], [obstructionX, 0, 14]),
        ...stackedShapes("passage", ["diamond", "diamond"], [passageX, 0, 14]),
      );
    }
    b.note("27(d): at anchor this display replaces the Rule 30 anchor signals.");
  },

  "diving-small": (_, b) => {
    b.addLights(...stackedLights("diving", ["red", "white", "red"]));
    b.addShape("diving-flag", "alpha-flag", POS.signalStack);
    b.note(
      "27(e): only when vessel size makes the full 27(d) display impracticable. Rigid Alpha flag >= 1 m high, visible all round.",
    );
  },

  "mine-clearance": (s, b) => {
    if (s.state === "anchored") addAnchorSignals(b, s.lengthM, s);
    else b.addLights(...powerDrivenLights(s.lengthM, s.secondMasthead));
    MINE_SIGNAL_POSITIONS.forEach((position, index) => {
      b.addLight(`mine-${index}`, "green", position);
      b.addShape(`mine-${index}`, "ball", position);
    });
    b.note("27(f): danger within 1000 m.");
  },

  "under-12-exemption": (s, b) => {
    assertLengthBelow(s.lengthM, 12, "27(g)");
    b.note(
      "27(g): Rule 27 lights/shapes are not required below 12 m, except when diving. This empty display encodes only that exemption, not duties under other rules.",
    );
  },
};

function buildRule27(scenario: Rule27Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_27_HANDLERS, scenario, builder);
  if (scenario.lengthM < 12 && scenario.kind !== "diving-small") {
    builder.note("27(g): below 12 m these signals are optional unless engaged in diving.");
  }
  builder.note("27(h): these are not distress signals.");
}

/* ===========================================================================
 * Rule 28 — vessels constrained by their draught
 * ========================================================================== */

function buildRule28(scenario: Rule28Scenario, builder: DisplayBuilder): void {
  builder.addLights(...powerDrivenLights(scenario.lengthM, scenario.secondMasthead));
  if (scenario.showOptionalSignal !== false) {
    builder
      .addLights(...stackedLights("draught", ["red", "red", "red"]))
      .addShape("draught-cylinder", "cylinder", POS.signalStack);
  }
  builder.note(
    "28: additional draught signals are optional; applies to a vessel constrained by her draught.",
  );
}

/* ===========================================================================
 * Rule 29 — pilot vessels
 * ========================================================================== */

const RULE_29_HANDLERS: HandlerMap<Rule29Scenario> = {
  pilot: (s, b) => {
    b.addLights(...stackedLights("pilot", ["white", "red"], [0, 0, 34]));
    if (s.state === "underway") b.addLights(...underwayLights());
    else addAnchorSignals(b, s.lengthM, s);
  },

  "off-duty": (s, b) => {
    b.addLights(...ordinaryVesselLights(s.lengthM, s));
    b.note("29(b): ordinary underway display; for anchor/grounded state use Rule 30.");
  },
};

function buildRule29(scenario: Rule29Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_29_HANDLERS, scenario, builder);
}

/* ===========================================================================
 * Rule 30 — anchored and aground
 * ========================================================================== */

const RULE_30_HANDLERS: HandlerMap<Rule30Scenario> = {
  anchored: (s, b) => addAnchorSignals(b, s.lengthM, s),

  aground: (s, b) => {
    addAnchorSignals(b, s.lengthM, s, { withBall: false }); // three balls replace the anchor ball
    // 30(d) incorporates (a)/(b), not the deck-illumination duty in (c).
    b.setDeckLighting(!!s.illuminateDeck);
    if ((s.lengthM >= 12 || s.showOptionalUnder12Signals) && s.signalsPracticable !== false) {
      b.addLights(...stackedLights("aground", ["red", "red"]));
      b.addShapes(...stackedShapes("aground", ["ball", "ball", "ball"]));
    }
    b.note(
      "30(d),(f): additional aground signals if practicable; not required below 12 m. Anchor lights remain.",
    );
  },

  "under-7-anchor-exemption": (s, b) => {
    assertLengthBelow(s.lengthM, 7, "30(e)");
    b.note(
      "30(e): only away from narrow channels, fairways and places where vessels normally navigate.",
    );
  },
};

function buildRule30(scenario: Rule30Scenario, builder: DisplayBuilder): void {
  dispatch(RULE_30_HANDLERS, scenario, builder);
}

/* ===========================================================================
 * Entry point
 * ========================================================================== */

 const ruleBuilders = {
   23: buildRule23,
   24: buildRule24,
   25: buildRule25,
   26: buildRule26,
   27: buildRule27,
   28: buildRule28,
   29: buildRule29,
   30: buildRule30,
 } satisfies {
   [R in Rule]: (
     scenario: Extract<Scenario, { rule: R }>,
     builder: DisplayBuilder,
   ) => void;
 };

 function runRuleBuilder(scenario: Scenario, builder: DisplayBuilder): void {
   const run = ruleBuilders[scenario.rule] as (
     scenario: Scenario,
     builder: DisplayBuilder,
   ) => void;

   run(scenario, builder);
 }
export function buildDisplay(scenario: Scenario): Display {
  assertPositiveFinite(scenario.lengthM, "lengthM");
  const builder = new DisplayBuilder();

  runRuleBuilder(scenario, builder);

  return builder.toDisplay(scenario.rule);
}


/* ===========================================================================
 * Geometry and animation
 * ========================================================================== */

/** Practical cutoff falloff band in degrees (COLREG Annex I, Sec. 9 specifies 1°–3° cutoff). */
export const SECTOR_FADE_DEG = 2.5;

/**
 * Calculates visibility opacity (0.0 to 1.0) based on nominal legal sector and practical cutoff falloff.
 * Inside the nominal sector, opacity is 1.0. Outside the sector, intensity diminishes
 * smoothly to practical cutoff (0.0) over SECTOR_FADE_DEG.
 */
export function sectorOpacity(sector: Sector, bearingDeg: number): number {
  assertFinite(bearingDeg, "bearingDeg");
  if (sector.width >= 360) return 1.0;
  const angularDifference = ((((bearingDeg - sector.center) % 360) + 540) % 360) - 180;
  const diff = Math.abs(angularDifference);
  const halfWidth = sector.width / 2;
  if (diff <= halfWidth) return 1.0;
  const excess = diff - halfWidth;
  if (excess >= SECTOR_FADE_DEG) return 0.0;
  const t = 1.0 - excess / SECTOR_FADE_DEG;
  return t * t * (3 - 2 * t);
}

/** Nominal sector visibility check; returns true if light is within visible cutoff arc. */
export function isVisible(sector: Sector, bearingDeg: number): boolean {
  return sectorOpacity(sector, bearingDeg) > 0.001;
}

export function isLit(light: Light, timeMs: number): boolean {
  assertFinite(timeMs, "timeMs");
  if (!light.flash) return true;
  const { periodMs, phaseMs, onMs } = light.flash;
  return (((timeMs + phaseMs) % periodMs) + periodMs) % periodMs < onMs;
}

export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

/** Sea-level orthographic view; SVG y increases downward. */
export function project([x, y, z]: Vec3, bearingDeg: number): ProjectedPoint {
  assertFinite(bearingDeg, "bearingDeg");
  const angleRad = (bearingDeg * Math.PI) / 180;
  return {
    x: -x * Math.cos(angleRad) + y * Math.sin(angleRad),
    y: -z,
    depth: x * Math.sin(angleRad) + y * Math.cos(angleRad),
  };
}

export function projectDisplay(display: Display, bearingDeg: number, timeMs = 0) {
  assertCondition(
    Number.isFinite(bearingDeg) && Number.isFinite(timeMs),
    "Bearing/time must be finite.",
  );
  return {
    ...display,
    lights: display.lights
      .map((light) => {
        const opacity = +sectorOpacity(light.sector, bearingDeg).toFixed(2);
        return {
          ...light,
          ...project(light.position, bearingDeg),
          opacity,
          on: isLit(light, timeMs),
        };
      })
      .filter((light) => light.opacity > 0)
      .sort((a, b) => a.depth - b.depth),
    shapes: display.shapes
      .map((shape) => ({ ...shape, ...project(shape.position, bearingDeg) }))
      .sort((a, b) => a.depth - b.depth),
  };
}

/* ===========================================================================
 * Rendering
 * ========================================================================== */

const COLORS: Record<Color, string> = {
  white: "#fff9e8",
  red: "#ff4545",
  green: "#36ef86",
  yellow: "#ffd84d",
};

const samePosition = (a: Vec3, b: Vec3): boolean =>
  a.every((coordinate, index) => coordinate === b[index]);

type ProjectedLight = ReturnType<typeof projectDisplay>["lights"][number];

/**
 * Combined sidelights share one fixture position. At the exact bow boundary
 * show both halves: green to the observer's left, red to the right.
 */
function renderLight(light: ProjectedLight, litLights: readonly ProjectedLight[]): ReactElement {
  const oppositeId =
    light.id === "port" ? "starboard" : light.id === "starboard" ? "port" : undefined;
  const isCombined =
    oppositeId !== undefined &&
    litLights.some(
      (other) => other.id === oppositeId && samePosition(other.position, light.position),
    );

  const glowFilter = `url(#glow-${light.color})`;

  if (isCombined) {
    const sweep = light.id === "port" ? 1 : 0;
    return (
      <path
        key={light.id}
        transform={`translate(${light.x} ${light.y})`}
        d={`M 0 -1.6 A 1.6 1.6 0 0 ${sweep} 0 1.6 Z`}
        fill={COLORS[light.color]}
        filter={glowFilter}
        opacity={light.opacity}
      >
        <title>{light.id}</title>
      </path>
    );
  }
  return (
    <circle
      key={light.id}
      cx={light.x}
      cy={light.y}
      r="1.6"
      fill={COLORS[light.color]}
      filter={glowFilter}
      opacity={light.opacity}
    >
      <title>{light.id}</title>
    </circle>
  );
}

/** SVG glow filter: two‑layer Gaussian blur for a soft halo around each light. */
function GlowFilter({ id, color }: { id: string; color: string }): ReactElement {
  return (
    <filter id={id} x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
      <feFlood floodColor={color} floodOpacity="0.6" result="color1" />
      <feFlood floodColor={color} floodOpacity="0.3" result="color2" />
      <feComposite in="color1" in2="blur1" operator="in" result="glow1" />
      <feComposite in="color2" in2="blur2" operator="in" result="glow2" />
      <feMerge>
        <feMergeNode in="glow2" />
        <feMergeNode in="glow1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/** 3D model of a vessel with sheer, aft wheelhouse, and directional features. */
function renderShipSilhouette(bearingDeg: number): ReactElement {
  const rad = (bearingDeg * Math.PI) / 180;
  const proj = ([x, y, z]: Vec3): { x: number; y: number; depth: number } => ({
    x: +(-x * Math.cos(rad) + y * Math.sin(rad)).toFixed(1),
    y: +(-z).toFixed(1),
    depth: +(x * Math.sin(rad) + y * Math.cos(rad)).toFixed(1),
  });

  const area2D = (pts: Array<{ x: number; y: number }>): number => {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return a;
  };

  const toPointsString = (pts: Array<{ x: number; y: number }>) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  // Stations along the hull (starboard side; port is mirrored at -x)
  // Sheer line: bow is raised (z=7.5) with forward raked stem; stern is lower (z=4.5)
  const stations: Array<{ d: Vec3; w: Vec3 }> = [
    { d: [0, 36, 7.5], w: [0, 31, 0] },       // bow stem
    { d: [5.2, 26, 6.2], w: [4.2, 25, 0] },   // fwd shoulder
    { d: [7.5, 10, 5.2], w: [6.8, 10, 0] },   // midships fwd
    { d: [7.5, -14, 4.6], w: [6.8, -14, 0] }, // midships aft
    { d: [6.0, -26, 4.5], w: [5.2, -26, 0] }, // aft quarter
    { d: [4.2, -38, 4.5], w: [3.2, -37, 0] }, // transom corner
  ];

  interface OverlayPoly {
    points3D: Vec3[];
    fill: string;
    stroke: string;
    strokeWidth?: number;
    fillOpacity?: number;
  }

  interface RenderablePoly {
    id: string;
    points3D: Vec3[];
    fill: string;
    stroke: string;
    strokeWidth?: number;
    fillOpacity?: number;
    forceVisible?: boolean;
    overlays?: OverlayPoly[];
  }

  const polys: RenderablePoly[] = [];

  // Starboard hull faces (wound for outward normal)
  for (let i = 0; i < stations.length - 1; i++) {
    polys.push({
      id: `hull-sb-${i}`,
      points3D: [stations[i].d, stations[i].w, stations[i + 1].w, stations[i + 1].d],
      fill: "#0a182b",
      stroke: "#1c3452",
    });
  }

  // Port hull faces (wound for outward normal)
  for (let i = 0; i < stations.length - 1; i++) {
    polys.push({
      id: `hull-port-${i}`,
      points3D: [
        [-stations[i].d[0], stations[i].d[1], stations[i].d[2]],
        [-stations[i + 1].d[0], stations[i + 1].d[1], stations[i + 1].d[2]],
        [-stations[i + 1].w[0], stations[i + 1].w[1], stations[i + 1].w[2]],
        [-stations[i].w[0], stations[i].w[1], stations[i].w[2]],
      ],
      fill: "#0d1e35",
      stroke: "#1f3b5e",
    });
  }

  // Transom (flat stern face)
  polys.push({
    id: "transom",
    points3D: [
      [-stations[5].d[0], stations[5].d[1], stations[5].d[2]],
      stations[5].d,
      stations[5].w,
      [-stations[5].w[0], stations[5].w[1], stations[5].w[2]],
    ],
    fill: "#071220",
    stroke: "#172b43",
  });

  // Deck surface polygon
  const deck3D: Vec3[] = [
    ...stations.map((s) => s.d),
    ...stations.slice(1).reverse().map((s) => [-s.d[0], s.d[1], s.d[2]] as Vec3),
  ];
  polys.push({
    id: "deck",
    points3D: deck3D,
    fill: "#10233b",
    stroke: "#224269",
    forceVisible: true,
  });

  // Wheelhouse / Cabin positioned aft of midships (y from -16 to 4, width ±4.2, height 4.8 to 13)
  const cWidth = 4.2;
  const cFwd = 4.0;
  const cAft = -16.0;
  const cBottom = 4.8;
  const cTop = 13.0;
  const winZMin = 9.2;
  const winZMax = 12.0;

  // Cabin front wall (faces forward +y) with its 3 forward bridge window panes
  polys.push({
    id: "cabin-front",
    points3D: [
      [-cWidth, cFwd, cBottom],
      [cWidth, cFwd, cBottom],
      [cWidth, cFwd, cTop],
      [-cWidth, cFwd, cTop],
    ],
    fill: "#142742",
    stroke: "#274b7a",
    overlays: [
      // Center pane
      {
        points3D: [[-1.0, cFwd, winZMin], [1.0, cFwd, winZMin], [1.0, cFwd, winZMax], [-1.0, cFwd, winZMax]],
        fill: "#38bdf8",
        fillOpacity: 0.65,
        stroke: "#7dd3fc",
        strokeWidth: 0.3,
      },
      // Starboard pane
      {
        points3D: [[1.4, cFwd, winZMin], [3.5, cFwd, winZMin], [3.5, cFwd, winZMax], [1.4, cFwd, winZMax]],
        fill: "#38bdf8",
        fillOpacity: 0.65,
        stroke: "#7dd3fc",
        strokeWidth: 0.3,
      },
      // Port pane
      {
        points3D: [[-3.5, cFwd, winZMin], [-1.4, cFwd, winZMin], [-1.4, cFwd, winZMax], [-3.5, cFwd, winZMax]],
        fill: "#38bdf8",
        fillOpacity: 0.65,
        stroke: "#7dd3fc",
        strokeWidth: 0.3,
      },
    ],
  });

  // Cabin back wall (faces aft -y) with aft companionway door
  polys.push({
    id: "cabin-back",
    points3D: [
      [cWidth, cAft, cBottom],
      [-cWidth, cAft, cBottom],
      [-cWidth, cAft, cTop],
      [cWidth, cAft, cTop],
    ],
    fill: "#0f1f36",
    stroke: "#223f66",
    overlays: [
      {
        points3D: [[-1.2, cAft, 5.2], [1.2, cAft, 5.2], [1.2, cAft, 10.0], [-1.2, cAft, 10.0]],
        fill: "#081422",
        stroke: "#1b324f",
        strokeWidth: 0.4,
      },
    ],
  });

  // Cabin starboard wall (faces +x) with 2 side windows
  polys.push({
    id: "cabin-sb",
    points3D: [
      [cWidth, cFwd, cBottom],
      [cWidth, cAft, cBottom],
      [cWidth, cAft, cTop],
      [cWidth, cFwd, cTop],
    ],
    fill: "#12243d",
    stroke: "#254773",
    overlays: [
      {
        points3D: [[cWidth, 0.5, winZMin], [cWidth, -3.5, winZMin], [cWidth, -3.5, 11.8], [cWidth, 0.5, 11.8]],
        fill: "#0284c7",
        fillOpacity: 0.45,
        stroke: "#38bdf8",
        strokeWidth: 0.3,
      },
      {
        points3D: [[cWidth, -5.5, winZMin], [cWidth, -9.5, winZMin], [cWidth, -9.5, 11.8], [cWidth, -5.5, 11.8]],
        fill: "#0284c7",
        fillOpacity: 0.45,
        stroke: "#38bdf8",
        strokeWidth: 0.3,
      },
    ],
  });

  // Cabin port wall (faces -x) with 2 side windows
  polys.push({
    id: "cabin-port",
    points3D: [
      [-cWidth, cAft, cBottom],
      [-cWidth, cFwd, cBottom],
      [-cWidth, cFwd, cTop],
      [-cWidth, cAft, cTop],
    ],
    fill: "#12243d",
    stroke: "#254773",
    overlays: [
      {
        points3D: [[-cWidth, -3.5, winZMin], [-cWidth, 0.5, winZMin], [-cWidth, 0.5, 11.8], [-cWidth, -3.5, 11.8]],
        fill: "#0284c7",
        fillOpacity: 0.45,
        stroke: "#38bdf8",
        strokeWidth: 0.3,
      },
      {
        points3D: [[-cWidth, -9.5, winZMin], [-cWidth, -5.5, winZMin], [-cWidth, -5.5, 11.8], [-cWidth, -9.5, 11.8]],
        fill: "#0284c7",
        fillOpacity: 0.45,
        stroke: "#38bdf8",
        strokeWidth: 0.3,
      },
    ],
  });

  // Cabin roof
  polys.push({
    id: "cabin-roof",
    points3D: [
      [-cWidth, cFwd, cTop],
      [cWidth, cFwd, cTop],
      [cWidth, cAft, cTop],
      [-cWidth, cAft, cTop],
    ],
    fill: "#162c4a",
    stroke: "#2c568b",
    forceVisible: true,
  });

  // Filter with back-face culling & calculate depth
  interface ProjectedOverlay {
    points2D: Array<{ x: number; y: number }>;
    fill: string;
    stroke: string;
    strokeWidth: number;
    fillOpacity?: number;
  }

  interface ProjectedFace {
    id: string;
    points2D: Array<{ x: number; y: number }>;
    fill: string;
    stroke: string;
    strokeWidth: number;
    fillOpacity?: number;
    avgDepth: number;
    overlays?: ProjectedOverlay[];
  }

  const visibleFaces: ProjectedFace[] = [];
  for (const poly of polys) {
    const projected = poly.points3D.map(proj);
    const area = area2D(projected);
    if (area > 0.005 || poly.forceVisible) {
      const avgDepth = projected.reduce((sum, p) => sum + p.depth, 0) / projected.length;
      const projectedOverlays = poly.overlays?.map((ov) => ({
        points2D: ov.points3D.map(proj),
        fill: ov.fill,
        stroke: ov.stroke,
        strokeWidth: ov.strokeWidth ?? 0.3,
        fillOpacity: ov.fillOpacity,
      }));

      visibleFaces.push({
        id: poly.id,
        points2D: projected,
        fill: poly.fill,
        stroke: poly.stroke,
        strokeWidth: poly.strokeWidth ?? 0.4,
        fillOpacity: poly.fillOpacity,
        avgDepth,
        overlays: projectedOverlays,
      });
    }
  }

  // Masts and standing rigging
  interface ProjectedLine {
    id: string;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    avgDepth: number;
    stroke: string;
    strokeWidth: number;
  }

  // Line-of-sight occlusion calculations:
  const cosBearing = Math.cos(rad);

  // Cabin horizontal footprint in 2D projection
  const cabinCorners3D: Vec3[] = [
    [-cWidth, cFwd, cBottom],
    [cWidth, cFwd, cBottom],
    [cWidth, cAft, cBottom],
    [-cWidth, cAft, cBottom],
    [-cWidth, cFwd, cTop],
    [cWidth, cFwd, cTop],
    [cWidth, cAft, cTop],
    [-cWidth, cAft, cTop],
  ];
  const cabinProj = cabinCorners3D.map(proj);
  const minCabinX = Math.min(...cabinProj.map((p) => p.x));
  const maxCabinX = Math.max(...cabinProj.map((p) => p.x));

  const foreMastX = proj([0, 20, 5.8]).x;
  // Lower section of fore mast (deck to cabin roof) is occluded when looking from astern and behind cabin body
  const foreLowerOccluded =
    cosBearing < 0 && foreMastX >= minCabinX - 0.2 && foreMastX <= maxCabinX + 0.2;

  const lines3D: Array<{ id: string; p1: Vec3; p2: Vec3; stroke?: string; strokeWidth?: number }> = [];

  // Bow jackstaff at prow (naturally occluded by hull/superstructure via depth sorting)
  lines3D.push({ id: "jackstaff", p1: [0, 36, 7.5], p2: [0, 36, 10.0], stroke: "#2a4d79", strokeWidth: 0.5 });

  // Stern flagstaff at transom (naturally occluded by hull/superstructure via depth sorting)
  lines3D.push({ id: "flagstaff", p1: [0, -38, 4.5], p2: [0, -38, 7.0], stroke: "#1f3a5d", strokeWidth: 0.5 });

  // Fore mast lower section (from deck z=5.8 to cabin roof z=13.0; hidden when occluded by cabin)
  if (!foreLowerOccluded) {
    lines3D.push({ id: "fore-mast-lower", p1: [0, 20, 5.8], p2: [0, 20, 13.0], stroke: "#254773", strokeWidth: 0.6 });
  }

  // Fore mast upper section (from cabin roof z=13.0 to top z=32.0; always visible above cabin roof)
  lines3D.push({ id: "fore-mast-upper", p1: [0, 20, 13.0], p2: [0, 20, 32], stroke: "#254773", strokeWidth: 0.6 });

  // Fore mast yardarm
  lines3D.push({ id: "fore-yardarm", p1: [-3.2, 20, 24], p2: [3.2, 20, 24], stroke: "#254773", strokeWidth: 0.5 });

  // Main / Radar mast (on wheelhouse roof at y=-6)
  lines3D.push({ id: "main-mast", p1: [0, -6, 13], p2: [0, -6, 38], stroke: "#2b5282", strokeWidth: 0.6 });

  // Main mast yardarm / radar bar
  lines3D.push({ id: "main-yardarm", p1: [-4.2, -6, 28], p2: [4.2, -6, 28], stroke: "#2b5282", strokeWidth: 0.5 });

  const visibleLines: ProjectedLine[] = lines3D.map((l) => {
    const a = proj(l.p1);
    const b = proj(l.p2);
    return {
      id: l.id,
      p1: { x: a.x, y: a.y },
      p2: { x: b.x, y: b.y },
      avgDepth: (a.depth + b.depth) / 2,
      stroke: l.stroke ?? "#223d63",
      strokeWidth: l.strokeWidth ?? 0.5,
    };
  });

  // Sort visible items by depth (Painter's algorithm: farthest rendered first)
  type SceneItem =
    | { kind: "face"; face: ProjectedFace; depth: number }
    | { kind: "line"; line: ProjectedLine; depth: number };

  const sceneItems: SceneItem[] = [
    ...visibleFaces.map((f) => ({ kind: "face" as const, face: f, depth: f.avgDepth })),
    ...visibleLines.map((l) => ({ kind: "line" as const, line: l, depth: l.avgDepth })),
  ];
  sceneItems.sort((a, b) => a.depth - b.depth);

  // Subtle bow wave foam line at waterline bow
  const bowWl = proj([0, 31, 0]);
  const bowWaveSide1 = proj([3, 24, 0]);
  const bowWaveSide2 = proj([-3, 24, 0]);

  return (
    <g className="ship-silhouette" pointerEvents="none">
      {/* 3D vessel rendered back-to-front */}
      {sceneItems.map((item) => {
        if (item.kind === "face") {
          return (
            <g key={item.face.id}>
              <polygon
                points={toPointsString(item.face.points2D)}
                fill={item.face.fill}
                fillOpacity={item.face.fillOpacity}
                stroke={item.face.stroke}
                strokeWidth={item.face.strokeWidth}
                strokeLinejoin="round"
              />
              {item.face.overlays?.map((ov, oIdx) => (
                <polygon
                  key={`${item.face.id}-ov-${oIdx}`}
                  points={toPointsString(ov.points2D)}
                  fill={ov.fill}
                  fillOpacity={ov.fillOpacity}
                  stroke={ov.stroke}
                  strokeWidth={ov.strokeWidth}
                  strokeLinejoin="round"
                />
              ))}
            </g>
          );
        }
        return (
          <line
            key={item.line.id}
            x1={item.line.p1.x}
            y1={item.line.p1.y}
            x2={item.line.p2.x}
            y2={item.line.p2.y}
            stroke={item.line.stroke}
            strokeWidth={item.line.strokeWidth}
            strokeLinecap="round"
          />
        );
      })}

      {/* Subtle bow wave at waterline when bow is facing viewer */}
      {bowWl.depth > -10 && (
        <path
          d={`M ${bowWaveSide1.x} ${bowWaveSide1.y} Q ${bowWl.x} ${bowWl.y + 0.6} ${bowWaveSide2.x} ${bowWaveSide2.y}`}
          stroke="#38bdf8"
          strokeOpacity="0.35"
          strokeWidth="0.4"
          fill="none"
        />
      )}
    </g>
  );
}

/** React SVG elements; wrap the result in an <svg> with an appropriate viewBox. */
export function renderSvg(
  scenario: Scenario,
  bearingDeg: number,
  timeMs = 0,
  showSilhouette = false,
): ReactElement {
  const view = projectDisplay(buildDisplay(scenario), bearingDeg, timeMs);
  const litLights = view.lights.filter((light) => light.on);
  return (
    <>
      <defs>
        <GlowFilter id="glow-white" color={COLORS.white} />
        <GlowFilter id="glow-red" color={COLORS.red} />
        <GlowFilter id="glow-green" color={COLORS.green} />
        <GlowFilter id="glow-yellow" color={COLORS.yellow} />
        <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#09182d" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Night background */}
      <rect x="-60" y="-65" width="120" height="80" fill="#020617" />
      {/* Waterline & subtle sea surface */}
      <rect x="-60" y="0" width="120" height="15" fill="url(#water-grad)" />
      <line x1="-58" y1="0" x2="58" y2="0" stroke="#1b3452" strokeWidth="0.4" strokeOpacity="0.8" />
      {/* Ship silhouette */}
      {showSilhouette && renderShipSilhouette(bearingDeg)}
      {/* Navigation lights */}
      {litLights.map((light) => renderLight(light, litLights))}
    </>
  );
}

/* ===========================================================================
 * Starter catalogue. Change length/state/options to generate further variants.
 * ========================================================================== */

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
