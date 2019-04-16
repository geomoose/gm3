import { CONFIG } from '../actionTypes';

export function setConfig(config) {
    return {
        type: CONFIG.SET,
        payload: config,
    };
}
