# FORMA / P native Virus effects

The collapsible FX rack below FORMA / P edits real Virus patch parameters.
Knob images reuse the project's original Blender atlas, on the satin enclosure
render. Six modules expose Chorus, Delay, Reverb, Drive, Phaser and three-band EQ.
Values are MIDI units (0–127); EQ is displayed as 0.25 dB steps around 64.

Source: `studio-effects.js`, with rendering styles in `studio-effects.css`.

| Module | Native addresses | Dump offsets |
| --- | --- | --- |
| Chorus mix/rate/depth | A105/106/107 | 114/115/116 |
| Delay send/time/feedback | A113/114/115 | 122/123/124 |
| Reverb mode/send/type/time/damping | E1/2/3/4/5 | 267/268/269/270/271 |
| Drive type/intensity | B100/101 | 237/238 |
| Phaser mix/rate/depth | B85/86/87 | 222/223/224 |
| EQ low/mid/high | B95/92/96 | 232/229/233 |

Reverb is disabled for legacy 267-byte dumps. A positive send enables an off
reverb or delay algorithm, and positive chorus mix enables Classic chorus if
the algorithm is Off. Drive intensity wakes the effect when edited from Off;
explicitly selecting Off keeps its intensity value available for later reuse.

## Workflow

Browsing and effect edits remain local until loading a program (or capturing
the active hardware sound). Afterward the existing 32 ms coalesced live bridge
sends parameter deltas, with pinned Single/Multi destination and cache updates.
No full-program dump is sent while turning a knob. FX suggestions apply a
conservative configuration based on the selected sound's role; they never
transmit a program implicitly and do not change the original factory entry.

`Ascolta senza FX` is available for a loaded B version. It mutes chorus, delay,
reverb send and phaser, bypasses patch distortion and neutralizes EQ through
parameter writes. `Riascolta con FX` restores the stored wet settings. This is
an audition state, not a destructive edit: variants, JSON backups and MIDI
exports always retain the wet patch. Effects tails can decay naturally after
send changes. Filter saturation and other timbre synthesis remain untouched.

Selecting another sound, loading A/B or editing an effect exits the temporary
bypass. The original sound, independent per-sound drafts, both TI checksums
and existing disconnection/changed-destination protections are preserved.
The rack's open state survives panel rerenders during the session.

Checks include native address deltas, algorithm activation, bounds, legacy
format limits, reversible dry/wet, exact wet export/save, role-specific
suggestions, chorus synchronization and explicit Drive Off behavior. Hardware
listening remains necessary for final effect balance and perceived loudness.

## Hardware check (2026-10-15)

Read the user's actual Single edit buffer (`Rising Bra`) into an independent
local Studio record, without transmitting a complete program. Reverb time E4
was moved from 78 to 79 and restored to 78 through the live bridge. Dry/wet was
then toggled and restored; the UI remained LIVE on the Single destination and
the wet chorus value stayed 43. The original sound settings were restored.
This verifies the connected workflow, not subjective audio balance.
