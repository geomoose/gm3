import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSelectionBuffer } from '../../actions/map';

import LengthInput from './length';

/* React.Component to control the setting of the buffer distance
 * for selection shapes.
 *
 */
export class BufferInput extends React.Component {
    render() {
        // inputs require a 'field' to render their label and
        // set their value.  This mocks that up.
        const mock_field = {
            label: 'Buffer',
            value: this.props.distance,
            default: this.props.distance,
        };

        return (
            <div>
                <LengthInput
                    setValue={(name, value) => {
                        this.props.setBuffer(value);
                    }}
                    field={ mock_field }
                />
            </div>
        );
    }
}


BufferInput.propTypes = {
    distance: PropTypes.number,
    setDistance: PropTypes.func,
}

BufferInput.defaultProps = {
    distsance: 0,
    setDistance: (distance) => {
    },
}

function mapState(state) {
    return {
        distance: state.map.selectionBuffer,
    };
}

function mapDispatch(dispatch) {
    return {
        setBuffer: (distance) => {
            dispatch(setSelectionBuffer(distance));
        },
    }
}

export default connect(mapState, mapDispatch)(BufferInput);
