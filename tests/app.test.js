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

import fs from 'fs';

import Application from 'gm3/application';

import ZoomToAction from 'services/zoomto';

import { runAction } from 'gm3/actions/ui';

/* This is a bit of a hacky polyfill for requestAnimationFrame
 * which is needed by the openlayers map to drawer but is not
 * simulated by the jsdom/enzyme combination.
 * Original source:
 * - https://stackoverflow.com/questions/44111231/react-native-requestanimationframe-is-not-supported-in-node
 */
if (!window.requestAnimationFrame) {
    const targetTime = 0
    window.requestAnimationFrame = function(callbackFun) {
        const currentTime = +new Date()
        const timeoutCb = function() { callbackFun(+new Date()) }
        return window.setTimeout(timeoutCb, Math.max(targetTime + 16, currentTime) - currentTime)
    }
}

/** This is intended to create a basic "dummy" app
 *  that can be used to test interactions between components
 *  and not just their individualized issues.
 *
 */
describe('real lyfe test', () => {
    // define a new app
    const app = new Application({
        mapserver_url: '/cgi-bin/mapserv',
        mapfile_root: '/test/path/'
    });

    it('loads examples/desktop/mapbook.xml', (done) => {
        fs.readFile('examples/desktop/mapbook.xml', (err, contents) => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(contents, 'text/xml');
            app.loadMapbook({content: xml}).then(() => {
                done();
            });
        });
    });

    it('registers an action', () => {
        app.registerAction('zoomto', ZoomToAction, {
            extent: [-10, -10, 10, 10]
        });
    });

    it('triggers the action', () => {
        app.store.dispatch(runAction('zoomto'));
    });
});
