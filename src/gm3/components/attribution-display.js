import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import uuid from 'uuid';

class AttributionDisplay extends React.Component {
    render() {
        // Do not put anything in the DOM unless there
        //  is something to render.
        if (this.props.attributions.length === 0) {
            return false;
        }
        return (
            <div className='attribution-display'>
                {this.props.attributions.map(attrHtml => (
                    <div
                        dangerouslySetInnerHTML={{__html: attrHtml}}
                        className='attribution'
                        key={uuid()}
                    ></div>
                ))}
            </div>
        );
    }
}

AttributionDisplay.propTypes = {
    attributions: PropTypes.array,
};

AttributionDisplay.defaultProps = {
    attributions: [],
};

const mapState = state => {
    const attributions = [];
    for (const mapSourceName in state.mapSources) {
        const mapSource = state.mapSources[mapSourceName];
        const layers = mapSource.layers;
        for (let i = 0, ii = layers.length; i < ii; i++) {
            const layer = layers[i];
            if (layer.on && layer.attribution) {
                attributions.push(layer.attribution);
            }
        }
    }
    return {
        attributions,
    };
};

export default connect(mapState)(AttributionDisplay);
