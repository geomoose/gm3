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

import * as util from '../util';

import * as uuid from 'uuid';

import { getLayerFromPath } from '../actions/mapSource';

import Mark from 'markup-js';

class ServiceManager extends Component {

    constructor() {
        super();
        this.services = {};

        this.startQuery = this.startQuery.bind(this); 
        this.drawTool = this.drawTool.bind(this); 
        this.renderQuery = this.renderQuery.bind(this); 
        this.renderQueryResults = this.renderQueryResults.bind(this); 
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
            let selection = this.props.store.getState().map.selectionFeatures[0];
            let fields = [];

            this.props.services[service].query(selection, fields);
        } else {
            console.info('Failed to start query, service: '+service+' not found.');
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

        if(query.progress == 'finished' && this.props.services[query.service]) {
            let service = this.props.services[query.service];
            if(service.resultsAsHtml) {
                html_contents = service.resultsAsHtml(queryId, query);
            }
        }

        return {__html: html_contents};
    }


    /** Render queries as they are coming in.
     *
     *  @param queryId
     *
     */
    renderQuery(queryId) {
        let query = this.props.queries[queryId];

        return (
            <div key={queryId}>
                <b>{queryId}:</b> {query.progress}
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
        console.log('issued drawtool', type);
    }

    render() {
        return (
            <div className="service-manager">
                <h3>Service Manager.</h3>
                <br/>
                <button onClick={ () => { this.drawTool('Point') } }>Draw Point</button>
                <button onClick={() => { this.startQuery('identify') }}>Go</button>
                <br/>
                { this.props.queries.order.map(this.renderQuery) }
            </div>
        );
    }

}


const mapToProps = function(store) {
    return {
        queries: store.query
    }
}
export default connect(mapToProps)(ServiceManager);
