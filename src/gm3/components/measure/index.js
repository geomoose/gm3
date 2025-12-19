/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017, 2023 Dan "Ducky" Little
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

import React, { Component } from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { getArea } from "ol/sphere";

import DrawTool from "../drawTool";
import { updateSketchGeometry } from "../../actions/cursor";
import { changeTool, clearSelectionFeatures } from "../../actions/map";
import { clearFeatures, removeFeature, saveFeature } from "../../actions/mapSource";
import { PolygonIcon } from "../polygon-icon";
import { LineIcon } from "../line-icon";
import { PointIcon } from "../point-icon";

import * as util from "../../util";
import { projectFeatures } from "../../util";

import { toLonLat } from "ol/proj";
import { UnitOption } from "./unit";

import CoordinateDisplay from "../coordinate-display";

import { getSegmentInfo, normalizeGeometry, deconstructPolygon } from "./calc";
import { colorizeFromIndex } from "./colorize";

const LENGTH_KEY = "gm3:length-units";
const AREA_KEY = "gm3:area-units";

const hasSqLabel = (unit) => unit !== "a" && unit !== "h";

const RemoveFeatureButton = ({ properties, targetLayer, removeFeature }) => (
  <button
    style={{ border: "none", padding: 5, margin: 0, background: "none" }}
    onClick={() => {
      removeFeature(targetLayer, { properties });
    }}
  >
    <span className="icon clear"></span>
  </button>
);

export class MeasureTool extends Component {
  constructor(props) {
    super(props);

    // look for unit measurements from local storage.
    const savedLengthUnits = localStorage.getItem(LENGTH_KEY) || "ft";
    const savedAreaUnits = localStorage.getItem(AREA_KEY) || "ft";

    this.state = {
      lengthUnits: this.props.initialUnits ? this.props.initialUnits : savedLengthUnits,
      areaUnits: this.props.initialUnits ? this.props.initialUnits : savedAreaUnits,
    };

    // localize all of the ordinals
    this.ordinalDictionary = {};
    ["north", "east", "south", "west"].forEach((ordinal) => {
      const key = `measure-${ordinal}-abbr`;
      this.ordinalDictionary[key] = this.props.t(key);
    });
  }

  componentDidMount() {
    // clear out selection features from a previous tool
    this.props.clearSelectionFeatures();
    // change the tool to be the default and target the measure source
    this.props.updateSketchGeometry(null);
    this.props.changeTool(this.props.defaultTool, util.getMapSourceName(this.props.targetLayer));
  }

  componentDidUpdate(prevProps) {
    // check to see if a feature was added to the mapSource
    if (
      prevProps.measureSource.features.length !== this.props.measureSource.features.length &&
      this.props.measureSource.features.length > 0
    ) {
      const features = this.props.measureSource.features;
      const feature = features[features.length - 1];
      const nextFeature = {
        ...feature,
        properties: {
          ...feature.properties,
          ...colorizeFromIndex(features.length - 1),
        },
      };
      this.props.saveFeature(this.props.targetLayer, nextFeature);
    }
  }

  /* Render a LineString Measurement.
   *
   * @param {GeoJson} geom
   * @param {Boolean} live Control whether to include the sketch geometry
   * @param {Object} properties Feature properties, if available.
   *
   * @return the table showing the log
   */
  renderSegments(geom, live, properties) {
    const cursorCoords = toLonLat(this.props.cursor.coords);
    const isDrawing = live !== false && this.props.cursor.sketchGeometry !== null;
    const segments = getSegmentInfo(geom, cursorCoords, isDrawing, this.ordinalDictionary);

    let totalLength = 0;

    const segmentHtml = [];
    for (let i = 0, ii = segments.length; i < ii; i++) {
      const seg = segments[i];
      const lineLength = util.metersLengthToUnits(seg.len, this.state.lengthUnits);
      totalLength += lineLength;

      segmentHtml.push(
        <tr key={"segment" + i}>
          <td>{seg.id}</td>
          <td className="segment-length">{lineLength.toFixed(2)}</td>
          <td className="segment-bearing" style={{ width: "100px", overflow: "hidden" }}>
            {this.props.t(seg.bearing)}
          </td>
        </tr>
      );
    }

    segmentHtml.unshift(
      <tr key="line_total">
        <td>&#931;</td>
        <td className="segment-length">{totalLength.toFixed(2)}</td>
        <td>&nbsp;</td>
      </tr>
    );

    const iconProps = {};
    if (live === false) {
      iconProps.outline = properties?.outlineColor;
      iconProps.stroke = properties?.coreColor;
    }

    return (
      <div className="gm-grid">
        <table className="measured-segments">
          <thead>
            <tr key="header">
              <th>
                <LineIcon {...iconProps} />
              </th>
              <th>
                {this.props.t("measure-segment-length")} (
                {this.props.t(`units-${this.state.lengthUnits}`)})
                <RemoveFeatureButton
                  removeFeature={this.props.removeFeature}
                  targetLayer={this.props.targetLayer}
                  properties={properties}
                />
              </th>
              <th>{this.props.t("measure-bearing", "Bearing")}</th>
            </tr>
          </thead>
          <tbody>{segmentHtml}</tbody>
        </table>
      </div>
    );
  }

  /* Render the HTML for the area of the polygon
   * being drawn.
   *
   * @param {GeoJson} geom
   *
   * @return JSX
   */
  renderArea(geom, live, properties) {
    const interimPolygons = this.props.showPolySegments ? deconstructPolygon(geom) : [];

    const formatArea = (polygon) => {
      const areaMeters = getArea(util.jsonToGeom(polygon));
      return util.metersAreaToUnits(areaMeters, this.state.areaUnits).toFixed(2);
    };

    const iconProps = {
      geometry: geom,
    };

    if (live === false) {
      iconProps.outline = properties?.outlineColor;
      iconProps.stroke = properties?.coreColor;
    }

    // trailing space in the constructed string is intentional.
    const sqLabel = hasSqLabel(this.state.areaUnits) ? `${this.props.t("measure-sq")} ` : "";

    return (
      <div className="gm-grid">
        <table className="measured-area">
          <thead>
            <tr key="header">
              <th></th>
              <th>
                {this.props.t("measure-area")} ({sqLabel}
                {this.props.t(`units-${this.state.areaUnits}`)})
                <RemoveFeatureButton
                  removeFeature={this.props.removeFeature}
                  targetLayer={this.props.targetLayer}
                  properties={properties}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <PolygonIcon {...iconProps} />
              </td>
              <td className="segment-length">{formatArea(geom)}</td>
            </tr>
            {interimPolygons &&
              interimPolygons.map((interimPolygon, idx) => (
                <tr key={`interim-${idx}`}>
                  <td>
                    <PolygonIcon geometry={interimPolygon} />
                  </td>
                  <td className="segment-length">{formatArea(interimPolygon)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderGeometry(g, live, properties) {
    if (
      g === null ||
      (g.type === "LineString" && g.coordinates.length < 2) ||
      (g.type === "Polygon" && g.coordinates[0].length < 3)
    ) {
      // swallow the measurement until the feature is ready.
      return false;
    } else if (g.type === "Point") {
      return (
        <CoordinateDisplay
          asTable
          coords={g.coordinates}
          projections={this.props.pointProjections}
          resolution={this.props.map.resolution}
        >
          <thead>
            <tr key="header">
              <th>
                <PointIcon stroke={properties?.outlineColor} fill={properties?.coreColor} />
              </th>
              <th style={{ textAlign: "right" }}>
                <RemoveFeatureButton
                  removeFeature={this.props.removeFeature}
                  targetLayer={this.props.targetLayer}
                  properties={properties}
                />
              </th>
            </tr>
          </thead>
        </CoordinateDisplay>
      );
    } else if (g.type === "LineString") {
      return this.renderSegments(
        projectFeatures([g], "EPSG:3857", "EPSG:4326")[0].geometry,
        live,
        properties
      );
    } else if (g.type === "Polygon" || g.type === "MultiPolygon") {
      // assume polygon
      return this.renderArea(g, live, properties);
    }

    return false;
  }

  renderMeasureOutput() {
    let g = this.props.cursor.sketchGeometry;

    if (g === null && this.props.map.selectionFeatures.length > 0) {
      g = normalizeGeometry(this.props.map.selectionFeatures);
    }

    const measureFeatures = this.props.measureSource.features;

    return (
      <React.Fragment>
        <div className="measure-feature">{this.renderGeometry(g)}</div>
        {measureFeatures
          .slice()
          .reverse()
          .map((feature, idx) => (
            <div key={`feature-${idx}`} className="measure-feature">
              {this.renderGeometry(feature.geometry, false, feature.properties)}
            </div>
          ))}
      </React.Fragment>
    );
  }

  changeUnits(value) {
    this.setState({ units: value });
  }

  renderUnitOptions() {
    const units = this.props.t("units");
    let measurementType = this.props.map.interactionType;
    if (measurementType === "Select") {
      if (this.props.map.selectionFeatures.length > 0) {
        measurementType = this.props.map.selectionFeatures[0].geometry.type;
      }
    }

    if (measurementType === "LineString") {
      return (
        <div className="measure-units">
          <b>{units}:</b>
          {this.props.config.lengthUnits.map((unit) => (
            <UnitOption
              key={unit}
              unit={unit}
              selected={unit === this.state.lengthUnits}
              onClick={() => {
                localStorage.setItem(LENGTH_KEY, unit);
                this.setState({ lengthUnits: unit });
              }}
            />
          ))}
        </div>
      );
    } else if (measurementType && measurementType.indexOf("Polygon") >= 0) {
      return (
        <div className="measure-units">
          <b>{units}:</b>
          {this.props.config.areaUnits.map((unit) => (
            <UnitOption
              key={unit}
              unit={unit}
              isSq={hasSqLabel(unit)}
              selected={unit === this.state.areaUnits}
              onClick={() => {
                localStorage.setItem(AREA_KEY, unit);
                this.setState({ areaUnits: unit });
              }}
            />
          ))}
        </div>
      );
    } else {
      // no options for nothing to do.
      return false;
    }
  }

  render() {
    return (
      <div className="measure-tool">
        <div
          className="info-box"
          dangerouslySetInnerHTML={{ __html: this.props.t("measure-help") }}
        />
        <div className="draw-tools">
          <DrawTool key="measure-point" geomType="Point" layer={this.props.targetLayer} />
          <DrawTool key="measure-line" geomType="LineString" layer={this.props.targetLayer} />
          <DrawTool key="measure-poly" geomType="Polygon" layer={this.props.targetLayer} />
          <DrawTool key="measure-select" geomType="Select" />
        </div>

        <div className="clear-parent">
          <button
            onClick={() => this.props.clearFeatures(util.getMapSourceName(this.props.targetLayer))}
          >
            <span className="icon clear"></span>
            {this.props.t("measure-clear", "Clear measure features")}
          </button>
        </div>

        {this.renderUnitOptions()}
        <br />
        {this.renderMeasureOutput()}
      </div>
    );
  }
}

MeasureTool.defaultProps = {
  defaultTool: "LineString",
  targetLayer: "measure/measure",
  showPolySegments: false,
};

const mapToProps = (state) => ({
  map: state.map,
  measureSource: state.mapSources.measure,
  cursor: state.cursor,
  mapProjection: "EPSG:3857",
  interactionType: state.map.interactionType,
  config: state.config.measure,
});

const mapDispatchToProps = {
  changeTool,
  clearFeatures,
  removeFeature,
  saveFeature,
  clearSelectionFeatures,
  updateSketchGeometry,
};

export default connect(mapToProps, mapDispatchToProps)(withTranslation()(MeasureTool));
