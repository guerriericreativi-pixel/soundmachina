<?php if (!defined('VIRUS_ENTRY')) { http_response_code(404); exit; } ?>
<!doctype html>
<html lang="it" data-theme="snow">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIRUS-H — Più spazio al suono.</title>
<meta name="description" content="Il controllo del tuo Access Virus TI, nel browser. Esplora le patch, costruisci setup a quattro parti e lavora sul suono. Accesso su invito.">
<meta name="theme-color" content="#e9e9e3">
<link rel="icon" href="assets/icons/lucide/audio-waveform.svg" type="image/svg+xml">
<link rel="stylesheet" href="landing.css?v=5">
<link rel="stylesheet" href="landing-carousel.css?v=2">
<script src="landing.js?v=4" defer></script>
<script src="landing-carousel.js?v=1" defer></script>
</head>
<body>
<a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="masthead wrap">
  <a class="wordmark" href="./" aria-label="VIRUS-H, pagina iniziale">VIRUS-H</a>
  <span class="brand-description">Editor MIDI per Virus TI</span>
  <nav aria-label="Navigazione principale"><a href="#perche">Perché</a><a href="#strumenti">Cosa</a><a href="#come">Come</a></nav>
  <div class="theme-switch" role="group" aria-label="Scegli l’ambiente"><button type="button" data-theme-choice="snow" aria-pressed="true">Snow</button><button type="button" data-theme-choice="dark" aria-pressed="false">Dark</button></div>
</header>
<main id="contenuto">
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap">
    <div class="hero-intro"><p class="eyebrow">Due anime. Un solo studio.</p><h1 id="hero-title">Più spazio<br class="compact-break"> al suono.</h1><p class="hero-subtitle">Il controllo del tuo Virus,<br class="compact-break"> finalmente a portata di mano.</p></div>
    <div class="hero-stage">
      <figure class="instrument"><img id="heroInstrument" src="assets/landing/hero-snow-transparent.png" alt="Access Virus TI Snow, scocca chiara e display azzurro" width="1600" height="1000" fetchpriority="high"><figcaption><span class="status-dot" aria-hidden="true"></span><span id="instrumentCaption">VIRUS TI SNOW</span><span>Hardware. In primo piano.</span></figcaption></figure>
      <aside class="invite" id="accesso" aria-labelledby="invite-title">
        <p class="eyebrow">Il tuo accesso allo studio</p>
        <h2 id="invite-title">Entra nel<br> tuo studio.</h2>
        <?php if (vh_authenticated()): ?>
          <p class="invite-copy">Il tuo invito è attivo.<br>È il momento di fare suono.</p>
          <a class="primary-button" href="app.php">Apri VIRUS-H <img src="assets/landing/arrow-right.svg" alt="" width="22" height="22"></a>
          <form method="post" action="index.php" class="logout-form"><input type="hidden" name="csrf" value="<?= vh_escape(vh_csrf()) ?>"><input type="hidden" name="action" value="logout"><button type="submit" class="text-button">Esci da questo dispositivo</button></form>
        <?php else: ?>
          <form method="post" action="index.php#accesso" id="inviteForm">
            <input type="hidden" name="csrf" value="<?= vh_escape(vh_csrf()) ?>">
            <label for="inviteCode">Codice invito</label>
            <div class="code-field"><input id="inviteCode" name="invite_code" type="password" placeholder="Inserisci il tuo codice" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="128" required <?= $error ? 'aria-invalid="true" aria-describedby="inviteError"' : '' ?>><button type="button" class="show-code" id="showCode" aria-label="Mostra codice invito" aria-pressed="false"><img src="assets/landing/eye.svg" alt="" width="20" height="20"></button></div>
            <?php if ($error): ?><p id="inviteError" class="form-error" role="alert"><?= vh_escape($error) ?></p><?php endif; ?>
            <button class="primary-button" type="submit">Accedi a VIRUS-H <img src="assets/landing/arrow-right.svg" alt="" width="22" height="22"></button>
            <p class="invite-note">Un codice. Nessun account da creare.</p>
          </form>
          <p class="invite-footnote">Hai ricevuto un invito? Usa il codice che ti è stato condiviso.</p>
        <?php endif; ?>
      </aside>
    </div>
    <div class="hero-bottom"><span>Per Virus TI Snow e TI2 Desktop</span><a href="#perche">Scopri cosa cambia nel tuo studio <img src="assets/landing/arrow-down.svg" alt="" width="18" height="18"></a></div>
    </div>
  </section>
  <section class="why section wrap" id="perche" aria-labelledby="why-title">
    <div class="section-label"><span>01 / PERCHÉ</span><span>Il suono resta al centro.</span></div>
    <div class="why-body"><h2 id="why-title">Meno menu.<br>Più <em>intuizione.</em></h2><div class="editorial-copy"><p class="lead">Il Virus ha molto da dire.<br>Non lasciare che siano i menu a decidere quanto.</p><p>Quando un’idea arriva, vuoi seguirla. Non cercare un parametro, ricordare il nome di una patch o ricostruire da zero un setup.</p><p>VIRUS-H porta davanti a te controlli, suoni e parti del tuo sintetizzatore. Una vista più ampia per passare dall’idea alla regolazione, e dalla regolazione alla musica.</p><p class="statement">Il carattere è del tuo Virus.<br>Lo spazio per lavorarci è qui.</p></div></div>
  </section>
  <section class="tools section" id="strumenti" aria-labelledby="tools-title">
    <div class="wrap"><div class="section-label"><span>02 / COSA</span><span>Uno strumento intorno al tuo strumento.</span></div>
    <div class="section-heading"><h2 id="tools-title">Il tuo suono.<br>Da ogni lato.</h2><p>Un ambiente per modellare il suono, organizzare le patch e mettere insieme le parti. Sempre in dialogo con l’hardware.</p></div>
    <div class="instrument-carousel" role="region" aria-roledescription="carosello" aria-label="Gli strumenti di VIRUS-H">
      <div class="carousel-toolbar">
        <div class="carousel-tabs" role="tablist" aria-label="Scegli uno strumento">
          <button type="button" role="tab" id="feature-panel" aria-selected="true" aria-controls="slide-panel" tabindex="0" data-feature="panel">PANEL</button>
          <button type="button" role="tab" id="feature-single" aria-selected="false" aria-controls="slide-single" tabindex="-1" data-feature="single">SINGLE</button>
          <button type="button" role="tab" id="feature-multi" aria-selected="false" aria-controls="slide-multi" tabindex="-1" data-feature="multi">MULTI</button>
          <button type="button" role="tab" id="feature-fx-rack" aria-selected="false" aria-controls="slide-fx-rack" tabindex="-1" data-feature="fx-rack">FX RACK</button>
          <button type="button" role="tab" id="feature-patch" aria-selected="false" aria-controls="slide-patch" tabindex="-1" data-feature="patch">PATCH</button>
          <button type="button" role="tab" id="feature-arp" aria-selected="false" aria-controls="slide-arp" tabindex="-1" data-feature="arp">ARP</button>
          <button type="button" role="tab" id="feature-seq" aria-selected="false" aria-controls="slide-seq" tabindex="-1" data-feature="seq">SEQ</button>
          <button type="button" role="tab" id="feature-song" aria-selected="false" aria-controls="slide-song" tabindex="-1" data-feature="song">SONG</button>
        </div>
        <div class="carousel-arrows"><button type="button" id="featurePrevious" aria-label="Strumento precedente" aria-controls="featureTrack" disabled>←</button><button type="button" id="featureNext" aria-label="Strumento successivo" aria-controls="featureTrack">→</button></div>
      </div>
      <div class="carousel-track" id="featureTrack">
        <article class="carousel-slide" id="slide-panel" role="tabpanel" aria-labelledby="feature-panel" aria-hidden="false" tabindex="0">
          <figure class="carousel-screen"><img src="assets/landing/feature-panel-snow.webp" data-feature-image="panel" alt="PANEL: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">01 / PANEL</p><h3>Il Virus, davanti a te.</h3></div><div><p>Ritrova il frontale del tuo sintetizzatore: display, manopole e pulsanti in dialogo con l’hardware.</p><p class="carousel-details">Controllo diretto · Snow e TI2 Desktop</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-single" role="tabpanel" aria-labelledby="feature-single" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-single-snow.webp" data-feature-image="single" alt="SINGLE: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">02 / SINGLE</p><h3>Entra nel suono.</h3></div><div><p>Scegli la parte e lavora su oscillatori, filtri, inviluppi e modulazioni. Display e manopole seguono la pagina che stai modificando.</p><p class="carousel-details">P1–P4 · Oscillatori · Filtri · Inviluppi</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-multi" role="tabpanel" aria-labelledby="feature-multi" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-multi-snow.webp" data-feature-image="multi" alt="MULTI: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">03 / MULTI</p><h3>Quattro parti. Un’idea.</h3></div><div><p>Assegna i suoni alle quattro parti e regola livelli, panorama e canali MIDI. Passa da un layer a quattro strumenti indipendenti.</p><p class="carousel-details">4 parti · Mixer · Routing MIDI</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-fx-rack" role="tabpanel" aria-labelledby="feature-fx-rack" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-fx-rack-snow.webp" data-feature-image="fx-rack" alt="FX RACK: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">04 / FX RACK</p><h3>Dai spazio al carattere.</h3></div><div><p>Delay, riverbero, saturazione e chorus in un rack dedicato. Seleziona la parte e usa le macro per raggiungere i controlli principali.</p><p class="carousel-details">Effetti per parte · Macro · Pad X/Y</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-patch" role="tabpanel" aria-labelledby="feature-patch" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-patch-snow.webp" data-feature-image="patch" alt="PATCH: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">05 / PATCH</p><h3>Dai un posto alle idee.</h3></div><div><p>Cerca nelle patch, importa i tuoi file .syx e .mid e scegli la parte in cui caricare il suono. Conserva suoni e Multi nella libreria locale.</p><p class="carousel-details">Libreria · Importazione · Backup</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-arp" role="tabpanel" aria-labelledby="feature-arp" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-arp-snow.webp" data-feature-image="arp" alt="ARP: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">06 / ARP</p><h3>Trasforma le note in movimento.</h3></div><div><p>Scegli la parte di destinazione, imposta ritmo, ottave e swing. Attiva gli step e usa Hold per mantenere l’arpeggio.</p><p class="carousel-details">16 step · Pattern · Hold</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-seq" role="tabpanel" aria-labelledby="feature-seq" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-seq-snow.webp" data-feature-image="seq" alt="SEQ: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">07 / SEQ</p><h3>Costruisci il tuo prossimo giro.</h3></div><div><p>Una traccia per parte, fino a 64 step. Modifica note, gate e accenti, poi salva i pattern da richiamare nel tuo studio.</p><p class="carousel-details">4 tracce · 64 step · Pattern</p></div></div>
        </article>
        <article class="carousel-slide" id="slide-song" role="tabpanel" aria-labelledby="feature-song" aria-hidden="true" tabindex="-1">
          <figure class="carousel-screen"><img src="assets/landing/feature-song-snow.webp" data-feature-image="song" alt="SONG: schermata dell’editor VIRUS-H" loading="lazy" width="1280" height="900"></figure>
          <div class="carousel-copy"><div><p class="eyebrow">08 / SONG</p><h3>Metti in ordine il brano.</h3></div><div><p>Collega i pattern salvati in SEQ. Per ogni passaggio scegli ripetizioni e trasposizione, poi ascolta la sequenza o ripetila in loop.</p><p class="carousel-details">Catena di pattern · Ripetizioni · Trasposizione</p></div></div>
        </article>
      </div>
      <div class="carousel-footer"><p id="featureStatus" role="status" aria-live="polite" aria-atomic="true">01 / 08 · PANEL</p><span>Schermate reali di VIRUS-H</span></div>
    </div></div>
  </section>
  <section class="how section wrap" id="come" aria-labelledby="how-title"><div class="section-label"><span>03 / COME</span><span>Dal collegamento al primo suono.</span></div><div class="section-heading"><h2 id="how-title">Il tuo studio.<br>In tre passaggi.</h2><p>VIRUS-H è un editor MIDI: il suono nasce nel tuo sintetizzatore. L’interfaccia ti aiuta a guidarlo.</p></div>
    <ol class="steps"><li><span class="step-number">01</span><h3>Collega il Virus.</h3><p>Collega il sintetizzatore al computer tramite MIDI. Per ascoltarlo, usa le sue uscite audio o la tua interfaccia.</p></li><li><span class="step-number">02</span><h3>Apri il tuo studio.</h3><p>Inserisci il codice invito, consenti l’accesso MIDI nel browser e scegli le porte di ingresso e uscita.</p></li><li><span class="step-number">03</span><h3>Segui l’idea.</h3><p>Esplora i controlli, carica una patch nella parte scelta o costruisci un setup a quattro parti.</p></li></ol>
    <details class="requirements"><summary>Di cosa hai bisogno?</summary><div><p>Un <strong>Access Virus TI Snow o TI2 Desktop</strong>, un computer e un collegamento MIDI compatibile con SysEx.</p><p>Usa <strong>Chrome o Edge su desktop</strong> con accesso Web MIDI. Il browser deve autorizzare MIDI e SysEx. La landing è consultabile anche su tablet; per l’editor verifica il supporto MIDI del dispositivo.</p><p>L’audio non passa automaticamente dalla pagina: ascolta le uscite del Virus tramite cuffie, monitor o interfaccia audio.</p></div></details>
  </section>
  <section class="closing wrap"><p class="eyebrow">Snow o Dark. Il suono è tuo.</p><h2>La prossima idea<br>merita spazio.</h2><a class="primary-button" href="#accesso">Entra nel tuo studio <img src="assets/landing/arrow-right.svg" alt="" width="22" height="22"></a></section>
</main>
<footer class="footer wrap"><a class="wordmark" href="./">VIRUS-H</a><p>Un progetto indipendente di Guerrieri Creativi.<br>Non affiliato ad Access Music. I marchi appartengono ai rispettivi titolari.</p><a href="assets/landing/credits.html">Crediti</a><a href="#accesso">Accesso su invito</a></footer>
</body></html>
