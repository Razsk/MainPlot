import { test, describe, it } from 'node:test';
import assert from 'node:assert';

// Mock DOM environment needed for imports
const mockDoc = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    textContent: '',
    value: '',
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    click: () => {},
    focus: () => {},
    select: () => {},
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  createElement: () => ({ style: {}, setAttribute: () => {} }),
  execCommand: () => {},
};

global.document = mockDoc;

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  isSecureContext: true,
};

// Handle navigator
if (typeof global.navigator === 'undefined') {
    global.navigator = { clipboard: { writeText: () => {} } };
} else {
    // If it exists, try to add clipboard if missing
    if (!global.navigator.clipboard) {
        try {
            Object.defineProperty(global.navigator, 'clipboard', {
                value: { writeText: () => {} },
                writable: true,
                configurable: true
            });
        } catch (e) {
            // If failed (e.g. frozen), we might need to redefine global.navigator
            try {
                 Object.defineProperty(global, 'navigator', {
                    value: { clipboard: { writeText: () => {} }, ...global.navigator },
                    writable: true,
                    configurable: true
                });
            } catch (e2) {}
        }
    }
}


global.URL = {
  createObjectURL: () => {},
  revokeObjectURL: () => {},
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
};

// Mock console to suppress noise during tests
const originalConsole = { ...console };
global.console = {
    ...console,
    warn: () => {},
    error: () => {},
    log: () => {},
};


describe('optionsToText', async () => {
    let optionsToText;

    it('should load module successfully', async () => {
        try {
            const module = await import('../src/prompt-builder.js');
            optionsToText = module.optionsToText;
            assert.ok(optionsToText);
        } catch (e) {
            originalConsole.error('Import failed:', e);
            throw e;
        }
    });

    it('should handle "continue" action', () => {
        // Short length
        assert.strictEqual(
            optionsToText('continue', { length: 'short', tempo: 'steady' }),
            'PREFERENCES: Target length: 2–3 paragraphs. Tempo: steady.'
        );
        // Long length
        assert.strictEqual(
            optionsToText('continue', { length: 'long', tempo: 'brisk' }),
            'PREFERENCES: Target length: ~600 words. Tempo: brisk.'
        );
        // Medium/Other length
        assert.strictEqual(
            optionsToText('continue', { length: 'medium', tempo: 'slow' }),
            'PREFERENCES: Target length: 3–5 paragraphs. Tempo: slow.'
        );
    });

    it('should handle "rewrite" action', () => {
        assert.strictEqual(
            optionsToText('rewrite', { strength: 'medium', focus: 'voice' }),
            'PREFERENCES: Rewrite strength: medium. Primary focus: voice.'
        );
    });

    it('should handle "expand" action', () => {
        // Sentences
        assert.strictEqual(
            optionsToText('expand', { size: 'sentences', focus: 'emotion' }),
            'PREFERENCES: Add +3–5 sentences focusing on emotion.'
        );
        // Paragraphs (default/other)
        assert.strictEqual(
            optionsToText('expand', { size: 'para', focus: 'setting' }),
            'PREFERENCES: Add +1–2 paragraphs focusing on setting.'
        );
    });

    it('should handle "conflict" action', () => {
        assert.strictEqual(
            optionsToText('conflict', { type: 'interpersonal', intensity: 'high' }),
            'PREFERENCES: Conflict type: interpersonal. Intensity: high.'
        );
    });

    it('should handle "describe" action', () => {
        assert.strictEqual(
            optionsToText('describe', { mode: 'cinematic', focus: 'visual' }),
            'PREFERENCES: Style: cinematic. Sensory focus: visual.'
        );
    });

    it('should handle "summarize" action', () => {
        assert.strictEqual(
            optionsToText('summarize', { format: 'bullets', scope: 'scene' }),
            'PREFERENCES: Format: bullets. Scope: scene.'
        );
    });

    it('should handle "brainstorm" action', () => {
        assert.strictEqual(
            optionsToText('brainstorm', { count: 5, spice: 'fresh' }),
            'PREFERENCES: Provide 5 ideas with fresh risk level.'
        );
    });

    it('should handle unknown action', () => {
        assert.strictEqual(optionsToText('unknown', {}), '');
    });
});
