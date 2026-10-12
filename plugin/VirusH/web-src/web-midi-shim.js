// Virus H — ponte Web MIDI per la versione plugin (AU/VST3/app).
// Dentro la WebView del plugin non esiste Web MIDI: questo file ricrea
// navigator.requestMIDIAccess appoggiandosi a CoreMIDI nel plugin (VirusMidi_mac.mm).
// Nel browser normale non fa nulla.
(function () {
  if (typeof window.IPlugSendMsg !== 'function') return;

  const TAG = { ready: 100, send: 101, listen: 102, save: 103, refresh: 104, ports: 200, midiIn: 201, restore: 202 };
  window.VIRUS_H_PLUGIN = true;

  const enc = new TextEncoder(), dec = new TextDecoder();
  const toB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); };
  const fromB64 = (b64) => { const s = atob(b64 || ''); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  const packPort = (id, data) => { const idb = enc.encode(id); const out = new Uint8Array(1 + idb.length + data.length); out[0] = idb.length; out.set(idb, 1); out.set(data, 1 + idb.length); return out; };
  const post = (tag, bytes) => IPlugSendMsg({ msg: 'SAMFUI', msgTag: tag, ctrlTag: -1, data: bytes && bytes.length ? toB64(bytes) : '' });

  // ---- porte
  const outputs = new Map(), inputs = new Map();
  let access = null, listening = '', portsResolve = null;
  const portsReady = new Promise(r => { portsResolve = r; });

  function makeOutput(p) {
    return { id: p.id, name: p.name, manufacturer: p.manufacturer, type: 'output', state: 'connected', connection: 'open',
      send(data) { post(TAG.send, packPort(this.id, Uint8Array.from(data))); },
      open() { return Promise.resolve(this); }, close() { return Promise.resolve(this); } };
  }
  function makeInput(p) {
    let handler = null;
    const port = { id: p.id, name: p.name, manufacturer: p.manufacturer, type: 'input', state: 'connected', connection: 'open',
      open() { return Promise.resolve(this); }, close() { return Promise.resolve(this); } };
    Object.defineProperty(port, 'onmidimessage', {
      get: () => handler,
      set: (fn) => {
        handler = fn;
        if (fn) { listening = port.id; post(TAG.listen, enc.encode(port.id)); }
        else if (listening === port.id) { listening = ''; post(TAG.listen, null); }
      }
    });
    return port;
  }
  function applyPorts(list) {
    const keep = (map, wanted, make) => {
      for (const id of [...map.keys()]) if (!wanted.some(p => p.id === id)) map.delete(id);
      wanted.forEach(p => { if (!map.has(p.id)) map.set(p.id, make(p)); });
    };
    keep(outputs, list.filter(p => !p.input), makeOutput);
    keep(inputs, list.filter(p => p.input), makeInput);
    if (portsResolve) { portsResolve(); portsResolve = null; }
    if (access && typeof access.onstatechange === 'function') access.onstatechange({ port: null });
  }

  navigator.requestMIDIAccess = function () {
    post(TAG.refresh, null);
    access = access || { inputs, outputs, sysexEnabled: true, onstatechange: null };
    // le porte arrivano in modo asincrono dal plugin; dopo 1,5 s si prosegue comunque
    return Promise.race([portsReady, new Promise(r => setTimeout(r, 1500))]).then(() => access);
  };

  // ---- stato dell'editor salvato nel progetto del DAW (localStorage <-> plugin)
  const STATE_FLAG = 'virusH_restored';
  const snapshot = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); };
  let lastSaved = '';
  function restore(json) {
    if (!json) return;
    let data; try { data = JSON.parse(json); } catch (e) { return; }
    if (json === snapshot()) { lastSaved = json; return; }
    if (sessionStorage.getItem(STATE_FLAG) === json.length + '') return;   // gia' ricaricato una volta
    localStorage.clear();
    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
    sessionStorage.setItem(STATE_FLAG, json.length + '');
    location.reload();
  }
  function save() { const s = snapshot(); if (s !== lastSaved) { lastSaved = s; post(TAG.save, enc.encode(s)); } }
  setInterval(save, 2000);
  document.addEventListener('visibilitychange', save);

  // ---- messaggi dal plugin
  window.SAMFD = function (msgTag, dataSize, b64) {
    if (msgTag === TAG.ports) applyPorts(JSON.parse(dec.decode(fromB64(b64)) || '[]'));
    else if (msgTag === TAG.midiIn) {
      const all = fromB64(b64); const n = all[0];
      const id = dec.decode(all.slice(1, 1 + n)); const data = all.slice(1 + n);
      const port = inputs.get(id);
      if (port && port.onmidimessage) port.onmidimessage({ data, timeStamp: performance.now(), target: port });
    } else if (msgTag === TAG.restore) restore(dec.decode(fromB64(b64)));
  };
  ['SPVFD', 'SCVFD', 'SCMFD', 'SMMFD', 'SSMFD'].forEach(f => { if (typeof window[f] !== 'function') window[f] = function () {}; });

  post(TAG.ready, null);
})();
