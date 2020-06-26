/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { UI } from '../actionTypes';

export function setUiHint(hintName) {
    return {
        type: UI.HINT, hint: hintName
    };
}

export function clearUiHint() {
    return {
        type: UI.CLEAR_HINT
    };
}

export function runAction(actionName) {
    return {
        type: UI.RUN_ACTION, action: actionName
    }
}

export function clearAction() {
    return {
        type: UI.CLEAR_ACTION
    };
}

export function showModal(modalKey) {
    return {
        type: UI.SHOW_MODAL,
        payload: modalKey,
    };
}

export function hideModal() {
    return {
        type: UI.SHOW_MODAL,
        payload: '',
    };
}
