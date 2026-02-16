import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock browser environment before importing state.js
global.window = {
  addEventListener: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
global.document = {
  getElementById: () => null,
  createElement: () => ({
    setAttribute: () => {},
    style: {},
    select: () => {},
    remove: () => {}
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  },
  execCommand: () => {}
};
global.localStorage = global.window.localStorage;

if (!global.navigator) {
  global.navigator = {};
}
// Mock clipboard if not present
if (!global.navigator.clipboard) {
  try {
    global.navigator.clipboard = {};
  } catch {
    Object.defineProperty(global.navigator, 'clipboard', {
       value: {},
       writable: true,
       configurable: true
    });
  }
}


// Import the module under test
const { firstScene } = await import('../src/state.js');

describe('firstScene', () => {
  test('returns undefined for an empty array', () => {
    assert.strictEqual(firstScene([]), undefined);
  });

  test('returns the first scene in a flat list', () => {
    const scenes = [
      { type: 'scene', id: 's1' },
      { type: 'scene', id: 's2' }
    ];
    const result = firstScene(scenes);
    assert.deepStrictEqual(result, scenes[0]);
  });

  test('returns the first scene nested in a folder', () => {
    const tree = [
      {
        type: 'folder',
        children: [
          { type: 'scene', id: 's1' }
        ]
      }
    ];
    const result = firstScene(tree);
    assert.deepStrictEqual(result, tree[0].children[0]);
  });

  test('returns the first scene in a complex tree with empty folders', () => {
    const tree = [
      {
        type: 'folder',
        children: [] // Empty folder
      },
      {
        type: 'folder',
        children: [
          { type: 'scene', id: 's1' },
          { type: 'scene', id: 's2' }
        ]
      }
    ];
    const result = firstScene(tree);
    assert.deepStrictEqual(result, tree[1].children[0]);
  });

  test('returns undefined if no scenes exist in tree', () => {
    const tree = [
      {
        type: 'folder',
        children: [
          { type: 'folder', children: [] }
        ]
      }
    ];
    const result = firstScene(tree);
    assert.strictEqual(result, undefined);
  });

  test('handles null children gracefully', () => {
    const tree = [
        { type: 'folder', children: null }
    ];
    // Based on code: n.children||[]
    const result = firstScene(tree);
    assert.strictEqual(result, undefined);
  });
});
