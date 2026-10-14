(function (root) {
  'use strict';
  const labels = ['Canali', 'Suoni', 'Bilanciamento', 'Salva'];
  const clamp = value => Math.max(0, Math.min(127, Number(value) || 0));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

  function createDraft(parts) {
    return {
      name: '', routing: 'split',
      parts: Array.from({length: 4}, (_, index) => {
        const part = parts[index] || {};
        return { source: 'keep', name: part.name || 'Da leggere dal Virus', role: part.role || ['Basso', 'Accordi', 'Melodia', 'Arpeggio'][index],
          bank: part.values?.bank ?? 0, program: part.values?.program ?? 0,
          volume: clamp(part.values?.volume ?? 96), pan: clamp(part.values?.pan ?? 64) };
      })
    };
  }

  function validateDraft(draft, bankCount) {
    if (!draft.name.trim() || draft.name.trim().length > 64) return 'Inserisci un nome per il setup (massimo 64 caratteri).';
    if (!['split', 'layer'].includes(draft.routing) || draft.parts.length !== 4) return 'Scegli un routing per tutte le quattro parti.';
    for (let index = 0; index < 4; index++) {
      const p = draft.parts[index];
      if (!['keep', 'bank'].includes(p.source)) return `Scegli la sorgente di P${index + 1}.`;
      if (p.source === 'bank' && (!Number.isInteger(p.bank) || p.bank < 0 || p.bank >= bankCount || !Number.isInteger(p.program) || p.program < 0 || p.program > 127)) return `Scegli banco e suono validi per P${index + 1}.`;
      if (![p.volume, p.pan].every(v => Number.isInteger(v) && v >= 0 && v <= 127)) return `Controlla volume e panorama di P${index + 1}.`;
    }
    return '';
  }

  function create(deps) {
    const dialog = document.createElement('dialog');
    dialog.className = 'multi-setup-dialog';
    dialog.lang = 'it';
    dialog.setAttribute('aria-labelledby', 'multiSetupTitle');
    document.body.appendChild(dialog);
    let draft = null, step = 0, busy = false, complete = false, error = '', previousFocus = null;
    function close() {
      if (busy) return;
      dialog.close();
      previousFocus?.focus();
    }
    function open() {
      if (!draft || complete) { draft = createDraft(deps.parts()); step = 0; complete = false; error = ''; }
      previousFocus = document.activeElement;
      render();
      if (!dialog.open) dialog.showModal();
      dialog.querySelector('#msName, .ms-body input, .ms-body select, [data-ms-next]')?.focus();
    }
    const destination = index => draft.routing === 'layer' ? 'CH 1 · insieme' : `CH ${index + 1}`;
    function soundName(part) {
      return part.source === 'keep' ? `Attuale: ${part.name}` : `${deps.banks[part.bank]} · ${part.program + 1} · ${deps.patchName(part.bank, part.program) || 'Nome da leggere'}`;
    }
    function render() {
      const connected = deps.connected();
      let body = '';
      if (complete) {
        body = `<div class="ms-success"><strong>Setup salvato: ${escape(draft.name)}</strong><p>Le quattro parti sono state lette dal Virus e salvate in PATCH → Multi.</p><p>Per conservarne una copia su file, usa Archivio → Esporta backup.</p></div>`;
      } else if (step === 0) {
        body = `<label class="ms-field">Nome del setup<input id="msName" maxlength="64" placeholder="Es. Concerto — basso, pad, melodia, arpeggio" value="${escape(draft.name)}"></label>
          <h3>Come vuoi suonare le quattro parti?</h3><div class="ms-routing">
          <label><input type="radio" name="msRouting" value="split" ${draft.routing === 'split' ? 'checked' : ''}><span><strong>4 canali indipendenti</strong><small>P1–P4 su CH 1–4. Per sequenze e tracce separate.</small></span></label>
          <label><input type="radio" name="msRouting" value="layer" ${draft.routing === 'layer' ? 'checked' : ''}><span><strong>Suoni sovrapposti</strong><small>Tutte su CH 1. Quattro timbri insieme dalla tastiera.</small></span></label></div>
          <p class="ms-note">Parti dai suoni attuali. Nessun comando viene inviato al Virus durante questi passaggi.</p>`;
      } else if (step === 1) {
        body = `<p class="ms-note">Mantieni i suoni attuali oppure scegli banco e numero. I nomi non ancora letti verranno confermati dal Virus al salvataggio.</p><div class="ms-parts">${draft.parts.map((p, i) => `<section class="ms-part"><div class="ms-part-head"><strong>P${i + 1}</strong><span>${destination(i)}</span></div>
          <label class="ms-field">Ruolo<input data-ms-role="${i}" aria-label="Ruolo P${i + 1}" maxlength="24" value="${escape(p.role)}"></label>
          <label class="ms-field">Suono<select data-ms-source="${i}" aria-label="Sorgente suono P${i + 1}"><option value="keep" ${p.source === 'keep' ? 'selected' : ''}>Mantieni il suono attuale</option><option value="bank" ${p.source === 'bank' ? 'selected' : ''}>Scegli dal banco</option></select></label>
          <div class="ms-bank-fields" ${p.source === 'keep' ? 'hidden' : ''}><label class="ms-field">Banco<select data-ms-bank="${i}" aria-label="Banco P${i + 1}">${deps.banks.map((name, b) => `<option value="${b}" ${b === p.bank ? 'selected' : ''}>${escape(name)}</option>`).join('')}</select></label>
          <label class="ms-field">Suono<select data-ms-program="${i}" aria-label="Suono P${i + 1}">${Array.from({length:128}, (_, n) => `<option value="${n}" ${n === p.program ? 'selected' : ''}>${n + 1} · ${escape(deps.patchName(p.bank, n) || 'Nome da leggere')}</option>`).join('')}</select></label></div>
          <p class="ms-note">${escape(soundName(p))}</p></section>`).join('')}</div>`;
      } else if (step === 2) {
        body = `<p class="ms-note">Imposta i livelli iniziali. Potrai ascoltare e rifinire il mix nella vista MULTI dopo aver applicato il setup.</p><div class="ms-parts">${draft.parts.map((p, i) => `<section class="ms-part"><div class="ms-part-head"><strong>P${i + 1} · ${escape(p.role)}</strong><span>${destination(i)}</span></div>
          <label class="ms-field">Volume <output id="msVolume${i}">${p.volume}</output><input type="range" min="0" max="127" value="${p.volume}" data-ms-volume="${i}" aria-label="Volume P${i + 1}"></label>
</section>`).join('')}</div>`;
      } else {
        body = `<div class="ms-summary-title"><strong>${escape(draft.name)}</strong><span>${draft.routing === 'layer' ? 'Suoni sovrapposti · CH 1' : '4 parti · CH 1–4'}</span></div><div class="ms-table-wrap"><table><thead><tr><th>Parte</th><th>Suono</th><th>Canale</th><th>Volume</th></tr></thead><tbody>${draft.parts.map((p, i) => `<tr><th>P${i + 1}<small>${escape(p.role)}</small></th><td>${escape(soundName(p))}</td><td>${destination(i)}</td><td>${p.volume}</td></tr>`).join('')}</tbody></table></div>
          <p class="ms-note">Applica alla sessione attuale del Virus: modalità Multi, quattro parti attive, uscita principale L/R e intera estensione della tastiera. La copia viene salvata nella libreria di questo browser; nessun preset viene sovrascritto nella memoria del synth.</p>
          ${!connected ? '<div class="ms-connection">Collega MIDI IN e OUT del Virus per applicare e leggere tutte le parti. <button type="button" data-ms-midi>Configura MIDI</button><button type="button" data-ms-refresh>Ricontrolla connessione</button></div>' : ''}`;
      }
      dialog.innerHTML = `<header class="ms-header"><div><span class="ms-eyebrow">VIRUS-H / MULTI</span><h2 id="multiSetupTitle">Nuovo setup a 4 parti</h2></div><button type="button" data-ms-close aria-label="Chiudi il setup" ${busy ? 'disabled' : ''}>×</button></header>
        <ol class="ms-steps">${labels.map((label, i) => `<li ${i === step ? 'aria-current="step"' : ''}><span>${i + 1}</span>${label}</li>`).join('')}</ol>
        <div class="ms-body">${body}<p class="ms-error" role="alert">${escape(error)}</p><p class="ms-progress" role="status" aria-live="polite">${busy ? 'Configurazione del Virus e lettura delle parti…' : ''}</p></div>
        <footer class="ms-footer"><span>${complete ? 'Salvato nella libreria locale' : `Passaggio ${step + 1} di 4 · ${connected ? 'MIDI IN / OUT disponibili' : 'Bozza — MIDI non connesso'}`}</span><div>
        ${!complete && step > 0 ? `<button type="button" data-ms-back ${busy ? 'disabled' : ''}>Indietro</button>` : ''}
        <button type="button" class="ms-primary" data-ms-next ${busy || (!complete && step === 3 && !connected) ? 'disabled' : ''}>${complete ? 'Apri PATCH → Multi' : step === 3 ? 'Applica e salva setup' : 'Continua'}</button></div></footer>`;
      dialog.querySelector('[data-ms-close]').onclick = close;
      dialog.querySelector('[data-ms-back]')?.addEventListener('click', () => { step--; error = ''; render(); });
      dialog.querySelector('[data-ms-next]').onclick = async () => {
        if (complete) { close(); deps.openLibrary(); return; }
        error = validateDraft(draft, deps.banks.length);
        if (error) { render(); return; }
        if (step < 3) { step++; render(); dialog.querySelector('.ms-body input, .ms-body select, [data-ms-next]')?.focus(); return; }
        if (deps.exists(draft.name.trim())) { error = 'Questo nome è già nella libreria. Torna al primo passaggio e scegli un altro nome.'; render(); return; }
        busy = true; render();
        try {
          await deps.apply(draft, message => { const status = dialog.querySelector('.ms-progress'); if (status) status.textContent = message; });
          busy = false; complete = true; render(); dialog.querySelector('[data-ms-next]').focus();
        } catch (err) { busy = false; error = `${err.message} Il setup non è stato salvato. Le modifiche già inviate possono essere attive sul Virus.`; render(); }
      };
      dialog.querySelector('#msName')?.addEventListener('input', e => { draft.name = e.target.value; });
      dialog.querySelectorAll('[name="msRouting"]').forEach(el => el.onchange = () => { draft.routing = el.value; });
      dialog.querySelectorAll('[data-ms-role]').forEach(el => el.oninput = () => { draft.parts[Number(el.dataset.msRole)].role = el.value; });
      for (const [field, key] of [['source','msSource'], ['bank','msBank'], ['program','msProgram']]) {
        dialog.querySelectorAll(`[data-ms-${field}]`).forEach(el => el.onchange = () => {
          draft.parts[Number(el.dataset[key])][field] = field === 'source' ? el.value : Number(el.value);
          render(); dialog.querySelector(`[data-ms-${field}="${el.dataset[key]}"]`)?.focus();
        });
      }
      for (const field of ['volume','pan']) {
        const key = field === 'volume' ? 'msVolume' : 'msPan';
        dialog.querySelectorAll(`[data-ms-${field}]`).forEach(el => el.oninput = () => {
          const i = Number(el.dataset[key]), value = Number(el.value); draft.parts[i][field] = value;
          dialog.querySelector(`#${key}${i}`).textContent = field === 'volume' ? value : value === 64 ? 'Centro' : value < 64 ? 'L' + (64-value) : 'R' + (value-64);
        });
      }
      dialog.querySelector('[data-ms-midi]')?.addEventListener('click', () => { close(); deps.configureMidi(); });
      dialog.querySelector('[data-ms-refresh]')?.addEventListener('click', render);
    }
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('keydown', event => { event.stopPropagation(); });
    return { open };
  }
  const api = { createDraft, validateDraft, create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VirusMultiSetup = api;
})(typeof window !== 'undefined' ? window : globalThis);
