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
    let features = null

    // before each test refresh the copy of FEATURES.
    beforeEach(() => {
        features = FEATURES.slice();
    });

    test('Simple expression equals search {prop: value}', () => {
        const pin = '350010001050';
        const filter = [['==', 'pin', '350010001050']];
        expect(util.matchFeatures(features, filter)[0].properties.pin).toBe(pin);
    });
    test('Simple list filter', () => {
        const pin = '350010001050';
        const filter = [['in', 'pin', pin, '160020001550']];
        const results = util.matchFeatures(features, filter);
        expect(results.length).toBe(2);

        // reduce the "pin" set to a testable array.
        const pins = results.map((f) => { return f.properties.pin; });
        expect(pins).toEqual(expect.arrayContaining([pin]));
    });
    describe('Filter by range', () => {
        test('With min and max', () => {
            const filter = [
                ['>=', 'emv_total', 250000],
                ['<=', 'emv_total', 500000]
            ];
            expect(util.matchFeatures(features, filter).length).toBe(5);
        });
        test('With only min', () => {
            const filter = [['>=', 'emv_total', 300000]];
            expect(util.matchFeatures(features, filter).length).toBe(3);
        });
        test('With only max', () => {
            const filter = [['<=', 'emv_total', 300000]];
            expect(util.matchFeatures(features, filter).length).toBe(7);
        });
    });

});

describe('Test repojection', () => {
    test('Simple point reprojection', () => {
        const feature_def = {
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
        const wgs_features = util.projectFeatures([feature_def], 'EPSG:3857', 'EPSG:4326');

        // floating point conversion isn't perfect so this test
        // ensures that the conversion is "good enough"
        const close_enough = [-93.165, 45.011];
        const coords = wgs_features[0].geometry.coordinates;

        expect(Math.floor(coords[0] * 1000)).toBe(close_enough[0] * 1000);
        expect(Math.floor(coords[1] * 1000)).toBe(close_enough[1] * 1000);
    });

});

test('getMapSourceName', () => {
    expect(util.getMapSourceName('map/path/stuff')).toBe('map');
});

test('getLayerName', () => {
    expect(util.getLayerName('map/path/stuff')).toBe('path/stuff');
});

test('formatUrlParameters', () => {
    const params = {a: 'a', b: 'b'};
    expect(util.formatUrlParameters(params)).toBe('a=a&b=b');
});

test('getUtmZone', () => {
    expect(util.getUtmZone([-93, 45])).toBe('UTM15N');
});

test('metersLengthToUnits', () => {
    expect(util.metersLengthToUnits(1, 'ft')).toBe(1 / .3048);
    expect(util.metersLengthToUnits(1, 'mi')).toBe(1 / 1609.347);
    expect(util.metersLengthToUnits(1, 'ch')).toBe(1 / 20.11684);
    expect(util.metersLengthToUnits(1, 'km')).toBe(1 / 1000);
    expect(util.metersLengthToUnits(1, 'm')).toBe(1);
});

test('metersAreaToUnits', () => {
    expect(util.metersAreaToUnits(1, 'ft')).toBe(1 / Math.pow(.3048, 2));
});

test('convertArea', () => {
    expect(util.convertArea(1, 'm', 'ft')).toBe(1 / Math.pow(.3048, 2));
});

test('convertLength', () => {
    expect(util.convertLength(1, 'm', 'ft')).toBe(1 / .3048);
    expect(util.convertLength(1, 'm', 'mi')).toBe(1 / 1609.347);
    expect(util.convertLength(1, 'm', 'ch')).toBe(1 / 20.11684);
    expect(util.convertLength(1, 'm', 'km')).toBe(1 / 1000);
    expect(util.convertLength(1, 'm', 'm')).toBe(1);
    expect(util.convertLength(1, 'yd', 'ft')).toBe(3);
});

describe('getExtentForQuery', () => {
    test('test extent for a result with a single feature', () => {
        const fakeResults = {
            dummy: [{
                type: 'Feature',
                properties: {
                    boundedBy: [0, 0, 300, 300]
                }
            }]
        };
        expect(util.getExtentForQuery(fakeResults)).toEqual([0, 0, 300, 300]);
    });

    test('test extent for an empty result', () => {
        expect(util.getExtentForQuery({})).toEqual(null);
    });
});
