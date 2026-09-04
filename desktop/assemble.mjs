import { execFileSync } from "node:child_process";
import { chmodSync, createWriteStream, existsSync, mkdirSync, cpSync, readdirSync, renameSync, rmSync } from "node:fs";
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

const KEEP_LOCALES = new Set([
  "en-US.pak",
  "ru.pak",
  "uk.pak",
  "be.pak",
  "de.pak",
  "fr.pak",
  "es.pak",
  "pt-BR.pak",
  "zh-CN.pak",
  "ja.pak",
  "it.pak",
  "pl.pak",
  "nl.pak",
  "tr.pak",
  "ar.pak",
  "ko.pak",
]);

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
  execFileSync("python3", [
    "-c",
    `
import zipfile, sys
z=zipfile.ZipFile(sys.argv[1])
z.extractall(sys.argv[2])
`,
    zip,
    dest,
  ]);
}

function zipFolder(src, dest) {
  if (existsSync(dest)) rmSync(dest);
  execFileSync("python3", [
    "-c",
    `
import os, sys, zipfile
src, dest = sys.argv[1], sys.argv[2]
parent = os.path.dirname(src)
with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for root, dirs, files in os.walk(src):
        for name in files:
            path = os.path.join(root, name)
            z.write(path, os.path.relpath(path, parent))
`,
    src,
    dest,
  ]);
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
  if (existsSync(join(root, "desktop", "KEEP.txt"))) {
    cpSync(join(root, "desktop", "KEEP.txt"), join(unpacked, "KEEP.txt"));
  }

  const leftover = join(unpacked, "resources", "default_app.asar");
  if (existsSync(leftover)) rmSync(leftover);

  const locDir = join(unpacked, "locales");
  if (existsSync(locDir)) {
    for (const file of readdirSync(locDir)) {
      if (!KEEP_LOCALES.has(file)) rmSync(join(locDir, file));
    }
  }

  if (platform === "win32") {
    renameSync(join(unpacked, "electron.exe"), join(unpacked, "Genesis Engine.exe"));
  } else {
    const bin = join(unpacked, "genesis-engine");
    renameSync(join(unpacked, "electron"), bin);
    chmodSync(bin, 0o755);
  }

  const outZip = join(
    root,
    "dist-desktop",
    platform === "win32" ? "GenesisEngine-windows-x64.zip" : "GenesisEngine-linux-x64.zip",
  );
  zipFolder(unpacked, outZip);
  console.log("ready", unpacked);
  console.log("zip", outZip);
}
