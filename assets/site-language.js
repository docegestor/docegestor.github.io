(() => {
  const select = document.querySelector('[data-language-select]');
  if (!select) return;
  const saved = localStorage.getItem('docegestor-language');
  const pathLanguage = window.location.pathname.startsWith('/en/') ? 'en' : window.location.pathname.startsWith('/es/') ? 'es' : 'pt';
  select.value = saved === 'en' || saved === 'pt' || saved === 'es' ? saved : pathLanguage;
  select.addEventListener('change', () => {
    localStorage.setItem('docegestor-language', select.value);
    window.location.href = select.value === 'en' ? '/en/' : select.value === 'es' ? '/es/' : '/pt/';
  });
})();
