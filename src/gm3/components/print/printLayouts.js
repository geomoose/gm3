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
 * Collection of print layouts used by default.
 */

const LAYOUTS = [
    {
        label: 'letter-landscape-legend',
        orientation: 'landscape',
        page: 'letter',
        units: 'in',
        elements: [
            {
                type: 'text',
                size: 18, fontStyle: 'bold',
                x: .5, y: .70, text: '{{title}}'
            },
            {
                type: 'map',
                x: .5, y: .75,
                width: 7, height: 7
            },
            {
                type: 'rect',
                x: .5, y: .75,
                width: 7, height: 7,
                strokeWidth: .01
            },
            {
                type: 'text',
                x: .5, y: 8, text: 'Printed on {{month}} / {{day}} / {{year}}'
            },
            {
                type: 'text',
                x: 7.6, y: .9,
                text: 'Legend',
            },
            {
                type: 'legend',
                x: 7.61, y: 1.0
            },
            {
                type: 'rect',
                x: 7.6, y: .75,
                width: 2.4,
                height: 7,
                strokeWidth: .01,
            }
        ]
    },
    {
        label: 'letter-landscape',
        orientation: 'landscape',
        page: 'letter',
        units: 'in',
        elements: [
            {
                type: 'text',
                size: 18, fontStyle: 'bold',
                x: .5, y: .70, text: '{{title}}'
            },
            {
                type: 'map',
                x: .5, y: .75,
                width: 10, height: 7
            },
            {
                type: 'rect',
                x: .5, y: .75,
                width: 10, height: 7,
                strokeWidth: .01
            },
            {
                type: 'text',
                x: .5, y: 8, text: 'Printed on {{month}} / {{day}} / {{year}}'
            }
        ]
    },
    {
        label: 'letter-portrait',
        orientation: 'portrait',
        page: 'letter',
        units: 'in',
        elements: [
            {
                type: 'text',
                size: 18, fontStyle: 'bold',
                x: .5, y: .70, text: '{{title}}'
            },
            {
                type: 'map',
                x: .5, y: .75,
                width: 7.5, height: 9.5
            },
            {
                type: 'rect',
                x: .5, y: .75,
                width: 7.5, height: 9.5,
                strokeWidth: .01
            },
            {
                type: 'text',
                x: .5, y: 10.5, text: 'Printed on {{month}} / {{day}} / {{year}}'
            }
        ]
    },
    {
        label: 'tabloid-landscape',
        orientation: 'landscape',
        page: 'tabloid',
        units: 'in',
        elements: [
            {
                type: 'text',
                size: 18, fontStyle: 'bold',
                x: .5, y: .70, text: '{{title}}'
            },
            {
                type: 'map',
                x: .5, y: .75,
                width: 16, height: 9.5
            },
            {
                type: 'rect',
                x: .5, y: .75,
                width: 16, height: 9.5,
                strokeWidth: .01
            },
            {
                type: 'text',
                x: .5, y: 10.5, text: 'Printed on {{month}} / {{day}} / {{year}}'
            }
        ]
    }
];

export default LAYOUTS;
