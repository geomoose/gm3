/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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
import { changeTool } from "../../actions/map";

import * as util from "../../util";
import { projectFeatures } from "../../util";

import { toLonLat } from "ol/proj";

import CoordinateDisplay from "../coordinate-display";

import { getSegmentInfo, chompFloat, normalizeGeometry } from "./calc";

export class MeasureTool extends Component {
  constructor(props) {
    super(props);
    this.state = {
      units: this.props.initialUnits ? this.props.initialUnits : "ft",
    };

    // localize all of the ordinals
    this.ordinalDictionary = {};
    ["north", "east", "south", "west"].forEach((ordinal) => {
      const key = `measure-${ordinal}-abbr`;
      this.ordinalDictionary[key] = this.props.t(key);
    });
  }

  componentDidMount() {
    if (!this.props.interactionType) {
      this.props.changeTool(this.props.defaultTool);
    }
  }

  /* Render a LineString Measurement.
   *
   * @param {GeoJson} geom
   *
   * @return the table showing the log
   */
  renderSegments(geom) {
    const cursorCoords = toLonLat(this.props.cursor.coords);
    const isDrawing = this.props.cursor.sketchGeometry !== null;
    const segments = getSegmentInfo(
      geom,
      cursorCoords,
      isDrawing,
      this.ordinalDictionary
    );

    let totalLength = 0;

    const segmentHtml = [];
    for (let i = 0, ii = segments.length; i < ii; i++) {
      const seg = segments[i];
      const lineLength = chompFloat(
        util.metersLengthToUnits(seg.len, this.state.units),
        2
      );
      totalLength += lineLength;

      segmentHtml.push(
        <tr key={"segment" + i}>
          <td>{seg.id}</td>
          <td className="segment-length">{lineLength.toFixed(2)}</td>
          <td
            className="segment-bearing"
            style={{ width: "100px", overflow: "hidden" }}
          >
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

    return (
      <div className="gm-grid">
        <table className="measured-segments">
          <thead>
            <tr key="header">
              <th></th>
              <th>
                {this.props.t("measure-segment-length")} (
                {this.props.t(`units-${this.state.units}`)})
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
  renderArea(geom) {
    const areaMeters = getArea(util.jsonToGeom(geom));
    const area = util.metersAreaToUnits(areaMeters, this.state.units);
    return (
      <table className="measured-area">
        <tbody>
          <tr key="header">
            <th>
              {this.props.t("measure-area")} ({this.props.t("measure-sq")}{" "}
              {this.props.t(`units-${this.state.units}`)})
            </th>
          </tr>
          <tr>
            <td>{area.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderMeasureOutput() {
    let g = this.props.cursor.sketchGeometry;

    if (g === null && this.props.map.selectionFeatures.length > 0) {
      g = normalizeGeometry(this.props.map.selectionFeatures); // [0].geometry;
    }

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
          coords={g.coordinates}
          projections={this.props.pointProjections}
          resolution={this.props.map.resolution}
        />
      );
    } else if (g.type === "LineString") {
      return this.renderSegments(
        projectFeatures([g], "EPSG:3857", "EPSG:4326")[0].geometry
      );
    } else if (g.type === "Polygon" || g.type === "MultiPolygon") {
      // assume polygon
      return this.renderArea(g);
    }

    return false;
  }

  changeUnits(value) {
    this.setState({ units: value });
  }

  renderUnitOption(value, isSq) {
    const selected = this.state.units === value ? "selected" : "";
    return (
      <div
        key={"units-" + value}
        className={"radio-option " + selected}
        onClick={() => {
          this.changeUnits(value);
        }}
      >
        <i className="radio-icon"></i>{" "}
        {isSq ? `${this.props.t("measure-sq")} ` : ""}
        {this.props.t(`units-${value}`)}
      </div>
    );
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
          {this.renderUnitOption("m")}
          {this.renderUnitOption("km")}
          {this.renderUnitOption("ft")}
          {this.renderUnitOption("mi")}
          {this.renderUnitOption("ch")}
        </div>
      );
    } else if (measurementType && measurementType.indexOf("Polygon") >= 0) {
      return (
        <div className="measure-units">
          <b>{units}:</b>
          {this.renderUnitOption("m", true)}
          {this.renderUnitOption("km", true)}
          {this.renderUnitOption("ft", true)}
          {this.renderUnitOption("mi", true)}
          {this.renderUnitOption("a")}
          {this.renderUnitOption("h")}
        </div>
      );
    } else {
      // no options for nothing to do.
      return false;
    }
  }

  render() {
    // TODO: These events can happen when measuring is not happening!!!
    return (
      <div className="measure-tool">
        <div
          className="info-box"
          dangerouslySetInnerHTML={{ __html: this.props.t("measure-help") }}
        />
        <div className="draw-tools">
          <DrawTool key="measure-point" geomType="Point" />
          <DrawTool key="measure-line" geomType="LineString" />
          <DrawTool key="measure-poly" geomType="Polygon" />
          <DrawTool key="measure-select" geomType="Select" />
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
};

const mapToProps = (state) => ({
  map: state.map,
  cursor: state.cursor,
  mapProjection: "EPSG:3857",
  interactionType: state.map.interactionType,
});

const mapDispatchToProps = {
  changeTool,
};
export default connect(
  mapToProps,
  mapDispatchToProps
)(withTranslation()(MeasureTool));
