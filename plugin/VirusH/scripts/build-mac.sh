#!/bin/bash
# Compila Virus H per macOS (Apple Silicon + Intel): app standalone, AU (v2) e VST3.
# Richiede Xcode. Uso: plugin/VirusH/scripts/build-mac.sh [Debug|Release]
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="${1:-Release}"
OUT="$HERE/build-mac"

"$HERE/scripts/sync-web.sh"

for scheme in "macOS-APP" "macOS-AUv2" "macOS-VST3"; do
  echo "== $scheme ($CONFIG)"
  xcodebuild -project "$HERE/projects/VirusH-macOS.xcodeproj" -scheme "$scheme" \
    -configuration "$CONFIG" ARCHS="arm64 x86_64" ONLY_ACTIVE_ARCH=NO \
    SYMROOT="$OUT" -quiet build
done

echo
echo "Prodotti in $OUT/$CONFIG:"
ls -1 "$OUT/$CONFIG" | grep -E '\.(app|component|vst3)$'
