#!/bin/bash
# Copia l'editor web (index.html + grafiche) nelle risorse del plugin Virus H,
# aggiunge il ponte MIDI nativo e gli extra del plugin.
# Uso: plugin/VirusH/scripts/sync-web.sh   (da rilanciare dopo ogni modifica a index.html)
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WEB="$HERE/resources/web"

rm -rf "$WEB"
mkdir -p "$WEB/assets/icons" "$WEB/assets/sprites" "$WEB/assets/faceplate" "$WEB/assets/panel"

cp "$ROOT/virus-icons.js" "$ROOT/multi-setup.js" "$ROOT/multi-setup.css" "$ROOT/virus-panel-layouts.js" "$ROOT/virus-hardware-panel.js" "$ROOT/virus-hardware-panel.css" "$ROOT/virus-accessory-panel.css" "$WEB/"
cp -R "$ROOT/assets/icons/." "$WEB/assets/icons/"
cp "$ROOT"/assets/panel/*.webp "$ROOT"/assets/panel/*.json "$WEB/assets/panel/"

cp "$HERE/web-src/web-midi-shim.js" "$HERE/web-src/plugin-brand.js" "$WEB/"
cp "$ROOT"/assets/sprites/*.webp "$WEB/assets/sprites/"
# frontale senza marchi Access (faceplate-*-vh), lo stesso dell'editor web
cp "$ROOT"/assets/faceplate/fp-*.webp "$ROOT"/assets/faceplate/faceplate-*-vh.webp "$ROOT/assets/faceplate/layout.json" "$WEB/assets/faceplate/"

# gli script del plugin devono girare prima di quelli dell'editor
python3 - "$ROOT/index.html" "$WEB/index.html" <<'PY'
import sys
src, dst = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
inject = '<head>\n<script src="web-midi-shim.js"></script>\n<script src="plugin-brand.js"></script>'
assert html.count('<head>') == 1
open(dst, 'w', encoding='utf-8').write(html.replace('<head>', inject, 1))
PY

echo "web resources aggiornate in $WEB ($(du -sh "$WEB" | cut -f1))"
