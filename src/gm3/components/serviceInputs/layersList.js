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
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SelectInput from './select';

import { getQueryableLayers, getLayerByPath } from '../../actions/mapSource';

// special list of layers that should never float to the top.
const TO_THE_BOTTOM = [
    'sketch/default',
];

export class LayersListInput extends SelectInput {
    getOptions() {
        const options = [];
        for(let i = 0, ii = this.props.layers.length; i < ii; i++) {
            const layer = getLayerByPath(this.props.mapSources, this.props.layers[i]);
            options.push({
                value: this.props.layers[i],
                label: layer.label,
            });
        }

        return options.sort((a, b) => {
            if (TO_THE_BOTTOM.indexOf(a.value) >= 0) {
                return 1;
            } else if (TO_THE_BOTTOM.indexOf(b.value) >= 0) {
                return -1;
            }
            return a < b ? -1 : 1;
        });
    }
}

LayersListInput.propTypes = {
    layers: PropTypes.array,
};

LayersListInput.defaultProps = {
    mapSources: {},
    layers: [],
};

function mapState(state, ownProps) {
    const filter_layers = (ownProps.filter && ownProps.filter.layers) ? ownProps.filter.layers : null;
    return {
        layers: filter_layers ? filter_layers : getQueryableLayers(state.mapSources, ownProps.field.filter),
        mapSources: state.mapSources,
    };
}

export default connect(mapState)(LayersListInput);
