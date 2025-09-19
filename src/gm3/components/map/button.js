import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const MapButton = ({ label, icon, onClick, index, disabled }) => {
  const { t } = useTranslation();
  return (
    <button
      disabled={disabled}
      className={`map-button fade-in ${index}`}
      title={t(label)}
      onClick={onClick}
    >
      <i className={icon} />
    </button>
  );
};

MapButton.defaultProps = {
  label: "",
  icon: "",
  onClick: () => {},
  t: (r) => r,
  index: 0,
  disabled: false,
};

MapButton.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  index: PropTypes.number,
  disabled: PropTypes.bool,
};

export default MapButton;
