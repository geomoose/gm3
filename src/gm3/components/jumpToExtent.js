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

import React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { zoomToExtent } from '../actions/map';

/**
 * JumpToExtent
 * Allows the user to zoom to a user-defined set of boundaries
 *
 * @param {Object[]} props.locations - an array of boundary definitions that the user can zoom to
 * @param {string} props.locations[].label - the label for the boundary
 * @param {number[]} props.locations[].extent - the extent of the boundary
 *      - in the form [minx, miny, maxx, maxy]
 *      - Extent must be in the same projection as the map
 */
export const JumpToExtent = ({locations, onZoomTo}) => {
    const {t} = useTranslation();

    const options = locations.map(function(location, index) {
        return <option key={index} value={index}>{location.label}</option>;
    });

    return (
        <select value="default" onChange={(evt) => {
            onZoomTo(locations[evt.target.value].extent);
        }}>
            <option disabled key="default" value="default">{t('zoomto-extent')}</option>
            {options}
        </select>
    );
}

JumpToExtent.defaultProps = {
    locations: [],
    onZoomTo: (extent) => {
        // do nothing.
    },
};

function mapDispatch(dispatch) {
    return {
        onZoomTo: (extent) => {
            dispatch(zoomToExtent(extent));
        },
    };
}

export default connect(undefined, mapDispatch)(JumpToExtent);
