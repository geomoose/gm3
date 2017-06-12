/*
 * Test the functions in util.
 */

import * as util from 'gm3/util';

import { FEATURES } from './sample_data';

test('parseBoolean', () => {
    expect(util.parseBoolean('true')).toBe(true);
});

/*
 * Test the query filter matching.
 */

describe('Filter Tests (matchFeatures)', () => {
    var features = null

    // before each test refresh the copy of FEATURES.
    beforeEach(() => {
        features = FEATURES.slice();
    });

    test('Simple expression equals search {prop: value}', () => {
        var pin = '350010001050';
        var filter = [['==', 'pin', '350010001050']];
        expect(util.matchFeatures(features, filter)[0].properties.pin).toBe(pin);
    });
    test('Simple list filter', () => {
        var pin = '350010001050';
        var filter = [['in', 'pin', pin, '160020001550']];
        var results = util.matchFeatures(features, filter);
        expect(results.length).toBe(2);

        // reduce the "pin" set to a testable array.
        var pins = results.map((f) => { return f.properties.pin; });
        expect(pins).toEqual(expect.arrayContaining([pin]));
    });
    describe('Filter by range', () => {
        test('With min and max', () => {
            var filter = [
                ['>=', 'emv_total', 250000],
                ['<=', 'emv_total', 500000]
            ];
            expect(util.matchFeatures(features, filter).length).toBe(5);
        });
        test('With only min', () => {
            var filter = [['>=', 'emv_total', 300000]];
            expect(util.matchFeatures(features, filter).length).toBe(3);
        });
        test('With only max', () => {
            var filter = [['<=', 'emv_total', 300000]];
            expect(util.matchFeatures(features, filter).length).toBe(7);
        });
    });

});

describe('Test repojection', () => {
    var features = null;

    test('Simple point reprojection', () => {
        var feature_def = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [-10371011.9, 5623372.6]
            },
            properties: {
                label: 'test-point'
            }
        };

        // project the feature from 3857 to 4326
        var wgs_features = util.projectFeatures([feature_def], 'EPSG:3857', 'EPSG:4326');

        // floating point conversion isn't perfect so this test
        // ensures that the conversion is "good enough"
        var close_enough = [-93.165, 45.011];
        var coords = wgs_features[0].geometry.coordinates;

        expect(Math.floor(coords[0] * 1000)).toBe(close_enough[0] * 1000);
        expect(Math.floor(coords[1] * 1000)).toBe(close_enough[1] * 1000);
    });

});
