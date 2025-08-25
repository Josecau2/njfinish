import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'es'],
  nonExplicitSupportedLngs: true,
  load: 'languageOnly',
  cleanCode: true,
  interpolation: { escapeValue: false },
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
