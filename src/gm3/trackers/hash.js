/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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


import { getVisibleLayers, setLayerVisibility } from '../actions/mapSource';
import { zoomToExtent, setView } from '../actions/map';
import { toLonLat, fromLonLat, transformExtent } from 'ol/proj';
import olView from 'ol/View';

import { getMapSourceName, getLayerName, parseBoolean } from '../util';

// node's url parser
import { parse as urlParse } from 'url';

export const JOIN_SYMBOL = ';';

export const formatLocation = (mapState, mapSize, format) => {
    if (format === 'zxy' && mapState.resolution && mapState.center) {
        return [
            mapState.resolution.toFixed(4),
            mapState.center[0].toFixed(2),
            mapState.center[1].toFixed(2),
        ].join(JOIN_SYMBOL);
    } else if (format === 'bbox' && mapState.resolution && mapState.center) {
        const view = new olView({
            center: mapState.center,
            resolution: mapState.resolution,
        });
        const extent = view.calculateExtent([mapSize.width, mapSize.height]);
        return transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
            .map(v => v.toFixed(5)).join(JOIN_SYMBOL);
    } else if (format === 'lonlat' && (mapState.zoom || mapState.resolution) && mapState.center) {
        const ll = toLonLat(mapState.center);
        // handle the case where the zoom value has not been hydrated
        //  in the state.
        let zoom = mapState.zoom;
        if (!zoom) {
            zoom = (new olView()).getZoomForResolution(mapState.resolution);
        }

        return [
            zoom.toFixed(2),
            ll[0].toFixed(6),
            ll[1].toFixed(6),
        ].join('/');
    }
};

export const parseLocation = loc => {
    // if the first character is a comma,
    //   things have gone wrong.
    if (loc.indexOf(JOIN_SYMBOL) > 0) {
        const locParts = loc.split(JOIN_SYMBOL);
        let parsed = [];
        try {
            parsed = locParts.map(parseFloat);
        } catch (err) {
            return null;
        }

        if (parsed.length === 3) {
            return {
                zoom: null,
                resolution: parsed[0],
                center: [parsed[1], parsed[2]],
            };
        } else if (parsed.length === 4) {
            return {
                bbox: parsed,
            };
        }
    // Yes, the difference between ground coordinates
    //  and EPSG:4326 coordinates is the use of slashes.
    } else if (loc.indexOf('/') > 0) {
        // Z-level, Lon, Lat
        const locParts = loc.split('/');
        let parsed = [];
        try {
            parsed = locParts.map(parseFloat);
        } catch (err) {
            return null;
        }
        if (parsed.length === 3) {
            const center = fromLonLat([parsed[1], parsed[2]]);
            return {
                zoom: parsed[0],
                center,
            }
        }
    }

    // null means this was not a parseable location
    return null;
};


/* Test to see if a map-source is "always-on"
 *
 */
const isAlwaysOn = (mapSource) => {
    if(mapSource && mapSource.options) {
        const always_on = mapSource.options['always-on'];
        return (always_on === true || parseBoolean(always_on));
    }
    return false;
};


/* Track the layer changes.
 *
 */
const trackLayers = mapSources => {
    const visible_layers = getVisibleLayers(mapSources);
    const trackable_layers = [];
    for(const layer of visible_layers) {
        const ms_name = getMapSourceName(layer);
        if(!isAlwaysOn(mapSources[ms_name])) {
            trackable_layers.push(layer);
        }
    }
    return trackable_layers;
};


/** Class for tracking the state of the user in localStorage
 *
 */
export default class HashTracker {

    constructor(store, options = {}) {
        this.tracking = false;

        // localize the store.
        this.store = store;

        // wrap the window change tracker so that
        //  it points to the same place no matter.
        this.trackWindowChanges = this.trackWindowChanges.bind(this);

        // when the store changes, track those changes.
        store.subscribe(() => { this.track(); });

        // track the last hash, don't update the window
        //  if it need not be updated.
        this.lastHash = '';

        // localize the config options.
        this.config = {
            locationFormat: 'zxy',
            ...options,
        };

        this.lastState = {};
    }

    /** turn on tracking.
     */
    startTracking() {
        this.tracking = true;
        window.addEventListener('hashchange', this.trackWindowChanges, false);
    }

    /** turn off tracking.
     */
    stopTracking() {
        this.tracking = false;
    }

    /* Batch and issue commands to handle the restoration of layers.
     */
    restoreLayers(layersOn) {
        // get the list of layers from the query.
        const layers = layersOn.split(JOIN_SYMBOL);

        // check for what the visible layers are now.
        const map_sources = this.store.getState().mapSources;
        const visible_layers = getVisibleLayers(map_sources);

        // layers to turn on
        const turn_on = [];

        for(let i = 0, ii = layers.length; i < ii; i++) {
            // the layer from the URL is not "visible"
            if(visible_layers.indexOf(layers[i]) < 0) {
                turn_on.push(layers[i]);
            }
        }

        for(let i = 0, ii = visible_layers.length; i < ii; i++) {
            const layer = visible_layers[i];
            const ms_name = getMapSourceName(layer);
            if(!isAlwaysOn(map_sources[ms_name]) &&
                layers.indexOf(visible_layers[i]) < 0
            ) {
                this.store.dispatch(
                    setLayerVisibility(getMapSourceName(layer), getLayerName(layer), false)
                );
            }
        }

        turn_on.forEach(layer =>
            this.store.dispatch(
                setLayerVisibility(getMapSourceName(layer), getLayerName(layer), true)
            )
        );
    }

    /* Restore the location from the hash
     *
     */
    restoreLocation(loc) {
        const next = parseLocation(loc);
        // next will return as null if the location was
        //  not parseable.
        if (next) {
            if (next.bbox) {
                this.store.dispatch(zoomToExtent(next.bbox, 'EPSG:4326'));
            } else {
                this.store.dispatch(setView(next));
            }
        }
    }

    /** Issue the set of commands that will 'restore'
     *  the previous state.
     */
    restore() {
        // take the hash and parse it like a query string.
        // The "substring(1)" removes the "#" from the leading edge,
        //  replacing it with the '?' then cuases the hash to be parsed like
        //  a normal query string.
        const parsed = urlParse('?' + window.location.hash.substring(1), true);

        if(parsed.query) {
            if(parsed.query.loc) {
                this.restoreLocation(parsed.query.loc);
            }
            if(parsed.query.on) {
                this.restoreLayers(parsed.query.on);
            }
        }
    }

    /* Track the window changes.
     */
    trackWindowChanges() {
        if(window.location.hash !== ('#' + this.lastHash)) {
            this.restore();
        }
    }

    track() {
        // when tracking is not active, just return false.
        if(this.tracking) {
            let new_hash = '';

            const state = this.store.getState();
            const mapState = state.map;
            const mapSources = state.mapSources;

            if (mapState !== this.lastState.map || mapSources !== this.lastState.mapSources) {
                this.lastState = {
                    map: mapState,
                    mapSources,
                };

                // put the layers in the hash
                new_hash += 'on=' + trackLayers(mapSources).join(JOIN_SYMBOL);

                // get the locaiton in htere.
                new_hash += '&loc=' +
                    formatLocation(mapState, state.cursor.size, this.config.locationFormat);

                if (this.lastHash !== new_hash) {
                    // update the hash first so we don't trigger
                    //  a hash change
                    this.lastHash = new_hash;
                    // now update the hash
                    window.location.hash = new_hash;
                }
            }
        }
    }
}
