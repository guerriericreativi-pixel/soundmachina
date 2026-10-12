#!/bin/bash
# Firma, impacchetta e notarizza Virus H per la distribuzione (installer .pkg).
#
# Prerequisiti (account Apple Developer):
#   - certificati "Developer ID Application" e "Developer ID Installer" nel portachiavi
#   - profilo notarytool salvato una volta con:
#       xcrun notarytool store-credentials virus-h --apple-id TUA@EMAIL --team-id TEAMID
#
# Uso:
#   DEV_ID_APP="Developer ID Application: Nome (TEAMID)" \
#   DEV_ID_INSTALLER="Developer ID Installer: Nome (TEAMID)" \
#   NOTARY_PROFILE=virus-h \
#   plugin/VirusH/scripts/package-mac.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$HERE/build-mac/Release"
DIST="$HERE/dist"
VERSION="$(grep -m1 PLUG_VERSION_STR "$HERE/config.h" | sed -E 's/.*"(.*)".*/\1/')"
: "${DEV_ID_APP:?imposta DEV_ID_APP}" "${DEV_ID_INSTALLER:?imposta DEV_ID_INSTALLER}" "${NOTARY_PROFILE:?imposta NOTARY_PROFILE}"

[ -d "$BUILD/VirusH.component" ] || "$HERE/scripts/build-mac.sh" Release

rm -rf "$DIST" && mkdir -p "$DIST/root-au" "$DIST/root-vst3" "$DIST/root-app"
cp -R "$BUILD/VirusH.component" "$DIST/root-au/"
cp -R "$BUILD/VirusH.vst3" "$DIST/root-vst3/"
cp -R "$BUILD/VirusH.app" "$DIST/root-app/Virus H.app"

# firma con hardened runtime (necessaria per la notarizzazione)
for b in "$DIST/root-au/VirusH.component" "$DIST/root-vst3/VirusH.vst3" "$DIST/root-app/Virus H.app"; do
  codesign --force --deep --options runtime --timestamp --sign "$DEV_ID_APP" "$b"
  codesign --verify --strict --verbose=1 "$b"
done

pkgbuild --root "$DIST/root-au" --install-location "/Library/Audio/Plug-Ins/Components" \
  --identifier com.soundmachina.virush.au --version "$VERSION" "$DIST/au.pkg"
pkgbuild --root "$DIST/root-vst3" --install-location "/Library/Audio/Plug-Ins/VST3" \
  --identifier com.soundmachina.virush.vst3 --version "$VERSION" "$DIST/vst3.pkg"
pkgbuild --root "$DIST/root-app" --install-location "/Applications" \
  --identifier com.soundmachina.virush.app --version "$VERSION" "$DIST/app.pkg"

cat > "$DIST/distribution.xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
  <title>Virus H $VERSION</title>
  <options customize="allow" require-scripts="false" hostArchitectures="arm64,x86_64"/>
  <choices-outline>
    <line choice="au"/><line choice="vst3"/><line choice="app"/>
  </choices-outline>
  <choice id="au" title="Audio Unit (Logic, GarageBand…)"><pkg-ref id="com.soundmachina.virush.au"/></choice>
  <choice id="vst3" title="VST3 (Ableton, Cubase, Reaper, Bitwig…)"><pkg-ref id="com.soundmachina.virush.vst3"/></choice>
  <choice id="app" title="App standalone"><pkg-ref id="com.soundmachina.virush.app"/></choice>
  <pkg-ref id="com.soundmachina.virush.au">au.pkg</pkg-ref>
  <pkg-ref id="com.soundmachina.virush.vst3">vst3.pkg</pkg-ref>
  <pkg-ref id="com.soundmachina.virush.app">app.pkg</pkg-ref>
</installer-gui-script>
XML

PKG="$DIST/VirusH-$VERSION-mac.pkg"
productbuild --distribution "$DIST/distribution.xml" --package-path "$DIST" --sign "$DEV_ID_INSTALLER" "$PKG"

xcrun notarytool submit "$PKG" --keychain-profile "$NOTARY_PROFILE" --wait
xcrun stapler staple "$PKG"
spctl --assess --type install --verbose "$PKG"
echo "Pronto: $PKG"
