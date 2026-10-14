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
- Superfici e luci: mantenuti scocca Snow rastremata, tasti bombati con angoli morbidi, illuminazione contenuta e ombre. Lo sfondo statico conserva le ombre della scocca; gli sprite includono le ombre dei controlli mobili.
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
