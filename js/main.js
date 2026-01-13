/* MAIN ENTRY POINT */
document.addEventListener('DOMContentLoaded', () => {
  updateLanguage(currentLang);
  
  document.querySelectorAll('#edit-zone').forEach(btn => btn.classList.toggle('off', !showEditZone));
  document.querySelectorAll('#resize-controls').forEach(btn => btn.classList.toggle('off', !showResizeControls));
  document.querySelectorAll('#sync-fonts').forEach(btn => btn.classList.toggle('off', !syncFonts));
});

window.addEventListener('resize', () => {
  Object.keys(state).forEach(knife => {
    fitInBox(state[knife].view, state[knife].img, state[knife].wrapper);
    draw(knife);
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
    // ... (Paste the zip generation logic from script.js here)
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'custom-knives.zip';
  a.click();
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