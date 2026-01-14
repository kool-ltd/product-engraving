/* FEATURE CONTROLS */
async function syncFontAndText(knife) {
  if (!syncFonts) return;
  const refState = state[knife];
  const isBigKnife = knives.big.includes(knife);
  const isSmallKnife = knives.small.includes(knife);
  const isOtherItem = knives.others.includes(knife);

  const targetKnives = Object.keys(state).filter(k => 
    k !== knife && 
    ((isBigKnife && knives.big.includes(k)) || 
     (isSmallKnife && knives.small.includes(k)) || 
     (isOtherItem && knives.others.includes(k)))
  );

  for (const k of targetKnives) {
    state[k].fontSel.value = refState.fontSel.value;
    state[k].weightSel.value = refState.weightSel.value;
    
    // Normalize scale into baseFont
    state[k].baseFont = refState.baseFont * refState.textScale;
    state[k].textScale = 1;

    // CRITICAL: Wait for font to load at this specific size before measuring
    const fontStr = `${state[k].weightSel.value} ${state[k].baseFont}px ${state[k].fontSel.value}`;
    try {
      await document.fonts.load(fontStr);
    } catch(e) {}

    state[k].baseDims = measureText(state[k].fCtx, state[k].textInput.value, state[k].baseFont, state[k].fontSel.value, state[k].weightSel.value);
    invalidateTextCache(k);
    if (!state[k].pendingDraw) {
      state[k].pendingDraw = true;
      requestAnimationFrame(() => draw(k));
    }
  }
  
  if (isBigKnife) lastBigKnifeFont = refState.fontSel.value;
}

function debounceToggle(fn, id, icon) {
  return () => {
    const now = Date.now();
    if (now - lastToggleTime < toggleDebounce) return;
    lastToggleTime = now;
    fn();
    document.querySelectorAll(`#${id}`).forEach(btn => {
      btn.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
    });
  };
}

function toggleEditZone() {
  showEditZone = !showEditZone;
  Object.keys(state).forEach(k => { invalidateCache(k); draw(k); });
  document.querySelectorAll('#edit-zone').forEach(btn => btn.classList.toggle('off', !showEditZone));
}

function toggleResizeControls() {
  showResizeControls = !showResizeControls;
  Object.keys(state).forEach(k => { state[k].boxVisible = showResizeControls; draw(k); });
  document.querySelectorAll('#resize-controls').forEach(btn => btn.classList.toggle('off', !showResizeControls));
}

function toggleSyncFonts() {
  syncFonts = !syncFonts;
  if (syncFonts) {
    const big = lastAdjusted.big || Object.keys(state).find(k => knives.big.includes(k));
    const small = lastAdjusted.small || Object.keys(state).find(k => knives.small.includes(k));
    if (big) syncFontAndText(big);
    if (small) syncFontAndText(small);
  }
  document.querySelectorAll('#sync-fonts').forEach(btn => btn.classList.toggle('off', !syncFonts));
}

function toggleAlignment(knife) {
  const isBigKnife = knives.big.includes(knife);
  const isSmallKnife = knives.small.includes(knife);
  const isOtherItem = knives.others.includes(knife);
  const group = isBigKnife ? 'big' : isSmallKnife ? 'small' : 'others';
  let alignRight = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;

  if (alignRight) {
    Object.keys(state).forEach(k => {
      if ((isBigKnife && knives.big.includes(k)) || (isSmallKnife && knives.small.includes(k)) || (isOtherItem && knives.others.includes(k))) {
        storedPositions[group][k] = { textRightX: state[k].textRightX, y: state[k].pos.y };
      }
    });
    if (isBigKnife) alignRightBig = false;
    else if (isSmallKnife) alignRightSmall = false;
    else alignRightOthers = false;
  } else {
    if (isBigKnife || isSmallKnife) {
      const lastKnife = lastAdjusted[group] || knife;
      const refX = state[lastKnife].textRightX;
      const refY = state[lastKnife].pos.y;
      Object.keys(state).forEach(k => {
        if ((isBigKnife && knives.big.includes(k)) || (isSmallKnife && knives.small.includes(k))) {
          state[k].textRightX = refX;
          state[k].pos.y = refY;
          invalidateTextCache(k);
          draw(k);
        }
      });
      if (isBigKnife) alignRightBig = true;
      else if (isSmallKnife) alignRightSmall = true;
    }
  }

  document.querySelectorAll('#auto-align').forEach(btn => {
    const currentStatus = isBigKnife ? alignRightBig : isSmallKnife ? alignRightSmall : alignRightOthers;
    btn.classList.toggle('off', !currentStatus);
  });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.id === 'edit-zone') debounceToggle(toggleEditZone, 'edit-zone', 'vignette')();
  if (btn.id === 'resize-controls') debounceToggle(toggleResizeControls, 'resize-controls', 'format_shapes')();
  if (btn.id === 'sync-fonts') debounceToggle(toggleSyncFonts, 'sync-fonts', 'format_size')();
  if (btn.id === 'auto-align') {
    const activePage = Object.keys(pages).find(p => pages[p].classList.contains('active'));
    let knife;
    if (activePage === '2') knife = Object.keys(state).find(k => knives.big.includes(k));
    if (activePage === '3') knife = Object.keys(state).find(k => knives.small.includes(k));
    if (knife) debounceToggle(() => toggleAlignment(knife), 'auto-align', 'recenter')();
  }
});