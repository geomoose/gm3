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

export function addTool(tool) {
    return {
        type: TOOLBAR.ADD,
        tool
    }
}

export function removeTool(tool) {
    return {
        type: TOOLBAR.REMOVE,
        tool
    }
}

function parseTool(toolXml) {
    return {
        name: toolXml.getAttribute('name'),
        label: toolXml.getAttribute('title'),
        actionType: toolXml.getAttribute('type'),
        actionDetail: toolXml.getAttribute('action')
    }
}

export function parseToolbar(toolbarXml) {
    if(!toolbarXml) { return []; }

    var tool_actions = [];

    let tools = toolbarXml.getElementsByTagName('tool');
    for(let i = 0, ii = tools.length; i < ii; i++) {
        let tool = tools[i];
        tool_actions.push(addTool(parseTool(tool)));
    }

    return tool_actions;
}
