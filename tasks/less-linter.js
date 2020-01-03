/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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

/*
 * This is a limited linting routine to ensure that a few oogy-boogies do
 * not make their way into the repository:
 *  1. No hard tabs, yo. Knock it off.
 *  2. No references by id.  This does a rough check to ensure the "#" selector
 *     is not used.
 */

const fs = require('fs');
const path = require('path');

function lintSelectors(filename, data) {
    // very small state-machine for iterating through the CSS file.
    // Basically, "#" is okay for defining colors but otherwise is used
    // to specify the ID selector in CSS/LESS. All CSS values start with a ":"
    // and end with a ";". To if we are in a ":" before a ";" then the text is
    // a value.  Elsewise, the "#" is likely to be a selector and we error out.
    let in_value = false;
    let line_no = 1;
    for(let c = 0, cc = data.length; c < cc; c++) {
        let chr = data[c];
        if(chr === ':' && !in_value) {
            in_value = true;
        } else if(chr === ';' && in_value) {
            in_value = false;
        } else if(chr === '#' && !in_value) {
            throw new Error('ID selector found in [' + filename + ':' + line_no + ']');
        } else if(chr === '\t') {
            throw new Error('No tabs allowed! Tab found in [' + filename + ':' + line_no + ']');
        } else if(chr === '\n') {
            line_no++;
        }
    }
}

function lintFile(filename) {
    const data = fs.readFileSync(filename, {encoding: 'utf8'});

    lintSelectors(filename, data);

    const lines = data.split('\n');

    for(let line = 0, n_lines = lines.length; line < n_lines; line++) {
        if(lines[line].indexOf('\t') >= 0) {
            throw new Error('Evil hard tab found in [' + filename + ':' + (line + 1) + ']');
        }
    }

}

function main(inPath) {
    fs.readdirSync(inPath)
        .forEach(f => {
            const fullPath = path.join(inPath, f);
            if (fs.statSync(fullPath).isDirectory()) {
                main(fullPath);
            } else {
                try {
                    lintFile(fullPath);
                } catch (err) {
                    console.error('LESS LINT FAILED');
                    console.error(err.message);
                    process.exit(1);
                }
            }
        });
}

main(process.argv[2]);
