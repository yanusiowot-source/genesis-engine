#!/bin/sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/wasm/nfw-kernel"
export RUSTFLAGS="${RUSTFLAGS:-} -C target-feature=+simd128"
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/nfw_kernel.wasm "$ROOT/src/lib/universe/kernels/nfw.wasm"
cp "$ROOT/src/lib/universe/kernels/nfw.wasm" "$ROOT/public/nfw.wasm"
node -e '
const fs = require("fs");
const wasm = fs.readFileSync(process.argv[1]);
const dest = process.argv[2];
const b64 = wasm.toString("base64");
fs.writeFileSync(
  dest,
  "/** Generated from kernels/nfw.wasm. Rebuild: wasm/build-nfw.sh */\nexport const NFW_WASM_B64 = \"" + b64 + "\";\n",
);
' "$ROOT/src/lib/universe/kernels/nfw.wasm" "$ROOT/src/lib/universe/nfw-bytes.ts"
ls -la "$ROOT/src/lib/universe/kernels/nfw.wasm"
