/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import { changeTool } from "../actions/map";

import { getSelectableLayers, getLayerFromSources } from "../actions/mapSource";

import { getMapSourceName, getLayerName } from "../util";

class DrawTool extends React.Component {
  constructor(props) {
    super(props);

    this.changeSelectLayer = this.changeSelectLayer.bind(this);

    this.state = {
      selectLayer: null,
    };

    if (this.props.geomType === "Select") {
      this.state.selectLayer = this.props.selectableLayers[0];
    }
  }

  changeSelectLayer(event) {
    this.setState({ selectLayer: event.target.value });
  }

  getSelectOptions() {
    const options = [];

    for (let i = 0, ii = this.props.selectableLayers.length; i < ii; i++) {
      const path = this.props.selectableLayers[i];
      const sourceName = getMapSourceName(path);
      const layerName = getLayerName(path);

      const label = getLayerFromSources(
        this.props.mapSources,
        sourceName,
        layerName
      ).label;
      options.push(
        <option key={path} value={path}>
          {label}
        </option>
      );
    }

    return options;
  }

  componentDidMount() {
    // if starting up with the select tool,
    //  ensure there is a valid active layer.
    if (
      this.props.interactionType === "Select" &&
      this.props.geomType === "Select"
    ) {
      const firstLayer = this.props.selectableLayers[0];
      this.setState({ selectLayer: firstLayer });
      this.props.onChange("Select", firstLayer);
    }
  }

  render() {
    const gtype = this.props.geomType;
    const selected = this.props.interactionType === gtype;

    let toolClass = "draw-tool";
    let selectOptions = "";

    if (selected) {
      toolClass += " selected";
    }

    const toolLabel = `draw-${gtype.toLowerCase()}-label`;
    const helperText = `draw-${gtype.toLowerCase()}-help`;

    if (gtype === "Select") {
      selectOptions = (
        <select
          value={this.state.selectLayer}
          onChange={this.changeSelectLayer}
        >
          {this.getSelectOptions()}
        </select>
      );
    }

    return (
      <div
        key={"draw-tool-" + gtype}
        className={toolClass}
        onClick={() => {
          this.props.onChange(gtype, this.state.selectLayer);
        }}
      >
        <i className="radio-icon"></i>
        {this.props.t(toolLabel)}
        {selectOptions}

        {selected && this.props.i18n.exists(helperText) && (
          <div className="helper-text info-box">{this.props.t(helperText)}</div>
        )}
      </div>
    );
  }
}

function mapState(state) {
  return {
    interactionType: state.map.interactionType,
    mapSources: state.mapSources,
    selectableLayers: getSelectableLayers(state.mapSources),
  };
}

function mapDispatch(dispatch) {
  return {
    onChange: (type, layer) => {
      dispatch(changeTool(type, layer));
    },
  };
}

export default connect(mapState, mapDispatch)(withTranslation()(DrawTool));
