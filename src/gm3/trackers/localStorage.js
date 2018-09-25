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


import { favoriteLayer } from '../actions/mapSource';

import * as util from '../util';


/** Class for tracking the state of the user in localStorage
 *
 */
export default class LocalStorageTracker {

    constructor(store) {
        this.tracking = false;

        // localize the store.
        this.store = store;

        // when the store changes, track those changes.
        store.subscribe(() => { this.track(); });
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
        // get the favorites list
        let faves = localStorage.getItem('favorites');

        if(faves) {
            // convert the 'faves' into a list of objects.
            faves = faves.split(';');

            // if there were favorites saved, for each one,
            //  issue a 'FAVORITES' command for the mapsource.
            if(faves && faves.length) {
                for(const fave of faves) {
                    const ms_name = util.getMapSourceName(fave);
                    const layer_name = util.getLayerName(fave);
                    this.store.dispatch(favoriteLayer(ms_name, layer_name, true));
                }
            }
        }

    }


    /** Issue the set of commands that will 'restore'
     *  the previous state.
     */
    restore() {
        this.restoreFavorites();
    }

    /** Track the changes for layers which have been toggled
     *  as a favorite.
     */
    trackFavorites() {
        const state = this.store.getState();

        let favorites = '', prefix = '';
        // check map-sources for favorite layers.
        for(const ms_name in state.mapSources) {
            for(const layer of state.mapSources[ms_name].layers) {
                if(layer.favorite) {
                    favorites += prefix + ms_name + '/' + layer.name;
                    prefix = ';';
                }
            }
        }

        const changed = (this.lastFavorites !== favorites);
        if(changed) {
            // serialize the favorite layers and save them in local storage.
            localStorage.setItem('favorites', favorites);
            this.lastFavorites = favorites;
        }
    }

    track() {
        // when tracking is not active, just return false.
        if(this.tracking) {
            this.trackFavorites();
        }

        // no DOM components to render.
        return false;
    }

}
