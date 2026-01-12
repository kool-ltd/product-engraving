import { state, appConfig, elements } from './state.js';
import { KNIVES, FONT_WEIGHTS, TOGGLE_DEBOUNCE } from './constants.js';
import { updateLanguage, translations } from './language.js';
import { switchPage, updateProgressSection } from './navigation.js';
import { loadImage, fitInBox, measureText, toFullCoords } from './helpers.js';
import { draw, invalidateCache, invalidateTextCache, generatePreviews } from './canvas-engine.js';
import * as Interactions from './interactions.js';

/**
 * MAIN INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
  // Set initial language
  updateLanguage(appConfig.currentLang);
  
  // Setup Global UI Listeners
  setupGlobalListeners();
});

function setupGlobalListeners() {
  // 1. Language Toggle
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#lang-toggle');
    if (btn) {
      const newLang = appConfig.currentLang === 'en' ? 'zh-hk' : 'en';
      updateLanguage(newLang);
    }
  });

  // 2. Page 1 -> Next (Product Selection)
  elements.next1.addEventListener('click', async () => {
    const selectedInputs = Array.from(elements.productPicker.querySelectorAll('input:checked'));
    if (selectedInputs.length === 0) {
      elements.alertMessage.textContent = translations[appConfig.currentLang].noSelection;
      elements.alertModal.style.display = 'flex';
      return;
    }

    // Reset state and containers
    Object.keys(state).forEach(key => delete state[key]);
    elements.bigKnifeContent.innerHTML = '';
    elements.smallKnifeContent.innerHTML = '';
    elements.otherContent.innerHTML = '';

    // Determine navigation path
    const selectedNames = selectedInputs.map(i => i.dataset.name);
    const hasBig = selectedNames.some(name => KNIVES.big.includes(name));
    const hasSmall = selectedNames.some(name => KNIVES.small.includes(name));
    const hasOthers = selectedNames.some(name => KNIVES.others.includes(name));

    const targetPage = hasBig ? 2 : (hasSmall ? 3 : 5);
    switchPage(1, targetPage);

    // Initialize each selected knife
    for (const name of selectedNames) {
      await initializeKnife(name);
    }
  });

  // 3. Navigation Buttons for Steps
  document.getElementById('next-2').onclick = () => {
    const hasSmall = Object.keys(state).some(k => KNIVES.small.includes(k));
    switchPage(2, hasSmall ? 3 : 5);
  };
  document.getElementById('back-2').onclick = () => switchPage(2, 1);
  
  document.getElementById('next-3').onclick = () => switchPage(3, 5);
  document.getElementById('back-3').onclick = () => {
    const hasBig = Object.keys(state).some(k => KNIVES.big.includes(k));
    switchPage(3, hasBig ? 2 : 1);
  };

  document.getElementById('back-5').onclick = () => {
    const hasSmall = Object.keys(state).some(k => KNIVES.small.includes(k));
    if (hasSmall) return switchPage(5, 3);
    const hasBig = Object.keys(state).some(k => KNIVES.big.includes(k));
    if (hasBig) return switchPage(5, 2);
    switchPage(5, 1);
  };

  // 4. Final Preview Generation
  document.getElementById('generate-preview').onclick = async () => {
    await generatePreviews();
    switchPage(5, 6);
  };

  // 5. Global Toggles (Alignment / Edit Zone)
  setupToggleListeners();

  // 6. Alert Modal Close
  elements.modalClose.onclick = () => {
    elements.alertModal.style.display = 'none';
  };
}

/**
 * KNIFE WORKSPACE INITIALIZATION
 */
async function initializeKnife(knifeName) {
  // 1. Determine Container
  let container = elements.otherContent;
  if (KNIVES.big.includes(knifeName)) container = elements.bigKnifeContent;
  if (KNIVES.small.includes(knifeName)) container = elements.smallKnifeContent;

  // 2. Create UI Elements
  const section = document.createElement('div');
  section.className = 'knife-section';
  section.innerHTML = `
    <h3 data-i18n="${knifeName}Knife">${translations[appConfig.currentLang][`${knifeName}Knife`]}</h3>
    <div class="canvas-container">
      <canvas class="view-canvas"></canvas>
      <div class="text-bbox"></div>
    </div>
    <div class="controls-grid">
      <div class="control-group">
        <label data-i18n="engravingText">${translations[appConfig.currentLang].engravingText}</label>
        <input type="text" class="text-input" placeholder="...">
      </div>
      <div class="control-group">
        <label data-i18n="fontSize">${translations[appConfig.currentLang].fontSize}</label>
        <input type="range" class="scale-slider" min="0.5" max="2.5" step="0.01" value="1">
      </div>
      <div class="control-group">
        <label data-i18n="fontFamily">${translations[appConfig.currentLang].fontFamily}</label>
        <select class="font-sel">
          <option value="Cinzel">Cinzel (Serif)</option>
          <option value="Lato">Lato (Sans)</option>
          <option value="Zhi Mang Xing">Zhi Mang Xing (Script)</option>
          <option value="Ma Shan Zheng">Ma Shan Zheng (Brush)</option>
        </select>
      </div>
      <div class="control-group">
        <label data-i18n="fontWeight">${translations[appConfig.currentLang].fontWeight}</label>
        <select class="weight-sel">
          <option value="400">Regular</option>
          <option value="700">Bold</option>
        </select>
      </div>
    </div>
  `;
  container.appendChild(section);

  // 3. Load Assets
  const [img, overlay] = await Promise.all([
    loadImage(`assets/${knifeName}.png`),
    loadImage(`assets/${knifeName}_overlay.png`).catch(() => null)
  ]);

  // 4. Initialize State Object
  const vCanvas = section.querySelector('.view-canvas');
  state[knifeName] = {
    img, overlay,
    vCanvas, vCtx: vCanvas.getContext('2d'),
    cacheCanvas: document.createElement('canvas'),
    cacheCtx: null,
    textCacheCanvas: document.createElement('canvas'),
    textCacheCtx: null,
    bbox: section.querySelector('.text-bbox'),
    textInput: section.querySelector('.text-input'),
    scaleSlider: section.querySelector('.scale-slider'),
    fontSel: section.querySelector('.font-sel'),
    weightSel: section.querySelector('.weight-sel'),
    full: { width: img.width, height: img.height },
    view: { width: 0, height: 0 },
    pos: { y: img.height * 0.45 },
    textRightX: img.width * 0.8,
    textScale: 1.0,
    baseFont: 40,
    baseDims: { w: 0, h: 0 },
    cacheValid: false,
    textCacheValid: false,
    dragging: false,
    resizing: false,
    boxVisible: false
  };

  const s = state[knifeName];
  s.cacheCtx = s.cacheCanvas.getContext('2d');
  s.textCacheCtx = s.textCacheCanvas.getContext('2d');

  // 5. Setup Event Listeners for this specific knife
  setupKnifeListeners(knifeName);

  // 6. Initial Render
  handleResize();
  window.addEventListener('resize', handleResize);
}

function setupKnifeListeners(knife) {
  const s = state[knife];

  // Text Change
  s.textInput.addEventListener('input', (e) => {
    s.baseDims = measureText(e.target.value, s.fontSel.value, s.weightSel.value, s.baseFont);
    invalidateTextCache(knife);
    draw(knife);
  });

  // Scale Slider
  s.scaleSlider.addEventListener('input', (e) => {
    s.textScale = parseFloat(e.target.value);
    invalidateTextCache(knife);
    draw(knife);
  });

  // Font/Weight Select
  [s.fontSel, s.weightSel].forEach(el => {
    el.addEventListener('change', () => {
      s.baseDims = measureText(s.textInput.value, s.fontSel.value, s.weightSel.value, s.baseFont);
      invalidateTextCache(knife);
      draw(knife);
    });
  });

  // Pointer Interactions
  s.vCanvas.addEventListener('pointerdown', (e) => {
    s.vCanvas.setPointerCapture(e.pointerId);
    Interactions.handlePointerDown(knife, e);
  });

  s.vCanvas.addEventListener('pointermove', (e) => {
    Interactions.handlePointerMove(knife, e);
  });

  s.vCanvas.addEventListener('pointerup', (e) => {
    s.dragging = false;
    s.resizing = false;
    s.vCanvas.releasePointerCapture(e.pointerId);
  });
}

/**
 * GLOBAL TOGGLES LOGIC
 */
function setupToggleListeners() {
  // Alignment Toggles
  const toggles = [
    { id: 'sync-big', prop: 'alignRightBig' },
    { id: 'sync-small', prop: 'alignRightSmall' },
    { id: 'sync-others', prop: 'alignRightOthers' }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
      el.addEventListener('change', (e) => {
        appConfig[t.prop] = e.target.checked;
      });
    }
  });

  // Edit Zone Overlay Toggle
  const zoneToggle = document.getElementById('show-zone');
  if (zoneToggle) {
    zoneToggle.addEventListener('change', (e) => {
      appConfig.showEditZone = e.target.checked;
      Object.keys(state).forEach(k => {
        invalidateCache(k);
        draw(k);
      });
    });
  }
}

/**
 * RESPONSIVE HANDLING
 */
function handleResize() {
  Object.keys(state).forEach(knife => {
    const s = state[knife];
    const container = s.vCanvas.parentElement;
    const w = container.clientWidth;
    const h = (s.full.height / s.full.width) * w;
    
    s.vCanvas.width = w;
    s.vCanvas.height = h;
    s.view.width = w;
    s.view.height = h;
    
    draw(knife);
  });
}

// Export for potential debugging or extension
export { initializeKnife, handleResize };