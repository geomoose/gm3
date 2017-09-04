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

import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import FileSaver from 'file-saver';

import Modal from '../../modal';

import KMLFormat from 'ol/format/kml';
import GeoJSONFormat from 'ol/format/geojson';

import proj from 'ol/proj';

import { matchFeatures } from '../../../util';


/* Present the user with a helpful modal dialog
 * for downloading their data to the map.
 */
class DownloadModal extends Modal {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);

        this.state = Object.assign({}, this.state, {
            downloadFormat: 'kml'
        });
    }

    close(status) {
        if(status === 'download') {
            this.download();
        }
        this.setState({open: false});
    }

    download() {
        let filename = 'geomoose_' + (new Date()).getTime();
        filename += '.' + this.state.downloadFormat;

        // TODO: Sniff the real map projection
        const map_proj = 'EPSG:3857';

        const input_format = new GeoJSONFormat();

        let output_format = new GeoJSONFormat();
        let output_mimetype = 'application/vnd.geo+json';
        if(this.state.downloadFormat === 'kml') {
            output_format = new KMLFormat();
            output_mimetype = 'application/vnd.google-earth.kml+xml';
        }

        // feature source.
        const src = this.props.layer.src[0];
        const map_source = this.props.store.getState().mapSources[src.mapSourceName];

        // find the layer and check to see if it has features,
        //  if features is undefined, then just return an empty collection.
        let features = map_source.features;

        // check to see if there is a filter on the specified layer
        let filter = null;
        for(let i = 0, ii = map_source.layers.length; filter === null && i < ii; i++) {
            const layer = map_source.layers[i];
            if(layer.name === src.layerName && layer.filter !== null) {
                filter = layer.filter;
            }
        }

        // if a filter is found on the layer,
        // then ensure only those features are matched.
        if(filter !== null) {
            features = matchFeatures(features, filter);
        }

        // fake a feature collection for parsing purposes.
        const parsed_features = input_format.readFeatures({
            type: 'FeatureCollection', features: features
        }, {
            dataProjection: proj.get(map_proj),
            featureProjection: proj.get('EPSG:4326')
        });

        // write the contents out
        const output_contents = output_format.writeFeatures(parsed_features);
        // convert to a blob
        const output_blob = new Blob([output_contents], {type: output_mimetype});
        // and BOOM! out to file saver.
        FileSaver.saveAs(output_blob, filename);
    }

    onChange(evt) {
        this.setState({downloadFormat: evt.target.value});
    }

    renderBody() {
        // TODO: I'd really like this to use radio buttons more
        //       similar to the ones that are used for drawing tools.
        return (
            <div>
                <p>
                    { this.props.helpText }
                </p>
                <p>
                    <label>Download format: </label>
                    <select value={ this.state.downloadFormat } onChange={ this.onChange }>
                        <option value="geojson">GeoJSON</option>
                        <option value="kml">KML</option>
                    </select>
                </p>
            </div>
        );
    }

}

// setup the default prop options for the modal dialog.
DownloadModal.defaultProps = {
    title: 'Download layer',
    helpText: 'Choose a format then click "Okay" to download layer features in that format.',
    options: [
        {label: 'Cancel', value: 'dismiss'},
        {label: 'Okay', value: 'download'}
    ]
};

/** Download features to a vector layer from a file
 *  on the user's hard drive.
 *
 *  Currently supports KML and GeoJSON.
 *
 */
export class DownloadTool extends Component {

    constructor() {
        super();
        this.showModal = this.showModal.bind(this);
    }

    showModal() {
        this.refs.download_modal.setState({open: true});
    }

    render() {
        let tip = 'Download features to a file';
        return (
            <span>
                <i className='download icon' onClick={this.showModal} title={tip}>
                    <input ref='fileInput' className='hide' type='file'/>
                </i>
                <DownloadModal store={this.props.store} layer={this.props.layer} ref='download_modal' />
            </span>
        );
    }
}
