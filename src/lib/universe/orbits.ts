import {
  evolveStar,
  imfHighMass,
  imfNicheOf,
  sampleMass,
} from "./observatory.ts";
import { mulberry32 } from "./rng.ts";
import type { Evaluation, StellarStage, UniverseParams } from "./types.ts";

/** 1 R☉ in AU. Photospheres use the mass–radius law, not the canvas speck. */
export const RSUN_AU = 0.00465047;
/** Earth mass in solar units. Moons orbit this, not the star. */
export const MEARTH_MSUN = 1 / 332946;
/** Mean Earth radius in AU. Used only so a ring has a place to sit. */
export const REARTH_AU = 4.25875e-5;
/** AU³ / (M☉ yr²). Chosen so that P² = a³/M. */
export const GAUSS_G = 4 * Math.PI * Math.PI;
/** One hour in years. 365.25 × 24. */
export const HOUR_YR = 1 / (365.25 * 24);
/** The watch stops here. An hour-step cannot march to a stellar age. */
export const WATCH_HOUR_CAP = 240;
export const WATCH_HOURS = 72;

export type PlanetFate = "bound" | "swallowed";
export type Encounter = "clear" | "crossing" | "impact";

export type Ring = {
  innerAu: number;
  outerAu: number;
};

export type GravityPull = {
  starAuYr2: number;
  othersAuYr2: number;
};

export type Moon = {
  aAu: number;
  massMe: number;
  periodYr: number;
  longitude: number;
};

export type Planet = {
  aAu: number;
  massMe: number;
  periodYr: number;
  longitude: number;
  ecc: number;
  fate: PlanetFate;
  ring: Ring | null;
  moons: Moon[];
  pull: GravityPull;
  encounter: Encounter;
};

export type WorldSystem = {
  mass: number;
  stage: StellarStage;
  starAgeGyr: number;
  photosphereAu: number;
  planets: Planet[];
};

/** Envelope in solar radii. Remnants have none. Supernova keeps the giant envelope, not the flash. */
export function photosphereRsun(mass: number, stage: StellarStage): number {
  if (
    stage === "unborn" ||
    stage === "whiteDwarf" ||
    stage === "neutronStar" ||
    stage === "blackHole"
  ) {
    return 0;
  }
  const mainSequence = Math.pow(Math.max(mass, 0.08), 0.8);
  if (stage === "mainSequence") return mainSequence;
  return mainSequence * 14;
}

export function photosphereAu(mass: number, stage: StellarStage): number {
  return photosphereRsun(mass, stage) * RSUN_AU;
}

/** Circular Kepler period in years. P² = a³ / M of the central body. The orbiting mass does not enter. */
export function keplerPeriodYr(aAu: number, massMsun: number): number {
  if (!(aAu > 0) || !(massMsun > 0)) return 0;
  return Math.sqrt((aAu * aAu * aAu) / massMsun);
}

/** Mean longitude in radians, from stellar age. One year at 1 AU around 1 M☉ is a full turn. */
export function meanLongitude(aAu: number, massMsun: number, starAgeGyr: number): number {
  const period = keplerPeriodYr(aAu, massMsun);
  if (!(period > 0) || !(starAgeGyr > 0)) return 0;
  const turns = (starAgeGyr * 1e9) / period;
  const frac = turns - Math.floor(turns);
  return frac * Math.PI * 2;
}

export function pericenterAu(aAu: number, ecc: number): number {
  const e = Math.min(0.9, Math.max(0, ecc));
  return aAu * (1 - e);
}

/** Swallowed when the closest point of the ellipse meets the photosphere, not merely the semi-major axis. */
export function planetFate(aAu: number, envelopeAu: number, ecc = 0): PlanetFate {
  return pericenterAu(aAu, ecc) <= envelopeAu ? "swallowed" : "bound";
}

/**
 * Sketch radius in Earth radii so a ring has a width.
 * Earth is 1. A Jupiter mass is 11. Not an interior model.
 */
export function planetRadiusEarth(massMe: number): number {
  const mass = Math.max(massMe, 0.05);
  if (mass <= 1) return Math.pow(mass, 0.3);
  if (mass <= 15) return Math.pow(mass, 0.5);
  const t = Math.min(1, Math.log(mass / 15) / Math.log(318 / 15));
  return Math.sqrt(15) + (11 - Math.sqrt(15)) * t;
}

export function planetRadiusAu(massMe: number): number {
  return planetRadiusEarth(massMe) * REARTH_AU;
}

/** Hill radius. A moon outside this belongs to the star, not the planet. */
export function hillRadiusAu(aAu: number, massMe: number, massMsun: number): number {
  const star = Math.max(massMsun, 1e-6);
  const planet = Math.max(massMe, 1e-6) * MEARTH_MSUN;
  return aAu * Math.cbrt(planet / (3 * star));
}

/** Bound gas world only. The Hill sphere is taken at pericenter, where it is smallest. */
export function ringOf(
  massMe: number,
  aAu: number,
  massMsun: number,
  fate: PlanetFate,
  envelopeAu: number,
  ecc = 0,
): Ring | null {
  if (fate !== "bound" || massMe < 20) return null;
  const radius = planetRadiusAu(massMe);
  const hill = hillRadiusAu(Math.max(pericenterAu(aAu, ecc), 1e-8), massMe, massMsun);
  const innerAu = 1.4 * radius;
  const outerAu = 2.4 * radius;
  if (!(outerAu < hill * 0.3)) return null;
  if (!(pericenterAu(aAu, ecc) - outerAu > envelopeAu)) return null;
  return { innerAu, outerAu };
}

/** Moons sit between 4 planetary radii and the nearer of 0.4 pericenter-Hill radii and the stellar surface. */
export function moonsOf(
  massMe: number,
  aAu: number,
  massMsun: number,
  starAgeGyr: number,
  fate: PlanetFate,
  envelopeAu: number,
  rng: () => number,
  ecc = 0,
): Moon[] {
  if (fate !== "bound") return [];
  const closest = pericenterAu(aAu, ecc);
  const radius = planetRadiusAu(massMe);
  const hill = hillRadiusAu(Math.max(closest, 1e-8), massMe, massMsun);
  const inner = 4 * radius;
  const outer = Math.min(0.4 * hill, closest - envelopeAu);
  if (!(outer > inner * 1.2)) return [];
  const count = rng() < 0.45 ? 2 : 1;
  const host = massMe * MEARTH_MSUN;
  const moons: Moon[] = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 0.35 + 0.3 * rng()) / count;
    const moonAu = inner * Math.pow(outer / inner, Math.min(1, Math.max(0, u)));
    const moonMe = massMe * (0.004 + 0.02 * rng());
    moons.push({
      aAu: moonAu,
      massMe: moonMe,
      periodYr: keplerPeriodYr(moonAu, host),
      longitude: meanLongitude(moonAu, host, starAgeGyr),
    });
  }
  return moons;
}

export function starAccel(rAu: number, massMsun: number): number {
  if (!(rAu > 0) || !(massMsun > 0)) return 0;
  return (GAUSS_G * massMsun) / (rAu * rAu);
}

/** Position on the Kepler ellipse. Mean anomaly is the stored longitude. */
export function keplerPoint(aAu: number, ecc: number, mean: number): { x: number; y: number } {
  const solved = solveOrbit(aAu, ecc, mean);
  return { x: solved.x, y: solved.y };
}

function solveOrbit(
  aAu: number,
  ecc: number,
  meanAnomaly: number,
): { x: number; y: number; cosV: number; sinV: number; p: number } {
  const e = Math.min(0.9, Math.max(0, ecc));
  let mean = meanAnomaly % (Math.PI * 2);
  if (mean < 0) mean += Math.PI * 2;
  let anomaly = mean;
  for (let k = 0; k < 12; k++) {
    const slope = 1 - e * Math.cos(anomaly);
    if (!(slope > 0)) break;
    const delta = (anomaly - e * Math.sin(anomaly) - mean) / slope;
    anomaly -= delta;
    if (Math.abs(delta) < 1e-14) break;
  }
  const cosE = Math.cos(anomaly);
  const sinE = Math.sin(anomaly);
  const denom = 1 - e * cosE;
  if (!(denom > 0)) return { x: aAu, y: 0, cosV: 1, sinV: 0, p: aAu };
  const cosV = (cosE - e) / denom;
  const sinV = (Math.sqrt(Math.max(0, 1 - e * e)) * sinE) / denom;
  const radius = aAu * denom;
  return { x: radius * cosV, y: radius * sinV, cosV, sinV, p: aAu * (1 - e * e) };
}

/** Velocity on that ellipse, AU/yr. Pericenter lies on +x. */
export function keplerVelocity(
  aAu: number,
  ecc: number,
  mean: number,
  massMsun: number,
): { x: number; y: number; vx: number; vy: number } {
  const orbit = solveOrbit(aAu, ecc, mean);
  const scale = Math.sqrt((GAUSS_G * Math.max(massMsun, 0)) / Math.max(orbit.p, 1e-12));
  return {
    x: orbit.x,
    y: orbit.y,
    vx: -scale * orbit.sinV,
    vy: scale * (Math.min(0.9, Math.max(0, ecc)) + orbit.cosV),
  };
}

export function rangesCross(a0: number, e0: number, a1: number, e1: number): boolean {
  const near0 = a0 * (1 - e0);
  const far0 = a0 * (1 + e0);
  const near1 = a1 * (1 - e1);
  const far1 = a1 * (1 + e1);
  return near0 <= far1 && near1 <= far0;
}

function blankPull(): GravityPull {
  return { starAuYr2: 0, othersAuYr2: 0 };
}

function mergeWorlds(a: Planet, b: Planet, starMass: number, envelope: number): Planet {
  const pa = keplerPoint(a.aAu, a.ecc, a.longitude);
  const pb = keplerPoint(b.aAu, b.ecc, b.longitude);
  const massMe = a.massMe + b.massMe;
  const x = (a.massMe * pa.x + b.massMe * pb.x) / massMe;
  const y = (a.massMe * pa.y + b.massMe * pb.y) / massMe;
  const aAu = Math.max(1e-6, Math.hypot(x, y));
  const angle = Math.atan2(y, x);
  const fate = planetFate(aAu, envelope);
  return {
    aAu,
    massMe,
    periodYr: keplerPeriodYr(aAu, starMass),
    longitude: angle < 0 ? angle + Math.PI * 2 : angle,
    ecc: 0,
    fate,
    ring: ringOf(massMe, aAu, starMass, fate, envelope),
    moons: [],
    pull: blankPull(),
    encounter: "impact",
  };
}

function absorbMoons(planet: Planet, starMass: number): Planet {
  const surface = planetRadiusAu(planet.massMe);
  let massMe = planet.massMe;
  let moons = planet.moons.filter((moon) => {
    if (moon.aAu <= surface + planetRadiusAu(moon.massMe)) {
      massMe += moon.massMe;
      return false;
    }
    return true;
  });
  let hit = true;
  while (hit) {
    hit = false;
    for (let i = 0; i < moons.length && !hit; i++) {
      for (let j = i + 1; j < moons.length; j++) {
        const left = moons[i];
        const right = moons[j];
        const dx = left.aAu * Math.cos(left.longitude) - right.aAu * Math.cos(right.longitude);
        const dy = left.aAu * Math.sin(left.longitude) - right.aAu * Math.sin(right.longitude);
        const touch = planetRadiusAu(left.massMe) + planetRadiusAu(right.massMe);
        if (Math.hypot(dx, dy) > touch) continue;
        const mass = left.massMe + right.massMe;
        const x = (left.massMe * left.aAu * Math.cos(left.longitude) + right.massMe * right.aAu * Math.cos(right.longitude)) / mass;
        const y = (left.massMe * left.aAu * Math.sin(left.longitude) + right.massMe * right.aAu * Math.sin(right.longitude)) / mass;
        const aAu = Math.max(1e-8, Math.hypot(x, y));
        const angle = Math.atan2(y, x);
        moons = moons.filter((_, index) => index !== i && index !== j);
        moons.push({
          aAu,
          massMe: mass,
          periodYr: keplerPeriodYr(aAu, massMe * MEARTH_MSUN),
          longitude: angle < 0 ? angle + Math.PI * 2 : angle,
        });
        hit = true;
        break;
      }
    }
  }
  const band = planet.ring;
  let ring = band;
  if (band) {
    const inner = band.innerAu;
    const outer = band.outerAu;
    if (moons.some((moon) => moon.aAu >= inner && moon.aAu <= outer)) ring = null;
  }
  return {
    ...planet,
    massMe,
    periodYr: keplerPeriodYr(planet.aAu, starMass),
    moons,
    ring,
  };
}

function annotate(planet: Planet, all: Planet[], starMass: number): Planet {
  const self = keplerPoint(planet.aAu, planet.ecc, planet.longitude);
  const radius = Math.hypot(self.x, self.y);
  let ox = 0;
  let oy = 0;
  const push = (x: number, y: number, massMe: number) => {
    const dx = x - self.x;
    const dy = y - self.y;
    const dist2 = dx * dx + dy * dy;
    if (!(dist2 > 0)) return;
    const dist = Math.sqrt(dist2);
    const accel = (GAUSS_G * massMe * MEARTH_MSUN) / dist2;
    ox += (accel * dx) / dist;
    oy += (accel * dy) / dist;
  };
  for (const other of all) {
    if (other === planet) continue;
    const point = keplerPoint(other.aAu, other.ecc, other.longitude);
    push(point.x, point.y, other.massMe);
  }
  for (const moon of planet.moons) {
    push(self.x + moon.aAu * Math.cos(moon.longitude), self.y + moon.aAu * Math.sin(moon.longitude), moon.massMe);
  }
  let encounter: Encounter = planet.encounter === "impact" ? "impact" : "clear";
  if (encounter !== "impact") {
    for (const other of all) {
      if (other !== planet && rangesCross(planet.aAu, planet.ecc, other.aAu, other.ecc)) {
        encounter = "crossing";
        break;
      }
    }
  }
  return {
    ...planet,
    pull: { starAuYr2: starAccel(radius, starMass), othersAuYr2: Math.hypot(ox, oy) },
    encounter,
  };
}

/** Overlap merges and recircularizes. Crossing ellipses wait until the bodies meet. Then Newton pulls at this epoch. */
export function settlePlanets(planets: Planet[], starMass: number, envelope: number): Planet[] {
  let worlds = planets.map((planet) => ({ ...planet, moons: planet.moons.map((moon) => ({ ...moon })) }));
  for (let pass = 0; pass < 6; pass++) {
    let left = -1;
    let right = -1;
    for (let i = 0; i < worlds.length && left < 0; i++) {
      const pi = keplerPoint(worlds[i].aAu, worlds[i].ecc, worlds[i].longitude);
      const ri = planetRadiusAu(worlds[i].massMe);
      for (let j = i + 1; j < worlds.length; j++) {
        const pj = keplerPoint(worlds[j].aAu, worlds[j].ecc, worlds[j].longitude);
        const rj = planetRadiusAu(worlds[j].massMe);
        if (Math.hypot(pi.x - pj.x, pi.y - pj.y) <= ri + rj) {
          left = i;
          right = j;
          break;
        }
      }
    }
    if (left < 0 || right < 0) break;
    const merged = mergeWorlds(worlds[left], worlds[right], starMass, envelope);
    worlds = worlds.filter((_, index) => index !== left && index !== right);
    worlds.push(merged);
  }
  worlds = worlds.map((planet) => absorbMoons(planet, starMass));
  return worlds.map((planet) => annotate(planet, worlds, starMass));
}

export type OrbitWatch = {
  hours: number;
  drift: number;
  impacts: number;
};

type WatchBody = { m: number; x: number; y: number; vx: number; vy: number; r: number };

function accelerations(bodies: WatchBody[], starMass: number): { ax: number; ay: number }[] {
  return bodies.map((body, index) => {
    const radius = Math.hypot(body.x, body.y) || 1e-8;
    const star = starAccel(radius, starMass);
    let ax = (-star * body.x) / radius;
    let ay = (-star * body.y) / radius;
    for (let other = 0; other < bodies.length; other++) {
      if (other === index) continue;
      const dx = bodies[other].x - body.x;
      const dy = bodies[other].y - body.y;
      const dist2 = dx * dx + dy * dy;
      if (!(dist2 > 0)) continue;
      const dist = Math.sqrt(dist2);
      const pull = (GAUSS_G * bodies[other].m) / dist2;
      ax += (pull * dx) / dist;
      ay += (pull * dy) / dist;
    }
    return { ax, ay };
  });
}

function mechanicalEnergy(bodies: WatchBody[], starMass: number): number {
  let energy = 0;
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const radius = Math.hypot(body.x, body.y) || 1e-8;
    energy += 0.5 * body.m * (body.vx * body.vx + body.vy * body.vy);
    energy -= (GAUSS_G * starMass * body.m) / radius;
    for (let j = i + 1; j < bodies.length; j++) {
      const dist = Math.hypot(body.x - bodies[j].x, body.y - bodies[j].y) || 1e-8;
      energy -= (GAUSS_G * body.m * bodies[j].m) / dist;
    }
  }
  return energy;
}

function mergeWatch(bodies: WatchBody[]): number {
  let hits = 0;
  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < bodies.length && !found; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dist = Math.hypot(bodies[i].x - bodies[j].x, bodies[i].y - bodies[j].y);
        if (dist > bodies[i].r + bodies[j].r) continue;
        const mass = bodies[i].m + bodies[j].m;
        bodies.push({
          m: mass,
          x: (bodies[i].m * bodies[i].x + bodies[j].m * bodies[j].x) / mass,
          y: (bodies[i].m * bodies[i].y + bodies[j].m * bodies[j].y) / mass,
          vx: (bodies[i].m * bodies[i].vx + bodies[j].m * bodies[j].vx) / mass,
          vy: (bodies[i].m * bodies[i].vy + bodies[j].m * bodies[j].vy) / mass,
          r: planetRadiusAu(mass / MEARTH_MSUN),
        });
        bodies.splice(j, 1);
        bodies.splice(i, 1);
        hits += 1;
        found = true;
        break;
      }
    }
  }
  return hits;
}

/**
 * Direct sum of Newton forces, N², then velocity Verlet. One hour per step, planets only.
 * Not a tree, not a mesh, not Wisdom–Holman, not IAS15, not RADAU.
 * Capped at WATCH_HOUR_CAP. Moons are not bodies here. Not a run to stellar age.
 */
export function watchPlanets(planets: Planet[], starMass: number, hours: number): OrbitWatch {
  const steps = Math.max(0, Math.min(WATCH_HOUR_CAP, Math.floor(hours)));
  const bound = planets.filter((planet) => planet.fate === "bound" && planet.massMe > 0);
  if (bound.length === 0 || steps === 0 || !(starMass > 0)) return { hours: steps, drift: 0, impacts: 0 };
  const bodies: WatchBody[] = bound.map((planet) => {
    const state = keplerVelocity(planet.aAu, planet.ecc, planet.longitude, starMass);
    return {
      m: planet.massMe * MEARTH_MSUN,
      x: state.x,
      y: state.y,
      vx: state.vx,
      vy: state.vy,
      r: planetRadiusAu(planet.massMe),
    };
  });
  const dt = HOUR_YR;
  let impacts = 0;
  const energy0 = mechanicalEnergy(bodies, starMass);
  let acc = accelerations(bodies, starMass);
  for (let step = 0; step < steps; step++) {
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx += (acc[i].ax * dt) / 2;
      bodies[i].vy += (acc[i].ay * dt) / 2;
      bodies[i].x += bodies[i].vx * dt;
      bodies[i].y += bodies[i].vy * dt;
    }
    impacts += mergeWatch(bodies);
    acc = accelerations(bodies, starMass);
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx += (acc[i].ax * dt) / 2;
      bodies[i].vy += (acc[i].ay * dt) / 2;
    }
  }
  const energy1 = mechanicalEnergy(bodies, starMass);
  const drift = energy0 === 0 ? 0 : (energy1 - energy0) / Math.abs(energy0);
  return { hours: steps, drift, impacts };
}

const PLANET_COUNT = 4;
const AXIS_IN_AU = 0.03;
const AXIS_OUT_AU = 18;

export function placePlanets(
  massMsun: number,
  stage: StellarStage,
  starAgeGyr: number,
  rng: () => number,
): Planet[] {
  const envelope = photosphereAu(massMsun, stage);
  const log0 = Math.log(AXIS_IN_AU);
  const log1 = Math.log(AXIS_OUT_AU);
  const planets: Planet[] = [];
  for (let i = 0; i < PLANET_COUNT; i++) {
    const u = (i + 0.15 + 0.7 * rng()) / PLANET_COUNT;
    const aAu = Math.exp(log0 + (log1 - log0) * Math.min(1, Math.max(0, u)));
    const massMe = aAu < 1.5 ? 0.3 + rng() * 12 : 20 + rng() * 400;
    const ecc = rng() * 0.35;
    const fate = planetFate(aAu, envelope, ecc);
    planets.push({
      aAu,
      massMe,
      periodYr: keplerPeriodYr(aAu, massMsun),
      longitude: meanLongitude(aAu, massMsun, starAgeGyr),
      ecc,
      fate,
      ring: ringOf(massMe, aAu, massMsun, fate, envelope, ecc),
      moons: moonsOf(massMe, aAu, massMsun, starAgeGyr, fate, envelope, rng, ecc),
      pull: { starAuYr2: 0, othersAuYr2: 0 },
      encounter: "clear",
    });
  }
  return settlePlanets(planets, massMsun, envelope);
}

/** One star from this sky's mass function, and up to four worlds. Null before ignition. */
export function systemOf(
  params: UniverseParams,
  ev: Evaluation,
  ageGyr: number,
  seed: number,
): WorldSystem | null {
  if (ageGyr < ev.timeToStarsGyr) return null;
  const rng = mulberry32(seed >>> 0);
  const slope = imfHighMass(params, ev);
  const mass = sampleMass(rng, slope, imfNicheOf(slope));
  const born = ev.timeToStarsGyr + rng() * Math.max(ageGyr * 0.85, 0.05);
  const starAgeGyr = ageGyr - born;
  const state = evolveStar(mass, starAgeGyr, params.gravity);
  if (state.stage === "unborn") return null;
  return {
    mass,
    stage: state.stage,
    starAgeGyr,
    photosphereAu: photosphereAu(mass, state.stage),
    planets: placePlanets(mass, state.stage, starAgeGyr, rng),
  };
}
