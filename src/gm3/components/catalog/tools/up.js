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

import { setMapSourceZIndex } from "../../../actions/mapSource";
import { getLayersByZOrder } from "../../../util";

import { Tool } from "../tools";

/* Move the layer up in the stack.
 */
export class UpTool extends React.Component {
  onClick() {
    // this is the map-source to go "up"
    const upSrc = this.props.layer.src[0];
    const layerOrder = getLayersByZOrder(
      this.props.catalog,
      this.props.mapSources
    );

    const actions = [];
    for (let i = 0, ii = layerOrder.length; i < ii; i++) {
      const layer = layerOrder[i];
      if (layer.layer.src[0].mapSourceName === upSrc.mapSourceName) {
        const swap = i + this.props.direction;
        if (swap >= 0 && swap < ii) {
          const currentZ = layer.zIndex;
          const newZ = layerOrder[swap].zIndex;
          const otherMapSource = layerOrder[swap].layer.src[0].mapSourceName;

          actions.push({ mapSourceName: upSrc.mapSourceName, z: newZ });
          actions.push({ mapSourceName: otherMapSource, z: currentZ });
        }
      }
    }

    for (let i = 0, ii = actions.length; i < ii; i++) {
      const action = actions[i];
      this.props.setZIndex(action.mapSourceName, action.z);
    }
  }

  render() {
    return (
      <Tool
        tip={this.props.tip}
        iconClass={this.props.iconClass}
        onClick={() => {
          this.onClick();
        }}
      />
    );
  }
}

UpTool.defaultProps = {
  tip: "layer-up-tip",
  iconClass: "up",
  direction: -1,
  setZIndex: function () {},
};

function mapState(state) {
  return {
    catalog: state.catalog,
    mapSources: state.mapSources,
  };
}

function mapDispatch(dispatch) {
  return {
    setZIndex: (mapSourceName, z) => {
      dispatch(setMapSourceZIndex(mapSourceName, z));
    },
  };
}

export default connect(mapState, mapDispatch)(UpTool);
