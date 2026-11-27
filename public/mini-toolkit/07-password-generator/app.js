'use strict';

const { button, copyText, setStatus } = AppCore;
const form = document.querySelector('form');
const result = document.getElementById('result');
const status = document.getElementById('status');
const submitButton = form.querySelector('button');

for (const [name, label] of [['uppercase', 'A–Z'], ['lowercase', 'a–z'], ['numbers', '0–9']]) {
  const wrapper = document.createElement('label');
  wrapper.className = 'check';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  input.checked = true;
  wrapper.append(input, document.createTextNode(label));
  form.insertBefore(wrapper, submitButton);
}

result.closest('label').after(button('Copy password', async () => {
  if (!result.value) return;
  if (await copyText(result.value)) {
    setStatus(status, 'Copied. Password was generated on this device.');
  } else {
    result.focus();
    result.select();
    setStatus(status, 'Clipboard unavailable. Select and copy the password manually.');
  }
}));

function randomInteger(maximum) {
  const limit = Math.floor(0x100000000 / maximum) * maximum;
  let value;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return value % maximum;
}

function randomCharacter(characters) {
  const limit = 256 - (256 % characters.length);
  let value;
  do {
    value = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (value >= limit);
  return characters[value % characters.length];
}

function generatePassword(characterSets, length) {
  const characters = characterSets.map(set => randomCharacter(set));
  const alphabet = characterSets.join('');
  while (characters.length < length) characters.push(randomCharacter(alphabet));

  for (let index = characters.length - 1; index > 0; index--) {
    const other = randomInteger(index + 1);
    [characters[index], characters[other]] = [characters[other], characters[index]];
  }
  return characters.join('');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const characterSets = [
    values.has('uppercase') ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    values.has('lowercase') ? 'abcdefghijklmnopqrstuvwxyz' : '',
    values.has('numbers') ? '0123456789' : '',
    values.has('symbols') ? '!@#$%&*+-_?' : ''
  ].filter(Boolean);
  const length = Number(values.get('length'));

  if (characterSets.length === 0) {
    setStatus(status, 'Choose at least one character set.');
    return;
  }
  if (!Number.isInteger(length) || length < 8 || length > 128) {
    setStatus(status, 'Choose a length from 8 to 128 characters.');
    return;
  }
  if (!globalThis.crypto || typeof crypto.getRandomValues !== 'function') {
    setStatus(status, 'This browser does not provide a secure random generator.');
    return;
  }

  result.value = generatePassword(characterSets, length);
  setStatus(status, `${length} characters · generated with a cryptographic random generator. Keep it private.`);
  result.select();
});
