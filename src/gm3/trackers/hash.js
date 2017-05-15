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


import React from 'react';
import { connect } from 'react-redux';

import { getVisibleLayers } from '../actions/mapSource';
import * as mapActions from '../actions/map';

import * as util from '../util';

// node's url parser
import * as url from 'url';


/** Class for tracking the state of the user in localStorage
 *
 */
export default class HashTracker {

    constructor(store) {
        this.tracking = false;

        // localize the store.
        this.store = store;

        // when the store changes, track those changes.
        store.subscribe(() => { this.track(); });

        // track the last hash, don't update the window
        //  if it need not be updated.
        this.lastHash = '';
    }

    /** turn on tracking.
     */
    startTracking() {
        this.tracking = true;
    }

    /** turn off tracking.
     */
    stopTracking() {
        this.tracking = false;
    }

    /** Issue the commands to restore the favorites settings.
     */
    restoreFavorites() {
        /*
        // get the favorites list
        let faves = localStorage.getItem('favorites');

        if(faves) {
            // convert the 'faves' into a list of objects.
            faves = faves.split(';');

            // if there were favorites saved, for each one,
            //  issue a 'FAVORITES' command for the mapsource.
            if(faves && faves.length) {
                for(const fave of faves) {
                    let ms_name = util.getMapSourceName(fave);
                    let layer_name = util.getLayerName(fave);
                    this.store.dispatch(favoriteLayer(ms_name, layer_name, true));
                }
            }
        }
        */

    }

    /* Restore the location from the hash
     *
     */
    restoreLocation(loc) {
        // I wholly believe that map/forEach is evil,
        //  but this code is rather elegant when written this way.
        const zxy = loc.split(',').map(parseFloat);
        this.store.dispatch(mapActions.setView({
            // unset the "zoom level" which normally takes precendent.
            zoom: null, 
            center: [zxy[1], zxy[2]],
            resolution: zxy[0]
        }));
    }


    /** Issue the set of commands that will 'restore'
     *  the previous state.
     */
    restore() {
        // take the hash and parse it like a query string.
        // The "substring(1)" removes the "#" from the leading edge,
        //  replacing it with the '?' then cuases the hash to be parsed like
        //  a normal query string.
        const parsed = url.parse('?'+window.location.hash.substring(1), true);

        if(parsed.query) {
            if(parsed.query.loc) {
                this.restoreLocation(parsed.query.loc);
            }
        }
    }

    /* Track which layers are on in the hash.
     */
    trackLayers() {
        return getVisibleLayers(this.store);
    }

    /* Get the location.
     */
    trackLocation() {
        const state = this.store.getState();

        return {
            x: state.map.center[0],
            y: state.map.center[1],
            z: state.map.resolution
        }
    }

    track() {
        // when tracking is not active, just return null.
        if(this.tracking) {
            let new_hash = '';

            // put the layers in the hash
            new_hash += 'on=' + this.trackLayers().join(',');

            // get the locaiton in htere.
            const loc = this.trackLocation();
            new_hash += '&loc=' + [loc.z, loc.x, loc.y].join(','); 

            if(this.lastHash !== new_hash) {
                window.location.hash = new_hash;
            }
        }

        // no DOM components to render.
        return null;
    }
}
