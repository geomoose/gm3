/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan 'Ducky' Little
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

import React, { Component } from 'react';

import { connect } from 'react-redux';

import { getLegend } from '../map';

import { isLayerOn } from '../../util';

class CatalogLegend extends Component {

    constructor(props) {
        super(props);

        this.renderLegend = this.renderLegend.bind(this);
    }

    htmlLegend(html) {
        return {__html: html};
    }

    renderLegend(src) {
        const legend = getLegend(
            this.props.mapSources[src.mapSourceName],
            this.props.mapView,
            src.layerName
        );

        const key = 'legend_' + src.mapSourceName + '_' + src.layerName;
        let legend_idx = 0;

        switch(legend.type) {
            case 'html':
                return (
                    <div
                        key={key}
                        className='legend-html'
                        dangerouslySetInnerHTML={this.htmlLegend(legend.html)}
                    />
                );
            case 'img':
                const img_tags = [];
                legend_idx = 0;
                for(const img_src of legend.images) {
                    img_tags.push((<img alt='layer legend' key={key + legend_idx} className='legend-image' src={img_src}/>));
                    legend_idx += 1;
                }
                return (<div key={key} className='legend-images'> { img_tags } </div>);
            case 'nolegend':
            default:
                // no legend, no DOM'ing.
                return false;
        }
    }

    render() {
        // check to see if there are any layers on in the
        // map-source
        const layer = this.props.layer;

        // short the rendering a legend if the layer
        // is not on.
        if(!isLayerOn(this.props.mapSources, layer)) {
            return false;
        }

        // put a legend on it.
        return (<div className='catalog-legend'>
            { layer.src.map(this.renderLegend) }
        </div>);
    }
}


const mapCatalogToProps = function(store) {
    return {
        mapSources: store.mapSources,
        mapView: store.map
    }
}


export default connect(mapCatalogToProps)(CatalogLegend);
