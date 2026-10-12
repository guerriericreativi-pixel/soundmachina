#include "VirusMidi.h"

#import <CoreMIDI/CoreMIDI.h>
#import <Foundation/Foundation.h>

#include <memory>
#include <mutex>

namespace
{
std::string CFToStd(CFStringRef s)
{
  if (!s) return {};
  char buf[512];
  if (CFStringGetCString(s, buf, sizeof(buf), kCFStringEncodingUTF8)) return buf;
  return {};
}

std::string EndpointString(MIDIEndpointRef e, CFStringRef prop)
{
  CFStringRef v = nullptr;
  if (MIDIObjectGetStringProperty(e, prop, &v) != noErr || !v) return {};
  std::string r = CFToStd(v);
  CFRelease(v);
  return r;
}

std::string EndpointId(MIDIEndpointRef e)
{
  SInt32 uid = 0;
  MIDIObjectGetIntegerProperty(e, kMIDIPropertyUniqueID, &uid);
  return std::to_string(uid);
}

MIDIEndpointRef FindEndpoint(const std::string& id, bool input)
{
  const ItemCount n = input ? MIDIGetNumberOfSources() : MIDIGetNumberOfDestinations();
  for (ItemCount i = 0; i < n; i++)
  {
    MIDIEndpointRef e = input ? MIDIGetSource(i) : MIDIGetDestination(i);
    if (EndpointId(e) == id) return e;
  }
  return 0;
}
} // namespace

// Stato condiviso con i block CoreMIDI: sopravvive al plugin finche' esiste un
// block in coda, e dopo la chiusura i callback sono azzerati (niente use-after-free).
struct Shared
{
  std::mutex lock;
  std::string listeningId;
  VirusMidi::InputCallback onInput;
  VirusMidi::ChangeCallback onChange;
};

struct VirusMidi::Impl
{
  MIDIClientRef client = 0;
  MIDIPortRef outPort = 0;
  MIDIPortRef inPort = 0;
  MIDIEndpointRef listening = 0;
  std::shared_ptr<Shared> shared = std::make_shared<Shared>();
};

VirusMidi::VirusMidi(InputCallback onInput, ChangeCallback onChange)
: mImpl(new Impl)
{
  std::shared_ptr<Shared> sh = mImpl->shared;
  sh->onInput = std::move(onInput);
  sh->onChange = std::move(onChange);
  Impl* impl = mImpl;

  MIDIClientCreateWithBlock(CFSTR("Virus H"), &impl->client, ^(const MIDINotification* note) {
    if (note->messageID == kMIDIMsgSetupChanged)
      dispatch_async(dispatch_get_main_queue(), ^{
        ChangeCallback cb;
        { std::lock_guard<std::mutex> g(sh->lock); cb = sh->onChange; }
        if (cb) cb();
      });
  });
  MIDIOutputPortCreate(impl->client, CFSTR("Virus H Out"), &impl->outPort);
  MIDIInputPortCreateWithBlock(impl->client, CFSTR("Virus H In"), &impl->inPort,
    ^(const MIDIPacketList* list, void*) {
      // il callback CoreMIDI arriva su un thread suo: copia e passa al thread principale
      std::vector<uint8_t> bytes;
      const MIDIPacket* p = &list->packet[0];
      for (UInt32 i = 0; i < list->numPackets; i++)
      {
        bytes.insert(bytes.end(), p->data, p->data + p->length);
        p = MIDIPacketNext(p);
      }
      std::string id;
      { std::lock_guard<std::mutex> g(sh->lock); id = sh->listeningId; }
      dispatch_async(dispatch_get_main_queue(), ^{
        InputCallback cb;
        { std::lock_guard<std::mutex> g(sh->lock); cb = sh->onInput; }
        if (cb) cb(id, bytes);
      });
    });
}

VirusMidi::~VirusMidi()
{
  if (mImpl->listening) MIDIPortDisconnectSource(mImpl->inPort, mImpl->listening);
  if (mImpl->inPort) MIDIPortDispose(mImpl->inPort);
  if (mImpl->outPort) MIDIPortDispose(mImpl->outPort);
  if (mImpl->client) MIDIClientDispose(mImpl->client);
  {
    std::lock_guard<std::mutex> g(mImpl->shared->lock);
    mImpl->shared->onInput = nullptr;
    mImpl->shared->onChange = nullptr;
  }
  delete mImpl;
}

std::vector<VirusMidi::Port> VirusMidi::ListPorts() const
{
  std::vector<Port> ports;
  for (ItemCount i = 0; i < MIDIGetNumberOfDestinations(); i++)
  {
    MIDIEndpointRef e = MIDIGetDestination(i);
    ports.push_back({EndpointId(e), EndpointString(e, kMIDIPropertyDisplayName), EndpointString(e, kMIDIPropertyManufacturer), false});
  }
  for (ItemCount i = 0; i < MIDIGetNumberOfSources(); i++)
  {
    MIDIEndpointRef e = MIDIGetSource(i);
    ports.push_back({EndpointId(e), EndpointString(e, kMIDIPropertyDisplayName), EndpointString(e, kMIDIPropertyManufacturer), true});
  }
  return ports;
}

bool VirusMidi::Send(const std::string& outputId, const uint8_t* data, size_t size)
{
  MIDIEndpointRef dest = FindEndpoint(outputId, false);
  if (!dest || !size) return false;

  // messaggi brevi (anche dal thread audio, MIDI thru): buffer in stack, niente allocazioni;
  // dump SysEx lunghi: buffer dinamico grande a sufficienza
  alignas(MIDIPacketList) uint8_t small[512];
  std::vector<uint8_t> big;
  uint8_t* buf = small;
  size_t bufSize = sizeof(small);
  if (size + 64 > sizeof(small)) { big.resize(size + 1024); buf = big.data(); bufSize = big.size(); }
  auto* list = reinterpret_cast<MIDIPacketList*>(buf);
  MIDIPacket* pkt = MIDIPacketListInit(list);
  pkt = MIDIPacketListAdd(list, bufSize, pkt, 0, size, data);
  if (!pkt) return false;
  return MIDISend(mImpl->outPort, dest, list) == noErr;
}

void VirusMidi::ListenTo(const std::string& inputId)
{
  if (mImpl->listening)
  {
    MIDIPortDisconnectSource(mImpl->inPort, mImpl->listening);
    mImpl->listening = 0;
  }
  { std::lock_guard<std::mutex> g(mImpl->shared->lock); mImpl->shared->listeningId = inputId; }
  if (inputId.empty()) return;
  if (MIDIEndpointRef src = FindEndpoint(inputId, true))
  {
    MIDIPortConnectSource(mImpl->inPort, src, nullptr);
    mImpl->listening = src;
  }
}
