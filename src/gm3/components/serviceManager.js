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

import React from 'react';
import { Provider, connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import { removeQuery, changeTool, zoomToExtent } from '../actions/map';
import { startService, finishService, showServiceForm } from '../actions/service';
import * as mapActions from '../actions/map';
import { clearFeatures } from '../actions/mapSource';
import { setUiHint } from '../actions/ui';
import { getExtentForQuery } from '../util';

import MeasureTool from './measure';

import ServiceForm from './serviceForm';


function normalizeSelection(selectionFeatures) {
    // OpenLayers handles MultiPoint geometries in an awkward way,
    // each feature is a 'MultiPoint' type but only contains one feature,
    //  this normalizes that in order to be submitted properly to query services.
    if(selectionFeatures.length > 0) {
        if(selectionFeatures[0].geometry.type === 'MultiPoint') {
            const all_coords = [];
            for(const feature of selectionFeatures) {
                if(feature.geometry.type === 'MultiPoint') {
                    all_coords.push(feature.geometry.coordinates[0]);
                }
            }
            return [{
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'MultiPoint',
                    coordinates: all_coords
                }
            }];
        }
    }
    return selectionFeatures;
}

class ServiceManager extends React.Component {

    constructor() {
        super();

        this.finishedQueries = {};

        this.renderQuery = this.renderQuery.bind(this);
        this.renderQueryResults = this.renderQueryResults.bind(this);

        this.state = {
            lastService: null,
            lastFeature: '',
            values: {},
        };

        this.fieldValues = {};
    }

    /** Renders the results for an individual query.
     *
     *  @param queryId the query's ID.
     *  @param query   The details of the query.
     *
     *  @returns a Hash appropriate for dnagerouslySetInnerHTML
     */
    renderQueryResults(queryId, query) {
        let html_contents = '';

        if(query.progress === 'finished' && this.props.services[query.service]) {
            const service = this.props.services[query.service];
            if(service.renderQueryResults) {
                service.renderQueryResults(queryId, query);
            }
            if(service.resultsAsHtml) {
                html_contents = service.resultsAsHtml(queryId, query);
            }
        } else if(query.progress === 'failed') {
            html_contents = 'There was an error with your query please try again.';
        } else {
            html_contents = '<i class="service spinner"></i>';
        }

        return {__html: html_contents};
    }

    /** Render queries as they are coming in.
     *
     *  @param queryId
     *
     */
    renderQuery(queryId) {
        const query = this.props.queries[queryId];

        const service = this.props.services[query.service];

        let service_title = service.resultsTitle;

        // By default show the summary, unless showSummary is explicitly
        //  set to false.
        const show_header = (service.showHeader === false) ? false : true;

        // this is a little ungangly but it will help those who
        //  forget to specify a results title.
        if(!service_title) {
            service_title = service.title + ' Results';
        }

        let layer_count = 0, feature_count = 0;
        for(const path in query.results) {
            if(query.results[path].failed !== true) {
                layer_count += 1;
                feature_count += query.results[path].length;
            }
        }

        const info_header = (
            <div className='results-info'>
                <div className='results-info-item features-count'>
                    <div className='label'>{this.props.t('features')}</div>
                    <div className='value'>{ feature_count }</div>
                </div>

                <div className='results-info-item layers-count'>
                    <div className='label'>{this.props.t('layers')}</div>
                    <div className='value'>{ layer_count }</div>
                </div>

                <div className='results-info-item zoomto'>
                    <div className='label'>{this.props.t('zoomto-results')}</div>
                    <div className='value' onClick={() => { this.props.zoomToResults(query); }}>
                        <span className='icon zoomto'></span>
                    </div>
                </div>
            </div>
        );

        return (
            <div key={queryId}>
                <div className='results-header'>
                    { this.props.t(service_title) }
                    <div className='results-tools'>
                        <i
                            title={this.props.t('results-clear')}
                            className='icon clear'
                            onClick={() => {
                                this.props.removeQuery(queryId);
                            }}>
                        </i>
                    </div>
                </div>
                <div className='results-query-id'>{ queryId }</div>
                { show_header ? info_header : false }
                <div dangerouslySetInnerHTML={this.renderQueryResults(queryId, query)}/>
            </div>
        );
    }

    /** Iterate through all of the queries and execute
     *  the service's 'runQuery' method if the query is
     *  in the appropriate state.
     *
     *  @param {Object} queries the Queries state.
     *
     */
    checkQueries(queries) {
        for(const query_id of queries.order) {
            const query = queries[query_id];
            const service = this.props.services[query.service];

            if(query && query.progress === 'new') {
                if(typeof(service.runQuery) == 'function') {
                    this.props.store.dispatch(mapActions.startQuery(query_id));
                    service.runQuery(query_id, query);
                }
            }
        }
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {

        if(this.state.lastService !== nextProps.queries.service
           && nextProps.queries.service !== null) {
            // some 'internal' services won't have a bespoke service_def,
            //  e.g. measure.
            if(nextProps.queries.service === 'measure') {
                // handle the measure tool special case and default
                //  it to Lines...
                this.props.changeDrawTool('LineString');
            }
            // 'rotate' the current servie to the next services.
            this.setState({lastService: nextProps.queries.service, lastFeature: ''});
            // clear out the previous selection feaures.
            this.props.clearSelectionFeatures();

            // clear out the previous field values.
            if(!this.fieldValues[nextProps.queries.service]) {
                this.fieldValues[nextProps.queries.service] = {};
            }
        } else {
            const service_name = this.state.lastService;
            const service_def = nextProps.services[service_name];

            // if this service has 'autoGo' and the feature is different
            //  than the last one, then execute the query.
            if(service_def && service_def.autoGo) {
                // assume all fields are required unless otherwise
                //  specified as optional.
                const req_fields = service_def.fields ? service_def.fields.filter(f => f.optional !== true).length : 0;

                if (service_def.bufferAvailable || req_fields.length > 0) {
                    // Don't allow the user to "autoGo" if there are
                    // fields which are required.
                    console.error('Misconfigured service. This service has been configured with autoGo but has required fields');
                }
            }
        }

        // check the queries and see if the services need to
        //  dispatch anything
        this.checkQueries(nextProps.queries);
    }

    /** Function to handle bashing 'Enter' and causing
     *  the service form to submit.
     *
     *  @param evt The event from the div.
     *
     */
    handleKeyboardShortcuts(serviceName, evt) {
        const code = evt.which;
        if(code === 13) {
        } else if(code === 27) {
            this.props.onServiceFinished();
        }
    }

    /** Implement a small post-render hack to focus on the first
     *  input element of a service form.
     */
    componentDidUpdate(prevProps) {
        if(this.props.queries.service !== prevProps.service) {
            // anytime this updates, the user should really be seeing the service
            //  tab.
            if (prevProps.service !== undefined) {
                this.props.setUiHint('service-manager');
            }

            // look for an input in the service form and then
            //  focus on the first one, as available.
            if(this.refs.serviceForm) {
                const inputs = this.refs.serviceForm.getElementsByTagName('input');
                if(inputs.length > 0) {
                    inputs[0].focus();
                }
            }
        }

        const serviceName = this.props.queries.service || this.state.lastService;
        if (serviceName) {
            const serviceDef = this.props.services[serviceName];
            if (
                serviceDef &&
                this.props.selectionFeatures !== prevProps.selectionFeatures &&
                this.props.selectionFeatures.length > 0
            ) {
                if (serviceDef.autoGo === true) {
                    this.props.startQuery(
                        this.props.selectionFeatures,
                        this.props.services[serviceName],
                        this.state.values
                    );
                } else {
                    this.props.startService(serviceName);
                }
            }
        }

        if (!this.props.queries.showServiceForm &&
            this.props.queries.order.length > 0 &&
            prevProps.queries.order[0] !== this.props.queries.order[0]
        ) {
            this.props.setUiHint('new-results');
        }
    }

    render() {
        let contents;

        if(this.props.queries.service === 'measure') {
            const m_tool_props = Object.assign({}, {store: this.props.store}, this.props.measureToolOptions);
            // this is the Javascript spread operator, it will transform the
            //  object constructed above into a useful set of 'props'
            //  for measure tool.
            contents = ( <MeasureTool {...m_tool_props} /> );
        } else if(this.props.queries.service !== null && this.props.queries.showServiceForm) {
            const service_name = this.props.queries.service;
            const service_def = this.props.services[service_name];

            contents = (
                <ServiceForm
                    serviceName={service_name}
                    serviceDef={service_def}
                    onSubmit={(values) => {
                        if (service_def.autoGo !== true) {
                            // end the drawing
                            if (service_def.keepAlive !== true) {
                                this.props.changeDrawTool(null);
                            }
                            this.props.startQuery(this.props.selectionFeatures, service_def, values);
                        }
                        this.setState({values, });
                    }}
                    onCancel={() => {
                        this.props.changeDrawTool(null);
                        this.props.onServiceFinished();
                    }}
                />
            );
        } else {
            if(this.props.queries.order.length > 0) {
                contents = (
                    <React.Fragment>
                        { this.props.queries.order.map(this.renderQuery) }
                    </React.Fragment>
                );
            } else {
                // when there are no queries but a selection is left
                //  allow the user to remove the selection
                let enable_clear = false;
                if (this.props.selectionFeatures &&
                    this.props.selectionFeatures.length > 0) {
                    enable_clear = true;
                }

                contents = (
                    <React.Fragment>
                        <div className='info-box'>
                            { this.props.t('start-service-help') }
                        </div>

                        <div className='clear-controls'>
                            <button
                                disabled={ !enable_clear }
                                className='clear-button'
                                onClick={ () => { this.props.clearSelectionFeatures(); } }
                            >
                                <i className='clear icon'></i> { this.props.t('clear-previous-selection') }
                            </button>
                        </div>
                    </React.Fragment>
                );
            }
        }

        return (
            <Provider store={ this.props.store }>
                <div className='service-manager'>
                    { contents }
                </div>
            </Provider>
        );
    }

}

const mapState = state => ({
    queries: state.query,
    map: state.map,
    selectionFeatures: state.mapSources.selection ? state.mapSources.selection.features : [],
});

function mapDispatch(dispatch, ownProps) {
    return {
        onServiceFinsihed: () => {
            dispatch(finishService());
        },
        startQuery: (selectionFeatures, serviceDef, values) => {
            const selection = normalizeSelection(selectionFeatures);
            const fields = serviceDef.fields.map(field => ({
                name: field.name,
                value: values[field.name] || field.default,
            }));

            // check to see if the selection should stay
            //  'alive' in the background.
            if(serviceDef.keepAlive !== true) {
                // shutdown the drawing on the layer.
                dispatch(changeTool(null));
                dispatch(finishService());
            } else {
                dispatch(showServiceForm(false));
            }

            ownProps.services[serviceDef.name].query(selection, fields);
        },
        changeDrawTool: (type) => {
            dispatch(changeTool(type));
        },
        removeQuery: (queryId) => {
            dispatch(removeQuery(queryId));
        },
        zoomToResults: (query) => {
            const extent = getExtentForQuery(query.results);
            if (extent) {
                dispatch(zoomToExtent(extent));
            }
        },
        clearSelectionFeatures: () => {
            dispatch(mapActions.clearSelectionFeatures());
            dispatch(clearFeatures('selection'));
        },
        onServiceFinished: () => {
            dispatch(changeTool(null));
            dispatch(finishService());
        },
        setUiHint: hint => {
            dispatch(setUiHint(hint));
        },
        startService: serviceName => {
            dispatch(startService(serviceName));
        },
        showServiceForm: show => {
            dispatch(showServiceForm(show));
        },
    };
}
export default connect(mapState, mapDispatch)(withTranslation()(ServiceManager));
