'use strict';

const { button, copyText, download, setStatus } = AppCore;
const source = document.getElementById('source');
const controls = document.getElementById('controls');
const result = document.getElementById('result');
const status = document.getElementById('status');

function addAction(label, action) {
  controls.append(button(label, action));
}

function parseSource() {
  try {
    return { valid: true, value: JSON.parse(source.value) };
  } catch (error) {
    result.value = '';
    setStatus(status, `Invalid JSON: ${error.message}`);
    return { valid: false };
  }
}

function format(indent) {
  const parsed = parseSource();
  if (!parsed.valid) return;

  result.value = JSON.stringify(parsed.value, null, indent);
  setStatus(status, `Valid JSON · ${result.value.length} output characters`);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, sortKeys(value[key])])
    );
  }
  return value;
}

addAction('Format', () => format(2));
addAction('Minify', () => format(0));
addAction('Sort object keys', () => {
  const parsed = parseSource();
  if (!parsed.valid) return;

  result.value = JSON.stringify(sortKeys(parsed.value), null, 2);
  setStatus(status, 'Valid JSON · object keys sorted.');
});
addAction('Copy output', async () => {
  if (!result.value) return;
  if (await copyText(result.value)) {
    setStatus(status, 'Output copied.');
  } else {
    result.focus();
    result.select();
    setStatus(status, 'Clipboard unavailable. Select and copy the output manually.');
  }
});
addAction('Download JSON', () => {
  if (!result.value) return;
  download(new Blob([result.value], { type: 'application/json' }), 'formatted.json');
});

source.addEventListener('input', () => {
  if (source.value.trim()) {
    parseSource();
  } else {
    result.value = '';
    setStatus(status, 'Paste JSON to get started.');
  }
});
