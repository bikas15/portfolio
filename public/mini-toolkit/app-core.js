'use strict';

window.AppCore = (() => {
  function setStatus(target, message) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) throw new Error('Status element was not found.');
    element.textContent = message;
  }

  function button(label, action) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.addEventListener('click', action);
    return element;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function download(blob, filename) {
    if (!(blob instanceof Blob)) throw new TypeError('A Blob is required for download.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return Object.freeze({ button, copyText, download, setStatus });
})();
