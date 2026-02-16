import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser globals needed by utils.js

// document
global.document = {
  getElementById: () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    value: '',
    focus: () => {},
    select: () => {},
    textContent: '',
    style: {},
    appendChild: () => {},
    removeChild: () => {},
    setAttribute: () => {},
  }),
  createElement: () => ({
    value: '',
    setAttribute: () => {},
    style: {},
    select: () => {},
    click: () => {},
    remove: () => {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
  execCommand: () => {},
};

// window
global.window = {
  addEventListener: () => {},
  isSecureContext: true,
};

// navigator
// Node.js might have a global navigator, so we handle it carefully
if (!global.navigator) {
    global.navigator = {};
}
// define/overwrite clipboard
Object.defineProperty(global.navigator, 'clipboard', {
    value: { writeText: async () => {} },
    writable: true,
    configurable: true
});

// URL
global.URL = {
  createObjectURL: () => 'blob:url',
  revokeObjectURL: () => {},
};

test('findParent', async (t) => {
  // Import the module after mocks are set up
  const { findParent } = await import('../src/state.js');

  const tree = [
    { id: '1', type: 'scene', name: 'Scene 1' },
    { id: '2', type: 'folder', name: 'Folder 1', children: [
      { id: '2-1', type: 'scene', name: 'Scene 2-1' },
      { id: '2-2', type: 'folder', name: 'Folder 2-2', children: [
        { id: '2-2-1', type: 'scene', name: 'Scene 2-2-1' }
      ]}
    ]}
  ];

  await t.test('finds root level node', () => {
    const result = findParent(tree, '1');
    assert.deepEqual(result, { parentArray: tree, parentNode: null, index: 0 });
  });

  await t.test('finds nested node', () => {
    const result = findParent(tree, '2-1');
    assert.deepEqual(result, {
      parentArray: tree[1].children,
      parentNode: tree[1],
      index: 0
    });
  });

  await t.test('finds deeply nested node', () => {
    const result = findParent(tree, '2-2-1');
    assert.deepEqual(result, {
      parentArray: tree[1].children[1].children,
      parentNode: tree[1].children[1],
      index: 0
    });
  });

  await t.test('returns null for non-existent node', () => {
    const result = findParent(tree, '999');
    assert.equal(result, null);
  });

  await t.test('handles empty tree', () => {
    const result = findParent([], '1');
    assert.equal(result, null);
  });
});
