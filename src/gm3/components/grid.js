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

import { connect } from 'react-redux';

import { createQuery, changeTool, renderedResultsForQuery} from '../actions/map';

import { startService, finishService } from '../actions/service';

import * as util from '../util';

import * as uuid from 'uuid';

import { getLayerFromPath } from '../actions/mapSource';

import * as Papa from 'papaparse';

import Mark from 'markup-js';

import FileSaver from 'file-saver';

class Grid extends Component {

    constructor() {
        super();

        // configure the default state of hte sort,
        //  null means in results-order.
        this.state = {
            sortBy: null,
            sortAs: 'string',
            sortAsc: true
        };

        this.nextSort = this.nextSort.bind(this);
    }

    nextSort(column) {
        // rotate to the next sort type
        if(this.state.sortBy === column.property) {
            // when sorted ascending, go to descending
            if(this.state.sortAsc) {
                this.setState({sortAsc: false});
            // if the sort is descending already, go
            //  back to a neutral state
            } else {
                this.setState({sortBy: null, sortAsc: true});
            }
        } else {
            let sort_as = column.sortAs ? column.sortAs : 'string';
            this.setState({sortBy: column.property, sortAsc: true, sortAs: sort_as} );
        }
    }

    getHeaderRow(results, headerConf) {
        let header_cells = [];
        let col_id = 0;
        for(let column_def of headerConf) {
            let sort_tool = null; 
            let sort_classes = 'results-sort-icon';
            let sort_title = 'Click to sort';

            if(column_def.sortAs) {
                if(this.state.sortBy === column_def.property) {
                    if(this.state.sortAsc) {
                        sort_classes += ' asc';
                    } else {
                        sort_classes += ' desc';
                    }
                }
                sort_tool = (<i title={ sort_title } onClick={ () => { this.nextSort(column_def); } } className={ sort_classes }></i>);
            }

            header_cells.push((<th key={'col' + col_id} >{ column_def.title } {sort_tool}</th>));
            col_id++;
        }
        return header_cells;
    }

    sortResults(results) {
        let sorted_results = [].concat(results);

        let sort_col = this.state.sortBy;
        let sort_asc = this.state.sortAsc; 
        let sort_as = this.state.sortAs;

        sorted_results.sort(function(a, b) {
            let value_a = a.properties[sort_col];
            let value_b = b.properties[sort_col];
            if(sort_as === 'number') {
                value_a = parseFloat(value_a);
                value_b = parseFloat(value_b);
            }
            if(sort_asc) {
                return (value_a > value_b) ? 1 : -1;
            }
            return (value_a > value_b) ? -1 : 1;
        });
        return sorted_results;
    }

    getRows(results, rowTemplate) {
        let sorted_rows = results;
        // check to see if there is a sort function
        if(this.state.sortBy !== null ) {
            sorted_rows = this.sortResults(results);
        }

        let html = '';
        for(let feature of sorted_rows) {
            html += Mark.up(rowTemplate, feature, util.FORMAT_OPTIONS);
        }

        return {__html: html};
    }

    resultsAsCSV(gridCols, features) {
        let attributes = [];
        let feature_data = [];

        // get the export columns
        for(let column of gridCols) {
            if(column.property) {
                attributes.push(column.property);
            }
        }

        // add the 'header' row with the attribute names
        feature_data.push(attributes);

        // for each feature, create a row.
        for(let feature of features) {
            let row = [];
            for(let attr of attributes) {
                row.push(feature.properties[attr]);
            }
            feature_data.push(row);
        }

        // create the data
        let csv_blob = new Blob([Papa.unparse(feature_data)], {type: 'text/csv;charset=utf-8'});

        // create a unique string
        let uniq = '' + (new Date()).getTime();
        const csv_name = 'download_' + uniq + '.csv';

        // now have FileSaver 'normalize' how to do a save-as.
        FileSaver.saveAs(csv_blob, csv_name);
    }

    render() {
        // contains the cells for the header row
        const header_row = [];

        let features = null;

        let grid_cols = null, grid_row = null;

        // only render the first query.
        const query_id = this.props.queries.order[0];
        if(query_id) {
            let query = this.props.queries[query_id];
            if(query.progress === 'finished') {
                let layer_path = Object.keys(query.results)[0];
                let layer = null;
                try {
                    layer = getLayerFromPath(this.props.store, layer_path);
                } catch(err) {
                    // no layer, no problem.
                }

                if(layer !== null) {
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
                        // console.error(layer_path + ' does not have gridColumns or gridRow templates.');
                    }
                }
            }
        }
        
        // render the empty string if there is nothing to show.
        if(features === null || features.length === 0) {
            return null;
        }

        return (
            <div className="gm-grid">
                <div className="toolbar">
                    <i onClick={ () => { this.resultsAsCSV(grid_cols, features) } }className="results-download-icon" title="Download results as CSV"></i>
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
