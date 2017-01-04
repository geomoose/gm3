/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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

import { createQuery, changeTool, renderedResultsForQuery} from '../actions/map';

import { startService, finishService } from '../actions/service';

import * as util from '../util';

import * as uuid from 'uuid';

import { getLayerFromPath } from '../actions/mapSource';

import Mark from 'markup-js';
class Grid extends Component {

    constructor() {
        super();
    }

    getHeaderRow(results, headerConf) {
        let header_cells = [];
        let col_id = 0;
        for(let column_def of headerConf) {
            header_cells.push((<th key={'col' + col_id} >{ column_def.title }</th>));
            col_id++;
        }
        return header_cells;
    }

    getRows(results, rowTemplate) {
        let rows = [];

        let html = '';
        for(let feature of results) {
            html += Mark.up(rowTemplate, feature, util.FORMAT_OPTIONS);
        }

        return {__html: html};
    }

    render() {
        // contains the cells for the header row
        const header_row = [];

        let features = null;

        let grid_cols = null, grid_row = null;

        // only render the first query.
        //const query_id = this.props.queries.order[0];
        for(let query_id of this.props.queries.order) {
            let query = this.props.queries[query_id];
            if(query.progress == 'finished') {
                let layer_path = Object.keys(query.results)[0];
                let layer = getLayerFromPath(this.props.store, layer_path);

                // try to parse the grid columns
                try {
                    grid_cols = JSON.parse(layer.templates.gridColumns);
                } catch(err) {
                    // swallow the error
                }

                if(layer.templates.gridRow) {
                    grid_row = layer.templates.gridRow;
                }

                if(grid_cols !== null && grid_row !== null) {
                    // render as a grid.
                    features = query.results[layer_path];
                } else {
                    console.error(layer_path + ' does not have gridColumns or gridRow templates.');
                }
            }
        }
        
        // render the empty string if there is nothing to show.
        if(features === null || features.length == 0) {
            return null;
        }

        return (
            <div className="gm-grid">
                <div className="toolbar">
                    
                </div>
                <div className="grid-display">
                    <table>
                        <thead>
                            <tr>
                                { this.getHeaderRow(features, grid_cols) }
                            </tr>
                        </thead>
                        <tbody dangerouslySetInnerHTML={this.getRows(features, grid_row)}>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

const mapToProps = function(store) {
    return {
        queries: store.query
    }
}
export default connect(mapToProps)(Grid);
