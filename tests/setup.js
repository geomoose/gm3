import i18n from "i18next";
import { initReactI18next } from "react-i18next";

global.requestAnimationFrame = function (callback) {
  setTimeout(callback, 0);
};

try {
  require("canvas");
} catch (err) {
  global.HAS_CANVAS = false;
  global.HTMLCanvasElement = function () {};
  global.HTMLCanvasElement.prototype.getContext = () => {
    return {};
  };
}

window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// add an i18n setup
i18n.use(initReactI18next).init({
  keySeparator: false,
  lng: "dev",
  resources: {
    dev: { translation: {} },
  },
  interpolation: {
    escapeValue: false,
  },
});
