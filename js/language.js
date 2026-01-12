import { appConfig, elements, state } from './state.js';
// Note: translations is assumed to be globally available from translations.js
// or you can import it if converted to a module.

export function updateLanguage(lang) {
  appConfig.currentLang = lang;
  document.documentElement.lang = lang;
  
  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.textContent = lang === 'en' ? translations['zh-hk'].chinese : translations.en.english;
  }

  document.getElementById('title').textContent = translations[lang].title;
  const subtitle = document.getElementById('subtitle');
  subtitle.innerHTML = `${translations[lang].subtitle} <img src="/images/kool-logo.png" alt="logo" style="width:50px;vertical-align:bottom;"> ${translations[lang].subtitleAfter}`;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = translations[lang][key];
      } else if (!el.id.match(/^(back|next|edit-zone|resize-controls|sync-fonts|auto-align|download-all)/)) {
        el.innerHTML = translations[lang][key];
      }
    }
  });

  document.getElementById('alert-close').textContent = translations[lang].close;

  // Re-render sections if they exist
  if (elements.pages[4].classList.contains('active')) {
    // This will be called from main.js to avoid circular dependency
  }
}