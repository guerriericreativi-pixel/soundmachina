# Archivio banchi MIDI · VIRUS-H PATCH

## Uso

In **BANCHI → I miei banchi**, importa uno o più file `.mid`, `.midi` o `.syx`.
Ogni file diventa una raccolta separata. L’elenco mostra nome e numero di voci;
la ricerca comune filtra sia il nome del banco sia i nomi delle patch al suo interno.
Seleziona una raccolta e premi **Carica → Single/Pn** su una patch per richiamarla
nel buffer di lavoro corrente. L’operazione non scrive nella RAM permanente del
Virus. Importare, cercare, sfogliare ed esportare non invia MIDI.

Il file originale è conservato integralmente e può essere scaricato con
**Scarica originale**. Ogni patch può essere esportata anche come `.mid` individuale.
I titoli e separatori di un banco restano presenti: il numero di voci non equivale
necessariamente al numero di preset musicali.

## Persistenza e backup

L’archivio usa IndexedDB, database `virusH_patch_banks`, versione 1, store `banks`.
È locale al browser/profilo e all’origine (protocollo, host e porta): localhost,
sito pubblico e plugin non condividono automaticamente lo stesso archivio.

**Backup banchi** esporta un JSON portabile dei file originali. **Ripristina banchi**
ricostruisce le patch dai file e unisce i banchi senza sostituire quelli già presenti.
Il backup generale PATCH include ora anche `bankArchive`, con versione contenitore 2;
i vecchi backup senza tale campo continuano a essere accettati. Backup Studio
rimane il backup specifico di varianti e preferiti dello Studio.

L’identità del banco è SHA-256 del file completo: lo stesso file non viene duplicato
neppure se rinominato. Patch omonime nello stesso banco o in banchi diversi restano
indipendenti perché non sono archiviate per nome. I salvataggi precedenti della
libreria Suoni e le varianti Studio non vengono migrati né sovrascritti.

## Validazione

L’importazione usa il parser SMF/SysEx condiviso, accetta Single Dump Virus da
267 o 524 byte e verifica byte MIDI, checksum finale e checksum intermedio TI.
Tutti i file del gruppo sono analizzati prima di scrivere; il salvataggio avviene
in una transazione IndexedDB. Un file corrotto non produce un import parziale.
Limiti: 8 MB per file, 4096 patch per file, 64 MB per backup letto dall’interfaccia.
File di sole note MIDI non sono banchi timbrici e vengono segnalati.

## Dati caricati nella sessione del 15 ottobre 2026

Sull’origine locale `http://127.0.0.1:8771` sono stati archiviati cinque banchi:
QUANTUM (39 voci), METROPOLIS (128), Dream State demo (9), Thrillogy-1 demo (16),
Revolution Vol.2 demo (10). Totale: 202 dump, inclusi titoli e separatori.

Revolution è stato raccolto in un unico Standard MIDI File a partire dai dieci
file del teaser ufficiale, senza cambiare i dump legacy. Archivio ZIP e provenienza
restano in `.local/reference-banks/`. I due banchi forniti dall’utente sono stati
importati dai rispettivi file sul volume INTENSO. Nessuno di questi banchi viene
incluso nel codice o negli asset pubblici distribuiti.

Un backup dei cinque banchi è stato scaricato durante la verifica dell’interfaccia.
Nessun pulsante di caricamento nel Virus è stato premuto durante questa verifica.

## Implementazione e verifica

- `patch-bank-library.js`: parser validato, modello, persistenza e interfaccia.
- `patch-bank-library.css`: elenco raccolte e patch, adattamento ai viewport stretti.
- `index.html`: sorgente PATCH, importazione comune, destinazione MIDI e backup generale.
- Build landing e sincronizzazione risorse plugin includono entrambi i nuovi file.
- Test: collisioni di nomi, file originali, reimportazione, checksum, import atomico,
  backup/ripristino, legacy, navigazione senza invii e caricamento esplicito.
- Verifica nel browser: due banchi conservati dopo navigazione/ricaricamento,
  cinque banchi importati nell’origine utente, backup reale contenente 202 dump.

## Copertine personalizzate

Seleziona un banco e premi **Carica copertina**. Sono accettati PNG, JPG e WebP
entro 8 MB (massimo 40 megapixel). L’immagine viene ridimensionata localmente a
1024 pixel sul lato maggiore, mantenendo le proporzioni, e salvata con il banco.
La miniatura compare nell’elenco e l’immagine completa nel dettaglio. Puoi usare
**Cambia copertina** o **Rimuovi copertina** senza modificare il file MIDI.

Le copertine fanno parte di Backup banchi e del backup generale PATCH. La versione
1 del formato rimane compatibile: il campo opzionale `cover` contiene una data URL
raster validata. Un ripristino può completare una copertina mancante di un banco
già presente, ma conserva una personalizzazione già esistente. Reimportare lo
stesso MIDI non cancella la copertina. Tutta l’elaborazione avviene nel browser.

## Spazio di lavoro e materiale PATCH

L’elenco dei banchi usa lo spazio sotto le destinazioni P1–P4. Compare soltanto
quando è selezionata la sorgente **I miei banchi**; l’area centrale rimane dedicata
alla copertina e alle patch del banco. Su schermi stretti l’elenco si dispone su
due colonne con scorrimento limitato. Selezione, ricerca e copertine usano lo stesso
archivio e gli stessi controlli, senza duplicare le raccolte.

La scocca PATCH mantiene i bordi piegati, con illuminazione più bassa e diffusa:
gradiente ampio sul metallo satinato, riflessi laterali attenuati e ombre contenute.
La modifica è limitata a PATCH e non altera l’illuminazione degli altri strumenti.
