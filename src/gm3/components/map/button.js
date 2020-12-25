import React from 'react';
import PropTypes from 'prop-types';
import {withTranslation} from 'react-i18next';

const MapButton = ({label, icon, onClick, t, index, disabled}) => {
    return (
        <div
            className={`map-button fade-in ${index} ${disabled ? 'disabled' : ''}`}
            title={t(label)}
            onClick={onClick}
        >
            <i className={icon} />
        </div>
    );
};

MapButton.defaultProps = {
    label: '',
    icon: '',
    onClick: () => {},
    t: r => r,
    index: 0,
    disabled: false,
};

MapButton.propTypes = {
    label: PropTypes.string,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    t: PropTypes.func,
    index: PropTypes.number,
    disabled: PropTypes.bool,
};

export default withTranslation()(MapButton);
