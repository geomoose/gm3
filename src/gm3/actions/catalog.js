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

import uuid from "uuid";
import { createAction } from "@reduxjs/toolkit";

import { parseBoolean, getTagContents } from "../util";
import { isFavoriteLayer } from "./mapSource";

export const addLayer = createAction("catalog/add-layer");

export const addGroup = createAction("catalog/add-group");

export const addChild = createAction("catalog/add-child");

/* Change the visibility of a legend.
 */
export const setLegendVisibility = createAction(
  "catalog/set-legend-vis",
  (id, on) => ({
    payload: {
      id,
      on,
    },
  })
);

/** Toggle the state of a group
 */
export const setGroupExpand = createAction(
  "catalog/set-group-expand",
  (groupId, expand) => ({
    payload: {
      id: groupId,
      expand,
    },
  })
);

/** Convert a group to a Javascript object.
 *
 *  WARNING! Does not populate children: []!
 *
 *  @param groupXml the XML definition of the group.
 *
 *  @returns Object representing the group.
 */
function parseGroup(groupXml) {
  const newGroup = {
    id: groupXml.getAttribute("uuid"),
    children: [],
    label: groupXml.getAttribute("title"),
    expand: parseBoolean(groupXml.getAttribute("expand")),
    // multiple=true is checkboxes, false is radio buttons
    multiple: parseBoolean(groupXml.getAttribute("multiple"), true),
    // eslint-disable-next-line camelcase
    metadata_url: null,
    tip: groupXml.getAttribute("tip"),
  };

  const p = groupXml.parentNode;
  if (p && p.tagName === "group") {
    newGroup.parent = p.getAttribute("uuid");
  }

  const metadata = getTagContents(groupXml, "metadata", true)[0];
  if (metadata) {
    // eslint-disable-next-line camelcase
    newGroup.metadata_url = metadata;
  }

  return newGroup;
}

/** Convert a Catalog layer XML definition to a Javascript object.
 *
 *  @param layerXml
 *
 * @returns Object representing the layer
 */
function parseLayer(store, layerXml, exclusive = false) {
  const newLayer = {
    id: layerXml.getAttribute("uuid"),
    label: layerXml.getAttribute("title"),
    legend: parseBoolean(layerXml.getAttribute("show-legend"), true),
    src: [],
    favorite: false,
    refreshEnabled: false,
    refresh: null,
    // eslint-disable-next-line camelcase
    metadata_url: null,
    tools: [],
    tip: layerXml.getAttribute("tip"),
    exclusive,
    classNames: layerXml.getAttribute("classNames"),
  };

  // This is the first attempt at a new model
  //  for parsing the tool availabiltiy from the XML,
  //  somehwere this should be more configurable but
  //  for now it'll "work."
  const tools = [
    "down",
    "up",
    "fade",
    "unfade",
    "zoomto",
    "upload",
    "download",
    "legend-toggle",
    "draw-point",
    "draw-line",
    "draw-polygon",
    "draw-modify",
    "draw-remove",
    "draw-edit",
    "clear",
  ];

  // iterate through the available tools, if it's set in the XML
  //  then honour that setting, otherwise, use the default.
  for (const toolName of tools) {
    if (parseBoolean(layerXml.getAttribute(toolName), false)) {
      newLayer.tools.push(toolName);
    } else if (tools[toolName]) {
      newLayer.tools.push(toolName);
    }
  }

  // parse the optional float attributes
  ["refresh", "minresolution", "maxresolution"].forEach((attr) => {
    const value = layerXml.getAttribute(attr);
    if (value) {
      newLayer[attr] = parseFloat(value);
    }
  });

  // collect the src states
  let srcFavorite = false;

  // parse out the souces
  const srcStr = layerXml.getAttribute("src");
  if (srcStr) {
    const mapSources = store.getState().mapSources;
    const inheritAttrss = ["minresolution", "maxresolution", "label"];

    // migrated to ";" as the split key because the old ":"
    //  was problematic for WFS layers which specified a schema.
    for (const src of srcStr.split(";")) {
      const split = src.split("/");
      // create a new src entry.
      const s = {
        mapSourceName: split[0],
        layerName: null,
      };
      // set a layer name if there is one.
      if (split.length > 1) {
        s.layerName = split[1];
      }

      newLayer.src.push(s);

      // if any of the underlaying paths in the src
      //  are false, then turn all of them off.
      srcFavorite = srcFavorite || isFavoriteLayer(mapSources, s);

      inheritAttrss.forEach((attr) => {
        const value = mapSources[s.mapSourceName][attr];
        if (!newLayer[attr] && value) {
          newLayer[attr] = value;
        }
      });
    }
  }

  // check to see if the layer has any metadata
  const metadata = getTagContents(layerXml, "metadata", true)[0];
  if (metadata) {
    // eslint-disable-next-line camelcase
    newLayer.metadata_url = metadata;
  }

  // set the new layer state based on the src.
  newLayer.favorite = srcFavorite;

  const p = layerXml.parentNode;
  if (p && p.tagName === "group") {
    newLayer.parent = p.getAttribute("uuid");
  }

  return newLayer;
}

function subtreeActions(store, parent, subtreeXml) {
  let actions = [];

  for (let i = 0, ii = subtreeXml.childNodes.length; i < ii; i++) {
    const childNode = subtreeXml.childNodes[i];
    let child = false,
      parentId = null;
    if (parent && parent.id) {
      parentId = parent.id;
    }
    if (childNode.tagName === "group") {
      const group = parseGroup(childNode);

      // carry any multiple=false settings down to the
      //  child groups
      if (parent && parent.multiple === false) {
        group.multiple = false;
      }

      actions.push(addGroup({ child: group }));
      child = group;

      // build the tree by recursion.
      actions = actions.concat(subtreeActions(store, group, childNode));
    } else if (childNode.tagName === "layer") {
      const layer = parseLayer(
        store,
        childNode,
        parent && parent.multiple === false
      );
      actions.push(addLayer({ child: layer }));
      child = layer;
    }
    if (child && child.id) {
      actions.push(addChild({ parentId, childId: child.id }));
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
  const elements = catalogXml.getElementsByTagName("*");
  for (let i = 0, ii = elements.length; i < ii; i++) {
    const e = elements[i];
    e.setAttribute("uuid", uuid.v4());
  }

  return subtreeActions(store, null, catalogXml);
}
