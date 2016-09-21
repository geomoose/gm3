/** Reduces Map-Sources
 *
 */

import { MAPSOURCE } from '../actionTypes';

export default function mapSource(state = [], action) {
	switch(action.type) {
		case MAPSOURCE.ADD:
			return state.concat(action.mapSource);
		default:
			return state;
	}
}
