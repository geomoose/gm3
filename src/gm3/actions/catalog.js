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

import * as util from '../util';
import * as mapSources from './mapSource';

function addElement(tree, parentId, child) {
    if(parentId === null) {
        tree.children.push(child);
    }

    for(let i = 0, ii = tree.length; i < ii; i++) {
        let element = tree[i];
        if(element.type === 'group') {
            if(element.id === parentId) {

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
    let new_group = {
        id: groupXml.getAttribute('uuid'),
        children: [],
        label: groupXml.getAttribute('title'),
        expand: util.parseBoolean(groupXml.getAttribute('expand')),
        // multiple=true is checkboxes, false is radio buttons
        multiple: util.parseBoolean(groupXml.getAttribute('multiple'), true)
    };

    let p = groupXml.parentNode;
    if(p && p.tagName === 'group') {
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
function parseLayer(store, layerXml) {
    let new_layer = {
        id: layerXml.getAttribute('uuid'),
        label: layerXml.getAttribute('title'),
        legend: util.parseBoolean(layerXml.getAttribute('show-legend'), true),
        src: [],
        favorite: false,
        refreshEnabled: false,
        refresh: null,
        metadata_url: null,
        tools: []
    };

    // This is the first attempt at a new model
    //  for parsing the tool availabiltiy from the XML,
    //  somehwere this should be more configurable but
    //  for now it'll "work."
    const tools = [
        'down', 'up',
        'fade', 'unfade',
        'zoomto',
        'upload', 'download',
        'legend-toggle',
        'draw-point', 'draw-line', 'draw-polygon',
        'draw-modify', 'draw-remove',
        'clear'
    ];

    // iterate through the available tools, if it's set in the XML
    //  then honour that setting, otherwise, use the default.
    for(const tool_name of tools) {
        if(util.parseBoolean(layerXml.getAttribute(tool_name), false)) {
            new_layer.tools.push(tool_name);
        } else if(tools[tool_name]) {
            new_layer.tools.push(tool_name);
        }
    }

    // parse a refresh time if it exists
    if(layerXml.getAttribute('refresh')) {
        new_layer.refresh = parseFloat(layerXml.getAttribute('refresh'));
    }

    // collect the src states
    let src_favorite = false;

    // parse out the souces
    let src_str = layerXml.getAttribute('src');
    if(src_str) {
        // migrated to ";" as the split key because the old ":"
        //  was problematic for WFS layers which specified a schema.
        for(let src of src_str.split(';')) {
            let split = src.split('/');
            // create a new src entry.
            let s = {
                mapSourceName: split[0],
                layerName: null,
            };
            // set a layer name if there is one.
            if(split.length > 1) {
                s.layerName = split[1];
            }

            new_layer.src.push(s);

            // if any of the underlaying paths in the src
            //  are false, then turn all of them off.
            src_favorite = src_favorite || mapSources.isFavoriteLayer(store, s);

            // check to see if a 'default' name is needed
            // for the catalog entry.
            if(!new_layer.label) {
                let ms = mapSources.get(store, s.mapSourceName);
                if(ms.label) {
                    new_layer.label = ms.label;
                }
            }

        }
    }

    // check to see if the layer has any metadata
    const metadata = util.getTagContents(layerXml, 'metadata', true)[0];
    if(metadata) {
        new_layer.metadata_url = metadata;
    }

    // set the new layer state based on the src.
    new_layer.favorite = src_favorite;

    let p = layerXml.parentNode;
    if(p && p.tagName === 'group') {
        new_layer.parent = p.getAttribute('uuid');
    }

    return new_layer;
}


function subtreeActions(store, parent, subtreeXml) {
    let actions = [];

    for(let i = 0, ii = subtreeXml.childNodes.length; i < ii; i++) {
        let childNode = subtreeXml.childNodes[i];
        let child = null, parent_id = null;
        if(parent && parent.id) {
            parent_id = parent.id;
        }
        if(childNode.tagName === 'group') {
            let group = parseGroup(childNode);
            actions.push({type: CATALOG.ADD_GROUP, child: group});
            child = group;

            // build the tree by recursion.
            actions = actions.concat(subtreeActions(store, group, childNode));
        } else if(childNode.tagName === 'layer') {
            let layer = parseLayer(store, childNode);
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
export function parseCatalog(store, catalogXml) {
    // first add a "uuid" attribute to each one
    //  of the elements
    // The UUIDs are used to flatten the tree's data structure.
    let elements = catalogXml.getElementsByTagName('*');
    for(let i = 0, ii = elements.length; i < ii; i++) {
        let e = elements[i];
        e.setAttribute('uuid', uuid.v4());
    }

    return subtreeActions(store, null, catalogXml);
}

/* Change the visibility of a legend.
 */
export function setLegendVisibility(layerId, on) {
    return {
        type: CATALOG.LEGEND_VIS,
        id: layerId,
        on
    };
}
