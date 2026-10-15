# Accesso amministratore e utenti · VIRUS-H

## Comportamento

Lo stesso campo **Codice di accesso** accetta due credenziali indipendenti:

- Codice utente: sessione di 12 ore; consultazione del catalogo e caricamento dei
  suoni sul proprio Virus. Inserimento di patch/banchi, ripristino, salvataggio di
  nuove varianti e modifica delle copertine sono riservati all’amministratore.
- Codice amministratore: gestione abilitata; sessione persistente fino a 30 giorni.
  Dopo il primo ingresso non occorre reinserire il codice a ogni visita. Uscire
  esplicitamente o cambiare il codice invalida l’accesso.

Non si riconosce un amministratore dal nome, da un parametro URL o da un flag
localStorage. Sul sito il ruolo deriva solo dalla sessione PHP e dall’hash del
codice verificato dal server. La prima autenticazione è necessaria; il normale
cookie di sessione HttpOnly/SameSite conserva l’accesso e usa Secure su HTTPS.

La sola anteprima sul computer del proprietario (`localhost`, `127.0.0.1` e
risorse native `file:`) rimane amministratore locale senza codice. Se PHP fornisce
una sessione, questa prevale anche su localhost: un login utente nel server di
anteprima rimane utente, senza eccezioni per l’indirizzo locale.

## Codice amministratore creato

Il codice è salvato nel file locale privato `.local/invite/admin-code.txt`.
L’hash si trova accanto, in `.local/invite/config.php`, chiave `admin_hash`.
L’invito utente esistente è stato conservato. Il segreto in chiaro non è incluso
nel repository, negli asset web, nel catalogo o nei log.

Per creare un amministratore su un’altra installazione, usare una copia privata
della configurazione già esistente:

```sh
php tools/landing/create-admin.php PRIVATE_INVITATION_DIRECTORY
```

Lo script rifiuta di sostituire un amministratore già configurato e mantiene
l’hash del codice utente. Non rigenerare gli inviti per aggiungere un amministratore.
Sono supportate anche le variabili server `VIRUS_ADMIN_HASH` e `VIRUS_INVITE_HASH`.

## Catalogo condiviso e autorità sul server

`banks.php` espone il catalogo agli utenti autenticati. Le scritture richiedono
sia ruolo amministratore sia token CSRF della stessa sessione:

- GET: consultazione del catalogo, per entrambi i ruoli.
- POST merge: inserimento di banchi e ripristino; solo amministratore.
- POST cover: sostituzione/rimozione copertina; solo amministratore.

Il server verifica autonomamente formato SMF/SysEx, byte, checksum Virus, limiti
e formato delle immagini. Ricalcola SHA-256 del file e ignora un eventuale ID
fornito dal client. Un gruppo con un banco invalido non viene scritto in parte.
Il catalogo usa un lock separato e scrittura su file temporaneo con sostituzione
atomica. È conservato in `.access/banks/catalogue.json`, protetto dalle regole
Apache/router. Il percorso può essere configurato con `bank_dir` nel file privato.

Il client remoto non usa IndexedDB come fonte del catalogo pubblicato: legge e
scrive tramite l’endpoint autenticato. Nascondere un pulsante o alterare il ruolo
nel browser non concede il diritto di scrivere sul server. Le librerie locali
precedenti rimangono sul dispositivo; il loro contenuto non viene pubblicato
implicitamente. I cinque banchi attuali sono stati copiati nel solo catalogo del
server locale di verifica, incluse le copertine presenti nel backup corrente.

## Stato e verifica del 15 ottobre 2026

- Accesso locale originale: `http://127.0.0.1:8771`, amministratore del proprietario.
- Anteprima con PHP e autenticazione reale: `http://127.0.0.1:8775/`.
- Verificati nel browser sia codice utente sia codice amministratore con cinque banchi.
- Test HTTP: anonimo 401; utente autenticato POST 403; amministratore senza CSRF 403;
  amministratore con token valido può inserire; checksum corrotto 422; logout revoca.
- I controlli di salvataggio, importazione e ripristino sono bloccati anche nei
  relativi modelli/gestori client. Navigazione, performance e caricamento nel buffer
  MIDI rimangono disponibili agli utenti.

## Pubblicazione verificata · 16 ottobre 2026

Pubblicata la versione `d27fb96114f4915fb383821e94e1c27bca777571` su
https://tools.guerriericreativi.it/tools/virus-ti-snow/.

La configurazione privata esistente è stata salvata in una copia di sicurezza
nella directory protetta `.access`, poi aggiornata aggiungendo solo `admin_hash`.
Il codice utente e gli altri valori della configurazione sono stati conservati.
Lo script temporaneo di migrazione si è rimosso dopo l’esecuzione (404 verificato).
Nessun banco di riferimento privato è stato trasferito al catalogo pubblico.

Verifiche HTTP di produzione:

- Codice amministratore accettato e ruolo `admin` nella sessione dell’editor.
- Codice utente precedente accettato e ruolo `user`.
- Catalogo leggibile da entrambi; scritture utente e scritture amministratore
  prive di CSRF respinte con 403.
- Catalogo anonimo 401; editor anonimo reindirizzato all’accesso.
- Cookie HTTPS Secure/HttpOnly e logout verificati per entrambi i ruoli.
- Percorsi privati e PHP interni 403; hash dei nuovi script pubblicati verificati.

Le librerie locali rimangono sul dispositivo. Per i rilasci successivi conservare
`.access/config.php` e `.access/banks/`, senza sovrascriverli con build locali.
