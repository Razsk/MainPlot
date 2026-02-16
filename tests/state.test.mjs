
import './setup.mjs'; // Must be imported before other modules to setup globals
import { findNode } from '../src/state.js';
import test from 'node:test';
import assert from 'node:assert';

test('findNode finds a root node', (t) => {
  const tree = [
    { id: '1', type: 'folder', children: [] },
    { id: '2', type: 'scene' }
  ];
  const found = findNode(tree, '2');
  assert.strictEqual(found.id, '2');
});

test('findNode finds a nested node', (t) => {
  const tree = [
    { id: '1', type: 'folder', children: [
      { id: '2', type: 'scene' }
    ]}
  ];
  const found = findNode(tree, '2');
  assert.strictEqual(found.id, '2');
});

test('findNode returns null if not found', (t) => {
  const tree = [
    { id: '1', type: 'folder', children: [] }
  ];
  const found = findNode(tree, '999');
  assert.strictEqual(found, null);
});

test('findNode handles empty array', (t) => {
  const found = findNode([], '1');
  assert.strictEqual(found, null);
});

test('findNode finds deeply nested node', (t) => {
  const tree = [
    { id: '1', type: 'folder', children: [
      { id: '2', type: 'folder', children: [
        { id: '3', type: 'scene' }
      ]}
    ]}
  ];
  const found = findNode(tree, '3');
  assert.strictEqual(found.id, '3');
});
