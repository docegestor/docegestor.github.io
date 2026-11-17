import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'pt' | 'es';

export const LANGUAGES: Array<{ code: Language; label: string; nativeLabel: string; locale: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English', locale: 'en-US' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', locale: 'pt-BR' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', locale: 'es-ES' },
];

const translations = {
  en: {
    language: 'Language', selectLanguage: 'Select language', online: 'Online', offline: 'Offline', install: 'Install',
    home: 'Home', calculate: 'Calculate', sales: 'Sales', recipes: 'Recipes', supplies: 'Supplies', balance: 'Balance', settings: 'Settings',
    officialSite: 'Official site', feedback: 'Feedback and improvements', support: 'Support the project',
    privateByDefault: 'Private by default', developedBy: 'Developed by', appVersion: 'DoceGestor App v2.5',
    settingsSubtitle: 'Personalize your bakery, pricing and synchronization', yourData: 'Your data stays with you',
    yourBakery: 'Your bakery', pricing: 'Pricing', fixedCosts: 'Fixed costs', themes: 'Themes and colors', installableApp: 'Installable app', cloudBackup: 'Cloud and backup', supportShort: 'Support',
    siteOfficial: 'Official DoceGestor website', openApp: 'Open the app',
    seoTitle: 'DoceGestor — Bakery management made clear', seoDescription: 'Price products, organize recipes and orders, and follow your bakery results with a private, installable app.',
  },
  pt: {
    language: 'Idioma', selectLanguage: 'Selecionar idioma', online: 'Online', offline: 'Offline', install: 'Instalar',
    home: 'Início', calculate: 'Calcular', sales: 'Vendas', recipes: 'Receitas', supplies: 'Insumos', balance: 'Balanço', settings: 'Configurações',
    officialSite: 'Site oficial', feedback: 'Feedback e melhorias', support: 'Apoie o projeto',
    privateByDefault: 'Privado por padrão', developedBy: 'Desenvolvido por', appVersion: 'DoceGestor App v2.5',
    settingsSubtitle: 'Personalize sua confeitaria, valores e sincronização', yourData: 'Seus dados ficam com você',
    yourBakery: 'Sua confeitaria', pricing: 'Precificação', fixedCosts: 'Custos fixos', themes: 'Temas e cores', installableApp: 'App instalável', cloudBackup: 'Nuvem e backup', supportShort: 'Apoio',
    siteOfficial: 'Site oficial do DoceGestor', openApp: 'Abrir o app',
    seoTitle: 'DoceGestor — sua confeitaria, mais organizada', seoDescription: 'Precifique produtos, organize receitas e encomendas e acompanhe os resultados da sua confeitaria com um app privado e instalável.',
  },
  es: {
    language: 'Idioma', selectLanguage: 'Seleccionar idioma', online: 'En línea', offline: 'Sin conexión', install: 'Instalar',
    home: 'Inicio', calculate: 'Calcular', sales: 'Ventas', recipes: 'Recetas', supplies: 'Insumos', balance: 'Balance', settings: 'Configuración',
    officialSite: 'Sitio oficial', feedback: 'Comentarios y mejoras', support: 'Apoyar el proyecto',
    privateByDefault: 'Privado por defecto', developedBy: 'Desarrollado por', appVersion: 'DoceGestor App v2.5',
    settingsSubtitle: 'Personaliza tu pastelería, precios y sincronización', yourData: 'Tus datos son tuyos',
    yourBakery: 'Tu pastelería', pricing: 'Precios', fixedCosts: 'Costos fijos', themes: 'Temas y colores', installableApp: 'App instalable', cloudBackup: 'Nube y respaldo', supportShort: 'Apoyo',
    siteOfficial: 'Sitio oficial de DoceGestor', openApp: 'Abrir la app',
    seoTitle: 'DoceGestor — gestión clara para tu pastelería', seoDescription: 'Calcula precios, organiza recetas y pedidos y sigue los resultados de tu pastelería con una app privada e instalable.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
type I18nContextValue = { language: Language; locale: string; t: (key: TranslationKey) => string; setLanguage: (language: Language) => void };
const I18nContext = createContext<I18nContextValue | undefined>(undefined);
const STORAGE_KEY = 'docegestor-language';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // English is intentionally the first-run default. A later choice is remembered locally.
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'pt' || saved === 'es' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(() => ({
    language,
    locale: LANGUAGES.find((item) => item.code === language)?.locale || 'en-US',
    t: (key: TranslationKey) => translations[language][key] || translations.en[key],
    setLanguage,
  }), [language]);

  useEffect(() => {
    document.documentElement.lang = value.locale;
    document.title = value.t('seoTitle');
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', value.t('seoDescription'));
    const manifest = document.querySelector('link[rel="manifest"]');
    manifest?.setAttribute('href', '/app/manifest.webmanifest');
  }, [value]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};

export const LanguageSelect: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => {
  const { language, locale, t, setLanguage } = useI18n();
  return (
    <label className={`language-select ${className}`} style={style}>
      <span className="sr-only">{t('selectLanguage')}</span>
      <span aria-hidden="true">🌐</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={`${t('language')}: ${locale}`}>
        {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.nativeLabel}</option>)}
      </select>
    </label>
  );
};
