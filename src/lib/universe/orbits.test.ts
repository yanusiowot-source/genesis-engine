import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { OUR_UNIVERSE, evaluate } from "./physics.ts";
import { cosmicAgeGyr } from "./observatory.ts";
import {
  GAUSS_G,
  hillRadiusAu,
  HOUR_YR,
  keplerPeriodYr,
  keplerPoint,
  keplerVelocity,
  meanLongitude,
  MEARTH_MSUN,
  moonsOf,
  pericenterAu,
  photosphereAu,
  photosphereRsun,
  planetFate,
  ringOf,
  settlePlanets,
  starAccel,
  systemOf,
  WATCH_HOUR_CAP,
  watchPlanets,
  type Planet,
} from "./orbits.ts";

describe("kepler worlds", () => {
  it("gives the Earth a one-year orbit and does not let the Sun swallow it", () => {
    assert.ok(Math.abs(keplerPeriodYr(1, 1) - 1) < 1e-12);
    assert.ok(Math.abs(keplerPeriodYr(5.2, 1) - 11.857) < 0.01);
    assert.equal(planetFate(1, photosphereAu(1, "mainSequence")), "bound");
    assert.equal(planetFate(0.04, photosphereAu(1, "giant")), "swallowed");
    assert.equal(planetFate(1, photosphereAu(1, "giant")), "bound");
    assert.equal(planetFate(0.05, 0.05), "swallowed");
    assert.equal(planetFate(0.08, 0.065, 0.35), "swallowed");
    assert.equal(planetFate(1, photosphereAu(1, "giant"), 0.2), "bound");
    assert.equal(photosphereRsun(1, "whiteDwarf"), 0);
    assert.equal(planetFate(0.03, photosphereAu(1, "neutronStar")), "bound");
  });

  it("advances mean longitude by half a turn in half a year", () => {
    const half = meanLongitude(1, 1, 0.5e-9);
    assert.ok(Math.abs(half - Math.PI) < 1e-6);
    assert.equal(meanLongitude(1, 1, 0), 0);
  });

  it("builds a finite system in our sky and leaves life untouched", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const age = cosmicAgeGyr(0.55, OUR_UNIVERSE, ev);
    const system = systemOf(OUR_UNIVERSE, ev, age, 9);
    assert.ok(system);
    assert.equal(system.planets.length, 4);
    for (const planet of system.planets) {
      assert.ok(planet.aAu > 0.02 && planet.aAu < 20);
      assert.ok(planet.periodYr > 0);
      if (planet.fate === "bound") {
        assert.ok(pericenterAu(planet.aAu, planet.ecc) > system.photosphereAu);
      }
      assert.ok(Number.isFinite(planet.pull.starAuYr2) && planet.pull.starAuYr2 > 0);
      assert.ok(Number.isFinite(planet.pull.othersAuYr2));
      assert.ok(planet.encounter === "clear" || planet.encounter === "crossing" || planet.encounter === "impact");
      assert.ok(planet.longitude >= 0 && planet.longitude < Math.PI * 2 + 1e-9);
      assert.ok(planet.fate === "bound" || planet.fate === "swallowed");
      if (planet.fate === "swallowed") {
        assert.equal(planet.ring, null);
        assert.equal(planet.moons.length, 0);
      }
      const closest = pericenterAu(planet.aAu, planet.ecc);
      const hill = hillRadiusAu(Math.max(closest, 1e-8), planet.massMe, system.mass);
      for (const moon of planet.moons) {
        assert.ok(moon.aAu > 0 && moon.aAu < hill * 0.4 + 1e-12);
        assert.ok(closest - moon.aAu > system.photosphereAu);
        assert.ok(moon.periodYr > 0);
      }
      if (planet.ring) {
        assert.ok(planet.ring.outerAu > planet.ring.innerAu);
        assert.ok(planet.ring.outerAu < hill);
      }
    }
    assert.equal(evaluate(OUR_UNIVERSE).lifeProb, ev.lifeProb);
    const panel = readFileSync(new URL("../../components/worlds-panel.tsx", import.meta.url), "utf8");
    const listAt = panel.indexOf("<ul");
    const emptyAt = panel.indexOf("worldsEmpty");
    const hintAt = panel.indexOf("worldsHint");
    assert.ok(listAt > 0 && emptyAt > listAt && hintAt > emptyAt);
  });

  it("gives a Jupiter-mass world a ring and the Earth a moon of about 27 days", () => {
    const ring = ringOf(318, 5.2, 1, "bound", 0);
    assert.ok(ring);
    assert.ok(ring.outerAu > ring.innerAu);
    assert.equal(ringOf(1, 1, 1, "bound", 0), null);
    assert.equal(ringOf(318, 5.2, 1, "swallowed", 0), null);
    const days = keplerPeriodYr(0.00257, MEARTH_MSUN) * 365.25;
    assert.ok(Math.abs(days - 27.3) < 0.5);
    const moons = moonsOf(1, 1, 1, 4.5, "bound", 0, () => 0.2);
    assert.ok(moons.length >= 1);
    assert.ok(moons.every((moon) => moon.aAu < hillRadiusAu(1, 1, 1)));
    assert.equal(moonsOf(1, 1, 1, 4.5, "swallowed", 0, () => 0.2).length, 0);
    const clipped = moonsOf(300, 0.2, 1, 1, "bound", 0.19, () => 0.2);
    assert.ok(clipped.every((moon) => 0.2 - moon.aAu > 0.19));
  });

  it("merges overlapping worlds and keeps a distant pull Newtonian", () => {
    assert.ok(Math.abs(starAccel(1, 1) - GAUSS_G) < 1e-9);
    const blank = (): Planet["pull"] => ({ starAuYr2: 0, othersAuYr2: 0 });
    const world = (over: Partial<Planet>): Planet => ({
      aAu: 1,
      massMe: 1,
      periodYr: 1,
      longitude: 0,
      ecc: 0,
      fate: "bound",
      ring: null,
      moons: [],
      pull: blank(),
      encounter: "clear",
      ...over,
    });
    const merged = settlePlanets([world({}), world({ massMe: 1 })], 1, 0);
    assert.equal(merged.length, 1);
    assert.ok(Math.abs(merged[0].massMe - 2) < 1e-9);
    assert.equal(merged[0].encounter, "impact");
    assert.equal(merged[0].ecc, 0);
    const far = settlePlanets(
      [world({ aAu: 1, massMe: 1 }), world({ aAu: 5.2, massMe: 318, longitude: 0 })],
      1,
      0,
    );
    assert.equal(far.length, 2);
    assert.equal(far[0].encounter, "clear");
    const earth = far.find((planet) => planet.aAu < 2);
    assert.ok(earth);
    assert.ok(earth.pull.othersAuYr2 > 0);
    assert.ok(earth.pull.othersAuYr2 / earth.pull.starAuYr2 < 1e-3);
    const crossed = settlePlanets(
      [world({ aAu: 1, ecc: 0.4, longitude: 0 }), world({ aAu: 1.2, ecc: 0.4, longitude: Math.PI })],
      1,
      0,
    );
    assert.equal(crossed.length, 2);
    assert.equal(crossed[0].encounter, "crossing");
  });

  it("holds a short circular orbit with an hourly velocity Verlet step", () => {
    const axis = 0.05;
    const hours = keplerPeriodYr(axis, 1) / HOUR_YR;
    const planet: Planet = {
      aAu: axis,
      massMe: 1,
      periodYr: keplerPeriodYr(axis, 1),
      longitude: 0,
      ecc: 0,
      fate: "bound",
      ring: null,
      moons: [],
      pull: { starAuYr2: 0, othersAuYr2: 0 },
      encounter: "clear",
    };
    const watched = watchPlanets([planet], 1, hours);
    assert.ok(watched.hours < WATCH_HOUR_CAP);
    assert.equal(watched.impacts, 0);
    assert.ok(Math.abs(watched.drift) < 1e-6);
    const capped = watchPlanets([planet], 1, 1e6);
    assert.equal(capped.hours, WATCH_HOUR_CAP);
  });

  it("puts an eccentric orbit on the vis-viva energy and still steps it", () => {
    const axis = 0.05;
    const ecc = 0.35;
    const state = keplerVelocity(axis, ecc, 1.2, 1);
    const radius = Math.hypot(state.x, state.y);
    const speed2 = state.vx * state.vx + state.vy * state.vy;
    const energy = 0.5 * speed2 - GAUSS_G / radius;
    assert.ok(Math.abs(energy + GAUSS_G / (2 * axis)) < 1e-8);
    assert.ok(radius >= axis * (1 - ecc) - 1e-12);
    assert.ok(radius <= axis * (1 + ecc) + 1e-12);
    const pericenter = keplerPoint(axis, ecc, 0);
    assert.ok(Math.abs(Math.atan2(pericenter.y, pericenter.x)) < 1e-9);
    const quarter = keplerPoint(1, ecc, Math.PI / 2);
    const trueQuarter = Math.atan2(quarter.y, quarter.x);
    assert.ok(Math.abs(trueQuarter - Math.PI / 2) > 0.05);
    const planet: Planet = {
      aAu: axis,
      massMe: 1,
      periodYr: keplerPeriodYr(axis, 1),
      longitude: 1.2,
      ecc,
      fate: "bound",
      ring: null,
      moons: [],
      pull: { starAuYr2: 0, othersAuYr2: 0 },
      encounter: "clear",
    };
    const watched = watchPlanets([planet], 1, keplerPeriodYr(axis, 1) / HOUR_YR);
    assert.equal(watched.impacts, 0);
    assert.ok(Math.abs(watched.drift) < 1e-5);
  });

  it("solves Kepler to the step tolerance and shrinks Hill by (1 − e)", () => {
    const axis = 5.2;
    const ecc = 0.9;
    const mean = 0.2;
    const point = keplerPoint(axis, ecc, mean);
    const cosE = point.x / axis + ecc;
    const sinE = point.y / (axis * Math.sqrt(1 - ecc * ecc));
    const anomaly = Math.atan2(sinE, cosE);
    const residual = anomaly - ecc * Math.sin(anomaly) - mean;
    assert.ok(Math.abs(residual) < 1e-12);
    const nu = Math.atan2(point.y, point.x);
    const radius = Math.hypot(point.x, point.y);
    const ellipse = (axis * (1 - ecc * ecc)) / (1 + ecc * Math.cos(nu));
    assert.ok(Math.abs(radius - ellipse) < 1e-9);
    const full = hillRadiusAu(axis, 318, 1);
    const peri = hillRadiusAu(pericenterAu(axis, ecc), 318, 1);
    assert.ok(Math.abs(peri / full - (1 - ecc)) < 1e-12);
  });
});
