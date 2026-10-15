# VIRUS-H Instruments

Studio now opens on original instruments, with the sound browser as a supporting layer.

- **FORMA / P**: folded graphite shell, red/blue section stripes, vertical faders, oscillator/sub/noise, resonant filter, shared filter/amplifier ADSR and stereo chorus settings. Visual and workflow reference: [Roland JUNO-106 manual](https://cdn.roland.com/assets/media/pdf/JUNO-106_OM.pdf).
- **PRISMA / D**: brown shell, green LCD, membrane parameter matrix and a single data-entry fader. The digital workflow references the DX era; [Yamaha's history](https://usa.yamaha.com/products/contents/music_production/synth_50th/history/chapter002.html) describes the DX7's six-operator engine. This panel instead exposes the Virus's real two-oscillator FM path, filter and effects. It does not implement six operators or import DX7 voices.

The instrument names, graphics, Blender geometry and eight starter patches are original. No manufacturer logos, copied panel artwork, sample recordings or third-party presets are included. Visual inspiration is not a claim of licensed emulation or legal clearance.

## Real controls

`studio-instruments.js` owns parameter descriptors and original full-patch starters. `sound-studio.js` applies panel edits after global macros, then canonicalizes both Virus TI checksums. Controls edit local drafts. Only the existing explicit A/B or editor send actions transmit MIDI. Choosing instruments or starter sounds never transmits a patch. Variants retain their instrument identity, and export/backup preserve the resulting full patch.

All panel parameters are page A, payload offset 9. FORMA's four envelope faders link A59/60/61/63 to A54/55/56/58. Chorus choices change A105/106/107; they are Virus chorus settings, not a measured model of the original chorus circuit. PRISMA keeps oscillator 2 at nominal pitch, tunes oscillator 1 as modulator, and emphasizes oscillator 2 in its starter patches.

## Artwork and limitations

Run `Blender -b -t 6 -P tools/render-sprites/studio_instruments.py` to regenerate shells and keybed. Convert resulting PNGs to WebP with cwebp quality 94. Fader caps reuse original Blender assets from `sound_path_controls.py`. The rendered keyboard strip is visual; the app's KEYS control or a connected keyboard is used for playing.

QA uses a separate localhost origin with MIDI disabled, so interface checks cannot replace the user's physical patch. Automated checks verify mappings, bounds, checksums, independent drafts, variant identity and exact MIDI exports. The eight sounds still require listening and refinement on Virus hardware; tonal equivalence to a JUNO-106 or DX7 has not been established.

## Digital panel proportion revision

The digital face was reworked after examining Yamaha's [original product photography and design notes](https://www.yamaha.com/en/tech-design/design/insights/id_009/): a low horizontal body, two sliders at the left, a small central LCD with a red parameter index, and flat turquoise membrane keys. The desktop parameter matrix has two rows of eight real controls; mobile uses four columns. Original tone/envelope/effects shortcuts select the appropriate editable Virus parameter. The level fader writes Virus A91 and does not replace the selected parameter's LCD readout.

A separate Blender keybed has five octaves and two rendered performance wheels. They are visual geometry; performance remains through the existing KEYS interface or a physical keyboard. Re-render only that asset with `Blender -b -t 6 -P tools/render-sprites/studio_instruments.py -- --digital-keybed-only`.

## Live hardware editing

After a successful initial load (or reading the actual active sound), sliders, macros, chorus choices and reset send parameter deltas in real time. Pointer events are coalesced at 32 ms. There are no repeated Single dumps during a drag. Page A/B/E/F offsets skip checksums. The bridge pins all writes to Single buffer 0x40 or the active Multi part and updates the editor's cached patch bytes. A/B still sends complete versions explicitly. Changing the selected sound, disconnecting MIDI, switching targets, an external cached patch change or an output error disarms live editing. Offline drafts and saved variants remain usable.

## FORMA / P revision and Classic Studies

The poly panel now follows the LFO/DCO/HPF/VCF/VCA/ENV/CHORUS order, with
register/waveform selectors, a patch strip, a playable 61-note Blender keybed
and collapsible library. Sixteen new original Virus programs are documented
in [FORMA / P Classic Studies](forma-p-classic-studies.md). The full factory
catalog is now 44 programs (20 Directions, 20 FORMA, 4 PRISMA), before personal
records. Original panel geometry and all sound recipes remain project-authored.
