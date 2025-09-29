import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  fallbackLng: 'en',
  supportedLngs: ['en', 'es'],
  nonExplicitSupportedLngs: true,
  load: 'languageOnly',
  cleanCode: true,
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    lookupLocalStorage: 'lang',
    caches: ['localStorage'],
  },
  interpolation: {
    escapeValue: false,
    formatSeparator: ',',
    format: function(value, format, lng) {
      if (format === 'uppercase') return value.toUpperCase();
      if (format === 'currency') {
        return new Intl.NumberFormat(lng, {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      if (format === 'date') {
        return new Intl.DateTimeFormat(lng, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(new Date(value));
      }
      if (format === 'dateShort') {
        return new Intl.DateTimeFormat(lng, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(new Date(value));
      }
      return value;
    }
  },
  react: { useSuspense: false },
})

// Keep the <html lang="..."> attribute in sync
try {
  const current = i18n.resolvedLanguage || i18n.language || 'en'
  document.documentElement.setAttribute('lang', current)
} catch {}

i18n.on('languageChanged', (lng) => {
  try {
    document.documentElement.setAttribute('lang', lng)
  } catch {}
})

export default i18n
