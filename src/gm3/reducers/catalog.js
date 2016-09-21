/** Converts the catalog XML into something more useful.
 *
 */

import uuid from 'uuid';

import { CATALOG } from '../actionTypes';

import * as util from '../util';


export default function catalogReducer(state = {'root' : {id: uuid.v4(), children: []}}, action) {
	switch(action.type) {
		case CATALOG.ADD_LAYER:
		case CATALOG.ADD_GROUP:
			var new_elem = {};
			var ch = action.child; 
			new_elem[ch.id] = ch;
			return Object.assign({}, state, new_elem);
		case CATALOG.ADD_CHILD:
			// this is a root-level child.
			var p = action.parentId;
			if(!p) {
				p = 'root';
			}

			// create a copy of the group/root with the
			//   new child added to its children list.
			var new_elem = Object.assign({}, state[p], {
				children: [
					...state[p].children,
					action.childId
				]
			});

			// then create an 'update' object which will
			//  properly mixin the new elements with the 
			//  rest of the state.
			var mixin = {};
			mixin[p] = new_elem;
			return Object.assign({}, state, mixin);
		default:
			return state;
	}
}
