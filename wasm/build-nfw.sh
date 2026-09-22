#!/bin/sh
set -e
cd "$(dirname "$0")/nfw-kernel"
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/nfw_kernel.wasm ../../src/lib/universe/kernels/nfw.wasm
cp ../../src/lib/universe/kernels/nfw.wasm ../../public/nfw.wasm
ls -la ../../src/lib/universe/kernels/nfw.wasm
