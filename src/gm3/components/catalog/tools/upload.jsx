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

import * as msActions from '../../../actions/mapSource';
import Modal from '../../modal';

/* Present the user with a helpful modal dialog
 * for uploading their data to the map.
 */
class UploadModal extends Modal {
    constructor(props) {
        super(props);
    }

    close(status) {
        if(status === 'upload') {
            this.parseFiles();
        }
        this.setState({open: false});
    }

    renderBody() {
        return (
            <div>
                <p>
                    { this.props.helpText }
                </p>
                <p>
                    <input ref='fileInput' type='file'/>
                </p>
            </div>
        );
    }

    parseFiles() {
        // grab the list of files.
        const files = this.refs.fileInput.files;

        // setup a file reader.
        const reader = new FileReader();

        // ugly closure bridge, but it let me recycle some
        //  code.
        const self = this;

        // the current implementation only uses a "single" file
        //  upload, but these leaves the door open to a multiple
        //  file functionality.
        for(let i = 0, f; f = files[i]; i++) {
            // TODO: This should probably be changed to use
            //   () => {} style functions to prevent the context change,
            //   instead of abusing "self".
            // setup a "load" event.
            reader.onload = (function(file) {
                return function(e) {
                    // geojson is always used as the output format.
                    const geojson_format = new ol.format.GeoJSON();

                    // input_format is defaulted to null and only
                    //  set if the file format can be inferred.
                    let input_format = null;
                    if(file.type.indexOf('kml') >= 0) {
                        // sweet, KML file.
                        input_format = new ol.format.KML();
                    } else {
                        // try to see if it is JSON parseable
                        try {
                            JSON.parse(e.target.result);
                            input_format = new ol.format.GeoJSON();
                        } catch(err) {
                            // swallow the exception.
                        }
                    }

                    if(input_format !== null) {
                        // parse the features.
                        let ol_features = input_format.readFeatures(e.target.result);

                        // TODO: This should be getting the map projection
                        //       from the map-view!!!
                        for(let f of ol_features) {
                            f.setGeometry(f.getGeometry().transform('EPSG:4326', 'EPSG:3857'));
                        }
                        // internal feature representation is as GeoJSON, so the parsed
                        //  ol feautures need converted here...
                        let collection = geojson_format.writeFeaturesObject(ol_features);

                        // only add features to the first layer listed in the
                        //  catalog's layer definition
                        let src = self.props.layer.src[0];
                        // kick off the event
                        self.props.store.dispatch(msActions.addFeatures(
                            src.mapSourceName, src.layerName, collection.features));

                        // TODO: Notify the user that n-number of features
                        //       were added to the layer.
                        // this.store.dispatch(createNotice('info', '...'));
                    } else {
                        // TODO: Notify the user that something has
                        //       gone terribly wrong.
                        // this.store.dispatch(createNotice('error', '...'));
                    }
                }
            })(f);

            // trigger the actual file read.
            reader.readAsText(f);
        }
    }

}

// setup the default prop options for the modal dialog.
UploadModal.defaultProps = {
    title: 'Upload data',
    helpText: 'Use the browse button to select a KML or GeoJSON file then click "Okay" to upload the features to the map.',
    options: [
        {label: 'Cancel', value: 'dismiss'},
        {label: 'Okay', value: 'upload'}
    ]
};

/** Upload features to a vector layer from a file
 *  on the user's hard drive.
 *
 *  Currently supports KML and GeoJSON.
 *
 */
export class UploadTool extends Component {

    constructor() {
        super();
        this.showModal = this.showModal.bind(this);
    }

    showModal() {
        this.refs.upload_modal.setState({open: true});
    }

    render() {
        let tip = 'Add features from file';
        return (
            <span>
                <i className='upload tool' onClick={this.showModal} title={tip}>
                    <input ref='fileInput' className='hide' type='file'/>
                </i>
                <UploadModal store={this.props.store} layer={this.props.layer} ref='upload_modal' />
            </span>
        );
    }
}



