import { CONFIG } from '../actionTypes';

const DEFAULT_CONFIG = {
    map: {},
};

export default function(state = DEFAULT_CONFIG, action = {}) {
    if (action.type === CONFIG.SET) {
        return Object.assign({}, state, action.payload);
    }
    return state;
}
