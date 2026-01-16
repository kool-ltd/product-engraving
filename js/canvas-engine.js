/* CANVAS ENGINE */
function createCanvasSection(knife) {
  if (state[knife] && document.getElementById(`wrapper-${knife}`)) return;

  const showSameContent = knife === firstSelectedKnife;
  const section = document.createElement('div');
  section.className = 'knife-section';

  const headerKey = knives.big.includes(knife) || knives.small.includes(knife) ? knife + 'Knife' : knife;

  section.innerHTML = `
    <h3 data-i18n="${headerKey}">${translations[currentLang][headerKey]}</h3>
    <div class="controls">
      <div>
        <label for="text-${knife}" data-i18n="textLabel">${translations[currentLang].textLabel}</label>
        <input type="text" id="text-${knife}" placeholder="${translations[currentLang].textPlaceholder}">
      </div>
      <div>
        <label for="font-${knife}" data-i18n="fontLabel">${translations[currentLang].fontLabel}</label>
        <select id="font-${knife}" ${currentLang === 'zh-hk' ? 'data-default="Noto Sans HK"' : ''}>
          <optgroup label="${translations[currentLang].english}" data-i18n="english">
            <option value="'Default',sans-serif">Default</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Roboto">Roboto</option>
            <option value="Caveat Brush">Caveat Brush</option>
            <option value="'Times New Roman',serif">Times New Roman</option>
            <option value="'Courier New',monospace">Courier New</option>
            <option value="Arial,sans-serif">Arial</option>
          </optgroup>
          <optgroup label="${translations[currentLang].chinese}" data-i18n="chinese">
            <option value="'中文預設',sans-serif">中文預設</option>
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
    fCtx: null, 
    wrapper: document.getElementById(`wrapper-${knife}`),
    overlayEl: document.getElementById(`overlay-${knife}`),
    bbox: document.getElementById(`bbox-${knife}`),
    textInput: document.getElementById(`text-${knife}`),
    fontSel: document.getElementById(`font-${knife}`),
    weightSel: document.getElementById(`weight-${knife}`), 
    sameContentChk: showSameContent ? document.getElementById(`same-content-${knife}`) : null,
    cacheCanvas: document.createElement('canvas'),
    cacheCtx: null,
    textCacheCanvas: document.createElement('canvas'),
    textCacheCtx: null,
    previewCanvas: document.createElement('canvas'),
    cacheValid: false,
    textCacheValid: false,
    pendingDraw: false
  };
  
  state[knife].fCtx = state[knife].full.getContext('2d');
  state[knife].cacheCtx = state[knife].cacheCanvas.getContext('2d');
  state[knife].textCacheCtx = state[knife].textCacheCanvas.getContext('2d');
}

function draw(knife) {
  const s = state[knife];
  // FIXED: Added safety check to ensure s exists and is fully loaded
  if (!s || !s.img || s.full.width === 0 || s.full.height === 0) return;

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
  if (state[knife]) state[knife].cacheValid = false;
}

function invalidateTextCache(knife) {
  if (state[knife]) state[knife].textCacheValid = false;
}

async function initializeKnife(knife) {
  if (!state[knife]) {
    createCanvasSection(knife);
  }
  const s = state[knife];
  s.overlayEl.style.visibility = 'visible';
  s.img = await loadImage(
    productPicker.querySelector(`input[data-name="${knife}"]`).value
  );
  try {
    s.overlay = await loadImage(`./images/${knife}-overlay.png`);
  } catch (e) {
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
  
  let initialFont = lastBigKnifeFont;
  let initialWeight = '400';
  if (isSmallKnife || isOtherItem) {
    if (lastAdjusted.big && state[lastAdjusted.big]) {
      initialFont = state[lastAdjusted.big].fontSel.value;
      initialWeight = state[lastAdjusted.big].weightSel.value;
    } else {
      initialFont = currentLang === 'zh-hk' ? "'中文預設',sans-serif" : "'Default',sans-serif";
    }
  }
  s.fontSel.value = initialFont;
  s.weightSel.value = initialWeight;
  s.baseDims = { w: 0, h: s.baseFont };

  if (sameContent && sharedText) {
    s.textInput.value = sharedText;
  }

  const fontStr = `${s.weightSel.value} ${s.baseFont}px ${s.fontSel.value}`;
  try { await document.fonts.load(fontStr); } catch(e) {}
  
  if (s.textInput.value) {
    s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
  }
  
  s.overlayEl.style.visibility = 'hidden';
  if (!s.pendingDraw) {
    s.pendingDraw = true;
    requestAnimationFrame(() => draw(knife));
  }

  s.textInput.addEventListener('input', () => {
    lastAdjusted[isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others'] = knife;
    if (sameContent) {
      sharedText = s.textInput.value;
      Object.keys(state).forEach(k => {
        state[k].textInput.value = sharedText;
        state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value, state[k].weightSel.value);
        invalidateTextCache(k);
        if (!state[k].pendingDraw) {
          state[k].pendingDraw = true;
          requestAnimationFrame(() => draw(k));
        }
      });
    } else {
      s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
      invalidateTextCache(knife);
      if (!s.pendingDraw) {
        s.pendingDraw = true;
        requestAnimationFrame(() => draw(knife));
      }
    }
  });

  s.weightSel.addEventListener('input', async () => {
    lastAdjusted[isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others'] = knife;
    const fontString = `${s.weightSel.value} ${s.baseFont}px ${s.fontSel.value}`;
    try { await document.fonts.load(fontString); } catch(e) {}
    s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
    invalidateTextCache(knife);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
    syncFontAndText(knife);
  });

  s.fontSel.addEventListener('input', async () => {
    lastAdjusted[isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others'] = knife;
    const fontString = `${s.weightSel.value} ${s.baseFont}px ${s.fontSel.value}`;
    try { await document.fonts.load(fontString); } catch(e) {}
    s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
    invalidateTextCache(knife);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
    syncFontAndText(knife);
  });

  if (s.sameContentChk) {
    s.sameContentChk.addEventListener('change', () => {
      sameContent = s.sameContentChk.checked;
      if (sameContent) {
        sharedText = s.textInput.value;
        Object.keys(state).forEach(k => {
          state[k].textInput.value = sharedText;
          state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value, state[k].weightSel.value);
          invalidateTextCache(k);
          if (!state[k].pendingDraw) {
            state[k].pendingDraw = true;
            requestAnimationFrame(() => draw(k));
          }
        });
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
    lastAdjusted[isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others'] = knife;
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
  });

  ['pointerup', 'pointercancel'].forEach(evt =>
    window.addEventListener(evt, e => {
      if (e.pointerId === s.dragStart.id) s.dragging = false;
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
      s.resizeStart = { id: e.pointerId, anchorX, anchorY, scale: s.textScale, handle };
    });
  });

  window.addEventListener('pointermove', async e => {
    if (!s.resizing || e.pointerId !== s.resizeStart.id) return;
    const p = toFullCoords(s.view, s, e.clientX, e.clientY);
    let newScale = s.textScale;
    if (s.resizeStart.handle === 'se') {
      const dx = Math.abs(p.x - s.resizeStart.anchorX);
      const dy = Math.abs(p.y - s.resizeStart.anchorY);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h);
      s.textRightX = s.resizeStart.anchorX + s.baseDims.w * newScale;
      s.pos.y = s.resizeStart.anchorY;
    } else if (s.resizeStart.handle === 'nw') {
      const dx = Math.abs(s.resizeStart.anchorX - p.x);
      const dy = Math.abs(s.resizeStart.anchorY - p.y);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h);
      s.textRightX = s.resizeStart.anchorX;
      s.pos.y = s.resizeStart.anchorY - s.baseDims.h * newScale;
    } else if (s.resizeStart.handle === 'ne') {
      const dx = Math.abs(p.x - s.resizeStart.anchorX);
      const dy = Math.abs(p.y - s.resizeStart.anchorY);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h);
      s.textRightX = s.resizeStart.anchorX + s.baseDims.w * newScale;
      s.pos.y = s.resizeStart.anchorY - s.baseDims.h * newScale;
    } else if (s.resizeStart.handle === 'sw') {
      const dx = Math.abs(s.resizeStart.anchorX - p.x);
      const dy = Math.abs(s.resizeStart.anchorY - p.y);
      newScale = Math.max(dx / s.baseDims.w, dy / s.baseDims.h);
      s.textRightX = s.resizeStart.anchorX;
      s.pos.y = s.resizeStart.anchorY;
    }
    s.textScale = newScale;
    lastAdjusted[isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others'] = knife;
    
    if (syncFonts) {
      await syncFontAndText(knife);
    } else {
      invalidateTextCache(knife);
      if (!s.pendingDraw) {
        s.pendingDraw = true;
        requestAnimationFrame(() => draw(knife));
      }
    }
  });

  ['pointerup', 'pointercancel'].forEach(evt =>
    window.addEventListener(evt, e => {
      if (e.pointerId === s.resizeStart.id) {
        s.resizing = false;
        saveAppState();
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
    const dist = Math.hypot(dx, dy);           // ← cleaner & more precise
  
    if (dist < 1) return;                      // safety against zero/near-zero
  
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
  
    const isBigKnife = knives.big.includes(knife);
    const isSmallKnife = knives.small.includes(knife);
    const isOtherItem = knives.others.includes(knife);
    const alignRight = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;
  
    // ────────────────────── Main change: controlled scaling ──────────────────────
    const rawRatio = dist / s.pinchStart.dist;
    
    // Option A – Most recommended: simple power curve (very natural feel)
    const sensitivity = 0.55;   // 0.45 = slower, 0.6 = a bit faster, 0.7 = close to original
    const newScale = s.pinchStart.scale * Math.pow(rawRatio, sensitivity);
  
    // Option B – Alternative if you prefer linear but capped speed
    // const newScale = s.pinchStart.scale * Math.min(1.8, Math.max(0.6, rawRatio)); // cap per gesture
  
    s.textScale = newScale;
  
    // Panning – optional mild damping (usually not needed, but helps if movement feels too quick)
    const panDamping = 0.92;   // 1.0 = original, 0.8 = noticeably slower pan
    s.textRightX = s.pinchStart.textRightX + (cx - s.pinchStart.cx) * panDamping;
    s.pos.y = s.pinchStart.posY + (cy - s.pinchStart.cy) * panDamping;
  
    // ──────────────────────────────────────────────────────────────────────────────
  
    if (alignRight) {
      Object.keys(state).forEach(k => {
        if (k !== knife && (
          (isBigKnife && knives.big.includes(k)) ||
          (isSmallKnife && knives.small.includes(k)) ||
          (isOtherItem && knives.others.includes(k))
        )) {
          state[k].textRightX = s.textRightX;
          state[k].pos.y = s.pos.y;
          
          if (syncFonts) {
            state[k].baseFont = s.baseFont * s.textScale;
            state[k].textScale = 1;
            state[k].baseDims = measureText(
              state[k].fCtx,
              state[k].textInput.value,
              state[k].baseFont,
              state[k].fontSel.value
            );
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
      // Better: throttle sync to avoid lag/jank during fast pinch
      if (!s.pendingSync) {
        s.pendingSync = true;
        requestAnimationFrame(async () => {
          await syncFontAndText(knife);
          s.pendingSync = false;
        });
      }
    }
  
    invalidateTextCache(knife);
    if (!s.pendingDraw) {
      s.pendingDraw = true;
      requestAnimationFrame(() => draw(knife));
    }
  
    lastAdjusted[isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others'] = knife;
  });

  ['pointerup', 'pointercancel'].forEach(evt =>
    window.addEventListener(evt, e => {
      if (s.pointers[e.pointerId]) {
        delete s.pointers[e.pointerId];
        if (Object.keys(s.pointers).length < 2) {
          s.pinch = false;
          saveAppState();
        }
      }
    })
  );
}
