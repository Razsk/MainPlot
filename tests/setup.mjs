
// Mock browser globals required for module loading and execution
global.document = {
  getElementById: (id) => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    scrollTop: 0,
    scrollHeight: 0,
    focus: () => {},
    select: () => {},
    click: () => {},
    remove: () => {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
  createElement: () => ({
    setAttribute: () => {},
    style: {},
    select: () => {},
    click: () => {},
    remove: () => {},
  }),
  execCommand: () => {},
};

global.window = {
  addEventListener: () => {},
  isSecureContext: true,
};

// URL is present in Node.js, but createObjectURL/revokeObjectURL are not standard in Node.js URL implementation usually.
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = () => '';
  global.URL.revokeObjectURL = () => {};
}
