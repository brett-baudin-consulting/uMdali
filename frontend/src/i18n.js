import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';
import esTranslation from './locales/es/translation.json';
import hiTranslation from './locales/hi/translation.json';

// Define the available languages
const availableLanguages = ['en', 'fr', 'de', 'es', 'hi']; // add more language codes as needed

i18n
  // Use the language detector plugin
  .use(LanguageDetector)
  // Passes i18n down to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
      de: { translation: deTranslation },
      es: { translation: esTranslation },
      hi: { translation: hiTranslation },
    },
    // Set fallback language
    fallbackLng: 'en',
    // Define supported languages
    whitelist: availableLanguages,
    // Language detector options
    detection: {
      order: ['navigator'],
      checkWhitelist: true, // Only detect languages that are in the whitelist
    },
    interpolation: {
      // Security: Enable escaping of values
      escapeValue: true,
    },
  });

export default i18n;