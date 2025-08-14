import { LS_KEY } from './config.js';
import { id } from './utils.js';

let state;

function makeDefaultState(){
  return {
    meta:{ projectTitle:'Untitled', notes:'', style:'', tone:'', creativity:'balanced', outline:'', outlineEnabled:true, actionOptions:{} },
    tree:[ {id:id(), type:'folder', name:'Draft', children:[ {id:id(), type:'scene', name:'Chapter 1: Opening', content:''} ]} ],
    currentId:null
  };
}

function load(){
  try{
    return JSON.parse(localStorage.getItem(LS_KEY)||'');
  }catch(e){
    console.error('Load failed',e);
    return null;
  }
}

function save(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }catch(e){
    console.error('Save failed',e);
  }
}

export const store = {
  init() {
    state = load() || makeDefaultState();
  },
  getState() {
    return state;
  },
  setState(newState) {
    state = { ...state, ...newState };
    save();
  },
  setMeta(newMeta) {
    state.meta = { ...state.meta, ...newMeta };
    save();
  },
  setActionOption(action, key, val) {
    state.meta.actionOptions = state.meta.actionOptions || {};
    state.meta.actionOptions[action] = Object.assign({}, state.meta.actionOptions[action], {[key]:val});
    save();
  },
  setCurrentId(id) {
    state.currentId = id;
    save();
  },
  setTree(tree) {
    state.tree = tree;
    save();
  }
};

export function findNode(arr, nid){
  for(const n of arr){
    if(n.id===nid) return n;
    if(n.type==='folder'){
      const f=findNode(n.children||[], nid);
      if(f) return f;
    }
  }
  return null;
}

export function findParent(arr, nid, parent=null){
  for(let i=0;i<arr.length;i++){
    const n=arr[i];
    if(n.id===nid) return {parentArray:arr, parentNode:parent, index:i};
    if(n.type==='folder'){
      const r=findParent(n.children||[], nid, n);
      if(r) return r;
    }
  }
  return null;
}

export function removeById(nid){
  const p=findParent(state.tree, nid);
  if(!p) return null;
  return p.parentArray.splice(p.index,1)[0];
}

export function isDescendant(ancestorId, childId){
  const anc=findNode(state.tree, ancestorId);
  if(!anc || anc.type!=='folder') return false;
  function walk(list){
    for(const n of list){
      if(n.id===childId) return true;
      if(n.type==='folder' && walk(n.children||[])) return true;
    }
    return false;
  }
  return walk(anc.children||[]);
}

export function insertAt(arr,item,index){
  arr.splice(index,0,item);
}

export function firstScene(arr){
  for(const n of arr){
    if(n.type==='scene') return n;
    if(n.type==='folder'){
      const s=firstScene(n.children||[]);
      if(s) return s;
    }
  }
}

function countWords(str) {
  return (str || '').trim().split(/\s+/).filter(Boolean).length;
}

export function calculateWordCount(nodeId) {
  const node = nodeId ? findNode(state.tree, nodeId) : { type: 'project', children: state.tree };
  if (!node) return 0;

  if (node.type === 'scene') {
    return countWords(node.content);
  }

  if (node.type === 'folder' || node.type === 'project') {
    let total = 0;
    if (node.children) {
      for (const child of node.children) {
        total += calculateWordCount(child.id);
      }
    }
    return total;
  }

  return 0;
}
