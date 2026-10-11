import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeRecord } from "./archive.ts";
import { copyFor, hydrateRu } from "./i18n.ts";
import { CLUSTER_SKY, OUR_UNIVERSE, siliconDossier } from "./physics.ts";
import { buildFieldReport } from "./report.ts";

await hydrateRu();

describe("buildFieldReport", () => {
  it("names the disk, the mass function and the hole beside the halo and the wall", () => {
    const copy = copyFor("en");
    const home = makeRecord(OUR_UNIVERSE, 1);
    const text = buildFieldReport({
      record: home,
      locale: "en",
      copy,
      silicon: siliconDossier(home.params, home.evaluation),
    });
    assert.match(text, /Halo analysis/);
    assert.match(text, /Acoustic peaks/);
    assert.match(text, /Disk hydrodynamics: Marginal, Q /);
    assert.match(text, /IMF: Chabrier, x \d\.\d{2}, ⟨m⟩ \d\.\d{2}, R \d\.\d{2}/);
    assert.match(text, /SMBH: Quiet, Off, a\* \d\.\d{2}, SANE/);

    const cluster = makeRecord(CLUSTER_SKY, 2);
    const loud = buildFieldReport({
      record: cluster,
      locale: "en",
      copy,
      silicon: siliconDossier(cluster.params, cluster.evaluation),
    });
    assert.match(loud, /IMF: Bottom-heavy, x \d\.\d{2}, ⟨m⟩ \d\.\d{2}, R \d\.\d{2}/);
    assert.match(loud, /SMBH: Quenched, Jet, a\* \d\.\d{2}, MAD/);

    const ru = buildFieldReport({
      record: home,
      locale: "ru",
      copy: copyFor("ru"),
      silicon: siliconDossier(home.params, home.evaluation),
    });
    assert.match(ru, /Гидродинамика диска: Пороговый, Q /);
    assert.match(ru, /IMF: Chabrier, x \d\.\d{2}, ⟨m⟩ \d\.\d{2}, R \d\.\d{2}/);
    assert.match(ru, /СМЧД: Тихая, Выкл, a\* \d\.\d{2}, SANE/);
  });
});
