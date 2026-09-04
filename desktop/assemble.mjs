import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, cpSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const VERSION = "37.2.6";
const root = process.cwd();
const www = join(root, "desktop", "www");
if (!existsSync(join(www, "index.html"))) {
  console.error("desktop/www missing. Run npm run desktop:build first.");
  process.exit(1);
}

const targets = process.argv.slice(2);
const list = targets.length ? targets : ["win32", "linux"];

const cache = join(root, "desktop", ".cache");
mkdirSync(cache, { recursive: true });
mkdirSync(join(root, "dist-desktop"), { recursive: true });

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log("cached", dest);
    return;
  }
  console.log("download", url);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed ${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function unzip(zip, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  execFileSync("python3", ["-c", `
import zipfile, sys
z=zipfile.ZipFile(sys.argv[1])
z.extractall(sys.argv[2])
`, zip, dest]);
}

for (const platform of list) {
  const zipName = `electron-v${VERSION}-${platform}-x64.zip`;
  const url = `https://github.com/electron/electron/releases/download/v${VERSION}/${zipName}`;
  const zipPath = join(cache, zipName);
  await download(url, zipPath);
  const unpacked = join(root, "dist-desktop", `GenesisEngine-${platform}-x64`);
  unzip(zipPath, unpacked);

  const appDir = join(unpacked, "resources", "app");
  mkdirSync(appDir, { recursive: true });
  cpSync(join(root, "desktop", "main.cjs"), join(appDir, "main.cjs"));
  cpSync(join(root, "desktop", "preload.cjs"), join(appDir, "preload.cjs"));
  cpSync(join(root, "desktop", "package.json"), join(appDir, "package.json"));
  cpSync(www, join(unpacked, "resources", "www"), { recursive: true });

  if (platform === "win32") {
    renameSync(join(unpacked, "electron.exe"), join(unpacked, "Genesis Engine.exe"));
  } else {
    renameSync(join(unpacked, "electron"), join(unpacked, "genesis-engine"));
  }
  console.log("ready", unpacked);
}
