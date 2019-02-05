/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019-present Dan "Ducky" Little
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

import GeoJSONFormat from 'ol/format/GeoJSON';
import WFSFormat from 'ol/format/WFS';

import * as ol_filters from 'ol/format/filter';
import * as proj from 'ol/proj';

function chainFilters(operator, filters) {
    let chained_filters = null;
    if(filters.length > 1) {
        chained_filters = operator(filters[0], filters[1]);
        for(let i = 2, ii = filters.length; i < ii; i++) {
            chained_filters = operator(chained_filters, filters[i]);
        }
    } else {
        chained_filters = filters[0];
    }
    return chained_filters;
}

// map the functions from OpenLayers to the internal
//  types
const FILTER_MAPPING = {
    'like': ol_filters.like,
    'ilike': function(name, value) {
        return ol_filters.like(name, value, '%', '_', '\\', false);
    },
    'eq': ol_filters.equalTo,
    'ge': ol_filters.greaterThanOrEqualTo,
    'gt': ol_filters.greaterThan,
    'le': ol_filters.lessThanOrEqualTo,
    'lt': ol_filters.lessThan
};

function mapFilters(fields) {
    return fields.map(filter => FILTER_MAPPING[filter.comparitor](filter.name, filter.value));
}

export function buildWfsQuery(query, mapSource, mapProjection, outputFormat) {
    const geom_field = 'geom';

    // the internal storage mechanism requires features
    //  returned from the query be stored in 4326 and then
    //  reprojected on render.
    let query_projection = mapProjection;
    if(mapSource.wgs84Hack) {
        query_projection = new proj.get('EPSG:4326');
    }

    const operators = {
        'and': ol_filters.and,
        'or': ol_filters.or,
    };

    const filters = [];
    if(query.selection && query.selection.geometry) {
        // convert the geojson geometry into a ol geometry.
        const ol_geom = (new GeoJSONFormat()).readGeometry(query.selection.geometry);
        // convert the geometry to the query projection
        ol_geom.transform(mapProjection, query_projection);
        // add the intersection filter to the filter stack.
        filters.push(ol_filters.intersects(geom_field, ol_geom));
    }

    for(const filter of query.fields) {
        // TODO: Catch "filter.type" and use internal conversion
        //       functions for specialty filters.
        if (Array.isArray(filter)) {
            filters.push(chainFilters(operators[filter[0]], mapFilters(filter.slice(1))));
        } else {
            filters.push(FILTER_MAPPING[filter.comparitor](filter.name, filter.value));
        }
    }

    // when multiple filters are set then they need to be
    //  chained together to create the compound filter.
    let chained_filters = null;
    if(filters.length > 1) {
        chained_filters = chainFilters(operators.and, filters);
    } else {
        chained_filters = filters[0];
    }

    // the OL formatter requires that the typename and the schema be
    //  broken apart in order to properly format the request.
    // TODO: If this gets used elsewhere, push to a util function.
    const type_parts = mapSource.params.typename.split(':');
    const format_options = {
        srsName: query_projection.getCode(),
        featurePrefix: type_parts[0],
        featureTypes: [type_parts[1]],
        outputFormat,
        filter: chained_filters,
    };

    const feature_request = new WFSFormat().writeGetFeature(format_options);

    return (new XMLSerializer().serializeToString(feature_request));
}
