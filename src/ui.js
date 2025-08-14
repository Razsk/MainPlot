import { $, on, nameDialog, copyToClipboard, downloadBlob, logBackup, toastBackup, id } from './utils.js';
import { store, findNode, removeById, isDescendant, insertAt, firstScene, findParent } from './state.js';
import { buildPrompt } from './prompt-builder.js';
import { OPTION_SPECS, DEFAULT_OPTS } from './config.js';

export const els={
  left:$('left'), right:$('right'), tree:$('tree'), addFolder:$('addFolder'), addScene:$('addScene'),
  backup:$('backup'), restore:$('restore'), restoreFile:$('restoreFile'), title:$('title'), scene:$('scene'),
  preview:$('preview'), wc:$('wc'), projectTitle:$('projectTitle'), notes:$('notes'), style:$('style'),
  tone:$('tone'), creativity:$('creativity'), outline:$('outline'), outlineEnabled:$('outlineEnabled'),
  btnGenOutline:$('btnGenOutline'), btnSceneToOutline:$('btnSceneToOutline'), exportOutline:$('exportOutline'),
  exportTxt:$('exportTxt'), copyPrompt:$('copyPrompt'), copyStatus:$('copyStatus'), toggleLeft:$('toggleLeft'),
  toggleRight:$('toggleRight'), helpBtn:$('helpBtn'), helpModal:$('helpModal'), helpClose:$('helpClose'),
  backupStatus:$('backupStatus'), backupManual:$('backupManual'), optionsStrip:$('optionsStrip')
};

let lastAction = 'continue';
let selectedFolderId = null;
let draggingId=null, dropTarget=null;

function renderNodeToString(n, depth) {
  const state = store.getState();
  const childrenHtml = n.type === 'folder' && n.children ? n.children.map(c => renderNodeToString(c, depth + 1)).join('') : '';
  const isActive = n.id === state.currentId ? ' active' : '';
  const isSelected = n.id === selectedFolderId ? ' selected' : '';
  const icon = n.type === 'folder' ? '📁' : '📄';
  const marginLeft = depth > 0 ? `style="margin-left:${depth * 14}px"` : '';

  return `
    <div class="node${isActive}${isSelected}" data-id="${n.id}" draggable="true" ${marginLeft}>
      <span class="icon">${icon}</span>
      <div class="name">${n.name}</div>
      <div class="ops">
        <button class="pill" data-op="rename" data-id="${n.id}" title="Rename">✎</button>
        <button class="pill" data-op="delete" data-id="${n.id}" title="Delete">🗑</button>
      </div>
    </div>
    ${childrenHtml}
  `;
}

function attachTreeEventListeners() {
  const state = store.getState();
  if (!els.tree) return;

  els.tree.addEventListener('click', async (e) => {
    const target = e.target;
    const nodeEl = target.closest('.node');
    if (!nodeEl) return;

    const id = nodeEl.dataset.id;
    const op = target.dataset.op;

    if (op === 'rename') {
      await renameNode(id);
      return;
    }
    if (op === 'delete') {
      deleteNode(id);
      return;
    }

    const node = findNode(state.tree, id);
    if (node.type === 'scene') {
      openNode(id);
      selectedFolderId = null;
      renderTree();
    } else {
      selectedFolderId = id;
      renderTree();
    }
  });

  els.tree.addEventListener('dragstart', (e) => {
    const nodeEl = e.target.closest('.node');
    if (!nodeEl) return;
    draggingId = nodeEl.dataset.id;
    nodeEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggingId);
  });

  els.tree.addEventListener('dragend', () => {
    draggingId = null;
    clearDropStyles();
  });

  els.tree.addEventListener('dragover', (e) => {
    const nodeEl = e.target.closest('.node');
    if (!draggingId || !nodeEl || draggingId === nodeEl.dataset.id) return;
    e.preventDefault();
    const node = findNode(state.tree, nodeEl.dataset.id);
    const pos = computeDropPosition(e, nodeEl, node);
    markDrop(nodeEl, pos);
    dropTarget = { targetId: nodeEl.dataset.id, pos };
  });

  els.tree.addEventListener('dragleave', (e) => {
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      unmarkDrop(nodeEl);
    }
  });

  els.tree.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggingId) return;
    performDrop();
    clearDropStyles();
  });
}

function computeDropPosition(e,div,node){
  const r=div.getBoundingClientRect();
  const y=e.clientY - r.top;
  const third=r.height/3;
  if(y<third) return 'before';
  if(y>r.height-third) return 'after';
  return node.type==='folder' ? 'inside' : 'after';
}

function markDrop(div,pos){
  unmarkDrop(div);
  div.classList.add('drop-'+pos);
}

function unmarkDrop(div){
  div.classList.remove('drop-before','drop-after','drop-inside');
}

function clearDropStyles(){
  document.querySelectorAll('.node').forEach(n=> n.classList.remove('dragging','drop-before','drop-after','drop-inside'));
}

function performDrop(){
  const srcId=draggingId;
  draggingId=null;
  if(!srcId || !dropTarget || srcId===dropTarget.targetId) return;
  const { targetId, pos } = dropTarget;
  if(pos==='inside' && isDescendant(srcId,targetId)) return;
  if(isDescendant(srcId,targetId) && pos!=='inside') return;
  const moved=removeById(srcId);
  if(!moved) return;
  const state = store.getState();
  const tParent=findParent(state.tree,targetId);
  if(!tParent) return;
  if(pos==='inside'){
    const tNode=findNode(state.tree, targetId);
    if(tNode.type!=='folder'){
      insertAt(tParent.parentArray,moved,tParent.index+1);
    } else {
      tNode.children=tNode.children||[];
      tNode.children.push(moved);
    }
  } else if(pos==='before'){
    insertAt(tParent.parentArray,moved,tParent.index);
  } else {
    insertAt(tParent.parentArray,moved,tParent.index+1);
  }
  store.setTree(state.tree);
  renderTree();
}

async function renameNode(nid){
  const state = store.getState();
  const n=findNode(state.tree,nid);
  if(!n) return;
  const v=await nameDialog({title:'Rename',label:'New name',value:n.name});
  if(v===null) return;
  n.name=v.trim()||n.name;
  store.setTree(state.tree);
  renderTree();
  if(nid===state.currentId && els.title) els.title.value=n.name;
}

function deleteNode(nid){
  if(!confirm('Delete item? (Folders delete all children)')) return;
  removeById(nid);
  const state = store.getState();
  if(state.currentId===nid) store.setCurrentId(null);
  store.setTree(state.tree);
  renderTree();
  openFirstScene();
}

function openNode(nid){
  const state = store.getState();
  const n=findNode(state.tree,nid);
  if(!n || n.type!=='scene') return;
  console.log(`UI: Opening scene: "${n.name}" (id=${nid})`);
  store.setCurrentId(nid);
  if(els.title) els.title.value=n.name;
  if(els.scene) els.scene.value=n.content||'';
  if(els.scene) { els.scene.style.flex=''; els.scene.style.height=''; }
  if(els.preview) { els.preview.style.flex=''; els.preview.style.height=''; els.preview.value=''; }
  renderTree();
  updateWC();
}

export function updateWC(){
  if(!els.scene||!els.wc) return;
  const t=els.scene.value.trim();
  els.wc.textContent=(t?t.split(/\s+/).length:0)+' words';
}

function getOpts(action){
  const state = store.getState();
  const saved=state.meta.actionOptions?.[action];
  return Object.assign({}, DEFAULT_OPTS[action]||{}, saved||{});
}

function buildOptionsUI(action){
  const wrap=els.optionsStrip;
  if(!wrap) return;
  const spec=OPTION_SPECS[action];
  if(!spec){
    wrap.classList.remove('open');
    wrap.innerHTML='';
    return;
  }
  wrap.innerHTML='';
  wrap.classList.add('open');
  const current=getOpts(action);
  Object.entries(spec).forEach(([group, arr])=>{
    const g=document.createElement('div');
    g.className='group';
    const label=document.createElement('span');
    label.className='label';
    label.textContent=group+':';
    g.appendChild(label);
    arr.forEach(([val, labelText])=>{
      const b=document.createElement('button');
      b.className='chip'+(current[group]===val?' active':'');
      b.textContent=labelText;
      b.title=`${group}: ${labelText}`;
      b.addEventListener('click', ()=>{
        store.setActionOption(action, group, val);
        if(els.preview) els.preview.value=buildPrompt(action);
        highlightOptions(action);
      });
      g.appendChild(b);
    });
    wrap.appendChild(g);
  });
  // Clear button
  const clear=document.createElement('button');
  clear.className='chip';
  clear.textContent='Reset';
  clear.title='Reset options to default';
  clear.addEventListener('click', ()=>{
    store.setActionOption(action, null, null);
    if(els.preview) els.preview.value=buildPrompt(action);
    highlightOptions(action);
  });
  wrap.appendChild(clear);
  highlightOptions(action);
}

function highlightOptions(action){
  const current=getOpts(action);
  const wrap=els.optionsStrip;
  if(!wrap) return;
  Array.from(wrap.querySelectorAll('.group')).forEach(g=>{
    const label=g.querySelector('.label')?.textContent.replace(':','');
    const btns=g.querySelectorAll('.chip');
    btns.forEach((b,i)=>{
      const spec=OPTION_SPECS[action][label];
      const val=spec && spec[i] && spec[i][0];
      if(val){
        if(current[label]===val) b.classList.add('active');
        else b.classList.remove('active');
      }
    });
  });
}

function status(msg, cls){
  if(!els.copyStatus) return;
  els.copyStatus.textContent=msg;
  els.copyStatus.className='small '+cls;
  clearTimeout(status._t);
  status._t=setTimeout(()=>{ if(els.copyStatus) els.copyStatus.textContent=''; },3000);
}

function scrollPreviewIntoView(){
  $('preview')?.scrollIntoView({block:'center',behavior:'smooth'});
}

function openHelp(){
  els.helpModal?.classList.add('open');
  els.helpModal?.setAttribute('aria-hidden','false');
}

function closeHelp(){
  els.helpModal?.classList.remove('open');
  els.helpModal?.setAttribute('aria-hidden','true');
}

async function backupProject(){
  try{
    const state = store.getState();
    const filename=(state.meta.projectTitle||'project')+'_backup.json';
    const data=JSON.stringify(state,null,2);
    logBackup('Starting backup…');
    if(window.showSaveFilePicker){
      try{
        const handle=await window.showSaveFilePicker({
          suggestedName: filename,
          types:[{ description:'JSON', accept:{ 'application/json':['.json'] } }]
        });
        const writable=await handle.createWritable();
        await writable.write(new Blob([data],{type:'application/json'}));
        await writable.close();
        logBackup('Saved via file picker.');
        return true;
      }catch(err){
        logBackup('Save picker not used / cancelled');
      }
    }
    try{
      downloadBlob(new Blob([data],{type:'application/json'}), filename);
      return true;
    }catch(err){
      console.error('Download method failed',err);
    }
    try{
      await copyToClipboard(data);
      logBackup('Backup copied to clipboard.');
      toastBackup('Backup JSON copied to clipboard.', 'ok');
      return true;
    }catch(err){
      console.error('Clipboard backup failed',err);
    }
    $('rawText').value=data;
    openRaw(true);
    logBackup('Showing backup JSON in window. You can copy manually.');
    toastBackup('Could not download — showing JSON to copy.', 'warn');
    return false;
  }catch(err){
    console.error('Backup crashed',err);
    toastBackup('Backup failed', 'danger');
    Debug.open();
    return false;
  }
}

const rawBox=$('rawModal');
function openRaw(open){
  if(!rawBox) return;
  if(open){
    rawBox.classList.add('open');
  } else {
    rawBox.classList.remove('open');
  }
}

export function renderTree(){
  const state = store.getState();
  if(!Array.isArray(state.tree)) state.tree=[];
  if(!els.tree) return;
  els.tree.innerHTML = state.tree.map(n => renderNodeToString(n, 0)).join('');
}

export function hydrateMeta(){
  const state = store.getState();
  if(!els.projectTitle) return;
  els.projectTitle.value=state.meta.projectTitle||'';
  els.notes.value=state.meta.notes||'';
  els.style.value=state.meta.style||'';
  els.tone.value=state.meta.tone||'';
  els.creativity.value=state.meta.creativity||'balanced';
  els.outline.value=state.meta.outline||'';
  els.outlineEnabled.checked = state.meta.outlineEnabled ?? true;
  document.title = `${state.meta.projectTitle||'Untitled'} — MainPlot v4.0`;
}

export function openFirstScene(){
  const state = store.getState();
  if(state.currentId && findNode(state.tree,state.currentId)){
    openNode(state.currentId);
    return;
  }
  const first = firstScene(state.tree);
  if(first) openNode(first.id);
}

export function addEventListeners(){
  console.log('UI: Attaching event listeners...');
  attachTreeEventListeners();

  on(els.addFolder, 'click', async ()=>{
    try{
      console.log('Add Folder clicked. selectedFolderId=', selectedFolderId);
      const name=await nameDialog({title:'New Folder',label:'Folder name',value:'New Folder'});
      if(!name){ console.warn('Add Folder cancelled'); return; }
      const folder={id:id(), type:'folder', name:name.trim(), children:[]};
      const state = store.getState();
      const parent= selectedFolderId ? findNode(state.tree, selectedFolderId) : null;
      if(parent && parent.type==='folder'){
        parent.children=parent.children||[];
        parent.children.push(folder);
      } else {
        state.tree.push(folder);
      }
      selectedFolderId=folder.id;
      store.setTree(state.tree);
      renderTree();
    }catch(err){
      console.error('Add Folder failed',err);
      Debug.open();
    }
  }, 'addFolder');

  on(els.addScene, 'click', async ()=>{
    try{
      console.log('Add Scene clicked. selectedFolderId=', selectedFolderId);
      const name=await nameDialog({title:'New Scene',label:'Scene name',value:'New Scene'});
      if(!name){ console.warn('Add Scene cancelled'); return; }
      const sceneNode={id:id(), type:'scene', name:name.trim(), content:''};
      const state = store.getState();
      const parent= selectedFolderId ? findNode(state.tree, selectedFolderId) : null;
      if(parent && parent.type==='folder'){
        parent.children=parent.children||[];
        parent.children.push(sceneNode);
      } else {
        state.tree.push(sceneNode);
      }
      store.setTree(state.tree);
      renderTree();
      openNode(sceneNode.id);
    }catch(err){
      console.error('Add Scene failed',err);
      Debug.open();
    }
  }, 'addScene');

  on(els.title,'input', ()=>{
    const state = store.getState();
    const n=findNode(state.tree,state.currentId);
    if(!n) return;
    n.name=els.title.value;
    store.setTree(state.tree);
    renderTree();
  }, 'title');

  on(els.scene,'input', ()=>{
    const state = store.getState();
    const n=findNode(state.tree,state.currentId);
    if(!n) return;
    n.content=els.scene.value;
    store.setTree(state.tree);
    updateWC();
  }, 'scene');

  on(els.projectTitle,'input', ()=>{
    store.setMeta({projectTitle: els.projectTitle.value});
    document.title=`${store.getState().meta.projectTitle||'Untitled'} — MainPlot v4.0`;
  }, 'projectTitle');

  [els.notes,els.style,els.tone,els.creativity].forEach(el=>{
    on(el,'input', ()=>{
      store.setMeta({
        notes: els.notes?.value||'',
        style: els.style?.value||'',
        tone: els.tone?.value||'',
        creativity: els.creativity?.value||'balanced'
      });
    }, el?.id);
  });

  on(els.outline,'input', ()=>{
    store.setMeta({outline: els.outline.value});
  }, 'outline');

  on(els.outlineEnabled,'change', ()=>{
    store.setMeta({outlineEnabled: !!els.outlineEnabled.checked});
  }, 'outlineEnabled');

  Array.from(document.querySelectorAll('.btn')).forEach(b=> {
    on(b,'click', ()=>{
      lastAction=b.dataset.action||'continue';
      console.log(`UI: Action button clicked: ${lastAction}`);
      if(els.preview) els.preview.value=buildPrompt(lastAction);
      buildOptionsUI(lastAction);
      scrollPreviewIntoView();
    }, b.textContent.trim())
  });

  on(els.copyPrompt,'click', async ()=>{
    const txt=(els.preview?.value||'').trim();
    if(!txt){ status('Nothing to copy.','warn'); return; }
    const ok=await copyToClipboard(txt);
    status(ok? 'Copied! Paste into ChatGPT.' : 'Copy failed — text selected so you can copy with Ctrl/Cmd+C.', ''+(ok?'ok':'danger'));
    if(!ok && els.preview){
      els.preview.focus();
      els.preview.select();
    }
  }, 'copyPrompt');

  on(els.btnGenOutline,'click', ()=>{
    const state = store.getState();
    const ctx = {
      scene: findNode(state.tree, state.currentId)?.content || '(none)'
    };
    const prompt=`You are a story structure coach. Build a clean, chapter‑by‑chapter outline from PROJECT NOTES (and optional scene text), using:\n- Headings: "### Chapter N: Title"\n- 2–5 concise beats per chapter ("- Beat: ...")\n- Optional Acts as "## Act I/II/III".\n\nPROJECT NOTES:\n${state.meta.notes || '(none)'}\n\nOPTIONAL SCENE CONTEXT (may be partial):\n${ctx.scene}\n`;
    if(els.preview) els.preview.value=prompt;
    els.optionsStrip && els.optionsStrip.classList.remove('open');
    scrollPreviewIntoView();
  }, 'btnGenOutline');

  on(els.btnSceneToOutline,'click', ()=>{
    const state = store.getState();
    const sceneNode = findNode(state.tree, state.currentId);
    const prompt=`Summarize the CURRENT SCENE into 3–6 "Beat:" lines suitable for the global outline.\nKeep names, stakes, turning point, and consequences.\n\nCURRENT SCENE — ${sceneNode?.name || ''}:\n${sceneNode?.content || '(empty)'}\n`;
    if(els.preview) els.preview.value=prompt;
    els.optionsStrip && els.optionsStrip.classList.remove('open');
    scrollPreviewIntoView();
  }, 'btnSceneToOutline');

  on(els.exportOutline,'click', ()=>{
    const state = store.getState();
    const blob=new Blob([state.meta.outline||''],{type:'text/markdown'});
    downloadBlob(blob,(state.meta.projectTitle||'outline')+'.md');
  }, 'exportOutline');

  on(els.exportTxt,'click', ()=>{
    const state = store.getState();
    const n=findNode(state.tree,state.currentId);
    if(!n) return;
    downloadBlob(new Blob([n.content||''],{type:'text/plain'}),(n.name||'scene')+'.txt');
  }, 'exportTxt');

  on(els.backup,'click', ()=> { backupProject(); }, 'backup');

  on(els.restore,'click', ()=> els.restoreFile && els.restoreFile.click(), 'restore');

  on(els.restoreFile,'change', async (e)=>{
    const f=e.target.files[0];
    if(!f) return;
    try{
      const state = JSON.parse(await f.text());
      store.setState(state);
      hydrateMeta();
      selectedFolderId=null;
      renderTree();
      openFirstScene();
      logBackup('Restore complete');
    }catch{
      alert('Invalid backup file');
    }
    e.target.value='';
  }, 'restoreFile');

  on($('rawHide'),'click',()=> openRaw(false),'rawHide');
  on($('rawClose'),'click',()=> openRaw(false),'rawClose');
  on($('rawCopy'),'click',async()=>{
    try{
      await copyToClipboard($('rawText')?.value||'');
      toastBackup('Copied JSON to clipboard.','ok');
    }catch{
      toastBackup('Clipboard blocked — select all and copy.','warn');
    }
  },'rawCopy');

  (function(){
    const bar=$('dragbar');
    const scene=$('scene');
    const preview=$('preview');
    if(!bar||!scene||!preview) return;
    let dragging=false, startY=0, startSceneH=0, startPrevH=0;
    function startDrag(y){
      dragging=true;
      startY=y;
      startSceneH=scene.getBoundingClientRect().height;
      startPrevH=preview.getBoundingClientRect().height;
      scene.style.flex=`0 0 ${startSceneH}px`;
      preview.style.flex=`0 0 ${startPrevH}px`;
      document.body.style.userSelect='none';
    }
    function moveDrag(y){
      if(!dragging) return;
      const dy=y-startY;
      const newSceneH=Math.max(100, startSceneH + dy);
      const newPrevH=Math.max(100, startPrevH - dy);
      scene.style.flex=`0 0 ${newSceneH}px`;
      preview.style.flex=`0 0 ${newPrevH}px`;
    }
    function endDrag(){
      dragging=false;
      document.body.style.userSelect='';
    }
    on(bar,'mousedown',(e)=> startDrag(e.clientY),'dragbar_mousedown');
    window.addEventListener('mousemove',(e)=> moveDrag(e.clientY));
    window.addEventListener('mouseup', endDrag);
    on(bar,'touchstart',(e)=>{
      const t=e.touches[0];
      startDrag(t.clientY);
    },'dragbar_touchstart');
    window.addEventListener('touchmove',(e)=>{
      const t=e.touches[0];
      moveDrag(t.clientY);
    });
    window.addEventListener('touchend', endDrag);
    on(bar,'dblclick', ()=>{
      scene.style.flex='';
      preview.style.flex='';
    },'dragbar_dblclick');
  })();

  on(els.toggleLeft,'click', ()=> {
    if(!els.left) return;
    els.left.style.display = (els.left.style.display==='none'?'':'none');
  }, 'toggleLeft');

  on(els.toggleRight,'click', ()=> {
    if(!els.right) return;
    els.right.style.display = (els.right.style.display==='none'?'':'none');
  }, 'toggleRight');

  on(els.helpBtn,'click', openHelp,'helpBtn');
  on(els.helpClose,'click', closeHelp,'helpClose');
  on(els.helpModal,'click',(e)=>{
    if(e.target===els.helpModal) closeHelp();
  },'helpModalBackdrop');

  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase()==='d'){
      e.preventDefault();
      Debug.toggle();
    }
  });

  function smartBuild(){
    const hasSel=!!getSelectionFromTextarea(els.scene);
    const action=hasSel? 'rewrite' : (lastAction||'continue');
    if(els.preview) els.preview.value=buildPrompt(action);
    buildOptionsUI(action);
    scrollPreviewIntoView();
  }

  window.addEventListener('keydown', (e)=>{
    if(e.key==='F1' || (e.shiftKey && (e.key==='?' || e.key==='/'))){
      e.preventDefault();
      openHelp();
      return;
    }
    if(e.key==='Escape'){
      closeHelp();
      return;
    }
    if(e.altKey && !(e.ctrlKey || e.metaKey)){
      const map={ '1':'continue','2':'rewrite','3':'expand','4':'conflict','5':'describe','6':'summarize','7':'brainstorm' };
      if(map[e.key]){
        e.preventDefault();
        lastAction=map[e.key];
        if(els.preview) els.preview.value=buildPrompt(lastAction);
        buildOptionsUI(lastAction);
        scrollPreviewIntoView();
      }
    }
    if((e.ctrlKey || e.metaKey) && e.key==='Enter'){
      e.preventDefault();
      smartBuild();
    }
    if((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase()==='c')){
      e.preventDefault();
      els.copyPrompt && els.copyPrompt.click();
    }
    if((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey){
      const k=e.key.toLowerCase();
      if(k==='b'){
        e.preventDefault();
        backupProject();
      } else if(k==='o'){
        e.preventDefault();
        els.restore && els.restore.click();
      } else if(k==='e'){
        e.preventDefault();
        $('exportTxt') && $('exportTxt').click();
      }
    }
    if((e.ctrlKey || e.metaKey) && e.shiftKey){
      const k=e.key.toLowerCase();
      if(k==='g'){
        e.preventDefault();
        els.btnGenOutline && els.btnGenOutline.click();
      } else if(k==='s'){
        e.preventDefault();
        els.btnSceneToOutline && els.btnSceneToOutline.click();
      }
    }
    if((e.ctrlKey || e.metaKey) && e.altKey){
      const k=e.key.toLowerCase();
      if(k==='l'){
        e.preventDefault();
        els.toggleLeft && els.toggleLeft.click();
      } else if(k==='n'){
        e.preventDefault();
        els.toggleRight && els.toggleRight.click();
      }
    }
  });
}
