# Percorsi sonori

The PERCORSI editor view offers five musical styles and four original sound
characters. Names, copy, recipe values and cover artwork are original project content;
no third-party soundbank, preset dump, logo or instrument skin is bundled.

Recipes shape the current Virus sound. They are not complete patches, automatic
Multi setups or emulations of other instruments. Oscillator models and modulation
routing remain as selected on the hardware. Vetro explicitly directs the user to
choose a wavetable through SINGLE / WAVES before applying its envelope/filter recipe.
Tempo values and P1–P4 roles are suggestions, not automatic hardware changes.

Selecting a path sends nothing. Only the explicit send action applies its small
parameter batch, and it requires an output with SysEx authorization. The bridge
validates every address and 7-bit value before sending, pins one edit buffer for
the synchronous batch, then updates the editor's cached values and patch dump.
It never sends bank/store commands. Partial send errors are reported as interrupted
transmission, not success or rollback. Reverb uses TI page E indices 2 and 4.

Unit tests cover browsing without writes, disconnected/unauthorized outputs,
invalid recipes, failed sends, busy selection, active Multi-part isolation and
the Single buffer. Browser checks cover both skins and responsive layouts.
Recipes still require listening and refinement on actual Virus hardware.
Cover artwork is decorative and does not represent measured audio.

The web entry builder and native plugin sync both include `sound-paths.js` and
`sound-paths.css`. A direct local editor link can use `/#percorsi`.

The console uses original Blender geometry from
`tools/render-sprites/sound_path_controls.py`: 32-angle knob atlases preserve
fixed studio lighting while rotating. Analog/studio use a fluted polymer knob;
digital uses a satin aluminium cap. Four vertical faders control ADSR. The render
source saves `.blend` scenes under `output/blender/` and sprites under
`assets/sound-paths/controls/`. No manufacturer panel is copied.

Controls edit a per-path draft, retained while browsing during the session.
Dragging knobs vertically (Shift for precision), using the faders or keyboard
arrows never sends MIDI. Apply sends the current draft. Double-click restores a
single default; Ripristina valori resets the selected direction. Controls lock
during transmission. Draft values describe the intended settings, not confirmed
hardware feedback. The left navigation is 166px on desktop and 148px on tablet.
