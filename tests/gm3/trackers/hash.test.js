/*
 * Test the functions which interpret the hash
 */

// import * as util from 'gm3/util';

import { formatLocation, parseLocation } from 'gm3/trackers/hash';


describe('State hashing functions', () => {
    const state = {
        map: {
            center: [-10370905.9, 5552635.8],
            resolution: 10,
        },
        cursor: {
            size: {
                width: 200,
                height: 200,
            },
        },
    };

    describe('Format location for hash', () => {
        it('handles zxy', () => {
            const locString = formatLocation(state.map, state.cursor.size, 'zxy');
            expect(locString).toEqual('10.0000;-10370905.90;5552635.80');
        });

        it('handles bbox', () => {
            const locString = formatLocation(state.map, state.cursor.size, 'bbox');
            expect(locString).toEqual('-93.17242;44.55436;-93.15445;44.56716');
        });

        it('handles lonlat', () => {
            const locString = formatLocation(state.map, state.cursor.size, 'lonlat');
            expect(locString).toEqual('13.93/-93.163433/44.560764');
        });
    });

    describe('Parse location from the hash', () => {
        it('handles a zxy string', () => {
            const loc = parseLocation('10.0000;-10370905.90;5552635.80');
            expect(loc).toEqual({
                resolution: 10.0000,
                center: [-10370905.90, 5552635.80],
                zoom: null,
            });
        });

        it('handles a bounding box', () => {
            const loc = parseLocation('-93.17242;44.55436;-93.15445;44.56716');
            expect(loc).toMatchObject({
                bbox: [-93.17242, 44.55436, -93.15445, 44.56716],
            });
        });

        it('handles lonlat', () => {
            const loc = parseLocation('13.93/-93.163433/44.560764');
            expect(loc.resolution).toBeUndefined();
            expect(loc.zoom).toBeCloseTo(13.93);
            expect(loc.center[0]).toBeCloseTo(-10370905.9, 1);
            expect(loc.center[1]).toBeCloseTo(5552635.8, 1);
        });
    });
});
