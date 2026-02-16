import { test, describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser globals
// We need to define them carefully because some might exist in Node.js environment
Object.defineProperty(global, 'document', {
  value: {
    getElementById: () => null,
    createElement: () => ({
      value: '',
      setAttribute: () => {},
      style: {},
      select: () => {},
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
      },
    },
    execCommand: () => false, // Default to false
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: undefined,
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    isSecureContext: false,
    addEventListener: () => {},
  },
  writable: true,
  configurable: true,
});

// Mock console to suppress logs during tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    warn: () => {},
    log: () => {},
    error: () => {},
};

// Dynamic import
const { copyToClipboard } = await import('../src/utils.js');

describe('copyToClipboard', () => {
  beforeEach(() => {
    // Reset mocks
    global.navigator.clipboard = undefined;
    global.window.isSecureContext = false;
    global.document.execCommand = () => false;
  });

  it('should use navigator.clipboard if available and secure', async () => {
    let writtenText = '';
    global.navigator.clipboard = {
      writeText: async (text) => { writtenText = text; },
    };
    global.window.isSecureContext = true;

    const result = await copyToClipboard('hello');
    assert.equal(result, true);
    assert.equal(writtenText, 'hello');
  });

  it('should return false if navigator.clipboard is unavailable', async () => {
    // execCommand should not be called, but even if it was mocked to work, result should be false
    // because the fallback code is removed.
    global.document.execCommand = (cmd) => cmd === 'copy';

    const result = await copyToClipboard('hello');
    assert.equal(result, false);
  });
});
