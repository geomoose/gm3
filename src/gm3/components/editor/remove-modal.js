import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {finishEditing} from '../../actions/edit';
import {clearFeatures, removeFeature} from '../../actions/mapSource';
import {EDIT_LAYER_NAME} from '../../defaults';
import Modal from '../modal';

export class RemoveModal extends Modal {
    getTitle() {
        return this.props.t('draw-remove-tip');
    }

    close(value) {
        this.props.onClose(value, this.props.mapSource, this.props.feature);
    }

    renderBody() {
        return (
            <div></div>
        );
    }
}

RemoveModal.defaultProps = {
    attributes: [],
    options: [
        {label: 'Cancel', value: 'canel'},
        {label: 'Okay', value: 'remove'},
    ],
};

const mapStateToProps = state => ({
    open: state.editor.modal === 'remove',
    mapSource: state.editor.source,
    feature: state.editor.feature,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onClose: (value, source, feature) => {
        if (value === 'remove') {
            dispatch(removeFeature(source, feature));
        }
        // clear out any current features
        dispatch(clearFeatures(EDIT_LAYER_NAME));
        dispatch(finishEditing());
    },
});

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(RemoveModal));
