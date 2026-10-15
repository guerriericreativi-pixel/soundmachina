# FORMA / P · Classic Studies

Sixteen original Virus TI programs, created for the FORMA / P instrument panel.
They study the subtractive vocabulary associated with the JUNO-106: brass,
chorused strings, pulse and sub basses, synthetic keys, organs, plucks and sweeps.
They are not conversions of Roland factory presets and have not been matched
or auditioned against an original JUNO-106. Hardware listening and gain matching
remain necessary before claiming tonal fidelity.

The panel follows the section order LFO / DCO / HPF / VCF / VCA / ENV / CHORUS
and the lower patch-selection strip, based on the [Roland hardware manual](https://cdn.roland.com/assets/media/pdf/JUNO-106_OM.pdf).
Its identity, labels and rendered assets are original; no manufacturer logo,
recording, ROM or third-party preset data is distributed.

## Playing and editing

Open Studio → FORMA / P. The sound library starts collapsed and can be opened
with Mostra suoni; its visibility preference is saved locally. A second selector
on the instrument selects all FORMA programs and personal FORMA variants.
Selection is local. Carica sends one complete patch to the active edit buffer;
subsequent slider, octave, waveform and chorus changes use the existing live
parameter transport. Nothing writes a permanent hardware bank automatically.
The on-panel 61-note keyboard and Tastiera Mac use the existing MIDI playback.

The new pack is available through BANCO .MID. It contains 16 edit-buffer SysEx
programs in a Standard MIDI File, not commands for writing 16 persistent slots.
Replaying the entire MIDI file leaves its last program in the edit buffer.

## Mapping and sound design

Source: `forma-bank.js`. Every program defines two Classic oscillators, pulse
width, sub/noise balance, filters, amplifier and filter envelopes, LFO routes and
chorus. Both oscillators are nominally locked (no oscillator detune by default).
The oscillator pair approximates the reference instrument's simultaneous saw
and pulse signals; it does not recreate its DCO circuit.

- RANGE sets A20/A25 together to 52, 64 or 76 (16′, 8′, 4′).
- SAW / PULSE / BOTH set Classic shapes A17/A22 and mixer balance A33.
- Pulse width writes A23 (the pulse oscillator), PWM writes A76.
- Pitch LFO writes A74/A75; RATE writes A67/A79 for shared movement.
- HPF uses filter 2 in HP mode A52=1 with independent cutoff B32=0 and serial
  routing A53=1. It is a Virus filter, not a model of the original stepped HPF.
- VCF uses A40/A42/A44/A88/A46, VCA level A91.
- A59/A60/A61/A63 are mirrored to A54/A55/A56/A58: one shared ADSR.
- Chorus I/II use Virus A105/A106/A107, not a BBD circuit model.

Inherited HyperSaw, unison, arpeggiator, delay/reverb, extra oscillator,
distortion and modulation assignments are disabled in this pack. Volume is
100/127; perceived levels still vary by timbre and require hardware listening.
The four earlier FORMA starters use the same neutral profile while retaining
their names and principal settings. Existing personal variants are preserved.

Generated files: `assets/sound-bank/VIRUS-H-FORMA-P-Classic-Studies.mid` and
`.syx`. Regenerate using `VirusFormaBank.midi(bank)` or concatenate
`programs.map(program => build(bank, program))`.

Artwork: `tools/render-sprites/forma_controls.py`, rendered with Blender Cycles,
creates the 61-key keybed with horizontal bender geometry and the ivory fader
cap. Live keyboard overlays use the same rendered key coordinates. The bender
geometry itself is visual; pitch bend is not implemented by that mesh.

Validation covers every dump's length, names, both TI checksums, unique
parameter payloads, MIDI roundtrip, shared envelopes, selector mappings,
on-panel note release, library visibility, live writes and explicit loading.

The enclosure uses a separate `forma-shell.webp` satin medium-grey render.
Rebuild it with `Blender -b -t 6 -P tools/render-sprites/forma_controls.py --
--shell-only`, then encode the PNG with cwebp. Paint roughness is 0.68,
metallic 0.10 and specular IOR level 0.24, with fine reduced bump and broad fill.
Only FORMA / P consumes this asset; the digital panel keeps its own finish.
