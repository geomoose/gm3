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
import { withTranslation, useTranslation } from 'react-i18next';
import { TableVirtuoso } from 'react-virtuoso';

import {unparse as writeCsv} from 'papaparse';
import Mark from 'markup-js';
import FileSaver from 'file-saver';

import {FORMAT_OPTIONS, matchFeatures} from '../util';

import { addFilter, removeFilter } from '../actions/query';
import { getLayerFromPath } from '../actions/mapSource';

import { getQueryResults } from '../selectors/query';
import { SERVICE_STEPS } from '../reducers/query';

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
            // undefined causes challenges for the filter generator
            //  this normalizes querying for an undefined value.
            if (value.indexOf(undefined) >= 0) {
                let nextFilter = ['==', ['coalesce', ['get', property], ''], ''];
                if (value.length > 1) {
                    nextFilter = [
                        'any',
                        nextFilter,
                        ['in', ['get', property]].concat(value.filter(x => x !== undefined)),
                    ];
                }
                new_filters.push(nextFilter);
            } else {
                new_filters.push(['in', property].concat(value));
            }
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
            removeFilter(property)
        );

        // add the new filters.
        for(const new_filter of new_filters) {
            // add/update this filter.
            this.props.store.dispatch(
                addFilter(new_filter)
            );
        }
    }

    close(status) {
        if(status === 'set') {
            this.setFilter();
        } else if (status === 'clear') {
            // remove the filter from the query
            this.props.store.dispatch(
                removeFilter(this.props.column.property)
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

        const prop = this.props.column.property;
        const selectedValues = [];

        let orderedValues = [];
        if (props.column.filter.values) {
            orderedValues = props.column.filter.values;
        } else {
            // get the values from the dataset.
            for (let i = 0, ii = this.props.results.length; i < ii; i++) {
                const result = this.props.results[i];
                const value = result.properties[prop];

                if (orderedValues.indexOf(value) < 0) {
                    orderedValues.push(value);
                    selectedValues[orderedValues.length - 1] = true;
                }
            }
        }

        // value is an array for list types.
        this.state = {
            value: [...orderedValues],
            orderedValues,
            selectedValues,
        };
    }

    renderBody() {
        const isChecked = value =>
            this.state.selectedValues[value] === true;

        const toggleSelected = value => {
            const nextSelected = {
                ...this.state.selectedValues,
                [value]: !this.state.selectedValues[value],
            };

            const nextValue = [];
            for (const key in nextSelected) {
                if (nextSelected[key] === true) {
                    nextValue.push(this.state.orderedValues[parseInt(key, 10)]);
                }
            }

            this.setState({
                ...this.state,
                selectedValues: nextSelected,
                value: nextValue,
            });
        };

        return (
            <div>
                {this.state.orderedValues.map((value, valueIdx) => (
                    <div
                        key={value ? value : 'empty'}
                        className="checkbox"
                        onClick={() => {
                            toggleSelected(valueIdx);
                        }}
                    >
                        <i
                            className={`icon checkbox ${isChecked(valueIdx) ? 'on' : ''}`}
                        />
                        {value ? value : '(empty)'}
                    </div>
                ))}
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
        return headerConf.map((columnDef, colIdx) => {
            let sortTool = null;
            let sortClasses = 'icon sort';

            if (columnDef.sortAs) {
                const sortTitle = this.props.t('filter-sort');
                if (this.state.sortBy === columnDef.property) {
                    sortClasses += this.state.sortAsc ? ' asc' : ' desc';
                }
                sortTool = (<i title={sortTitle} onClick={() => { this.nextSort(columnDef); }} className={sortClasses}></i>);
            }

            return (
                <th key={`col${colIdx}`} >{columnDef.title} {sortTool}{' '}
                    <ColumnFilter
                        store={this.props.store}
                        column={columnDef}
                        results={results}
                    />
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
    mapSources: state.mapSources,
});

export default connect(mapStateToProps)(withTranslation()(Grid));
