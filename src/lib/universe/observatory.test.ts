import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmbTempK,
  acousticDossier,
  acousticScale,
  circularSpeed,
  circularOmega,
  cosmicAgeGyr,
  epochAt,
  epochBlend,
  epochJumpT,
  epochShown,
  holeEpoch,
  epochTickT,
  DISK_MESH,
  diskDossier,
  plummerCircular,
  plummerScale,
  hernquistCircular,
  hernquistScale,
  HERNQUIST_RE,
  effectiveRadius,
  massToLight,
  sersicIndex,
  fpMassSequence,
  upsilonAtMass,
  mlBranch,
  imfHighMass,
  imfNicheOf,
  imfMeanMass,
  imfSnFrac,
  imfReturn,
  imfYield,
  magorrianRatio,
  bhMass,
  silkReesMass,
  bulgeSigmaKms,
  sphereOfInfluence,
  agnNicheOf,
  agnDossier,
  kerrIsco,
  novikovThorne,
  blandfordZnajek,
  blandfordPayne,
  spinEnergy,
  plasmaBeta,
  magRamRatio,
  magnetoRadius,
  fluxAdvection,
  fluxTransportOf,
  magnetization,
  madFill,
  madVar,
  fanaroffRiley,
  isAdaf,
  horizonOmega,
  fieldOmega,
  grmhdDossier,
  MAGORRIAN_PIN,
  imfXi,
  imfShape,
  upsilonStar,
  massEstimates,
  IMF_CHABRIER,
  IMF_SALPETER,
  FP_MSTAR,
  FP_M0,
  toomreAt,
  toomreProfile,
  einastoAlpha,
  einastoRho,
  einsteinRadius,
  nfwRho,
  EVOLVE_RATE,
  evolveStar,
  galaxyVisibility,
  fateWash,
  haloDossier,
  LENS_SIGMA_CRIT,
  lensImages,
  meanSigma,
  nfwCircular,
  nfwConcentration,
  baryonContraction,
  burkertCircular,
  burkertRmax,
  burkertRho,
  burkertScale,
  BURKERT_RMAX,
  haloCircular,
  haloDensityCompare,
  logSlope,
  haloModel,
  haloWashShape,
  BURKERT_NOISE,
  nfwCoreRadius,
  nfwEinsteinX,
  nfwF,
  nfwKappa,
  nfwKappaS,
  nfwLensImages,
  lensMapInvariants,
  coreNfwIndex,
  coreNfwMassFraction,
  coreNfwRadius,
  nfwMassFraction,
  nfwMeanKappa,
  nfwScale,
  NFW_RVIR,
  nowMarker,
  rotationCurve,
  ROTATION_V0,
  scalingDossier,
  sampleMass,
  samplePopulation,
  scaleFactor,
  starLifetimeGyr,
  stepCosmicTime,
} from "./observatory.ts";
import {
  DESERT_EPOCH,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  darkMatterFraction,
  environmentClass,
  environmentDensity,
  evaluate,
  hubbleMix,
  PARAM_META,
} from "./physics.ts";
import { mulberry32 } from "./rng.ts";

describe("Hubble environment", () => {
  it("places our universe in a group with spiral-dominant mix", () => {
    const env = environmentDensity(OUR_UNIVERSE);
    assert.ok(env > 0.28 && env < 0.4);
    assert.equal(environmentClass(env), "group");
    const mix = hubbleMix(env);
    assert.ok(mix.spiral > 0.5 && mix.spiral < 0.7);
    assert.ok(mix.elliptical > 0.2 && mix.elliptical < 0.4);
    assert.ok(mix.irregular > 0.08 && mix.irregular < 0.2);
    const ev = evaluate(OUR_UNIVERSE);
    assert.equal(ev.morphology, "spiral");
    assert.ok(Math.abs(ev.darkMatterFraction - 0.85) < 0.05);
  });

  it("turns dense, slow skies toward ellipticals", () => {
    const dense = {
      ...OUR_UNIVERSE,
      matter: 1.4,
      expansion: 0.4,
      complexity: 0.5,
      gravity: 1.1,
    };
    const env = environmentDensity(dense);
    assert.equal(environmentClass(env), "cluster");
    assert.ok(hubbleMix(env).elliptical > hubbleMix(env).spiral);
  });

  it("keeps the silicon corridor elliptical and the desert scattered", () => {
    assert.equal(evaluate(SILICON_CORRIDOR).morphology, "elliptical");
    assert.equal(evaluate(DESERT_EPOCH).morphology, "scattered");
  });

  it("keeps dark-matter fraction in (0.6, 0.94)", () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 20; i++) {
      const dm = darkMatterFraction({
        gravity: 1,
        expansion: 0.5 + rng(),
        darkEnergy: rng(),
        matter: 0.1 + rng(),
        complexity: rng(),
        quantumNoise: rng() * 0.4,
      });
      assert.ok(dm >= 0.6 && dm <= 0.94);
    }
  });
});

describe("cosmic clock", () => {
  it("labels the slider epochs in order", () => {
    assert.equal(epochAt(0), "inflation");
    assert.equal(epochAt(0.1), "recombination");
    assert.equal(epochAt(0.2), "darkAges");
    assert.equal(epochAt(0.3), "reionization");
    assert.equal(epochAt(0.55), "stellar");
    assert.equal(epochAt(0.8), "degeneracy");
    assert.equal(epochAt(0.9), "blackHoles");
    assert.equal(epochAt(1), "heatDeath");
  });

  it("crossfades the last stretch of each epoch", () => {
    const mid = epochBlend(0.57);
    assert.equal(mid.from, "stellar");
    assert.equal(mid.to, "degeneracy");
    assert.equal(mid.mix, 0);

    const late = epochBlend(0.42 + (0.72 - 0.42) * 0.9);
    assert.equal(late.from, "stellar");
    assert.equal(late.to, "degeneracy");
    assert.ok(late.mix > 0.4 && late.mix < 1);

    const edge = epochBlend(0.72);
    assert.equal(edge.from, "degeneracy");
    assert.equal(edge.mix, 0);

    const end = epochBlend(1);
    assert.equal(end.from, "heatDeath");
    assert.equal(end.to, "heatDeath");
    assert.equal(end.mix, 0);
  });

  it("names the sky from the blend, not the hard fence", () => {
    assert.equal(epochShown(0.55), "stellar");
    assert.equal(holeEpoch("stellar"), false);
    assert.equal(holeEpoch("recombination"), false);
    assert.equal(holeEpoch("degeneracy"), true);
    assert.equal(holeEpoch("blackHoles"), true);
    assert.equal(holeEpoch("heatDeath"), true);
    assert.equal(epochShown(0), "inflation");
    assert.equal(epochShown(1), "heatDeath");
    const late = 0.42 + (0.72 - 0.42) * 0.9;
    assert.equal(epochAt(late), "stellar");
    assert.equal(epochShown(late), "degeneracy");
  });

  it("lands each jump inside the epoch it named", () => {
    const ev = evaluate(OUR_UNIVERSE);
    assert.equal(epochJumpT("heatDeath", OUR_UNIVERSE, ev), 1);
    assert.equal(epochJumpT("stellar", OUR_UNIVERSE, ev), nowMarker(OUR_UNIVERSE, ev));
    assert.equal(epochShown(epochJumpT("inflation", OUR_UNIVERSE, ev)), "inflation");
    assert.equal(epochShown(epochJumpT("reionization", OUR_UNIVERSE, ev)), "reionization");
    assert.equal(epochShown(epochJumpT("stellar", OUR_UNIVERSE, ev)), "stellar");
    assert.equal(epochShown(epochJumpT("degeneracy", OUR_UNIVERSE, ev)), "degeneracy");
    assert.equal(epochShown(epochJumpT("heatDeath", OUR_UNIVERSE, ev)), "heatDeath");
    const spark = epochJumpT("inflation", OUR_UNIVERSE, ev);
    assert.ok(spark > 0 && spark < 0.1);
  });

  it("keeps slider ticks on the era they mark, not home", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const now = nowMarker(OUR_UNIVERSE, ev);
    const stars = epochTickT("stellar");
    assert.notEqual(stars, now);
    assert.equal(epochShown(stars), "stellar");
    assert.ok(stars > 0.42 && stars < now);
    const end = epochTickT("heatDeath");
    assert.ok(end < 1);
    assert.equal(epochShown(end), "heatDeath");
    assert.equal(epochShown(epochTickT("recombination")), "recombination");
    assert.equal(epochShown(epochTickT("blackHoles")), "blackHoles");
  });

  it("lerps galaxy visibility across an epoch boundary", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const a = galaxyVisibility(0.71, ev);
    const b = galaxyVisibility(0.72, ev);
    assert.ok(Math.abs(a - b) < 0.2);
    assert.equal(galaxyVisibility(0.05, ev), 0);
  });

  it("hides a healthy disk on skies that already ended", () => {
    const ours = evaluate(OUR_UNIVERSE);
    const flash = evaluate({ ...OUR_UNIVERSE, gravity: 1.9 });
    assert.equal(flash.fate, "flash");
    assert.ok(galaxyVisibility(0.55, flash) < galaxyVisibility(0.55, ours) * 0.35);
    const dead = evaluate({ ...OUR_UNIVERSE, gravity: 0.2, matter: 0.04 });
    assert.ok(dead.fate === "void" || dead.fate === "fog");
    assert.ok(galaxyVisibility(0.55, dead) < 0.05);
  });

  it("advances from a single rAF step and latches at heat death", () => {
    const a = stepCosmicTime(0.5, 1 / 60);
    assert.equal(a.done, false);
    assert.ok(a.t > 0.5 && a.t < 0.502);
    assert.ok(Math.abs(a.t - (0.5 + (1 / 60) * EVOLVE_RATE)) < 1e-12);

    const end = stepCosmicTime(0.999, 1);
    assert.equal(end.t, 1);
    assert.equal(end.done, true);

    const cap = stepCosmicTime(0, 10);
    assert.equal(cap.done, false);
    assert.ok(Math.abs(cap.t - 0.05 * EVOLVE_RATE) < 1e-12);
  });

  it("puts our 'now' in the stellar era with CMB near 2.7 K", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const now = nowMarker(OUR_UNIVERSE, ev);
    assert.ok(now >= 0.42 && now <= 0.7);
    assert.equal(epochAt(now), "stellar");
    const cmb = cmbTempK(now, OUR_UNIVERSE);
    assert.ok(Math.abs(cmb - 2.725) < 0.05);
    assert.ok(Math.abs(cmbTempK(now, { ...OUR_UNIVERSE, expansion: 1.6 }) - 2.725) < 0.05);
    assert.ok(Math.abs(scaleFactor(now) - 1) < 0.02);
    const age = cosmicAgeGyr(now, OUR_UNIVERSE, ev);
    assert.ok(age > 8 && age < 20);
  });

  it("makes recombination thousands of kelvin and a tiny scale factor", () => {
    const t = epochTickT("recombination");
    assert.equal(t, 0.1);
    assert.ok(cmbTempK(t, OUR_UNIVERSE) > 2500 && cmbTempK(t, OUR_UNIVERSE) < 3500);
    assert.ok(scaleFactor(t) < 0.01);
  });

  it("puts our first acoustic peak near ℓ 220", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const d = acousticDossier(OUR_UNIVERSE, ev);
    assert.ok(d.ell1 > 190 && d.ell1 < 250);
    assert.equal(d.niche, "clear");
    assert.equal(d.peaks.length, 4);
    assert.ok(d.peaks[0] && d.peaks[1] && d.peaks[0].ell < d.peaks[1].ell);
    assert.ok(d.oddEven > 1.6 && d.oddEven < 3.2);
    const dense = { ...OUR_UNIVERSE, matter: 0.7 };
    assert.ok(acousticScale(dense, evaluate(dense)) < d.ell1);
    const rich = { ...OUR_UNIVERSE, complexity: 1 };
    const loaded = acousticDossier(rich, evaluate(rich));
    assert.ok(loaded.oddEven > d.oddEven);
    assert.equal(loaded.niche, "loaded");
    const fog = { ...OUR_UNIVERSE, quantumNoise: 0.85 };
    const fogD = acousticDossier(fog, evaluate(fog));
    assert.notEqual(fogD.niche, "silent");
    const closed = { ...OUR_UNIVERSE, matter: 0.55, darkEnergy: 0.69 };
    assert.ok(acousticScale(closed, evaluate(closed)) < d.ell1);
  });

  it("widens the Einstein ring when the halo is heavier", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const ours = einsteinRadius(ev, OUR_UNIVERSE);
    const heavyP = { ...OUR_UNIVERSE, matter: 0.9 };
    const heavy = einsteinRadius(evaluate(heavyP), heavyP);
    const thinP = { ...OUR_UNIVERSE, matter: 0.12 };
    const thin = einsteinRadius(evaluate(thinP), thinP);
    assert.ok(heavy > ours);
    assert.ok(thin < ours);
    assert.ok(ours > 0.3 && ours < 0.7);
    assert.ok(Math.abs(meanSigma(ours, OUR_UNIVERSE, ev) - LENS_SIGMA_CRIT) < 0.01);
  });

  it("pushes SIS images out and shears them near the ring", () => {
    const te = 0.4;
    const far = lensImages(1.2, 0, te)[0];
    assert.ok(far && far.x > 1.2);
    const near = lensImages(0.08, 0, te);
    assert.ok(near.length >= 2);
    assert.ok(near[0] && Math.abs(near[0].x - (0.08 + te)) < 1e-9);
    assert.ok(near[1] && near[1].x < 0);
    const nearInv = lensMapInvariants(near);
    assert.equal(nearInv.multiplicity, 2);
    assert.equal(nearInv.signed, 0);
    const farAll = lensImages(1.2, 0, te);
    assert.equal(lensMapInvariants(farAll).multiplicity, 1);
    assert.equal(lensMapInvariants(farAll).signed, 1);
    const rot = lensImages(0, 0.08, te);
    assert.equal(lensMapInvariants(rot).multiplicity, nearInv.multiplicity);
    assert.equal(lensMapInvariants(rot).signed, nearInv.signed);
    const aligned = lensImages(0, 0, te)[0];
    assert.ok(aligned && Math.abs(Math.hypot(aligned.x, aligned.y) - te) < 1e-6);
    assert.ok(near[0] && far && near[0].stretch > far.stretch);
  });

  it("holds the outer disk when the halo is heavy", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const curve = rotationCurve(OUR_UNIVERSE, ev);
    const inner = curve[4];
    const outer = curve[curve.length - 1];
    assert.ok(inner && outer);
    assert.ok(outer.v > inner.v * 0.48);
    assert.ok(outer.v > outer.vBaryon * 1.35);
    assert.ok(outer.vKms > 160 && outer.vKms < 280);
    const vin = circularSpeed(0.22, OUR_UNIVERSE, ev) / 0.22;
    const vout = circularSpeed(0.95, OUR_UNIVERSE, ev) / 0.95;
    assert.ok(vin > vout);
    assert.equal(outer.vKms, outer.v * ROTATION_V0);
    const mid = curve[Math.floor(curve.length * 0.45)];
    assert.ok(mid && mid.vBaryon > outer.vBaryon);
    const thinP = { ...OUR_UNIVERSE, matter: 0.12 };
    const thin = rotationCurve(thinP, evaluate(thinP));
    const tOuter = thin[thin.length - 1];
    assert.ok(tOuter);
    assert.ok(tOuter.v / Math.max(tOuter.vBaryon, 1e-6) < outer.v / outer.vBaryon);
  });

  it("raises Einasto circular speed when G rises", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const a = haloCircular(0.8, OUR_UNIVERSE, ev, "einasto");
    const heavyG = { ...OUR_UNIVERSE, gravity: 1.45 };
    const b = haloCircular(0.8, heavyG, evaluate(heavyG), "einasto");
    assert.ok(b > a);
  });

  it("matches circularSpeed with a radial omega LUT at mid-disk", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const r = 0.45;
    const exact = circularSpeed(r, OUR_UNIVERSE, ev) / r;
    const lut = circularOmega(r, OUR_UNIVERSE, ev);
    assert.ok(Math.abs(lut - exact) / exact < 0.08);
    assert.ok(circularOmega(0.2, OUR_UNIVERSE, ev) > circularOmega(1.2, OUR_UNIVERSE, ev));
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    const inner = 0.018;
    const innerExact = circularSpeed(inner, ellP, ellE) / inner;
    assert.ok(Math.abs(circularOmega(inner, ellP, ellE) - innerExact) / innerExact < 0.1);
  });

  it("uses a Plummer bulge that is quiet at the origin and Keplerian far out", () => {
    const a = 0.1;
    assert.ok(plummerCircular(0, 1, a) < 1e-9);
    const far = plummerCircular(8, 1, a);
    assert.ok(Math.abs(far * far * 8 - 1) < 0.05);
    const ev = evaluate(OUR_UNIVERSE);
    const ours = plummerScale(OUR_UNIVERSE, ev);
    const noisyP = { ...OUR_UNIVERSE, quantumNoise: 0.9 };
    assert.ok(plummerScale(noisyP, evaluate(noisyP)) > ours);
    assert.ok(ours > 0.024 && ours < 0.08);
    const d = diskDossier(OUR_UNIVERSE, ev);
    assert.equal(d.plummerA, ours);
  });

  it("puts our disk near Toomre Q ~ 1–2, colder disks fragment", () => {
    const ours = diskDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.niche, "marginal");
    assert.ok(ours.Q > 1.05 && ours.Q < 2.55);
    assert.equal(ours.mesh.length, DISK_MESH);
    assert.ok(Math.abs(toomreAt(0.45, OUR_UNIVERSE, evaluate(OUR_UNIVERSE)) - ours.Q) < 1e-9);
    const outerQ = ours.mesh[ours.mesh.length - 1];
    assert.ok(outerQ && outerQ.Q >= ours.Q * 0.45);
    const profile = toomreProfile(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(profile.length, DISK_MESH);
    assert.ok(ours.pitchDeg > 8 && ours.pitchDeg < 28);
    assert.ok(ours.shear > 0.1);
    const noisy = diskDossier(
      { ...OUR_UNIVERSE, quantumNoise: 0.95 },
      evaluate({ ...OUR_UNIVERSE, quantumNoise: 0.95 }),
    );
    assert.ok(noisy.Q > ours.Q);
    const cold = { ...OUR_UNIVERSE, gravity: 1.1, matter: 0.5, quantumNoise: 0.01, complexity: 0.8 };
    const frag = diskDossier(cold, evaluate(cold));
    assert.equal(evaluate(cold).morphology, "spiral");
    assert.ok(frag.Q < ours.Q);
    assert.ok(frag.unstable >= 2);
    const fog = evaluate({ ...OUR_UNIVERSE, gravity: 0.2, matter: 0.04 });
    const dead = diskDossier({ ...OUR_UNIVERSE, gravity: 0.2, matter: 0.04 }, fog);
    assert.ok(fog.morphology === "scattered" || fog.fate === "void" || fog.fate === "fog");
    assert.equal(dead.niche, "rigid");
  });

  it("reads our halo as held, not a particle", () => {
    const d = haloDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(d.niche, "held");
    assert.ok(d.share > 0.8 && d.share < 0.9);
    assert.ok(d.support > 2);
    assert.ok(d.concentration > 8 && d.concentration < 18);
    assert.ok(d.rs > 0.05 && d.rs < 0.3);
    assert.ok(d.outerKms > d.baryonKms * 1.5);
    const thinP = { ...OUR_UNIVERSE, matter: 0.12 };
    const thin = haloDossier(thinP, evaluate(thinP));
    assert.ok(thin.niche === "keplerian" || thin.niche === "partial");
    const heavyP = { ...OUR_UNIVERSE, matter: 1.2 };
    const heavy = haloDossier(heavyP, evaluate(heavyP));
    assert.ok(heavy.niche === "held" || heavy.niche === "heavy");
  });

  it("gives an NFW halo a quiet centre and a declining outer mass fraction", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const c = nfwConcentration(OUR_UNIVERSE, ev);
    const rs = nfwScale(OUR_UNIVERSE, ev);
    const cEff = NFW_RVIR / rs;
    const inner = nfwCircular(0.05, 1, rs, cEff);
    const mid = nfwCircular(rs, 1, rs, cEff);
    const outer = nfwCircular(NFW_RVIR, 1, rs, cEff);
    assert.ok(inner < mid);
    assert.ok(mid > 0);
    const mVir = nfwMassFraction(NFW_RVIR, rs, cEff);
    assert.ok(Math.abs(mVir - 1) < 1e-6);
    const noisy = { ...OUR_UNIVERSE, quantumNoise: 0.9 };
    assert.ok(nfwConcentration(noisy, evaluate(noisy)) < c);
  });

  it("lenses with Bartelmann NFW, not a constant SIS kick", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const ks = nfwKappaS(OUR_UNIVERSE, ev);
    const rs = nfwScale(OUR_UNIVERSE, ev);
    assert.ok(Math.abs(nfwKappa(1, ks) - (2 * ks) / 3) < 1e-6);
    const xE = nfwEinsteinX(ks);
    assert.ok(Math.abs(nfwMeanKappa(xE, ks) - 1) < 0.05);
    assert.ok(nfwF(1) === 1);
    const far = nfwLensImages(1.2, 0, rs, ks);
    assert.ok(far[0] && far[0].x > 1.2);
    const near = nfwLensImages(0.04, 0, rs, ks);
    assert.ok(near.length >= 1);
    assert.ok(near[0] && near[0].stretch >= 1);
    const farInv = lensMapInvariants(far);
    assert.equal(farInv.multiplicity, far.length);
    assert.equal(farInv.signed, far.reduce((s, im) => s + im.parity, 0));
    const rot = nfwLensImages(0, 1.2, rs, ks);
    assert.equal(lensMapInvariants(rot).multiplicity, farInv.multiplicity);
    assert.equal(lensMapInvariants(rot).signed, farInv.signed);
    const nearRot = nfwLensImages(0, 0.04, rs, ks);
    assert.equal(lensMapInvariants(near).multiplicity, lensMapInvariants(nearRot).multiplicity);
    assert.equal(lensMapInvariants(near).signed, lensMapInvariants(nearRot).signed);
    const te = einsteinRadius(ev, OUR_UNIVERSE);
    assert.ok(Math.abs(nfwEinsteinX(ks) * rs - te) / te < 0.12);
  });

  it("keeps Einasto finite at the origin where NFW diverges", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const a = einastoAlpha(OUR_UNIVERSE, ev);
    assert.ok(a > 0.1 && a < 0.24);
    const e0 = einastoRho(1e-8, a);
    assert.ok(Number.isFinite(e0) && e0 > 0);
    const slope = (fn: (x: number) => number, x: number) => {
      const h = x * 0.2;
      return (Math.log(fn(x + h)) - Math.log(fn(x - h))) / (Math.log(x + h) - Math.log(x - h));
    };
    assert.ok(Math.abs(slope((x) => einastoRho(x, a), 1e-6)) < 0.45);
    assert.ok(slope(nfwRho, 1e-6) < -0.85);
    const noisy = { ...OUR_UNIVERSE, quantumNoise: 0.9 };
    assert.ok(einastoAlpha(noisy, evaluate(noisy)) < a);
    assert.equal(haloDossier(OUR_UNIVERSE, ev).einastoA, a);
  });

  it("picks Einasto for our disk, Burkert when the halo is cored by noise", () => {
    assert.equal(haloModel(OUR_UNIVERSE, evaluate(OUR_UNIVERSE)), "einasto");
    const noisy = { ...OUR_UNIVERSE, quantumNoise: 0.7 };
    const nEv = evaluate(noisy);
    assert.equal(haloModel(noisy, nEv), nEv.morphology === "scattered" ? "corenfw" : "burkert");
    assert.equal(burkertRho(0), 1);
    assert.ok(burkertRho(0.001) > burkertRho(3));
    const d = haloDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(d.model, "einasto");
    const lever = PARAM_META.find((m) => m.key === "quantumNoise");
    assert.ok(lever && lever.max >= BURKERT_NOISE);
    assert.ok(BURKERT_NOISE < 0.55);
    const under = { ...OUR_UNIVERSE, quantumNoise: BURKERT_NOISE - 0.01 };
    assert.notEqual(haloModel(under, evaluate(under)), "burkert");
    const over = { ...OUR_UNIVERSE, quantumNoise: lever!.max };
    const overEv = evaluate(over);
    const overModel = haloModel(over, overEv);
    assert.ok(overModel === "burkert" || overModel === "corenfw");
    const quietGlow = haloWashShape("einasto");
    const coreGlow = haloWashShape("burkert");
    const cuspGlow = haloWashShape("nfw");
    assert.ok(coreGlow.core > quietGlow.core);
    assert.ok(cuspGlow.core < quietGlow.core);
    assert.equal(haloWashShape("isothermal").core, coreGlow.core);
    const rip = fateWash("rip");
    const home = fateWash("habitable");
    assert.ok(rip && rip.a > 0.1);
    assert.equal(home, null);
    assert.equal(fateWash("void"), null);
  });

  it("gives Burkert a quiet core, r⁻³ fall, and a peak near 3.24 r₀", () => {
    assert.ok(Math.abs(logSlope(burkertRho, 1e-4)) < 0.2);
    assert.ok(logSlope(burkertRho, 20) < -2.6);
    const rc = 0.1;
    const mass = 1;
    const rvir = NFW_RVIR;
    const vPeak = burkertCircular(BURKERT_RMAX * rc, mass, rc, rvir);
    const vIn = burkertCircular(0.4 * rc, mass, rc, rvir);
    const vOut = burkertCircular(10 * rc, mass, rc, rvir);
    assert.ok(vPeak > vIn);
    assert.ok(vPeak > vOut);
    assert.ok(Math.abs(burkertRmax(rc) / rc - BURKERT_RMAX) < 1e-9);
    const quiet = burkertScale(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const noisyP = { ...OUR_UNIVERSE, quantumNoise: 0.8 };
    assert.ok(burkertScale(noisyP, evaluate(noisyP)) > quiet);
    const d = haloDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.ok(Math.abs(d.slopeB) < 0.2);
  });

  it("puts our sky on the baryonic Tully–Fisher ridge, halo-heavy below it", () => {
    const ours = scalingDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.niche, "ridge");
    assert.ok(ours.tfRatio > 0.8 && ours.tfRatio < 1.25);
    const outer = ours.rar[ours.rar.length - 1];
    assert.ok(outer && outer.gObs > outer.gBar * 1.4);
    const heavyP = { ...OUR_UNIVERSE, matter: 1.1 };
    const heavy = scalingDossier(heavyP, evaluate(heavyP));
    assert.equal(heavy.niche, "below");
    const thinP = { ...OUR_UNIVERSE, matter: 0.12 };
    const thin = scalingDossier(thinP, evaluate(thinP));
    assert.equal(thin.niche, "above");
  });

  it("reuses halo and rotation work for the same sky", () => {
    const ev = evaluate(OUR_UNIVERSE);
    assert.equal(haloDossier(OUR_UNIVERSE, ev), haloDossier(OUR_UNIVERSE, ev));
    assert.equal(rotationCurve(OUR_UNIVERSE, ev), rotationCurve(OUR_UNIVERSE, ev));
    assert.notEqual(
      haloDossier(OUR_UNIVERSE, ev),
      haloDossier({ ...OUR_UNIVERSE, matter: 0.9 }, evaluate({ ...OUR_UNIVERSE, matter: 0.9 })),
    );
  });

  it("uses a Hernquist bulge that is quiet at the origin and Keplerian far out", () => {
    const a = 0.1;
    assert.equal(hernquistCircular(0, 1, a), 0);
    const far = hernquistCircular(8, 1, a);
    assert.ok(Math.abs(far * far * 8 - 1) < 0.05);
    assert.ok(hernquistCircular(0.02, 1, a) > plummerCircular(0.02, 1, a));
  });

  it("puts a dense elliptical on the Faber–Jackson ridge", () => {
    const ours = scalingDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.kind, "tf");
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    const ell = scalingDossier(ellP, ellE);
    assert.equal(ellE.morphology, "elliptical");
    assert.equal(ell.kind, "fj");
    assert.equal(ell.fjNiche, "ridge");
    assert.ok(ell.sigmaKms > 80 && ell.sigmaKms < 160);
    const quietP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3, quantumNoise: 0.02 };
    const quiet = scalingDossier(quietP, evaluate(quietP));
    assert.equal(evaluate(quietP).morphology, "elliptical");
    assert.equal(quiet.fjNiche, "below");
    const puffedP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3, quantumNoise: 0.28 };
    const puffed = scalingDossier(puffedP, evaluate(puffedP));
    assert.equal(evaluate(puffedP).morphology, "elliptical");
    assert.equal(puffed.fjNiche, "above");
    assert.ok(quiet.sigmaKms > puffed.sigmaKms);
    const lightP = { ...OUR_UNIVERSE, gravity: 1.45, complexity: 0.1 };
    const heavyP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.25, matter: 0.9 };
    assert.ok(hernquistScale(heavyP, evaluate(heavyP)) > hernquistScale(lightP, evaluate(lightP)));
  });

  it("puts a cluster elliptical on the fundamental plane and keeps Re / a = Hernquist", () => {
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    const d = scalingDossier(ellP, ellE);
    assert.equal(ellE.morphology, "elliptical");
    assert.equal(d.fpNiche, "tight");
    assert.ok(d.fpRatio > 0.9 && d.fpRatio < 1.1);
    assert.ok(Math.abs(d.re / hernquistScale(ellP, ellE) - HERNQUIST_RE) < 1e-4);
    const quietP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3, quantumNoise: 0.02 };
    const quiet = scalingDossier(quietP, evaluate(quietP));
    assert.equal(evaluate(quietP).morphology, "elliptical");
    assert.notEqual(quiet.fpNiche, "tight");
    assert.ok(effectiveRadius(quietP, evaluate(quietP)) < d.re);
  });

  it("raises M/L and Sérsic n with mass, so the plane tilts", () => {
    const lowP = { ...OUR_UNIVERSE, gravity: 1.45, complexity: 0.1 };
    const highP = { ...OUR_UNIVERSE, matter: 1.1 };
    const lowE = evaluate(lowP);
    const highE = evaluate(highP);
    assert.equal(lowE.morphology, "elliptical");
    assert.equal(highE.morphology, "elliptical");
    assert.ok(massToLight(highP, highE) > massToLight(lowP, lowE));
    assert.ok(sersicIndex(highP, highE) > sersicIndex(lowP, lowE));
    assert.ok(Math.abs(massToLight(highP, highE) - 1) < 0.05);
    const seq = fpMassSequence(highP, highE);
    const first = seq[0];
    const last = seq[seq.length - 1];
    assert.ok(first && last);
    assert.ok(last.upsilon > first.upsilon);
    assert.ok(Math.abs(seq.find((s) => Math.abs(s.mass - 1.1) < 0.08)!.residual - 1) < 0.2);
    assert.ok(last.residual > first.residual);
  });

  it("makes dynamical Υ(M) a U: valley at L*, dwarfs and giants high", () => {
    const valley = upsilonAtMass(FP_MSTAR);
    const dwarf = upsilonAtMass(FP_MSTAR * 0.4);
    const giant = upsilonAtMass(FP_M0);
    assert.ok(dwarf > valley);
    assert.ok(giant > valley);
    assert.equal(mlBranch(FP_MSTAR), "valley");
    assert.equal(mlBranch(FP_M0), "giant");
    assert.equal(mlBranch(FP_MSTAR * 0.4), "dwarf");
    assert.ok(massToLight(OUR_UNIVERSE, evaluate(OUR_UNIVERSE)) < 0.85);
    assert.ok(Math.abs(massToLight({ ...OUR_UNIVERSE, matter: 1.1 }, evaluate({ ...OUR_UNIVERSE, matter: 1.1 })) - 1) < 0.05);
  });

  it("puts our disk on Chabrier and massive ellipticals bottom-heavy", () => {
    const ours = evaluate(OUR_UNIVERSE);
    const ox = imfHighMass(OUR_UNIVERSE, ours);
    assert.equal(imfNicheOf(ox), "chabrier");
    assert.ok(Math.abs(ox - IMF_CHABRIER) < 0.12);
    assert.ok(Math.abs(upsilonStar(OUR_UNIVERSE, ours) - 1) < 0.15);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    assert.equal(ellE.morphology, "elliptical");
    const ex = imfHighMass(ellP, ellE);
    assert.equal(imfNicheOf(ex), "bottom");
    assert.ok(ex > ox);
    assert.ok(upsilonStar(ellP, ellE) > upsilonStar(OUR_UNIVERSE, ours));
    const burstP = { ...OUR_UNIVERSE, matter: 0.1, quantumNoise: 0.45, complexity: 0.15 };
    const burstE = evaluate(burstP);
    assert.ok(imfHighMass(burstP, burstE) < ox);
    assert.ok(imfNicheOf(imfHighMass(burstP, burstE)) === "top" || burstE.morphology === "scattered");
  });

  it("draws ξ(m) that turns over for Chabrier and stays steep when bottom-heavy", () => {
    const ch = imfMeanMass(IMF_CHABRIER, "chabrier");
    const sa = imfMeanMass(IMF_SALPETER, "salpeter");
    const bo = imfMeanMass(2.8, "bottom");
    const top = imfMeanMass(1.7, "top");
    assert.ok(ch < sa);
    assert.ok(bo < ch);
    assert.ok(top > ch);
    assert.ok(imfSnFrac(1.7, "top") > imfSnFrac(IMF_CHABRIER, "chabrier"));
    const shape = imfShape(IMF_CHABRIER, "chabrier");
    assert.ok(imfXi(0.2, shape) > imfXi(8, shape));
  });

  it("lets a top-heavy IMF recycle, enrich and heat more than a bottom-heavy one", () => {
    const rCh = imfReturn(IMF_CHABRIER, "chabrier");
    const rTop = imfReturn(1.7, "top");
    const rBot = imfReturn(2.8, "bottom");
    assert.ok(rTop > rCh);
    assert.ok(rCh > rBot);
    assert.ok(imfYield(1.7, "top") > imfYield(IMF_CHABRIER, "chabrier"));
    assert.ok(imfYield(IMF_CHABRIER, "chabrier") > imfYield(2.8, "bottom"));
    const burstP = { ...OUR_UNIVERSE, matter: 0.1, quantumNoise: 0.45, complexity: 0.15 };
    const burstN = coreNfwIndex(burstP, evaluate(burstP));
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellN = coreNfwIndex(ellP, evaluate(ellP));
    assert.ok(burstN >= 0 && ellN >= 0);
  });

  it("puts a cluster elliptical on Magorrian and keeps the sphere of influence inside Re", () => {
    const ours = evaluate(OUR_UNIVERSE);
    assert.equal(agnNicheOf(OUR_UNIVERSE, ours), "quiet");
    assert.ok(magorrianRatio(OUR_UNIVERSE, ours) < 0.0012);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    assert.equal(ellE.morphology, "elliptical");
    assert.ok(Math.abs(magorrianRatio(ellP, ellE) - MAGORRIAN_PIN) < 0.001);
    assert.equal(agnNicheOf(ellP, ellE), "quench");
    assert.ok(sphereOfInfluence(ellP, ellE) < 0.08 * effectiveRadius(ellP, ellE));
    const quietP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3, quantumNoise: 0.02 };
    const puffedP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3, quantumNoise: 0.28 };
    assert.ok(bhMass(quietP, evaluate(quietP)) > bhMass(puffedP, evaluate(puffedP)));
    const sig = bulgeSigmaKms(ellP, ellE) / ROTATION_V0;
    assert.ok(Math.abs(bhMass(ellP, ellE) / Math.pow(sig, 4) - 0.1207) < 0.01);
  });

  it("matches Silk–Rees to King at the Magorrian pin and falls faster in dwarfs", () => {
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    const king = bhMass(ellP, ellE);
    const sr = silkReesMass(ellP, ellE);
    assert.ok(Math.abs(sr / king - 1) < 0.03);
    const dwarfP = { ...OUR_UNIVERSE, matter: 0.1, quantumNoise: 0.45, complexity: 0.15 };
    const dwarfE = evaluate(dwarfP);
    assert.equal(dwarfE.morphology, "scattered");
    assert.ok(silkReesMass(dwarfP, dwarfE) < bhMass(dwarfP, dwarfE));
  });

  it("drives cluster AGN as an energy jet and leaves our disk off", () => {
    const ours = agnDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.mode, "off");
    assert.equal(ours.drive, "none");
    assert.ok(ours.lambda < 0.05);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ell = agnDossier(ellP, evaluate(ellP));
    assert.equal(ell.mode, "jet");
    assert.equal(ell.drive, "energy");
    assert.equal(ell.niche, "quench");
    assert.ok(ell.heat > 0.22);
    assert.equal(ell.wind, 0);
    assert.ok(ell.bind > ours.bind);
    const fieldP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3 };
    const field = agnDossier(fieldP, evaluate(fieldP));
    assert.equal(evaluate(fieldP).morphology, "elliptical");
    assert.equal(field.niche, "maintain");
  });

  it("puts a Schwarzschild hole at ISCO=6M and a MAD jet on the cluster elliptical", () => {
    assert.ok(Math.abs(kerrIsco(0) - 6) < 1e-6);
    assert.ok(kerrIsco(0.98) < 2.2);
    assert.ok(Math.abs(novikovThorne(0) - 0.057) < 0.004);
    assert.ok(novikovThorne(0.9) > 0.13);
    const mad = blandfordZnajek(0.9, 50, 1);
    const sane = blandfordZnajek(0.9, 8, 1);
    assert.ok(mad > sane * 10);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const g = grmhdDossier(ellP, evaluate(ellP));
    assert.equal(g.state, "mad");
    assert.ok(g.aStar > 0.3 && g.aStar < 0.95);
    assert.ok(g.phi > 30);
    const ours = grmhdDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.ok(ours.bz < g.bz);
    assert.equal(g.winner, "bz");
    assert.ok(Math.abs(horizonOmega(0)) < 1e-12);
    assert.ok(horizonOmega(0.998) > 0.45 && horizonOmega(0.998) < 0.5);
    assert.ok(Math.abs(fieldOmega(0.8) / horizonOmega(0.8) - 0.5) < 1e-9);
    assert.equal(blandfordZnajek(0, 50, 1), 0);
    assert.ok(blandfordZnajek(0.9, 50, 1, "monopole") > blandfordZnajek(0.9, 50, 1, "parabolic"));
    assert.ok(g.bp < g.bz);
    assert.ok(blandfordPayne(0.4, 1, "thin") > blandfordPayne(0.4, 1, "mad"));
    assert.equal(blandfordZnajek(0.9, 50, 1, "parabolic", 0), 0);
    assert.equal(blandfordZnajek(0.9, 50, 1, "parabolic", 1), 0);
    assert.ok(
      blandfordZnajek(0.9, 50, 1, "parabolic", 0.5) >
        blandfordZnajek(0.9, 50, 1, "parabolic", 0.2),
    );
    assert.ok(Math.abs(spinEnergy(0)) < 1e-12);
    assert.ok(spinEnergy(0.998) > 0.26 && spinEnergy(0.998) < 0.3);
    assert.ok(g.etaBz > g.ntEff);
  });

  it("arrests a MAD flow when magnetic pressure matches ram pressure", () => {
    const madPhi = 50;
    const sanePhi = 10;
    assert.ok(Math.abs(magRamRatio(madPhi) - 1) < 0.05);
    assert.ok(magRamRatio(sanePhi) < 0.08);
    assert.ok(plasmaBeta(madPhi) < 2);
    assert.ok(plasmaBeta(sanePhi) > plasmaBeta(madPhi) * 8);
    assert.ok(plasmaBeta(3.5) > plasmaBeta(sanePhi));
    assert.ok(magnetoRadius(madPhi, 0.6) > magnetoRadius(sanePhi, 0.6));
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const g = grmhdDossier(ellP, evaluate(ellP));
    assert.equal(g.state, "mad");
    assert.ok(g.magRam > 0.5);
    assert.ok(g.beta < 3);
  });

  it("lets a thin disk slip flux and a MAD flow expel the excess", () => {
    assert.ok(fluxAdvection("thin", 0.05) < 1);
    assert.ok(fluxAdvection("sane", 0.05) > fluxAdvection("thin", 0.05));
    assert.ok(fluxAdvection("mad", 0.02) > 1);
    assert.equal(fluxTransportOf("thin", 0.05), "diffuse");
    assert.equal(fluxTransportOf("sane", 0.2), "advect");
    assert.equal(fluxTransportOf("mad", 0.02), "expel");
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const g = grmhdDossier(ellP, evaluate(ellP));
    assert.equal(g.fluxNiche, "expel");
    assert.ok(g.fluxAdv > 1);
  });

  it("lets MAD accrete in sparse magnetized streams, not a smooth disk", () => {
    assert.ok(magnetization("mad", 50) > magnetization("sane", 10));
    assert.ok(madFill("mad", 1) < 0.45);
    assert.equal(madFill("sane", 0.04), 1);
    assert.ok(madVar("mad", 0.9, 1) > madVar("sane", 0.9, 0.04));
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const g = grmhdDossier(ellP, evaluate(ellP));
    assert.equal(g.state, "mad");
    assert.ok(g.fill < 0.5);
    assert.ok(g.sigma > 1);
    assert.ok(g.flicker > 0.15);
  });

  it("gives a cluster MAD an FR I lobe and an ADAF, not a thin disk", () => {
    assert.equal(fanaroffRiley("mad", "quench"), "fri");
    assert.equal(fanaroffRiley("mad", "quasar"), "frii");
    assert.equal(fanaroffRiley("sane", "quiet"), "none");
    assert.equal(isAdaf("mad", 0.012), true);
    assert.equal(isAdaf("thin", 0.2), false);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const g = grmhdDossier(ellP, evaluate(ellP));
    assert.equal(g.fr, "fri");
    assert.equal(g.adaf, true);
  });

  it("keeps AGN and GRMHD finite across a coarse sky grid", () => {
    const knobs = [0.4, 1, 1.5];
    const matters = [0.1, 0.31, 1.1];
    for (const gravity of knobs) {
      for (const matter of matters) {
        const p = { ...OUR_UNIVERSE, gravity, matter, complexity: 0.36, quantumNoise: 0.1 };
        const ev = evaluate(p);
        const g = grmhdDossier(p, ev);
        const a = agnDossier(p, ev);
        for (const n of [g.aStar, g.phi, g.bz, g.bp, g.etaBz, g.beta, g.magRam, g.rMag, g.fill, g.flicker, a.lambda, a.heat, a.bind, bhMass(p, ev), circularSpeed(0.02, p, ev), circularOmega(0.02, p, ev)]) {
          assert.equal(Number.isFinite(n), true);
        }
      }
    }
  });

  it("puts a Keplerian nucleus in the inner rotation curve of a cluster elliptical", () => {
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ellE = evaluate(ellP);
    const withHole = circularSpeed(0.012, ellP, ellE, true);
    const hole = bhMass(ellP, ellE);
    assert.ok(hole > 0);
    assert.ok(withHole > Math.sqrt(hole / 0.012) * 0.95);
    const ours = agnDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.mode, "off");
    assert.equal(grmhdDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE)).etaBz, 0);
  });

  it("lets photometry, virial and lensing disagree about stellar mass", () => {
    const ours = massEstimates(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.ok(Math.abs(ours.photBias - 1) < 0.2);
    assert.equal(ours.niche, "halo");
    assert.ok(ours.mVirial > ours.mStar);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ell = massEstimates(ellP, evaluate(ellP));
    assert.ok(ell.mPhot < ell.mStar);
    assert.ok(ell.darkWithin > 0.05);
    assert.ok(ell.photBias < 0.85);
    const fieldP = { ...OUR_UNIVERSE, gravity: 1.5, complexity: 0.3 };
    const field = massEstimates(fieldP, evaluate(fieldP));
    assert.equal(evaluate(fieldP).morphology, "elliptical");
    assert.ok(field.darkWithin > 0.1);
  });

  it("compares Einasto and NFW: inner slope flatter, same pin at rs", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const a = einastoAlpha(OUR_UNIVERSE, ev);
    const d = haloDossier(OUR_UNIVERSE, ev);
    assert.ok(d.slopeE > d.slopeN);
    assert.ok(d.slopeN < -0.85);
    const grid = haloDensityCompare(a);
    const near = grid.reduce((p, s) => (Math.abs(s.x - 1) < Math.abs(p.x - 1) ? s : p));
    assert.ok(near.einasto > 0.4 && near.einasto < 2.5);
    assert.ok(near.nfw > 0.4 && near.nfw < 2.5);
    assert.ok(logSlope((x) => einastoRho(x, a), 1e-5) > logSlope(nfwRho, 1e-5));
  });

  it("heats a dwarf NFW into a coreNFW, n=0 recovers the cusp", () => {
    const rs = 0.12;
    const c = 12;
    const rc = 0.1;
    const mCusp = nfwMassFraction(0.04, rs, c);
    const m0 = coreNfwMassFraction(0.04, rs, c, rc, 0);
    const m1 = coreNfwMassFraction(0.04, rs, c, rc, 1);
    assert.ok(Math.abs(m0 - mCusp) < 1e-9);
    assert.ok(m1 < m0 * 0.6);
    const dwarfP = { ...OUR_UNIVERSE, gravity: 0.25, matter: 0.06, quantumNoise: 0.35 };
    const dwarfEv = evaluate(dwarfP);
    if (dwarfEv.morphology === "scattered") {
      assert.equal(haloModel(dwarfP, dwarfEv), "corenfw");
    }
    const longN = coreNfwIndex(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const shortP = { ...OUR_UNIVERSE, gravity: 1.7 };
    const shortN = coreNfwIndex(shortP, evaluate(shortP));
    assert.ok(longN > shortN);
    const rdSpiral = coreNfwRadius(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.ok(rdSpiral > 0.06 && rdSpiral < 0.42);
  });

  it("lets cooling baryons shrink rs, and feedback open a core", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const ours = baryonContraction(OUR_UNIVERSE, ev);
    assert.ok(ours > 1.05 && ours < 2);
    const rich = { ...OUR_UNIVERSE, complexity: 1 };
    const poor = { ...OUR_UNIVERSE, complexity: 0.05 };
    assert.ok(baryonContraction(rich, evaluate(rich)) > baryonContraction(poor, evaluate(poor)));
    const innerRich = circularSpeed(0.08, rich, evaluate(rich), true);
    const innerPoor = circularSpeed(0.08, poor, evaluate(poor), true);
    assert.ok(innerRich > innerPoor * 0.85);
    assert.ok(nfwCoreRadius(OUR_UNIVERSE, ev) < 0.04);
    const noisy = { ...OUR_UNIVERSE, quantumNoise: 0.95 };
    assert.ok(nfwCoreRadius(noisy, evaluate(noisy)) > nfwCoreRadius(OUR_UNIVERSE, ev));
    const d = haloDossier(OUR_UNIVERSE, ev);
    assert.ok(d.contraction > 1);
    assert.ok(d.core >= 0);
  });
});

describe("stellar evolution", () => {
  it("gives the Sun ~10 Gyr and a 20 M☉ star a short life", () => {
    assert.ok(Math.abs(starLifetimeGyr(1, 1) - 10) < 0.2);
    assert.ok(starLifetimeGyr(20, 1) < 0.3);
    assert.ok(starLifetimeGyr(1, 1.5) < starLifetimeGyr(1, 1));
  });

  it("evolves 1 M☉ through MS → giant → white dwarf", () => {
    assert.equal(evolveStar(1, 1, 1).stage, "mainSequence");
    assert.equal(evolveStar(1, 9.2, 1).stage, "giant");
    assert.equal(evolveStar(1, 12, 1).stage, "whiteDwarf");
  });

  it("explodes a 15 M☉ star, then leaves a neutron star", () => {
    const tau = starLifetimeGyr(15, 1);
    assert.equal(evolveStar(15, tau * 0.5, 1).stage, "mainSequence");
    assert.equal(evolveStar(15, tau + 0.001, 1).stage, "supernova");
    assert.equal(evolveStar(15, tau + 1, 1).stage, "neutronStar");
    assert.equal(evolveStar(30, tau + 1, 1).stage, "blackHole");
  });

  it("samples a Salpeter-like mass function", () => {
    const rng = mulberry32(11);
    const masses = Array.from({ length: 400 }, () => sampleMass(rng));
    const mean = masses.reduce((a, b) => a + b, 0) / masses.length;
    assert.ok(mean > 0.7 && mean < 3.5);
    assert.ok(masses.every((m) => m >= 0.4 && m <= 40));
  });

  it("builds a population with a main sequence at stellar-era now", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const now = nowMarker(OUR_UNIVERSE, ev);
    const age = cosmicAgeGyr(now, OUR_UNIVERSE, ev);
    const pop = samplePopulation(OUR_UNIVERSE, ev, age, 42, 160);
    assert.ok(pop.length > 40);
    assert.ok(pop.some((s) => s.stage === "mainSequence"));
  });
});
