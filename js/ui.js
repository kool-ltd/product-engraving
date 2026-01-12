/* js/ui.js */
import { TRANSLATIONS, KNIVES, CONSTANTS } from './config.js';
import { appState, canvasState, initializeCanvasStateForKnife } from './state.js';
import { draw } from './canvas.js';

export const pages = {
  1: document.getElementById('page-1'),
  2: document.getElementById('page-2'),
  3: document.getElementById('page-3'),
  4: document.getElementById('page-4'),
  5: document.getElementById('page-5')
};

export function switchPage(from, to) {
  if (appState.isNavigating) return;
  appState.isNavigating = true;
  
  pages[from].classList.remove('active');
  pages[to].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const isPage5 = String(to) === '5';
  const autoAlignButtons = document.querySelectorAll('#auto-align');
  autoAlignButtons.forEach(btn => {
    btn.style.setProperty('display', isPage5 ? 'none' : '', 'important');
  });

  setTimeout(() => { 
    appState.isNavigating = false;
    updateProgressSection();
  }, 100);
}

export function updateLanguage(lang) {
  appState.currentLang = lang;
  document.documentElement.lang = lang;
  
  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.textContent = lang === 'en' ? TRANSLATIONS['zh-hk'].chinese : TRANSLATIONS.en.english;
  }

  document.getElementById('title').textContent = TRANSLATIONS[lang].title;
  const subtitle = document.getElementById('subtitle');
  subtitle.innerHTML = `${TRANSLATIONS[lang].subtitle} <img src="kool-logo.png" alt="logo" style="width:50px;vertical-align:bottom;"> ${TRANSLATIONS[lang].subtitleAfter}`;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = TRANSLATIONS[lang][key];
      } else if (!el.id.startsWith('back-') && !el.id.startsWith('next-') && el.id !== 'download-all') {
        el.innerHTML = TRANSLATIONS[lang][key];
      }
    }
  });

  document.getElementById('alert-close').textContent = TRANSLATIONS[lang].close;
}

export function updateProgressSection() {
  const productPicker = document.getElementById('product-picker');
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const activePage = Object.keys(pages).find(p => pages[p].classList.contains('active'));

  const steps = [];
  let stepNumber = 1;

  if (selected.some(i => KNIVES.big.includes(i.dataset.name))) steps.push({ id: '2', label: stepNumber++ });
  if (selected.some(i => KNIVES.small.includes(i.dataset.name))) steps.push({ id: '3', label: stepNumber++ });
  if (selected.some(i => KNIVES.others.includes(i.dataset.name))) steps.push({ id: '5', label: stepNumber++ });
  steps.push({ id: '4', label: '', icon: 'preview', isPreview: true });

  const progressSections = document.querySelectorAll('#progress-section');
  progressSections.forEach(section => {
    section.innerHTML = steps
      .map((step, index) => `
        <div class="progress-step ${step.id === activePage ? 'active' : ''} ${step.isPreview ? 'preview' : ''}">
          ${step.icon ? `<span class="material-symbols-outlined">${step.icon}</span>` : step.label}
        </div>
        ${index < steps.length - 1 ? '<span class="progress-separator">-</span>' : ''}
      `).join('');
  });
}

export function createCanvasSection(knife) {
  const showSameContent = knife === appState.firstSelectedKnife;
  const section = document.createElement('div');
  section.className = 'knife-section';
  const lang = appState.currentLang;
  const labelKey = KNIVES.big.includes(knife) || KNIVES.small.includes(knife) ? knife + 'Knife' : knife;

  section.innerHTML = `
    <h3 data-i18n="${labelKey}">${TRANSLATIONS[lang][labelKey]}</h3>
    <div class="controls">
      <div>
        <label data-i18n="textLabel">${TRANSLATIONS[lang].textLabel}</label>
        <input type="text" id="text-${knife}" placeholder="${TRANSLATIONS[lang].textPlaceholder}">
      </div>
      <div>
        <label data-i18n="fontLabel">${TRANSLATIONS[lang].fontLabel}</label>
        <select id="font-${knife}">
          <optgroup label="${TRANSLATIONS[lang].english}">
            <option value="Montserrat">Montserrat</option>
            <option value="Roboto">Roboto</option>
            <option value="Lobster">Lobster</option>
          </optgroup>
          <optgroup label="${TRANSLATIONS[lang].chinese}">
            <option value="'Noto Sans HK',sans-serif">思源黑體</option>
            <option value="'Noto Serif TC',serif">思源宋體</option>
          </optgroup>
        </select>
      </div>
      <div>
        <label data-i18n="weightLabel">${TRANSLATIONS[lang].weightLabel}</label>
        <select id="weight-${knife}">
          <option value="400" data-i18n="regularWeight">${TRANSLATIONS[lang].regularWeight}</option>
          <option value="700" data-i18n="boldWeight">${TRANSLATIONS[lang].boldWeight}</option>
        </select>
      </div>
    </div>
    ${showSameContent ? `
      <div class="same-content">
        <input type="checkbox" id="same-content-${knife}" ${appState.sameContent ? 'checked' : ''}>
        <label for="same-content-${knife}" data-i18n="sameContentLabel">${TRANSLATIONS[lang].sameContentLabel}</label>
      </div>
    ` : ''}
    <div class="canvas-wrapper" id="wrapper-${knife}">
      <canvas id="canvas-${knife}"></canvas>
      <div class="loading-overlay" id="overlay-${knife}" data-i18n="loading">${TRANSLATIONS[lang].loading}</div>
      <div class="bbox" id="bbox-${knife}">
        <div class="handle" data-handle="nw"></div><div class="handle" data-handle="ne"></div>
        <div class="handle" data-handle="sw"></div><div class="handle" data-handle="se"></div>
      </div>
    </div>
  `;

  const containerId = KNIVES.big.includes(knife) ? 'big-knife-content' : 
                    KNIVES.small.includes(knife) ? 'small-knife-content' : 'other-content';
  document.getElementById(containerId).appendChild(section);

  initializeCanvasStateForKnife(knife);
  const s = canvasState[knife];
  s.baseFont = KNIVES.big.includes(knife) ? CONSTANTS.BASE_FONT_BIG : 
               KNIVES.small.includes(knife) ? CONSTANTS.BASE_FONT_SMALL : CONSTANTS.BASE_FONT_OTHER;
  
  // Link DOM to state
  s.view = document.getElementById(`canvas-${knife}`);
  s.vCtx = s.view.getContext('2d');
  s.wrapper = document.getElementById(`wrapper-${knife}`);
  s.overlayEl = document.getElementById(`overlay-${knife}`);
  s.bbox = document.getElementById(`bbox-${knife}`);
  s.textInput = document.getElementById(`text-${knife}`);
  s.fontSel = document.getElementById(`font-${knife}`);
  s.weightSel = document.getElementById(`weight-${knife}`);
  s.sameContentChk = showSameContent ? document.getElementById(`same-content-${knife}`) : null;
  
  s.full = document.createElement('canvas');
  s.fCtx = s.full.getContext('2d');
  s.cacheCanvas = document.createElement('canvas');
  s.cacheCtx = s.cacheCanvas.getContext('2d');
  s.textCacheCanvas = document.createElement('canvas');
  s.textCacheCtx = s.textCacheCanvas.getContext('2d');
  s.previewCanvas = document.createElement('canvas');
}