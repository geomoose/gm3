/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Dan "Ducky" Little
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
import { withTranslation } from 'react-i18next';
import { TableVirtuoso } from 'react-virtuoso';

import {unparse as writeCsv} from 'papaparse';
import Mark from 'markup-js';
import FileSaver from 'file-saver';

import {FORMAT_OPTIONS, matchFeatures} from '../../util';

import { getLayerFromPath } from '../../actions/mapSource';

import { getFlatResults, getQueryResults } from '../../selectors/query';
import { SERVICE_STEPS } from '../../reducers/query';

import FilterModal from './filter-modal';

/* Renders query results as a table that can be sorted, filtered,
 * and downloaded as a CSV file.
 *
 */
class Grid extends React.Component {

    constructor() {
        super();

        // configure the default state of the sort,
        //  null means in results-order.
        this.state = {
            sortBy: null,
            sortAs: 'string',
            sortAsc: true,
            minimized: false,
            filterModal: null,
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
            const sort_as = column.sortAs ? column.sortAs : 'string';
            this.setState({sortBy: column.property, sortAsc: true, sortAs: sort_as} );
        }
    }

    getHeaderRow(results, headerConf) {
        return headerConf.map((columnDef, colIdx) => {
            let sortTool = false;
            let filterControl = false;
            let sortClasses = 'icon sort';

            if (columnDef.sortAs) {
                const sortTitle = this.props.t('filter-sort');
                if (this.state.sortBy === columnDef.property) {
                    sortClasses += this.state.sortAsc ? ' asc' : ' desc';
                }
                sortTool = (<i title={sortTitle} onClick={() => { this.nextSort(columnDef); }} className={sortClasses}></i>);
            }

            if (columnDef.filter) {
                // TODO: Get a translation friendly title attribute
                filterControl = (
                    <i
                        title='Filter'
                        onClick={() => {
                            this.setState({
                                filterModal: columnDef,
                            });
                        }}
                        className='filter icon'
                    />
                );
            }

            return (
                <th key={`col${colIdx}`} >{columnDef.title} {sortTool}{' '}
                    {filterControl}
                </th>
            );
        });
    }

    sortResults(results) {
        const collator = Intl.Collator();
        const sorted_results = [].concat(results);

        const sort_col = this.state.sortBy;
        const sort_asc = this.state.sortAsc;
        const sort_as = this.state.sortAs;

        sorted_results.sort((a, b) => {
            let value_a = a.properties[sort_col];
            let value_b = b.properties[sort_col];
            if (sort_as === 'number') {
                value_a = parseFloat(value_a);
                value_b = parseFloat(value_b);
                if (sort_asc) {
                    return value_a < value_b ? -1 : 1;
                }
                return value_b < value_a ? -1 : 1;
            }
            if (sort_asc) {
                return collator.compare(value_a, value_b);
            }
            return collator.compare(value_b, value_a);
        });
        return sorted_results;
    }

    getRow(result, rowTemplate) {
        const html = Mark.up(rowTemplate, result, FORMAT_OPTIONS);
        // WARNING! If odd grid errors show up with row rendering,
        //          start here!
        // This code is potentially fragile but keeps the table
        //  templates backwards compatible.
        const strippedHTML = html.substring(html.indexOf('<td'), html.lastIndexOf('</td>') + 5);
        // get the contents of the "<td>" cells
        const tmpElement = document.createElement('tr');
        tmpElement.innerHTML = strippedHTML;
        const cells = tmpElement.getElementsByTagName('td');
        const elements = [];

        for (let i = 0, ii = cells.length; i < ii; i++) {
            elements.push(
                <td key={`cell-${i}`} dangerouslySetInnerHTML={{__html: cells[i].innerHTML}} />
            );
        }
        return elements;
    }

    resultsAsCSV(gridCols, features) {
        const attributes = [];
        const feature_data = [];

        // get the export columns
        for(const column of gridCols) {
            if(column.property) {
                attributes.push(column.property);
            }
        }

        // add the 'header' row with the attribute names
        feature_data.push(attributes);

        // for each feature, create a row.
        for(const feature of features) {
            const row = [];
            for(const attr of attributes) {
                row.push(feature.properties[attr]);
            }
            feature_data.push(row);
        }

        // create the data
        const csv_blob = new Blob([writeCsv(feature_data)], {type: 'text/csv;charset=utf-8'});

        // create a unique string
        const uniq = '' + (new Date()).getTime();
        const csv_name = 'download_' + uniq + '.csv';

        // now have FileSaver 'normalize' how to do a save-as.
        FileSaver.saveAs(csv_blob, csv_name);
    }

    render() {
        const query = this.props.query;

        let features = [];
        let display_table = false;

        let grid_cols, grid_row;

        if (query.step === SERVICE_STEPS.RESULTS) {
            const service = this.props.services[query.serviceName];
            const serviceName = service.alias || service.name;
            const paths = Object.keys(query.results);
            paths.forEach(layerPath => {
                let layer = null;
                try {
                    layer = getLayerFromPath(this.props.mapSources, layerPath);
                } catch(err) {
                    // no layer, no problem.
                }

                if(layer !== null) {
                    const columnTemplate = layer.templates[serviceName + '-grid-columns']
                        || layer.templates.gridColumns;

                    // try to parse the grid columns
                    if (columnTemplate && typeof columnTemplate.contents === 'object') {
                        grid_cols = columnTemplate.contents;
                    } else {
                        try {
                            grid_cols = JSON.parse(columnTemplate.contents);
                        } catch(err) {
                            // swallow the error
                        }
                    }

                    const rowTemplate = layer.templates[serviceName + '-grid-row']
                        || layer.templates.gridRow;

                    if (rowTemplate) {
                        grid_row = rowTemplate.contents;
                    }

                    if(grid_cols && grid_row) {
                        // render as a grid.
                        features = matchFeatures(query.results[layerPath], query.filter);
                        if(query.results[layerPath].length > 0) {
                            display_table = true;
                        }
                    } else {
                        // console.error(layerPath + ' does not have gridColumns or gridRow templates.');
                    }
                }
            });
        }

        // render the empty string if there is nothing to show.
        if(!display_table) {
            return false;
        }

        if (this.state.sortBy !== null ) {
            features = this.sortResults(features);
        }

        // when minimized, show the maximize button.
        const min_btn_class = this.state.minimized ? 'maximize' : 'minimize';
        const grid_class = this.state.minimized ? 'hide' : '';
        const toggle_grid = () => {
            this.setState({minimized: !this.state.minimized});
        };

        return (
            <div className='gm-grid'>
                {this.state.filterModal && (
                    <FilterModal
                        store={this.props.store}
                        column={this.state.filterModal}
                        filters={this.props.filters}
                        results={this.props.allResults}
                        onClose={() => this.setState({filterModal: null})}
                    />
                )}
                <div className='toolbar'>
                    <span
                        onClick={ () => { this.resultsAsCSV(grid_cols, features) } }
                        className={'tool download'}
                        title={ this.props.t('grid-download-csv')}
                    >
                        <i className='icon download'></i>
                    </span>
                    <span
                        onClick={ toggle_grid }
                        className={'tool ' + min_btn_class}
                        title={ this.props.t('grid-min-max') }
                    >
                        <i className={'icon ' + min_btn_class}></i>
                    </span>
                </div>

                <TableVirtuoso
                    style={{height: 400}}
                    data={features}
                    fixedHeaderContent={(index, feature) => {
                        return (
                            <tr>{this.getHeaderRow(features, grid_cols)}</tr>
                        );
                    }}
                    itemContent={(index, feature) => (
                        this.getRow(feature, grid_row, grid_cols)
                    )}
                />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    query: state.query,
    results: getQueryResults(state),
    allResults: getFlatResults(state),
    mapSources: state.mapSources,
    filters: state.query.filter,
});

export default connect(mapStateToProps)(withTranslation()(Grid));
