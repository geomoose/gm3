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

/** Reducer for the toolbar
 *
 */

import { TOOLBAR } from '../actionTypes';

/*
 * TOOLBAR tool definition
 * action.order
 * action.type
 * action.tool
 * * name
 * * label
 * * className
 * * actionType (tool, service)
 * * actionInfo
 * * order (first/last)
 *
 */

const default_state = {};

export default function toolbarReducer(state = default_state, action) {
    switch(action.type) {
        case TOOLBAR.ADD:
            // tools in drawers will have a different "root",
            //  the  base "root" is what is shown in the toolbar itself
            const root = action.root ? action.root : 'root';

            // get the 'order' placement, should be first or last
            const order = action.order ? action.order : 'last';

            // fresh bake a state
            const new_state = Object.assign({}, state);

            // add a so-fresh-so-clean drawer node
            //  if it doesn't exist.
            if(!new_state[root]) {
                new_state[root] = [];
            }

            if(order === 'first') {
                new_state[root].unshift(action.tool);
            } else {
                new_state[root].push(action.tool);
            }

            return new_state;
        case TOOLBAR.REMOVE:
            // make a copy of the tools list but do not include
            //  the tool to be removed.
            const st = {};
            for(const root in state) {
                st[root] = [];
                for(const item of state[root]) {
                    if(item.name !== action.name) {
                        st[root].push(item);
                    }
                }
            }
            return st;
        default:
            return state;
    }
};
