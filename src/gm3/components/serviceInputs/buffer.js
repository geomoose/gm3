import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSelectionBuffer } from '../../actions/map';

import {LengthInputBase} from './length';

/* React.Component to control the setting of the buffer distance
 * for selection shapes.
 *
 */
export class BufferInput extends React.Component {
    render() {
        return (
            <LengthInputBase
                label={'With buffer'}
                value={this.props.distance}
                units={this.props.units}
                onChange={(distance, units) => {
                    this.props.setBuffer(distance, units);
                }}
            />
        );
    }
}


BufferInput.propTypes = {
    distance: PropTypes.number,
    units: PropTypes.string,
    setBuffer: PropTypes.func,
}

BufferInput.defaultProps = {
    distsance: 0,
    setBuffer: (distance, units) => {
    },
}

function mapState(state) {
    return {
        distance: state.map.selectionBuffer,
        units: state.map.selectionBufferUnits,
    };
}

function mapDispatch(dispatch) {
    return {
        setBuffer: (distance, units) => {
            dispatch(setSelectionBuffer(distance, units));
        },
    }
}

export default connect(mapState, mapDispatch)(BufferInput);
