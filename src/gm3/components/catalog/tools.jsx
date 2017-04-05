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


import React, {Component, PropTypes } from 'react';

import * as msActions from '../../actions/mapSource';
import * as mapActions from '../../actions/map';

/** Upload features to a vector layer from a file
 *  on the user's hard drive.
 *
 *  Currently supports KML and GeoJSON.
 *
 */
export class UploadTool extends Component {

    constructor() {
        super();
        this.startUpload = this.startUpload.bind(this); 
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

    startUpload() {
        // open the upload dialog.
        this.refs.fileInput.click();

        // setup the response function that will read
        //   the upload and add it to the layer.
        this.refs.fileInput.onchange = (evt) => {
            this.parseFiles();
        };
    }

    render() {
        let tip = 'Add features from file';
        return (
            <i className='upload tool' onClick={this.startUpload} title={tip}>
                <input ref='fileInput' className='hide' type='file'/>
            </i>
        );
    }
}

/** Generic class for basic "click this, do this" tools.
 */
class Tool extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);

        this.tip = 'Unset tooltop';

        this.iconClass = 'tool';
    }

    onClick() {
    }

    render() {
        return (
            <i className={this.iconClass} onClick={this.onClick} title={this.tip}></i>
        );
    }
}

/** Clears features from a vector layer. 
 *
 */
export class ClearTool extends Tool {
    constructor() {
        super();
        this.tip = 'Clear all features from layer';
        this.iconClass = 'clear tool';
    }

    onClick() {
        let src = this.props.layer.src[0];
        this.props.store.dispatch(
            msActions.clearFeatures(src.mapSourceName, src.layerName));
    }
}

/* Draw a point on the map.
 *
 */
export class DrawTool extends Tool {
    constructor(props) {
        super(props);

        this.tip = 'Add a ' + props.drawType + ' to the layer';
        this.iconClass = props.drawType + ' tool';
        this.drawType = {
            'point': 'Point',
            'line': 'LineString',
            'polygon': 'Polygon'
        }[props.drawType];
    }

    onClick() {
        let src = this.props.layer.src[0];
        let path = src.mapSourceName + '/' + src.layerName;

        this.props.store.dispatch(
            mapActions.changeTool(this.drawType, path)
        );
    }
}
