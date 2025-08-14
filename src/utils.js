/* ===== Helpers ===== */
export const $ = (id) => document.getElementById(id);
export const on = (el, evt, handler, name) => { if(el && el.addEventListener){ el.addEventListener(evt, handler); } else { console.warn('Listener skipped (missing el):', name || (el && el.id) || evt); } };
export const id = () => 'n'+Math.random().toString(36).slice(2,9);

/* ===== Debug Console (safe init) ===== */
export const Debug = (() => {
  const out = $('dbgOut');
  const box = $('debug');
  const buf = [];
  const MAX = 2000;
  function add(line){ try { const ts=new Date().toISOString().split('T')[1].replace('Z',''); buf.push(`[${ts}] ${line}`); if(buf.length>MAX) buf.shift(); if(out){ out.textContent = buf.join('\n'); out.scrollTop = out.scrollHeight; } } catch {} }
  function open(){ box && box.classList.add('open'); }
  function close(){ box && box.classList.remove('open'); }
  function toggle(){ box && box.classList.toggle('open'); }
  ['log','warn','error'].forEach(fn => { const orig = console[fn].bind(console); console[fn] = (...args) => { try{ add(fn.toUpperCase()+': '+args.map(a => (typeof a==='string'?a:JSON.stringify(a))).join(' ')); }catch{} orig(...args); }; });
  window.addEventListener('error', e=> add('ERROR: '+e.message+' @ '+e.filename+':'+e.lineno));
  window.addEventListener('unhandledrejection', e=> add('REJECTION: '+(e.reason && e.reason.message || e.reason)));
  on($('dbgCopy'),'click', async () => { try{ await navigator.clipboard.writeText(out?.textContent||''); console.log('Copied debug logs'); }catch{ add('WARN: Clipboard write failed'); } }, 'dbgCopy');
  on($('dbgClear'),'click', () => { buf.length=0; if(out) out.textContent=''; }, 'dbgClear');
  on($('dbgClose'),'click', close, 'dbgClose');
  return { add, open, close, toggle };
})();

/* ===== Name dialog ===== */
export function nameDialog({title='Name', label='Name', value='', placeholder='' }={}){
  return new Promise(resolve=>{
    const modal=$('nameModal'); const input=$('nameInput'); const ok=$('nameOk'); const cancel=$('nameCancel'); const close=$('nameClose');
    if(!modal||!input||!ok||!cancel||!close){ console.warn('Name dialog missing elements'); resolve(null); return; }
    $('nameTitle').textContent=title; $('nameLabel').textContent=label; input.value=value||''; input.placeholder=placeholder||'';
    function done(val){ modal.classList.remove('open'); modal.removeEventListener('keydown', onKey); resolve(val); }
    function onKey(e){ if(e.key==='Enter'){ e.preventDefault(); ok.click(); } if(e.key==='Escape'){ e.preventDefault(); cancel.click(); } }
    ok.onclick=()=>{ const v=input.value.trim(); if(!v){ input.focus(); return; } done(v); };
    cancel.onclick=()=> done(null); close.onclick=()=> done(null);
    modal.classList.add('open'); setTimeout(()=>{ input.focus(); input.select(); }, 0); modal.addEventListener('keydown', onKey);
  });
}

/* ===== Clipboard & Download ===== */
export async function copyToClipboard(text){
  try{
    if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); return true; }
  }catch{}
  try{
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.top='-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok=document.execCommand('copy');
    document.body.removeChild(ta);
    if(ok) return true;
  }catch{}
  return false;
}

export function downloadBlob(blob, name){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=(name||'download').replace(/[^\w\-\.]+/g,'_');
  document.body.appendChild(a);
  a.click();
  a.remove();
  showManualDownload(url, name);
}

let _manualTimer=null, _lastUrl=null;
function showManualDownload(url, name){
  try{
    if(_manualTimer){ clearTimeout(_manualTimer); _manualTimer=null; }
    if(_lastUrl && _lastUrl!==url){ try{ URL.revokeObjectURL(_lastUrl); }catch{} }
    _lastUrl=url;
    const link=$('backupManual');
    if(!link) return;
    link.href=url;
    link.download=(name||'backup.json').replace(/[^\w\-\.]+/g,'_');
    link.style.display='inline';
    logBackup('Download triggered. Manual link shown.');
    _manualTimer=setTimeout(()=>{
      link.style.display='none';
      try{ URL.revokeObjectURL(url); }catch{}
    }, 60000);
  }catch(err){
    console.error('Manual link setup failed',err);
  }
}

export function logBackup(msg){
  console.log('BACKUP:', msg);
  toastBackup(msg,'');
}

export function toastBackup(msg, cls){
  const el=$('backupStatus');
  if(!el) return;
  el.textContent=msg;
  el.className='small '+(cls||'');
  clearTimeout(toastBackup._t);
  toastBackup._t=setTimeout(()=> { if(el) el.textContent=''; }, 5000);
}
