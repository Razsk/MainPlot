import { store, findNode } from './state.js';
import { DEFAULT_OPTS, OPTION_SPECS } from './config.js';
import { $ } from './utils.js';

function getOpts(action){
  const state = store.getState();
  const saved=state.meta.actionOptions?.[action];
  return Object.assign({}, DEFAULT_OPTS[action]||{}, saved||{});
}

function getSelectionFromTextarea(ta){
  return ta? ta.value.substring(ta.selectionStart||0, ta.selectionEnd||0).trim() : '';
}

function collectContext(){
  const state = store.getState();
  const n=findNode(state.tree,state.currentId)||{};
  return {
    projectTitle:state.meta.projectTitle||'',
    notes:state.meta.notes||'',
    style:state.meta.style||'',
    tone:state.meta.tone||'',
    creativity:state.meta.creativity||'balanced',
    sceneName:n.name||'',
    scene:n.content||'',
    selection:getSelectionFromTextarea($('scene'))
  };
}

function optionsToText(action,opt){
  switch(action){
    case 'continue': return `PREFERENCES: Target length: ${ opt.length==='short'?'2–3 paragraphs': opt.length==='long'?'~600 words':'3–5 paragraphs' }. Tempo: ${opt.tempo}.`;
    case 'rewrite': return `PREFERENCES: Rewrite strength: ${opt.strength}. Primary focus: ${opt.focus}.`;
    case 'expand': return `PREFERENCES: Add ${opt.size==='sentences'?'+3–5 sentences':'+1–2 paragraphs'} focusing on ${opt.focus}.`;
    case 'conflict': return `PREFERENCES: Conflict type: ${opt.type}. Intensity: ${opt.intensity}.`;
    case 'describe': return `PREFERENCES: Style: ${opt.mode}. Sensory focus: ${opt.focus}.`;
    case 'summarize': return `PREFERENCES: Format: ${opt.format}. Scope: ${opt.scope}.`;
    case 'brainstorm': return `PREFERENCES: Provide ${opt.count} ideas with ${opt.spice} risk level.`;
    default: return '';
  }
}

function extractChapterSection(outline,sceneName){
  if(!outline || !sceneName) return '';
  const lines=outline.split(/\r?\n/);
  const ch=(sceneName.match(/chapter\s*(\d+)/i)||[])[1];
  let headerRegex;
  if(ch){
    headerRegex=new RegExp(`^###\\s+Chapter\\s*${ch}\\b`,'i');
  } else {
    const key=sceneName.replace(/^[^:]*:\s*/, '').trim().split(/\s+/).slice(0,4).join(' ');
    if(!key) return '';
    const esc=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    headerRegex=new RegExp(`^###\\s+.*${esc}.*$`,'i');
  }
  let start=-1, end=lines.length;
  for(let i=0;i<lines.length;i++){
    if(headerRegex.test(lines[i])){
      start=i;
      break;
    }
  }
  if(start===-1) return '';
  for(let j=start+1;j<lines.length;j++){
    if(/^###\s+/.test(lines[j])){
      end=j;
      break;
    }
  }
  return lines.slice(start,end).join('\n');
}

function trimOutline(outline,maxChars){
  if(!outline) return '';
  outline=outline.trim();
  return outline.length>maxChars? outline.slice(0,maxChars)+'…' : outline;
}

export function buildPrompt(action){
  const c = collectContext();
  const state = store.getState();
  const creativityMap={
    precise:"Be conservative and faithful to the source. Avoid inventing new facts.",
    balanced:"Balance fidelity with light creativity. Avoid contradictions.",
    imaginative:"Be bold and inventive while preserving canon and tone."
  };
  const toneLine=c.tone? `Tone: ${c.tone}.` : `Tone: inherit from the text.`;
  const header=`You are an expert fiction writing assistant and developmental editor.\nHonor canon and voice. Keep tense/POV consistent.\n${toneLine} ${creativityMap[c.creativity]||creativityMap.balanced}\nIf rewriting, preserve meaning; if continuing, match cadence and voice.`;
  const canon=`PROJECT: ${c.projectTitle||'(untitled)'}\nPROJECT NOTES:\n${c.notes||'(none)'}\nSTYLE GUIDE:\n${c.style||'(none)'}`;
  let outlineBlock='';
  if(state.meta.outlineEnabled){
    const chapter=extractChapterSection(state.meta.outline, c.sceneName);
    if(chapter){
      outlineBlock=`OUTLINE (chapter‑relevant):\n${chapter}`;
    } else {
      const shorty=trimOutline(state.meta.outline, 900);
      if(shorty) outlineBlock=`OUTLINE (summary):\n${shorty}`;
    }
  }
  const opt = getOpts(action);
  const optText = optionsToText(action,opt);
  let task='';
  switch(action){
    case 'continue': task='TASK: Continue the scene naturally. End on a light hook. Avoid summarizing; write lived‑in prose.'; break;
    case 'rewrite': task='TASK: Rewrite the SELECTION stronger and on‑voice. Preserve meaning. Offer 2 variants if helpful.'; break;
    case 'expand': task="TASK: Expand the SELECTION with vivid, concrete detail (show, don’t tell). Keep pacing."; break;
    case 'conflict': task='TASK: Introduce organic conflict/tension appropriate to the scene (stakes, obstacle, reversal).'; break;
    case 'describe': task='TASK: Sensory description grounded in POV (sight/sound/smell/touch/taste as appropriate).'; break;
    case 'summarize': task='TASK: Summarize the scene in 5 bullets: beats, goals, conflict, turning point, open questions.'; break;
    case 'brainstorm': task='TASK: Brainstorm distinct next‑beat options (1–2 sentences each). Include tradeoffs. Keep within canon.'; break;
    default: task='TASK: Continue the scene, matching voice and cadence.';
  }
  const sel=c.selection? `SELECTION:\n${c.selection}` : '(No selection provided.)';
  const scene=c.scene? `CURRENT SCENE — ${c.sceneName}:\n${c.scene}` : '(No scene text provided.)';
  return [header, canon, outlineBlock, task, optText, sel, scene].filter(Boolean).join('\n\n---\n\n');
}
