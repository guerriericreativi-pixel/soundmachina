<?php if (!defined('VIRUS_ENTRY')) { http_response_code(404); exit; } ?>
<!doctype html>
<html lang="it" data-theme="snow">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIRUS-H — Più spazio al suono.</title>
<meta name="description" content="Il controllo del tuo Access Virus TI, nel browser. Esplora le patch, costruisci setup a quattro parti e lavora sul suono. Accesso su invito.">
<meta name="theme-color" content="#e9e9e3">
<link rel="icon" href="assets/icons/lucide/audio-waveform.svg" type="image/svg+xml">
<link rel="stylesheet" href="landing.css?v=4">
<script src="landing.js?v=3" defer></script>
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
    <div class="feature-layout">
      <div class="feature-selector" role="tablist" aria-label="Esplora gli strumenti">
        <button role="tab" id="feature-panel" aria-selected="true" aria-controls="featureDisplay" tabindex="0" data-feature="panel"><span class="feature-index">01</span><span><strong>Ritrova il controllo.</strong><small>PANEL / SINGLE / FX RACK</small></span><img src="assets/landing/arrow-up-right.svg" alt="" width="22" height="22"></button>
        <button role="tab" id="feature-patch" aria-selected="false" aria-controls="featureDisplay" tabindex="-1" data-feature="patch"><span class="feature-index">02</span><span><strong>Dai un posto alle idee.</strong><small>PATCH / LIBRERIA</small></span><img src="assets/landing/arrow-up-right.svg" alt="" width="22" height="22"></button>
        <button role="tab" id="feature-multi" aria-selected="false" aria-controls="featureDisplay" tabindex="-1" data-feature="multi"><span class="feature-index">03</span><span><strong>Fai suonare le parti.</strong><small>MULTI / ARP / SEQ</small></span><img src="assets/landing/arrow-up-right.svg" alt="" width="22" height="22"></button>
      </div>
      <div class="feature-display" id="featureDisplay" role="tabpanel" aria-labelledby="feature-panel"><figure><img id="featureImage" src="assets/landing/detail-panel-snow.webp" alt="Pannello di controllo VIRUS-H" loading="lazy" width="1280" height="720"></figure><div class="feature-caption"><span id="featureKicker">IL GESTO, PRIMA DEL MENU</span><p id="featureCopy">Manopole, filtri, inviluppi ed effetti in viste dedicate. Parti dal pannello, entra nel suono e regola ciò che ti serve.</p></div></div>
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
