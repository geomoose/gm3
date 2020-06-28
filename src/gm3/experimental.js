/**
 * Experimental API
 *
 * This contains API elements which do not have commitments to
 * stability. Some of these are research projects, opportunities for
 * feedback, or simply an idea that could go good or bad.
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';

import { getMapSourceName, getLayerName } from './util';
import { setLayerVisibility as setLayerVis } from './actions/mapSource';

export function addConnectedPlugin(plugin, domId, inProps = {}) {
    // connect the component so it will update
    //  based on the state-map
    const WrappedComponent = connect(plugin.mapStateToProps)(plugin.component(React));

    // pepper in the extra props
    const props = Object.assign({}, inProps, {
        app: this,
        services: this.services,
    });

    // this.store comes from Application.
    return ReactDOM.render((
        <Provider store={this.store}>
            <WrappedComponent {...props} />
        </Provider>
    ), document.getElementById(domId));
}

export function setLayerVisibility(path, on) {
    const msName = getMapSourceName(path);
    const layerName = getLayerName(path);
    this.store.dispatch(setLayerVis(msName, layerName, on));
}
