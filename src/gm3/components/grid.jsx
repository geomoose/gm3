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

import { createQuery, changeTool, renderedResultsForQuery, addFilter, removeFilter } from '../actions/map';

import { startService, finishService } from '../actions/service';

import ModalDialog from './modal';

import * as util from '../util';

import * as uuid from 'uuid';

import { getLayerFromPath } from '../actions/mapSource';

import * as Papa from 'papaparse';

import Mark from 'markup-js';

import FileSaver from 'file-saver';


class FilterModal extends ModalDialog {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);

        this.state = {
            value: ''
        };
    }

    onChange(evt) {
        this.setState({value: evt.target.value});
    }

    setFilter() {
        const value = this.state.value;
        const property = this.props.column.property;

        const new_filters = [];

        if(this.props.column.filter.type === 'list') {
            new_filters.push(["in", property].concat(value));
        } else if(this.props.column.filter.type === 'range') {
            if(this.state.min !== '') {
                new_filters.push([">=", property, this.state.min]);
            }
            if(this.state.max !== '') {
                new_filters.push(["<=", property, this.state.max]);
            }
        } else {
            // straight equals...
            new_filters.push(["==", property, value]);
        }

        // remove the filters from the property
        this.props.store.dispatch(
            removeFilter(this.props.queryId, property)
        );

        // add the new filtres.
        for(const new_filter of new_filters) {
            // add/update this filter.
            this.props.store.dispatch(
                addFilter(this.props.queryId, new_filter)
            );
        }
    }

    close(status) {
        if(status === 'set') {
            this.setFilter();
        } else if (status === 'clear') {
            // remove the filter from the query
            this.props.store.dispatch(
                removeFilter(this.props.queryId, this.props.column.property)
            );
            if(this.props.column.filter.type === 'list') {
                const all_values = [];
                for(const opt of this.filter_values) {
                    all_values.push(opt.value);
                }
                this.setState({value: all_values});
            } else if(this.props.column.filter.type === 'range') {
                this.setState({min: '', max: ''});
            } else {
                this.setState({value: ''});
            }
        }
        this.setState({open: false});
    }

    getTitle() {
        return 'Set filter for ' + this.props.column.title;
    }

    getOptions() {
        return [
            {label: 'Cancel', value: 'dismiss'},
            {label: 'Clear', value: 'clear'},
            {label: 'Set', value: 'set'},
        ];
    };

    renderBody() {
        return (
            <div>
                <label>Value:</label> <input onChange={ this.onChange } value={ this.state.value } ref='input'/>
            </div>
        );
    }
}


/* Creates a settings Modal for lists of values.
 *
 * Each list option is rendered as a checkbox.
 *
 */
class ListFilterModal extends FilterModal {

    constructor(props) {
        super(props);

        const filter_def = props.column.filter;

        this.filter_values = [];

        // when "values" is set in the column's
        // filter property, that is expected to be an enumerated
        // list of values for picking-and-choosing.
        if(filter_def.values) {
            this.filter_values = filter_def.values;
        } else {
            const prop = this.props.column.property;
            // when the values are not specified they need
            // to be pulled from the results.
            const uniq_check = {};
            for(const result of this.props.results) {
                const v = result.properties[prop];
                if(uniq_check[v] !== true) {
                    this.filter_values.push({
                        value: v, label: v
                    });
                }
                uniq_check[v] = true;
            }
        }

        // everything is checked by default
        const value = [];
        for(const f of this.filter_values) {
            value.push(f.value);
        }


        // value is an array for list types.
        this.state = {
            value: value
        };
    }

    /* onChange handles removing and adding the
     * appropriate settings from the checkboxes.
     */
    onChange(evt) {
        const target = evt.target;
        const new_values = this.state.value.slice();

        if(target.checked) {
            new_values.push(target.value);
            this.setState({value: new_values});
        } else {
            const val_pos = new_values.indexOf(target.value);
            if(val_pos >= 0) {
                new_values.splice(val_pos, 1);
            }
        }
        this.setState({value: new_values});
    }

    /* Determine whether a checkbox should be checked or not.
     */
    isChecked(value) {
        return (this.state.value.indexOf(value) >= 0);
    }

    renderBody() {
        const filter_def = this.props.column.filter;

        // now convert the filter_values into
        //  proper dom elements.
        const settings = [];

        for(let i = 0, ii = this.filter_values.length; i < ii; i++) {
            const val = this.filter_values[i];
            settings.push((
                <div key={ 'key' + i }>
                    <input type="checkbox"
                        value={ val.value }
                        checked={ this.isChecked(val.value) }
                        onChange={ this.onChange } />
                    { val.label }
                </div>
            ));
        }

        return (
            <div>
                { settings }
            </div>
        );
    }
}

/* Handle creating value ranges.
 *
 * Present the user with a min and max field to set
 * a range on a field.
 *
 */
class RangeFilterModal extends FilterModal {
    constructor(props) {
        super(props);

        this.setMax = this.setMax.bind(this);
        this.setMin = this.setMin.bind(this);

        this.state = {
            min: '', max: ''
        }
    }

    setBound(side, value) {
        const bounds = {};
        if(value !== '') {
            bounds[side] = parseFloat(value);
        } else {
            bounds[side] = '';
        }
        this.setState(bounds);
    }

    setMin(evt) {
        this.setBound('min', evt.target.value);
    }

    setMax(evt) {
        this.setBound('max', evt.target.value);
    }

    renderBody() {
        return (
            <div>
                <div>
                    <label>Min:</label>
                    <input value={this.state.min} onChange={ this.setMin }/>
                </div>

                <div>
                    <label>Max:</label>
                    <input value={this.state.max} onChange={ this.setMax}/>
                </div>
            </div>
        );
    }
}

/* Provides a control for filtering a column's values.
 */
class ColumnFilter extends Component {

    showFilterDialog() {
        this.refs.modal.setState({open: true});
    }

    render() {
        // if there is no filter or the filter is set to false,
        // then do not present filtering as an option
        if(!this.props.column.filter) {
            return false;
        }

        let modal = false;
        const filter_type = this.props.column.filter.type;

        switch(this.props.column.filter.type) {
            case 'list':
                modal = (
                    <ListFilterModal ref='modal'
                       column={this.props.column}
                       results={this.props.results}
                       store={this.props.store} queryId={this.props.queryId} />
                );
                break;
            case 'range':
                modal = (
                    <RangeFilterModal ref='modal'
                       column={this.props.column}
                       results={this.props.results}
                       store={this.props.store} queryId={this.props.queryId} />
                );
                break;
            default:
                modal = (
                    <FilterModal ref='modal'
                       column={this.props.column}
                       results={this.props.results}
                       store={this.props.store} queryId={this.props.queryId} />
                );
        }


        const filter_title = 'filter';
        return (
            <span>
                <i title={ filter_title}
                   onClick={ () => { this.showFilterDialog() } } className="filter icon"></i>
                { modal }
            </span>
        );
    }
}

/* Renders query results as a table that can be sorted, filtered,
 * and downloaded as a CSV file.
 *
 */
class Grid extends Component {

    constructor() {
        super();

        // configure the default state of hte sort,
        //  null means in results-order.
        this.state = {
            sortBy: null,
            sortAs: 'string',
            sortAsc: true,
            minimized: false,
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

        // grid always handles the first query.
        let query_id = this.props.queries.order[0];

        for(let column_def of headerConf) {
            let sort_tool = null;
            let sort_classes = 'icon sort';
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

            let filter = (
                <ColumnFilter store={ this.props.store } column={ column_def }
                              results={results} queryId={ query_id } />
            );

            header_cells.push((<th key={'col' + col_id} >{ column_def.title } {sort_tool} {filter} </th>));
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
        let display_table = false;

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
                    if(typeof layer.templates.gridColumns.contents === 'object') {
                        grid_cols = layer.templates.gridColumns.contents;
                    } else {
                        try {
                            grid_cols = JSON.parse(layer.templates.gridColumns.contents);
                        } catch(err) {
                            // swallow the error
                        }
                    }

                    if(layer.templates.gridRow) {
                        grid_row = layer.templates.gridRow.contents;
                    }

                    if(grid_cols !== null && grid_row !== null) {
                        // render as a grid.
                        features = util.matchFeatures(query.results[layer_path], query.filter);
                        if(query.results[layer_path].length > 0) {
                            display_table = true;
                        }
                    } else {
                        // console.error(layer_path + ' does not have gridColumns or gridRow templates.');
                    }
                }
            }
        }

        // render the empty string if there is nothing to show.
        if(!display_table) {
            return null;
        }

        // when minimized, show the maximize button.
        const min_btn_class = this.state.minimized ? 'maximize' : 'minimize';
        const grid_class = this.state.minimized ? 'hide' : '';
        const toggle_grid = () => {
            this.setState({minimized: !this.state.minimized});
        };

        return (
            <div className="gm-grid">
                <div className="toolbar">
                    <button onClick={ () => { this.resultsAsCSV(grid_cols, features) } }
                      className={'tool download'}
                      title="Download results as CSV">
                        <i className="icon download"></i>
                    </button>
                    <button onClick={ toggle_grid } className={'tool ' + min_btn_class}
                      title='Min/Maximize Grid'>
                        <i className={'icon ' + min_btn_class}></i>
                    </button>
                </div>
                <div className={'grid-display ' + grid_class}>
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
