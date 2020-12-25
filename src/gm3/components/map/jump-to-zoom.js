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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {setView} from '../../actions/map';

const renderJumper = props => {
    const zoomLevels = [];
    for (let i = props.minZoom; i <= props.maxZoom; i++) {
        zoomLevels.push(i);
    }
    return (
        <div className='jump-to-zoom'>
            Zoom:{' '}
            <select
                value={props.zoom}
                onChange={evt => {
                    props.setZoom(evt.target.value);
                }}
            >
                {zoomLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                ))}
            </select>
        </div>
    );
}

// TODO: This is a temporary shim until React is upgraded and
//       a pure functional component can be used.
class JumpToZoom extends React.Component {
    render() {
        return renderJumper(this.props);
    }
}

JumpToZoom.propTypes = {
    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,
    zoom: PropTypes.number,
    setZoom: PropTypes.func,
};

JumpToZoom.defaultProps = {
    minZoom: 1,
    maxZoom: 22,
    zoom: 1,
    setZoom: () => {},
};

const mapStateToProps = state => ({
    // there are times when zoom can be set to null,
    //  the || prevents an error with the <select />
    //  from throwing an error when the value gets set to null.
    zoom: state.map.zoom || 1,
});

const mapDispatchToProps = dispatch => ({
    setZoom: zoom => {
        dispatch(setView({zoom, }));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(JumpToZoom);
