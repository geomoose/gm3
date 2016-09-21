/** Actions for map-sources
 *
 */

import { MAPSOURCE } from '../actionTypes'; 

/** Add a map-source using a MapSource
 *  object.
 */
export function add(mapSource) {
	return {
		type: MAPSOURCE.ADD,
		mapSource
	};
}

/** Add a map-source from XML
 *
 */
export function addFromXml(xml) {
	var map_source = {};

	map_source.path = xml.getAttribute('name');
	map_source.type = xml.getAttribute('type');

	return add(map_source);
}

/** Remove a map-source from the application.
 *
 *  @param path The 'path'/name of the map-source.
 *
 */
export function remove(path) {
	return {
		type: MAPSOURCE.REMOVE,
		path
	}
}
