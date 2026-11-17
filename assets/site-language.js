(() => {
  const storageKey = 'docegestor-language';
  const language = document.documentElement.lang?.startsWith('pt') ? 'pt' : document.documentElement.lang?.startsWith('es') ? 'es' : 'en';
  const select = document.querySelector('[data-language-select]');
  if (!select) return;
  const saved = localStorage.getItem(storageKey);
  if (saved === 'en' || saved === 'pt' || saved === 'es') select.value = saved;
  select.addEventListener('change', () => {
    const next = select.value;
    localStorage.setItem(storageKey, next);
    const path = next === 'en' ? '/en/' : next === 'es' ? '/es/' : '/pt/';
    window.location.href = path;
  });
  select.setAttribute('aria-label', language === 'pt' ? 'Selecionar idioma' : language === 'es' ? 'Seleccionar idioma' : 'Select language');
})();
