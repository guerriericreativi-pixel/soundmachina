/* Server session determines catalogue authority. Loopback preview belongs to the owner. */
(function(root){
  'use strict';
  const session=root.VirusHSession,local=!session&&(root.location?.protocol==='file:'||['127.0.0.1','localhost','[::1]'].includes(root.location?.hostname));
  const admin=session?.role==='admin'||local;
  function requireWrite(){if(!admin)throw Error('Solo l’amministratore può inserire o modificare patch e banchi.');}
  root.VirusAccess=Object.freeze({isAdmin:admin,role:admin?'admin':'user',remote:session?.catalogue||null,csrf:session?.csrf||'',requireWrite});
  const restricted='#btnImportSyx,#btnSavePatch,#btnSaveMulti,#btnRestoreBackup,#pmAddOriginalBank,#btnFetchBank,[data-bank-action=import],[data-bank-action=restore],[data-bank-cover-upload],[data-studio-action=save],[data-studio-action=capture],[data-studio-action=import],[data-studio-action=restore],[data-instrument-save],[data-dx-action=import],[data-vsp-action=add-sounds],#desktopButton32,.lib-item .delete,#pmSounds .pm-save,#pmMultis .pm-save';
  function update(){
    root.document.documentElement.dataset.accessRole=admin?'admin':'user';
    if(!admin)root.document.querySelectorAll(restricted).forEach(node=>{node.dataset.adminOnly='';node.hidden=true;});
    const note=root.document.getElementById('pmAccessRole');const label=admin?'Amministratore · gestione patch abilitata':'Accesso utente · scegli e carica i suoni del catalogo';if(note&&note.textContent!==label)note.textContent=label;
  }
  root.document.addEventListener('DOMContentLoaded',()=>{const style=root.document.createElement('style');style.textContent='html[data-access-role="user"] [data-admin-only]{display:none!important}';root.document.head.append(style);update();const observer=new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1)))update();});observer.observe(root.document.body,{childList:true,subtree:true});});
})(typeof window!=='undefined'?window:globalThis);
