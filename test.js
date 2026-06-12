<script>
(function(){
  // --- UI NAVIGATION TABS ---
  function hideAllViews() {
    document.getElementById('singleView').style.display = 'none';
    document.getElementById('multiView').style.display = 'none';
    document.getElementById('patchManagerContent').style.display = 'none';
    document.getElementById('arpContent').style.display = 'none';
    document.getElementById('sequencerContent').style.display = 'none';
    
    document.querySelectorAll('.mode-tab').forEach(btn => btn.classList.remove('active'));
  }

  document.getElementById('btnTabSynth').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('singleView').style.display = 'block';
    document.getElementById('btnTabSynth').classList.add('active');
  });

  document.getElementById('btnTabMultipart').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('multiView').style.display = 'flex';
    document.getElementById('btnTabMultipart').classList.add('active');
  });

  document.getElementById('btnTabPatchManager').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('patchManagerContent').style.display = 'block';
    document.getElementById('btnTabPatchManager').classList.add('active');
  });

  document.getElementById('btnTabArp').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('arpContent').style.display = 'block';
    document.getElementById('btnTabArp').classList.add('active');
  });

  document.getElementById('btnTabSequencer').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('sequencerContent').style.display = 'block';
    document.getElementById('btnTabSequencer').classList.add('active');
  });



  const SECTIONS = [
    { key: 'main',   title: '' },
    { key: 'osc',    title: 'oscillators' },
    { key: 'filter', title: 'filter 1' },
    { key: 'amp',    title: 'amplifier' },
    { key: 'lfo',    title: 'lfo 1' },
    { key: 'fx',     title: 'effects' },
  ];

  const PARAMS = [
    // Oscillator 1
    { id:'osc1_wave',       name:'Osc1 Waveform',     short:'o1wv', section:'osc', cc:17, default:0 },
    { id:'osc1_pw',         name:'Osc1 Pulsewidth',   short:'o1pw', section:'osc', cc:18, default:64 },
    { id:'osc1_waveselect', name:'Osc1 Wave Select',  short:'o1ws', section:'osc', cc:19, default:0 },
    { id:'osc1_semitone',   name:'Osc1 Semitone',     short:'o1st', section:'osc', cc:20, default:64, bipolar:true },
    // Oscillator 2
    { id:'osc2_wave',       name:'Osc2 Waveform',     short:'o2wv', section:'osc', cc:22, default:0 },
    { id:'osc2_pw',         name:'Osc2 Pulsewidth',   short:'o2pw', section:'osc', cc:23, default:64 },
    { id:'osc2_waveselect', name:'Osc2 Wave Select',  short:'o2ws', section:'osc', cc:24, default:0 },
    { id:'osc2_semitone',   name:'Osc2 Semitone',     short:'o2st', section:'osc', cc:25, default:64, bipolar:true },
    // Shared detune (Osc1/Osc2)
    { id:'osc_detune',      name:'Osc Detune',        short:'det',  section:'osc', cc:26, default:0 },

    // Filter 1
    { id:'f1_mode',      name:'Filt1 Mode',        short:'f1md', section:'filter', cc:39, default:0 },
    { id:'f1_cutoff',    name:'Cutoff',            short:'CUTOFF', section:'main', cc:40, default:127 },
    { id:'f1_resonance', name:'Resonance',         short:'RESONANCE',  section:'main', cc:42, default:0 },
    { id:'f1_envamt',    name:'Filt1 EnvAmt',      short:'f1ea', section:'filter', cc:43, default:64, bipolar:true },
    { id:'f1_keytrack',  name:'Keyboard Track',    short:'key',  section:'filter', cc:46, default:0 },

    // Amplifier
    { id:'amp_attack',  name:'Attack',  short:'atk', section:'amp', cc:59, default:0 },
    { id:'amp_decay',   name:'Decay',   short:'dcy', section:'amp', cc:60, default:0 },
    { id:'amp_sustain', name:'Sustain', short:'sus', section:'amp', cc:61, default:127 },
    { id:'amp_release', name:'Release', short:'rel', section:'amp', cc:63, default:0 },

    // LFO 1
    { id:'lfo1_rate',  name:'Rate',  short:'rate', section:'lfo', cc:67, default:64 },
    { id:'lfo1_shape', name:'Shape', short:'shp',  section:'lfo', cc:68, default:0 },

    // Effects
    { id:'fx_chorus_mix',      name:'Chorus Mix',      short:'chmx', section:'fx', cc:105, default:0 },
    { id:'fx_chorus_rate',     name:'Chorus Rate',     short:'chrt', section:'fx', cc:106, default:64 },
    { id:'fx_delay_time',      name:'Delay Time',      short:'dlt',  section:'fx', cc:114, default:0 },
    { id:'fx_delay_feedback',  name:'Delay Feedback',  short:'dlfb', section:'fx', cc:115, default:0 },
  ];

  const SYSEX_PREFIX = [0xF0, 0x00, 0x20, 0x33, 0x01];
  const SYSEX_CMD_PARAM = 0x01; // single parameter change

  // ---------------------------------------------------------------------
  // Multi mode: 4 parts, each with its own mixer/MIDI settings (page C)
  // and its own full sound (oscillator/filter/amp/lfo/fx).
  // Per-part param SysEx: F0 00 20 33 01 [DeviceID] 72 [part 00-03] [param] [value] F7
  // ---------------------------------------------------------------------
  const NUM_PARTS = 4;
  const SYSEX_CMD_MULTI = 0x72;  // page C: per-part mixer params
  const SYSEX_CMD_STORE = 0x70;  // store/write request
  const PART_ENABLE_PARAM = 0xC0;

  const PART_PARAMS = [
    { id:'channel',   name:'MIDI Channel', short:'ch',   cc:34,  kind:'channel', default:0 },
    { id:'volume',    name:'Volume',       short:'vol',  cc:39,  kind:'knob',    default:127 },
    { id:'bank',      name:'Bank',         short:'bank', cc:31,  kind:'bank',    default:0 },
    { id:'program',   name:'Program',      short:'prg',  cc:33,  kind:'program', default:0 },
    { id:'lowkey',    name:'Low Key',      short:'low',  cc:35,  kind:'key',     default:0 },
    { id:'highkey',   name:'High Key',     short:'high', cc:36,  kind:'key',     default:127 },
    { id:'transpose', name:'Transpose',    short:'trsp', cc:37,  kind:'knob',    default:64, bipolar:true },
    { id:'detune',    name:'Detune',       short:'dtun', cc:38,  kind:'knob',    default:64, bipolar:true },
    { id:'output',    name:'Output',       short:'out',  cc:41,  kind:'output',  default:0 },
  ];

  const BANK_NAMES = ['a', 'b', 'c', 'd'];
  const OUTPUT_NAMES = ['out1 l', 'out1 l+r', 'out1 r', 'out2 l', 'out2 l+r', 'out2 r'];
  const NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

  function noteName(value){
    const octave = Math.floor(value / 12) - 1; // MIDI 0 -> c-1
    return NOTE_NAMES[value % 12] + octave;
  }

  // ---------------------------------------------------------------------
  // 5x7 dot-matrix font for the part name displays.
  // Each glyph is 7 rows of 5 bits (bit4 = leftmost column).
  // ---------------------------------------------------------------------
  const FONT5X7 = {
    ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    '-': [0x00,0x00,0x00,0x1F,0x00,0x00,0x00],
    '.': [0x00,0x00,0x00,0x00,0x00,0x18,0x18],
    '0': [0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],
    '1': [0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
    '2': [0x0E,0x11,0x01,0x02,0x04,0x08,0x1F],
    '3': [0x1F,0x02,0x04,0x02,0x01,0x11,0x0E],
    '4': [0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
    '5': [0x1F,0x10,0x1E,0x01,0x01,0x11,0x0E],
    '6': [0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
    '7': [0x1F,0x01,0x02,0x04,0x08,0x08,0x08],
    '8': [0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
    '9': [0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
    'A': [0x0E,0x11,0x11,0x1F,0x11,0x11,0x11],
    'B': [0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
    'C': [0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
    'D': [0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],
    'E': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
    'F': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
    'G': [0x0E,0x11,0x10,0x17,0x11,0x11,0x0F],
    'H': [0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
    'I': [0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
    'J': [0x01,0x01,0x01,0x01,0x01,0x11,0x0E],
    'K': [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
    'L': [0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
    'M': [0x11,0x1B,0x15,0x15,0x11,0x11,0x11],
    'N': [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
    'O': [0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
    'P': [0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
    'Q': [0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
    'R': [0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
    'S': [0x0F,0x10,0x10,0x0E,0x01,0x01,0x1E],
    'T': [0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
    'U': [0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
    'V': [0x11,0x11,0x11,0x11,0x11,0x0A,0x04],
    'W': [0x11,0x11,0x11,0x15,0x15,0x15,0x0A],
    'X': [0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
    'Y': [0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
    'Z': [0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
  };
  const FONT_COLS = 5;
  const FONT_ROWS = 7;

  function glyphFor(ch){
    return FONT5X7[ch] || FONT5X7[' '];
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  let currentPartIndex = 0;

  // multiParts[i] = { enabled, values: {per-part mixer params}, sound: {per-part PARAMS} }
  const multiParts = [];
  for (let i = 0; i < NUM_PARTS; i++){
    const values = {};
    PART_PARAMS.forEach(pp => { values[pp.id] = pp.default; });
    values.channel = String(i + 1); // Default MIDI channels 1, 2, 3, 4
    const sound = {};
    PARAMS.forEach(p => { sound[p.id] = p.default; });
    multiParts.push({ enabled: true, name: 'init', values, sound });
  }

  // Define patch as a Proxy so that code modifying `patch.filter1_cutoff` updates the CURRENT part's sound.
  const patch = new Proxy({}, {
    get(target, prop) {
      return multiParts[currentPartIndex].sound[prop];
    },
    set(target, prop, value) {
      multiParts[currentPartIndex].sound[prop] = value;
      return true;
    }
  });


  // partDisplays[i] = { _render, _startReveal } for the per-part dot-matrix name display
  let partDisplays = [];

  let midiAccess = null;
  let selectedOutput = null;
  let wasConnected = false;

  const LIB_KEY = 'virusTiSnow_patchLibrary';
  const MULTI_LIB_KEY = 'virusTiSnow_multiLibrary';
  const THEME_KEY = 'virusTiSnow_theme';

  // ---------------------------------------------------------------------
  // Theme toggle (persisted in localStorage)
  // ---------------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme){
    if (theme === 'dark'){
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '●'; // ●
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '○'; // ○
    }
  }

  let currentTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme(currentTheme);
  });

  // ---------------------------------------------------------------------
  // Accent color picker (persisted in localStorage)
  // ---------------------------------------------------------------------
  const ACCENT_KEY = 'virusTiSnow_accent';
  const accentPicker = document.getElementById('accentPicker');
  const accentDots = Array.from(accentPicker.children);

  function applyAccent(color){
    document.documentElement.style.setProperty('--accent', color);
    accentDots.forEach(dot => {
      dot.classList.toggle('selected', dot.getAttribute('data-accent') === color);
    });
    partDisplays.forEach(d => d._render());
  }

  let currentAccent = localStorage.getItem(ACCENT_KEY) || '#00ffff';
  applyAccent(currentAccent);

  accentDots.forEach(dot => {
    dot.addEventListener('click', () => {
      currentAccent = dot.getAttribute('data-accent');
      localStorage.setItem(ACCENT_KEY, currentAccent);
      applyAccent(currentAccent);
    });
  });

  // ---------------------------------------------------------------------
  // Header visualizer — OP-XY style scrolling piano-roll dot matrix.
  // 40x8 grid of dots scrolling right-to-left. New columns are generated
  // as a musical sequence (pentatonic rows). Speed/density react to the
  // MIDI connection state. Canvas + requestAnimationFrame for 60fps.
  // ---------------------------------------------------------------------
  const visualizer = document.getElementById('visualizer');
  const vctx = visualizer.getContext('2d');

  const VIS_DOT = 4;       // dot diameter
  const VIS_GAP = 2;       // gap between dots
  const VIS_CELL = VIS_DOT + VIS_GAP;

  let VIS_COLS = 1;
  let VIS_ROWS = 1;

  let visDPR = 1;
  let visW = 0, visH = 0;

  function resizeVisualizer(){
    const rect = visualizer.getBoundingClientRect();
    visDPR = window.devicePixelRatio || 1;
    visW = Math.max(1, Math.floor(rect.width));
    visH = Math.max(1, Math.floor(rect.height));
    visualizer.width = visW * visDPR;
    visualizer.height = visH * visDPR;
    vctx.setTransform(visDPR, 0, 0, visDPR, 0, 0);

    VIS_COLS = Math.max(1, Math.floor((visW + VIS_GAP) / VIS_CELL));
    VIS_ROWS = Math.max(1, Math.floor((visH + VIS_GAP) / VIS_CELL));
  }

  function renderVisualizer(t){
    vctx.clearRect(0, 0, visW, visH);
    
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    // Always use the chosen color for the active wave, connected or not
    const activeColor = currentAccent;
    const inactiveColor = dark ? '#222222' : '#eeeeee';
    
    // Compute waveform row indices
    const waveRows = [];
    const timeOff = t * 0.003;
    const amplitude = wasConnected ? (VIS_ROWS / 2.5) : (VIS_ROWS / 8);
    const frequency = wasConnected ? 0.3 : 0.1;
    
    for (let c = 0; c < VIS_COLS; c++) {
      let y = VIS_ROWS / 2;
      if (wasConnected) {
        y += Math.sin(c * frequency + timeOff) * amplitude;
        y += Math.sin(c * frequency * 1.5 - timeOff * 2) * (amplitude * 0.4);
        y += Math.sin(c * frequency * 0.5 + timeOff * 0.8) * (amplitude * 0.2);
      } else {
        y += Math.sin(c * frequency + timeOff) * amplitude;
      }
      waveRows.push(Math.floor(y));
    }
    
    const x0 = Math.max(0, (visW - (VIS_COLS * VIS_CELL - VIS_GAP)) / 2);
    const y0 = Math.max(0, (visH - (VIS_ROWS * VIS_CELL - VIS_GAP)) / 2);
    const r = VIS_DOT / 2;

    for (let c = 0; c < VIS_COLS; c++){
      const cx = x0 + c * VIS_CELL + r;
      const activeRow = waveRows[c];
      
      for (let row = 0; row < VIS_ROWS; row++){
        const cy = y0 + row * VIS_CELL + r;
        vctx.beginPath();
        vctx.arc(cx, cy, r, 0, Math.PI * 2);
        
        // line thickness
        const dist = Math.abs(row - activeRow);
        const isActive = dist <= (wasConnected ? 1 : 0);
        
        if (isActive){
          vctx.fillStyle = activeColor;
          // Dimmer if disconnected, fully bright if connected
          vctx.globalAlpha = (wasConnected ? 1 : 0.6) - (dist * 0.3);
          
          if (wasConnected) {
            vctx.shadowBlur = 6;
            vctx.shadowColor = activeColor;
          } else {
            vctx.shadowBlur = 2;
            vctx.shadowColor = activeColor;
          }
        } else {
          vctx.fillStyle = inactiveColor;
          vctx.globalAlpha = 0.3;
          vctx.shadowBlur = 0;
        }
        vctx.fill();
        vctx.shadowBlur = 0;
      }
    }

    requestAnimationFrame(renderVisualizer);
  }

  resizeVisualizer();
  window.addEventListener('resize', resizeVisualizer);
  requestAnimationFrame(resizeVisualizer);
  requestAnimationFrame(renderVisualizer);

  // ---------------------------------------------------------------------
  // MIDI setup
  // ---------------------------------------------------------------------
  const inSelect = document.getElementById('midiInSelect');
  const outSelect = document.getElementById('midiOutSelect');
  const chanSelect = document.getElementById('midiChannel');
  const devIdSelect = document.getElementById('deviceIdSelect');
  const connDot = document.getElementById('connDot');
  const connLabel = document.getElementById('connLabel');

  let selectedInput = null;

  for (let i = 1; i <= 16; i++){
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = 'channel ' + i;
    chanSelect.appendChild(opt);
  }
  chanSelect.value = 1;

  for (let i = 1; i <= 16; i++){
    const opt = document.createElement('option');
    opt.value = i - 1;
    opt.textContent = 'ID ' + i;
    devIdSelect.appendChild(opt);
  }
  const optOmni = document.createElement('option');
  optOmni.value = 16; // 0x10 is Omni in Virus SysEx
  optOmni.textContent = 'Omni';
  devIdSelect.appendChild(optOmni);
  devIdSelect.value = 16; // Default to Omni

  function flashConnected(){
    connDot.classList.remove('pulse');
    // force reflow so the animation can restart
    void connDot.offsetWidth;
    connDot.classList.add('pulse');

    visualizer.classList.remove('flash');
    void visualizer.offsetWidth;
    visualizer.classList.add('flash');
    setTimeout(() => visualizer.classList.remove('flash'), 500);
  }

  function updateConnectionIndicator(){
    const outConnected = !!(selectedOutput && selectedOutput.state === 'connected');
    const inConnected = !!(selectedInput && selectedInput.state === 'connected');
    if (outConnected || inConnected){
      connDot.classList.add('on');
      let label = 'connected: ';
      if (outConnected && inConnected && selectedOutput.name === selectedInput.name) label += selectedOutput.name + ' (I/O)';
      else if (outConnected && inConnected) label += 'In/Out connected';
      else if (outConnected) label += selectedOutput.name + ' (Out)';
      else if (inConnected) label += selectedInput.name + ' (In)';
      connLabel.textContent = label;
      if (!wasConnected) flashConnected();
    } else {
      connDot.classList.remove('on');
      connLabel.textContent = 'disconnected';
    }
    wasConnected = (outConnected || inConnected);
  }

  function handleIncomingMidi(event) {
    const bytes = event.data;

    // Ignora il Clock (F8) e Active Sensing (FE) per non intasare il debug
    if (bytes[0] !== 0xF8 && bytes[0] !== 0xFE) {
       const hexStr = Array.from(bytes).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
       document.getElementById('midi-debug').textContent = 'MIDI: ' + hexStr;
    }

    // --- RICEZIONE CC (Control Change) ---
    // 0xB0 a 0xBF (176-191) sono i messaggi CC per i canali MIDI da 1 a 16
    if ((bytes[0] & 0xF0) === 0xB0 && bytes.length === 3) {
      const ccNumber = bytes[1];
      const ccValue = bytes[2];
      const param = PARAMS.find(p => p.cc === ccNumber);
      if (param) {
        patch[param.id] = ccValue;
        if (knobRefs[param.id]) knobRefs[param.id]._render();
      }
      return; // Finito con questo pacchetto (era un CC)
    }

    // --- RICEZIONE SYSEX (Dump e parametri estesi) ---
    if (bytes[0] === 0xF0 && bytes[bytes.length - 1] === 0xF7) {
      
      // Controllo se è un Single Dump (il file SysEx enorme del Virus)
      if (bytes.length > 500 && bytes[6] === 0x10) {
        if (window.multiFetchState && window.multiFetchState.active) {
          // --- RAW DUMP CAPTURE FOR MULTI PRESET ---
          window.multiFetchState.dumps[window.multiFetchState.currentPart] = Array.from(bytes);
          document.getElementById('midi-debug').textContent = '🔥 MULTI FETCH: Part ' + (window.multiFetchState.currentPart + 1) + '/4 ricevuto...';
          
          window.multiFetchState.currentPart++;
          if (window.multiFetchState.currentPart < 4) {
            setTimeout(() => { requestDump(window.multiFetchState.currentPart); }, 50);
          } else {
            finishMultiFetch();
          }
          return;
        }

        if (window.bankFetchState && window.bankFetchState.active) {
          // --- RAW DUMP CAPTURE FOR BANK FETCHER (READ OR CAPTURE) ---
          let patchName = "";
          for (let i = 249; i <= 258; i++) {
            if (bytes[i] >= 32 && bytes[i] <= 126) patchName += String.fromCharCode(bytes[i]);
          }
          patchName = patchName.trim();
          
          const bState = window.bankFetchState;
          const bank = bytes[7];
          const patchNum = bytes[8];
          
          const finalName = patchName ? `${bState.bankName}-${patchNum.toString().padStart(3,'0')} ${patchName}` : `${bState.bankName}-${patchNum.toString().padStart(3,'0')} Empty`;
          
          if (bState.mode === 'capture') {
            const lib = loadLibrary(); // Normal patch library
            lib[finalName] = Array.from(bytes);
            saveLibrary(lib);
            document.getElementById('midi-debug').textContent = `🔥 BANK CAPTURE: Salvato ${finalName}... (${bState.readPatches.length + 1}/128)`;
          } else {
            // mode === 'read'
            bState.readPatches.push(finalName);
            document.getElementById('midi-debug').textContent = `🔥 BANK READ: Letto ${finalName}... (${bState.readPatches.length}/128)`;
          }
          
          // Reset the global timeout since we are actively receiving patches
          if (bState.timeoutId) clearTimeout(bState.timeoutId);
          bState.timeoutId = setTimeout(() => {
            document.getElementById('midi-debug').textContent = `⚠️ BANK: Timeout di ricezione dopo ${bState.readPatches.length} patches.`;
            finishBankOperation();
          }, 3000); // 3 seconds of silence means it's done or failed
          
          if (bState.readPatches.length >= 128) {
             finishBankOperation();
          }
          return;
        }

        // --- RAW DUMP CAPTURE FOR LIBRARIAN ---
        window.lastReceivedDump = new Uint8Array(bytes);

        // HACKER MODE: Estraiamo il Cutoff (byte 49)
        const cutoffValue = bytes[49];
        // HACKER MODE: Estraiamo Resonance (byte 50)
        const resValue = bytes[50];
        
        // HACKER MODE: Estraiamo il NOME DELLA PATCH (byte 249 a 258)
        let patchName = "";
        for (let i = 249; i <= 258; i++) {
          if (bytes[i] >= 32 && bytes[i] <= 126) {
            patchName += String.fromCharCode(bytes[i]);
          }
        }
        document.getElementById('patchNameDisplay').textContent = 'virus ti snow // PATCH: ' + patchName.trim();
        const pInput = document.getElementById('patchName');
        if (pInput) pInput.value = patchName.trim();
        
        document.getElementById('midi-debug').textContent = '🔥 DUMP IMPORTATO: ' + patchName.trim() + ' (Cutoff=' + cutoffValue + ')';
        return;
      }

      // Altri messaggi SysEx...
      if (bytes.length >= 7 &&
          bytes[1] === 0x00 && bytes[2] === 0x20 && bytes[3] === 0x33 && bytes[4] === 0x01) {
        
        const devId = bytes[5];
        const cmd = bytes[6];

        if (devId === deviceId() || devId === 0x10) {
           // Cambio singolo parametro
           if (cmd === 0x01 && bytes.length === 10) {
             const cc = bytes[7];
             const value = bytes[8];
             const param = PARAMS.find(p => p.cc === cc);
             if (param) {
               patch[param.id] = value;
               if (knobRefs[param.id]) knobRefs[param.id]._render();
             }
           }
           // Ricezione Dump Intero (Bank o Single)
           else if ((cmd === 0x10 || cmd === 0x11 || cmd === 0x40) && bytes.length > 10) {
             console.log("🔥 DUMP RICEVUTO! Byte:", bytes.length, "Comando:", cmd.toString(16));
             alert(`Dump Ricevuto con successo dal tuo Virus!\nGrandezza: ${bytes.length} bytes.\nControlla la Console per sviluppatori per il blocco dati.`);
           }
        }
      }
    }
  }

  function refreshPorts(){
    const prevOut = outSelect.value;
    outSelect.innerHTML = '<option value="">none</option>';
    const prevIn = inSelect.value;
    inSelect.innerHTML = '<option value="">none</option>';

    if (!midiAccess) return;

    midiAccess.outputs.forEach(output => {
      const opt = document.createElement('option');
      opt.value = output.id;
      opt.textContent = output.name;
      outSelect.appendChild(opt);
    });
    if (prevOut && [...outSelect.options].some(o => o.value === prevOut)){
      outSelect.value = prevOut;
    }

    midiAccess.inputs.forEach(input => {
      const opt = document.createElement('option');
      opt.value = input.id;
      opt.textContent = input.name;
      inSelect.appendChild(opt);
    });
    if (prevIn && [...inSelect.options].some(o => o.value === prevIn)){
      inSelect.value = prevIn;
    }

    onOutputChange();
    onInputChange();
  }

  function onOutputChange(){
    const id = outSelect.value;
    selectedOutput = (midiAccess && id) ? midiAccess.outputs.get(id) : null;
    updateConnectionIndicator();
  }

  function onInputChange(){
    const id = inSelect.value;
    if (selectedInput) selectedInput.onmidimessage = null;
    selectedInput = (midiAccess && id) ? midiAccess.inputs.get(id) : null;
    if (selectedInput) selectedInput.onmidimessage = handleIncomingMidi;
    updateConnectionIndicator();
  }

  outSelect.addEventListener('change', onOutputChange);
  inSelect.addEventListener('change', onInputChange);

  if (navigator.requestMIDIAccess){
    navigator.requestMIDIAccess({ sysex: true }).then(access => {
      midiAccess = access;
      refreshPorts();
      midiAccess.onstatechange = refreshPorts;
    }).catch(err => {
      connLabel.textContent = 'midi unavailable';
      console.error(err);
    });
  } else {
    connLabel.textContent = 'web midi not supported';
  }

  // ---------------------------------------------------------------------
  // SysEx send
  // ---------------------------------------------------------------------
  function deviceId(){
    return parseInt(devIdSelect.value, 10); // 0-15 or 16 (Omni)
  }

  function buildSysEx(cc, value){
    return new Uint8Array([
      ...SYSEX_PREFIX,
      deviceId(),
      SYSEX_CMD_PARAM,
      cc & 0x7F,
      value & 0x7F,
      0xF7
    ]);
  }

  function sendParam(param, value){
    if (selectedOutput){
      try{
        if (param.cc !== undefined && param.cc < 120) {
          // Send standard MIDI CC
          const channel = parseInt(document.getElementById('midiChannel').value, 10) - 1;
          selectedOutput.send(new Uint8Array([0xB0 | channel, param.cc, value & 0x7F]));
        } else {
          // Fallback to SysEx if no standard CC exists
          selectedOutput.send(buildSysEx(param.cc, value));
        }
      } catch(e){ console.error('MIDI send error', e); }
    }
  }

  function sendFullPatch(p){
    PARAMS.forEach((param, i) => {
      setTimeout(() => sendParam(param, p[param.id]), i * 15);
    });
  }

  // ---------------------------------------------------------------------
  // Multi mode SysEx send
  // ---------------------------------------------------------------------
  function sendMultiPartParam(partIndex, cc, value){
    if (selectedOutput){
      try{
        selectedOutput.send(new Uint8Array([
          ...SYSEX_PREFIX, deviceId(), SYSEX_CMD_MULTI, partIndex & 0x7F, cc & 0x7F, value & 0x7F, 0xF7
        ]));
      } catch(e){ console.error('MIDI send error', e); }
    }
  }

  // per-part full sound editor: addresses the part via the device-id byte
  function sendPartSoundParam(partIndex, cc, value){
    if (selectedOutput){
      try{
        selectedOutput.send(new Uint8Array([
          ...SYSEX_PREFIX, partIndex & 0x7F, SYSEX_CMD_PARAM, cc & 0x7F, value & 0x7F, 0xF7
        ]));
      } catch(e){ console.error('MIDI send error', e); }
    }
  }

  // ---------------------------------------------------------------------
  // Knob UI — thin-stroke circle with a single radial indicator line
  // showing the current value (-135deg to +135deg sweep, 0deg = up).
  // ---------------------------------------------------------------------
  const svgNS = 'http://www.w3.org/2000/svg';
  const KNOB_SIZE = 52;
  const KNOB_CENTER = KNOB_SIZE / 2;
  const KNOB_RADIUS = 21;

  function angleForValue(value){
    return -135 + (value / 127) * 270;
  }

  function displayValue(value, bipolar){
    if (bipolar) {
      const v = value - 64;
      return (v > 0 ? '+' : '') + v;
    }
    return String(value);
  }

  // spawn a brief ripple of dots radiating outward from a knob
  function spawnRipple(container){
    const RIPPLE_COUNT = 8;
    for (let i = 0; i < RIPPLE_COUNT; i++){
      const angle = (i / RIPPLE_COUNT) * Math.PI * 2;
      const dot = document.createElement('div');
      dot.className = 'ripple-dot';
      dot.style.setProperty('--dx', (Math.cos(angle) * 28) + 'px');
      dot.style.setProperty('--dy', (Math.sin(angle) * 28) + 'px');
      container.appendChild(dot);
      setTimeout(() => dot.remove(), 450);
    }
  }

  // generic knob: caller supplies getValue/setValue so the same widget can
  // back the single-mode patch, or any per-part value in multi mode.
  function createKnobGeneric(opts){
    const container = document.createElement('div');
    container.className = 'knob-container';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${KNOB_SIZE} ${KNOB_SIZE}`);
    svg.classList.add('knob-svg');

    // thin stroke circle, no fill
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', KNOB_CENTER);
    circle.setAttribute('cy', KNOB_CENTER);
    circle.setAttribute('r', KNOB_RADIUS);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '0.5');
    svg.appendChild(circle);

    // single thin line from center to edge, rotated to show the value
    const indicator = document.createElementNS(svgNS, 'g');
    indicator.classList.add('knob-indicator');
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', KNOB_CENTER);
    line.setAttribute('y1', KNOB_CENTER);
    line.setAttribute('x2', KNOB_CENTER);
    line.setAttribute('y2', KNOB_CENTER - KNOB_RADIUS);
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', '1');
    indicator.appendChild(line);
    svg.appendChild(indicator);

    svg.style.color = 'var(--fg)';

    const label = document.createElement('div');
    label.className = 'knob-label';
    label.textContent = opts.label;

    const valueLabel = document.createElement('div');
    valueLabel.className = 'knob-value';

    container.appendChild(svg);
    container.appendChild(label);
    container.appendChild(valueLabel);

    function render(){
      const value = opts.getValue();
      indicator.style.transform = `rotate(${angleForValue(value)}deg)`;
      valueLabel.textContent = displayValue(value, opts.bipolar);
    }

    function setValue(value, send, setOpts){
      value = Math.max(0, Math.min(127, Math.round(value)));
      const changed = opts.getValue() !== value;
      opts.setValue(value, send);
      render();
      if (changed && !(setOpts && setOpts.silent)) spawnRipple(container);
    }

    // drag interaction
    let dragging = false;
    let startY = 0;
    let startVal = 0;

    svg.addEventListener('pointerdown', (e) => {
      dragging = true;
      startY = e.clientY;
      startVal = opts.getValue();
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    svg.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      setValue(startVal + dy * 0.7, true);
    });

    function endDrag(e){
      dragging = false;
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    // double-click resets to default
    svg.addEventListener('dblclick', () => {
      setValue(opts.default, true);
    });

    // tap/click the value box to type an exact value
    valueLabel.addEventListener('click', () => {
      const current = opts.getValue();
      const input = prompt('value (0-127):', current);
      if (input === null) return;
      const num = parseInt(input, 10);
      if (!isNaN(num)) setValue(num, true);
    });

    container._render = render;
    container._setValue = setValue;
    render();

    return container;
  }

  function createKnob(param){
    return createKnobGeneric({
      label: param.short || param.name,
      default: param.default,
      bipolar: param.bipolar,
      getValue: () => patch[param.id],
      setValue: (value, send) => {
        patch[param.id] = value;
        if (send) sendParam(param, value);
      }
    });
  }

  const knobRefs = {};

  function buildSingleView(){
    const root = document.getElementById('singleView');
    root.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'multi-global';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-start';
    container.style.gap = '16px';
    
    const title = document.createElement('h2');
    title.textContent = 'single patch selection';
    title.style.margin = '0';
    container.appendChild(title);
    
    const desc = document.createElement('div');
    desc.textContent = 'select bank and program to send a program change directly to the virus.';
    desc.style.color = 'var(--fg)';
    desc.style.opacity = '0.6';
    container.appendChild(desc);

    const row = document.createElement('div');
    row.className = 'lib-row';
    row.style.justifyContent = 'flex-start';
    row.style.gap = '16px';

    const bankField = document.createElement('div');
    bankField.className = 'field';
    const bankLabel = document.createElement('label');
    bankLabel.textContent = 'bank';
    const bankSelect = document.createElement('select');
    const banks = ['RAM 1','RAM 2','RAM 3','RAM 4','RAM 5','RAM 6','RAM 7','RAM 8','ROM 1','ROM 2','ROM 3','ROM 4','ROM 5','ROM 6','ROM 7','ROM 8'];
    banks.forEach((b, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = b;
      bankSelect.appendChild(opt);
    });
    bankField.appendChild(bankLabel);
    bankField.appendChild(bankSelect);

    const prgField = document.createElement('div');
    prgField.className = 'field';
    const prgLabel = document.createElement('label');
    prgLabel.textContent = 'program';
    const prgInput = document.createElement('input');
    prgInput.type = 'number';
    prgInput.min = 0;
    prgInput.max = 127;
    prgInput.value = 0;
    prgInput.style.width = '60px';
    prgInput.style.background = 'transparent';
    prgInput.style.color = 'var(--fg)';
    prgInput.style.border = 'none';
    prgInput.style.borderBottom = '1px solid var(--border)';
    prgInput.style.fontFamily = 'inherit';
    prgInput.style.fontSize = '11px';
    prgInput.style.padding = '2px 0';
    prgInput.style.outline = 'none';
    prgField.appendChild(prgLabel);
    prgField.appendChild(prgInput);

    const btnSend = document.createElement('button');
    btnSend.textContent = 'send program change';
    btnSend.style.marginTop = '14px'; // align with inputs
    btnSend.addEventListener('click', () => {
      if (!selectedOutput) {
        alert('MIDI Output non connesso!');
        return;
      }
      const b = parseInt(bankSelect.value, 10);
      const p = parseInt(prgInput.value, 10);
      try {
        selectedOutput.send([0xB0, 0x00, 0x00]); // CC 0 (MSB)
        selectedOutput.send([0xB0, 0x20, b]);    // CC 32 (LSB)
        selectedOutput.send([0xC0, p]);          // Program Change
      } catch(e) {
        console.error('MIDI send error', e);
      }
    });

    row.appendChild(bankField);
    row.appendChild(prgField);
    row.appendChild(btnSend);

    container.appendChild(row);

    root.appendChild(container);

    // Initialize the big macro knobs (Cutoff & Resonance) and put them in the header
    const macroKnobs = document.getElementById('globalMacroKnobs');
    macroKnobs.innerHTML = '';
    const cutParam = PARAMS.find(p => p.id === 'f1_cutoff');
    const resParam = PARAMS.find(p => p.id === 'f1_resonance');
    
    if (cutParam && resParam) {
      const cutKnob = createKnob(cutParam);
      const resKnob = createKnob(resParam);
      knobRefs[cutParam.id] = cutKnob;
      knobRefs[resParam.id] = resKnob;
      macroKnobs.appendChild(cutKnob);
      macroKnobs.appendChild(resKnob);
    }
  }

  function refreshAllKnobs(){
    PARAMS.forEach(p => {
      if(knobRefs[p.id]) knobRefs[p.id]._render();
    });
  }

  function applyPatchObject(p, send){
    PARAMS.forEach(param => {
      const value = (p[param.id] !== undefined) ? p[param.id] : param.default;
      patch[param.id] = Math.max(0, Math.min(127, value));
    });
    refreshAllKnobs();
    if (send) sendFullPatch(patch);
  }

  // ---------------------------------------------------------------------
  // Raw Dump Library Logic
  // ---------------------------------------------------------------------

  function loadMultiLibrary(){
    try{
      return JSON.parse(localStorage.getItem(MULTI_LIB_KEY)) || {};
    } catch(e){ return {}; }
  }

  function saveMultiLibrary(lib){
    localStorage.setItem(MULTI_LIB_KEY, JSON.stringify(lib));
  }

  window.multiFetchState = null;
  function finishBankOperation() {
    const bState = window.bankFetchState;
    if (!bState) return;
    
    if (bState.timeoutId) {
      clearTimeout(bState.timeoutId);
    }
    
    const count = bState.mode === 'read' ? bState.readPatches.length : loadLibraryCount(bState.bankName);

    if (bState.mode === 'capture') {
      if (count === 0) {
        document.getElementById('midi-debug').innerHTML = `<span style="color:#f00;">❌ ERRORE: Nessuna patch ricevuta (SysEx bloccato).</span>`;
      } else {
        document.getElementById('midi-debug').innerHTML = `<span style="color:#0f0;">✅ BANK CAPTURE: ${bState.bankName} Completato! (${count}/128)</span>`;
      }
      updateBrowserView();
    } else if (bState.mode === 'read') {
      if (count === 0) {
        document.getElementById('midi-debug').innerHTML = `<span style="color:#f00;">❌ ERRORE: Nessuna patch ricevuta. SysEx OUT bloccato dal Fantom.</span>`;
      } else {
        document.getElementById('midi-debug').innerHTML = `<span style="color:#0f0;">✅ BANK READ: ${bState.bankName} Completato! (${count}/128)</span>`;
        console.log("Patches lette:", bState.readPatches);
      }
    }
    
    window.bankFetchState.active = false;
    window.bankFetchState = null;
  }

  function requestBankPatch(bankIndex, patchIndex) {
    if (!selectedOutput) return;
    try {
      selectedOutput.send(new Uint8Array([
        ...SYSEX_PREFIX, deviceId(), 0x00, bankIndex & 0x7F, patchIndex & 0x7F, 0xF7
      ]));
    } catch (e) { console.error('Bank dump request error', e); }
  }

  function requestFullBank(bankIndex) {
    if (!selectedOutput) return;
    try {
      // 0x04 = Bank Print Request
      selectedOutput.send(new Uint8Array([
        ...SYSEX_PREFIX, deviceId(), 0x04, bankIndex & 0x7F, 0xF7
      ]));
    } catch (e) { console.error('Full Bank dump request error', e); }
  }

  function requestDump(partIndex) {
    if (!selectedOutput) return;
    try {
      // 0x40 = Edit Buffer, partIndex = 0..3 (Part 1..4)
      selectedOutput.send(new Uint8Array([
        ...SYSEX_PREFIX, deviceId(), 0x00, 0x40, partIndex & 0x7F, 0xF7
      ]));
    } catch (e) { console.error('Dump request error', e); }
  }

  function finishMultiFetch() {
    const lib = loadMultiLibrary();
    const preset = {
      name: window.multiFetchState.name,
      parts: []
    };
    for (let i = 0; i < NUM_PARTS; i++) {
      preset.parts.push({
        enabled: multiParts[i].enabled,
        values: JSON.parse(JSON.stringify(multiParts[i].values)), // deep copy mixer params
        dump: window.multiFetchState.dumps[i] // The raw bytes array for this part
      });
    }
    lib[window.multiFetchState.name] = preset;
    saveMultiLibrary(lib);
    window.multiFetchState = null;
    document.getElementById('midi-debug').textContent = '✅ MULTI PRESET SAVED!';
    document.getElementById('multiName').value = '';
    renderMultiLibrary();
  }

  function renderMultiLibrary(){
    const lib = loadMultiLibrary();
    const list = document.getElementById('multiLibList');
    list.innerHTML = '';
    const names = Object.keys(lib).sort();
    if (names.length === 0){
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'no multi presets saved';
      list.appendChild(empty);
      return;
    }
    names.forEach(name => {
      const item = document.createElement('div');
      item.className = 'lib-item';

      const nameEl = document.createElement('span');
      nameEl.className = 'name';
      nameEl.textContent = name;

      const btns = document.createElement('div');
      btns.className = 'btns';

      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'load';
      loadBtn.addEventListener('click', () => {
        const preset = lib[name];
        for (let i = 0; i < NUM_PARTS; i++) {
          const pData = preset.parts[i];
          multiParts[i].enabled = pData.enabled;
          multiParts[i].values = JSON.parse(JSON.stringify(pData.values));
          
          // Invia parametri Mixer (Volume, Pan, Output, ecc.)
          sendMultiPartParam(i, 39, pData.values.volume);
          setTimeout(() => sendMultiPartParam(i, 40, pData.values.pan), 10);
          setTimeout(() => sendMultiPartParam(i, 34, pData.values.channel), 20);
          setTimeout(() => sendMultiPartParam(i, 37, pData.values.transpose), 30);
          setTimeout(() => sendMultiPartParam(i, 38, pData.values.detune), 40);
          setTimeout(() => sendMultiPartParam(i, 41, pData.values.output), 50);
          setTimeout(() => sendMultiPartParam(i, 35, pData.values.lowkey), 60);
          setTimeout(() => sendMultiPartParam(i, 36, pData.values.highkey), 70);
          
          // Invia il Dump SysEx al sintetizzatore (Patch)
          if (pData.dump && pData.dump.length > 500) {
            setTimeout(() => {
              loadPatchToPart(pData.dump, i);
            }, 100 + (i * 50)); // stagger the heavy sysex dumps
          }
        }
        buildMultiView(); // Ridisegna la UI per mostrare i nuovi valori
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'delete';
      delBtn.textContent = 'x';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete multi preset?')){
          delete lib[name];
          saveMultiLibrary(lib);
          renderMultiLibrary();
        }
      });

      btns.appendChild(loadBtn);
      btns.appendChild(delBtn);
      item.appendChild(nameEl);
      item.appendChild(btns);
      list.appendChild(item);
    });
  }

  function loadPatchToPart(rawBytesArray, partIndex) {
    if (!selectedOutput) return;
    const dump = new Uint8Array(rawBytesArray);
    // Byte 5 is the Device ID which routes the dump to a specific part!
    dump[5] = partIndex & 0x7F; 
    
    try {
      selectedOutput.send(dump);
      
      // Update UI Cutoff/Res if available in dump
      if (dump.length > 50) {
        multiParts[partIndex].sound['f1_cutoff'] = dump[49];
        multiParts[partIndex].sound['f1_resonance'] = dump[50];
        // Note: The knob rendering updates automatically when rotating, 
        // but to force visual update we'd ideally trigger a render.
      }

      // Update Part Name
      let patchName = "";
      for (let i = 249; i <= 258 && i < dump.length; i++) {
        if (dump[i] >= 32 && dump[i] <= 126) {
          patchName += String.fromCharCode(dump[i]);
        }
      }
      multiParts[partIndex].name = patchName.trim();
      if (partDisplays[partIndex] && partDisplays[partIndex]._startReveal) {
        partDisplays[partIndex]._startReveal();
      }

    } catch(e) {
      console.error('MIDI send dump error', e);
    }
  }

  // ---------------------------------------------------------------------
  // Export / Import .syx (Single Dump)
  // ---------------------------------------------------------------------
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.syx';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      if (bytes.length > 500 && bytes[0] === 0xF0 && bytes[bytes.length-1] === 0xF7) {
        window.lastReceivedDump = bytes;
        
        // Extract name
        let patchName = "";
        for (let i = 249; i <= 258 && i < bytes.length; i++) {
          if (bytes[i] >= 32 && bytes[i] <= 126) patchName += String.fromCharCode(bytes[i]);
        }
        document.getElementById('patchNameDisplay').textContent = 'virus ti snow // PATCH DUMP LOADED: ' + patchName.trim();
        const pInput = document.getElementById('patchName');
        if (pInput) pInput.value = patchName.trim();
        alert('SysEx loaded successfully. You can now save it to the library.');
      } else {
        alert('Invalid or unsupported SysEx file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  });

  // ---------------------------------------------------------------------
  // Patch library (localStorage)
  // ---------------------------------------------------------------------
  function loadLibrary(){
    try{
      return JSON.parse(localStorage.getItem(LIB_KEY)) || {};
    } catch(e){ return {}; }
  }

  function saveLibrary(lib){
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  }

  function renderLibrary(){
    const lib = loadLibrary();
    const list = document.getElementById('libList');
    list.innerHTML = '';
    const names = Object.keys(lib).sort();
    if (names.length === 0){
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'no patches saved';
      list.appendChild(empty);
      return;
    }
    names.forEach(name => {
      const item = document.createElement('div');
      item.className = 'lib-item';

      const nameEl = document.createElement('span');
      nameEl.className = 'name';
      nameEl.textContent = name;

      const btns = document.createElement('div');
      btns.className = 'btns';

      const loadLabel = document.createElement('span');
      loadLabel.className = 'small';
      loadLabel.textContent = 'load to: ';
      btns.appendChild(loadLabel);

      for(let i=0; i<4; i++){
        const btn = document.createElement('button');
        btn.textContent = 'P' + (i+1);
        btn.addEventListener('click', () => {
          loadPatchToPart(lib[name], i);
        });
        btns.appendChild(btn);
      }

      const delBtn = document.createElement('button');
      delBtn.textContent = 'delete';
      delBtn.addEventListener('click', () => {
        if (confirm(`delete patch "${name}"?`)){
          delete lib[name];
          saveLibrary(lib);
          renderLibrary();
        }
      });

      btns.appendChild(loadLabel);
      btns.appendChild(delBtn);
      item.appendChild(nameEl);
      item.appendChild(btns);
      list.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------
  // Multi mode UI — single | multi tabs, 4 part strips
  // ---------------------------------------------------------------------
  function clamp7(value){
    return Math.max(0, Math.min(127, Math.round(value)));
  }

  function createPartKnob(partIndex, pp){
    return createKnobGeneric({
      label: pp.short || pp.name,
      default: pp.default,
      bipolar: pp.bipolar,
      getValue: () => multiParts[partIndex].values[pp.id],
      setValue: (value, send) => {
        multiParts[partIndex].values[pp.id] = value;
        if (send) sendMultiPartParam(partIndex, pp.cc, value);
      }
    });
  }

  function createPartSoundKnob(partIndex, param){
    return createKnobGeneric({
      label: param.short || param.name,
      default: param.default,
      bipolar: param.bipolar,
      getValue: () => multiParts[partIndex].sound[param.id],
      setValue: (value, send) => {
        multiParts[partIndex].sound[param.id] = value;
        if (send) sendPartSoundParam(partIndex, param.cc, value);
      }
    });
  }

  function createKeyField(partIndex, pp){
    const field = document.createElement('div');
    field.className = 'field field-' + pp.id;
    const label = document.createElement('label');
    label.textContent = pp.short || pp.name;
    const display = document.createElement('div');
    display.className = 'key-display';
    display.textContent = noteName(multiParts[partIndex].values[pp.id]);
    display.addEventListener('click', () => {
      const current = multiParts[partIndex].values[pp.id];
      const input = prompt('value (0-127):', current);
      if (input === null) return;
      const num = parseInt(input, 10);
      if (isNaN(num)) return;
      const value = clamp7(num);
      multiParts[partIndex].values[pp.id] = value;
      display.textContent = noteName(value);
      sendMultiPartParam(partIndex, pp.cc, value);
    });
    field.appendChild(label);
    field.appendChild(display);
    return field;
  }

  function createSelectField(labelText, options, value, onChange){
    const field = document.createElement('div');
    field.className = 'field field-' + labelText;
    const label = document.createElement('label');
    label.textContent = labelText;
    const select = document.createElement('select');
    options.forEach((opt, i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = opt;
      select.appendChild(o);
    });
    select.value = value;
    select.addEventListener('change', () => onChange(parseInt(select.value, 10)));
    field.appendChild(label);
    field.appendChild(select);
    return field;
  }

  function createPartDisplay(index){
    const wrap = document.createElement('div');
    wrap.className = 'part-display';
    wrap.title = 'Click to rename patch';

    const canvas = document.createElement('canvas');
    wrap.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const DOT = 4, GAP = 1, CELL = DOT + GAP;
    const PRG_DOT = 2, PRG_GAP = 1, PRG_CELL = PRG_DOT + PRG_GAP;

    let w = 0, h = 0, dpr = 1;
    let revealCols = 0;
    let revealTimer = null;
    let flickerDots = [];

    function now(){
      return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    }

    function getName(){
      return (multiParts[index].name || 'init').toUpperCase();
    }

    function totalCols(text){
      return Math.max(0, text.length * (FONT_COLS + 1) - 1);
    }

    function render(){
      if (w <= 0 || h <= 0) return;
      ctx.clearRect(0, 0, w, h);
      const colors = { active: currentAccent, inactive: '#666' };

      // background dot grid
      const cols = Math.floor((w + GAP) / CELL);
      const rows = Math.floor((h + GAP) / CELL);
      ctx.fillStyle = '#1a1a1a';
      for (let r = 0; r < rows; r++){
        for (let c = 0; c < cols; c++){
          ctx.fillRect(c * CELL, r * CELL, DOT, DOT);
        }
      }

      // tiny "PRG nnn" label, top-left
      const prgText = 'PRG ' + String(multiParts[index].values.program).padStart(3, '0');
      ctx.fillStyle = colors.inactive;
      let px = 2, py = 2;
      for (const ch of prgText){
        const glyph = glyphFor(ch);
        for (let row = 0; row < FONT_ROWS; row++){
          for (let col = 0; col < FONT_COLS; col++){
            if (glyph[row] & (1 << (FONT_COLS - 1 - col))){
              ctx.fillRect(px + col * PRG_CELL, py + row * PRG_CELL, PRG_DOT, PRG_DOT);
            }
          }
        }
        px += (FONT_COLS + 1) * PRG_CELL;
      }

      // main patch name, centered, revealed column by column
      const text = getName();
      const textH = FONT_ROWS * CELL - GAP;
      const ox = 0;
      const oy = Math.max(0, Math.floor((h - textH) / 2));

      ctx.fillStyle = colors.active;
      let gcol = 0;
      for (const ch of text){
        const glyph = glyphFor(ch);
        for (let col = 0; col < FONT_COLS; col++){
          if (gcol < revealCols){
            for (let row = 0; row < FONT_ROWS; row++){
              if (glyph[row] & (1 << (FONT_COLS - 1 - col))){
                ctx.fillRect(ox + gcol * CELL, oy + row * CELL, DOT, DOT);
              }
            }
          }
          gcol++;
        }
        gcol++; // gap column between characters
      }

      // idle flicker dots
      const t = now();
      flickerDots = flickerDots.filter(d => d.until > t);
      ctx.fillStyle = colors.active;
      flickerDots.forEach(d => {
        ctx.fillRect(d.x * CELL, d.y * CELL, DOT, DOT);
      });
    }

    function startReveal(){
      revealCols = 0;
      const target = totalCols(getName());
      if (revealTimer) clearInterval(revealTimer);
      revealTimer = setInterval(() => {
        revealCols++;
        render();
        if (revealCols >= target){
          clearInterval(revealTimer);
          revealTimer = null;
        }
      }, 60);
    }

    function resize(){
      const rect = wrap.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }

    setInterval(() => {
      const cols = Math.floor((w + GAP) / CELL);
      const rows = Math.floor((h + GAP) / CELL);
      if (cols <= 0 || rows <= 0) return;
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++){
        flickerDots.push({
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
          until: now() + 250
        });
      }
      render();
      setTimeout(render, 260);
    }, 3000);

    wrap.addEventListener('click', () => {
      const name = prompt('Part name', multiParts[index].name || 'init');
      if (name !== null && name.trim() !== ''){
        multiParts[index].name = name.trim().slice(0, 16);
        startReveal();
      }
    });

    window.addEventListener('resize', resize);
    if (typeof ResizeObserver !== 'undefined'){
      new ResizeObserver(resize).observe(wrap);
    } else {
      resize();
    }
    startReveal();

    wrap._render = render;
    wrap._startReveal = startReveal;
    return wrap;
  }

  function createPartRow(index){
    const part = multiParts[index];

    const row = document.createElement('div');
    row.className = 'part-row part-' + index;
    if (!part.enabled) row.classList.add('disabled');

    const main = document.createElement('div');
    main.className = 'part-main';

    const badge = document.createElement('div');
    badge.className = 'part-badge';
    badge.textContent = 'p' + (index + 1);
    main.appendChild(badge);

    const enableBtn = document.createElement('button');
    enableBtn.className = 'part-enable';
    enableBtn.classList.toggle('active', part.enabled);
    enableBtn.textContent = part.enabled ? 'on' : 'off';
    enableBtn.addEventListener('click', () => {
      part.enabled = !part.enabled;
      enableBtn.textContent = part.enabled ? 'on' : 'off';
      enableBtn.classList.toggle('active', part.enabled);
      row.classList.toggle('disabled', !part.enabled);
      sendMultiPartParam(index, PART_ENABLE_PARAM, part.enabled ? 1 : 0);
    });
    main.appendChild(enableBtn);

    // MIDI channel
    const channels = [];
    for (let c = 1; c <= 16; c++) channels.push(String(c));
    main.appendChild(createSelectField('ch', channels, part.values.channel, (v) => {
      part.values.channel = v;
      sendMultiPartParam(index, 34, v);
    }));

    // volume knob
    const volKnob = createPartKnob(index, PART_PARAMS.find(p => p.id === 'volume'));
    volKnob.classList.add('vol-knob');
    main.appendChild(volKnob);

    // bank select
    main.appendChild(createSelectField('bank', BANK_NAMES, part.values.bank, (v) => {
      part.values.bank = v;
      sendMultiPartParam(index, 31, v);
    }));

    // program change number input
    const progField = document.createElement('div');
    progField.className = 'field field-prg';
    const progLabel = document.createElement('label');
    progLabel.textContent = 'prg';
    const progInput = document.createElement('input');
    progInput.type = 'number';
    progInput.min = '0';
    progInput.max = '127';
    progInput.value = String(part.values.program);
    progInput.addEventListener('change', () => {
      const v = clamp7(parseInt(progInput.value, 10) || 0);
      progInput.value = String(v);
      part.values.program = v;
      sendMultiPartParam(index, 33, v);
    });
    progField.appendChild(progLabel);
    progField.appendChild(progInput);
    main.appendChild(progField);

    // low / high key
    main.appendChild(createKeyField(index, PART_PARAMS.find(p => p.id === 'lowkey')));
    main.appendChild(createKeyField(index, PART_PARAMS.find(p => p.id === 'highkey')));

    // transpose / detune knobs
    const trspKnob = createPartKnob(index, PART_PARAMS.find(p => p.id === 'transpose'));
    trspKnob.classList.add('trsp-knob');
    main.appendChild(trspKnob);
    const dtunKnob = createPartKnob(index, PART_PARAMS.find(p => p.id === 'detune'));
    dtunKnob.classList.add('dtun-knob');
    main.appendChild(dtunKnob);

    // output select
    main.appendChild(createSelectField('out', OUTPUT_NAMES, part.values.output, (v) => {
      part.values.output = v;
      sendMultiPartParam(index, 41, v);
    }));

    // cutoff knob
    const cutKnob = createPartSoundKnob(index, PARAMS.find(p => p.id === 'f1_cutoff'));
    cutKnob.classList.add('cut-knob');
    main.appendChild(cutKnob);

    // resonance knob
    const resKnob = createPartSoundKnob(index, PARAMS.find(p => p.id === 'f1_resonance'));
    resKnob.classList.add('res-knob');
    main.appendChild(resKnob);

    const display = createPartDisplay(index);
    main.appendChild(display);
    partDisplays.push(display);

    row.appendChild(main);
    return row;
  }

  function buildMultiView(){
    const partList = document.getElementById('partList');
    partList.innerHTML = '';
    partDisplays = [];
    for (let i = 0; i < NUM_PARTS; i++){
      partList.appendChild(createPartRow(i));
    }
  }

  // global multi controls
  const playModeSelect = document.getElementById('playModeSelect');
  playModeSelect.addEventListener('change', () => {
    const v = parseInt(playModeSelect.value, 10);
    if (selectedOutput){
      try{ selectedOutput.send(buildSysEx(122, v)); } catch(e){ console.error('MIDI send error', e); }
    }
  });

  const multiProgramInput = document.getElementById('multiProgramInput');
  document.getElementById('btnMultiLoad').addEventListener('click', () => {
    const v = clamp7(parseInt(multiProgramInput.value, 10) || 0);
    multiProgramInput.value = String(v);
    if (selectedOutput){
      try{ selectedOutput.send(buildSysEx(105, v)); } catch(e){ console.error('MIDI send error', e); }
    }
  });
  document.getElementById('btnMultiSave').addEventListener('click', () => {
    const v = clamp7(parseInt(multiProgramInput.value, 10) || 0);
    multiProgramInput.value = String(v);
    if (selectedOutput){
      try{
        selectedOutput.send(new Uint8Array([...SYSEX_PREFIX, deviceId(), SYSEX_CMD_STORE, v & 0x7F, 0xF7]));
      } catch(e){ console.error('MIDI send error', e); }
    }
  });

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  document.getElementById('btnSavePatch').addEventListener('click', () => {
    const nameInput = document.getElementById('patchName');
    const name = nameInput.value.trim();
    if (!name){
      alert('enter a patch name');
      return;
    }
    if (!window.lastReceivedDump) {
      alert('Nessun Dump ricevuto! Invia prima un Single Dump dal synth premendo STORE.');
      return;
    }
    const lib = loadLibrary();
    lib[name] = Array.from(window.lastReceivedDump); // Save the raw array of bytes!
    saveLibrary(lib);
    nameInput.value = '';
    renderLibrary();
  });

  document.getElementById('btnSaveMulti').addEventListener('click', () => {
    const nameInput = document.getElementById('multiName');
    const name = nameInput.value.trim();
    if (!name){
      alert('enter a multi preset name');
      return;
    }
    if (!selectedOutput) {
      alert('MIDI Output non connesso!');
      return;
    }
    document.getElementById('midi-debug').textContent = '🔥 MULTI FETCH: Richiesta Part 1...';
    window.multiFetchState = {
      active: true,
      currentPart: 0,
      name: name,
      dumps: []
    };
    requestDump(0);
  });

  function startBankOperation(mode) {
    if (!selectedOutput) {
      alert('MIDI Output non connesso!');
      return;
    }
    const type = document.getElementById('bankTypeSelect').value;
    const num = parseInt(document.getElementById('bankNumSelect').value, 10);
    const bankIndex = (type === 'RAM' ? 0 : 8) + (num - 1);
    const bankName = `${type} ${num}`;
    
    const msg = mode === 'capture' 
      ? `Vuoi estrarre e SALVARE nella libreria tutte le 128 patch dal banco ${bankName}?`
      : `Vuoi LEGGERE tutte le 128 patch dal banco ${bankName} senza salvarle?`;

    if (confirm(msg)) {
      document.getElementById('midi-debug').textContent = `🔥 BANK ${mode.toUpperCase()}: Richiesta ${bankName} patch 1/128...`;
      if (mode === 'read') {
         document.getElementById('synthBankList').innerHTML = '<div style="color: #00ffff; font-size: 12px; text-align: center; padding: 16px;">lettura in corso...</div>';
      }
      window.bankFetchState = {
        active: true,
        mode: mode,
        bankIndex: bankIndex,
        bankName: bankName,
        readPatches: [],
        timeoutId: null
      };
      
      // Request the FULL bank at once (Command 0x04)
      requestFullBank(bankIndex);
      
      // If we receive absolutely nothing for 3 seconds, we timeout the whole operation
      window.bankFetchState.timeoutId = setTimeout(() => {
        const bState = window.bankFetchState;
        if (bState && bState.active) {
          document.getElementById('midi-debug').textContent = `⚠️ BANK: Il synth non ha risposto. SysEx bloccato.`;
          finishBankOperation();
        }
      }, 3000);
    }
  }

  document.getElementById('btnReadBank').addEventListener('click', () => {
    startBankOperation('read');
  });

  document.getElementById('btnFetchBank').addEventListener('click', () => {
    startBankOperation('capture');
  });

  renderLibrary();
  renderMultiLibrary();
  buildSingleView();
  buildMultiView();
  // Hide library section by default
  document.querySelector('.section-lib').style.display = 'none';
})();
</script>
