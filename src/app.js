import { store } from './state.js';
import { hydrateMeta, renderTree, openFirstScene, addEventListeners, updateWC } from './ui.js';
import { Debug, $ } from './utils.js';
import { buildPrompt } from './prompt-builder.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('MainPlot v4.0 booting…');

  try {
    store.init();
    hydrateMeta();
    renderTree();
    openFirstScene();
    addEventListeners();
    updateWC();
  } catch (err) {
    console.error('Init crashed', err);
    Debug.open();
  }

  /* ===== Self‑tests (lightweight) ===== */
  (function runSelfTests() {
    const requiredIds = [
      'left', 'right', 'tree', 'addFolder', 'addScene', 'backup', 'restore',
      'restoreFile', 'title', 'scene', 'preview', 'notes', 'style', 'tone',
      'creativity', 'outline', 'outlineEnabled', 'copyPrompt', 'toggleLeft',
      'toggleRight', 'helpBtn', 'helpModal', 'helpClose', 'backupStatus',
      'backupManual', 'optionsStrip'
    ];
    let ok = true;
    requiredIds.forEach(id => {
      if (!$(id)) {
        ok = false;
        console.error('TEST FAIL: missing #' + id);
      }
    });
    try {
      const p = buildPrompt('continue');
      if (typeof p !== 'string') {
        ok = false;
        console.error('TEST FAIL: buildPrompt did not return string');
      }
    } catch (e) {
      ok = false;
      console.error('TEST FAIL: buildPrompt threw', e);
    }
    console.log(ok ? 'TEST PASS: Basic UI & functions present' : 'TEST WARN: One or more checks failed');
  })();
});
