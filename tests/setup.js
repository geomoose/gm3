import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

global.requestAnimationFrame = function(callback) {
    setTimeout(callback, 0);
};

try {
    const xmldom = require('xmlshim');
    global.XMLSerializer = xmldom.XMLSerializer;
} catch(err) {
    // pass... sad pand, no XMLSerializer.
}

try {
    require('canvas');
} catch(err) {
    global.HAS_CANVAS = false;
    HTMLCanvasElement.prototype.getContext = () => {
        return {};
    };
}

// add an i18n setup
i18n
    .use(initReactI18next)
    .init({
        keySeparator: false,
        lng: 'dev',
        resources: {
            dev: { translation: {} },
        },
        interpolation: {
            escapeValue: false,
        },
    });
