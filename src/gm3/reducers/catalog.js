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

/** Converts the catalog XML into something more useful.
 *
 */

import uuid from 'uuid';

import { CATALOG } from '../actionTypes';

function addGroup(state, action) {
    const new_elem = {};
    const ch = action.child;
    new_elem[ch.id] = ch;
    return Object.assign({}, state, new_elem);
}

export default function catalogReducer(state = {'root': {id: uuid.v4(), children: []}}, action) {
    const new_layer = {};

    switch(action.type) {
        case CATALOG.ADD_LAYER:
        case CATALOG.ADD_GROUP:
            return addGroup(state, action);
        case CATALOG.ADD_CHILD:
            // this is a root-level child.
            let p = action.parentId;
            if(!p) {
                p = 'root';
            }

            // create a copy of the group/root with the
            //   new child added to its children list.
            const new_elem = Object.assign({}, state[p], {
                children: [
                    ...state[p].children,
                    action.childId
                ]
            });

            // then create an 'update' object which will
            //  properly mixin the new elements with the
            //  rest of the state.
            const mixin = {};
            mixin[p] = new_elem;
            return Object.assign({}, state, mixin);
        case CATALOG.FAVORITE:
            const new_fav_layer = {};
            new_fav_layer[action.id] = Object.assign({}, state[action.id], {
                favorite: action.favorite
            });
            return Object.assign({}, state, new_fav_layer);
        case CATALOG.GROUP_VIS:
            const new_group = {};
            new_group[action.id] = Object.assign({}, state[action.id], {
                expand: action.expand
            });
            return Object.assign({}, state, new_group);
        case CATALOG.REFRESH:
            new_layer[action.id] = Object.assign({}, state[action.id], {
                refreshEnabled: action.refreshEnabled
            });
            return Object.assign({}, state, new_layer);
        case CATALOG.LEGEND_VIS:
            new_layer[action.id] = Object.assign({}, state[action.id], {
                legend: action.on
            });
            return Object.assign({}, state, new_layer);
        default:
            return state;
    }
}
