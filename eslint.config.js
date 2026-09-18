const browserGlobals = Object.fromEntries(['window', 'document', 'localStorage', 'navigator', 'requestAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'speechSynthesis', 'SpeechSynthesisUtterance', 'Node', 'Blob', 'URL', 'URLSearchParams', 'btoa', 'atob', 'crypto', 'TextEncoder', 'sessionStorage', 'history', 'structuredClone', 'Event', 'caches', 'self', 'location', 'fetch', 'AudioContext', 'console', 'Infinity', 'Math', 'Date', 'JSON', 'Promise', 'Map', 'Set', 'Array', 'Object', 'String', 'Number', 'Error', 'parseInt', 'Buffer', 'process'].map((g) => [g, 'readonly']));

export default [
  {
    files: ['src/**/*.js', 'sw.js', 'tests/**/*.js', 'tools/**/*.mjs'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: browserGlobals },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-undef': 'error',
    },
  },
];
