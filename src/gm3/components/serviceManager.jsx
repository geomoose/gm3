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

//import handlebars from 'handlebars';

import { connect } from 'react-redux';

import { createQuery, changeTool } from '../actions/map';

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
        this.renderFeaturesWithTemplate = this.renderFeaturesWithTemplate.bind(this); 
    }

    registerService(name, service) {

        this.services[name] = service;
    }

    startQuery() {
        let selection = 
            this.props.map.selectionFeatures[0];

            //{'type': 'Point', 'coordinates': [ -10370351.141856, 5550949.728470501 ]} 

        let fields = [
            //{name: '', operator: '', value: }
        ];

        let layers = ['parcels/parcels']; //, 'pipelines/pipelines'];

        this.props.store.dispatch(createQuery(selection, fields, layers));
    }

    renderQuery(queryId) {
        let query = this.props.queries[queryId];
        return (
            <div key={queryId}>
                <b>{queryId}:</b> {query.progress}
                {
                    query.layers.map((path) => { 
                        return <div key={uuid.v4()} dangerouslySetInnerHTML={this.renderFeaturesWithTemplate(query, path, '@identify')} /> 
                    })
                }
            </div>
        );
    }

    /** Render feeatures from a query using a specified template.
     *
     *  @param query The query.
     *  @param template "Template like", "@..." will refer to a layer predefined
     *                                   template but a raw template string can
     *                                   be passed in that will be used for all layers.
     *
     * @returns HTML String.
     */
    renderFeaturesWithTemplate(query, path, template) {
        let template_contents = template;
        let html_contents = '';

        if(query.results[path]) {
            if(template.substring(0,1) == '@') {
                let template_name = template.substring(1);
                let layer = getLayerFromPath(this.props.store, path);
                if(layer.templates[template_name]) {
                    template_contents = layer.templates[template_name];
                } else {
                    template_contents = null;
                    console.info('Failed to find template.', path, template_name);
                }

                for(let feature of query.results[path]) {
                    html_contents += Mark.up(template_contents, feature);
                }

            }
        }

        return {__html: html_contents};

    }

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
                <button onClick={this.startQuery}>Start Query</button>
                <br/>
                { this.props.queries.order.map(this.renderQuery) }
            </div>
        );
    }

}


const mapToProps = function(store) {
    return {
        map: store.map,
        queries: store.query
    }
}
export default connect(mapToProps)(ServiceManager);
