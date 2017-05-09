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
        var filter = {'pin': '350010001050' }; 
        expect(util.matchFeatures(features, filter)[0].properties.pin).toBe(filter.pin);
    });
    test('Filter with equals type {prop: {type: equals, value}', () => {
        var filter = {pin: {type: 'equals', value: '350010001050'}};
        expect(util.matchFeatures(features, filter)[0].properties.pin).toBe(filter.pin.value);
    });
    test('Simple list filter {prop: []}', () => {
        var filter = {pin: ['350010001050', '160020001550']};
        var results = util.matchFeatures(features, filter);
        expect(results.length).toBe(2);

        // reduce the "pin" set to a testable array.
        var pins = results.map((f) => { return f.properties.pin; });
        expect(pins).toEqual(expect.arrayContaining(filter.pin));
    });
    test('Filter with list type {prop: {type: list, value: []}', () => {
        var filter = {pin: {type: 'list', value: ['350010001050', '160020001550']}};
        var results = util.matchFeatures(features, filter);

        expect(results.length).toBe(2);
        // reduce the "pin" set to a testable array.
        var pins = results.map((f) => { return f.properties.pin; });
        expect(pins).toEqual(expect.arrayContaining(filter.pin.value));
    });

    describe('Filter by range', () => {
        test('With min and max', () => {
            var filter = {emv_total: {type: 'range', min: 250000, max: 500000}};
            expect(util.matchFeatures(features, filter).length).toBe(5);
        });
        test('With only min', () => {
            var filter = {emv_total: {type: 'range', min: 300000}};
            expect(util.matchFeatures(features, filter).length).toBe(3);
        });
        test('With only max', () => {
            var filter = {emv_total: {type: 'range', max: 300000}};
            expect(util.matchFeatures(features, filter).length).toBe(7);
        });

    });

});
