/** Dictionary of GeoMoose Actions.
 *
 *  Every action for GeoMoose needs to be mapped to 
 *  one of the 'action' dictionaries below.
 *
 */

export const MAPSOURCE = {
	ADD: 'MAPSOURCE_ADD',
	REMOVE: 'MAPSOURCE_RM',
	MOVE: 'MAPSOURCE_MV',
    ADD_LAYER: 'MAPSOURCE_ADD_LAYER',
	LAYER_VIS: 'MAPSOURCE_LAYER_VIS'
};


export const CATALOG = {
	ADD_LAYER: 'CATALOG_ADD_LAYER',
	ADD_GROUP: 'CATALOG_ADD_GROUP',
	ADD_CHILD: 'CATALOG_ADD_CHILD',
	REMOVE_LAYER: 'CATALOG_RM_LAYER',
	REMOVE_GROUP: 'CATALOG_RM_GROUP'
};
