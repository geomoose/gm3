/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2020 Dan "Ducky" Little
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
import { withTranslation, useTranslation } from 'react-i18next';

import {unparse as writeCsv} from 'papaparse';
import Mark from 'markup-js';
import FileSaver from 'file-saver';

import {FORMAT_OPTIONS, matchFeatures} from '../util';

import { addFilter, removeFilter } from '../actions/map';
import { getLayerFromPath } from '../actions/mapSource';

import ModalDialog from './modal';

const Label = ({l}) => {
    const {t} = useTranslation();
    return (<label>{t(l)}</label>);
};


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
            new_filters.push(['in', property].concat(value));
        } else if(this.props.column.filter.type === 'range') {
            if(this.state.min !== '') {
                new_filters.push(['>=', property, this.state.min]);
            }
            if(this.state.max !== '') {
                new_filters.push(['<=', property, this.state.max]);
            }
        } else {
            // straight equals...
            new_filters.push(['==', property, value]);
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

        this.props.onClose();
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
                <Label l="label-value"/> <input onChange={ this.onChange } value={ this.state.value } ref='input'/>
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
        // now convert the filter_values into
        //  proper dom elements.
        const settings = [];

        for(let i = 0, ii = this.filter_values.length; i < ii; i++) {
            const val = this.filter_values[i];
            settings.push((
                <div key={ 'key' + i }>
                    <input type='checkbox'
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
                    <Label l="label-min" />
                    <input value={this.state.min} onChange={ this.setMin }/>
                </div>

                <div>
                    <Label l="label-max" />
                    <input value={this.state.max} onChange={ this.setMax}/>
                </div>
            </div>
        );
    }
}

/* Provides a control for filtering a column's values.
 */
class ColumnFilter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    render() {
        // if there is no filter or the filter is set to false,
        // then do not present filtering as an option
        if(!this.props.column.filter) {
            return false;
        }

        const onClose = () => {
            this.setState({open: false, });
        };

        let modal = false;
        switch(this.props.column.filter.type) {
            case 'list':
                modal = (
                    <ListFilterModal
                        open={this.state.open}
                        onClose={onClose}
                        ref='modal'
                        column={this.props.column}
                        results={this.props.results}
                        store={this.props.store}
                        queryId={this.props.queryId}
                    />
                );
                break;
            case 'range':
                modal = (
                    <RangeFilterModal
                        open={this.state.open}
                        onClose={onClose}
                        ref='modal'
                        column={this.props.column}
                        results={this.props.results}
                        store={this.props.store}
                        queryId={this.props.queryId}
                    />
                );
                break;
            default:
                modal = (
                    <FilterModal
                        open={this.state.open}
                        onClose={onClose}
                        ref='modal'
                        column={this.props.column}
                        results={this.props.results}
                        store={this.props.store}
                        queryId={this.props.queryId}
                    />
                );
        }


        const filter_title = 'filter';
        return (
            <span>
                <i
                    title={filter_title}
                    onClick={ () => { this.setState({open: true}) }}
                    className='filter icon'
                >
                </i>
                { modal }
            </span>
        );
    }
}

/* Renders query results as a table that can be sorted, filtered,
 * and downloaded as a CSV file.
 *
 */
class Grid extends React.Component {

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
            const sort_as = column.sortAs ? column.sortAs : 'string';
            this.setState({sortBy: column.property, sortAsc: true, sortAs: sort_as} );
        }
    }

    getHeaderRow(results, headerConf) {
        const header_cells = [];
        let col_id = 0;

        // grid always handles the first query.
        const query_id = this.props.queries.order[0];

        for(const column_def of headerConf) {
            let sort_tool = null;
            let sort_classes = 'icon sort';
            const sort_title = this.props.t('filter-sort');

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

            const filter = (
                <ColumnFilter
                    store={ this.props.store }
                    column={ column_def }
                    results={results}
                    queryId={ query_id }
                />
            );

            header_cells.push((<th key={'col' + col_id} >{ column_def.title } {sort_tool} {filter} </th>));
            col_id++;
        }
        return header_cells;
    }

    sortResults(results) {
        const sorted_results = [].concat(results);

        const sort_col = this.state.sortBy;
        const sort_asc = this.state.sortAsc;
        const sort_as = this.state.sortAs;

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
        for(const feature of sorted_rows) {
            html += Mark.up(rowTemplate, feature, FORMAT_OPTIONS);
        }

        return {__html: html};
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

    componentDidUpdate(prevProps) {
        // check to see if the grid should start open minimized.
        if (prevProps.queries.order[0] !== this.props.queries.order[0] && this.props.queries.order[0]) {
            const queryId = this.props.queries.order[0];
            const query = this.props.queries[queryId];
            if (query && query.runOptions && query.runOptions.gridMinimized === true) {
                this.setState({minimized: true});
            }
        }
    }

    render() {
        let features = [];
        let display_table = false;

        let grid_cols, grid_row;

        // only render the first query.
        const query_id = this.props.queries.order[0];
        if(query_id) {
            const query = this.props.queries[query_id];
            if(query.progress === 'finished') {
                const serviceName = query.service;
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
        }

        // render the empty string if there is nothing to show.
        if(!display_table) {
            return false;
        }

        // when minimized, show the maximize button.
        const min_btn_class = this.state.minimized ? 'maximize' : 'minimize';
        const grid_class = this.state.minimized ? 'hide' : '';
        const toggle_grid = () => {
            this.setState({minimized: !this.state.minimized});
        };

        return (
            <div className='gm-grid'>
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
        queries: store.query,
        mapSources: store.mapSources,
    }
}
export default connect(mapToProps)(withTranslation()(Grid));
