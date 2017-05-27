/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp';
import Geometry from 'jsts/org/locationtech/jts/geom/Geometry';
import GeoJSONParser from 'jsts/org/locationtech/jts/io/GeoJSONParser';

/* Buffer a GeoJSON feature.
 *
 * @param feature  A GeoJSON object.
 * @param meters   The distance to buffer the feature.
 *
 * @returns Buffered version of the feature.
 */
export function buffer(feature, meters) {
    // get the jsts version of a json parser
    const parser = new GeoJSONParser();
    // convert the json feature to jsts
    const jsts_geom = parser.read(feature);

    // TODO: Reproject feature before buffering!
    const buffered_geom = BufferOp.bufferOp(jsts_geom, meters);

    // TODO: Reproject *back* to map coordinates.

    // return GeoJSON to the client. 
    return parser.write(buffered_geom);
}
