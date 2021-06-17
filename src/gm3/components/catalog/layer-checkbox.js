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
import { connect } from 'react-redux';

import { setLayerVisibility } from '../../actions/mapSource';
import { isLayerOn } from '../../util';

const getAllChildLayers = (catalog, id, found = []) => {
    const node = catalog[id];

    if (node) {
        if (node.children) {
            for (let i = 0, ii = node.children.length; i < ii; i++) {
                const child = catalog[node.children[i]];
                if (child.children) {
                    found = found.concat(getAllChildLayers(catalog, node.children[i], found));
                } else {
                    found = found.concat([child]);
                }
            }
        } else {
            found = found.concat([id]);
        }
    }

    return found;
};

const getNeighboringLayers = (catalog, layer) => {
    // find the root of the exclusivitiy.
    let root = layer.parent;
    while (catalog[root] && catalog[root].parent && catalog[catalog[root].parent] && catalog[catalog[root].parent].multiple === false) {
        root = catalog[root].parent;
    }

    // get the all the neighboring src's
    //  as a flat array.
    let allSrcs = [];
    getAllChildLayers(catalog, root, [])
        .filter(node => node.id !== layer.id)
        .forEach(node => {
            allSrcs = allSrcs.concat(node.src);
        });

    // return the unique srcs as a list.
    return allSrcs;
};


const LayerCheckbox = props => {
    let classes = 'checkbox icon';
    if(props.layer.exclusive === true) {
        classes = 'radio icon';
    }
    if(props.on) {
        classes += ' on';
    }

    return (
        <i
            className={ classes }
            onClick={() => {
                if (props.layer.exclusive === true) {
                    const neighbors = getNeighboringLayers(props.catalog, props.layer);
                    props.onChange(!props.on, neighbors);
                } else {
                    props.onChange(!props.on);
                }
            }}
        />
    );
}


function mapStateProps(state, ownProps) {
    return {
        catalog: state.catalog,
        on: isLayerOn(state.mapSources, ownProps.layer),
    };
}

function mapDispatchProps(dispatch, ownProps) {
    return {
        onChange: (on, neighbors) => {
            const layer = ownProps.layer;
            if (layer.exclusive !== true) {
                // do toggling
                for (let s = 0, ss = layer.src.length; s < ss; s++) {
                    const src = layer.src[s];
                    dispatch(setLayerVisibility(src.mapSourceName, src.layerName, on));
                }
            } else {
                // ensure a click means turning on
                for (let s = 0, ss = layer.src.length; s < ss; s++) {
                    const src = layer.src[s];
                    dispatch(setLayerVisibility(src.mapSourceName, src.layerName, true));
                }
                // turn off all the other sources for
                //  every other layer in the group
                for (let n = 0, nn = neighbors.length; n < nn; n++) {
                    const src = neighbors[n];
                    dispatch(setLayerVisibility(src.mapSourceName, src.layerName, false));
                }
            }
        },
    }
}

export default connect(mapStateProps, mapDispatchProps)(LayerCheckbox);
