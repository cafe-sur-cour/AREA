import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { LanguageDetector } from 'i18next-http-middleware';
import path from 'path';
import fs from 'fs';

export const initI18n = async (): Promise<void> => {
  try {
    const localesPath = path.join(process.cwd(), 'locales', '{{lng}}.json');

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
        },
        interpolation: {
          escapeValue: false,
        },
      });

    await loadServiceTranslations();
  } catch (error) {
    console.error('Error initializing i18n:', error);
    throw error;
  }
};

async function loadServiceTranslations(): Promise<void> {
  const servicesPath = path.join(process.cwd(), 'src', 'services', 'services');

  try {
    const serviceDirs = fs
      .readdirSync(servicesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const service of serviceDirs) {
      const serviceLocalesPath = path.join(servicesPath, service, 'locales');

      for (const lang of ['en', 'fr']) {
        const filePath = path.join(serviceLocalesPath, `${lang}.json`);

        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const translations = JSON.parse(content);

            i18next.addResourceBundle(
              lang,
              'translation',
              {
                services: {
                  [service]: translations,
                },
              },
              true,
              true
            );
          } catch (error) {
            console.warn(
              `Failed to load translations for ${service} (${lang}):`,
              error
            );
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to scan services directory:', error);
  }
}

export default i18next;
