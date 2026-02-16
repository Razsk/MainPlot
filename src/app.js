import { store } from './state.js';
import { hydrateMeta, renderTree, openFirstScene, addEventListeners, updateAllWordCounts, applySavedTheme } from './ui.js';
import { Debug, $ } from './utils.js';
import { buildPrompt } from './prompt-builder.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('MainPlot v4.0 booting…');

  try {
    applySavedTheme();
    store.init();
    hydrateMeta();
    renderTree();
    openFirstScene();
    addEventListeners();
    updateAllWordCounts();
  } catch (err) {
    console.error('Init crashed', err);
    Debug.open();
  }

});
