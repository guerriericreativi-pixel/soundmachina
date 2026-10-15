# webDX7 / MSFA engine

Source: https://github.com/webaudiomodules/webdx7
Pinned commit: 44942e5c442cd2d11c09a246bc3759e0c705f7e3

- webDX7: Copyright 2021 Jari Kleimola & others. MIT license.
- MSFA: Copyright 2012 Google Inc. Apache License 2.0.
- tuning-library: Copyright 2019–2020 Paul Walker. MIT license.

`dx7-worklet.js` contains the upstream distributed WASM binary embedding and Emscripten loader, followed by the original VIRUS-H AudioWorklet adapter. The adapter uses mono output, waits for runtime initialization, bounds incoming messages and reports peak output. The upstream core is unmodified. No downloadable Yamaha ROM banks are bundled here.
