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

import React from 'react';
import SelectInput from './select';

import { getQueryableLayers, getLayerByPath } from '../../actions/mapSource';


export default class LayersListInput extends SelectInput {
    getOptions() {
        // default to an empty layers list.
        let layers = [];
        // if layers are specified in a list then just use
        //   that list of paths.
        if(this.props.field.filter.layers) {
            layers = this.props.field.filter.layers;
        // otherwise assume this is used for querying and get the list of
        //  queryable layers that match the filter.
        } else {
            layers = getQueryableLayers(this.props.store, this.props.field.filter);
        }

        const options = [];
        for(let i = 0, ii = layers.length; i < ii; i++) {
            const layer = getLayerByPath(this.props.store, layers[i]);
            options.push({
                value: layers[i],
                label: layer.label,
            });
        }
        return options;
    }
}
