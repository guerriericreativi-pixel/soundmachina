#pragma once

#include "IPlug_include_in_plug_hdr.h"
#include "VirusMidi.h"

#include <memory>
#include <mutex>
#include <string>

using namespace iplug;

const int kNumPresets = 1;

enum EParams
{
  kNumParams
};

// Messaggi tra interfaccia web (web-midi-shim.js) e plugin
enum EMsgTags
{
  // UI -> plugin
  kMsgUiReady = 100,      // interfaccia caricata: chiede porte MIDI e stato salvato
  kMsgMidiSend = 101,     // [len id][id][byte MIDI]
  kMsgMidiListen = 102,   // id ingresso ("" = nessuno)
  kMsgSaveState = 103,    // JSON con lo stato dell'editor (localStorage)
  kMsgMidiRefresh = 104,  // rilegge le porte
  // plugin -> UI
  kMsgMidiPorts = 200,    // JSON [{id,name,manufacturer,input}]
  kMsgMidiIn = 201,       // [len id][id][byte MIDI]
  kMsgRestoreState = 202  // JSON stato salvato nel progetto del DAW
};

class VirusH final : public Plugin
{
public:
  VirusH(const InstanceInfo& info);

#if IPLUG_DSP
  void ProcessBlock(sample** inputs, sample** outputs, int nFrames) override;
  void ProcessMidiMsg(const IMidiMsg& msg) override;
  void ProcessSysEx(const ISysEx& msg) override;
#endif
  bool OnMessage(int msgTag, int ctrlTag, int dataSize, const void* pData) override;

  bool SerializeState(IByteChunk& chunk) const override;
  int UnserializeState(const IByteChunk& chunk, int startPos) override;

private:
  void SendPorts();
  void SendState();

  std::unique_ptr<VirusMidi> mMidi;
  mutable std::mutex mStateLock;
  std::string mEditorState;   // JSON dell'editor, salvato nel progetto
  std::string mThruOutput;    // porta del Virus a cui inoltrare le note del DAW
  std::mutex mThruLock;
};
