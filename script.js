/* LANGUAGE TOGGLE */
let currentLang = 'en';

function updateLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.textContent = lang === 'en' ? translations['zh-hk'].chinese : translations.en.english;
  }

  document.getElementById('title').textContent = translations[lang].title;
  const subtitle = document.getElementById('subtitle');
  subtitle.innerHTML = `${translations[lang].subtitle} <img src="kool-logo.png" alt="logo" style="width:50px;vertical-align:bottom;"> ${translations[lang].subtitleAfter}`;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = translations[lang][key];
      } else if (el.id !== 'back-2' && el.id !== 'back-3' && el.id !== 'back-4' &&
                 el.id !== 'edit-zone' && el.id !== 'resize-controls' &&
                 el.id !== 'sync-fonts' && el.id !== 'auto-align' &&
                 el.id !== 'next-1' && el.id !== 'next-2' && el.id !== 'next-3' &&
                 el.id !== 'download-all') {
        el.innerHTML = translations[lang][key];
      }
    }
  });

  document.getElementById('alert-close').textContent = translations[lang].close;

  bigKnifeContent.innerHTML = '';
  smallKnifeContent.innerHTML = '';
  otherContent.innerHTML = '';
  const selectedKnives = Object.keys(state);
  selectedKnives.forEach(knife => {
    createCanvasSection(knife);
    initializeKnife(knife);
  });

  if (pages[4].classList.contains('active')) {
    generatePreviews();
  }
}

document.addEventListener('click', e => {
  if (e.target.id === 'lang-toggle' || e.target.closest('#lang-toggle')) {
    console.log('Language toggle clicked');
    updateLanguage(currentLang === 'en' ? 'zh-hk' : 'en');
  }
});

/* STATE */
const knives = {
  big: ['santoku', 'chef', 'bread'],
  small: ['utility', 'paring'],
  others: ['chopper', 'choppingBoard', 'tongs', 'scissors','turner']
};
const state = {};
let sameContent = true;
let sharedText = '';
let firstSelectedKnife = null;
let lastAdjusted = { big: null, small: null, others: null };
let syncFonts = true;
let showEditZone = true;
let showResizeControls = true;
let alignRightBig = true;
let alignRightSmall = true;
let alignRightOthers = false;
let isNavigating = false;
let lastToggleTime = 0;
let lastBigKnifeFont = currentLang === 'zh-hk' ? "'Noto Sans HK',sans-serif" : "Montserrat";
let storedPositions = { big: {}, small: {}, others: {} };
const toggleDebounce = 200; // ms

/* ELEMENTS */
const pages = {
  1: document.getElementById('page-1'),
  2: document.getElementById('page-2'),
  3: document.getElementById('page-3'),
  4: document.getElementById('page-4'),
  5: document.getElementById('page-5')
};
const productPicker = document.getElementById('product-picker');
const bigKnifeContent = document.getElementById('big-knife-content');
const smallKnifeContent = document.getElementById('small-knife-content');
const previewContent = document.getElementById('preview-content');
const otherContent = document.getElementById('other-content');
const next1Btn = document.getElementById('next-1');
const back2Btn = document.getElementById('back-2');
const next2Btn = document.getElementById('next-2');
const back3Btn = document.getElementById('back-3');
const next3Btn = document.getElementById('next-3');
const back4Btn = document.getElementById('back-4');
const back5Btn = document.getElementById('back-5');
const next5Btn = document.getElementById('next-5');
const downloadBtn = document.getElementById('download-all');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');

/* HELPERS */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    i.src = src;
  });
}

function fitInBox(canvas, img, wrapper) {
  const wrapW = wrapper.clientWidth;
  const scale = wrapW / img.naturalWidth;
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  return scale;
}

function measureText(ctx, text, fontSize, font, weight = '400') {
  ctx.font = `${weight} ${fontSize}px ${font}`;
  return { w: ctx.measureText(text).width, h: fontSize };
}

function toFullCoords(canvas, wrapper, cx, cy) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (cx - r.left) * (wrapper.full.width / r.width),
    y: (cy - r.top) * (wrapper.full.height / r.height)
  };
}

function hitTest(fx, fy, posY, dims, scale, textRightX) {
  const x = textRightX - dims.w * scale;
  return fx >= x && fx <= textRightX &&
         fy >= posY && fy <= posY + dims.h * scale;
}

function hasBigKnives(selected) {
  return selected.some(input => knives.big.includes(input.dataset.name));
}

function hasSmallKnives(selected) {
  return selected.some(input => knives.small.includes(input.dataset.name));
}

function hasOtherItems(selected) {
  return selected.some(input => knives.others.includes(input.dataset.name));
}

function switchPage(from, to) {
  if (isNavigating) return;
  isNavigating = true;
  console.log(`switchPage called: from=${from}, to=${to}, typeof to=${typeof to}`);
  pages[from].classList.remove('active');
  pages[to].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Show/hide auto-align button based on page
  const isPage5 = to === '5' || to === 5 || String(to) === '5' || pages[5].classList.contains('active');
  console.log(`switchPage: to=${to}, isPage5=${isPage5}, active page=${Object.keys(pages).find(p => pages[p].classList.contains('active'))}`);
  const autoAlignButtons = document.querySelectorAll('#auto-align');
  console.log(`switchPage: found ${autoAlignButtons.length} auto-align buttons`);
  autoAlignButtons.forEach(btn => {
    btn.style.setProperty('display', isPage5 ? 'none' : '', 'important');
    // console.log(`Set display=${isPage5 ? 'none' : ''} for auto-align button ID=${btn.id}`);
  });
  // Ensure sync-fonts buttons are visible
  document.querySelectorAll('#sync-fonts').forEach(btn => {
    btn.style.setProperty('display', '', 'important');
    // console.log(`Set display='' for sync-fonts button ID=${btn.id}`);
  });
  setTimeout(() => { 
    isNavigating = false;
    updateProgressSection();
  }, 100);
}

function createCanvasSection(knife) {
  const showSameContent = knife === firstSelectedKnife;
  const section = document.createElement('div');
  section.className = 'knife-section';
  section.innerHTML = `
    <h3 data-i18n="${knives.big.includes(knife) || knives.small.includes(knife) ? knife + 'Knife' : knife}">${translations[currentLang][knives.big.includes(knife) || knives.small.includes(knife) ? knife + 'Knife' : knife]}</h3>
    <div class="controls">
      <div>
        <label for="text-${knife}" data-i18n="textLabel">${translations[currentLang].textLabel}</label>
        <input type="text" id="text-${knife}" placeholder="${translations[currentLang].textPlaceholder}">
      </div>
      <div>
        <label for="font-${knife}" data-i18n="fontLabel">${translations[currentLang].fontLabel}</label>
        <select id="font-${knife}" ${currentLang === 'zh-hk' ? 'data-default="Noto Sans HK"' : ''}>
          <optgroup label="${translations[currentLang].english}">
            <option value="Montserrat">Montserrat</option>
            <option value="Roboto">Roboto</option>
            <option value="Lobster">Lobster</option>
            <option value="'Times New Roman',serif">Times New Roman</option>
            <option value="'Courier New',monospace">Courier New</option>
            <option value="Arial,sans-serif">Arial</option>
          </optgroup>
          <optgroup label="${translations[currentLang].chinese}">
            <option value="'Chocolate Classical Sans',sans-serif">朱古力黑體</option>
            <option value="'LXGW WenKai Mono TC',monospace">霞鶩文楷</option>
            <option value="'Noto Sans HK',sans-serif">思源黑體</option>
            <option value="'Noto Serif TC',serif">思源宋體</option>
          </optgroup>
        </select>
      </div>
      <div>
        <label for="weight-${knife}" data-i18n="weightLabel">${translations[currentLang].weightLabel}</label>
        <select id="weight-${knife}">
          <option value="400" data-i18n="regularWeight">${translations[currentLang].regularWeight}</option>
          <option value="700" data-i18n="boldWeight">${translations[currentLang].boldWeight}</option>
        </select>
      </div>
    </div>
    ${showSameContent ? `
      <div class="same-content">
        <input type="checkbox" id="same-content-${knife}" ${sameContent ? 'checked' : ''}>
        <label for="same-content-${knife}" data-i18n="sameContentLabel">${translations[currentLang].sameContentLabel}</label>
      </div>
    ` : ''}
    <p style="font-size:.8rem;color:#666;margin-top:.5rem;" data-i18n="instructions">
      ${translations[currentLang].instructions}
    </p>
    <div class="canvas-wrapper" id="wrapper-${knife}">
      <canvas id="canvas-${knife}"></canvas>
      <div class="loading-overlay" id="overlay-${knife}" data-i18n="loading">${translations[currentLang].loading}</div>
      <div class="bbox" id="bbox-${knife}">
        <div class="handle" data-handle="nw"></div>
        <div class="handle" data-handle="ne"></div>
        <div class="handle" data-handle="sw"></div>
        <div class="handle" data-handle="se"></div>
      </div>
    </div>
  `;
  if (knives.big.includes(knife)) {
    bigKnifeContent.appendChild(section);
  } else if (knives.small.includes(knife)) {
    smallKnifeContent.appendChild(section);
  } else if (knives.others.includes(knife)) {
    otherContent.appendChild(section);
  }

  state[knife] = {
    img: null,
    overlay: null,
    baseFont: knives.big.includes(knife) ? 150 : knives.small.includes(knife) ? 100 : 120,
    textScale: 1,
    baseDims: { w: 0, h: 0 },
    textRightX: 0,
    pos: { y: 0 },
    boxVisible: showResizeControls,
    dragging: false,
    dragStart: {},
    resizing: false,
    resizeStart: {},
    pointers: {},
    pinch: false,
    pinchStart: {},
    view: document.getElementById(`canvas-${knife}`),
    vCtx: document.getElementById(`canvas-${knife}`).getContext('2d'),
    full: document.createElement('canvas'),
    fCtx: document.createElement('canvas').getContext('2d'),
    wrapper: document.getElementById(`wrapper-${knife}`),
    overlayEl: document.getElementById(`overlay-${knife}`),
    bbox: document.getElementById(`bbox-${knife}`),
    textInput: document.getElementById(`text-${knife}`),
    fontSel: document.getElementById(`font-${knife}`),
    weightSel: document.getElementById(`weight-${knife}`), 
    sameContentChk: showSameContent ? document.getElementById(`same-content-${knife}`) : null,
    cacheCanvas: document.createElement('canvas'),
    cacheCtx: document.createElement('canvas').getContext('2d'),
    textCacheCanvas: document.createElement('canvas'),
    textCacheCtx: document.createElement('canvas').getContext('2d'),
    previewCanvas: document.createElement('canvas'),
    cacheValid: false,
    textCacheValid: false,
    pendingDraw: false
  };
  state[knife].full.width = 0;
  state[knife].full.height = 0;
  state[knife].fCtx = state[knife].full.getContext('2d');
  state[knife].cacheCanvas.width = 0;
  state[knife].cacheCanvas.height = 0;
  state[knife].cacheCtx = state[knife].cacheCanvas.getContext('2d');
  state[knife].textCacheCanvas.width = 0;
  state[knife].textCacheCanvas.height = 0;
  state[knife].textCacheCtx = state[knife].textCacheCanvas.getContext('2d');
  state[knife].previewCanvas.width = 0;
  state[knife].previewCanvas.height = 0;
}

function draw(knife) {
  const s = state[knife];
  if (!s.img || s.full.width === 0 || s.full.height === 0) return;

  const textX = s.textRightX;

  if (!s.cacheValid) {
    s.cacheCanvas.width = s.full.width;
    s.cacheCanvas.height = s.full.height;
    if (s.cacheCanvas.width === 0 || s.cacheCanvas.height === 0) return;
    s.cacheCtx.clearRect(0, 0, s.full.width, s.full.height);
    s.cacheCtx.drawImage(s.img, 0, 0);
    if (showEditZone && s.overlay) {
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

function invalidateCache(knife) {
  state[knife].cacheValid = false;
}

function invalidateTextCache(knife) {
  state[knife].textCacheValid = false;
}

function syncFontAndText(knife) {
  if (!syncFonts) return;
  const refState = state[knife];
  const fontFamily = refState.fontSel.value;
  const fontWeight = refState.weightSel.value;
  const effectiveFontSize = refState.baseFont * refState.textScale;
  const isBigKnife = knives.big.includes(knife);
  const isSmallKnife = knives.small.includes(knife);
  const isOtherItem = knives.others.includes(knife);
  Object.keys(state).forEach(k => {
    if (k !== knife && 
        ((isBigKnife && knives.big.includes(k)) || 
         (isSmallKnife && knives.small.includes(k)) || 
         (isOtherItem && knives.others.includes(k)))) {
      state[k].fontSel.value = fontFamily;
      state[k].weightSel.value = fontWeight;
      // Only sync font size for big and small knives, not others
      if (!isOtherItem) {
        state[k].baseFont = effectiveFontSize;
        state[k].textScale = 1;
      }
      state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value, state[k].weightSel.value);
      invalidateTextCache(k);
      if (!state[k].pendingDraw) {
        state[k].pendingDraw = true;
        requestAnimationFrame(() => draw(k));
      }
    }
  });
  if (isBigKnife) {
    lastBigKnifeFont = fontFamily;
  }
}

function debounceToggle(fn, id, icon) {
  return () => {
    const now = Date.now();
    if (now - lastToggleTime < toggleDebounce) return;
    lastToggleTime = now;
    console.log(`Toggling ${id}`);
    fn();
    document.querySelectorAll(`#${id}`).forEach(btn => {
      btn.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
    });
  };
}

function toggleEditZone() {
  showEditZone = !showEditZone;
  Object.keys(state).forEach(knife => {
    invalidateCache(knife);
    if (!state[knife].pendingDraw) {
      state[knife].pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
  });
  document.querySelectorAll('#edit-zone').forEach(btn => {
    btn.classList.toggle('off', !showEditZone);
  });
}

function toggleResizeControls() {
  showResizeControls = !showResizeControls;
  Object.keys(state).forEach(knife => {
    state[knife].boxVisible = showResizeControls;
    if (!state[knife].pendingDraw) {
      state[knife].pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
  });
  document.querySelectorAll('#resize-controls').forEach(btn => {
    btn.classList.toggle('off', !showResizeControls);
  });
}

function toggleSyncFonts() {
  syncFonts = !syncFonts;
  if (syncFonts && Object.keys(state).length > 0) {
    const bigKnife = lastAdjusted.big || Object.keys(state).find(k => knives.big.includes(k));
    const smallKnife = lastAdjusted.small || Object.keys(state).find(k => knives.small.includes(k));
    if (bigKnife) syncFontAndText(bigKnife);
    if (smallKnife) syncFontAndText(smallKnife);
  }
  document.querySelectorAll('#sync-fonts').forEach(btn => {
    btn.classList.toggle('off', !syncFonts);
  });
}

function toggleAlignment(knife) {
  const isBigKnife = knives.big.includes(knife);
  const isSmallKnife = knives.small.includes(knife);
  const isOtherItem = knives.others.includes(knife);
  const group = isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others';
  let alignRight = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;

  if (alignRight) {
    // Store current positions and disable alignment
    Object.keys(state).forEach(k => {
      if ((isBigKnife && knives.big.includes(k)) || 
          (isSmallKnife && knives.small.includes(k)) || 
          (isOtherItem && knives.others.includes(k))) {
        storedPositions[group][k] = { textRightX: state[k].textRightX, y: state[k].pos.y };
        invalidateTextCache(k);
        if (!state[k].pendingDraw) {
          state[k].pendingDraw = true;
          requestAnimationFrame(() => draw(k));
        }
      }
    });
    if (isBigKnife) alignRightBig = false;
    else if (isSmallKnife) alignRightSmall = false;
    else alignRightOthers = false; // Always disable for others
  } else {
    // Only allow alignment for big or small knives, not others
    if (isBigKnife || isSmallKnife) {
      const lastKnife = lastAdjusted[group] || knife;
      const refTextRightX = state[lastKnife].textRightX;
      const refY = state[lastKnife].pos.y;
      Object.keys(state).forEach(k => {
        if ((isBigKnife && knives.big.includes(k)) || 
            (isSmallKnife && knives.small.includes(k))) {
          storedPositions[group][k] = { textRightX: state[k].textRightX, y: state[k].pos.y };
          state[k].textRightX = refTextRightX;
          state[k].pos.y = refY;
          invalidateTextCache(k);
          if (!state[k].pendingDraw) {
            state[k].pendingDraw = true;
            requestAnimationFrame(() => draw(k));
          }
        }
      });
      if (isBigKnife) alignRightBig = true;
      else if (isSmallKnife) alignRightSmall = true;
    }
    // Do not enable alignRightOthers for page 5
  }

  document.querySelectorAll('#auto-align').forEach(btn => {
    btn.classList.toggle('off', isBigKnife ? !alignRightBig : isSmallKnife ? !alignRightSmall : !alignRightOthers);
  });
}

async function generatePreviews() {
  previewContent.innerHTML = '';
  for (const knife of Object.keys(state)) {
    const s = state[knife];
    s.previewCanvas.width = s.full.width;
    s.previewCanvas.height = s.full.height;
    const ctx = s.previewCanvas.getContext('2d');
    ctx.drawImage(s.img, 0, 0);
    if (s.textInput.value) {
      ctx.font = `${s.weightSel.value} ${s.baseFont * s.textScale}px ${s.fontSel.value}`;
      ctx.fillStyle = '#000';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'right';
      ctx.fillText(s.textInput.value, s.textRightX, s.pos.y);
    }
    const previewUrl = s.previewCanvas.toDataURL('image/png');
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `
      <img src="${previewUrl}" alt="${knife} preview" data-knife="${knife}">
      <span data-i18n="${knife}Knife">${translations[currentLang][`${knife}Knife`]}</span>
    `;
    previewContent.appendChild(div);
  }
  previewContent.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', () => {
      modalImage.src = img.src;
      modal.style.display = 'flex';
    });
  });
}

modal.addEventListener('click', () => {
  modal.style.display = 'none';
  modalImage.src = '';
});

const alertModal = document.getElementById('alert-modal');
const alertCloseBtn = document.getElementById('alert-close');

alertCloseBtn.addEventListener('click', () => {
  alertModal.style.display = 'none';
  document.getElementById('alert-message').textContent = '';
});

document.fonts.ready.then(() => {
  Object.keys(state).forEach(knife => {
    if (!state[knife].pendingDraw) {
      state[knife].pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
  });
});

next1Btn.addEventListener('click', async () => {
  if (isNavigating) return;
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  if (selected.length === 0) {
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    alertMessage.textContent = translations[currentLang].noSelection;
    alertModal.style.display = 'flex';
    return;
  }
  bigKnifeContent.innerHTML = '';
  smallKnifeContent.innerHTML = '';
  otherContent.innerHTML = '';
  Object.keys(state).forEach(knife => delete state[knife]);
  firstSelectedKnife = selected[0].dataset.name;

  const hasBig = hasBigKnives(selected);
  const hasSmall = hasSmallKnives(selected);
  const hasOthers = hasOtherItems(selected);

  if (hasBig) {
    switchPage(1, 2);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.big.includes(knife)) {
        await initializeKnife(knife);
      }
    }
  } else if (hasSmall) {
    switchPage(1, 3);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.small.includes(knife)) {
        await initializeKnife(knife);
      }
    }
  } else if (hasOthers) {
    switchPage(1, 5);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.others.includes(knife)) {
        await initializeKnife(knife);
      }
    }
  }
});

back2Btn.addEventListener('click', () => {
  switchPage(2, 1);
});

next2Btn.addEventListener('click', async () => {
  if (isNavigating) return;
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasSmall = hasSmallKnives(selected);
  const hasOthers = hasOtherItems(selected);
  if (hasSmall) {
    switchPage(2, 3);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.small.includes(knife) && !state[knife]) {
        await initializeKnife(knife);
      }
    }
  } else if (hasOthers) {
    switchPage(2, 5);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.others.includes(knife) && !state[knife]) {
        await initializeKnife(knife);
      }
    }
  } else {
    switchPage(2, 4);
    await generatePreviews();
  }
});

back3Btn.addEventListener('click', () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasBig = hasBigKnives(selected);
  if (hasBig) {
    switchPage(3, 2);
  } else {
    switchPage(3, 1);
  }
});

next3Btn.addEventListener('click', async () => {
  if (isNavigating) return;
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasOthers = hasOtherItems(selected);
  if (hasOthers) {
    switchPage(3, 5);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.others.includes(knife) && !state[knife]) {
        await initializeKnife(knife);
      }
    }
  } else {
    switchPage(3, 4);
    await generatePreviews();
  }
});

back4Btn.addEventListener('click', () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasOthers = hasOtherItems(selected);
  const hasSmall = hasSmallKnives(selected);
  const hasBig = hasBigKnives(selected);
  if (hasOthers) {
    switchPage(4, 5);
  } else if (hasSmall) {
    switchPage(4, 3);
  } else if (hasBig) {
    switchPage(4, 2);
  } else {
    switchPage(4, 1);
  }
});

back5Btn.addEventListener('click', () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasSmall = hasSmallKnives(selected);
  const hasBig = hasBigKnives(selected);
  if (hasSmall) {
    switchPage(5, 3);
  } else if (hasBig) {
    switchPage(5, 2);
  } else {
    switchPage(5, 1);
  }
});

next5Btn.addEventListener('click', async () => {
  if (isNavigating) return;
  switchPage(5, 4);
  await generatePreviews();
});

document.addEventListener('click', e => {
  if (e.target.id === 'edit-zone' || e.target.closest('#edit-zone')) {
    debounceToggle(toggleEditZone, 'edit-zone', 'vignette')();
  } else if (e.target.id === 'resize-controls' || e.target.closest('#resize-controls')) {
    debounceToggle(toggleResizeControls, 'resize-controls', 'format_shapes')();
  } else if (e.target.id === 'sync-fonts' || e.target.closest('#sync-fonts')) {
    debounceToggle(toggleSyncFonts, 'sync-fonts', 'format_size')();
  } else if (e.target.id === 'auto-align' || e.target.closest('#auto-align')) {
    const activePage = Object.keys(pages).find(p => pages[p].classList.contains('active'));
    if (activePage === '5') return; // Skip auto-align on page 5
    const knife = activePage === '2' ? Object.keys(state).find(k => knives.big.includes(k)) :
                  activePage === '3' ? Object.keys(state).find(k => knives.small.includes(k)) :
                  activePage === '5' ? Object.keys(state).find(k => knives.others.includes(k)) : null;
    if (knife) {
      debounceToggle(() => toggleAlignment(knife), 'auto-align', 'recenter')();
    }
  }
});

async function initializeKnife(knife) {
  createCanvasSection(knife);
  const s = state[knife];
  s.overlayEl.style.visibility = 'visible';
  s.img = await loadImage(
    productPicker.querySelector(`input[data-name="${knife}"]`).value
  );
  try {
    s.overlay = await loadImage(`${knife}-overlay.png`);
  } catch (e) {
    console.warn(`Overlay image for ${knife} not found`);
    s.overlay = null;
  }
  s.full.width = s.img.naturalWidth;
  s.full.height = s.img.naturalHeight;
  s.textRightX = s.full.width / 2;
  s.pos.y = s.full.height / 2;
  s.cacheCanvas.width = s.full.width;
  s.cacheCanvas.height = s.full.height;
  s.textCacheCanvas.width = s.full.width;
  s.textCacheCanvas.height = s.full.height;
  s.previewCanvas.width = s.full.width;
  s.previewCanvas.height = s.full.height;
  fitInBox(s.view, s.img, s.wrapper);
  const isBigKnife = knives.big.includes(knife);
  const isSmallKnife = knives.small.includes(knife);
  const isOtherItem = knives.others.includes(knife);
  
  // Set initial font family and weight
  let initialFont = lastBigKnifeFont;
  let initialWeight = '400';
  if (isSmallKnife || isOtherItem) {
    // Inherit from last adjusted big or small knife
    if (lastAdjusted.big && state[lastAdjusted.big]) {
      initialFont = state[lastAdjusted.big].fontSel.value;
      initialWeight = state[lastAdjusted.big].weightSel.value;
    } else if (lastAdjusted.small && state[lastAdjusted.small] && isSmallKnife) {
      initialFont = state[lastAdjusted.small].fontSel.value;
      initialWeight = state[lastAdjusted.small].weightSel.value;
    } else {
      // Default font based on language
      initialFont = currentLang === 'zh-hk' ? "'Noto Sans HK',sans-serif" : "Montserrat";
      initialWeight = '400';
    }
  } else {
    initialFont = isBigKnife ? lastBigKnifeFont : (currentLang === 'zh-hk' ? "'Noto Sans HK',sans-serif" : "Montserrat");
  }
  s.fontSel.value = initialFont;
  s.weightSel.value = initialWeight;
  s.baseDims = { w: 0, h: s.baseFont };

  if (sameContent && sharedText) {
    s.textInput.value = sharedText;
    s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value);
  }

  await document.fonts.load(`${s.weightSel.value} ${s.baseFont}px ${s.fontSel.value}`);
  if (s.textInput.value) {
    s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value);
  }
  s.overlayEl.style.visibility = 'hidden';
  if (!s.pendingDraw) {
    s.pendingDraw = true;
    requestAnimationFrame(() => draw(knife));
  }

  s.textInput.addEventListener('input', () => {
    if (sameContent) {
      sharedText = s.textInput.value;
      Object.keys(state).forEach(k => {
        state[k].textInput.value = sharedText;
        state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value);
        invalidateTextCache(k);
        if (!state[k].pendingDraw) {
          state[k].pendingDraw = true;
          requestAnimationFrame(() => draw(k));
        }
      });
    } else {
      s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value);
      invalidateTextCache(knife);
      if (!s.pendingDraw) {
        s.pendingDraw = true;
        requestAnimationFrame(() => draw(knife));
      }
    }
    lastAdjusted[knives.big.includes(knife) ? 'big' : knives.small.includes(knife) ? 'small' : 'others'] = knife;
  });

  s.weightSel.addEventListener('input', () => {
    const fontString = `${s.weightSel.value} ${s.baseFont}px ${s.fontSel.value}`;
    document.fonts.load(fontString).then(() => {
      s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
      invalidateTextCache(knife);
      if (!s.pendingDraw) {
        s.pendingDraw = true;
        requestAnimationFrame(() => draw(knife));
      }
      if (!isOtherItem) { // Skip sync for others
        syncFontAndText(knife);
      }
      lastAdjusted[knives.big.includes(knife) ? 'big' : knives.small.includes(knife) ? 'small' : 'others'] = knife;
    }).catch(err => {
      console.warn(`Failed to load font: ${fontString}`, err);
      s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
      invalidateTextCache(knife);
      if (!s.pendingDraw) {
        s.pendingDraw = true;
        requestAnimationFrame(() => draw(knife));
      }
    });
  });

  s.fontSel.addEventListener('input', () => {
    document.fonts.load(`${s.baseFont}px ${s.fontSel.value}`).then(() => {
      s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value);
      invalidateTextCache(knife);
      if (!s.pendingDraw) {
        s.pendingDraw = true;
        requestAnimationFrame(() => draw(knife));
      }
      if (!isOtherItem) { // Skip sync for others
        syncFontAndText(knife);
      }
      lastAdjusted[knives.big.includes(knife) ? 'big' : knives.small.includes(knife) ? 'small' : 'others'] = knife;
    });
  });

  if (s.sameContentChk) {
    s.sameContentChk.addEventListener('change', () => {
      sameContent = s.sameContentChk.checked;
      if (sameContent) {
        sharedText = s.textInput.value;
        Object.keys(state).forEach(k => {
          state[k].textInput.value = sharedText;
          state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value);
          invalidateTextCache(k);
          if (!state[k].pendingDraw) {
            state[k].pendingDraw = true;
            requestAnimationFrame(() => draw(k));
          }
        });
      } else {
        sharedText = '';
      }
    });
  }

  s.view.addEventListener('pointerdown', e => {
    const f = toFullCoords(s.view, s, e.clientX, e.clientY);
    if (!hitTest(f.x, f.y, s.pos.y, s.baseDims, s.textScale, s.textRightX) || s.resizing) return;
    s.dragging = true;
    s.dragStart = { id: e.pointerId, dx: f.x - s.textRightX, dy: f.y - s.pos.y };
    e.preventDefault();
  });

  window.addEventListener('pointermove', e => {
    if (!s.dragging || e.pointerId !== s.dragStart.id) return;
    const f = toFullCoords(s.view, s, e.clientX, e.clientY);
    s.textRightX = f.x - s.dragStart.dx;
    s.pos.y = f.y - s.dragStart.dy;
    const isBigKnife = knives.big.includes(knife);
    const isSmallKnife = knives.small.includes(knife);
    const isOtherItem = knives.others.includes(knife);
    const alignRight = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;
    if (alignRight) {
      Object.keys(state).forEach(k => {
        if (k !== knife && ((isBigKnife && knives.big.includes(k)) || 
                            (isSmallKnife && knives.small.includes(k)) || 
                            (isOtherItem && knives.others.includes(k)))) {
          state[k].textRightX = s.textRightX;
          state[k].pos.y = s.pos.y;
          invalidateTextCache(k);
          if (!state[k].pendingDraw) {
            state[k].pendingDraw = true;
            requestAnimationFrame(() => draw(k));
          }
        }
      });
    }
    invalidateTextCache(knife);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
    lastAdjusted[knives.big.includes(knife) ? 'big' : knives.small.includes(knife) ? 'small' : 'others'] = knife;
  });

  ['pointerup', 'pointercancel'].forEach(evt =>
    window.addEventListener(evt, e => {
      if (e.pointerId === s.dragStart.id) {
        s.dragging = false;
      }
    })
  );

  s.bbox.querySelectorAll('.handle').forEach(h => {
    h.addEventListener('pointerdown', e => {
      e.stopPropagation();
      s.resizing = true;
      const handle = h.dataset.handle;
      const box = s.bbox.getBoundingClientRect();
      let anchorX, anchorY;
      if (handle === 'se') {
        anchorX = toFullCoords(s.view, s, box.left, box.top).x;
        anchorY = toFullCoords(s.view, s, box.left, box.top).y;
      } else if (handle === 'nw') {
        anchorX = toFullCoords(s.view, s, box.right, box.bottom).x;
        anchorY = toFullCoords(s.view, s, box.right, box.bottom).y;
      } else if (handle === 'ne') {
        anchorX = toFullCoords(s.view, s, box.left, box.bottom).x;
        anchorY = toFullCoords(s.view, s, box.left, box.bottom).y;
      } else if (handle === 'sw') {
        anchorX = toFullCoords(s.view, s, box.right, box.top).x;
        anchorY = toFullCoords(s.view, s, box.right, box.top).y;
      }
      const p0 = toFullCoords(s.view, s, e.clientX, e.clientY);
      s.resizeStart = {
        id: e.pointerId,
        anchorX,
        anchorY,
        scale: s.textScale,
        textRightX: s.textRightX,
        posY: s.pos.y,
        handle
      };
    });
  });

  window.addEventListener('pointermove', e => {
    if (!s.resizing || e.pointerId !== s.resizeStart.id) return;
    const p = toFullCoords(s.view, s, e.clientX, e.clientY);
    const isBigKnife = knives.big.includes(knife);
    const isSmallKnife = knives.small.includes(knife);
    const isOtherItem = knives.others.includes(knife);
    const alignRight = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;
    let newScale;
    if (s.resizeStart.handle === 'se') {
      const dx = Math.abs(p.x - s.resizeStart.anchorX);
      const dy = Math.abs(p.y - s.resizeStart.anchorY);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h) || s.resizeStart.scale;
      s.textRightX = s.resizeStart.anchorX + s.baseDims.w * newScale;
      s.pos.y = s.resizeStart.anchorY;
    } else if (s.resizeStart.handle === 'nw') {
      const dx = Math.abs(s.resizeStart.anchorX - p.x);
      const dy = Math.abs(s.resizeStart.anchorY - p.y);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h) || s.resizeStart.scale;
      s.textRightX = s.resizeStart.anchorX;
      s.pos.y = s.resizeStart.anchorY - s.baseDims.h * newScale;
    } else if (s.resizeStart.handle === 'ne') {
      const dx = Math.abs(p.x - s.resizeStart.anchorX);
      const dy = Math.abs(p.y - s.resizeStart.anchorY);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h) || s.resizeStart.scale;
      s.textRightX = s.resizeStart.anchorX + s.baseDims.w * newScale;
      s.pos.y = s.resizeStart.anchorY - s.baseDims.h * newScale;
    } else if (s.resizeStart.handle === 'sw') {
      const dx = Math.abs(s.resizeStart.anchorX - p.x);
      const dy = Math.abs(p.y - s.resizeStart.anchorY);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h) || s.resizeStart.scale;
      s.textRightX = s.resizeStart.anchorX;
      s.pos.y = s.resizeStart.anchorY;
    }
    s.textScale = newScale;
    if (alignRight) {
      Object.keys(state).forEach(k => {
        if (k !== knife && ((isBigKnife && knives.big.includes(k)) || 
                            (isSmallKnife && knives.small.includes(k)) || 
                            (isOtherItem && knives.others.includes(k)))) {
          state[k].textRightX = s.textRightX;
          state[k].pos.y = s.pos.y;
          if (syncFonts) {
            state[k].baseFont = s.baseFont * s.textScale;
            state[k].textScale = 1;
            state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value);
          }
          invalidateTextCache(k);
          if (!state[k].pendingDraw) {
            state[k].pendingDraw = true;
            requestAnimationFrame(() => draw(k));
          }
        }
      });
    }
    if (syncFonts) {
      syncFontAndText(knife);
    }
    invalidateTextCache(knife);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
    lastAdjusted[knives.big.includes(knife) ? 'big' : knives.small.includes(knife) ? 'small' : 'others'] = knife;
  });

  ['pointerup', 'pointercancel'].forEach(evt =>
    window.addEventListener(evt, e => {
      if (e.pointerId === s.resizeStart.id) {
        s.resizing = false;
      }
    })
  );

  s.view.addEventListener('pointerdown', e => {
    if (Object.keys(s.pointers).length >= 2) return;
    s.pointers[e.pointerId] = toFullCoords(s.view, s, e.clientX, e.clientY);
    if (Object.keys(s.pointers).length === 2) {
      const [p1, p2] = Object.values(s.pointers);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      s.pinch = true;
      s.pinchStart = {
        cx: (p1.x + p2.x) / 2,
        cy: (p1.y + p2.y) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
        scale: s.textScale,
        textRightX: s.textRightX,
        posY: s.pos.y
      };
    }
  });

  window.addEventListener('pointermove', e => {
    if (!s.pinch || !s.pointers[e.pointerId]) return;
    s.pointers[e.pointerId] = toFullCoords(s.view, s, e.clientX, e.clientY);
    const [p1, p2] = Object.values(s.pointers);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const isBigKnife = knives.big.includes(knife);
    const isSmallKnife = knives.small.includes(knife);
    const isOtherItem = knives.others.includes(knife);
    const alignRight = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;
    s.textScale = s.pinchStart.scale * (dist / s.pinchStart.dist) || s.pinchStart.scale;
    s.textRightX = s.pinchStart.textRightX + (cx - s.pinchStart.cx);
    s.pos.y = s.pinchStart.posY + (cy - s.pinchStart.cy);
    if (alignRight) {
      Object.keys(state).forEach(k => {
        if (k !== knife && ((isBigKnife && knives.big.includes(k)) || 
                            (isSmallKnife && knives.small.includes(k)) || 
                            (isOtherItem && knives.others.includes(k)))) {
          state[k].textRightX = s.textRightX;
          state[k].pos.y = s.pos.y;
          if (syncFonts) {
            state[k].baseFont = s.baseFont * s.textScale;
            state[k].textScale = 1;
            state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value);
          }
          invalidateTextCache(k);
          if (!state[k].pendingDraw) {
            state[k].pendingDraw = true;
            requestAnimationFrame(() => draw(k));
          }
        }
      });
    }
    if (syncFonts) {
      syncFontAndText(knife);
    }
    invalidateTextCache(knife);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
    lastAdjusted[knives.big.includes(knife) ? 'big' : knives.small.includes(knife) ? 'small' : 'others'] = knife;
  });

  ['pointerup', 'pointercancel'].forEach(evt =>
    window.addEventListener(evt, e => {
      if (s.pointers[e.pointerId]) {
        delete s.pointers[e.pointerId];
        if (Object.keys(s.pointers).length < 2) {
          s.pinch = false;
        }
      }
    })
  );

  window.addEventListener('resize', () => {
    fitInBox(s.view, s.img, s.wrapper);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
  });
}

downloadBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  for (const knife of Object.keys(state)) {
    const s = state[knife];
    const folder = zip.folder(knife);
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
    folder.file(`${knife}-preview.png`, previewUrl.split(',')[1], { base64: true });

    const textCanvas = document.createElement('canvas');
    textCanvas.width = s.full.width;
    textCanvas.height = s.full.height;
    const textCtx = textCanvas.getContext('2d');
    textCtx.fillStyle = '#fff';
    textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);
    if (s.textInput.value) {
      textCtx.font = `${s.weightSel.value} ${s.baseFont * s.textScale}px ${s.fontSel.value}`; 
      textCtx.fillStyle = '#000';
      textCtx.textBaseline = 'top';
      textCtx.textAlign = 'right';
      textCtx.fillText(s.textInput.value, s.textRightX, s.pos.y);
    }
    const textUrl = textCanvas.toDataURL('image/png');
    folder.file(`${knife}-text.png`, textUrl.split(',')[1], { base64: true });
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'custom-knives.zip';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.addEventListener('DOMContentLoaded', () => {
  updateLanguage(currentLang);
  const activePage = Object.keys(pages).find(p => pages[p].classList.contains('active'));
  console.log(`DOMContentLoaded: active page=${activePage}`);
  document.querySelectorAll('#edit-zone').forEach(btn => {
    btn.classList.toggle('off', !showEditZone);
  });
  document.querySelectorAll('#resize-controls').forEach(btn => {
    btn.classList.toggle('off', !showResizeControls);
  });
  document.querySelectorAll('#sync-fonts').forEach(btn => {
    btn.classList.toggle('off', !syncFonts);
    // btn.style.setProperty('display', '', 'important'); // Always visible
    // console.log(`DOMContentLoaded: Set sync-fonts display='' for ID=${btn.id}`);
  });
  document.querySelectorAll('#auto-align').forEach(btn => {
    const isPage5 = activePage === '5' || pages[5].classList.contains('active');
    btn.style.setProperty('display', isPage5 ? 'none' : '', 'important');
    console.log(`DOMContentLoaded: Set auto-align display=${isPage5 ? 'none' : ''} for ID=${btn.id}`);
    if (!isPage5) {
      btn.classList.toggle('off', pages[2].classList.contains('active') ? !alignRightBig : pages[3].classList.contains('active') ? !alignRightSmall : !alignRightOthers);
    }
  });
});

function updateProgressSection() {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasBig = hasBigKnives(selected);
  const hasSmall = hasSmallKnives(selected);
  const hasOthers = hasOtherItems(selected);
  const activePage = Object.keys(pages).find(p => pages[p].classList.contains('active'));

  const steps = [];
  let stepNumber = 1;

  if (hasBig) {
    steps.push({ id: '2', label: stepNumber++ });
  }
  if (hasSmall) {
    steps.push({ id: '3', label: stepNumber++ });
  }
  if (hasOthers) {
    steps.push({ id: '5', label: stepNumber++ });
  }
  steps.push({ id: '4', label: '', icon: 'preview', isPreview: true });

  const progressSections = document.querySelectorAll('#progress-section');
  progressSections.forEach(section => {
    section.innerHTML = steps
      .map((step, index) => `
        <div class="progress-step ${step.id === activePage ? 'active' : ''} ${step.isPreview ? 'preview' : ''}">
          ${step.icon ? `<span class="material-symbols-outlined">${step.icon}</span>` : step.label}
        </div>
        ${index < steps.length - 1 ? '<span class="progress-separator">-</span>' : ''}
      `)
      .join('');
  });
}
