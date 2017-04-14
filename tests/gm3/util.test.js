/*
 * Test the functions in util.
 */

import * as util from 'gm3/util';

test('parseBoolean', () => {
    expect(util.parseBoolean('true')).toBe(true);
});
