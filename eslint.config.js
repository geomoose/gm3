/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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
module.exports = {
    parser: 'babel-eslint',
    parserOptions: {
        emcaVersion: 6,
        sourceType: 'module',
        emcaFeatures: {
            modules: true,
            jsx: true
        }
    },
    extends: ['react-app'],
    rules: {
        'prefer-spread': 'error',
        'prefer-const': 1, // warn! ['warning', 'always'],
        'no-var': 1,
        'array-callback-return': 'error',
        quotes: ['warn', 'single'],
        camelcase: 'off',
        curly: ['error', 'all'],
        'default-case': ['error'],
        'dot-notation': ['error'],
        eqeqeq: ['error', 'smart'],
        // ban the use of eval()
        'no-eval': 'error',
        'no-implicit-globals': 'off',
        'no-multi-str': 'error',
        'no-return-assign': 'error',
        'no-script-url': 'error',
        'no-self-assign': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'block-spacing': ['error', 'always'],
        'comma-spacing': ['error', {before: false, after: true}],
        'eol-last': 'error',
        'func-call-spacing': ['error', 'never'],
        // 4-spaces for indentation
        'indent': ['error', 4, {SwitchCase: 1, VariableDeclarator: 1, outerIIFEBody: 1}],
        'key-spacing': ['error', {beforeColon: false, afterColon: true}],
        'line-comment-position': ['error', {position: 'above'}],
        //'linebreak-style': ['error', 'unix'],
        'no-array-constructor': 'error',
        'no-inline-comments': 'off',
        'no-mixed-spaces-and-tabs': 'error',
        'no-tabs': 'error',
        'no-underscore-dangle': ['error', { allowAfterThis: false }],
        'no-whitespace-before-property': 'error',
        'no-trailing-spaces': 'error',
        'space-before-function-paren': ['error', { anonymous: 'never', named: 'never' }],
        'space-infix-ops': 'error',
        'spaced-comment': ['error', 'always'],
        'no-console': ['error', {allow: ['warn', 'error', 'info']}],
    },
};
