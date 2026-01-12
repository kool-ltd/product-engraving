/* js/events.js */
import { appState, canvasState } from './state.js';
import { draw, invalidateCache, invalidateTextCache, syncFontAndText } from './canvas.js';
import { switchPage, updateLanguage, pages } from './ui.js';
import { toFullCoords, hitTest, measureText, loadImage, fitInBox } from './utils.js';
import { KNIVES, CONSTANTS } from './config.js';

export function initGlobalEvents() {
  document.addEventListener('click', e => {
    const id = e.target.id || e.target.closest('button')?.id;
    if (id === 'lang-toggle') {
      updateLanguage(appState.currentLang === 'en' ? 'zh-hk' : 'en');
    } else if (id === 'edit-zone') {
      appState.showEditZone = !appState.showEditZone;
      Object.keys(canvasState).forEach(k => { invalidateCache(k); draw(k); });
    } else if (id === 'sync-fonts') {
      appState.syncFonts = !appState.syncFonts;
    }
    // ... add other toolbar toggles similarly
  });
}

export async function initializeKnifeLogic(knife) {
  const s = canvasState[knife];
  s.overlayEl.style.visibility = 'visible';
  
  const productPicker = document.getElementById('product-picker');
  s.img = await loadImage(productPicker.querySelector(`input[data-name="${knife}"]`).value);
  
  s.full.width = s.img.naturalWidth;
  s.full.height = s.img.naturalHeight;
  s.textRightX = s.full.width / 2;
  s.pos.y = s.full.height / 2;
  
  fitInBox(s.view, s.img, s.wrapper);
  s.overlayEl.style.visibility = 'hidden';
  draw(knife);

  // Input Listeners
  s.textInput.addEventListener('input', () => {
    if (appState.sameContent) {
      appState.sharedText = s.textInput.value;
      Object.keys(canvasState).forEach(k => {
        canvasState[k].textInput.value = appState.sharedText;
        canvasState[k].baseDims = measureText(canvasState[k].fCtx, canvasState[k].textInput.value, canvasState[k].baseFont, canvasState[k].fontSel.value);
        invalidateTextCache(k);
        draw(k);
      });
    } else {
      s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value);
      invalidateTextCache(knife);
      draw(knife);
    }
  });

  // Pointer Listeners (Dragging)
  s.view.addEventListener('pointerdown', e => {
    const f = toFullCoords(s.view, s, e.clientX, e.clientY);
    if (!hitTest(f.x, f.y, s.pos.y, s.baseDims, s.textScale, s.textRightX)) return;
    s.dragging = true;
    s.dragStart = { id: e.pointerId, dx: f.x - s.textRightX, dy: f.y - s.pos.y };
    s.view.setPointerCapture(e.pointerId);
  });

  s.view.addEventListener('pointermove', e => {
    if (!s.dragging || e.pointerId !== s.dragStart.id) return;
    const f = toFullCoords(s.view, s, e.clientX, e.clientY);
    s.textRightX = f.x - s.dragStart.dx;
    s.pos.y = f.y - s.dragStart.dy;
    invalidateTextCache(knife);
    draw(knife);
  });

  s.view.addEventListener('pointerup', () => s.dragging = false);
}