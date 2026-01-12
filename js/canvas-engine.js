import { state, appConfig, elements } from './state.js';
import { KNIVES } from './constants.js';
import { measureText } from './helpers.js';

export function invalidateCache(knife) {
  state[knife].cacheValid = false;
}

export function invalidateTextCache(knife) {
  state[knife].textCacheValid = false;
}

export function draw(knife) {
  const s = state[knife];
  if (!s.img || s.full.width === 0 || s.full.height === 0) return;

  const textX = s.textRightX;

  // 1. Background/Overlay Cache
  if (!s.cacheValid) {
    s.cacheCanvas.width = s.full.width;
    s.cacheCanvas.height = s.full.height;
    s.cacheCtx.clearRect(0, 0, s.full.width, s.full.height);
    s.cacheCtx.drawImage(s.img, 0, 0);
    if (appConfig.showEditZone && s.overlay) {
      s.cacheCtx.drawImage(s.overlay, 0, 0, s.full.width, s.full.height);
    }
    s.cacheValid = true;
  }

  // 2. Text Layer Cache
  if (!s.textCacheValid) {
    s.textCacheCanvas.width = s.full.width;
    s.textCacheCanvas.height = s.full.height;
    s.textCacheCtx.clearRect(0, 0, s.full.width, s.full.height);
    if (s.textInput.value) {
      s.textCacheCtx.font = `${s.weightSel.value} ${s.baseFont * s.textScale}px ${s.fontSel.value}`;
      s.textCacheCtx.fillStyle = '#000';
      s.textCacheCtx.textBaseline = 'top';
      s.textCacheCtx.textAlign = 'right';
      s.textCacheCtx.fillText(s.textInput.value, textX, s.pos.y);
    }
    s.textCacheValid = true;
  }

  // 3. Composite to Viewport
  const scale = s.view.width / s.full.width;
  s.vCtx.imageSmoothingEnabled = true;
  s.vCtx.imageSmoothingQuality = 'high';
  s.vCtx.setTransform(scale, 0, 0, scale, 0, 0);
  s.vCtx.clearRect(0, 0, s.full.width, s.full.height);
  s.vCtx.drawImage(s.cacheCanvas, 0, 0);
  s.vCtx.drawImage(s.textCacheCanvas, 0, 0);
  s.vCtx.setTransform(1, 0, 0, 1, 0, 0);

  // 4. Update UI Bounding Box
  if (s.boxVisible && s.textInput.value) {
    s.bbox.style.display = 'block';
    s.bbox.style.width = (s.baseDims.w * s.textScale * scale) + 'px';
    s.bbox.style.height = (s.baseDims.h * s.textScale * scale) + 'px';
    s.bbox.style.left = ((textX - s.baseDims.w * s.textScale) * scale) + 'px';
    s.bbox.style.top = (s.pos.y * scale) + 'px';
  } else {
    s.bbox.style.display = 'none';
  }
  s.pendingDraw = false;
}

export async function generatePreviews() {
  elements.previewContent.innerHTML = '';
  for (const knife of Object.keys(state)) {
    const s = state[knife];
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = s.full.width;
    previewCanvas.height = s.full.height;
    const ctx = previewCanvas.getContext('2d');
    
    ctx.drawImage(s.img, 0, 0);
    if (s.textInput.value) {
      ctx.font = `${s.weightSel.value} ${s.baseFont * s.textScale}px ${s.fontSel.value}`;
      ctx.fillStyle = '#000';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'right';
      ctx.fillText(s.textInput.value, s.textRightX, s.pos.y);
    }

    const previewUrl = previewCanvas.toDataURL('image/png');
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `
      <img src="${previewUrl}" alt="${knife} preview" data-knife="${knife}">
      <span data-i18n="${knife}Knife">${translations[appConfig.currentLang][`${knife}Knife`]}</span>
    `;
    elements.previewContent.appendChild(div);
  }
}