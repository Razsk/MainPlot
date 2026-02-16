import assert from 'node:assert';
import { test } from 'node:test';
import { webcrypto } from 'node:crypto'; // Use Node's webcrypto implementation

// Mock browser globals
globalThis.document = {
  getElementById: (id) => ({ id, addEventListener: () => {}, classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} }, scrollHeight: 0, scrollTop: 0, style: {} }),
  body: { classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} }, appendChild:()=>{}, removeChild:()=>{} },
  createElement: () => ({ setAttribute:()=>{}, style: {}, select:()=>{} }),
  execCommand: () => {},
};

// Override navigator
Object.defineProperty(globalThis, 'navigator', {
  value: { clipboard: { writeText: async () => {} } },
  writable: true,
  configurable: true,
});

globalThis.window = {
  addEventListener: () => {},
  isSecureContext: true,
  crypto: webcrypto, // Mock window.crypto with Node's webcrypto
};
// Use a specific mock console to avoid polluting output
globalThis.console = {
  ...console,
  warn: () => {},
};

// Spy on Math.random
const originalMathRandom = Math.random;
let mathRandomCalls = 0;
Math.random = () => {
  mathRandomCalls++;
  return originalMathRandom();
};

test('Security Verification', async (t) => {
  // Dynamic import so mocks are ready
  // We need to re-import or reset module if possible, but for now assuming one run
  // Note: we might need to invalidate cache if we were running multiple times in same process, but here we run `node --test` once.

  const { id } = await import('../src/utils.js');

  await t.test('id() generates a valid ID string', () => {
    const result = id();
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.length > 2, 'ID should be longer than 2 chars');
    assert.ok(result.startsWith('n'), 'ID should start with n');
  });

  await t.test('id() does NOT use Math.random()', () => {
    mathRandomCalls = 0;
    id();
    assert.strictEqual(mathRandomCalls, 0, 'id() should not use Math.random()');
  });
});
