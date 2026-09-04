import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import packager from "@electron/packager";

const require = createRequire(import.meta.url);
const electronVersion = require("electron/package.json").version;

const root = process.cwd();
const www = join(root, "desktop", "www");
if (!existsSync(join(www, "index.html"))) {
  console.error("desktop/www is empty. Run npm run desktop:build first.");
  process.exit(1);
}

const platforms = process.argv.slice(2);
const list = platforms.length ? platforms : ["linux", "win32"];

mkdirSync(join(root, "dist-desktop"), { recursive: true });

const icon = existsSync(join(root, "public", "icon-512.png"))
  ? join(root, "public", "icon-512.png")
  : undefined;

for (const platform of list) {
  const paths = await packager({
    dir: join(root, "desktop"),
    name: "Genesis Engine",
    appBundleId: "app.genesisengine.lab",
    appCopyright: "Genesis Engine",
    out: join(root, "dist-desktop"),
    overwrite: true,
    arch: "x64",
    platform,
    prune: false,
    asar: true,
    icon: platform === "linux" ? icon : undefined,
    extraResource: [www],
    ignore: [
      /renderer/,
      /www\/.map$/,
    ],
    electronVersion,
  });
  writeFileSync(
    join(root, "dist-desktop", `${platform}-path.txt`),
    `${paths.join("\n")}\n`,
  );
  console.log(`packed ${platform}: ${paths.join(", ")}`);
}
