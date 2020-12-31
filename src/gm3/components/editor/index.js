import {connect} from 'react-redux';
import {finishEditing} from '../../actions/edit';
import {clearFeatures, saveFeature, getLayerFromPath} from '../../actions/mapSource';
import {changeTool} from '../../actions/map';
import {getMapSourceName} from '../../util';
import {EDIT_LAYER_NAME} from '../../defaults';
import Modal from './modal';

const mapState = state => {
    let properties = [];

    const open = state.editor && state.editor.feature !== null;

    if (open) {
        // get the editing path.
        const source = getMapSourceName(state.map.editPath);

        // get the full layer definition
        let layer = null;
        try {
            layer = getLayerFromPath(state.mapSources, state.map.editPath);
        } catch (err) {
            // swallow the error if the layer can't be found.
        }

        // check for a query-as
        if (layer && layer.queryAs.length > 0) {
            const querySource = getMapSourceName(layer.queryAs[0]);
            properties = state.mapSources[querySource].properties;
        } else {
            properties = state.mapSources[source].properties;
        }
    }

    return {
        title: 'draw-edit-tip',
        open,
        path: state.map.editPath,
        properties,
        feature: state.editor.feature,
    };
};

const mapDispatch = dispatch => ({
    onClose: (action, path, feature) => {
        if (action === 'save') {
            dispatch(saveFeature(path, feature));
            // clear out any current features
            dispatch(clearFeatures(EDIT_LAYER_NAME));
            dispatch(changeTool('Edit', path));
        }
        dispatch(finishEditing());
    },
});

export default connect(mapState, mapDispatch)(Modal);
