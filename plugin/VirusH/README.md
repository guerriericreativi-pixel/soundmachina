# Virus H — H-strain editor (AU / VST3 / app)

Editor gratuito e **non ufficiale** per Access Virus TI / TI Snow, in versione plugin.
Non affiliato con Access Music / Kemper Digital: "Access" e "Virus" sono marchi dei rispettivi proprietari
e qui indicano solo la compatibilità.

Il plugin non genera audio: controlla il Virus hardware via USB/MIDI. L'interfaccia è la stessa
dell'editor web (`../../index.html`), caricata in una WebView.

## Come funziona

| Parte | File |
|---|---|
| Plugin (iPlug2): messaggi UI, stato nel progetto, MIDI thru dal DAW | `VirusH.cpp`, `VirusH.h` |
| MIDI nativo CoreMIDI (porte USB del Virus, SysEx) | `VirusMidi.h`, `VirusMidi_mac.mm` |
| Ponte Web MIDI: ricrea `navigator.requestMIDIAccess` nella WebView | `web-src/web-midi-shim.js` |
| Branding plugin (niente marchi Access nelle intestazioni, boot "H-STRAIN") | `web-src/plugin-brand.js` |
| Copia dell'editor web nelle risorse del plugin | `scripts/sync-web.sh` |

- Le note e il SysEx della traccia del DAW vengono inoltrati al Virus sulla porta in uso (MIDI thru).
- Lo stato dell'editor (localStorage) viene salvato nel progetto del DAW e ripristinato all'apertura.
- Il frontale usa la variante renderizzata senza logo Access (`virus_faceplate.py --brand=vh`).

## Compilare (macOS)

Requisiti: Xcode, submodule iPlug2 e SDK:

```bash
git submodule update --init --depth 1 plugin/iPlug2
plugin/iPlug2/Dependencies/IPlug/download-vst3-sdk.sh
plugin/VirusH/scripts/build-mac.sh Release
```

Prodotti in `build-mac/Release`: `VirusH.app`, `VirusH.component` (AU), `VirusH.vst3`.
Per provarli senza installer copia `.component` in `~/Library/Audio/Plug-Ins/Components`
e `.vst3` in `~/Library/Audio/Plug-Ins/VST3`, poi `auval -v aumu VrsH Smch` per validare l'AU.

## Distribuire

Serve un account Apple Developer (certificati Developer ID Application/Installer):

```bash
DEV_ID_APP="Developer ID Application: ..." DEV_ID_INSTALLER="Developer ID Installer: ..." \
NOTARY_PROFILE=virus-h plugin/VirusH/scripts/package-mac.sh
```

Produce `dist/VirusH-<versione>-mac.pkg` firmato, notarizzato e "stapled".

## Rigenerare la grafica

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/render-sprites/virus_faceplate.py -- snow dark --brand=vh
```

## Licenze

iPlug2 (licenza permissiva, vedi `plugin/iPlug2/LICENSE.txt`), VST3 SDK (MIT).
