(function(){
  // --- UI NAVIGATION TABS ---
  function hideAllViews() {
    document.getElementById('singleView').style.display = 'none';
    document.getElementById('multiView').style.display = 'none';
    document.getElementById('patchManagerContent').style.display = 'none';
    document.getElementById('arpContent').style.display = 'none';
    document.getElementById('sequencerContent').style.display = 'none';
    document.getElementById('songContent').style.display = 'none';

    document.querySelectorAll('.segmented-tab').forEach(btn => btn.classList.remove('active'));
  }

  document.getElementById('btnTabSynth').addEventListener('click', () => {
    hideAllViews();
    const v = document.getElementById('singleView');
    v.style.display = 'block';
    document.getElementById('btnTabSynth').classList.add('active');
    updateControlRoomStatus();
  });

  document.getElementById('btnTabMultipart').addEventListener('click', () => {
    hideAllViews();
    const v = document.getElementById('multiView');
    v.style.display = 'block';
    document.getElementById('btnTabMultipart').classList.add('active');
    updateControlRoomStatus();
  });

  document.getElementById('btnTabPatchManager').addEventListener('click', () => {
    hideAllViews();
    const v = document.getElementById('patchManagerContent');
    v.style.display = 'block';
    document.getElementById('btnTabPatchManager').classList.add('active');
    updateControlRoomStatus();
  });

  document.getElementById('btnTabArp').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('arpContent').style.display = 'block';
    document.getElementById('btnTabArp').classList.add('active');
    updateControlRoomStatus();
  });

  document.getElementById('btnTabSequencer').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('sequencerContent').style.display = 'block';
    document.getElementById('btnTabSequencer').classList.add('active');
    updateControlRoomStatus();
  });

  document.getElementById('btnTabSong').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('songContent').style.display = 'block';
    document.getElementById('btnTabSong').classList.add('active');
    updateControlRoomStatus();
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
    { id:'osc1_shape',      name:'Osc1 Shape',        short:'o1sh', section:'osc', cc:19, default:0 },
    { id:'osc1_semitone',   name:'Osc1 Semitone',     short:'o1st', section:'osc', cc:20, default:64, bipolar:true },
    { id:'osc1_keyflw',     name:'Osc1 Key Flw',      short:'o1ky', section:'osc', cc:21, default:64 },
    { id:'osc1_vel',        name:'Vel>Osc1',          short:'v>o1', section:'osc', cc:22, default:64, bipolar:true },
    { id:'osc1_subshape',   name:'Sub Osc Shape',     short:'sbsh', section:'osc', cc:23, default:0 },

    // Oscillator 2
    { id:'osc2_wave',       name:'Osc2 Waveform',     short:'o2wv', section:'osc', cc:24, default:0 },
    { id:'osc2_pw',         name:'Osc2 Pulsewidth',   short:'o2pw', section:'osc', cc:25, default:64 },
    { id:'osc2_shape',      name:'Osc2 Shape',        short:'o2sh', section:'osc', cc:26, default:0 },
    { id:'osc2_semitone',   name:'Osc2 Semitone',     short:'o2st', section:'osc', cc:27, default:64, bipolar:true },
    { id:'osc2_keyflw',     name:'Osc2 Key Flw',      short:'o2ky', section:'osc', cc:28, default:64 },
    { id:'osc2_vel',        name:'Vel>Osc2',          short:'v>o2', section:'osc', cc:29, default:64, bipolar:true },

    // Shared Detune & Balance
    { id:'osc_detune',      name:'Osc Detune',        short:'det',  section:'osc', cc:30, default:0 },
    { id:'osc_balance',     name:'Osc Balance',       short:'bal',  section:'osc', cc:31, default:64, bipolar:true },

    // Oscillator 3
    { id:'osc3_semi',       name:'Osc3 Semitone',     short:'o3st', section:'osc', cc:100, default:64, bipolar:true },
    { id:'osc3_detune',     name:'Osc3 Detune',       short:'o3dt', section:'osc', cc:101, default:64, bipolar:true },

    // Unison
    { id:'uni_detune',      name:'Unison Detune',     short:'udt',  section:'osc', cc:102, default:0 },
    { id:'uni_pan',         name:'Unison Pan',        short:'upn',  section:'osc', cc:103, default:127 },
    { id:'uni_lfophs',      name:'Unison LFO Phs',    short:'lfoP', section:'osc', cc:115, default:0 },

    // Common
    { id:'com_sync',        name:'Osc Sync',          short:'snc',  section:'osc', cc:104, default:0 }, // Sync mode button
    { id:'com_syncamt',     name:'Sync Amt',          short:'syam', section:'osc', cc:116, default:0 },
    { id:'com_envosc',      name:'Env>Osc2',          short:'eno',  section:'osc', cc:105, default:64, bipolar:true },
    { id:'com_phase',       name:'Phase Init',        short:'phi',  section:'osc', cc:106, default:0 },
    { id:'com_porta',       name:'Portamento',        short:'prt',  section:'osc', cc:5,   default:0 }, // Standard CC 5
    { id:'com_velpw',       name:'Vel>PW',            short:'v>pw', section:'osc', cc:117, default:64, bipolar:true },
    { id:'com_velsync',     name:'Vel>Sync',          short:'v>sy', section:'osc', cc:118, default:64, bipolar:true },
    { id:'com_envsync',     name:'Env>Sync',          short:'e>sy', section:'osc', cc:119, default:64, bipolar:true },
    { id:'com_fmmode',      name:'FM Mode',           short:'fmmd', section:'osc', cc:120, default:0 },
    { id:'com_fmamt',       name:'FM Amount',         short:'fmam', section:'osc', cc:121, default:0 },

    // Noise & Punch
    { id:'noise_color',     name:'Noise Color',       short:'ncl',  section:'osc', cc:107, default:64, bipolar:true },
    { id:'punch_int',       name:'Punch Intensity',   short:'pnc',  section:'osc', cc:108, default:0 },

    // Mixer
    { id:'mix_osc12',       name:'Osc1/2 Bal',        short:'m12',  section:'osc', cc:109, default:64, bipolar:true },
    { id:'mix_oscvol',      name:'Osc Vol (Sat)',     short:'mov',  section:'osc', cc:110, default:127 },
    { id:'mix_osc3',        name:'Osc3 Vol',          short:'mo3',  section:'osc', cc:111, default:0 },
    { id:'mix_noise',       name:'Noise Vol',         short:'mnv',  section:'osc', cc:112, default:0 },
    { id:'mix_sub',         name:'Sub Osc Vol',       short:'msb',  section:'osc', cc:113, default:0 },
    { id:'mix_ring',        name:'Ring Mod Vol',      short:'mrg',  section:'osc', cc:114, default:0 },

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
  const midiStats = {
    rx: 0,
    tx: 0,
    cc: 0,
    sysex: 0,
    last: 'none',
    lastAction: 'idle'
  };

  const LIB_KEY = 'virusTiSnow_patchLibrary';
  const MULTI_LIB_KEY = 'virusTiSnow_multiLibrary';
  const THEME_KEY = 'virusTiSnow_theme';

  // ---------------------------------------------------------------------
  // Theme toggle (persisted in localStorage)
  // ---------------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme){
    if (theme === 'elektron'){
      document.documentElement.setAttribute('data-skin', 'elektron');
      themeToggle.textContent = '●';
    } else {
      document.documentElement.setAttribute('data-skin', 'te');
      themeToggle.textContent = '○';
    }
    if (typeof initElektronLcd === 'function') initElektronLcd();
  }

  let currentTheme = localStorage.getItem(THEME_KEY) || 'te';
  if (currentTheme === 'light' || currentTheme === 'dark') currentTheme = 'elektron';
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = (currentTheme === 'te') ? 'elektron' : 'te';
    localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme(currentTheme);
  });

  // ---------------------------------------------------------------------
  // Accent color picker (persisted in localStorage)
  // ---------------------------------------------------------------------
  const ACCENT_KEY = 'virusTiSnow_accent';
  const LIGHT_LIMIT_KEY = 'virusTiSnow_lightLimit';
  const accentPicker = document.getElementById('accentPicker');
  const accentDots = Array.from(accentPicker.children);
  const lightLimiter = document.getElementById('lightLimiter');
  const lightLimitSteps = lightLimiter ? Array.from(lightLimiter.querySelectorAll('.light-limit-step')) : [];
  let currentLightLimit = parseFloat(localStorage.getItem(LIGHT_LIMIT_KEY) || '0.65');

  function applyLightLimit(limit){
    currentLightLimit = Math.max(0.25, Math.min(1, Number(limit) || 0.65));
    const halo = Math.round(5 + currentLightLimit * 15);
    document.documentElement.style.setProperty('--light-limit', currentLightLimit.toFixed(2));
    document.documentElement.style.setProperty('--led-halo', halo + 'px');
    document.documentElement.style.setProperty('--led-halo-soft', Math.round(halo * 2.2) + 'px');
    document.documentElement.style.setProperty('--led-halo-small', Math.max(2, Math.round(halo * 0.45)) + 'px');
    document.documentElement.style.setProperty('--led-core', currentLightLimit.toFixed(2));
    lightLimitSteps.forEach(step => {
      const stepValue = parseFloat(step.getAttribute('data-limit') || '0');
      step.classList.toggle('active', Math.abs(stepValue - currentLightLimit) < 0.02);
    });
    localStorage.setItem(LIGHT_LIMIT_KEY, String(currentLightLimit));
    if (typeof initElektronLcd === 'function') initElektronLcd();
    if (typeof drawLfoGraph === 'function') drawLfoGraph();
    if (typeof drawEnvGraph === 'function') drawEnvGraph();
    partDisplays.forEach(d => d._render());
  }

  function limitedGlow(base){
    return Math.max(0, base * currentLightLimit);
  }

  function applyAccent(color){
    document.documentElement.style.setProperty('--accent', color);
    accentDots.forEach(dot => {
      dot.classList.toggle('selected', dot.getAttribute('data-accent') === color);
    });
    partDisplays.forEach(d => d._render());
  }

  let currentAccent = localStorage.getItem(ACCENT_KEY) || '#00ffff';
  applyLightLimit(currentLightLimit);
  applyAccent(currentAccent);

  accentDots.forEach(dot => {
    dot.addEventListener('click', () => {
      currentAccent = dot.getAttribute('data-accent');
      localStorage.setItem(ACCENT_KEY, currentAccent);
      applyAccent(currentAccent);
    });
  });

  lightLimitSteps.forEach(step => {
    step.addEventListener('click', () => {
      applyLightLimit(parseFloat(step.getAttribute('data-limit') || '0.65'));
    });
  });



  // ---------------------------------------------------------------------
  // MIDI setup
  // ---------------------------------------------------------------------
  const inSelect = document.getElementById('midiInSelect');
  const outSelect = document.getElementById('midiOutSelect');
  const chanSelect = document.getElementById('midiChannel');
  const devIdSelect = document.getElementById('deviceIdSelect');
  const connDot = document.getElementById('connDot');
  const connLabel = document.getElementById('connLabel');
  const opsMidi = document.getElementById('opsMidi');
  const opsMode = document.getElementById('opsMode');
  const opsChannel = document.getElementById('opsChannel');
  const opsDevice = document.getElementById('opsDevice');
  const opsLastAction = document.getElementById('opsLastAction');
  const midiDiagnostics = document.getElementById('midiDiagnostics');
  const diagRx = document.getElementById('diagRx');
  const diagTx = document.getElementById('diagTx');
  const diagCc = document.getElementById('diagCc');
  const diagSysex = document.getElementById('diagSysex');
  const diagLastMidi = document.getElementById('diagLastMidi');
  const settingsModal = document.getElementById('settingsModal');
  const btnSettings = document.getElementById('btnSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');

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
  }

  function updateControlRoomStatus(){
    const outConnected = !!(selectedOutput && selectedOutput.state === 'connected');
    const inConnected = !!(selectedInput && selectedInput.state === 'connected');
    const activeTab = document.querySelector('.segmented-tab.active');
    const activeMode = activeTab ? activeTab.textContent.trim().toLowerCase() : 'single';
    const deviceValue = devIdSelect.value === '16'
      ? 'omni'
      : 'id ' + (parseInt(devIdSelect.value, 10) + 1);

    if (opsMode) opsMode.textContent = activeMode;
    if (opsChannel) opsChannel.textContent = 'ch ' + chanSelect.value;
    if (opsDevice) opsDevice.textContent = deviceValue;

    if (!opsMidi) return;
    opsMidi.classList.toggle('connected', outConnected || inConnected);
    if (outConnected && inConnected) {
      opsMidi.textContent = 'in/out ready';
    } else if (outConnected) {
      opsMidi.textContent = 'out ready';
    } else if (inConnected) {
      opsMidi.textContent = 'in ready';
    } else if (midiAccess) {
      opsMidi.textContent = 'no port selected';
    } else {
      opsMidi.textContent = 'unavailable';
    }
  }

  function updateMidiDiagnostics(){
    if (diagRx) diagRx.textContent = String(midiStats.rx);
    if (diagTx) diagTx.textContent = String(midiStats.tx);
    if (diagCc) diagCc.textContent = String(midiStats.cc);
    if (diagSysex) diagSysex.textContent = String(midiStats.sysex);
    if (diagLastMidi) diagLastMidi.textContent = midiStats.last;
    if (opsLastAction) opsLastAction.textContent = midiStats.lastAction;
  }

  function setLastAction(label){
    midiStats.lastAction = label;
    updateMidiDiagnostics();
  }

  function openSettingsModal(){
    if (!settingsModal) return;
    settingsModal.classList.add('open');
    btnSettings?.setAttribute('aria-expanded', 'true');
    setLastAction('midi settings open');
    inSelect?.focus();
  }

  function closeSettingsModal(){
    if (!settingsModal) return;
    settingsModal.classList.remove('open');
    btnSettings?.setAttribute('aria-expanded', 'false');
  }

  btnSettings?.addEventListener('click', openSettingsModal);
  btnCloseSettings?.addEventListener('click', closeSettingsModal);
  settingsModal?.addEventListener('click', (event) => {
    if (event.target === settingsModal) closeSettingsModal();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsModal?.classList.contains('open')) {
      closeSettingsModal();
    }
  });

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
    updateControlRoomStatus();
  }

  function handleIncomingMidi(event) {
    const bytes = event.data;
    midiStats.rx++;

    // Ignora il Clock (F8) e Active Sensing (FE) per non intasare il debug
    if (bytes[0] !== 0xF8 && bytes[0] !== 0xFE) {
       const hexStr = Array.from(bytes).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
       document.getElementById('midi-debug').textContent = 'MIDI: ' + hexStr;
       midiStats.last = hexStr;
       updateMidiDiagnostics();
    }

    // --- RICEZIONE CC (Control Change) ---
    // 0xB0 a 0xBF (176-191) sono i messaggi CC per i canali MIDI da 1 a 16
    if ((bytes[0] & 0xF0) === 0xB0 && bytes.length === 3) {
      midiStats.cc++;
      updateMidiDiagnostics();
      const ccNumber = bytes[1];
      const ccValue = bytes[2];
      const param = PARAMS.find(p => p.cc === ccNumber);
      if (param) {
        patch[param.id] = ccValue;
        if (knobRefs[param.id]) knobRefs[param.id]._render();
        if (typeof initElektronLcd === 'function') initElektronLcd();
      }
      return; // Finito con questo pacchetto (era un CC)
    }

    // --- RICEZIONE SYSEX (Dump e parametri estesi) ---
    // A volte le interfacce MIDI uniscono più messaggi in un solo buffer.
    // Separiamo i messaggi usando F7 (End of SysEx) come delimitatore.
    let sysexMessages = [];
    let currentMsg = [];
    let inSysex = false;

    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0xF0) {
        inSysex = true;
        currentMsg = [0xF0];
      } else if (inSysex) {
        currentMsg.push(bytes[i]);
        if (bytes[i] === 0xF7) {
          sysexMessages.push(new Uint8Array(currentMsg));
          midiStats.sysex++;
          updateMidiDiagnostics();
          inSysex = false;
          currentMsg = [];
        }
      }
    }

    // Processa ogni messaggio SysEx trovato
    for (const msgBytes of sysexMessages) {
      // Un Single Patch Dump del Virus TI è di circa 267 bytes
      if (msgBytes.length > 250) {
        if (window.multiFetchState && window.multiFetchState.active) {
          window.multiFetchState.dumps[window.multiFetchState.currentPart] = Array.from(msgBytes);
          document.getElementById('midi-debug').textContent = '🔥 MULTI FETCH: Part ' + (window.multiFetchState.currentPart + 1) + '/4 ricevuto...';

          window.multiFetchState.currentPart++;
          if (window.multiFetchState.currentPart < 4) {
            setTimeout(() => { requestDump(window.multiFetchState.currentPart); }, 50);
          } else {
            finishMultiFetch();
          }
          continue;
        }

        if (window.bankFetchState && window.bankFetchState.active) {
          // --- RAW DUMP CAPTURE FOR BANK FETCHER (READ OR CAPTURE) ---
          let patchName = "";
          // Nello standard Virus C/TI il nome è solitamente verso la fine
          // Cerchiamo di estrarlo dai byte validi
          for (let i = msgBytes.length - 20; i < msgBytes.length - 1; i++) {
            if (i > 0 && msgBytes[i] >= 32 && msgBytes[i] <= 126) {
              patchName += String.fromCharCode(msgBytes[i]);
            }
          }
          patchName = patchName.trim();

          const bState = window.bankFetchState;

          // Calcola a quale banco appartiene questa patch
          const totalReceived = bState.readPatches.length;
          const patchNum = totalReceived % 128;
          let currentBankName = bState.bankName;

          const bankOffset = Math.floor(totalReceived / 128);
          if (bankOffset > 0) {
            const match = bState.bankName.match(/^([A-Z]+)\s+(\d+)$/i);
            if (match) {
              const prefix = match[1];
              const num = parseInt(match[2], 10);
              currentBankName = `${prefix} ${num + bankOffset}`;
            }
          }

          const finalName = patchName ? `${currentBankName}-${patchNum.toString().padStart(3,'0')} ${patchName}` : `${currentBankName}-${patchNum.toString().padStart(3,'0')} Empty`;

          if (bState.mode === 'capture') {
            const lib = loadLibrary();
            lib[finalName] = Array.from(msgBytes);
            saveLibrary(lib);
            document.getElementById('midi-debug').textContent = `🔥 BANK CAPTURE: Salvato ${finalName}... (${totalReceived + 1} ricevute)`;
          } else {
            document.getElementById('midi-debug').textContent = `🔥 BANK READ: Letto ${finalName}... (${totalReceived + 1} ricevute)`;
          }

          if (!bState.readPatches.includes(finalName)) {
            bState.readPatches.push(finalName);
          }

          if (bState.timeoutId) clearTimeout(bState.timeoutId);

          // Continua a ricevere fino a quando il Virus non smette di trasmettere (timeout di 3 secondi)
          bState.timeoutId = setTimeout(() => {
             finishBankOperation();
          }, 3000);
          continue;
        }

        // --- RAW DUMP CAPTURE FOR LIBRARIAN ---
        window.lastReceivedDump = new Uint8Array(msgBytes);

        // HACKER MODE: Estraiamo il NOME DELLA PATCH
        let patchName = "";
        for (let i = msgBytes.length - 20; i < msgBytes.length - 1; i++) {
          if (i > 0 && msgBytes[i] >= 32 && msgBytes[i] <= 126) {
            patchName += String.fromCharCode(msgBytes[i]);
          }
        }
        patchName = patchName.trim();
        document.getElementById('patchNameDisplay').textContent = 'virus ti snow // PATCH: ' + patchName;
        const pInput = document.getElementById('patchName');
        if (pInput) pInput.value = patchName;

        document.getElementById('midi-debug').textContent = '🔥 DUMP IMPORTATO: ' + patchName;
        setLastAction('single dump received');
        continue;
      }

      // Altri messaggi SysEx (Parametri singoli)
      if (msgBytes.length >= 7 &&
          msgBytes[1] === 0x00 && msgBytes[2] === 0x20 && msgBytes[3] === 0x33 && msgBytes[4] === 0x01) {

        const devId = msgBytes[5];
        const cmd = msgBytes[6];

        if (devId === deviceId() || devId === 0x10) {
           // Cambio singolo parametro
           if (cmd === 0x01 && msgBytes.length === 10) {
             const cc = msgBytes[7];
             const value = msgBytes[8];
             const param = PARAMS.find(p => p.cc === cc);
             if (param) {
               patch[param.id] = value;
               if (knobRefs[param.id]) knobRefs[param.id]._render();
             }
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
  chanSelect.addEventListener('change', updateControlRoomStatus);
  devIdSelect.addEventListener('change', updateControlRoomStatus);

  if (navigator.requestMIDIAccess){
    navigator.requestMIDIAccess({ sysex: true }).then(access => {
      midiAccess = access;
      refreshPorts();
      midiAccess.onstatechange = refreshPorts;
      updateControlRoomStatus();
    }).catch(err => {
      connLabel.textContent = 'midi unavailable';
      updateControlRoomStatus();
      console.error(err);
    });
  } else {
    connLabel.textContent = 'web midi not supported';
    updateControlRoomStatus();
  }

  // ---------------------------------------------------------------------
  // SysEx send
  // ---------------------------------------------------------------------
  function deviceId(){
    return parseInt(devIdSelect.value, 10); // 0-15 or 16 (Omni)
  }

  function hexBytes(bytes){
    return Array.from(bytes).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
  }

  function recordMidiTx(label, bytes){
    midiStats.tx++;
    midiStats.last = label || hexBytes(bytes);
    midiStats.lastAction = 'tx: ' + (label || 'midi');
    updateMidiDiagnostics();
  }

  function sendMidiBytes(bytes, label){
    if (!selectedOutput) {
      setLastAction('connect midi output first');
      return false;
    }
    selectedOutput.send(bytes);
    recordMidiTx(label, bytes);
    return true;
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
    const paramDef = typeof param === 'string' ? PARAMS.find(p => p.id === param) : param;
    if (!paramDef) return;
    if (selectedOutput){
      try{
        if (paramDef.cc !== undefined && paramDef.cc < 120) {
          // Send standard MIDI CC
          const channel = parseInt(document.getElementById('midiChannel').value, 10) - 1;
          const bytes = new Uint8Array([0xB0 | channel, paramDef.cc, value & 0x7F]);
          selectedOutput.send(bytes);
          recordMidiTx('cc ' + paramDef.cc, bytes);
        } else {
          // Fallback to SysEx if no standard CC exists
          const bytes = buildSysEx(paramDef.cc, value);
          selectedOutput.send(bytes);
          recordMidiTx('sysex param ' + paramDef.short, bytes);
        }
      } catch(e){ console.error('MIDI send error', e); }
    } else {
      setLastAction('connect midi output first');
    }
  }

  function sendFullPatch(p){
    PARAMS.forEach((param, i) => {
      setTimeout(() => sendParam(param, p[param.id]), i * 15);
    });
  }

  // ---------------------------------------------------------------------

  // Send standard MIDI CC
  function sendCC(channel, cc, value) {
    if (selectedOutput) {
      try {
        const chanByte = 0xB0 | ((channel - 1) & 0x0F);
        const bytes = new Uint8Array([chanByte, cc & 0x7F, value & 0x7F]);
        selectedOutput.send(bytes);
        recordMidiTx('cc ' + cc, bytes);
      } catch (e) { console.error('MIDI sendCC error', e); }
    } else {
      setLastAction('connect midi output first');
    }
  }

  // Multi mode SysEx send
  // ---------------------------------------------------------------------
  function sendMultiPartParam(partIndex, cc, value){
    if (selectedOutput){
      try{
        const bytes = new Uint8Array([
          ...SYSEX_PREFIX, deviceId(), SYSEX_CMD_MULTI, partIndex & 0x7F, cc & 0x7F, value & 0x7F, 0xF7
        ]);
        selectedOutput.send(bytes);
        recordMidiTx('multi p' + (partIndex + 1) + ' param ' + cc, bytes);
      } catch(e){ console.error('MIDI send error', e); }
    } else {
      setLastAction('connect midi output first');
    }
  }

  // per-part full sound editor: addresses the part via the device-id byte
  function sendPartSoundParam(partIndex, cc, value){
    if (selectedOutput){
      try{
        const bytes = new Uint8Array([
          ...SYSEX_PREFIX, partIndex & 0x7F, SYSEX_CMD_PARAM, cc & 0x7F, value & 0x7F, 0xF7
        ]);
        selectedOutput.send(bytes);
        recordMidiTx('part p' + (partIndex + 1) + ' param ' + cc, bytes);
      } catch(e){ console.error('MIDI send error', e); }
    } else {
      setLastAction('connect midi output first');
    }
  }

  // ---------------------------------------------------------------------
  // Knob UI — thin-stroke circle with a single radial indicator line
  // showing the current value (-135deg to +135deg sweep, 0deg = up).
  // ---------------------------------------------------------------------
  function createKnobGeneric(opts){
    const container = document.createElement('div');
    container.className = 'chassis-knob-container';

    const outer = document.createElement('div');
    outer.className = 'chassis-knob-outer';

    const ring = document.createElement('div');
    ring.className = 'chassis-knob-ring';

    const inner = document.createElement('div');
    inner.className = 'chassis-knob-inner';

    const top = document.createElement('div');
    top.className = 'chassis-knob-top';

    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'chassis-knob-indicator-container';

    const indicator = document.createElement('div');
    indicator.className = 'chassis-knob-indicator';

    indicatorContainer.appendChild(indicator);
    top.appendChild(indicatorContainer);
    inner.appendChild(top);
    outer.appendChild(ring);
    outer.appendChild(inner);

    const label = document.createElement('div');
    label.className = 'chassis-knob-label';
    label.textContent = opts.label;

    container.appendChild(outer);
    container.appendChild(label);

    function render(){
      const value = opts.getValue();
      const pct = value / 127;
      const angle = -135 + (pct * 270);
      indicatorContainer.style.transform = `rotate(${angle}deg)`;

      const startAngle = 225;
      const fillAngle = pct * 270;
      ring.style.background = `conic-gradient(from ${startAngle}deg, var(--accent) 0deg, var(--accent) ${fillAngle}deg, transparent ${fillAngle}deg)`;
    }

    function setValue(value, send, setOpts){
      value = Math.max(0, Math.min(127, Math.round(value)));
      const changed = opts.getValue() !== value;
      opts.setValue(value, send);
      render();
    }

    // drag interaction
    let dragging = false;
    let startY = 0;
    let startVal = 0;

    outer.addEventListener('pointerdown', (e) => {
      dragging = true;
      startY = e.clientY;
      startVal = opts.getValue();
      outer.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    outer.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      setValue(startVal + dy * 0.7, true);
    });

    function endDrag(e){
      dragging = false;
    }
    outer.addEventListener('pointerup', endDrag);
    outer.addEventListener('pointercancel', endDrag);

    // double-click resets to default
    outer.addEventListener('dblclick', () => {
      setValue(opts.default, true);
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
        if (typeof initElektronLcd === 'function') initElektronLcd();
      }
    });
  }

  const knobRefs = {};

  // --- Graph rendering functions ---

  // --- Graph rendering functions ---
  function initLfoGraph() {
    const canvas = document.getElementById('lfoGraph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw(t) {
      if (!canvas.offsetParent) { requestAnimationFrame(draw); return; }
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const rateVal = patch['lfo1_rate'] || 64;
      const shapeVal = patch['lfo1_shape'] || 0;
      const freq = 0.05 + (rateVal / 127) * 0.5;
      const timeOffset = t * freq * 0.01;

      ctx.beginPath();
      ctx.strokeStyle = currentAccent;
      ctx.lineWidth = 2;
      ctx.shadowBlur = limitedGlow(10);
      ctx.shadowColor = currentAccent;

      for(let x = 0; x < w; x++) {
        const px = x / w;
        let py = 0;
        const phase = (px * Math.PI * 6 + timeOffset) % (Math.PI * 2);

        if (shapeVal < 20) {
          py = Math.sin(phase);
        } else if (shapeVal < 40) {
          py = (phase < Math.PI) ? (phase/(Math.PI/2) - 1) : (3 - phase/(Math.PI/2));
        } else if (shapeVal < 60) {
          py = 1 - (phase / Math.PI);
        } else if (shapeVal < 80) {
          py = (phase < Math.PI) ? 1 : -1;
        } else {
          const steps = 6;
          py = Math.sin(Math.floor(phase * steps) / steps);
        }

        const y = h/2 - py * (h * 0.35);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function initEnvGraph() {
    const canvas = document.getElementById('envGraph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      if (!canvas.offsetParent) { requestAnimationFrame(draw); return; }
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const A = (patch['amp_attack'] || 0) / 127;
      const D = (patch['amp_decay'] || 0) / 127;
      const S = (patch['amp_sustain'] !== undefined ? patch['amp_sustain'] : 127) / 127;
      const R = (patch['amp_release'] || 0) / 127;

      const pad = 16;
      const effW = w - pad*2;
      const effH = h - pad*2;

      const totalTime = Math.max(0.1, A + D + R + 0.5);
      const ax = pad + (A / totalTime) * effW;
      const dx = ax + (D / totalTime) * effW;
      const sx = dx + (0.5 / totalTime) * effW;
      const rx = sx + (R / totalTime) * effW;

      const sy = pad + (1 - S) * effH;

      ctx.beginPath();
      ctx.strokeStyle = currentAccent;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.shadowBlur = limitedGlow(12);
      ctx.shadowColor = currentAccent;

      ctx.moveTo(pad, h - pad);
      ctx.lineTo(ax, pad);
      ctx.lineTo(dx, sy);
      ctx.lineTo(sx, sy);
      ctx.lineTo(rx, h - pad);
      ctx.stroke();

      ctx.lineTo(rx, h);
      ctx.lineTo(pad, h);
      ctx.closePath();
      ctx.fillStyle = currentAccent + '33';
      ctx.shadowBlur = 0;
      ctx.fill();

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }



// --- ELEKTRON PAGES DEFINITION ---
const PAGES = {
  'OSC 1': ['osc1_shape', 'osc1_semitone', 'osc1_pw', 'osc_detune', 'osc1_subshape', 'osc1_keyflw', 'osc1_vel', 'mix_oscvol'],
  'OSC 2': ['osc2_shape', 'osc2_semitone', 'osc2_pw', 'osc_balance', 'com_fmamt', 'com_sync', 'osc2_vel', 'mix_osc12'],
  'OSC 3 / NOISE': ['osc3_semi', 'osc3_detune', 'mix_osc3', 'noise_color', 'mix_noise', 'mix_sub', 'mix_ring', 'punch_int'],
  'FILTER': ['f1_cutoff', 'f1_resonance', 'f1_mode', 'f1_envamt', 'f1_keytrack', null, null, null],
  'AMP': ['amp_attack', 'amp_decay', 'amp_sustain', 'amp_release', 'com_porta', null, null, null],
  'LFO 1': ['lfo1_rate', 'lfo1_shape', null, null, null, null, null, null],
  'FX': ['fx_chorus_mix', 'fx_chorus_rate', 'fx_delay_time', 'fx_delay_feedback', null, null, null, null]
};

let currentPage = 'OSC 1';
let hwEncoders = [];

  function buildSingleView(){
    const root = document.getElementById('singleView');
    root.innerHTML = '';

    const elektronWrapper = document.createElement('div');
    elektronWrapper.className = 'hardware-chassis';

    const tlScrew = document.createElement('div'); tlScrew.className = 'chassis-screw screw-tl';
    const trScrew = document.createElement('div'); trScrew.className = 'chassis-screw screw-tr';
    const blScrew = document.createElement('div'); blScrew.className = 'chassis-screw screw-bl';
    const brScrew = document.createElement('div'); brScrew.className = 'chassis-screw screw-br';
    const logo = document.createElement('div'); logo.className = 'chassis-logo';
    logo.textContent = 'VIRUS-H';

    elektronWrapper.appendChild(tlScrew);
    elektronWrapper.appendChild(trScrew);
    elektronWrapper.appendChild(blScrew);
    elektronWrapper.appendChild(brScrew);
    elektronWrapper.appendChild(logo);

    const innerLayout = document.createElement('div');
    innerLayout.style.display = 'flex';
    innerLayout.style.flexDirection = 'row';
    innerLayout.style.gap = '60px';
    innerLayout.style.alignItems = 'flex-start';
    innerLayout.style.justifyContent = 'center';
    innerLayout.style.flexWrap = 'wrap';
    innerLayout.style.marginTop = '40px';
    innerLayout.style.width = '100%';
    innerLayout.style.zIndex = '1';

    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.gap = '20px';
    leftCol.style.alignItems = 'center';

    const rightCol = document.createElement('div');
    rightCol.style.display = 'flex';
    rightCol.style.flexDirection = 'column';
    rightCol.style.justifyContent = 'center';

    root.appendChild(elektronWrapper);
    elektronWrapper.appendChild(innerLayout);
    innerLayout.appendChild(leftCol);
    innerLayout.appendChild(rightCol);

    // --- Elektron Global LCD ---
    const screenRecess = document.createElement('div');
    screenRecess.className = 'chassis-screen-recess';

    const elektronLcd = document.createElement('canvas');
    elektronLcd.id = 'elektronLcd';
    elektronLcd.style.width = '100%';
    elektronLcd.style.maxWidth = '500px';
    elektronLcd.style.height = '240px';
    elektronLcd.style.background = 'transparent';
    elektronLcd.style.display = 'block';

    screenRecess.appendChild(elektronLcd);
    leftCol.appendChild(screenRecess);

    // --- Page Buttons ---
    const pageNav = document.createElement('div');
    pageNav.style.display = 'flex';
    pageNav.style.gap = '8px';
    pageNav.style.flexWrap = 'wrap';
    pageNav.style.justifyContent = 'center';
    pageNav.style.marginTop = '10px';

    const pageKeys = Object.keys(PAGES);
    pageKeys.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'chassis-page-btn';
      btn.textContent = p;
      if (p === currentPage) btn.classList.add('active');
      btn.onclick = () => {
        pageNav.querySelectorAll('.chassis-page-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPage = p;
        updateHwEncoders();
        initElektronLcd();
      };
      pageNav.appendChild(btn);
    });

    leftCol.appendChild(pageNav);

    // --- Hardware Encoders (4x2 Grid) ---
    const encoderGrid = document.createElement('div');
    encoderGrid.id = 'encoderGrid';
    encoderGrid.style.display = 'grid';
    encoderGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    encoderGrid.style.gap = '30px 50px';
    encoderGrid.style.marginTop = '10px';
    rightCol.appendChild(encoderGrid);

    // --- Wood strip ---
    const woodStrip = document.createElement('div');
    woodStrip.className = 'chassis-wood-strip';
    elektronWrapper.appendChild(woodStrip);

    // I macro knobs in basso
    const macrosContainer = document.createElement('div');
    macrosContainer.className = 'single-macros';

    const macrosDiv = document.createElement('div');
    macrosDiv.id = 'globalMacroKnobs';
    macrosDiv.style.display = 'flex';
    macrosDiv.style.flexWrap = 'wrap';
    macrosDiv.style.justifyContent = 'center';
    macrosDiv.style.gap = '30px';
    macrosDiv.style.width = '100%';

    macrosContainer.appendChild(macrosDiv);
    rightCol.appendChild(macrosContainer);

    // We will let the bottom initialization populate this div

    updateHwEncoders();
    initElektronLcd();

    // --- LCD DRAG INTERACTIVITY ---
    let activeParam = null;
    let startY = 0;
    let startVal = 0;

    elektronLcd.addEventListener('mousedown', (e) => {
      const rect = elektronLcd.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const colWidth = rect.width / 4;
      const rowHeight = rect.height / 2;

      const col = Math.floor(x / colWidth);
      const row = Math.floor(y / rowHeight);

      const index = row * 4 + col;
      const paramId = PAGES[currentPage][index];

      if (paramId) {
        activeParam = PARAMS.find(p => p.id === paramId);
        if (activeParam) {
           window.activeParam = activeParam;
           startY = e.clientY;
           startVal = patch[paramId] !== undefined ? patch[paramId] : activeParam.default;
           document.body.style.cursor = 'ns-resize';
           initElektronLcd(); // re-render to show active state if needed
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!activeParam) return;
      const dy = startY - e.clientY;
      let newVal = startVal + dy;
      if(newVal < 0) newVal = 0;
      if(newVal > 127) newVal = 127;

      patch[activeParam.id] = newVal;

      // Update hardware encoder if visible
      // Since createKnob handles its own DOM, we should call refreshAllKnobs()
      if (typeof refreshAllKnobs === 'function') refreshAllKnobs();

      sendParam(activeParam.id, newVal);
      initElektronLcd();
    });

    window.addEventListener('mouseup', () => {
      if (activeParam) {
        activeParam = null;
        window.activeParam = null;
        document.body.style.cursor = 'default';
        initElektronLcd();
      }
    });

    elektronLcd.addEventListener('touchstart', (e) => {
       // Omitted for brevity, will implement later or mapping
    });
  }

  function updateHwEncoders() {
    const encoderGrid = document.getElementById('encoderGrid');
    if (!encoderGrid) return;
    encoderGrid.innerHTML = '';

    const currentParams = PAGES[currentPage];
    for(let i=0; i<8; i++) {
      const paramId = currentParams[i];
      if (paramId) {
        const pDef = PARAMS.find(p => p.id === paramId);
        if (pDef) {
          const knob = createKnob(pDef);
          knobRefs[paramId] = knob;
          encoderGrid.appendChild(knob);
        } else {
          const placeholder = document.createElement('div');
          encoderGrid.appendChild(placeholder);
        }
      } else {
        const placeholder = document.createElement('div');
        encoderGrid.appendChild(placeholder);
      }
    }
  }

  // --- Refined Graph Rendering Functions (Fine Pixel-Art Style) ---
  function drawIconGuide(ctx, color){
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 0.6;
    ctx.setLineDash([1, 2]);
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawWav(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if(val < 32) {
      for(let x=-10; x<=10; x++) {
        const y = -7 * Math.sin((x / 10) * Math.PI);
        x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
    } else if(val < 64) {
      ctx.moveTo(-10, 7); ctx.lineTo(-5, -7); ctx.lineTo(0, 7); ctx.lineTo(5, -7); ctx.lineTo(10, 7);
    } else if(val < 96) {
      ctx.moveTo(-10, 7); ctx.lineTo(-3, -7); ctx.lineTo(-3, 7);
      ctx.moveTo(-3, 7); ctx.lineTo(4, -7); ctx.lineTo(4, 7);
      ctx.moveTo(4, 7); ctx.lineTo(10, -5);
    } else {
      ctx.moveTo(-10, 6); ctx.lineTo(-10, -6); ctx.lineTo(-2, -6); ctx.lineTo(-2, 6);
      ctx.lineTo(6, 6); ctx.lineTo(6, -6); ctx.lineTo(10, -6);
    }
    ctx.stroke();
  }

  function drawPd(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    const pw = -7 + (val / 127) * 14;
    ctx.moveTo(-10, 7); ctx.lineTo(-10, -7); ctx.lineTo(pw, -7); ctx.lineTo(pw, 7); ctx.lineTo(10, 7);
    ctx.stroke();
    ctx.setLineDash([1, 2]);
    ctx.beginPath();
    ctx.moveTo(pw, -9); ctx.lineTo(pw, 9);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pw - 2, -9); ctx.lineTo(pw, -7); ctx.lineTo(pw + 2, -9);
    ctx.moveTo(pw - 2, 9); ctx.lineTo(pw, 7); ctx.lineTo(pw + 2, 9);
    ctx.stroke();
  }

  function drawEnv(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const peakX = -6 + (val/127)*8;
    ctx.moveTo(-10, 8); ctx.lineTo(peakX, -8); ctx.lineTo(2, -2); ctx.lineTo(6, -2); ctx.lineTo(10, 8);
    ctx.stroke();
    // Tiny dots at ADSR points
    ctx.fillStyle = color;
    [[-10,8],[peakX,-8],[2,-2],[6,-2],[10,8]].forEach(([x,y])=>{
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill();
    });
  }

  function drawLfo(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI*2);
    ctx.stroke();
    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI*2);
    ctx.stroke();
    // Needle
    const angle = -Math.PI/2 + (val/127) * Math.PI * 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle)*8, Math.sin(angle)*8);
    ctx.stroke();
    // Center dot
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI*2); ctx.fill();
    // Tick marks
    for(let i=0; i<8; i++) {
      const a = (i/8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*7.5, Math.sin(a)*7.5);
      ctx.lineTo(Math.cos(a)*9, Math.sin(a)*9);
      ctx.stroke();
    }
  }

  function drawTune(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    const pitchX = -8 + (val / 127) * 16;
    ctx.beginPath();
    ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      const x = i * 4;
      ctx.beginPath();
      ctx.moveTo(x, -1.5); ctx.lineTo(x, 1.5);
      ctx.stroke();
    }
    ctx.setLineDash([1, 2]);
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pitchX, -8);
    ctx.lineTo(pitchX, 8);
    ctx.moveTo(pitchX - 2, -6); ctx.lineTo(pitchX, -8); ctx.lineTo(pitchX + 2, -6);
    ctx.moveTo(pitchX - 2, 6); ctx.lineTo(pitchX, 8); ctx.lineTo(pitchX + 2, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pitchX, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDetune(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    const offset = -4 + (val / 127) * 8;
    ctx.beginPath();
    for(let x=-10; x<=10; x++) {
      const y = -5 * Math.sin((x / 10) * Math.PI * 2);
      x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.globalAlpha = 0.62;
    for(let x=-10; x<=10; x++) {
      const y = -5 * Math.sin(((x + offset) / 10) * Math.PI * 2);
      x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(-8, 7, 1, 0, Math.PI * 2);
    ctx.arc(8, -7, 1, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawFilter(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawIconGuide(ctx, color);
    const cutoff = -7 + (val / 127) * 14;
    ctx.beginPath();
    ctx.moveTo(-10, -3);
    ctx.lineTo(cutoff - 2, -3);
    ctx.quadraticCurveTo(cutoff, -9, cutoff + 2, -1);
    ctx.lineTo(10, 8);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cutoff, -6.2, 1.4, 0, Math.PI * 2); ctx.fill();
  }

  function drawFx(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    ctx.save();
    ctx.rotate((val/127) * Math.PI * 0.5);

    // Outer diamond
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(9, 0); ctx.lineTo(0, 9); ctx.lineTo(-9, 0); ctx.closePath();
    ctx.stroke();
    // Inner diamond
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0); ctx.closePath();
    ctx.stroke();
    // Center dot
    const sz = (val/127) * 2.5;
    if(sz > 0.3) {
      ctx.beginPath(); ctx.arc(0, 0, sz, 0, Math.PI*2); ctx.fill();
    }
    // Corner dots
    ctx.globalAlpha = 0.5;
    [[-6,-6],[6,-6],[6,6],[-6,6]].forEach(([x,y])=>{
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawVolume(ctx, val, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    const level = val / 127;
    drawIconGuide(ctx, color);
    ctx.beginPath();
    ctx.rect(-9, -8, 18, 16);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const x = -6 + i * 3;
      const barH = 3 + Math.max(0, level - i * 0.16) * 14;
      ctx.globalAlpha = level > i * 0.16 ? 1 : 0.24;
      ctx.fillRect(x, 8 - barH, 1.8, barH);
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(-9, 9.5); ctx.lineTo(9, 9.5);
    ctx.stroke();
  }

  function initElektronLcd() {
    const canvas = document.getElementById('elektronLcd');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Clear background to show chassis recess glass effect
    ctx.clearRect(0, 0, w, h);

    // Scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for(let sy=0; sy<h; sy+=2) {
      ctx.fillRect(0, sy, w, 1);
    }

    const isTEBg = document.documentElement.getAttribute('data-skin') === 'te';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff9900';
    const mainColor = accent; // Copia il colore arancione degli altri visori

    const headerH = 46;
    const leftW = 86;

    ctx.fillStyle = mainColor;
    ctx.strokeStyle = mainColor;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = limitedGlow(2); // Glow OLED (limited)

    // --- Header ---
    ctx.font = '28px "VT323", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw A05 box
    ctx.fillText('A05', 18, 12);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(12, 8, 48, 30);
    ctx.setLineDash([]); // reset

    ctx.textAlign = 'left';
    ctx.font = '36px "VT323", monospace';
    const patchInput = document.getElementById('patchName');
    const pName = (patchInput && patchInput.value) ? patchInput.value.toUpperCase().substring(0, 10) : 'VIRUS TI';
    ctx.fillText(pName, 80, 6);

    ctx.textAlign = 'right';
    ctx.font = '28px "VT323", monospace';
    // Draw Menu icon
    const menuX = w - 120;
    ctx.lineWidth = 1;
    ctx.strokeRect(menuX, 12, 24, 22);
    ctx.beginPath(); ctx.moveTo(menuX + 4, 17); ctx.lineTo(menuX + 20, 17); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(menuX + 4, 22); ctx.lineTo(menuX + 20, 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(menuX + 4, 27); ctx.lineTo(menuX + 20, 27); ctx.stroke();

    // Tempo
    ctx.fillText('120.0', w - 16, 12);

    // Draw line separating header
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(w, headerH);
    ctx.stroke();

    // --- Left Column ---
    ctx.textAlign = 'center';

    // Page Name Box
    const pageParts = currentPage.split(' ');
    ctx.lineWidth = 1;
    ctx.strokeRect(12, headerH + 12, leftW - 24, 60);

    if (pageParts.length > 1) {
      ctx.font = '24px "VT323", monospace';
      ctx.fillText(pageParts[0], leftW / 2, headerH + 16);
      ctx.font = '36px "VT323", monospace';
      ctx.fillText(pageParts[1], leftW / 2, headerH + 34);
    } else {
      ctx.font = '28px "VT323", monospace';
      ctx.fillText(currentPage, leftW / 2, headerH + 26);
    }

    // Level meter "LEV"
    ctx.font = '22px "VT323", monospace';
    ctx.fillText('LEV', leftW / 2, h - 26);

    // Draw simple vertical meter with dotted sides like hardware
    const meterW = 20;
    const meterH = 50;
    const meterX = (leftW - meterW) / 2;
    const meterY = h - 86;
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meterW, meterH);

    // Dotted side pins
    ctx.beginPath();
    for(let i=0; i<6; i++) {
      let py = meterY + 4 + i*8;
      ctx.moveTo(meterX - 4, py); ctx.lineTo(meterX, py);
      ctx.moveTo(meterX + meterW, py); ctx.lineTo(meterX + meterW + 4, py);
    }
    ctx.stroke();

    // Mock level
    ctx.fillStyle = mainColor;
    ctx.fillRect(meterX + 4, meterY + meterH * 0.4, meterW - 8, meterH * 0.6 - 4);

    // Line separating left column
    ctx.beginPath();
    ctx.moveTo(leftW, headerH);
    ctx.lineTo(leftW, h);
    ctx.stroke();

    // --- 4x2 Grid ---
    const gridX = leftW;
    const gridY = headerH;
    const gridW = w - gridX;
    const gridH = h - gridY;
    const cellW = gridW / 4;
    const cellH = gridH / 2;

    const currentParams = PAGES[currentPage];

    for(let i=0; i<8; i++) {
       const paramId = currentParams[i];
       if(!paramId) continue;

       const pDef = PARAMS.find(p => p.id === paramId);
       if(!pDef) continue;

       const val = patch[paramId] !== undefined ? patch[paramId] : pDef.default;
       const col = i % 4;
       const row = Math.floor(i / 4);

       const cx = gridX + col * cellW;
       const cy = gridY + row * cellH;

       ctx.save();
       ctx.translate(cx, cy);

       // Highlight active
       if (window.activeParam && window.activeParam.id === paramId) {
         ctx.fillStyle = isTEBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
         ctx.fillRect(0, 0, cellW, cellH);
       }

       // Center rendering context for graphics
       ctx.save();
       ctx.translate(cellW/2, cellH/2 - 14);

       // Specific Graphics
       const idLower = paramId.toLowerCase();
       const drawColor = (window.activeParam && window.activeParam.id === paramId) ? accent : mainColor;

       ctx.save();
       ctx.scale(2.4, 2.4); // Scale up shapes to fill the cell better
       ctx.lineWidth = 1 / 2.4; // Linee fini come richiesto
       ctx.shadowColor = drawColor;
       ctx.shadowBlur = limitedGlow((window.activeParam && window.activeParam.id === paramId) ? 4 : 1);

       if (idLower.includes('wave') || idLower.includes('shape')) {
         drawWav(ctx, val, drawColor);
       } else if (idLower.includes('pw')) {
         drawPd(ctx, val, drawColor);
       } else if (idLower.includes('st') || idLower.includes('semi') || idLower.includes('key')) {
         drawTune(ctx, val, drawColor);
       } else if (idLower.includes('det')) {
         drawDetune(ctx, val, drawColor);
       } else if (idLower.includes('rate') || idLower.includes('time') || idLower.includes('spd') || idLower.includes('lfo')) {
         drawLfo(ctx, val, drawColor);
       } else if (idLower.includes('env') || idLower.includes('att') || idLower.includes('dec') || idLower.includes('sus') || idLower.includes('rel')) {
         drawEnv(ctx, val, drawColor);
       } else if (idLower.includes('flt') || idLower.includes('cut') || idLower.includes('res') || idLower.includes('type')) {
         drawFilter(ctx, val, drawColor);
       } else if (idLower.includes('vol') || idLower.includes('lev') || idLower.includes('bal') || idLower.includes('pan') || idLower.includes('vel')) {
         drawVolume(ctx, val, drawColor);
       } else {
         drawFx(ctx, val, drawColor); // Fallback to a nice generic FX icon
       }

       ctx.restore();
       ctx.restore();

       // Text label at bottom of cell
       ctx.save();
       ctx.translate(cellW/2, cellH - 12);
       ctx.fillStyle = mainColor;
       ctx.shadowColor = mainColor;
       ctx.shadowBlur = limitedGlow(2);
       ctx.font = '24px "VT323", monospace';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText(pDef.short.toUpperCase(), 0, 0);
       ctx.restore();

       ctx.restore();
    }
  }


  function refreshAllKnobs(){
    PARAMS.forEach(p => {
      if(knobRefs[p.id]) knobRefs[p.id]._render();
    });
    if (window.macroRefs) {
      window.macroRefs.forEach(m => m._render());
    }
    if (typeof initElektronLcd === 'function') initElektronLcd();
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
        document.getElementById('midi-debug').innerHTML = `<span style="color:#0f0;">✅ BANK CAPTURE: Completato! (${count} patch ricevute)</span>`;
        setLastAction('bank capture complete: ' + count);
      }
      updateBrowserView();
    } else if (bState.mode === 'read') {
      if (count === 0) {
        document.getElementById('midi-debug').innerHTML = `<span style="color:#f00;">❌ ERRORE: Nessuna patch ricevuta. Verifica la connessione MIDI.</span>`;
      } else {
        document.getElementById('midi-debug').innerHTML = `<span style="color:#0f0;">✅ BANK READ: Completato! (${count} patch ricevute)</span>`;
        setLastAction('bank read complete: ' + count);
      }
    }

    window.bankFetchState.active = false;
    window.bankFetchState = null;
  }

  function requestBankPatch(bankIndex, patchIndex) {
    if (!selectedOutput) return;
    try {
      // 0x30 = Single Patch Dump Request
      const bytes = new Uint8Array([
        ...SYSEX_PREFIX, deviceId(), 0x30, bankIndex & 0x7F, patchIndex & 0x7F, 0xF7
      ]);
      selectedOutput.send(bytes);
      recordMidiTx('request patch dump', bytes);
    } catch (e) { console.error('Bank dump request error', e); }
  }

  function requestFullBank(bankIndex) {
    if (!selectedOutput) return;
    try {
      // 0x32 = Bank Dump Request
      const bytes = new Uint8Array([
        ...SYSEX_PREFIX, deviceId(), 0x32, bankIndex & 0x7F, 0xF7
      ]);
      selectedOutput.send(bytes);
      recordMidiTx('request bank dump', bytes);
    } catch (e) { console.error('Full Bank dump request error', e); }
  }

  function requestDump(partIndex) {
    if (!selectedOutput) return;
    try {
      // 0x40 = Edit Buffer, partIndex = 0..3 (Part 1..4)
      const bytes = new Uint8Array([
        ...SYSEX_PREFIX, deviceId(), 0x00, 0x40, partIndex & 0x7F, 0xF7
      ]);
      selectedOutput.send(bytes);
      recordMidiTx('request edit buffer p' + (partIndex + 1), bytes);
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
    setLastAction('multi preset saved');
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
      const ox = 10;
      const oy = Math.max(20, Math.floor((h - textH) / 2) + 10);

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
  document.getElementById('btnToggleDiagnostics').addEventListener('click', () => {
    midiDiagnostics.classList.toggle('hidden');
    setLastAction(midiDiagnostics.classList.contains('hidden') ? 'diagnostics hidden' : 'diagnostics visible');
  });

  document.getElementById('btnReceiveSingle').addEventListener('click', () => {
    if (!selectedOutput) {
      setLastAction('connect midi output first');
      return;
    }
    window.lastReceivedDump = null;
    setLastAction('waiting for single dump');
    document.getElementById('midi-debug').textContent = 'REQUEST: Single edit buffer...';
    requestDump(0);
  });

  document.getElementById('btnSendCurrent').addEventListener('click', () => {
    if (!selectedOutput) {
      setLastAction('connect midi output first');
      return;
    }
    setLastAction('sending current single');
    sendFullPatch(patch);
  });

  document.getElementById('btnPanic').addEventListener('click', () => {
    if (!selectedOutput) {
      setLastAction('connect midi output first');
      return;
    }
    for (let ch = 1; ch <= 16; ch++) {
      sendCC(ch, 120, 0); // All Sound Off
      sendCC(ch, 123, 0); // All Notes Off
    }
    setLastAction('panic sent on 16 channels');
  });

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
    // Virus TI / Snow bank mapping: RAM 1-4 = 0-3, ROM 1-Z = 4+
    const bankIndex = (type === 'RAM' ? 0 : 4) + (num - 1);
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

      // Request the full bank (Command 0x32)
      requestFullBank(bankIndex);

      // If we receive absolutely nothing for 3 seconds, we timeout the whole operation
      window.bankFetchState.timeoutId = setTimeout(() => {
        const bState = window.bankFetchState;
        if (bState && bState.active) {
          document.getElementById('midi-debug').innerHTML = `<span style="color:#f00;">❌ ERRORE: Nessuna patch ricevuta. Verifica la connessione MIDI.</span>`;
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

  function buildArpView() {
    const root = document.getElementById('arpContent');
    root.innerHTML = '';

    const elektronWrapper = document.createElement('div');
    elektronWrapper.className = 'hardware-chassis';

    const tlScrew = document.createElement('div'); tlScrew.className = 'chassis-screw screw-tl';
    const trScrew = document.createElement('div'); trScrew.className = 'chassis-screw screw-tr';
    const blScrew = document.createElement('div'); blScrew.className = 'chassis-screw screw-bl';
    const brScrew = document.createElement('div'); brScrew.className = 'chassis-screw screw-br';
    const logo = document.createElement('div'); logo.className = 'chassis-logo';
    logo.textContent = 'VIRUS-H ARP';

    elektronWrapper.appendChild(tlScrew);
    elektronWrapper.appendChild(trScrew);
    elektronWrapper.appendChild(blScrew);
    elektronWrapper.appendChild(brScrew);
    elektronWrapper.appendChild(logo);

    const innerLayout = document.createElement('div');
    innerLayout.style.display = 'flex';
    innerLayout.style.flexDirection = 'row';
    innerLayout.style.gap = '60px';
    innerLayout.style.alignItems = 'flex-start';
    innerLayout.style.justifyContent = 'center';
    innerLayout.style.flexWrap = 'wrap';
    innerLayout.style.marginTop = '40px';
    innerLayout.style.width = '100%';
    innerLayout.style.zIndex = '1';

    // Helper for ARP Discrete controls mapped to Knobs
    function createArpDiscreteKnob(label, options, ccIndex) {
      let currentIdx = 0;

      const knobContainer = createKnobGeneric({
        label: label,
        default: 0,
        bipolar: false,
        getValue: () => Math.round((currentIdx / (options.length - 1)) * 127),
        setValue: (v, send) => {
          let step = Math.round((v / 127) * (options.length - 1));
          if(step >= options.length) step = options.length - 1;
          currentIdx = step;

          const labelEl = knobContainer.querySelector('.chassis-knob-label');
          if(labelEl) labelEl.textContent = label + ': ' + options[step].name;

          if(send) sendCC(1, ccIndex, options[step].val);
        }
      });
      const labelEl = knobContainer.querySelector('.chassis-knob-label');
      if(labelEl) labelEl.textContent = label + ': ' + options[currentIdx].name;
      return knobContainer;
    }

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '32px';
    grid.style.padding = '20px';

    grid.appendChild(createArpDiscreteKnob('Mode', [
      {val: 0, name: 'Off'}, {val: 1, name: 'Up'}, {val: 2, name: 'Down'},
      {val: 3, name: 'Up/Dn'}, {val: 4, name: 'As Ply'}, {val: 5, name: 'Rand'}, {val: 6, name: 'Chord'}
    ], 100));

    const patternOpts = [];
    for(let i=1; i<=64; i++) patternOpts.push({val: i-1, name: `Pat ${i}`});
    patternOpts.push({val: 64, name: 'User'});
    grid.appendChild(createArpDiscreteKnob('Pattern', patternOpts, 101));

    grid.appendChild(createArpDiscreteKnob('Res', [
      {val: 0, name: '1/2'}, {val: 1, name: '1/4'}, {val: 2, name: '1/8'},
      {val: 3, name: '1/16'}, {val: 4, name: '1/32'}, {val: 5, name: '1/64'}
    ], 102));

    grid.appendChild(createArpDiscreteKnob('Octaves', [
      {val: 0, name: '1'}, {val: 1, name: '2'}, {val: 2, name: '3'}, {val: 3, name: '4'}
    ], 103));

    let lenVal = 64;
    const arpLenKnob = createKnobGeneric({
      label: 'Length', default: 64, bipolar: false,
      getValue: () => lenVal,
      setValue: (v, send) => {
        lenVal = v;
        const lbl = arpLenKnob.querySelector('.chassis-knob-label');
        if(lbl) lbl.textContent = 'Length: ' + Math.round(v);
        if(send) sendCC(1, 104, v);
      }
    });
    grid.appendChild(arpLenKnob);

    let swingVal = 0;
    const arpSwingKnob = createKnobGeneric({
      label: 'Swing', default: 0, bipolar: false,
      getValue: () => swingVal,
      setValue: (v, send) => {
        swingVal = v;
        const lbl = arpSwingKnob.querySelector('.chassis-knob-label');
        if(lbl) lbl.textContent = 'Swing: ' + Math.round(v);
        if(send) sendCC(1, 105, v);
      }
    });
    grid.appendChild(arpSwingKnob);

    const holdBtnContainer = document.createElement('div');
    holdBtnContainer.className = 'chassis-knob-container';
    holdBtnContainer.style.justifyContent = 'flex-end';

    const holdBtn = document.createElement('button');
    holdBtn.className = 'chassis-page-btn';
    holdBtn.textContent = 'HOLD';
    holdBtn.style.width = '40px';
    holdBtn.style.height = '24px';
    let holdState = false;
    holdBtn.addEventListener('click', () => {
      holdState = !holdState;
      holdBtn.style.background = holdState ? 'var(--accent)' : '#222';
      holdBtn.style.color = holdState ? '#000' : 'var(--fg)';
      sendCC(1, 106, holdState ? 127 : 0);
    });

    const holdLabel = document.createElement('div');
    holdLabel.className = 'chassis-knob-label';
    holdLabel.textContent = 'Hold';

    holdBtnContainer.appendChild(holdBtn);
    holdBtnContainer.appendChild(holdLabel);
    grid.appendChild(holdBtnContainer);

    innerLayout.appendChild(grid);

    const arpStepsContainer = document.createElement('div');
    arpStepsContainer.style.width = '100%';
    arpStepsContainer.style.marginTop = '20px';
    arpStepsContainer.style.display = 'flex';
    arpStepsContainer.style.flexDirection = 'column';
    arpStepsContainer.style.alignItems = 'center';

    const arpSeqGrid = document.createElement('div');
    arpSeqGrid.style.display = 'grid';
    arpSeqGrid.style.gridTemplateColumns = 'repeat(16, 1fr)';
    arpSeqGrid.style.gap = '16px';
    arpSeqGrid.style.padding = '0 40px';

    for(let i = 0; i < 16; i++) {
      const stepWrapper = document.createElement('div');
      stepWrapper.style.display = 'flex';
      stepWrapper.style.flexDirection = 'column';
      stepWrapper.style.alignItems = 'center';
      stepWrapper.style.gap = '8px';

      const stepLabel = document.createElement('div');
      stepLabel.textContent = (i + 1).toString();
      stepLabel.style.color = '#666';
      stepLabel.style.fontSize = '10px';
      stepLabel.style.fontFamily = 'monospace';

      const stepBtn = document.createElement('div');
      stepBtn.style.width = '40px';
      stepBtn.style.height = '30px';
      stepBtn.style.backgroundColor = '#1a1a1a';
      stepBtn.style.border = '2px solid #111';
      stepBtn.style.borderRadius = '4px';
      stepBtn.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)';
      stepBtn.style.cursor = 'pointer';
      stepBtn.style.transition = 'all 100ms ease';

      let stepActive = false;
      stepBtn.addEventListener('click', () => {
        stepActive = !stepActive;
        if (stepActive) {
          stepBtn.style.backgroundColor = 'var(--accent)';
          stepBtn.style.boxShadow = `0 0 ${Math.round(limitedGlow(10))}px var(--accent), inset 0 1px 2px rgba(255,255,255,0.5)`;
          stepBtn.style.borderColor = '#ff9900';
        } else {
          stepBtn.style.backgroundColor = '#1a1a1a';
          stepBtn.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)';
          stepBtn.style.borderColor = '#111';
        }
        sendCC(1, 110 + i, stepActive ? 127 : 0);
      });

      stepWrapper.appendChild(stepBtn);
      stepWrapper.appendChild(stepLabel);
      arpSeqGrid.appendChild(stepWrapper);
    }

    arpStepsContainer.appendChild(arpSeqGrid);
    innerLayout.appendChild(arpStepsContainer);

    elektronWrapper.appendChild(innerLayout);

    const woodStrip = document.createElement('div');
    woodStrip.className = 'chassis-wood-strip';
    elektronWrapper.appendChild(woodStrip);

    root.appendChild(elektronWrapper);
  }

  function buildSeqView() {
    const root = document.getElementById('sequencerContent');
    root.innerHTML = '';

    const elektronWrapper = document.createElement('div');
    elektronWrapper.className = 'hardware-chassis';
    elektronWrapper.style.width = '95%';
    elektronWrapper.style.maxWidth = '1100px';
    elektronWrapper.style.padding = '30px 20px';

    const tlScrew = document.createElement('div'); tlScrew.className = 'chassis-screw screw-tl';
    const trScrew = document.createElement('div'); trScrew.className = 'chassis-screw screw-tr';
    const blScrew = document.createElement('div'); blScrew.className = 'chassis-screw screw-bl';
    const brScrew = document.createElement('div'); brScrew.className = 'chassis-screw screw-br';
    const logo = document.createElement('div'); logo.className = 'chassis-logo';
    logo.textContent = 'VIRUS-H SEQ';

    elektronWrapper.appendChild(tlScrew);
    elektronWrapper.appendChild(trScrew);
    elektronWrapper.appendChild(blScrew);
    elektronWrapper.appendChild(brScrew);
    elektronWrapper.appendChild(logo);

    const innerLayout = document.createElement('div');
    innerLayout.style.display = 'flex';
    innerLayout.style.flexDirection = 'column';
    innerLayout.style.gap = '20px';
    innerLayout.style.alignItems = 'center';
    innerLayout.style.marginTop = '40px';
    innerLayout.style.width = '100%';
    innerLayout.style.zIndex = '1';

    const topSection = document.createElement('div');
    topSection.style.display = 'flex';
    topSection.style.width = '100%';
    topSection.style.justifyContent = 'space-between';
    topSection.style.alignItems = 'center';
    topSection.style.gap = '20px';


    // Helper for Seq Discrete controls mapped to Knobs
    function createSeqDiscreteKnob(label, options, ccIndex) {
      let currentIdx = 0;
      const knobContainer = createKnobGeneric({
        label: label,
        default: 0,
        bipolar: false,
        getValue: () => Math.round((currentIdx / (options.length - 1)) * 127),
        setValue: (v, send) => {
          let step = Math.round((v / 127) * (options.length - 1));
          if(step >= options.length) step = options.length - 1;
          currentIdx = step;
          const labelEl = knobContainer.querySelector('.chassis-knob-label');
          if(labelEl) labelEl.textContent = label + ': ' + options[step].name;
          if(send) window.sendCC(1, ccIndex, options[step].val);
        }
      });
      const labelEl = knobContainer.querySelector('.chassis-knob-label');
      if(labelEl) labelEl.textContent = label + ': ' + options[currentIdx].name;
      return knobContainer;
    }

    const leftKnobs = document.createElement('div');
    leftKnobs.style.display = 'flex';
    leftKnobs.style.gap = '30px';

    leftKnobs.appendChild(createSeqDiscreteKnob('Scale', [
      {val: 0, name: '1/16'}, {val: 1, name: '1/32'}, {val: 2, name: '1/8'}, {val: 3, name: '1/4'}
    ], 107));

    let lenValRaw = 64;
    const lenKnob = createKnobGeneric({
      label: 'Length', default: 64, bipolar: false,
      getValue: () => lenValRaw,
      setValue: (v, send) => {
        lenValRaw = v;
        let actualLen = Math.max(1, Math.round(v/127 * 64));
        const lbl = lenKnob.querySelector('.chassis-knob-label');
        if(lbl) lbl.textContent = 'Length: ' + actualLen;
        if(send) window.sendCC(1, 108, actualLen);
      }
    });
    leftKnobs.appendChild(lenKnob);

    let gateVal = 50;
    const gateKnob = createKnobGeneric({
      label: 'Gate Time', default: 50, bipolar: false,
      getValue: () => gateVal,
      setValue: (v, send) => {
        gateVal = v;
        const lbl = gateKnob.querySelector('.chassis-knob-label');
        if(lbl) lbl.textContent = 'Gate Time: ' + Math.round(v);
        if(send) window.sendCC(1, 109, v);
      }
    });
    leftKnobs.appendChild(gateKnob);

    const rightKnobs = document.createElement('div');
    rightKnobs.style.display = 'flex';
    rightKnobs.style.gap = '30px';

    let velVal = 100;
    const velKnob = createKnobGeneric({
      label: 'Velocity', default: 100, bipolar: false,
      getValue: () => velVal,
      setValue: (v, send) => {
        velVal = v;
        const lbl = velKnob.querySelector('.chassis-knob-label');
        if(lbl) lbl.textContent = 'Velocity: ' + Math.round(v);
        if(send) window.sendCC(1, 110, v);
      }
    });
    rightKnobs.appendChild(velKnob);

    rightKnobs.appendChild(createSeqDiscreteKnob('Direction', [
      {val: 0, name: 'Fwd'}, {val: 1, name: 'Bwd'}, {val: 2, name: 'Ping'}, {val: 3, name: 'Rand'}
    ], 111));

    let seqSwingVal = 0;
    const swingKnob = createKnobGeneric({
      label: 'Swing', default: 0, bipolar: false,
      getValue: () => seqSwingVal,
      setValue: (v, send) => {
        seqSwingVal = v;
        const lbl = swingKnob.querySelector('.chassis-knob-label');
        if(lbl) lbl.textContent = 'Swing: ' + Math.round(v);
        if(send) window.sendCC(1, 112, v);
      }
    });
    rightKnobs.appendChild(swingKnob);

    // OLED Screen for Sequencer
    const screenRecess = document.createElement('div');
    screenRecess.className = 'chassis-screen-recess';
    screenRecess.style.width = '300px';
    screenRecess.style.height = '100px';
    screenRecess.style.display = 'flex';
    screenRecess.style.flexDirection = 'column';
    screenRecess.style.justifyContent = 'center';
    screenRecess.style.alignItems = 'center';

    const seqTitle = document.createElement('div');
    seqTitle.textContent = 'PATTERN 01';
    seqTitle.style.color = 'var(--accent)';
    seqTitle.style.fontSize = '24px';
    seqTitle.style.textShadow = `0 0 ${Math.round(limitedGlow(6))}px var(--accent)`;
    seqTitle.style.position = 'relative';
    seqTitle.style.zIndex = '2';

    const seqInfo = document.createElement('div');
    seqInfo.textContent = 'SEQ RUNNING';
    seqInfo.style.color = 'var(--accent)';
    seqInfo.style.fontSize = '12px';
    seqInfo.style.marginTop = '8px';
    seqInfo.style.opacity = '0.8';
    seqInfo.style.position = 'relative';
    seqInfo.style.zIndex = '2';

    screenRecess.appendChild(seqTitle);
    screenRecess.appendChild(seqInfo);

    topSection.appendChild(leftKnobs);
    topSection.appendChild(screenRecess);
    topSection.appendChild(rightKnobs);

    innerLayout.appendChild(topSection);

    // 64-step grid (4 rows of 16)
    const seqGrid = document.createElement('div');
    seqGrid.style.display = 'grid';
    seqGrid.style.gridTemplateColumns = 'repeat(16, 1fr)';
    seqGrid.style.gap = '12px';
    seqGrid.style.width = '100%';
    seqGrid.style.padding = '20px 0';

    for(let i = 0; i < 64; i++) {
      const stepWrapper = document.createElement('div');
      stepWrapper.style.display = 'flex';
      stepWrapper.style.flexDirection = 'column';
      stepWrapper.style.alignItems = 'center';
      stepWrapper.style.gap = '6px';

      const stepLabel = document.createElement('div');
      stepLabel.textContent = (i + 1).toString();
      stepLabel.style.color = '#666';
      stepLabel.style.fontSize = '10px';
      stepLabel.style.fontFamily = 'monospace';

      const stepBtn = document.createElement('div');
      stepBtn.style.width = '35px';
      stepBtn.style.height = '25px';
      stepBtn.style.backgroundColor = '#1a1a1a';
      stepBtn.style.border = '2px solid #111';
      stepBtn.style.borderRadius = '3px';
      stepBtn.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)';
      stepBtn.style.cursor = 'pointer';
      stepBtn.style.transition = 'all 100ms ease';

      let stepActive = false;
      stepBtn.addEventListener('click', () => {
        stepActive = !stepActive;
        if (stepActive) {
          stepBtn.style.backgroundColor = 'var(--accent)';
          stepBtn.style.boxShadow = `0 0 ${Math.round(limitedGlow(10))}px var(--accent), inset 0 1px 2px rgba(255,255,255,0.5)`;
          stepBtn.style.borderColor = '#ff9900';
        } else {
          stepBtn.style.backgroundColor = '#1a1a1a';
          stepBtn.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)';
          stepBtn.style.borderColor = '#111';
        }
        if(window.sendCC) window.sendCC(1, 110 + (i%32), stepActive ? 127 : 0);
      });

      stepWrapper.appendChild(stepBtn);
      stepWrapper.appendChild(stepLabel);
      seqGrid.appendChild(stepWrapper);
    }

    innerLayout.appendChild(seqGrid);

    elektronWrapper.appendChild(innerLayout);

    const woodStrip = document.createElement('div');
    woodStrip.className = 'chassis-wood-strip';
    elektronWrapper.appendChild(woodStrip);

    root.appendChild(elektronWrapper);
  }
  function buildSongView() {
    const root = document.getElementById('songContent');
    root.innerHTML = '';

    const elektronWrapper = document.createElement('div');
    elektronWrapper.className = 'hardware-chassis';
    elektronWrapper.style.width = '95%';
    elektronWrapper.style.maxWidth = '1100px';
    elektronWrapper.style.padding = '30px 20px';

    const tlScrew = document.createElement('div'); tlScrew.className = 'chassis-screw screw-tl';
    const trScrew = document.createElement('div'); trScrew.className = 'chassis-screw screw-tr';
    const blScrew = document.createElement('div'); blScrew.className = 'chassis-screw screw-bl';
    const brScrew = document.createElement('div'); brScrew.className = 'chassis-screw screw-br';
    const logo = document.createElement('div'); logo.className = 'chassis-logo';
    logo.textContent = 'VIRUS-H SONG';

    elektronWrapper.appendChild(tlScrew);
    elektronWrapper.appendChild(trScrew);
    elektronWrapper.appendChild(blScrew);
    elektronWrapper.appendChild(brScrew);
    elektronWrapper.appendChild(logo);

    const innerLayout = document.createElement('div');
    innerLayout.style.display = 'flex';
    innerLayout.style.flexDirection = 'column';
    innerLayout.style.gap = '20px';
    innerLayout.style.alignItems = 'center';
    innerLayout.style.marginTop = '40px';
    innerLayout.style.width = '100%';
    innerLayout.style.zIndex = '1';

    // Page Buttons for SONG
    const pageContainer = document.createElement('div');
    pageContainer.style.display = 'flex';
    pageContainer.style.gap = '10px';
    pageContainer.style.marginBottom = '10px';

    const pages = ['1:16', '17:32', '33:48', '49:64'];
    const pageBtns = [];
    let currentPage = 0;

    pages.forEach((lbl, idx) => {
      const btn = document.createElement('button');
      btn.className = 'chassis-page-btn';
      btn.textContent = lbl;
      btn.style.padding = '4px 12px';
      btn.style.width = 'auto';
      if (idx === currentPage) {
        btn.style.backgroundColor = '#ff9900';
        btn.style.color = '#000';
      }
      btn.addEventListener('click', () => {
        currentPage = idx;
        pageBtns.forEach((b, i) => {
          if (i === currentPage) {
            b.style.backgroundColor = '#ff9900';
            b.style.color = '#000';
          } else {
            b.style.backgroundColor = 'var(--section-bg)';
            b.style.color = 'var(--text-main)';
          }
        });
        slotWrappers.forEach((w, i) => {
          if (i >= currentPage * 16 && i < (currentPage + 1) * 16) {
            w.style.display = 'flex';
          } else {
            w.style.display = 'none';
          }
        });
      });
      pageBtns.push(btn);
      pageContainer.appendChild(btn);
    });

    innerLayout.appendChild(pageContainer);

    // Grid of 16 independent visors
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
    gridContainer.style.gap = '20px'; // margine di spazio nello chassis
    gridContainer.style.width = '100%';

    const slotWrappers = [];

    for(let i=0; i<64; i++){
      const display = document.createElement('div');
      display.className = 'chassis-screen-recess';
      display.style.display = 'flex';
      display.style.flexDirection = 'column';
      display.style.alignItems = 'center';
      display.style.justifyContent = 'center';
      display.style.padding = '10px';
      display.style.height = '90px';
      display.style.boxSizing = 'border-box';
      display.style.position = 'relative';
      display.style.gap = '8px';

      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.width = '100%';
      headerRow.style.color = 'var(--accent)';
      headerRow.style.fontFamily = 'monospace';
      headerRow.style.fontSize = '12px';
      headerRow.style.fontWeight = 'bold';
      headerRow.style.borderBottom = '1px dashed var(--accent)';
      headerRow.style.paddingBottom = '4px';
      headerRow.style.position = 'relative';
      headerRow.style.zIndex = '2';

      const stepIdx = document.createElement('div');
      stepIdx.textContent = 'STP ' + (i+1).toString().padStart(2, '0');
      headerRow.appendChild(stepIdx);
      display.appendChild(headerRow);

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '10px';
      row.style.alignItems = 'center';
      row.style.position = 'relative';
      row.style.zIndex = '2';
      row.style.marginTop = '4px';

      const selStyle = "background: transparent; color: var(--accent); border: 1px solid #333; font-family: monospace; font-size: 14px; outline: none; padding: 2px;";

      const patternSel = document.createElement('select');
      patternSel.style.cssText = selStyle;
      const offOpt = document.createElement('option'); offOpt.value = 'OFF'; offOpt.textContent = '--';
      patternSel.appendChild(offOpt);
      for(let p=1; p<=64; p++) {
        const opt = document.createElement('option');
        opt.value = p; opt.textContent = 'P' + p.toString().padStart(2, '0');
        patternSel.appendChild(opt);
      }

      const repsSel = document.createElement('select');
      repsSel.style.cssText = selStyle;
      for(let r=1; r<=16; r++) {
        const opt = document.createElement('option');
        opt.value = r; opt.textContent = 'x' + r;
        repsSel.appendChild(opt);
      }

      const transpSel = document.createElement('select');
      transpSel.style.cssText = selStyle;
      for(let t=-24; t<=24; t++) {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = (t > 0 ? '+' : '') + t;
        if(t === 0) opt.selected = true;
        transpSel.appendChild(opt);
      }

      row.appendChild(patternSel);
      row.appendChild(repsSel);
      row.appendChild(transpSel);
      display.appendChild(row);

      if (i >= 16) display.style.display = 'none';
      slotWrappers.push(display);
      gridContainer.appendChild(display);
    }

    innerLayout.appendChild(gridContainer);

    // Playback Controls
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.marginTop = '10px';

    const playBtn = document.createElement('button');
    playBtn.className = 'chassis-page-btn';
    playBtn.textContent = 'PLAY SONG';
    playBtn.style.padding = '0 20px';
    playBtn.style.width = 'auto';
    playBtn.addEventListener('click', () => { playBtn.style.backgroundColor = '#ff9900'; playBtn.style.color = '#000'; setTimeout(()=> { playBtn.style.backgroundColor = 'var(--section-bg)'; playBtn.style.color = 'var(--text-main)'; }, 200); if(window.sendCC) window.sendCC(1, 115, 127); });

    const stopBtn = document.createElement('button');
    stopBtn.className = 'chassis-page-btn';
    stopBtn.textContent = 'STOP';
    stopBtn.style.padding = '0 20px';
    stopBtn.style.width = 'auto';
    stopBtn.addEventListener('click', () => { stopBtn.style.backgroundColor = '#ff9900'; stopBtn.style.color = '#000'; setTimeout(()=> { stopBtn.style.backgroundColor = 'var(--section-bg)'; stopBtn.style.color = 'var(--text-main)'; }, 200); if(window.sendCC) window.sendCC(1, 116, 127); });

    const loopBtn = document.createElement('button');
    loopBtn.className = 'chassis-page-btn';
    loopBtn.textContent = 'LOOP';
    loopBtn.style.padding = '0 20px';
    loopBtn.style.width = 'auto';
    let isLoop = false;
    loopBtn.addEventListener('click', () => {
      isLoop = !isLoop;
      loopBtn.style.backgroundColor = isLoop ? '#ff9900' : 'var(--section-bg)';
      loopBtn.style.color = isLoop ? '#000' : 'var(--text-main)';
      if(window.sendCC) window.sendCC(1, 117, isLoop ? 127 : 0);
    });

    controlsContainer.appendChild(playBtn);
    controlsContainer.appendChild(stopBtn);
    controlsContainer.appendChild(loopBtn);
    innerLayout.appendChild(controlsContainer);

    elektronWrapper.appendChild(innerLayout);

    const woodStrip = document.createElement('div');
    woodStrip.className = 'chassis-wood-strip';
    elektronWrapper.appendChild(woodStrip);

    root.appendChild(elektronWrapper);
  }



  renderLibrary();
  renderMultiLibrary();

  buildSingleView();

  // Initialize the big macro knobs (Cutoff & Resonance) after the Single view exists.
  const macroKnobs = document.getElementById('globalMacroKnobs');
  if (macroKnobs) {
    macroKnobs.innerHTML = '';
    const cutParam = PARAMS.find(p => p.id === 'f1_cutoff');
    const resParam = PARAMS.find(p => p.id === 'f1_resonance');
    if (cutParam && resParam) {
      const cutKnob = createKnob(cutParam);
      const resKnob = createKnob(resParam);
      macroKnobs.appendChild(cutKnob);
      macroKnobs.appendChild(resKnob);
      window.macroRefs = [cutKnob, resKnob];
    }
  }

  buildMultiView();
  buildArpView();
  buildSeqView();
  buildSongView();
})();