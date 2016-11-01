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

import { createQuery } from '../actions/map';

class ServiceManager extends Component {

    constructor() {
        super();
        this.services = {};

        this.startQuery = this.startQuery.bind(this); 
        this.renderQuery = this.renderQuery.bind(this); 
    }

    registerService(name, service) {

        this.services[name] = service;
    }

    startQuery() {
        let selection = {
            // geojson shape.
            geometry: {'type': 'Point', 'coordinates': (0.0, 0.0)}
        };

        let fields = [
            //{name: '', operator: '', value: }
        ];

        let layers = ['parcels/parcels'];

        this.props.store.dispatch(createQuery(selection, fields, layers));
    }

    renderQuery(queryId) {
        let query = this.props.queries[queryId];
        return (
            <div key={queryId}>
                <b>{queryId}:</b> {query.progress}
            </div>
        );
    }

    render() {
        return (
            <div className="service-manager">
                <h3>Service Manager.</h3>
                <br/>
                <button onClick={this.startQuery}>Start Query</button>
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
