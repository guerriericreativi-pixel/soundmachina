#pragma once

// Accesso MIDI nativo per Virus H.
// Dentro un plugin la WebView non ha Web MIDI: l'interfaccia web parla con questo
// modulo tramite web-midi-shim.js, che ricrea navigator.requestMIDIAccess.
// Su macOS usa CoreMIDI direttamente (porte USB del Virus), cosi' SysEx e CC
// arrivano anche nei DAW che filtrano il SysEx in uscita dai plugin.

#include <cstdint>
#include <functional>
#include <string>
#include <vector>

class VirusMidi
{
public:
  struct Port
  {
    std::string id;     // identificativo stabile (MIDIUniqueID)
    std::string name;
    std::string manufacturer;
    bool isInput = false;
  };

  // portId, byte ricevuti (chiamato sul thread principale)
  using InputCallback = std::function<void(const std::string&, const std::vector<uint8_t>&)>;
  // chiamato sul thread principale quando cambiano i dispositivi collegati
  using ChangeCallback = std::function<void()>;

  VirusMidi(InputCallback onInput, ChangeCallback onChange);
  ~VirusMidi();

  std::vector<Port> ListPorts() const;
  bool Send(const std::string& outputId, const uint8_t* data, size_t size);
  void ListenTo(const std::string& inputId);   // "" = nessun ingresso

private:
  struct Impl;
  Impl* mImpl = nullptr;
};
