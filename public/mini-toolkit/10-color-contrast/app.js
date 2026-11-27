'use strict';

const { button, setStatus } = AppCore;
const form = document.querySelector('form');
const sample = document.getElementById('sample');
const status = document.getElementById('status');
const [foreground, background] = form.querySelectorAll('input[type="color"]');
const submitButton = form.querySelector('button');

form.insertBefore(button('Swap colors', () => {
  [foreground.value, background.value] = [background.value, foreground.value];
  updatePreview();
}), submitButton);

function luminance(hex) {
  const [red, green, blue] = hex.slice(1).match(/../g).map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastVerdict(ratio) {
  if (ratio >= 7) return 'Passes WCAG AA and AAA for normal and large text';
  if (ratio >= 4.5) return 'Passes WCAG AA for normal text and AAA for large text';
  if (ratio >= 3) return 'Passes WCAG AA for large text only';
  return 'Does not meet WCAG AA contrast';
}

function updatePreview() {
  sample.style.color = foreground.value;
  sample.style.backgroundColor = background.value;

  const first = luminance(foreground.value);
  const second = luminance(background.value);
  const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  setStatus(status, `${ratio.toFixed(2)}:1 · ${contrastVerdict(ratio)}`);
  sample.setAttribute('aria-label', `Sample text, contrast ratio ${ratio.toFixed(2)} to 1`);
}

form.addEventListener('submit', event => event.preventDefault());
foreground.addEventListener('input', updatePreview);
background.addEventListener('input', updatePreview);
updatePreview();
