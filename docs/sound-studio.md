# Studio Suoni

The STUDIO tab brings the catalog, four musical macros, A/B comparison and
variant saving into one work surface. BANCHI retains hardware-bank reading,
file import/export, Multi libraries and the existing archive tools.
`#studio` opens the Studio; old `#percorsi` links remain compatible.

## User flow

1. Browse Directions 01, musical styles, personal variants or favorites. Search
   names, roles, descriptions and tags. Selection does not send MIDI.
2. Adjust Corpo, Brillantezza, Movimento and Spazio with the original Blender
   knobs. Drag vertically; Shift reduces drag sensitivity. Arrow keys step by 1;
   Page Up/Down step by 10. Double-click restores the selected macro.
3. Send A for the selected record's original bytes, or B for the current draft.
   Listen using the actual Virus and a connected keyboard. The app reports
   transmission, not audio playback or hardware acknowledgement.
4. Save a variant with a name, character tags, type and style. The source record
   and every existing variant remain unchanged. The full display name is retained
   locally; the Virus name is converted to ten printable ASCII characters.
5. Export the current sound as a real Standard MIDI File, or save a Studio JSON
   backup including personal patches, ancestry, tags and favorites.

The full editor action is explicitly labelled "Invia B e apri editor": it sends
the draft successfully before opening SINGLE. Returning to Studio after hardware
edits shows a state change when the cached dump differs. Read the current sound
from the Virus to capture those edits as another independent record.

On mobile the catalog is collapsed initially and closes after selecting a sound.
On desktop the catalog scrolls independently. Results render in groups of 100;
search still covers all sounds. Metadata browsing avoids cloning every SysEx
payload on each search keystroke.

## Model and persistence

`sound-studio.js` separates pure patch/model functions from UI and the transport
bridge. Schema version 1 is stored in `virusH_soundStudio_v1` in localStorage.
Factory IDs use `directions:<program-id>`. Imports and user variants get stable
UUIDs; display names are not storage keys. Variants include `parentId` and full
patch bytes. Favorite metadata is stored independently by ID.

The old patch library is copied into Studio without changing the source. Factory
duplicates are detected by name and canonical bytes. A personal patch sharing a
factory name is kept as a distinct record. Repeated navigation does not duplicate
imports. Corrupt Studio storage is reported and not silently overwritten; an
explicit validated backup restore can recover it. Storage failures leave the
editable draft intact. Studio backup restore merges by ID and preserves existing
records. The older archive backup now includes the Studio state as well.

Draft macro positions survive tab/record navigation in this session. Reloading
does not autosave an unfinished draft: use Salva variante to keep it. Saved
variants and favorites persist in this browser; JSON backups are portable.

## Macro programming

All four macros are relative to a complete source patch. Center (displayed 0)
preserves its bytes. Programming is deterministic and does not accumulate drift.
Original inputs are never mutated, and both TI checksums are recalculated.

- Corpo: sub level for basses; detune and chorus depth for pads; bounded detune
  for leads; oscillator balance for keys/plucks/imports.
- Brillantezza: filter-1 cutoff and envelope amount.
- Movimento: LFO-2 filter depth (preserving polarity), plus chorus depth.
- Spazio: delay send and TI reverb send; legacy 267-byte patches use chorus mix
  alongside delay instead of accessing absent TI pages.

The macros do not change program banks, output routing or hardware volume, and
do not store to the Virus's permanent memory. Selecting, filtering, favoriting,
editing macros, saving variants and downloading are all local operations.

## MIDI capture and transport

The bridge pins the output/mode/buffer for each explicit load. A/B and editor
handoff lock selection during transmission and reject a lost connection.
Destination labels update when Single/Multi-part selection changes.

"Leggi il suono dal Virus" issues a Single Request and waits for an actual MIDI
reply event from the reception path. Host-side loads cannot satisfy the request.
Replies from other parts are ignored; a changed destination or a 4.5-second
timeout fails without saving a fabricated patch. Listener/timer cleanup is
covered by tests.

The UI uses "inviato" to distinguish a completed output send from a confirmed
hardware response. Actual synth audition and response verification still require
connected hardware. Browser QA runs in an isolated MIDI-disabled preview.

## Validation and assets

Tests cover neutral macro fidelity, bounds/checksums, stable IDs, same-name
variants, persistence, legacy imports, backup recovery, storage quota failures,
large-library paging/search, no MIDI on browsing or saving, exact MIDI exports,
explicit A/B and editor handoff, failed sends and real capture scope/timeouts.

Visual assets reuse original generated cover art and original Blender control
atlases. Favorite icons come from Lucide under its included ISC license. No
Kontakt/Arturia branding, graphics, code or presets are bundled. Both the web
builder and native plugin sync include the Studio modules and assets.
