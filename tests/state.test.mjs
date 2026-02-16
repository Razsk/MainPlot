/* eslint-disable no-undef */
// Mock browser globals before import
global.document = {
  getElementById: () => ({
    classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} },
    addEventListener: ()=>{},
    textContent: '',
    scrollTop: 0,
    scrollHeight: 0
  }),
  createElement: () => ({ style: {}, setAttribute: ()=>{}, classList: { add:()=>{} }, select:()=>{} }),
  body: { appendChild: ()=>{}, removeChild: ()=>{} },
  execCommand: () => {}
};
global.window = {
  addEventListener: () => {},
  isSecureContext: true
};

// navigator exists in Node 22, let's try to add clipboard if missing
if (global.navigator && !global.navigator.clipboard) {
    try {
        Object.defineProperty(global.navigator, 'clipboard', {
             value: { writeText: () => Promise.resolve() },
             configurable: true
        });
    } catch (e) {
        // Ignore errors if we can't define property on navigator
    }
}

global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.console = {
    ...console,
    warn: () => {}, // suppress warnings from utils.js
    log: () => {},
    error: () => {}
};

// Use dynamic import to ensure globals are set before the module is loaded
const { insertAt } = await import('../src/state.js');
import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('state.js', () => {
  describe('insertAt', () => {
    it('should insert an item at the beginning of the array', () => {
      const arr = [2, 3];
      insertAt(arr, 1, 0);
      assert.deepEqual(arr, [1, 2, 3]);
    });

    it('should insert an item at the end of the array', () => {
      const arr = [1, 2];
      insertAt(arr, 3, 2);
      assert.deepEqual(arr, [1, 2, 3]);
    });

    it('should insert an item in the middle of the array', () => {
      const arr = [1, 3];
      insertAt(arr, 2, 1);
      assert.deepEqual(arr, [1, 2, 3]);
    });

    it('should insert an item into an empty array', () => {
        const arr = [];
        insertAt(arr, 1, 0);
        assert.deepEqual(arr, [1]);
    });

    it('should handle negative indices by inserting relative to the end (splice behavior)', () => {
        const arr = [1, 2, 3];
        insertAt(arr, 4, -1);
        // splice(-1, 0, 4) inserts before the last element: [1, 2, 4, 3]
        assert.deepEqual(arr, [1, 2, 4, 3]);
    });

     it('should handle indices larger than array length (append)', () => {
        const arr = [1, 2];
        insertAt(arr, 3, 10);
        assert.deepEqual(arr, [1, 2, 3]);
    });
  });
});
