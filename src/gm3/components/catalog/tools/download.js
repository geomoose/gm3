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

import React, {useState} from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import FileSaver from 'file-saver';

import KMLFormat from 'ol/format/KML';
import GeoJSONFormat from 'ol/format/GeoJSON';
import * as Proj from 'ol/proj';

import { Tool } from '../tools';
import Modal from '../../modal';

import { matchFeatures } from '../../../util';


function doDownload(features, downloadFormat) {
    let filename = 'geomoose_' + (new Date()).getTime();
    filename += '.' + downloadFormat;

    // TODO: Sniff the real map projection
    const map_proj = 'EPSG:3857';

    const input_format = new GeoJSONFormat();

    let output_format = new GeoJSONFormat();
    let output_mimetype = 'application/vnd.geo+json';
    if(downloadFormat === 'kml') {
        output_format = new KMLFormat();
        output_mimetype = 'application/vnd.google-earth.kml+xml';
    }
    // fake a feature collection for parsing purposes.
    const parsed_features = input_format.readFeatures({
        type: 'FeatureCollection', features: features
    }, {
        dataProjection: Proj.get(map_proj),
        featureProjection: Proj.get('EPSG:4326')
    });

    // write the contents out
    const output_contents = output_format.writeFeatures(parsed_features);
    // convert to a blob
    const output_blob = new Blob([output_contents], {type: output_mimetype});
    // and BOOM! out to file saver.
    FileSaver.saveAs(output_blob, filename);
}


/** Download features to a vector layer from a file
 *  on the user's hard drive.
 *
 *  Currently supports KML and GeoJSON.
 *
 */
export const DownloadTool = ({layer, mapSources, onDownload}) => {
    const [downloadFormat, setFormat] = useState('kml');
    const [modalOpen, setModalOpen] = useState(false);
    const {t} = useTranslation();

    return (
        <React.Fragment>
            <Tool
                tip='download-features-tip'
                iconClass='download'
                onClick={() => {
                    setModalOpen(true);
                }}
            />
            { !modalOpen ? false : (
                <Modal
                    open
                    title='download-features'
                    options={[
                        {label: 'Cancel', value: 'dismiss'},
                        {label: 'Okay', value: 'download'}
                    ]}
                    onClose={(opt) => {
                        if(opt === 'download') {
                            const src = layer.src[0];
                            const map_source = mapSources[src.mapSourceName];
                            onDownload(src, map_source, downloadFormat);
                        }
                        setModalOpen(false);
                    }}
                >
                    <p>
                        { t('download-help') }
                    </p>
                    <p>
                        <label>{`${t('download-format')} `}</label>
                        <select
                            value={ downloadFormat }
                            onChange={(evt) => {
                                setFormat(evt.target.value);
                            }}
                        >
                            <option value="geojson">GeoJSON</option>
                            <option value="kml">KML</option>
                        </select>
                    </p>
                </Modal>
            )}
        </React.Fragment>
    );
}

function mapState(state) {
    return {
        mapSources: state.mapSources,
    };
}

function mapDispatch(dispatch) {
    return {
        onDownload: (src, mapSource, downloadFormat) => {
            // find the layer and check to see if it has features,
            //  if features is undefined, then just return an empty collection.
            let features = mapSource.features;

            // check to see if there is a filter on the specified layer
            let filter = null;
            for(let i = 0, ii = mapSource.layers.length; filter === null && i < ii; i++) {
                const layer = mapSource.layers[i];
                if(layer.name === src.layerName && layer.filter !== undefined) {
                    filter = layer.filter;
                }
            }

            // if a filter is found on the layer,
            // then ensure only those features are matched.
            if(filter !== null) {
                features = matchFeatures(features, filter);
            }

            doDownload(features, downloadFormat);
        },
    }
}

export default connect(mapState, mapDispatch)(DownloadTool);
