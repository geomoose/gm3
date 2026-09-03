import { TextDecoder, TextEncoder } from "util";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import crypto from "crypto";

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();
// Default to an empty-object JSON body so libraries that call response.json()
// on the mocked fetch (e.g. OL BingMaps' metadata request) don't throw an
// unhandled FetchError and crash the Jest worker on process exit.
fetchMock.mockResponse(JSON.stringify({}));

global.requestAnimationFrame = function (callback) {
  setTimeout(callback, 0);
};

try {
  require("canvas");
} catch (_err) {
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

window.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  terminate: jest.fn(),
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

global.crypto = {
  getRandomValues: (arr) => crypto.randomBytes(arr.length),
};
