import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './lang/en.json';
import esTranslation from './lang/es.json';

const resources = {
    en: {
        translation: enTranslation,
    },
    es: {
        translation: esTranslation,
    }
};

// turn off caching otherwise this adds cookies and localStorage keys
const detectorOptions = {
    order: ['querystring', 'cookie', 'navigator', 'htmlTag'],
    caches: [],
};

export const i18nStart = (initArgs) => {
    i18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init(initArgs);
};

const i18nConfigure = (config) => {
    const userLangs = {};
    const languages = [];
    for (const key in config) {
        languages.push(
            fetch(config[key])
                .then(r => r.json())
                .then(translation => {
                    userLangs[key] = {
                        translation,
                    }
                })
        );
    }

    Promise.all(languages)
        .then(() => {
            i18nStart({
                detection: detectorOptions,
                resources: Object.assign(resources, userLangs),
                keySeparator: false,
                interpolation: {
                    escapeValue: false,
                },
            });
        });
}

export default i18nConfigure;
