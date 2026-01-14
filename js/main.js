/* MAIN ENTRY POINT */

document.addEventListener('DOMContentLoaded', async () => {
    // Try to restore saved state first
    const savedState = loadAppState();

    if (savedState && savedState.version === 1) {
        // Restore globals
        currentLang = savedState.currentLang || 'en';
        sameContent = savedState.sameContent ?? true;
        firstSelectedKnife = savedState.firstSelectedKnife;
        Object.assign(lastAdjusted, savedState.lastAdjusted);
        lastBigKnifeFont = savedState.lastBigKnifeFont;
        showEditZone = savedState.showEditZone ?? true;
        showResizeControls = savedState.showResizeControls ?? true;
        syncFonts = savedState.syncFonts ?? true;
        alignRightBig = savedState.alignRightBig ?? true;
        alignRightSmall = savedState.alignRightSmall ?? true;
        alignRightOthers = savedState.alignRightOthers ?? false;
        Object.assign(storedPositions, savedState.storedPositions || {});

        // Set UI toggles to match restored state
        document.querySelectorAll('#edit-zone').forEach(btn => 
            btn.classList.toggle('off', !showEditZone));
        document.querySelectorAll('#resize-controls').forEach(btn => 
            btn.classList.toggle('off', !showResizeControls));
        document.querySelectorAll('#sync-fonts').forEach(btn => 
            btn.classList.toggle('off', !syncFonts));

        // Restore language
        updateLanguage(currentLang);

        // Restore selected products
        const checkboxes = productPicker.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = savedState.selectedKnives.includes(cb.dataset.name);
        });

        // Create sections & restore values for saved knives
        for (const knife of Object.keys(savedState.knives || {})) {
            // FIXED: Changed 'iawait' to 'await'
            await initializeKnife(knife);

            const s = state[knife];
            const data = savedState.knives[knife];
            s.textInput.value = data.text || '';
            s.fontSel.value = data.font || (currentLang === 'zh-hk' ? "'Noto Sans HK',sans-serif" : "Montserrat");
            s.weightSel.value = data.weight || "400";
            s.textScale = data.textScale || 1;
            s.textRightX = data.textRightX || 0;
            s.pos.y = data.posY || 0;
            
            invalidateTextCache(knife);
            draw(knife);
        }

        // Show correct page
        const targetPage = savedState.currentPage || '1';
        switchPage(1, targetPage); 

        if (targetPage === '4') {
            generatePreviews();
        }
    } else {
      updateLanguage(currentLang);
      document.querySelectorAll('#edit-zone').forEach(btn => btn.classList.toggle('off', !showEditZone));
      document.querySelectorAll('#resize-controls').forEach(btn => btn.classList.toggle('off', !showResizeControls));
      document.querySelectorAll('#sync-fonts').forEach(btn => btn.classList.toggle('off', !syncFonts));
    }
});

window.addEventListener('resize', () => {
  Object.keys(state).forEach(knife => {
    // Added safety check for s.img
    const s = state[knife];
    if (s && s.img) {
      fitInBox(s.view, s.img, s.wrapper);
      draw(knife);
    }
  });
});

document.getElementById('alert-close').addEventListener('click', () => {
  document.getElementById('alert-modal').style.display = 'none';
});

// Download Logic
document.getElementById('download-all').addEventListener('click', async () => {
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
  
  clearAppState();
});

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