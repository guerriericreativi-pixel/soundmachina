# VIRUS-H Directions 01

Twenty original complete Virus TI/TI2/Snow programs, designed on 2026-10-15.
Revision 2 has been checked structurally and in the app, but has not been
auditioned on hardware. Tonal balance, levels, envelope timing and musical fit
still need a listening pass. No audio preview is simulated or claimed.

## Use

In PERCORSI, each musical style offers four complete sounds. Carica replaces the
active Single or Multi-part edit buffer with the full program. It does not store
anything in a hardware RAM bank. After loading, the console reflects the loaded
program's values; subsequent console edits are sent only by Applica al suono.
Browsing, downloads and library additions never send MIDI.

PATCH → Suoni → Aggiungi 20 suoni adds the pack to the browser's local library.
Existing names are preserved, including user edits with a matching name.
Deleting a pack entry works through the ordinary library controls; re-adding
the pack restores missing entries without replacing other entries.

The primary download is `assets/sound-bank/VIRUS-H-Directions-01.mid` (10,618
bytes), a Standard MIDI File type 0 with one track, 480 PPQN and 120 BPM. It
contains twenty SysEx events spaced 480 ticks (500 ms) apart. The raw SysEx
version remains `assets/sound-bank/VIRUS-H-Directions-01.syx` (10,480 bytes). Individual 524-byte programs are in the same directory. The bank is a
sequence of twenty edit-buffer dumps: replaying the entire file leaves the last
sound in the edit buffer; it does not program twenty permanent hardware slots.
Use the app's individual loading actions for auditioning. Save on the Virus only
when you choose a hardware destination yourself.

## Contents

| Style | Bass | Lead | Pad | Pluck / Keys |
| --- | --- | --- | --- | --- |
| Trance | PulseRoot | Skyline | IonCloud | GlassRun |
| Psytrance | OrbitSub | AcidTrail | SporeMist | NeonSeed |
| Techno | IronPulse | FluxWire | SmokeRoom | SteelStab |
| Ambient | DeepTide | HaloLine | SlowBloom | DewKeys |
| Synthwave | NightDrive | RoseLead | VelvetAir | AfterKeys |

Programming uses Classic oscillators, with native HyperSaw on Skyline and
SlowBloom. Programs define both oscillators, mixer, filters and filter envelope,
amplifier envelope, LFO routing, keyboard mode, effects and modulation matrix.
Revision 2 adds patch-specific articulation, additional envelope movement, velocity,
wheel and pressure routing, native soft-knob assignments, selective unison and
individual EQ/Character/effects programming. The mod wheel opens filter 1 and
introduces vibrato. Arpeggiator, external input processing, vocoder
and Atomizer are disabled. All 512 parameter bytes are defined, independent of
the previous patch. Original names fit the Virus's ten-character display.

## Sources and originality

Names, descriptions, base programming and all twenty sound designs are authored
for this project. No manufacturer preset, commercial soundbank, ROM, firmware,
third-party patch dump or synthesizer branding was copied into this pack.
Instrument names describe compatibility, not affiliation.

Only protocol facts were consulted:

- [Access sound-engine specifications](https://www.virus.info/virusti/specs).
- [Gearmulator TI parameter descriptions](https://github.com/dsp56300/gearmulator/blob/main/source/axel/osTIrusJucePlugin/parameterDescriptions_TI.json), for parameter addresses and enumerations; no source tables are bundled.
- [Gearmulator Single Dump serialization](https://github.com/dsp56300/gearmulator/blob/main/source/axel/virusLib/microcontroller.cpp), for the two-checksum wire layout; implementation here is written independently.

The wire representation is header 0–8, pages A/B at 9–264, legacy checksum at
265, E/F at 266–521, full checksum at 522, F7 at 523. Both checksums include
header bytes starting at device ID (offset 5). Retargeting therefore recomputes
both. The hardware-panel reader and cached dump editing use the same corrected
E/F offsets, 266 and 394.

## Maintenance

Source: `virus-sound-bank.js`, shared by the browser and native plugin builds.
`build(id)` creates an independent dump; `midiBytes()` exports the MIDI bank;
`bankBytes()` exports raw SysEx;
`addToLibrary(existing, ids)` adds missing names without mutating its input.

Regenerate the checked-in exports after editing programming:

```js
const fs = require('node:fs');
const bank = require('./virus-sound-bank');
fs.writeFileSync('assets/sound-bank/VIRUS-H-Directions-01.mid', bank.midiBytes());
fs.writeFileSync('assets/sound-bank/VIRUS-H-Directions-01.syx', bank.bankBytes());
for (const p of bank.programs)
  fs.writeFileSync('assets/sound-bank/' + p.name + '.syx', bank.build(p.id));
```

Tests cover wire layout, both checksums, names, unique payloads, deterministic
full programs, all five groups, non-destructive library additions, disconnected
browsing/downloads, explicit full loads, failed loads, console synchronization,
Single/P3 retargeting and cached extended-page edits.

SMF import parses track boundaries, VLQ delta times and event lengths, channel
running status, meta events, split SysEx events and F7 escape events. It validates
the entire file before any library write, preventing partial import on truncation.
The twenty extracted messages are tested byte-for-byte against the raw exports.
Format reference: [MIDI Association SMF guidance](https://midi.org/community/midi-specifications/which-items-can-be-variable-length).

## Percorsi revision 2 · 2026-10-15

The twenty existing IDs and names are retained. Each of the five musical paths
still provides four complete patches. New programming is authored in `designs`
in `virus-sound-bank.js`, informed by the structural techniques documented in
[sound-design](sound-design/README.md). No reference-bank dump is loaded or used
as a build input.

- Trance: compact bass, layered HyperSaw lead, evolving stereo pad and dynamic-FM pluck.
- Psytrance: phase-defined dry bass, saturated resonant lead, animated texture and sine/FM pluck.
- Techno: dry driven bass, parallel-filter lead, dark PWM pad and short expressive stab.
- Ambient: rounded foundation, spacious melodic voice, additional-envelope pad and dynamic-FM keys.
- Synthwave: saw/pulse/sub bass, expressive lead, PWM ensemble and velocity-sensitive brass keys.

All patches use separate matrix slots for wheel, velocity, pressure, a patch-specific
movement route, timbre and (where appropriate) space. Soft knob 1 sends CC12 to
filter cutoff/resonance; knob 2 controls the modulation wheel destinations; knob 3
sends CC14 to delay/reverb on spatial patches and remains unassigned on dry basses.
Bass patches keep unison off. Some pads, leads and the stab use restrained Twin
unison. New raw Patch Volume values are 88–104, with lower settings on layered
sounds; these are starting values, not loudness normalization. EQ stays moderate.
Hardware listening is still required to calibrate modulation depth, levels, timbre
and voice usage. No claim of identical sound to QUANTUM/METROPOLIS is made.

`buildBase(id)` preserves the earlier foundation exclusively for the existing
FORMA/P and PRISMA preset builders. Regression tests compare all 24 existing
instrument programs against their pre-change byte hashes. Updating Percorsi
therefore does not change those instrument sounds.

The app and exports use `build(id)` and the revised programming. Existing saved
library entries are preserved, even if their names match these programs. Use the
Percorsi **Carica** button to audition revision 2; adding the pack does not overwrite
an older saved entry. Factory Directions entries in Studio use the same revised
builder. Browser reload is required to load the new JavaScript; no automatic MIDI
load or hardware RAM write is triggered by this change.

## Percorsi revision 3 · additional references

The new [online references](sound-design/online-reference-banks.md) inform a second
pass over all twenty programs. Values and gestures are independently authored;
reference presets are stored only in the user's local [bank archive](patch-bank-library.md).

Every program has a specific three-destination wheel gesture: bass patches favor
cutoff/envelope/punch, short voices can become more sustained, pads change their
balance and shape, and leads introduce suitable expression. Velocity and pressure
remain independent. These are native Virus matrix assignments embedded in the
complete patch, not effects added to a recording.

GlassRun now uses a wavetable source with dynamic FM; SporeMist uses Wave PWM;
SlowBloom combines wavetable and HyperSaw. Skyline and SteelStab now avoid unison
stacking, following the reference observation that dense sounds need not multiply
voices. Other envelope, saturation and decay settings are tailored individually.
IDs/names and existing library entries remain intact. The instrument bank builders
still use the isolated base, preserving FORMA/P and PRISMA byte for byte.

These are uncalibrated sound designs: no hardware audio recording or equal-loudness
comparison was performed in this change. In particular, modulation depths, filter
response and voice usage still need a listening pass on the user's Virus.
