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

/** Toolbar actions and parsing
 *
 */

import { TOOLBAR } from '../actionTypes';

export function addTool(root, tool, order = 'last') {
    return {
        type: TOOLBAR.ADD,
        order,
        root,
        tool
    }
}

export function addDrawer(root, drawer, order = 'last') {
    return {
        type: TOOLBAR.ADD,
        order,
        root,
        tool: {
            name: drawer.name, label: drawer.label,
            actionType: 'drawer', actionDetail: '',
        }
    }
}

export function remove(name) {
    return {
        type: TOOLBAR.REMOVE,
        name
    }
}

function parseTool(toolXml) {
    return {
        name: toolXml.getAttribute('name'),
        label: toolXml.getAttribute('title'),
        actionType: toolXml.getAttribute('type'),
        actionDetail: toolXml.getAttribute('action'),
        cssClass: toolXml.getAttribute('css-class'),
    }
}

function parseDrawer(drawerXml) {
    return {
        name: drawerXml.getAttribute('name'),
        label: drawerXml.getAttribute('title'),
    }
}

function parseChildren(rootName, node) {
    let actions = [];
    for(const child of node.childNodes) {
        if(child.tagName === 'drawer') {
            const drawer = parseDrawer(child)
            actions.push(addDrawer(rootName, drawer));
            actions = actions.concat(parseChildren(drawer.name, child));
        } else if(child.tagName === 'tool') {
            actions.push(addTool(rootName, parseTool(child)));
        }
    }
    return actions;
}

export function parseToolbar(toolbarXml) {
    if(!toolbarXml) { return []; }
    return parseChildren('root', toolbarXml);
}
