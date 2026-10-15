/* Route physical key presses to their original note and instrument until release. */
(function(root){
  function bind(options){
    const win=options.window,doc=win.document,held=new Map();
    const typing=target=>target?.isContentEditable||target?.closest?.('[contenteditable=true]')||target?.tagName==='TEXTAREA'||target?.tagName==='SELECT'||target?.tagName==='INPUT'&&!['range','button','checkbox','radio'].includes(target.type);
    const physicalCode=event=>event.code&&event.code!=='Unidentified'?event.code:([...'abcdefghijklmnopqrstuvwxyz'].includes(event.key?.toLowerCase())?'Key'+event.key.toUpperCase():({';':'Semicolon',"'":'Quote','[':'BracketLeft',']':'BracketRight'}[event.key]||event.key));
    function release(code){const press=held.get(code);if(!press)return;held.delete(code);if(press.started){if(press.synth)press.synth.noteOff(press.note);else options.stop(press.note);options.highlight?.(press.note,false);}}
    function releaseAll(){for(const code of held.keys())release(code);}
    async function down(event){
      if(event.repeat||event.metaKey||event.ctrlKey||event.altKey||typing(event.target))return;
      const code=physicalCode(event);
      if(options.shortcuts?.(code)){event.preventDefault();return;}
      const offset=options.map[code];if(offset===undefined||held.has(code))return;
      event.preventDefault();
      const note=(options.octave()+1)*12+offset,synth=options.software?.();
      const press={note,synth,started:false};held.set(code,press);
      if(synth){
        // A key may be released or the view changed while the audio engine starts.
        try{if(!await synth.start()||held.get(code)!==press||!synth.selected())return;}
        catch(error){held.delete(code);options.error?.(error);return;}
        synth.noteOn(note,options.velocity());
      }else options.play(note,options.velocity());
      press.started=true;options.highlight?.(note,true);
    }
    function up(event){const code=physicalCode(event);if(held.has(code)){event.preventDefault();release(code);}}
    const visibility=()=>{if(doc.hidden)releaseAll();};
    win.addEventListener('keydown',down);win.addEventListener('keyup',up);win.addEventListener('blur',releaseAll);doc.addEventListener('visibilitychange',visibility);
    return {releaseAll,destroy(){releaseAll();win.removeEventListener('keydown',down);win.removeEventListener('keyup',up);win.removeEventListener('blur',releaseAll);doc.removeEventListener('visibilitychange',visibility);}};
  }
  const api={bind};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusMacKeyboard=api;
})(typeof window!=='undefined'?window:globalThis);
