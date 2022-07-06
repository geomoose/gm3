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

/** Dictionary of GeoMoose Actions.
 *
 *  Every action for GeoMoose needs to be mapped to
 *  one of the 'action' dictionaries below.
 *
 */

export const MAP = {
    QUERY_NEW: 'MAP_QUERY_NEW',
    QUERY_PROGRESS: 'MAP_QUERY_PROGRESS',
    QUERY_START: 'MAP_QUERY_START',
    QUERY_FINISHED: 'MAP_QUERY_FINISHED',
    QUERY_RESULTS: 'MAP_QUERY_RESULTS',
    QUERY_REMOVE: 'MAP_QUERY_REMOVE',
    QUERY_RESULTS_REMOVE: 'MAP_QUERY_FEATURES_REMOVE',

    QUERY_RENDERED_RESULTS: 'MAP_QUERY_RENDERED_RESULTS',

    ADD_FILTER: 'MAP_ADD_FILTER',
    REMOVE_FILTER: 'MAP_REMOVE_FILTER',
};

export const QUERY = {
    EMPTY: 'QUERY_EMPTY',
    ADD: 'QUERY_ADD_ITEM',
    REMOVE: 'QUERY_REMOVE_ITEM'
};
