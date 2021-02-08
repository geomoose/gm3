/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Dan "Ducky" Little
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

import * as proj from 'ol/proj';

import { buildWfsQuery } from 'gm3/components/map/layers/wfs';

const PARCELS_SRC = {
    layers: [{
    }],
    params: {
        MAP: '/demo/parcels/parcels.map',
        typename: 'ms:parcels',
    },
    type: 'wfs',
    urls: ['/mapserv'],
};

describe('WFS Testing', () => {
    if (!global.XMLSerializer) {
        it('is going to skip all tests....', () => {
            console.error('Skipping WFS tests without xmlshim installed.');
        });
        return false;
    }

    it('Test creating a query with on input', () => {
        const basic_query = {
            fields: [
                {
                    comparitor: 'eq',
                    name: 'OWNER_NAME',
                    value: 'peterson',
                }
            ],
            layers: [
                'vector-parcels/parcels',
            ],
        };

        const output_format = 'text/xml; subtype=gml/2.1.2'
        const wfs_query_xml = buildWfsQuery(basic_query, PARCELS_SRC, new proj.get('EPSG:3857'), output_format);

        expect(wfs_query_xml).toBe('<GetFeature service="WFS" version="1.1.0" outputFormat="text/xml; subtype=gml/2.1.2" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wfs"><Query typeName="ms:parcels" srsName="EPSG:3857" xmlns="http://www.opengis.net/wfs"><Filter xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo xmlns="http://www.opengis.net/ogc"><PropertyName xmlns="http://www.opengis.net/ogc">OWNER_NAME</PropertyName><Literal xmlns="http://www.opengis.net/ogc">peterson</Literal></PropertyIsEqualTo></Filter></Query></GetFeature>');
    });

    it('Tests creating a query with TWO inputs (defaults to AND)', () => {
        const fields = [
            {
                comparitor: 'eq',
                name: 'OWNER_NAME',
                value: 'peterson',
            },
            {
                comparitor: 'gt',
                name: 'ACRES',
                value: '5000',
            },
        ];

        const layers = ['vector-parcels/parcels'];

        const and_query = {
            fields,
            layers,
        };

        const output_format = 'application/json';

        let wfs_query_xml = buildWfsQuery(and_query, PARCELS_SRC, new proj.get('EPSG:3857'), output_format);

        const and_xml = '<GetFeature service="WFS" version="1.1.0" outputFormat="application/json" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wfs"><Query typeName="ms:parcels" srsName="EPSG:3857" xmlns="http://www.opengis.net/wfs"><Filter xmlns="http://www.opengis.net/ogc"><And xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo xmlns="http://www.opengis.net/ogc"><PropertyName xmlns="http://www.opengis.net/ogc">OWNER_NAME</PropertyName><Literal xmlns="http://www.opengis.net/ogc">peterson</Literal></PropertyIsEqualTo><PropertyIsGreaterThan xmlns="http://www.opengis.net/ogc"><PropertyName xmlns="http://www.opengis.net/ogc">ACRES</PropertyName><Literal xmlns="http://www.opengis.net/ogc">5000</Literal></PropertyIsGreaterThan></And></Filter></Query></GetFeature>';

        expect(wfs_query_xml).toBe(and_xml);

        const and_query_with_join = {
            fields: [
                ['and'].concat(fields),
            ],
            layers,
        };
        wfs_query_xml = buildWfsQuery(and_query_with_join, PARCELS_SRC, new proj.get('EPSG:3857'), output_format);

        expect(wfs_query_xml).toBe(and_xml);
    });

    it('Test something a little fancy with OR and AND', () => {
        const fields = [
            {
                comparitor: 'eq',
                name: 'OWNER_NAME',
                value: 'peterson',
            },
            {
                comparitor: 'gt',
                name: 'ACRES',
                value: '5000',
            },
        ];
        const layers = ['vector-parcels/parcels'];

        const or_join = {
            fields: [
                {
                    comparitor: 'eq',
                    name: 'CITY',
                    value: 'LAKEVILLE',
                },
                ['or'].concat(fields),
            ],
            layers,
        };

        const wfs_query_xml = buildWfsQuery(or_join, PARCELS_SRC, new proj.get('EPSG:3857'), 'application/json');

        const gone_fancy = '<GetFeature service="WFS" version="1.1.0" outputFormat="application/json" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wfs"><Query typeName="ms:parcels" srsName="EPSG:3857" xmlns="http://www.opengis.net/wfs"><Filter xmlns="http://www.opengis.net/ogc"><And xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo xmlns="http://www.opengis.net/ogc"><PropertyName xmlns="http://www.opengis.net/ogc">CITY</PropertyName><Literal xmlns="http://www.opengis.net/ogc">LAKEVILLE</Literal></PropertyIsEqualTo><Or xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo xmlns="http://www.opengis.net/ogc"><PropertyName xmlns="http://www.opengis.net/ogc">OWNER_NAME</PropertyName><Literal xmlns="http://www.opengis.net/ogc">peterson</Literal></PropertyIsEqualTo><PropertyIsGreaterThan xmlns="http://www.opengis.net/ogc"><PropertyName xmlns="http://www.opengis.net/ogc">ACRES</PropertyName><Literal xmlns="http://www.opengis.net/ogc">5000</Literal></PropertyIsGreaterThan></Or></And></Filter></Query></GetFeature>';
        expect(wfs_query_xml).toBe(gone_fancy);
    });

    it('handles an alternative geometry colum (geometry-name param)', () => {
        const geomQuery = {
            selection: [{
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0], [0, 90], [-120, 90], [-120, 0], [0, 0],
                        ],
                    ],
                },
            }],
            fields: [],
            layers: [
                'vector-parcels/parcels',
            ],
        };

        const output_format = 'text/xml; subtype=gml/2.1.2'
        const queryResults = buildWfsQuery(
            geomQuery, PARCELS_SRC, new proj.get('EPSG:3857'), output_format);

        expect(queryResults)
            .toContain('<PropertyName xmlns="http://www.opengis.net/ogc">geom</PropertyName>');

        const geomColumn = 'CustomGeometryColumn';
        const mapSourceWithGeom = Object.assign({}, PARCELS_SRC, {
            config: Object.assign({}, PARCELS_SRC.config, {
                'geometry-name': geomColumn,
            }),
        });
        const customNameResults = buildWfsQuery(
            geomQuery, mapSourceWithGeom, new proj.get('EPSG:3857'), output_format);

        expect(customNameResults)
            .toContain('<PropertyName xmlns="http://www.opengis.net/ogc">' + geomColumn + '</PropertyName>');
    });

});
