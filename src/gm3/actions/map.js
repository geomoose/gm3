/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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

export function move(center, resolution) {
    return {
        type: MAP.MOVE,
        center, resolution
    }
}

export function cursor(coords) {
    return {
        type: MAP.CURSOR,
        coords
    }
}

export function changeTool(tool) {
    return {
        type: MAP.CHANGE_TOOL,
        tool
    }
}

export function createQuery(service, selection, fields, layers) {
    return {
        type: MAP.QUERY_NEW,
        query: {
            service, selection, fields, layers
        }
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

export function resultsForQuery(queryId, layerName, failed, features) {
    return {
        type: MAP.QUERY_RESULTS,
        id: queryId,
        layer: layerName,
        failed,
        features
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
