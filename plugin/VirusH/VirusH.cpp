#include "VirusH.h"
#include "IPlug_include_in_plug_src.h"

#include <cstring>
#include <vector>

namespace
{
// [lunghezza id][id][dati] — formato dei messaggi MIDI tra UI e plugin
std::vector<uint8_t> PackPort(const std::string& id, const uint8_t* data, size_t size)
{
  std::vector<uint8_t> out;
  out.push_back(static_cast<uint8_t>(id.size()));
  out.insert(out.end(), id.begin(), id.end());
  out.insert(out.end(), data, data + size);
  return out;
}

bool UnpackPort(const void* pData, int dataSize, std::string& id, const uint8_t*& bytes, size_t& size)
{
  auto* p = static_cast<const uint8_t*>(pData);
  if (dataSize < 1 || p[0] + 1 > dataSize) return false;
  id.assign(reinterpret_cast<const char*>(p + 1), p[0]);
  bytes = p + 1 + p[0];
  size = static_cast<size_t>(dataSize - 1 - p[0]);
  return true;
}

std::string JsonEscape(const std::string& s)
{
  std::string o;
  for (char c : s)
  {
    if (c == '"' || c == '\\') { o += '\\'; o += c; }
    else if (static_cast<unsigned char>(c) < 0x20) o += ' ';
    else o += c;
  }
  return o;
}
} // namespace

VirusH::VirusH(const InstanceInfo& info)
: iplug::Plugin(info, MakeConfig(kNumParams, kNumPresets))
{
#ifdef WEBVIEW_EDITOR_DELEGATE
#ifdef DEBUG
  SetEnableDevTools(true);
#endif
  SetMaxJSStringLength(4 * 1024 * 1024);   // dump SysEx e stato dell'editor
  mEditorInitFunc = [&]()
  {
    LoadIndexHtml(__FILE__, GetBundleID());
    EnableScroll(true);
  };
#endif

  mMidi = std::make_unique<VirusMidi>(
    [this](const std::string& id, const std::vector<uint8_t>& bytes) {
      auto packed = PackPort(id, bytes.data(), bytes.size());
      SendArbitraryMsgFromDelegate(kMsgMidiIn, static_cast<int>(packed.size()), packed.data());
    },
    [this]() { SendPorts(); });

  MakeDefaultPreset();
}

void VirusH::SendPorts()
{
  std::string json = "[";
  bool first = true;
  for (const auto& p : mMidi->ListPorts())
  {
    if (!first) json += ",";
    first = false;
    json += "{\"id\":\"" + JsonEscape(p.id) + "\",\"name\":\"" + JsonEscape(p.name) +
            "\",\"manufacturer\":\"" + JsonEscape(p.manufacturer) + "\",\"input\":" + (p.isInput ? "true" : "false") + "}";
  }
  json += "]";
  SendArbitraryMsgFromDelegate(kMsgMidiPorts, static_cast<int>(json.size()), json.data());
}

void VirusH::SendState()
{
  std::string state;
  { std::lock_guard<std::mutex> g(mStateLock); state = mEditorState; }
  SendArbitraryMsgFromDelegate(kMsgRestoreState, static_cast<int>(state.size()), state.data());
}

bool VirusH::OnMessage(int msgTag, int ctrlTag, int dataSize, const void* pData)
{
  switch (msgTag)
  {
    case kMsgUiReady:
      SendState();
      SendPorts();
      return true;
    case kMsgMidiRefresh:
      SendPorts();
      return true;
    case kMsgMidiSend:
    {
      std::string id; const uint8_t* bytes = nullptr; size_t size = 0;
      if (UnpackPort(pData, dataSize, id, bytes, size))
      {
        mMidi->Send(id, bytes, size);
        std::lock_guard<std::mutex> g(mThruLock);
        mThruOutput = id;
      }
      return true;
    }
    case kMsgMidiListen:
      mMidi->ListenTo(std::string(static_cast<const char*>(pData), dataSize));
      return true;
    case kMsgSaveState:
    {
      std::lock_guard<std::mutex> g(mStateLock);
      mEditorState.assign(static_cast<const char*>(pData), dataSize);
      return true;
    }
  }
  return false;
}

bool VirusH::SerializeState(IByteChunk& chunk) const
{
  std::lock_guard<std::mutex> g(mStateLock);
  WDL_String s(mEditorState.c_str());
  chunk.PutStr(s.Get());
  return true;
}

int VirusH::UnserializeState(const IByteChunk& chunk, int startPos)
{
  WDL_String s;
  const int pos = chunk.GetStr(s, startPos);
  {
    std::lock_guard<std::mutex> g(mStateLock);
    mEditorState = s.Get();
  }
  return pos;   // l'interfaccia lo rilegge con kMsgUiReady all'apertura
}

#if IPLUG_DSP
void VirusH::ProcessBlock(sample** inputs, sample** outputs, int nFrames)
{
  // Virus H non genera audio: il suono arriva dal Virus hardware
  for (int c = 0; c < NOutChansConnected(); c++)
    std::memset(outputs[c], 0, nFrames * sizeof(sample));
}

void VirusH::ProcessMidiMsg(const IMidiMsg& msg)
{
  // MIDI thru: le note della traccia del DAW vanno al Virus sulla porta in uso
  std::string out;
  { std::lock_guard<std::mutex> g(mThruLock); out = mThruOutput; }
  if (!out.empty())
  {
    const uint8_t bytes[3] = { msg.mStatus, msg.mData1, msg.mData2 };
    const int len = (msg.StatusMsg() == IMidiMsg::kProgramChange || msg.StatusMsg() == IMidiMsg::kChannelAftertouch) ? 2 : 3;
    mMidi->Send(out, bytes, len);
  }
  SendMidiMsg(msg);
}

void VirusH::ProcessSysEx(const ISysEx& msg)
{
  std::string out;
  { std::lock_guard<std::mutex> g(mThruLock); out = mThruOutput; }
  if (!out.empty() && msg.mData && msg.mSize > 0)
    mMidi->Send(out, msg.mData, static_cast<size_t>(msg.mSize));
}
#endif
