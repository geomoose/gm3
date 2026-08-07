/*
 * Copyright (c) 2016-2026 Dan "Ducky" Little & GeoMoose.org
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

import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { setLayerVisibility } from "../actions/mapSource";
import { getLayerName, getMapSourceName, isLayerOn } from "../util";

function getLayerOnState(mapSources, path) {
  return isLayerOn(mapSources, {
    src: [
      {
        mapSourceName: getMapSourceName(path),
        layerName: getLayerName(path),
      },
    ],
  });
}

function getActiveLayerIndex(layers, mapSources) {
  for (let i = 0, ii = layers.length; i < ii; i++) {
    if (layers[i].path !== "" && getLayerOnState(mapSources, layers[i].path)) {
      return i;
    }
  }
  return -1;
}

const BasemapToggleChip = ({ active, open, path, src, label, onClick }) => {
  return (
    <button
      type="button"
      key={path || label}
      onClick={onClick}
      aria-pressed={active}
      className={`basemap-toggle-chip ${open ? "open" : ""} ${active ? "active" : ""}`}
    >
      <img src={src} alt="" className="basemap-toggle-image" />
      <span className="basemap-toggle-label">{label}</span>
    </button>
  );
};

BasemapToggleChip.propTypes = {
  active: PropTypes.bool,
  open: PropTypes.bool,
  path: PropTypes.string,
  src: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

BasemapToggleChip.defaultProps = {
  active: false,
  open: false,
  path: "",
  onClick: () => {},
};

const BasemapToggleComponent = ({ layers, mapSources, onSetLayerVisibility }) => {
  const [isOpen, setOpen] = useState(false);
  const activeIndex = useMemo(() => getActiveLayerIndex(layers, mapSources), [layers, mapSources]);
  const setVis = onSetLayerVisibility;

  const handleLayerClick = useCallback(
    (layer) => {
      setVis(layer.path, true);
      layers.forEach((offLayer) => {
        if (offLayer.path !== layer.path) {
          setVis(offLayer.path, false);
        }
      });
    },
    [layers, setVis]
  );

  // This happens, generally, during a misconfiguration::
  // - The admin configures the base layers to work "in a group"
  // - The user clicks a layer that is in a group where the rest of the configured basemaps are "off"
  // This means there is no placeholder for that layer in the basemap toggle!
  //
  if (activeIndex < 0) {
    console.warn("Basemap toggle configuration error! All exclusive layers are off.");

    // short circuit the rendering
    return (
      <div className="basemap-toggle error">
        <span
          className="error-indicator"
          title="Invalid basemap toggle state: choose a different base layer"
        >
          {/* unicode warning symbol */ "\u26A0"}
        </span>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(evt) => {
        if (!evt.currentTarget.contains(evt.relatedTarget)) {
          setOpen(false);
        }
      }}
      // When there is no active index "fold" the basemap chooser down
      //  to prevent being in an indeterminate state.
      className={`basemap-toggle ${isOpen ? "full-open" : ""}`}
    >
      {layers.map((layer, idx) => (
        <BasemapToggleChip
          key={layer.path || idx}
          label={layer.label}
          src={layer.src}
          path={layer.path}
          active={idx === activeIndex}
          open={isOpen || idx === activeIndex}
          onClick={() => handleLayerClick(layer)}
        />
      ))}
    </div>
  );
};

BasemapToggleComponent.propTypes = {
  layers: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ),
  mapSources: PropTypes.object.isRequired,
  onSetLayerVisibility: PropTypes.func.isRequired,
};

BasemapToggleComponent.defaultProps = {
  layers: [],
};

export const mapStateToProps = (state) => ({
  mapSources: state.mapSources,
});

export const mapDispatchToProps = (dispatch) => ({
  onSetLayerVisibility: (path, on) =>
    dispatch(setLayerVisibility(getMapSourceName(path), getLayerName(path), on)),
});

export default connect(mapStateToProps, mapDispatchToProps)(BasemapToggleComponent);

export { BasemapToggleChip, BasemapToggleComponent };
