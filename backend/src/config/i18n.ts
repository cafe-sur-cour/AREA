import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { LanguageDetector } from 'i18next-http-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initI18n = async (): Promise<void> => {
  try {
    const localesPath = path.join(__dirname, '../../locales/{{lng}}.json');

    await i18next
      .use(Backend)
      .use(LanguageDetector)
      .init({
        fallbackLng: 'en',
        lng: 'en',
        supportedLngs: ['en', 'fr'],
        preload: ['en', 'fr'],
        backend: {
          loadPath: localesPath,
        },
        detection: {
          order: ['header', 'querystring', 'cookie'],
          lookupHeader: 'accept-language',
          lookupQuerystring: 'lang',
          lookupCookie: 'i18next',
          caches: ['cookie'],
        },
        interpolation: {
          escapeValue: false,
        },
      });
  } catch (error) {
    console.error('Error initializing i18n:', error);
    throw error;
  }
};

export default i18next;
