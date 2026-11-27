'use strict';

const { download, setStatus } = AppCore;
const form = document.querySelector('form');
const fileInput = document.getElementById('file');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const submitButton = form.querySelector('button');

const format = document.createElement('select');
format.name = 'format';
format.setAttribute('aria-label', 'Output format');
for (const [value, label] of [['image/png', 'PNG'], ['image/jpeg', 'JPEG'], ['image/webp', 'WebP']]) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  format.append(option);
}

const formatLabel = document.createElement('label');
formatLabel.append('Format', format);
form.insertBefore(formatLabel, submitButton);

const quality = document.createElement('input');
quality.type = 'number';
quality.name = 'quality';
quality.min = '0.1';
quality.max = '1';
quality.step = '0.05';
quality.value = '0.9';
const qualityLabel = document.createElement('label');
qualityLabel.append('Quality (JPEG / WebP)', quality);
form.insertBefore(qualityLabel, submitButton);

const imageInfo = document.createElement('p');
imageInfo.className = 'muted';
preview.before(imageInfo);

function outputHeight(width, originalWidth, originalHeight) {
  return Math.max(1, Math.round(width * originalHeight / originalWidth));
}

async function resizeImage(file, width, qualityValue, outputFormat, maxBytes) {
  const image = await createImageBitmap(file);
  try {
    let height = outputHeight(width, image.width, image.height);
    if (height > 8192 || width * height > 40000000) {
      throw new Error('The output would be too large. Choose a smaller width.');
    }

    imageInfo.textContent = `Original: ${file.name} · ${image.width} × ${image.height} pixels`;

    async function encode(value) {
      const blob = await new Promise(resolve => preview.toBlob(resolve, outputFormat, value));
      if (!blob || blob.type !== outputFormat) throw new Error('This image format is not supported by the browser.');
      return blob;
    }

    while (true) {
      height = outputHeight(width, image.width, image.height);
      preview.width = width;
      preview.height = height;
      const context = preview.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable in this browser.');
      if (outputFormat === 'image/jpeg') {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(image, 0, 0, width, height);

      let blob = await encode(qualityValue);
      if (blob.size <= maxBytes) return { blob, width, height };
      if (outputFormat !== 'image/png' && qualityValue > 0.1) {
        let lower = 0.1;
        let upper = qualityValue;
        blob = await encode(lower);
        if (blob.size <= maxBytes) {
          for (let attempt = 0; attempt < 7; attempt++) {
            const candidate = (lower + upper) / 2;
            const encoded = await encode(candidate);
            if (encoded.size <= maxBytes) {
              blob = encoded;
              lower = candidate;
            } else {
              upper = candidate;
            }
          }
          return { blob, width, height };
        }
      }
      if (width === 1) throw new Error('This format cannot fit the chosen size. Try a higher limit or another format.');
      const scale = Math.min(0.85, Math.sqrt(maxBytes / blob.size));
      width = Math.max(1, Math.floor(width * scale));
    }
  } finally {
    image.close();
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = fileInput.files && fileInput.files[0];
  const width = Number(form.elements.width.value);
  const qualityValue = Number(quality.value);
  const targetSize = form.elements.targetSize.valueAsNumber;
  const maxBytes = Number.isNaN(targetSize) ? Infinity : targetSize * 1024;

  if (!file || !file.type.startsWith('image/')) {
    setStatus(status, 'Choose a supported image file.');
    return;
  }
  if (!Number.isInteger(width) || width < 1 || width > 8192) {
    setStatus(status, 'Choose an output width between 1 and 8192 pixels.');
    return;
  }
  if (!Number.isFinite(qualityValue) || qualityValue < 0.1 || qualityValue > 1) {
    setStatus(status, 'Choose a quality from 0.1 to 1.');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    setStatus(status, 'Choose an image smaller than 25 MB.');
    return;
  }

  submitButton.disabled = true;
  setStatus(status, 'Resizing image locally…');
  try {
    const result = await resizeImage(file, width, qualityValue, format.value, maxBytes);
    preview.hidden = false;
    const extension = result.blob.type === 'image/jpeg' ? 'jpg' : result.blob.type.split('/')[1] || 'png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    download(result.blob, `${baseName}-resized.${extension}`);
    setStatus(status, `${result.width} × ${result.height} pixels · ${(result.blob.size / 1024).toFixed(2)} KB · Download ready.`);
  } catch (error) {
    setStatus(status, error instanceof Error ? error.message : 'Could not resize this image.');
  } finally {
    submitButton.disabled = false;
  }
});

fileInput.addEventListener('change', () => {
  preview.hidden = true;
  imageInfo.textContent = '';
  const file = fileInput.files && fileInput.files[0];
  if (file) setStatus(status, `Selected ${file.name} · processed only in this browser.`);
});
