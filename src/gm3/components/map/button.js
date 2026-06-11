import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const MapButton = ({ label, icon, onClick, index, disabled, active }) => {
  const { t } = useTranslation();
  return (
    <button
      disabled={disabled}
      className={`map-button fade-in ${index}${active ? " active" : ""}`}
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
  active: false,
};

MapButton.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
};

export default MapButton;
