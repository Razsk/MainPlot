# Tests

This directory contains unit tests for the project.

## Running Tests

Since this project does not use a package manager like npm, you can run the tests using Node.js directly.

```bash
node --test tests/state.test.mjs
```

Note: The tests mock browser globals (window, document, etc.) to allow testing modules that have browser-specific dependencies.
