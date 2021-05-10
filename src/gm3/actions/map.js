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

/** Actions for the Map.
 *
 */

import { MAP } from '../actionTypes';

export function move(center, zoom) {
    return {
        type: MAP.MOVE,
        center,
        zoom,
    }
}

export function cursor(coords) {
    return {
        type: MAP.CURSOR,
        coords
    }
}

export function changeTool(tool, src = null) {
    return {
        type: MAP.CHANGE_TOOL,
        tool, src
    }
}

export function createQuery(service, selection, fields, layers, single, runOptions = {}) {
    return {
        type: MAP.QUERY_NEW,
        query: {
            service, selection, fields, layers, runOptions,
        },
        singleQuery: single
    };
}

export function startQuery(queryId) {
    return {
        type: MAP.QUERY_START,
        id: queryId
    }
}

export function finishQuery(queryId) {
    return {
        type: MAP.QUERY_FINISHED,
        id: queryId
    }
}

export function queryProgress(queryId) {
    return {
        type: MAP.QUERY_PROGRESS,
        id: queryId
    };
}

export function resultsForQuery(queryId, layerName, failed, features, messageText = '') {
    return {
        type: MAP.QUERY_RESULTS,
        id: queryId,
        layer: layerName,
        failed,
        features,
        messageText,
    }
}

export function renderedResultsForQuery(queryId, target, data) {
    return {
        type: MAP.QUERY_RENDERED_RESULTS,
        id: queryId, target, data
    }
}

export function addSelectionFeature(feature) {
    return {
        type: MAP.ADD_SELECTION_FEATURE,
        feature
    }
}

export function zoomToExtent(extent, projection) {
    return {
        type: MAP.ZOOM_TO_EXTENT,
        extent,
        projection
    }
}

export function removeQuery(queryId) {
    return {
        type: MAP.QUERY_REMOVE,
        id: queryId
    };
}

export function removeQueryResults(queryId, filter) {
    return {
        type: MAP.QUERY_RESULTS_REMOVE,
        id: queryId,
        filter
    };
}

export function clearSelectionFeatures() {
    return {
        type: MAP.CLEAR_SELECTION_FEATURES
    };
}

export function updateSketchGeometry(geometry) {
    return {
        type: MAP.SKETCH_GEOMETRY,
        geometry
    };
}

/* Add a filter to a results set.
 */
export function addFilter(queryId, filterDefn) {
    return {
        type: MAP.ADD_FILTER,
        id: queryId,
        filter: filterDefn
    };
}

/* Remove a filter from a results set.
 */
export function removeFilter(queryId, field) {
    return {
        type: MAP.REMOVE_FILTER,
        id: queryId,
        field
    }
}

/* Set the view of the map.
 *
 * @param view {Object} An object containing center and zoom or resolution.
 *
 * @return An action definition.
 */
export function setView(view) {
    return Object.assign({
        type: MAP.MOVE
    }, view);
}

/* Set a buffer for selection features.
 *
 * @param distance {Float} Distance to buffer features
 * @param units {String} Units of the buffer, defaults to meters in the reducer
 *
 * @return action definition
 */
export function setSelectionBuffer(distance, units) {
    return {
        type: MAP.BUFFER_SELECTION_FEATURES,
        distance,
        units,
    };
}

/* Set the edit source, which is a hint as to where
 * the current editing features originated from.
 *
 * @param editPath {String} The map-source name
 *
 * @return action definition.
 */
export function setEditPath(editPath) {
    return {
        type: MAP.SET_EDIT_PATH,
        editPath,
    };
}

/* Set the size of the map in the state as a hint
 * to other components.
 *
 * @param size {Object} an object containing a width and height property.
 *
 * @return action definition
 */
export function resize(size) {
    return {
        type: MAP.RESIZE,
        size,
    };
}
