
import { CATALOG } from '../actionTypes';


/** Converts the catalog XML into something more useful.
 *
 */

import uuid from 'uuid';

import * as util from '../util';

function addElement(tree, parentId, child) {
	if(parentId == null) {
		tree.children.push(child);
	}

	for(var element of tree) {
		if(element.type == 'group') {
			if(element.id == parentId) {
				
			}
		}
	}
}


/** Convert a group to a Javascript object.
 *
 *  WARNING! Does not populate children: []!
 *
 *  @param groupXml the XML definition of the group.
 *
 *  @returns Object representing the group.
 */
function parseGroup(groupXml) {
	var new_group = {
		id: groupXml.getAttribute('uuid'),
		children: [],
		label: groupXml.getAttribute('title'),
		expand: util.parseBoolean(groupXml.getAttribute('expand')),
		// multiple=true is checkboxes, false is radio buttons
		multiple: util.parseBoolean(groupXml.getAttribute('multiple'), true)
	};

	var p = groupXml.parentNode;
	if(p && p.tagName == 'group') {
		new_group.parent = p.getAttribute('uuid');
	}

	return new_group;
}

/** Convert a Catalog layer XML definition to a Javascript object.
 *
 *  @param layerXml
 *
 * @returns Object representing the layer
 */
function parseLayer(layerXml) {
	var new_layer = {
		id: layerXml.getAttribute('uuid'),
		label: layerXml.getAttribute('title'),
	};

	var p = layerXml.parentNode;
	if(p && p.tagName == 'group') {
		new_layer.parent = p.getAttribute('uuid');
	}

	return new_layer;
}


function subtreeActions(parent, subtreeXml) {
	var actions = [];

	for(let childNode of subtreeXml.children) {
		var child = null, parent_id = null;
		if(parent && parent.id) {
			parent_id = parent.id;
		}
		if(childNode.tagName == 'group') {
			var group = parseGroup(childNode);
			actions.push({type: CATALOG.ADD_GROUP, child: group});
			child = group;

			// build the tree by recursion.
			actions = actions.concat(subtreeActions(group, childNode));
		} else if(childNode.tagName == 'layer') {
			var layer = parseLayer(childNode);
			actions.push({type: CATALOG.ADD_LAYER, child: layer})
			child = layer;
		}


		if(child && child.id) {
			actions.push({type: CATALOG.ADD_CHILD, parentId: parent_id, childId: child.id});
		}
			
	}

	return actions;
}


/** Read in the XML and returns a list of 
 *  actions to populate the store.
 *
 */
export function parseCatalog(catalogXml) {
	// first add a "uuid" attribute to each one
	//  of the elements
	for(var e of catalogXml.getElementsByTagName('*')) {
		e.setAttribute('uuid', uuid.v4());
	}

	return subtreeActions(null, catalogXml);
}
