# PANEL — verifica finale

Final result: passed

## Riferimenti e confronto

- Snow: `/Users/lorenzoguerrieri/Music/soundmachina/output/blender/virus-ti-snow-studio-refined.png`, 1920×1080.
- Desktop: `/Users/lorenzoguerrieri/Music/soundmachina/output/blender/virus-ti2-desktop-panel-focus.png`, 1920×960.
- Browser reale: `/Users/lorenzoguerrieri/Music/soundmachina/output/qa/snow-panel.png` e `desktop-panel.png`, entrambi 1142×900.
- Viewport del confronto: 1142×900 CSS px; ritaglio del pannello x24/y139, Snow 1094×615.375 CSS px, Desktop 1094×547 CSS px.
- Normalizzazione: screenshot a densità 1; render originali ridimensionati con Lanczos alla stessa dimensione del pannello. Nessun confronto fra immagini a scale diverse.
- Stato: PANEL, zoom 100%, Multi P1, suono letto via C2MIDI Pro. LCD e rotazioni mostrano dati reali anziché il testo dimostrativo dei render.
- Confronti completi nello stesso input: `output/qa/snow-comparison.png`, `output/qa/desktop-comparison.png`, esaminati visivamente.
- Confronto ravvicinato tasti e manopole: `output/qa/snow-keys-comparison.png`, esaminato visivamente.
- Tablet verticale: `output/qa/snow-tablet.png`, 768×1024. Verificata anche la vista Desktop a 1024×768.

## Esito visivo

Nessun problema P0/P1/P2 aperto.

- Identità: due strumenti diversi, Snow bianco a 6 manopole/21 tasti e TI2 Desktop a 32 manopole/43 tasti. Il riferimento scelto è il TI2 Desktop senza tastiera, non il Darkstar con tastiera.
- Immagini: sfondo, scocche, manopole, tasti e LED Desktop provengono dalle scene Blender. Nessuna attrezzatura di studio copre il pannello. Asset WebP trasparenti correttamente allineati alle posizioni proiettate.
- Superfici e luci: mantenuti scocca Snow rastremata, tasti bassi e piani con angoli appena raccordati, illuminazione contenuta e ombre. Lo sfondo statico conserva le ombre della scocca; gli sprite includono le ombre dei controlli mobili.
- Tipografia: serigrafia del render invariata; LCD vivo proporzionale al suo riquadro. Il nome del parametro completo appare anche sotto il Desktop. Le etichette della barra strumenti restano leggibili e non sovrapposte allo strumento.
- Spaziatura: proporzioni originali 16:9 Snow e 2:1 Desktop; MIDI/SOUNDS/WAVES spostati fuori dalla scocca. Il pannello entra per intero al 100%. Lo zoom scorre dentro il proprio contenitore, senza allargare l'intera pagina.
- Colori: Desktop grigio scuro e LCD neutro; Snow chiaro con LCD azzurro. Gli stati selezionati e il focus hanno contrasto visibile.
- Copy: guide dei due modelli in italiano, funzione STORE descritta come salvataggio nella libreria PATCH; nessuna promessa di scrittura permanente nel banco hardware.

## Correzioni durante la verifica

1. P2: il Desktop veniva tagliato a destra sul tablet per una larghezza minima di 1100 px. Rimossa la larghezza minima; zoom 100–250% per ingrandire quando serve. Riscontro: a 1024 px document scrollWidth=1024; a 768 px document scrollWidth=768, mentre solo il pannello cresce a 1800 px con zoom 250%.
2. P2: un lungo dump SysEx spingeva la configurazione MIDI fuori schermo. Limitata l'altezza del dialogo e del campo diagnostico, con scorrimento interno. Riscontro: aperto CONFIG a 768×1024 e chiuso dal pulsante × dopo la correzione.
3. P2: Undo ripristinava solo l'ultimo passo di un trascinamento. Raggruppati i passi di ogni gesto, conservando il valore iniziale. Riscontro sul Virus collegato: P1 cutoff 64→70→64 con un solo Undo; prova precedente P2 interamente ripristinata a 53 e riletta dal synth.
4. P2: la selezione PANEL era poco leggibile nel tema scuro. Corretto il contrasto. Riscontro nell'ultima `desktop-panel.png`.

## Interazioni e verifiche

- Provate nel browser tutte le 32 manopole, con modifica da tastiera e ripristino Undo: 32/32 riuscite.
- Provati cambio Snow/Desktop, mantenimento della parte/suono, selezione LFO 3, Multi/P2, zoom 125% e 250%, apertura SOUNDS, CONFIG, SEARCH e STORE. SEARCH mette il focus sulla ricerca; STORE apre la libreria e il nome da salvare.
- Trascinamento reale e MIDI provati sul cutoff, con valori ripristinati; riletto il suono dal Virus.
- Tutti i 43 pulsanti hanno dispatch funzionale verificato nei test, nessun pulsante puramente decorativo.
- Test `node --test tests/*.test.cjs`: **31 passed, 0 failed**, incluse le regressioni di MIDI, PATCH e setup Multi.
- Verificate 72 diverse associazioni di manopole e i relativi limiti contro le definizioni TI di [dsp56300/gearmulator](https://github.com/dsp56300/gearmulator/blob/main/source/axel/osTIrusJucePlugin/parameterDescriptions_TI.json). Riverbero su 0x6e, Unison Detune su 0x6f, arpeggiatore TI su Page B15.
- Console del browser: nessun errore o warning nel controllo finale. Sintassi JS verificata con Acorn; `git diff --check` pulito.
- Risorse web sincronizzate per il plugin nativo, inclusi script, CSS e grafica. Metadati incorporati in JS per evitare fetch di JSON da file://.

## Limiti pratici

La verifica fisica copre lettura del suono e cutoff/Undo sul Virus collegato, non ogni parametro di tutti i modelli hardware. Tutte le associazioni dei controlli sono verificate a livello software/protocollo. I controlli piccoli della replica richiedono zoom per l'uso touch preciso; sono accessibili anche da tastiera. Non è stata ricompilata né reinstallata la distribuzione AU/VST3/app nativa. Smartphone esclusi dallo scopo richiesto.

## Aggiornamento Snow — 14 ottobre 2026

Riferimenti fotografici: `B_ACCESS_virustisnow 2.jpg` per tasti e manopole,
`B_ACCESS_virustisnow 3.jpg` per LCD, entrambi forniti dall’utente.

- Scocca: acciaio con verniciatura a polvere fine, non plastica lucida.
- Serigrafia: fondi delle sezioni più scuri di tasti e manopole.
- Tasti: faccia piana, altezza ridotta, raccordo minimo (3,2%).
- Manopole: cono tronco alto, 14 righe leggere laterali, ABS dello stesso colore
  su cap e fianchi; indice chiaro sopraelevato e nessuna scanalatura superiore.
- Ambiente: legno grigio medio, luce da studio e ombre, senza oggetti aggiuntivi.
- LCD: substrato raster azzurro con copertura trasparente renderizzata in Blender;
  testo vivo leggibile, senza cornice CSS cromata o riflesso diagonale intenso.
- Camera, ancoraggi e dispatch dei controlli mantenuti. Nessuna nuova scrittura MIDI
  richiesta per verificare i materiali. Test Node: 31 pass, 0 fail.

La ricostruzione delle forme è fotografica; altezza e conicità non sono quote CAD.
Le precedenti verifiche funzionali restano riportate sopra come storico.

Verifica visiva nel browser a 1142×900: `output/qa/snow-refined-panel.png`;
confronto con dettaglio fotografico in `output/qa/snow-reference-controls.png`.
Verificati apertura ARP con Edit/Shift e ritorno con Exit/Mode; nessun errore
in console. Fondi più scuri dei controlli e tappo privo di scanalatura visibili.

## Correzione sprite delle manopole — 14 ottobre, dettaglio zoom

Eliminato il velo rettangolare del catcher: fondo alfa stimato per fotogramma,
con margine trasparente raccordato; ombre di contatto conservate. Verificati
i bordi trasparenti e le superfici opache per tutti i 64 fotogrammi.
Manopole più spesse (altezza normalizzata 1,09), zigrinatura profonda 0,055,
indice bianco largo 0,125 e alto 0,07. Verifica a zoom 250% nel browser:
`output/qa/snow-shadow-fix-zoom.png`, nessun riquadro visibile. Nessun errore
in console, zoom riportato al 100%, nessuna modifica ai comandi MIDI.

## Piano di studio continuo

Sfondo tecnico a puntini rimosso da tutta l’app. Texture di legno grigio
renderizzata in Blender con camera dall’alto, estesa alla pagina con cover.
Lo Snow è esportato con scocca e ombra su trasparenza, così il piano continua
tra intestazione, strumento e comandi inferiori senza cornice rettangolare.
Intestazione e Zoom hanno superfici uniformi per mantenere il contrasto.
Riscontro: `output/qa/snow-full-wood-local.png`; pagina a 1142×900,
scrollWidth 1142, background-size cover, nessun errore in console.

## Superficie dei tasti e fondo delle sezioni

I tasti Snow ora hanno faccia leggermente convessa, con pareti basse e raccordi
minimi conservati. Corona normalizzata 0,04, altezza massima 0,165. Sfumatura
generata dalla geometria e dall’illuminazione Blender in entrambi gli stati.
Nel fotogramma normale la zona superiore è mediamente RGB 143/147/147,
quella inferiore 136/139/139; riscontro in `output/qa/snow-curved-key-detail.png`.
Fondo serigrafato schiarito da #747975 a #818682; resta più scuro dei controlli.

## Costruzione della scocca Snow

Correzione su indicazione dell’utente: le due pieghe a 90° sono laterali,
a sinistra e a destra. Mesh a fascia aperta, con lamiera spessa 0,055 e
raggio delle pieghe 0,22 (unità del modello), anziché un guscio chiuso
arrotondato su tutto il perimetro. Piano superiore alla stessa quota;
ancoraggi dei controlli invariati. Quote ricostruite fotograficamente.

Verifica finale nell’app: `output/qa/snow-side-bends-local.png`, 1142×900,
console senza errori. I 31 test Node passano; geometria e materiali aggiornati
senza cambiare gli ancoraggi o il comportamento MIDI dei controlli.

## Pieghe più tonde e manopole più scure

Raggio delle due pieghe laterali aumentato da 0,22 a 0,55: raccordo
più ampio tra piano e fianchi. Plastica uniforme delle manopole scurita
leggermente da #b2b5b1 a #a6a9a5; indice bianco e zigrinatura conservati.
Rigenerati sfondo e 64 fotogrammi nativi Blender, con pulizia dell’alfa
per mantenere le ombre senza riquadri. Nessuna modifica ai controlli MIDI.

Confronto a camera e scala identiche: `output/qa/snow-soft-bends-comparison.png`
(prima a sinistra, dopo a destra). Verifica nel browser in
`output/qa/snow-soft-bends-grey-local.png`: nessun errore in console.
Verificate superfici opache e margini trasparenti di tutti i 64 sprite.

## Anteprima del bordo inferiore — in attesa dell’ok dell’utente

Conservata la piega laterale superiore approvata. Raccordato il bordo libero
della lamiera (0,022); rimbalzo di luce inferiore limitato a piano e scocca
per ridurre la fascia di ombra nera sotto il pannello. Sprite dei controlli
conservati. Verifica locale: `output/qa/snow-under-edge-preview-local.png`
e dettaglio `snow-under-edge-preview-detail.png`; console senza errori.
Nessun commit o push della presente anteprima: pubblicazione sospesa fino
all’approvazione esplicita del rendering completo.

## Pannello frontale in ciliegio — anteprima da approvare

Aggiunto inserto tridimensionale in ciliegio satinato nel vano della scocca:
30,8×0,6×1,82 unità, frontale incassato 0,07, spigoli raccordati 0,16.
Venatura orizzontale, colori #683921/#aa6340, distinta dal piano grigio.
La luce inferiore include l’inserto e resta esclusa dai controlli mobili.
Verifica locale: `output/qa/snow-cherry-front-local.png` e dettaglio
`snow-cherry-front-detail.png`; console senza errori. Ancora nessun
commit o push: attesa approvazione esplicita dell’anteprima completa.

## Variante Snow approvata — venature, ombra e plexiglass

Approvazione esplicita dell’utente con richiesta «commit e push». Frontale
in ciliegio opaco con venature anisotrope irregolari; cornice trasparente
in PMMA con smussi e riflessi controllati. Scocca 4/4,5 cm secondo le quote
indicate. Area render 1920×1200 per conservare l’ombra fisica sul piano.
Verificato il mantenimento in pixel dei 45 ancoraggi di controlli/LED,
aggiornate percentuali e metadati incorporati; console senza errori.
Test Node: 31 pass, 0 fail. Riscontro: `output/qa/snow-approved-wood-plexi-local.png`.
La modifica successiva del Desktop sarà mostrata in una nuova anteprima.

## Strumenti accessori e Desktop — anteprima locale da approvare

Final result: passed (verifica locale; approvazione visiva dell’utente pendente).

MULTI, SINGLE, FX RACK, PATCH, ARP, SEQ e SONG usano materiali nativi Blender:
lamiera verniciata a polvere, due pieghe laterali raccordate, frontale incassato
in ciliegio desaturato per Snow e metallo antracite per Desktop. Pulsanti ABS
con lieve bombatura, manopole dagli atlas PANEL e cornici PMMA trasparenti.
Rimosse sovrapposizioni CSS che simulavano metallo/cromature e riflessi diagonali.
Gli ingombri e i tagli 9-slice sono invariati; corretto il clipping della scocca
per mostrare bordo e ombra. Il margine del catcher sfuma sul piano senza rettangolo.

Confronto delle sette viste a 1020 px, stesso zoom e stesso stato delle parti:
`output/qa/accessory-before-*.png` rispetto ad `accessory-after-*.png`.
Verificati inoltre tutti i sette temi scuri: `accessory-dark-*.png`.
Nessun errore console; 31 test Node pass, 0 fail; Python compilato e diff pulito.
La scocca Desktop PANEL non ha più il frontale in legno; il piano antracite
nativo copre l’intera pagina. Camera, layout e 32 manopole/43 pulsanti invariati.
Riscontro: `output/qa/ti2-metal-fullscreen-local.png`.
Raccolta delle 15 anteprime: `output/qa/accessory-review.html`.
Risorse web del plugin sincronizzate, binari AU/VST3 non ricompilati.

Lo Snow già approvato è pubblicato: sorgente 83a87333, Tools a24f0b78.
Verifica SHA256 remota: index, hardware CSS, layout JS e Snow WebP identici
al commit approvato; screenshot `snow-approved-public-83a87333.png`.
Le nuove modifiche restano non committate e non pubblicate, come richiesto
con «prima di committare e pushare ti devo dare l’ok del rendering».

## Revisione materiali e LCD — seconda anteprima locale

Final result: passed (verifica tecnica e visiva locale; approvazione utente pendente).

La prima anteprima accessori è stata giudicata troppo piatta. Le superfici
continue 1920×1200 ora usano gli shader e le area light dei file PANEL originali:
`Acciaio Snow verniciato a polvere` e `Vernice antracite TI2`. Cornici laterali
con lo stesso rig; ciliegio originale per Snow. I quattro pulsanti rettangolari
riusano `ABS rigido tasto Snow` / `Tasti TI2 opachi`, senza vernice a polvere
sull’ABS. Le manopole rimangono quelle degli atlas del PANEL.

Serigrafie opache, gruppi stampati sulla superficie e luce continua, senza
texture luminose ripetute. Finestre LCD con cornice ABS nera smussata nativa,
PMMA separato e fondo ricavato dal PANEL. Palette Desktop grigio-verde neutra;
rimosse componenti rosse, bagliori OLED e tremolio decorativo dei nomi Multi.
Nomi immediatamente completi e stabili; bitmap aggiornata per =, +, /, _;
passo dei caratteri adattato ai nomi lunghi senza modificare i dati MIDI.

Confronto alla stessa scala delle precedenti anteprime: 1020×916, zoom 100%.
Sette sezioni per entrambi i materiali: `output/qa/accessory-v2-snow-*.png`
e `accessory-v2-dark-*.png`, tutte osservate nel browser. Nessun errore console.
Test Node: 31 pass, 0 fail; generatori Python compilati, diff senza errori.
Gallery aggiornata: `output/qa/accessory-review.html?v=2`.
Tutte le nuove modifiche restano locali, senza commit o push.

Ultimo controllo: tutte le forme stampate ARP/SEQ uniformate alla stessa
finitura dei gruppi FX/MULTI. Rimossi i bordi rossi degli LCD e la tinta rossa
dei cappelli degli step, preservando i LED fisici separati. Verificati nomi
completi sui quattro LCD Multi, adattati allo spazio disponibile. Aggiornate
le 14 immagini; ripristinato il viewport del browser dopo il confronto.
Gallery cache aggiornata con v=2.1; nessun errore console e nessun push.

## Snow LCD v3 e ricerca icone — 15 ottobre 2026

Final result: passed (anteprima locale, non pubblicata).

Solo gli accessori Snow ricevono una copertura PMMA nativa più spessa,
riflesso di studio controllato e ombra interna posta sopra i canvas, senza
sfocare testi o grafici. PATCH usa ora un ampio fondo LCD azzurro con cornice
nera e copertura trasparente; campi e comandi restano interattivi. SINGLE
ha una finestra relativa dedicata al solo LCD; Desktop e PANEL conservano
le superfici precedenti. Renderer accessorio separato, CPU per evitare un
abort Metal; due PNG e due WebP completati regolarmente.

Sette screenshot Snow v3 a 1020×916 in output/qa; console senza errori;
31 test passati, generatori Python compilati e diff pulito. Viewport ripristinato.
Raccolta: output/qa/accessory-review.html?v=3.

Ricerca librerie su fonti ufficiali: Lucide (ISC), FontAudio (SVG CC BY 4.0,
font OFL, codice MIT), Game-icons (CC BY 3.0). Confronto locale di 18 esempi
con le 12 icone attuali, anche a 18 e 24 px. SVG verificati e salvati solo
in output/qa/icon-libraries con fonti; nessuna sostituzione nell’app.
Raccolta: output/qa/icon-library-review.html. Nessun commit/push.

## Icon libraries integration — 2026-10-15
Status: passed (local preview); rendering approval and publication pending.
- Replaced all twelve part category icons with vendored FontAudio, Lucide and three Game-icons instrument silhouettes. Existing category IDs, firmware classification, saved colors/choices and MIDI behavior remain intact.
- Shared `virus-icons.js` preserves each library's coordinate system and fill/stroke mode. The same renderer serves MULTI, category picker, selected part and keyboard badges. Header FX RACK, KEYS and FEEDBACK use Lucide.
- Added source SVGs, licensing/attribution and an accessible credits link in the quick guide. Updated plugin and Tools copy manifests; no Tools build/publication performed.
- Verification: all 31 existing Node tests passed; inline JavaScript syntax, twelve renderers and git diff whitespace checks passed. No browser console errors. Visually checked actual MULTI picker and catalog at 18/26 px on light/dark backgrounds.
- Evidence: `output/qa/icons-integrated-multi.png`, `output/qa/icons-integrated-catalog.png`, `output/qa/icon-integration-tests.txt`. Preview: `/output/qa/icon-implementation-review.html`.
- No commit or push: awaiting the user's rendering approval as requested.

## PATCH UX workspace — 2026-10-15
Status: passed locally; user rendering approval pending, no commit/push.
- Grounded in the approved physical enclosure/LCD assets and current PATCH screenshots. Destination cards move to a compact left column; active part retains read/edit actions. Search/library becomes the dominant central work area.
- Added contextual search labels, source-specific result counts with live status, clear-search button, actionable empty library, expandable sound/Multi save controls, and clearer bank import wording. Existing IDs and all MIDI loading paths retained.
- STORE shortcuts now expand the sound-save controls before focusing the name input. Keyboard tab navigation and focus retained.
- Browser QA: actual app on Snow and Desktop, 1280×720; tablet 1024×768 and 768×1024, document width equals viewport in both tablet sizes. Checked clear search, empty search, expandable save controls and tab navigation. No console errors. Local library is empty; populated rows, name filtering and correct load destination are covered by existing Node tests.
- 33 Node tests passed, including new tests for source-specific counts/search labels and empty-library navigation. git diff --check passed. Plugin web resources synchronized; native binaries not rebuilt.
- Compared before/after in output/qa/patch-ux-comparison.png; library/search now appear beside destinations rather than below four tall cards. Evidence: patch-ux-after.png, patch-ux-desktop-dark.png, patch-ux-tablet.png, patch-ux-tablet-portrait.png; test log patch-ux-tests.txt.

### PATCH v5 — restrained LCD allocation
Status: passed locally; awaiting rendering approval.
- User rejected the full blue workspace. Removed LCD substrate, gasket and PMMA overlay from the overall PATCH panel. Controls, destination cards and library now sit on the actual neutral powder-coated body map.
- Reserved the optical LCD treatment for the small destination readout, with destination and current sound name. Snow uses its native blue LCD; Desktop uses its own gray-green substrate. Updated static accessory review PATCH images to avoid stale previews.
- Verified both skins in the actual browser; no console errors. 33 tests passed and diff whitespace clean. Plugin web resources updated; no commit/push.
- Evidence: output/qa/patch-ux-v5-snow.png and patch-ux-v5-dark.png.
