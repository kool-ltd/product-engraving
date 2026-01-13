/* PAGE NAVIGATION */
function switchPage(from, to) {
  if (isNavigating) return;
  isNavigating = true;
  
  pages[from].classList.remove('active');
  pages[to].classList.add('active');
  
  // Fix for Issue #2: Recalculate canvas sizes once the page is visible
  requestAnimationFrame(() => {
    resizePageCanvases();
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  const isPage5 = String(to) === '5';
  document.querySelectorAll('#auto-align').forEach(btn => {
    btn.style.setProperty('display', isPage5 ? 'none' : '', 'important');
  });

  setTimeout(() => { 
    isNavigating = false;
    updateProgressSection();
  }, 100);
}

function resizePageCanvases() {
  Object.keys(state).forEach(knife => {
    const s = state[knife];
    // Only resize if the canvas is actually inside the currently active page
    if (s.wrapper.offsetParent !== null) { 
      fitInBox(s.view, s.img, s.wrapper);
      invalidateTextCache(knife);
      draw(knife);
    }
  });
}

function updateProgressSection() {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  const hasBig = hasBigKnives(selected);
  const hasSmall = hasSmallKnives(selected);
  const hasOthers = hasOtherItems(selected);
  const activePage = Object.keys(pages).find(p => pages[p].classList.contains('active'));

  const steps = [];
  let stepNumber = 1;
  if (hasBig) steps.push({ id: '2', label: stepNumber++ });
  if (hasSmall) steps.push({ id: '3', label: stepNumber++ });
  if (hasOthers) steps.push({ id: '5', label: stepNumber++ });
  steps.push({ id: '4', label: '', icon: 'preview', isPreview: true });

  document.querySelectorAll('#progress-section').forEach(section => {
    section.innerHTML = steps.map((step, index) => `
        <div class="progress-step ${step.id === activePage ? 'active' : ''} ${step.isPreview ? 'preview' : ''}">
          ${step.icon ? `<span class="material-symbols-outlined">${step.icon}</span>` : step.label}
        </div>
        ${index < steps.length - 1 ? '<span class="progress-separator">-</span>' : ''}
      `).join('');
  });
}

// Event Listeners for Navigation Buttons
document.getElementById('next-1').addEventListener('click', async () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  if (selected.length === 0) {
    document.getElementById('alert-message').textContent = translations[currentLang].noSelection;
    document.getElementById('alert-modal').style.display = 'flex';
    return;
  }
  bigKnifeContent.innerHTML = '';
  smallKnifeContent.innerHTML = '';
  otherContent.innerHTML = '';
  Object.keys(state).forEach(knife => delete state[knife]);
  firstSelectedKnife = selected[0].dataset.name;

  if (hasBigKnives(selected)) switchPage(1, 2);
  else if (hasSmallKnives(selected)) switchPage(1, 3);
  else if (hasOtherItems(selected)) switchPage(1, 5);

  for (const input of selected) {
    await initializeKnife(input.dataset.name);
  }
});

document.getElementById('back-2').addEventListener('click', () => switchPage(2, 1));
document.getElementById('next-2').addEventListener('click', async () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  if (hasSmallKnives(selected)) {
    switchPage(2, 3);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.small.includes(knife) && !state[knife]) await initializeKnife(knife);
    }
  } else if (hasOtherItems(selected)) {
    switchPage(2, 5);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.others.includes(knife) && !state[knife]) await initializeKnife(knife);
    }
  } else { switchPage(2, 4); generatePreviews(); }
});

document.getElementById('back-3').addEventListener('click', () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  hasBigKnives(selected) ? switchPage(3, 2) : switchPage(3, 1);
});

document.getElementById('next-3').addEventListener('click', async () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  if (hasOtherItems(selected)) {
    switchPage(3, 5);
    for (const input of selected) {
      const knife = input.dataset.name;
      if (knives.others.includes(knife) && !state[knife]) await initializeKnife(knife);
    }
  } else { switchPage(3, 4); generatePreviews(); }
});

document.getElementById('back-4').addEventListener('click', () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  if (hasOtherItems(selected)) switchPage(4, 5);
  else if (hasSmallKnives(selected)) switchPage(4, 3);
  else if (hasBigKnives(selected)) switchPage(4, 2);
  else switchPage(4, 1);
});

document.getElementById('back-5').addEventListener('click', () => {
  const selected = Array.from(productPicker.querySelectorAll('input:checked'));
  if (hasSmallKnives(selected)) switchPage(5, 3);
  else if (hasBigKnives(selected)) switchPage(5, 2);
  else switchPage(5, 1);
});

document.getElementById('next-5').addEventListener('click', () => { switchPage(5, 4); generatePreviews(); });

// Modal Close Logic
const alertModal = document.getElementById('alert-modal');
if (alertModal) {
  alertModal.addEventListener('click', (e) => {
    // Close if clicking the background (the modal itself) 
    // or the "Click anywhere to close" text
    alertModal.style.display = 'none';
  });
}
