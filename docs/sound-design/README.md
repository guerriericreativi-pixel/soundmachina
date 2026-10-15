# Sound design · Virus-H

Riferimento di progetto per sviluppare suoni originali con il motore Access Virus TI. Analisi del 15 ottobre 2026 dei banchi forniti dall’utente, confrontati con Directions e FORMA Classic Studies.

## Documentazione

- [QUANTUM: analisi di 14 preset musicali del demo](quantum-analysis.md).
- [METROPOLIS: reverse engineering di 116 patch](metropolis-analysis.md).
- [METROPOLIS: schede di oscillatori, filtri, inviluppi, matrice e FX](metropolis-patch-details.md).
- [Statistiche dei banchi e del confronto con i nostri starter](bank-statistics.json).

- [Altri banchi online: fonti, demo verificati e priorità per Percorsi](online-reference-banks.md).

## Decisioni da applicare allo sviluppo

1. Progettare patch complete, con sorgenti, articolazione, performance ed effetti coerenti; la quantità di modulazioni non misura la qualità.
2. FORMA/P conserva un nucleo sottrattivo riconoscibile: PWM, sub, inviluppi e chorus. Prevedere una variante Studio più evoluta senza perdere il carattere di partenza.
3. Le famiglie digitali possono sfruttare FM, wavetable e inviluppi aggiuntivi del Virus. Non presentarle come compatibili con dump o motori Yamaha/Roland se non lo sono.
4. Le macro devono avere destinazioni e intervalli specifici per patch; possono pilotare più parametri e quantità di altre rotte. Un valore FM statico zero può essere modulato durante la nota.
5. Distinguere densità e larghezza: unison attivo non implica spread elevato. Verificare la polifonia sullo Snow.
6. Progettare EQ, Character ed effetti per ogni suono. Non copiare automaticamente boost elevati o valori di volume dal riferimento.
7. Primo gruppo di lavoro: brass espressivo, ensemble in evoluzione e basso definito. Stato: tecniche applicate alla revisione 3 dei 20 suoni di VIRUS-H PERCORSI; calibrazione d’ascolto ancora da eseguire. I suoni specifici degli strumenti FORMA/P e PRISMA rimangono invariati.

## Verifica prima di dichiarare i suoni pronti

Provare note brevi/lunghe, accordi, tre livelli di velocity, wheel/pressure, registri basso/medio/alto, asciutto/effettato e stereo/mono. Registrare le uscite del Virus e confrontare a livello percepito equivalente. Controllare picchi, code e polifonia.

Le analisi qui raccolte descrivono i dati dei preset: non è stato svolto un confronto d’ascolto. Le statistiche dei primi rapporti descrivono gli starter prima delle revisioni 2/3. La programmazione aggiornata è documentata in [Directions](../original-sound-bank.md); resta da calibrare all’ascolto.

## Materiali e perimetro

I rapporti e le schede sono documentazione di sviluppo; non vengono caricati dal motore dell’app. I file MIDI originali, i dump SysEx e gli inventari completi restano nell’area locale ignorata `.local/quantum-analysis/` e `.local/metropolis-analysis/`. I banchi commerciali non sono inclusi negli asset dell’app.

Nomi di preset e modelli nei rapporti identificano i riferimenti studiati. Per i nostri strumenti restano nomi originali e descrizioni tecniche veritiere.

I banchi di riferimento possono essere conservati e richiamati tramite il nuovo [archivio PATCH](../patch-bank-library.md).
