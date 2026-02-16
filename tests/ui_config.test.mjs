import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KEYBOARD_SHORTCUTS } from '../src/config.js';

test('KEYBOARD_SHORTCUTS should be defined and correct', () => {
  assert.ok(KEYBOARD_SHORTCUTS, 'KEYBOARD_SHORTCUTS should be exported');

  const expected = {
    '1': 'continue',
    '2': 'rewrite',
    '3': 'expand',
    '4': 'conflict',
    '5': 'describe',
    '6': 'summarize',
    '7': 'brainstorm'
  };

  assert.deepEqual(KEYBOARD_SHORTCUTS, expected, 'KEYBOARD_SHORTCUTS should match expected values');
});
