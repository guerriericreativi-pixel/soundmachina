# ARP: quattro parti indipendenti

Verifica e correzione del 16 ottobre 2026.

Il precedente ARP esterno aveva un unico motore e P1–P4 ne cambiava solamente la destinazione. Ora ogni parte ha un motore distinto: pattern a 16 step, note/accordi, modalità, risoluzione, ottave, gate, swing, HOLD e trasporto separati. Il BPM è comune. Selezionare un'altra parte non interrompe quelle in esecuzione.

## Uso

1. Nella vista MULTI assegna suoni e quattro canali MIDI distinti alle parti. I canali possono essere diversi da 1–4: ARP legge le assegnazioni effettive.
2. In ARP usa **Attiva MULTI** se necessario. Il comando cambia esplicitamente il modo del Virus, senza caricare nuovi suoni.
3. Seleziona P1, modifica il pattern, avvia e suona un accordo con KEYS o tastiera Mac. HOLD conserva le note dopo il rilascio. Ripeti con P2–P4; ogni parte conserva il proprio accordo. Una tastiera MIDI esterna controlla il motore in esecuzione sul suo canale.
4. **Avvia tutti** richiede quattro canali distinti; **Ferma tutti** interrompe tutti i motori. Con HOLD spento un motore avviato aspetta le note.

In SINGLE è disponibile solo P1 e usa il canale MIDI globale. Canali duplicati vengono rifiutati per evitare di sovrapporre due sequenze sulla stessa destinazione.

## Hardware e sicurezza delle note

Questo è un generatore di note MIDI nell'app, distinto dagli arpeggiatori nativi del Virus. All'avvio disattiva l'ARP nativo soltanto sulla parte interessata (pagina B `0x71`, parametro 15; parte 0–3 in MULTI, `0x40` in SINGLE), evitando un doppio arpeggio. Non modifica volume, expression, pan, cutoff o patch. Il precedente avvio conteneva CC41=0, che sul Virus modifica Cutoff 2: eliminato.

Ogni motore conserva porta e canale di avvio fino al rilascio delle note; stop e panic cancellano scheduler e gate. Cambiare porta, modo o il canale della parte interrompe i motori coinvolti. Cambiare parte durante una nota della tastiera conserva il destinatario originale del note-off. Il rilascio dei tasti interrompe le note quando HOLD è spento. I gate precedenti vengono cancellati prima di riarticolare lo stesso pitch.

Gli ARP esterni richiedono la pagina aperta: quando diventa nascosta, i motori si fermano per evitare temporizzazioni degradate in background. Le impostazioni sono della sessione e non vengono scritte nei banchi hardware. Il BPM comune dei quattro motori esterni non invia MIDI Clock: delay e LFO nativi non vengono sincronizzati automaticamente. Non è ancora previsto il salvataggio/ripristino automatico del modo ARP nativo precedente.

## Verifiche

`node --test tests/arp-parts.test.cjs` verifica quattro flussi MIDI contemporanei, canali personalizzati, indirizzi SysEx, isolamento dei controlli, HOLD, stop, cancellazione dei gate e vincoli SINGLE/canali duplicati. La suite completa passa con 141 test. Verifica UI in `.local/arp-parts-qa.html` su 8773 con accesso MIDI disabilitato; nessuna nota inviata al Virus fisico durante i test. L'ascolto hardware delle quattro parti insieme resta da effettuare.
