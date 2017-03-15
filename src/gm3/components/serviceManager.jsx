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

import { removeQuery, createQuery, changeTool, renderedResultsForQuery} from '../actions/map';

import { startService, finishService } from '../actions/service';

import * as util from '../util';

import * as uuid from 'uuid';

import * as mapActions from '../actions/map';

import { getLayerFromPath } from '../actions/mapSource';

import { setUiHint } from '../actions/ui';

import Mark from 'markup-js';

class ServiceManager extends Component {

    constructor() {
        super();
        this.services = {};

        this.finishedQueries = {};

        this.startQuery = this.startQuery.bind(this); 
        this.drawTool = this.drawTool.bind(this); 
        this.renderQuery = this.renderQuery.bind(this); 
        this.renderQueryResults = this.renderQueryResults.bind(this); 
        this.renderServiceField = this.renderServiceField.bind(this); 
        this.setFieldValue = this.setFieldValue.bind(this); 

        this.state = {
            lastService: null,
            lastFeature: ''
        };
    }

    registerService(name, service) {

        this.services[name] = service;
    }

    /** Call the service with the relevant information
     *  and have it start a query.
     *
     */
    startQuery(service) {
        if(this.props.services[service]) {
            let service_def = this.props.services[service];
            let selection = this.props.store.getState().map.selectionFeatures[0];
            let fields = service_def.fields;

            if(service_def.keepAlive !== true) {
                // shutdown the drawing on the layer.
                // TODO: Add a 'keep' alive that does *not* stop this
                //       in order to allow repeated runs of a service (e.g. Identify)
                this.drawTool(null);

            }

            this.closeForm();
            this.props.services[service].query(selection, fields);
        } else {
            console.info('Failed to start query, service: ' + service + ' not found.');
        }

    }


    /** Renders the results for an individual query.
     *
     *  @param queryId the query's ID.
     *  @param query   The details of the query.
     *
     *  @returns a Hash appropriate for dnagerouslySetInnerHTML
     */
    renderQueryResults(queryId, query) {
        var html_contents = ''; 

        if(query.progress === 'finished' && this.props.services[query.service]) {
            let service = this.props.services[query.service];
            if(service.renderQueryResults) {
                service.renderQueryResults(queryId, query);
            }
            if(service.resultsAsHtml) {
                html_contents = service.resultsAsHtml(queryId, query);
            }
        }

        return {__html: html_contents};
    }

    removeQuery(queryId) {
        this.props.store.dispatch(removeQuery(queryId));
    }


    /** Render queries as they are coming in.
     *
     *  @param queryId
     *
     */
    renderQuery(queryId) {
        let query = this.props.queries[queryId];
        let service_title = this.props.services[query.service].resultsTitle;

        // this is a little ungangly but it will help those who
        //  forget to specify a results title.
        if(!service_title) {
            service_title = this.props.services[query.service].title + ' Results';
        }

        return (
            <div key={queryId}>
                <div className='results-header'>
                    { service_title }
                    <div className='results-tools'>
                        <i className='results-remove-icon' onClick={() => { this.removeQuery(queryId); }}></i>
                    </div>
                </div>
                <div className='results-query-id'>{ queryId }</div>
                <div dangerouslySetInnerHTML={this.renderQueryResults(queryId, query)}/>
            </div>
        );
    }


    /** Activate a drawing tool for selection,
     *  
     *  @param type Point, LineString, Polygon
     *
     */
    drawTool(type) {
        this.props.store.dispatch(changeTool(type));
    }

    closeForm() {
        this.props.store.dispatch(finishService());
    }

    /** Handle changing the event name
     */
    setFieldValue(fieldDefn, event) {
        fieldDefn.value = event.target.value;
    }

    /** Render a user input field
     *
     *  @param {Object} fieldDefn Definition of the field to be rendered.
     *
     * @returns JSX
     */
    renderServiceField(fieldDefn) {
        // TODO: Make bootstrappy? 
        return (
            <div key="{ fieldDefn.name }" className="field-input">
                <label>{ fieldDefn.label }</label> <input onChange={ (event) => { this.setFieldValue(fieldDefn, event) } }/>
            </div>
        );
    }

    shouldComponentUpdate(nextProps, nextState) {
        for(let query_id of nextProps.queries.order) {
            if(!this.finishedQueries[query_id]) {
                let query = nextProps.queries[query_id];
                if(query && query.progress === 'finished') {
                    this.finishedQueries[query_id] = true;
                    let service = this.props.services[query.service];
                    if(service.renderQueryResults) {
                        service.renderQueryResults(query_id, query);
                    }
                }
            }
        }

        if(this.props.queries.service !== nextProps.queries.service) {
            return true;
        }

        // compare to the two sets of queries.
        const old_queries = this.props.queries;
        const new_queries = nextProps.queries;
        const old_keys = Object.keys(old_queries);
        const new_keys = Object.keys(new_queries);
        // quicky check
        if(old_keys.length !== new_keys.length) {
            return true;
        }

        // each array is the same length (see the test above)
        const len = old_keys.length;
        // the arrays are un-sorted so go through each and 
        //   if there is any missing keys, then kick back a true 
        for(let i = 0; i < len; i++) {
            let found = false;
            for(let j = 0; j < len && !found; j++) {
                if(new_keys[i] === old_keys[j]) {
                    let old_q = old_queries[old_keys[j]];
                    let new_q = new_queries[new_keys[j]];
                    // these are the same
                    if(old_q === null && new_q === null) {
                        found = true;
                    } else if(old_q === null || new_q === null) {
                        // these differ, this check prevents the
                        //  next check from happening and this should
                        //  actually keep found set to false.
                        found = false;
                    } else if(old_q.progress === new_q.progress) {
                        found = true;
                    }
                }
            }
            if(!found) { return true; }
        }

        // check to see if the selection features have changed.
        const old_features = this.props.map.selectionFeatures;
        const new_features = nextProps.map.selectionFeatures;
        if(old_features.length != new_features.length) {
            return true;
        } else {
            // TODO: do a better list-against-list matching check.
            for(let i = 0, ii = old_features.length; i < ii; i++) {
                if(old_features[i].properties.id != new_features[i].properties.id) {
                    return true;
                }
            }
        }



        return false;
    }

    componentWillUpdate(nextProps, nextState) {
        // anytime this updates, the user should really be seeing the service 
        //  tab.
        this.props.store.dispatch(setUiHint('service-manager'));

        console.log('Ping');

        // when the service changes, then clear out the previous 
        //  selection features
        if(this.state.lastService !== nextProps.queries.service 
           && nextProps.queries.service !== null) {
            this.setState({lastService: nextProps.queries.service, lastFeature: ''});
            this.props.store.dispatch(mapActions.clearSelectionFeatures());
        } else {
            let service_name = this.state.lastService;
            let service_def = nextProps.services[service_name];

            console.log('checking autoGo...');

            // if this service has 'autoGo' and the feature is different
            //  than the last one, then execute the query.
            if(service_def.autoGo) { 
                let selection = nextProps.store.getState().map.selectionFeatures;
                if(selection.length > 0) {
                    // okay, there *is* a selection feature.
                    let fid = selection[0].properties.id;
                    if(nextState.lastFeature !== fid) {
                        this.setState({lastFeature: fid});
                        this.startQuery(service_name);
                    }
                }
            }
        }

    }

    render() {
        if(this.props.queries.service != null) {
            let service_name = this.props.queries.service;
            let service_def = this.props.services[service_name];

            if(service_def.autoGo) {
            }

            return (
                <div className="service-manager">
                    <h3>{service_def.title}</h3>
                    {service_def.tools.Point && <div><button onClick={ () => { this.drawTool('Point') } }>Draw Point</button></div>}
                    {service_def.tools.LineString && <div><button onClick={ () => { this.drawTool('LineString') } }>Draw LineString</button></div>}
                    {service_def.tools.Polygon && <div><button onClick={ () => { this.drawTool('Polygon') } }>Draw Polygon</button></div>}
                    { service_def.fields.map(this.renderServiceField) }
                    <button onClick={() => { this.closeForm() }}>Close</button>
                    <button onClick={() => { this.startQuery(service_name) }}>Go</button>
                </div>
            );
        } else {
            return (
                <div className="service-manager">
                    { this.props.queries.order.map(this.renderQuery) }
                </div>
            );
        }
    }

}


const mapToProps = function(store) {
    return {
        queries: store.query,
        map: store.map
    }
}
export default connect(mapToProps)(ServiceManager);
