/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Dan "Ducky" Little
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

/**
 * Creates a dictionary of fonts from the .ttf files found
 * in the directory.
 */

const fs = require('fs');
const path = require('path');

const FONT_PATH = path.resolve('./src/fonts');

fs.readdir(FONT_PATH, (err, items) => {
    const fontDict = {};

    for (let i = 0, ii = items.length; i < ii; i++) {
        const item = items[i];

        if (item.endsWith('.ttf')) {
            // open and encode...
            const fontContents = fs.readFileSync(path.join(FONT_PATH, item)).toString('base64');
            fontDict[item] = fontContents;
        }
    }

    fs.writeFileSync(path.resolve('./src/gm3/components/print/fonts.js'), `export const FONTS = ${JSON.stringify(fontDict)};`);
});
