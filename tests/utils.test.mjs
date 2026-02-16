
// Mock browser globals to allow importing utils.js
global.document = {
  getElementById: () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} }
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  createElement: () => ({ style: {} }),
  execCommand: () => {},
  querySelectorAll: () => []
};
global.window = {
  addEventListener: () => {},
  navigator: { clipboard: { writeText: () => {} } },
  isSecureContext: true
};
// global.navigator is already defined in Node.js (some versions) or not writable
// We can try to define it if it's missing, or just rely on global.window.navigator if the code uses window.navigator
// The code uses `navigator.clipboard` directly in copyToClipboard.

if (!global.navigator) {
    global.navigator = global.window.navigator;
}

global.URL = { createObjectURL: () => {}, revokeObjectURL: () => {} };

import { test } from 'node:test';
import assert from 'node:assert';

test('escapeHTML escapes special characters', async () => {
  const { escapeHTML } = await import('../src/utils.js');
  assert.strictEqual(escapeHTML('<b>test</b>'), '&lt;b&gt;test&lt;/b&gt;');
  assert.strictEqual(escapeHTML('"test"'), '&quot;test&quot;');
  assert.strictEqual(escapeHTML("'test'"), '&#039;test&#039;');
  assert.strictEqual(escapeHTML('test & test'), 'test &amp; test');
});

test('escapeHTML handles empty strings', async () => {
  const { escapeHTML } = await import('../src/utils.js');
  assert.strictEqual(escapeHTML(''), '');
  assert.strictEqual(escapeHTML(null), '');
  assert.strictEqual(escapeHTML(undefined), '');
  assert.strictEqual(escapeHTML(0), '0');
});
