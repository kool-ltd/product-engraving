/* js/canvas.js */
import { canvasState, appState } from './state.js';
import { KNIVES } from './config.js';
import { measureText } from './utils.js';

export function draw(knife) {
  const s = canvasState[knife];
  if (!s.img || s.full.width === 0 || s.full.height === 0) return;

  const textX = s.textRightX;

  if (!s.cacheValid) {
    s.cacheCanvas.width = s.full.width;
    s.cacheCanvas.height = s.full.height;
    if (s.cacheCanvas.width === 0 || s.cacheCanvas.height === 0) return;
    s.cacheCtx.clearRect(0, 0, s.full.width, s.full.height);
    s.cacheCtx.drawImage(s.img, 0, 0);
    if (appState.showEditZone && s.overlay) {
      s.cacheCtx.drawImage(s.overlay, 0, 0, s.full.width, s.full.height);
    }
    s.cacheValid = true;
  }

  if (!s.textCacheValid) {
    s.textCacheCanvas.width = s.full.width;
    s.textCacheCanvas.height = s.full.height;
    if (s.textCacheCanvas.width === 0 || s.textCacheCanvas.height === 0) return;
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

  s.fCtx.clearRect(0, 0, s.full.width, s.full.height);
  s.fCtx.drawImage(s.cacheCanvas, 0, 0);
  s.fCtx.drawImage(s.textCacheCanvas, 0, 0);

  const scale = s.view.width / s.full.width;
  s.vCtx.imageSmoothingEnabled = true;
  s.vCtx.imageSmoothingQuality = 'high';
  s.vCtx.setTransform(scale, 0, 0, scale, 0, 0);
  s.vCtx.clearRect(0, 0, s.full.width, s.full.height);
  s.vCtx.drawImage(s.cacheCanvas, 0, 0);
  s.vCtx.drawImage(s.textCacheCanvas, 0, 0);
  s.vCtx.setTransform(1, 0, 0, 1, 0, 0);

  const dx = s.view.width / s.full.width;
  const dy = s.view.height / s.full.height;
  if (s.boxVisible && s.textInput.value) {
    s.bbox.style.display = 'block';
    s.bbox.style.width = (s.baseDims.w * s.textScale * dx) + 'px';
    s.bbox.style.height = (s.baseDims.h * s.textScale * dy) + 'px';
    s.bbox.style.left = ((textX - s.baseDims.w * s.textScale) * dx) + 'px';
    s.bbox.style.top = (s.pos.y * dy) + 'px';
  } else {
    s.bbox.style.display = 'none';
  }
  s.pendingDraw = false;
}

export function invalidateCache(knife) {
  canvasState[knife].cacheValid = false;
}

export function invalidateTextCache(knife) {
  canvasState[knife].textCacheValid = false;
}

export function syncFontAndText(knife) {
  if (!appState.syncFonts) return;
  const refState = canvasState[knife];
  const fontFamily = refState.fontSel.value;
  const fontWeight = refState.weightSel.value;
  const effectiveFontSize = refState.baseFont * refState.textScale;
  
  const isBigKnife = KNIVES.big.includes(knife);
  const isSmallKnife = KNIVES.small.includes(knife);
  const isOtherItem = KNIVES.others.includes(knife);

  Object.keys(canvasState).forEach(k => {
    if (k !== knife && 
        ((isBigKnife && KNIVES.big.includes(k)) || 
         (isSmallKnife && KNIVES.small.includes(k)) || 
         (isOtherItem && KNIVES.others.includes(k)))) {
      canvasState[k].fontSel.value = fontFamily;
      canvasState[k].weightSel.value = fontWeight;
      if (!isOtherItem) {
        canvasState[k].baseFont = effectiveFontSize;
        canvasState[k].textScale = 1;
      }
      canvasState[k].baseDims = measureText(canvasState[k].fCtx, canvasState[k].textInput.value, canvasState[k].baseFont, canvasState[k].fontSel.value, canvasState[k].weightSel.value);
      invalidateTextCache(k);
      if (!canvasState[k].pendingDraw) {
        canvasState[k].pendingDraw = true;
        requestAnimationFrame(() => draw(k));
      }
    }
  });
  if (isBigKnife) appState.lastBigKnifeFont = fontFamily;
}