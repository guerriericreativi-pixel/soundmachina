/* VIRUS-H adapter for webDX7's unmodified MIT/Apache-2.0 MSFA WASM. */
class VirusDx7Processor extends AudioWorkletProcessor {
  constructor(){
    super();this.ready=false;this.muted=true;this.frames=0;this.patch=null;
    this.port.onmessage=event=>this.message(event.data);
    if(Module.calledRun)this.init();else Module.onRuntimeInitialized=()=>this.init();
  }
  init(){
    try{
      this.ctor=Module.cwrap('createModule','number',[]);
      this.initModule=Module.cwrap('wam_init',null,['number','number','number','string']);
      this.midi=Module.cwrap('wam_onmidi',null,['number','number','number','number']);
      this.patchModule=Module.cwrap('wam_onpatch',null,['number','number','number']);
      this.param=Module.cwrap('wam_onparam',null,['number','number','number']);
      this.render=Module.cwrap('wam_onprocess',null,['number','number','number']);
      this.inst=this.ctor();this.initModule(this.inst,128,sampleRate,'');
      this.patchPtr=Module._malloc(155);this.outPtr=Module._malloc(128*4);
      this.outBus=Module._malloc(4);Module.setValue(this.outBus,this.outPtr,'i32');
      this.bus=Module._malloc(8);Module.setValue(this.bus,0,'i32');Module.setValue(this.bus+4,this.outBus,'i32');
      this.ready=true;this.port.postMessage({type:'ready'});
    }catch(error){this.port.postMessage({type:'error',message:error.message});}
  }
  message(msg){
    if(!this.ready)return;
    if(msg.type==='patch'&&msg.data?.length===155){
      this.panic();this.patch=Uint8Array.from(msg.data);Module.HEAPU8.set(this.patch,this.patchPtr);this.patchModule(this.inst,this.patchPtr,145);
    }else if(msg.type==='param'&&Number.isInteger(msg.index)&&msg.index>=0&&msg.index<145&&Number.isInteger(msg.value)&&msg.value>=0&&msg.value<128){
      this.param(this.inst,msg.index,msg.value);
    }else if(msg.type==='midi'&&msg.data?.length===3&&msg.data.every(v=>Number.isInteger(v)&&v>=0&&v<=255)){
      const [status,note,value]=msg.data;if(note>127||value>127)return;
      if((status&240)===144&&value>0)this.muted=false;
      this.midi(this.inst,status,note,value);
    }else if(msg.type==='panic')this.panic();
  }
  panic(){
    this.midi(this.inst,176,64,0);
    for(let note=0;note<128;note++)this.midi(this.inst,128,note,0);
    this.muted=true;
  }
  process(inputs,outputs){
    if(!this.ready)return true;
    this.render(this.inst,this.bus,0);
    const data=Module.HEAPF32.subarray(this.outPtr/4,this.outPtr/4+128);let peak=0;
    for(const output of outputs[0]||[]){for(let i=0;i<output.length;i++){const n=this.muted?0:data[i];output[i]=Number.isFinite(n)?n:0;peak=Math.max(peak,Math.abs(output[i]));}}
    if(++this.frames%16===0)this.port.postMessage({type:'meter',peak});
    return true;
  }
}
registerProcessor('virus-dx7',VirusDx7Processor);
