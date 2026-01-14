/* LANGUAGE LOGIC */
function updateLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  
  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.textContent = lang === 'en' ? translations['zh-hk'].chinese : translations.en.english;
  }

  document.getElementById('title').textContent = translations[lang].title;
  const subtitle = document.getElementById('subtitle');
  subtitle.innerHTML = `${translations[lang].subtitle} <img src="/images/kool-logo.png" alt="logo" style="width:50px;vertical-align:bottom;"> ${translations[lang].subtitleAfter}`;
  
  const excludedIds = ['back-2', 'back-3', 'back-4', 'edit-zone', 'resize-controls', 'sync-fonts', 'auto-align', 'next-1', 'next-2', 'next-3', 'download-all'];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = translations[lang][key];
    if (translation) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = translation;
      } else if (el.tagName === 'OPTGROUP') {
        el.label = translation;
      } else if (!excludedIds.includes(el.id)) {
        el.innerHTML = translation;
      }
    }
  });

  document.getElementById('alert-close').textContent = translations[lang].close;


  if (pages[4].classList.contains('active')) {
    generatePreviews();
  }
  saveAppState();
}