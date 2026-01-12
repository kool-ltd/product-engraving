/* js/main.js */
import { appState, resetCanvasState } from './state.js';
import { updateLanguage, createCanvasSection, switchPage } from './ui.js';
import { initGlobalEvents, initializeKnifeLogic } from './events.js';
import { hasBigKnives, hasSmallKnives, hasOtherItems } from './utils.js';
import { KNIVES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial Setup
  updateLanguage(appState.currentLang);
  initGlobalEvents();

  // 2. Navigation: Page 1 -> Next (Selection to First Content Page)
  const next1Btn = document.getElementById('next-1');
  next1Btn.addEventListener('click', async () => {
    const productPicker = document.getElementById('product-picker');
    const selected = Array.from(productPicker.querySelectorAll('input:checked'));
    
    if (selected.length === 0) {
      alert(appState.currentLang === 'en' ? "Please select at least one product." : "請至少選擇一件產品。");
      return;
    }

    // Reset state and clear UI containers for a fresh start
    resetCanvasState();
    document.getElementById('big-knife-content').innerHTML = '';
    document.getElementById('small-knife-content').innerHTML = '';
    document.getElementById('other-content').innerHTML = '';

    appState.firstSelectedKnife = selected[0].dataset.name;

    // Determine the first destination based on priority: Big -> Small -> Others
    if (hasBigKnives(selected)) {
      switchPage(1, 2);
      for (const input of selected) {
        if (KNIVES.big.includes(input.dataset.name)) {
          createCanvasSection(input.dataset.name);
          await initializeKnifeLogic(input.dataset.name);
        }
      }
    } else if (hasSmallKnives(selected)) {
      switchPage(1, 3);
      for (const input of selected) {
        if (KNIVES.small.includes(input.dataset.name)) {
          createCanvasSection(input.dataset.name);
          await initializeKnifeLogic(input.dataset.name);
        }
      }
    } else {
      switchPage(1, 5);
      for (const input of selected) {
        if (KNIVES.others.includes(input.dataset.name)) {
          createCanvasSection(input.dataset.name);
          await initializeKnifeLogic(input.dataset.name);
        }
      }
    }
  });

  // 3. Navigation: Page 2 -> Next (Big Knives to Small/Others/Preview)
  document.getElementById('next-2').addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('#product-picker input:checked'));
    
    if (hasSmallKnives(selected)) {
      switchPage(2, 3);
      const container = document.getElementById('small-knife-content');
      if (container.innerHTML === '') {
        for (const input of selected) {
          if (KNIVES.small.includes(input.dataset.name)) {
            createCanvasSection(input.dataset.name);
            await initializeKnifeLogic(input.dataset.name);
          }
        }
      }
    } else if (hasOtherItems(selected)) {
      switchPage(2, 5);
      const container = document.getElementById('other-content');
      if (container.innerHTML === '') {
        for (const input of selected) {
          if (KNIVES.others.includes(input.dataset.name)) {
            createCanvasSection(input.dataset.name);
            await initializeKnifeLogic(input.dataset.name);
          }
        }
      }
    } else {
      generatePreviewImages();
      switchPage(2, 4);
    }
  });

  // 4. Navigation: Page 3 -> Next (Small Knives to Others/Preview)
  document.getElementById('next-3').addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('#product-picker input:checked'));
    
    if (hasOtherItems(selected)) {
      switchPage(3, 5);
      const container = document.getElementById('other-content');
      if (container.innerHTML === '') {
        for (const input of selected) {
          if (KNIVES.others.includes(input.dataset.name)) {
            createCanvasSection(input.dataset.name);
            await initializeKnifeLogic(input.dataset.name);
          }
        }
      }
    } else {
      generatePreviewImages();
      switchPage(3, 4);
    }
  });

  // 5. Navigation: Page 5 -> Next (Others to Preview)
  document.getElementById('next-5').addEventListener('click', () => {
    generatePreviewImages();
    switchPage(5, 4);
  });

  // 6. Back Button Logic
  document.getElementById('back-2').addEventListener('click', () => switchPage(2, 1));
  
  document.getElementById('back-3').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('#product-picker input:checked'));
    hasBigKnives(selected) ? switchPage(3, 2) : switchPage(3, 1);
  });

  document.getElementById('back-5').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('#product-picker input:checked'));
    if (hasSmallKnives(selected)) switchPage(5, 3);
    else if (hasBigKnives(selected)) switchPage(5, 2);
    else switchPage(5, 1);
  });

  document.getElementById('back-4').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('#product-picker input:checked'));
    if (hasOtherItems(selected)) switchPage(4, 5);
    else if (hasSmallKnives(selected)) switchPage(4, 3);
    else switchPage(4, 2);
  });

  // 7. Final Export
  document.getElementById('download-all').addEventListener('click', () => {
    downloadAllAsZip(canvasState);
  });

  // Initial progress bar update
  updateProgressSection();
});
