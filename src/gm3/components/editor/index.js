import {connect} from 'react-redux';
import {finishEditing} from '../../actions/edit';
import {changeFeatures} from '../../actions/mapSource';
import Modal from './modal';

const mapState = state => ({
    open: state.editor && state.editor.feature !== null,
    feature: state.editor.feature,
    source: state.editor.source,
});

const mapDispatch = dispatch => ({
    onClose: (action, source, feature) => {
        if (action === 'save') {
            const properties = feature.properties;
            const filter = {'_uuid' : properties._uuid};
            dispatch(changeFeatures(source, filter, properties));
        }
        dispatch(finishEditing());
    },
});

export default connect(mapState, mapDispatch)(Modal);
