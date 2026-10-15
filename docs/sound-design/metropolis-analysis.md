# METROPOLIS · Reverse engineering del banco Virus TI

Analisi locale del 15 ottobre 2026. File MIDI fornito dall’utente; nessun ascolto o invio al synth eseguito durante questa analisi.

## Esito

Il banco contiene 128 Single Dump da 524 byte: **116 patch musicali distinte e 12 titoli/separatori**. I due checksum di ogni dump sono validi. Le 116 patch hanno payload differenti anche escludendo nomi, indirizzi e checksum.

Le sezioni del banco comprendono 14 bassi, 23 bassi arpeggiati, 36 lead/brass, 9 pad, 20 keys/pluck e 14 bell. La classificazione segue i titoli presenti nel banco, non una valutazione d’ascolto; i titoli esclusi non sono stati verificati come silenziosi.

**91 patch su 116 hanno entrambi gli oscillatori principali in modalità Classic.** Il riferimento più utile per FORMA/P è quindi una programmazione accurata del motore sottrattivo del Virus, con articolazione, espressività, stereo ed effetti dedicati. Le famiglie complessive sono Classic, HyperSaw, Wavetable, Wave PWM, Grain Complex e Formant Complex.

## Confronto con QUANTUM e con i nostri starter

| Elemento configurato | METROPOLIS 116 | QUANTUM 14 | Directions 20 | FORMA 16 |
| --- | ---: | ---: | ---: | ---: |
| Unison non Off | 104 | 11 | 1 | 0 |
| Saturazione di voce non Off | 28 | 9 | 0 | 0 |
| Chorus mix > 0 | 95 | 14 | 11 | 13 |
| Delay send > 0 | 108 | 12 | 8 | 0 |
| Reverb abilitato e send > 0 | 87 | 13 | 15 | 0 |
| Phaser mix > 0 | 34 | 9 | 0 | 0 |
| EQ non neutro | 115 | 14 | 0 | 0 |
| Patch con rotte matrice non neutre | 101 | 14 | 20 | 0 |
| Rotte matrice non neutre | 477* | 97 | 20 | 0 |
| Risposte velocity dirette non neutre | 98 | 13 | 20 | 16 |

*Una rotta in X Bell 1 ha sorgente 127, non identificata dalla mappa disponibile: 476 rotte hanno sorgente e destinazione risolte. Le rotte sono configurazioni, non prova di attività udibile. Wheel, pressure, controller, Arp Input e valori fuori dall’intervallo documentato richiedono verifica sul dispositivo. I conteggi non costituiscono un punteggio di qualità.

## Le tecniche ricorrenti

### Densità controllata

L’unison è Twin in 57 patch, a 3 voci in 32, a 4 in 11, a 6 in 2, a 8 in 2; è Off in 12. Non tutto viene portato a otto voci. Lo spread può essere zero anche con unison attivo: densità e larghezza sono decisioni separate. Detune fra oscillatori, unison detune e modulazione di pitch hanno ruoli diversi. La polifonia effettiva va verificata sullo Snow.

### Filtri e articolazione

Routing: Serial 6 in 61 patch, Serial 4 in 26, Parallel 4 in 20, Split in 9. Quando Filter Link è attivo il secondo cutoff può rappresentare un offset: non va letto automaticamente come frequenza indipendente. Inviluppi filtro e amp sono spesso differenti. Sedici patch usano Envelope 3 o 4 nella matrice, per separare componenti della nota e traiettorie timbriche.

### Performance progettata

48 patch assegnano almeno una soft knob. La matrice include 155 destinazioni da Mod Wheel, 52 da Velocity On, 47 da Channel Pressure e 28 da Key Follow. Sono conteggi di rotte, non di patch. Controller 12, 13, 14, Data Entry e Controller 3 comandano gruppi di parametri: le soft knob possono quindi essere macro musicali interne al Virus.

Per i nostri strumenti conviene riportare questa struttura nelle macro, con destinazioni e intervalli specifici per patch. Il comando deve poter aprire un suono o far emergere un attacco senza alzare indiscriminatamente il volume.

### Rifinitura

Distortion è non Off in 111 patch, con Wide in 105. Solo 73 hanno contemporaneamente tipo non Off e intensità statica > 0; la matrice può però modulare l’intensità. Non basta il nome della curva per quantificare la distorsione udibile.

Character: Analog Boost 80, Stereo Widener 11, Vintage 1/2/3 complessivamente 21, Speaker Cabinet 2, Pad Opener 1, Lead Enhancer 1. Il parametro storico Bass Intensity non è un controllo universale di quantità per tutti gli algoritmi Character.

L’EQ è molto caratterizzato: **89 patch hanno HighEQ Gain al massimo codificato**, mostrato dalla tabella come circa +16 dB. È un dato da controllare nell’editor/hardware, non una raccomandazione di copiare il boost. Frequenze, Q, sorgente, filtri e gain staging determinano il risultato. Patch Volume 75–127, mediana 105: non misura il livello audio percepito.

## Sei casi da studiare

### X Juno60 — slot MIDI 25

Due Classic, PWM tramite LFO1, sub, filtri Serial 6, unison Off, saturazione Soft, Character Vintage 2. La wheel controlla velocità LFO, cutoff e risonanza. È configurato un arpeggiatore Up. Chorus, delay e riverbero sono tutti dosati nella patch.

**Indicazione per FORMA/P:** il carattere analogico può essere costruito senza unison; PWM, sub, inviluppi e chorus sono già una base ricca. Questa patch non dimostra equivalenza con un Juno reale e non è una patch factory Roland.

### X ObXa BA — slot MIDI 15

Classic + HyperSaw, registro differenziato, sub, unison a 3 voci ma spread zero, filtri Serial 4. Le soft knob comandano Controller 12/13/14: Controller 12 muove rate e depth del phaser; Controller 14 muove send e feedback del delay. La wheel chiude il filtro con quantità negativa.

**Indicazione per il nostro strumento ispirato a Oberheim:** costruire un centro solido e controlli timbrici coordinati; non associare automaticamente unison a massima apertura stereo.

### X Y-Brass — slot MIDI 58

Due Classic, Twin e filtri Parallel 4. Le modulazioni dirette LFO1 sui pitch hanno segno opposto; velocity apre gli inviluppi filtro, pressure muove intensità e velocità LFO3. Il riverbero ha send zero, mentre chorus e delay sono presenti.

**Indicazione:** attacco, risposta al tocco e movimento relativo possono contribuire al brass più di una lunga coda di riverbero. L’udibilità delle modulazioni dipende da rate, forme e note suonate.

### X D-50 — slot MIDI 55

Classic + HyperSaw, noise, unison a 3 voci, routing Split. Envelope 3 muove cutoff2; l’inviluppo filtro muove cutoff1 con segno negativo. Velocity ha risposte opposte sui due inviluppi filtro; wheel apre entrambi i filtri e pressure controlla LFO3. Chorus, delay e riverbero completano la patch.

**Indicazione per PRISMA o un altro pannello digitale:** separare l’evoluzione delle componenti con i mezzi del Virus. Nel file non ci sono campioni PCM D-50: il nome del preset è un richiamo del sound designer, non prova di un motore LA o di una riproduzione esatta.

### X R-DX7 | — slot MIDI 96

Due Wavetable: selezioni Solenoid e Sooty Sweep secondo la mappa disponibile. Il campo FM Amount è al massimo, con modo FM wavetable FreqMod; le accordature sono differenziate. Envelope 3 controlla il volume del terzo oscillatore Sine; velocity influenza fra l’altro timbro, filtri e intensità distorsione. Unison a 4 voci con spread zero, Stereo Widener e riverbero Hall.

**Indicazione:** una famiglia digitale può sfruttare wavetable, FM e componenti con inviluppi separati restando nel Virus. Non è un dump Yamaha a sei operatori.

### X DX-7 | e X DX-7 || — slot MIDI 120/121

Entrambi partono da Classic con selezione Sine. Il valore statico FM è zero, ma FilterEnv > FM è non neutro e la velocity ne modula l’azione nella matrice: **FM statica a zero non significa necessariamente assenza di FM durante la nota**. La matrice include anche rotte che modulano quantità di altre rotte.

Le tre soft knob sono assegnate a Controller 3, Data Entry e Mod Wheel. Controller 3 agisce sulla quantità della rotta LFO3 → detune; Data Entry muove insieme chorus mix, chorus rate e reverb send; wheel muove rate e intensità LFO3. Questa è una struttura di macro, non tre controlli isolati.

**Indicazione per il nostro pannello digitale:** ricreare comportamenti coordinati con i parametri Virus. Non confondere l’ispirazione timbrica con la compatibilità binaria delle patch Yamaha.

## Applicazione pratica ai nostri strumenti

1. **FORMA/P:** brass, ensemble e basso come primi tre suoni pilota. Conservare una versione Classic coerente con il pannello; aggiungere una versione Studio con espressività ed effetti Virus dedicati.
2. **Digitale:** partire da componenti tonali e attacchi separati, FM/wavetable e modulazione dinamica. Controlli reali Virus, con nomi che descrivono quello che effettivamente fanno.
3. **Pannello a due oscillatori:** lavorare su intervalli, detune, filtri, transitori e macro di densità; evitare lo stesso unison per tutte le patch.
4. **Macro per suono:** registrare controller, destinazioni, quantità e valori di partenza nella patch completa. Le macro dell’app devono rispettare questi percorsi.
5. **Confronto sul synth:** stessi accordi/note, tre velocity, wheel/pressure, registro basso/medio/alto, asciutto/effettato, stereo/mono, registrazioni a livello equivalente. Solo questo passaggio può confermare la qualità.

Il reverse engineering chiarisce la costruzione tecnica; non promette una qualità d’ascolto già raggiunta. Non sono state modificate le patch dell’app né quelle sul Virus.

## Materiale di verifica

I seguenti file tecnici restano nella directory privata `.local/metropolis-analysis/`; la documentazione leggibile è salvata anche qui nel progetto.

- `analysis.json`: 116 schede strutturate, statistiche, controlli checksum.
- [Schede delle 116 patch](metropolis-patch-details.md): matrice, controlli diretti e soft knob.
- `parameters.tsv`: inventario di 65.308 righe di parametri e alias descritti dalla mappa TI.
- `frames.json`: messaggi originali estratti, solo nell’area locale privata.

Il TSV elenca anche parametri alternativi che condividono lo stesso byte: non significa che siano tutti operativi insieme. La modalità dell’oscillatore, il vocoder e altri selettori stabiliscono l’interpretazione corretta. I valori non riconosciuti vengono lasciati numerici; non si attribuisce loro una funzione inventata. Non tutti i byte e comportamenti firmware sono documentati dalla mappa disponibile.

## Provenienza verificata

Dimensione: 67482 byte. SHA-256: `4bb18addaa8bbcd50e287193ff6b4df86c8b7765192ba12530aded947e2962fa`.
