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
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { favoriteLayer, getLayerFromSources } from '../../actions/mapSource';


export function isFavorite(mapSources, layer) {
    let fav = true;
    for(let i = 0, ii = layer.src.length; i < ii; i++) {
        const src = layer.src[i];

        const ms_layer = getLayerFromSources(mapSources, src.mapSourceName, src.layerName);
        fav = fav && ms_layer.favorite;
    }
    return fav;
}

class LayerFavorite extends React.Component {
    render() {
        const is_fav = isFavorite(this.props.mapSources, this.props.layer);

        let classes = 'favorite icon';
        if(!is_fav) {
            classes += ' not';
        }

        return (
            <i
                className={ classes }
                onClick={() => {
                    this.props.onToggleFavorite(this.props.layer, !is_fav);
                }}
            />
        );
    }
}

LayerFavorite.propTypes = {
    mapSources: PropTypes.object.isRequired,
    layer: PropTypes.object.isRequired,
    onToggleFavorite: PropTypes.func.isRequired,
};

function mapStateProps(state) {
    return {
        mapSources: state.mapSources,
    };
}

function mapDispatchProps(dispatch) {
    return {
        onToggleFavorite: (layer, favorite) => {
            for(let i = 0, ii = layer.src.length; i < ii; i++) {
                const src = layer.src[i];
                dispatch(favoriteLayer(src.mapSourceName, src.layerName, favorite));
            }
        },
    }
}

export default connect(mapStateProps, mapDispatchProps)(LayerFavorite);
