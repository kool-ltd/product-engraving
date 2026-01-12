import { appConfig, elements } from './state.js';
import { KNIVES } from './constants.js';

export function updateProgressSection() {
  const selected = Array.from(elements.productPicker.querySelectorAll('input:checked'));
  const hasBig = selected.some(input => KNIVES.big.includes(input.dataset.name));
  const hasSmall = selected.some(input => KNIVES.small.includes(input.dataset.name));
  const hasOthers = selected.some(input => KNIVES.others.includes(input.dataset.name));
  const activePage = Object.keys(elements.pages).find(p => elements.pages[p].classList.contains('active'));

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

export function switchPage(from, to) {
  if (appConfig.isNavigating) return;
  appConfig.isNavigating = true;

  elements.pages[from].classList.remove('active');
  elements.pages[to].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const isPage5 = String(to) === '5';
  document.querySelectorAll('#auto-align').forEach(btn => {
    btn.style.setProperty('display', isPage5 ? 'none' : '', 'important');
  });

  setTimeout(() => { 
    appConfig.isNavigating = false;
    updateProgressSection();
  }, 100);
}