/* MAIN ENTRY POINT */

document.addEventListener('DOMContentLoaded', async () => {
    const savedState = loadAppState();

    if (savedState && savedState.version === 1) {
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

        document.querySelectorAll('#edit-zone').forEach(btn => 
            btn.classList.toggle('off', !showEditZone));
        document.querySelectorAll('#resize-controls').forEach(btn => 
            btn.classList.toggle('off', !showResizeControls));
        document.querySelectorAll('#sync-fonts').forEach(btn => 
            btn.classList.toggle('off', !syncFonts));

        updateLanguage(currentLang);

        const checkboxes = productPicker.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = savedState.selectedKnives.includes(cb.dataset.name);
        });

        // Restore sections
        for (const knife of Object.keys(savedState.knives || {})) {
            await initializeKnife(knife);
            
            // Re-fetch state after await to ensure it exists
            const s = state[knife];
            const data = savedState.knives[knife];
            
            if (s && data) {
                s.textInput.value = data.text || '';
                s.fontSel.value = data.font || (currentLang === 'zh-hk' ? "'中文預設',sans-serif" : "Default',sans-serif");
                s.weightSel.value = data.weight || "400";
                s.baseFont = data.baseFont || s.baseFont;
                s.textScale = data.textScale || 1;
                s.textRightX = data.textRightX || 0;
                s.pos.y = data.posY || 0;
                
                // Ensure font is loaded before measuring
                const fontStr = `${s.weightSel.value} ${s.baseFont}px ${s.fontSel.value}`;
                try { await document.fonts.load(fontStr); } catch(e) {}
                
                s.baseDims = measureText(s.fCtx, s.textInput.value, s.baseFont, s.fontSel.value, s.weightSel.value);
                invalidateTextCache(knife);
                draw(knife);
            }
        }

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

    // Language toggle handler
    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'en' ? 'zh-hk' : 'en';
            updateLanguage(newLang);
            // Optional: Re-render canvases if language change affects them (e.g., font defaults)
            Object.keys(state).forEach(knife => {
                if (state[knife]) {
                    invalidateTextCache(knife);
                    draw(knife);
                }
            });
        });
    }

    function updateNext1Button() {
      const anySelected = productPicker.querySelector('input[type="checkbox"]:checked') !== null;
      const next1Btn = document.getElementById('next-1');
      
      if (next1Btn) {
        next1Btn.classList.toggle('off', !anySelected);
      }
    }
    
    // Attach listeners to all checkboxes
    productPicker.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateNext1Button);
    });
    
    // Run immediately on load (handles saved/restored selections)
    updateNext1Button();
});

window.addEventListener('resize', () => {
  Object.keys(state).forEach(knife => {
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

document.getElementById('download-all').addEventListener('click', async () => {
  const zip = new JSZip();
  
  // Scale factor 
  const PPI_SCALE = 2;

  for (const knife of Object.keys(state)) {
    const s = state[knife];
    const folder = zip.folder(knife);
    
    // --- 1. Preview Image (Original Resolution) ---
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

    // --- 2. Text-Only Image (Scaled to 300 PPI) ---
    const textCanvas = document.createElement('canvas');
    // Scale canvas dimensions
    textCanvas.width = s.full.width * PPI_SCALE;
    textCanvas.height = s.full.height * PPI_SCALE;
    const textCtx = textCanvas.getContext('2d');
    
    textCtx.fillStyle = '#fff';
    textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);
    
    if (s.textInput.value) {
      // Scale font size
      const scaledFontSize = s.baseFont * s.textScale * PPI_SCALE;
      textCtx.font = `${s.weightSel.value} ${scaledFontSize}px ${s.fontSel.value}`; 
      textCtx.fillStyle = '#000';
      textCtx.textBaseline = 'top';
      textCtx.textAlign = 'right';
      
      // Scale coordinates
      textCtx.fillText(s.textInput.value, s.textRightX * PPI_SCALE, s.pos.y * PPI_SCALE);
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
