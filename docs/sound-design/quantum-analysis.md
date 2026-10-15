# Analisi QUANTUM Demo · Access Virus TI

Analisi strutturale del file fornito, 15 ottobre 2026. Non è una valutazione d’ascolto.

## File e perimetro

- File: `QUANTUM DEMO BANK VIRUS TI www.ultimatexsounds.com.mid`.
- Dimensione: 20,579 byte.
- SHA-256: `0321549f934a55e17c10549746cbbdfa0671fcb91da24fe0084126e12d9fa3fa`.
- 39 messaggi Single Dump da 524 byte: entrambi i checksum validi in tutti i messaggi.
- 18 payload distinti escludendo nome, indirizzo di banco/slot e checksum.
- Il confronto considera 14 preset dai nomi musicali. Le altre voci sono titoli, separatori e presentazione; WELCOME e com hanno payload distinti e non sono stati inclusi nel campione di confronto. Questa classificazione non prova che siano silenziosi.
- Il file è stato letto localmente. Nessuna patch è stata inviata al Virus o inserita negli asset pubblici dell’app.

## Risultato principale

La differenza osservabile rispetto ai nostri starter riguarda l’intera architettura della patch: sorgenti sonore diversificate, inviluppi con funzioni distinte, modulazioni per nota e controlli espressivi, struttura stereo e rifinitura degli effetti. Non è sufficiente aggiungere riverbero a una patch semplice per ottenere lo stesso risultato. Il numero di parametri configurati, da solo, non misura la qualità.

## Confronto quantitativo

| Scelta di programmazione | QUANTUM: 14 preset analizzati | Directions: 20 originali | FORMA Classic Studies: 16 originali |
| --- | ---: | ---: | ---: |
| Famiglie di oscillatori | 6 | 2 | 1 |
| Unison configurato | 11 | 1 | 0 |
| Saturazione di voce non Off | 9 | 0 | 0 |
| Chorus: mix maggiore di zero | 14 | 11 | 13 |
| Delay: send maggiore di zero | 12 | 8 | 0 |
| Reverb: modo attivo e send maggiore di zero | 13 | 15 | 0 |
| Phaser: mix maggiore di zero | 9 | 0 | 0 |
| EQ diverso da neutro | 14 | 0 | 0 |
| Patch con rotte matrice non neutre | 14 | 20 | 0 |
| Rotte matrice non neutre complessive | 97 | 20 | 0 |

Le rotte sono **configurate**, non necessariamente udibili in ogni situazione: una sorgente come aftertouch, un controller o Arp Input richiede la relativa azione o configurazione. I send non sono percentuali di wet e valori uguali fra effetti diversi non rappresentano lo stesso livello percepito.

FORMA mantiene volutamente l’architettura semplice a inviluppo condiviso del riferimento Juno. L’assenza di formanti o di molte rotte non è un difetto per questo obiettivo. Il campione QUANTUM è più adatto a studiare profondità, espressività e rifinitura che a decidere quanto debba assomigliare al Juno.

## Le scelte che contano

### 1. La sorgente non è sempre una coppia di saw

Nei 14 preset compaiono Classic, HyperSaw, Wavetable, Wave PWM, Grain Simple e Formant Complex. I modelli vengono combinati con FM, sync, sub e bilanciamento dinamico. Un oscillatore configurato può avere volume statico minimo o essere usato come sorgente di modulazione: la sola presenza non implica che si sentano sempre due layer.

### 2. Il suono cambia durante la nota

Cinque preset usano Envelope 3 o Envelope 4 come sorgenti della matrice: SAX 1982, EXP 204911, BR 2049^2, QUANTUM 12 e F.RUNNER. Le destinazioni includono bilanciamento degli oscillatori, intonazione, filtro, volume del terzo oscillatore e velocità degli LFO. Gli inviluppi filtro e amplificatore hanno generalmente compiti e curve differenti.

### 3. È prevista una performance

La matrice usa velocity, mod wheel, channel pressure, Data Entry, Controller 3 e altri controller. Alcuni soft knob comandano controller assegnati a più destinazioni: non solo cutoff o volume. Per sentirne il contributo bisogna provare le patch con quei controller, non soltanto con note a velocity fissa.

### 4. Unison e stereo sono scelte, non un interruttore sempre al massimo

Undici preset hanno unison configurato: cinque Twin, due a tre voci, uno a quattro, uno a cinque e due a otto. Tre sono Off. Lo spread varia anche fino a zero; quindi unison non equivale sempre a un suono largo. I filtri impiegano Serial 6 (9), Parallel 4 (2), Serial 4 (1) e Split Mode (2). Queste scelte modificano timbro, densità e costo di voci.

### 5. Gli effetti fanno parte del progetto

Otto preset hanno intensità di distorsione maggiore di zero; tutti hanno una curva diversa da Off, spesso Wide. Per le curve speciali il solo valore d’intensità non basta a stabilire l’effetto udibile. Sono presenti Character quali Analog Boost, Vintage 2 e Stereo Widener. Il parametro storico Bass/Character Intensity non va interpretato come controllo universale d’intensità per tutti i Character.

Chorus, delay, riverbero e phaser sono spesso usati insieme, con tipi, feedback e tempi diversi. Sei preset configurano un arpeggiatore, incluso un caso Arp→Matrix: il pattern può quindi avere una funzione timbrica oltre che musicale.

### 6. Una parte dell’impatto può dipendere dal livello

Patch Volume nel campione QUANTUM: 92–127, mediana 105,5. Directions: 64–78; FORMA: 100. Questi valori MIDI non sono una misura di loudness.

L’EQ è non neutro in tutti i 14 preset. La decodifica della tabella indica boost consistenti, con mediana circa +5,75 dB sui bassi, +8,38 dB sui medi e +15,13 dB sugli alti. Alcune patch raggiungono il valore massimo codificato sugli alti. L’effetto reale dipende anche da frequenze, Q, filtri e spettro della sorgente. Aumentare tutto non è una ricetta trasferibile. Prima di giudicare il risultato servono registrazioni e confronto a livello percepito equivalente.

## Tre esempi istruttivi

**EXP 204911**: due oscillatori Classic, unison Twin e filtri in serie. Sei rotte matrice non neutre; Envelope 3 muove più elementi, fra cui bilanciamento, pitch e filtro 2, mentre Envelope 4 controlla il rate dell’LFO 2. Mostra quanta evoluzione si possa costruire anche senza wavetable.

**MrX IDEA 2**: unison Off, ma 14 rotte matrice non neutre. Wheel e channel pressure controllano velocità e intensità della modulazione; altri controller modificano bilanciamento e tempi degli inviluppi. È un esempio di espressività costruita nella patch, non di semplice moltiplicazione delle voci.

**2 WAY ATMO**: due Formant Complex e una sola rotta matrice non neutra. Il movimento viene anche dalla modulazione diretta della forma, dal routing Split e dagli effetti. Dimostra che la quantità di rotte non è un punteggio di qualità.

## Come portare i nostri suoni a questo livello

1. **Progettare poche patch complete prima di espandere il catalogo.** Tre piloti: brass espressivo, ensemble in evoluzione e basso definito. I nostri starter attuali non hanno ancora avuto una calibrazione d’ascolto sufficiente per essere presentati come un banco commerciale finito.
2. **Definire un nucleo valido senza effetti.** Registro, fondamentale, armoniche, bilanciamento e inviluppi devono essere musicali già da asciutti. Per FORMA conservare il carattere Juno; usare PWM e modulazioni discrete senza trasformare ogni preset in una texture cinematica.
3. **Programmare la performance per ogni patch.** Velocity sul timbro e sul livello, wheel con un gesto musicale specifico, aftertouch dove disponibile. Le macro devono avere destinazioni e intervalli adatti alla patch, anziché la stessa formula per tutti i suoni.
4. **Costruire l’evoluzione dove serve.** Gli inviluppi aggiuntivi e la matrice servono a dare una traiettoria al timbro, non a riempire slot. Per FORMA possono diventare variazioni Studio più evolute, mantenendo una versione Classic semplice.
5. **Rifinire effetti e livelli singolarmente.** EQ, saturazione, Character e spazio devono rispondere alla funzione del suono. Delay e riverbero non devono mascherare attacco, articolazione e frequenze utili.
6. **Verificare sul Virus, registrando.** Note brevi e lunghe, accordi, registri basso/medio/alto, più velocity, wheel/aftertouch, dry/wet e controllo in mono. Confrontare a livello equivalente e controllare code, picchi e polifonia sullo Snow.
7. **Congelare una versione soltanto dopo il confronto.** Gli attuali test di indirizzi, checksum e trasmissione dimostrano correttezza tecnica; non certificano qualità del suono o equivalenza al riferimento.

## Inventario del campione

| Slot MIDI (0-based) | Preset | Osc 1 / Osc 2 | Unison | Rotte matrice | Reverb / Delay send |
| ---: | --- | --- | --- | ---: | --- |
| 6 | SAX 1982 | Grain Simple / Classic | Off | 6 | 37 / 81 |
| 9 | EXP 204911 | Classic / Classic | Twin | 6 | 47 / 0 |
| 19 | BR 2049^2 | Classic / Classic | Twin | 2 | 48 / 86 |
| 22 | MrX IDEA 2 | Classic / Classic | Off | 14 | 37 / 0 |
| 25 | QUANTUM 4 | Classic / Formant Complex | 4 | 2 | 46 / 74 |
| 35 | QUANTUM 12 | Classic / Grain Simple | 8 | 5 | 38 / 57 |
| 38 | B.R SEQ 4 | Classic / Classic | Twin | 7 | 0 / 55 |
| 41 | Proton X | Wavetable / Classic | 3 | 11 | 76 / 87 |
| 51 | MonoBRUTE | Formant Complex / Formant Complex | 3 | 8 | 68 / 40 |
| 54 | F.RUNNER | Classic / HyperSaw | Twin | 15 | 42 / 95 |
| 57 | 2 WAY ATMO | Formant Complex / Formant Complex | Twin | 1 | 77 / 37 |
| 67 | QUAKE 8 | Wavetable / Classic | 8 | 9 | 52 / 76 |
| 70 | Guitara 2 | Wave PWM / Classic | Off | 5 | 41 / 104 |
| 73 | BR SEQ 1 | Formant Complex / Formant Complex | 5 | 6 | 21 / 72 |

## Metodo e limiti

Le quattro pagine sono lette a partire dagli offset A=9, B=137, E=266 e F=394, saltando il checksum intermedio. Nelle statistiche della matrice sono conteggiate soltanto sorgenti e destinazioni non Off con amount diverso dal centro 64. Le rotte LFO dirette e quelle della velocity sono analizzate separatamente, per evitare di confonderle con gli slot matrice.

Le definizioni di parametri provengono dalla copia locale del riferimento TI già usato dal progetto. I modelli e i nomi delle enumerazioni dipendono dalla versione del firmware; le condizioni di attivazione e il contributo sonoro richiedono verifica sul dispositivo. Non è stato eseguito alcun rendering audio del banco. La conclusione riguarda la programmazione osservata, non un ascolto che non è avvenuto.

Questo rapporto è conservato nella documentazione del progetto. Dump originali, script e dati completi di analisi restano nella directory locale ignorata `.local/quantum-analysis`. Le patch commerciali non sono state inserite nelle librerie dell’app.
